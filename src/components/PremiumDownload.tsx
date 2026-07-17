import { useState, type RefObject } from 'react';
import { uploadPhotostrip } from '@/services/storage';
import { createPhotoSession, updatePaymentStatus } from '@/services/photoSession';
import { paymentService } from '@/services/payment/PaymentService';
import { downloadHDImage } from '@/services/download';
import type { BoothSettings } from '@/lib/booth-settings';
import PaymentModal, { type PaymentStep } from './PaymentModal';

interface PremiumDownloadProps {
  stripCanvasRef: RefObject<HTMLCanvasElement | null>;
  settings: BoothSettings;
}

const AMOUNT_PAISE = 4900; // ₹49 in paise

const PremiumDownload = ({ stripCanvasRef, settings }: PremiumDownloadProps) => {
  const [modalStep, setModalStep] = useState<PaymentStep | null>(null);
  /** Persisted after upload so we can retry the download without re-uploading */
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleUnlock = async () => {
    const canvas = stripCanvasRef.current;
    if (!canvas) return;

    // ── Step 1: Upload HD strip ────────────────────────────────────────────
    setModalStep('uploading');

    const newSessionId = crypto.randomUUID();
    let imageUrl: string;

    try {
      imageUrl = await uploadPhotostrip(canvas, newSessionId);
    } catch (err) {
      console.error('[PremiumDownload] Upload failed:', err);
      setModalStep('upload_failed');
      return;
    }

    // ── Step 2: Create DB session record ───────────────────────────────────
    try {
      await createPhotoSession(newSessionId, imageUrl);
      setSessionId(newSessionId);
    } catch (err) {
      console.error('[PremiumDownload] DB record creation failed:', err);
      setModalStep('upload_failed');
      return;
    }

    // ── Step 3: Process payment ────────────────────────────────────────────
    setModalStep('processing');

    const paymentResult = await paymentService.processPayment({
      amount: AMOUNT_PAISE,
      currency: 'INR',
      sessionId: newSessionId,
      description: 'SketchBooth HD Photostrip',
    });

    if (!paymentResult.success || !paymentResult.paymentReference) {
      setModalStep('payment_failed');
      return;
    }

    // ── Step 4: Mark session as paid in DB ────────────────────────────────
    try {
      await updatePaymentStatus(
        newSessionId,
        'paid',
        'mock', // Change to 'razorpay' when switching providers
        paymentResult.paymentReference,
      );
    } catch (err) {
      console.error('[PremiumDownload] DB update failed:', err);
      // Still attempt download — DB inconsistency should not block the user
    }

    // ── Step 5: Download ──────────────────────────────────────────────────
    setModalStep('success');

    // Brief pause so the user sees the "Payment Successful!" message
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));

    const dlResult = await downloadHDImage(newSessionId, settings.frame);
    if (!dlResult.success) {
      setModalStep('download_failed');
    } else {
      // Download started — close modal cleanly
      setModalStep(null);
    }
  };

  /** Retry download without going through payment again */
  const handleDownloadAgain = async () => {
    if (!sessionId) return;
    setModalStep('success');
    const dlResult = await downloadHDImage(sessionId, settings.frame);
    if (!dlResult.success) {
      setModalStep('download_failed');
    } else {
      setModalStep(null);
    }
  };

  const handleCloseModal = () => setModalStep(null);

  return (
    <>
      {/* ── Premium card ──────────────────────────────────────────────────── */}
      <div
        className="sketch-border bg-card rounded p-6 max-w-xs w-full flex flex-col items-center gap-4"
        style={{ boxShadow: '3px 3px 0 hsl(220 20% 20% / 0.12)' }}
      >
        {/* Header */}
        <p className="font-sketch text-xl text-foreground text-center leading-tight">
          ❤️ Keep this memory forever
        </p>

        <div className="w-full h-px" style={{ background: 'hsl(220 15% 78%)' }} />

        {/* Title */}
        <p className="font-hand text-muted-foreground text-sm text-center uppercase tracking-widest">
          Unlock Premium Download
        </p>

        {/* Feature list */}
        <ul className="w-full flex flex-col gap-1.5">
          {[
            'HD Quality',
            'No Watermark',
            'Print Ready',
            'Lifetime Download',
          ].map((feature) => (
            <li key={feature} className="font-hand text-foreground flex items-center gap-2">
              <span className="text-xs font-bold">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        {/* Price */}
        <p className="font-sketch text-3xl text-foreground">Only ₹49</p>

        {/* CTA */}
        <button
          onClick={handleUnlock}
          className="sketch-button text-base w-full"
          style={{ fontSize: '1rem' }}
        >
          Unlock HD Download ↓
        </button>
      </div>

      {/* ── Payment modal overlay ─────────────────────────────────────────── */}
      {modalStep && (
        <PaymentModal
          step={modalStep}
          onDownloadAgain={handleDownloadAgain}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default PremiumDownload;
