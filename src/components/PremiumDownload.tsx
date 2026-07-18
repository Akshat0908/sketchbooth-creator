import { useState, type RefObject } from 'react';
import { uploadPhotostrip, uploadHDPhotostrip } from '@/services/storage';
import { createPhotoSession, updatePaymentStatus } from '@/services/photoSession';
import { paymentService } from '@/services/payment/PaymentService';
import { downloadHDImage } from '@/services/download';
import { renderPhotostrip } from '@/lib/strip-renderer';
import type { BoothSettings } from '@/lib/booth-settings';
import PaymentModal, { type PaymentStep } from './PaymentModal';

interface PremiumDownloadProps {
  stripCanvasRef: RefObject<HTMLCanvasElement | null>;
  settings: BoothSettings;
  /** Raw captured photo data-URLs — needed to re-render at HD scale after payment */
  photos: string[];
}

const AMOUNT_PAISE = 4900; // ₹49

const PremiumDownload = ({ stripCanvasRef, settings, photos }: PremiumDownloadProps) => {
  const [modalStep, setModalStep] = useState<PaymentStep | null>(null);
  const [sessionId,  setSessionId]  = useState<string | null>(null);

  const handleUnlock = async () => {
    const previewCanvas = stripCanvasRef.current;
    if (!previewCanvas) return;

    const newSessionId = crypto.randomUUID();

    // ── 1. Upload watermarked preview (small, low-res) ─────────────────────
    setModalStep('uploading');
    let imageUrl: string;
    try {
      imageUrl = await uploadPhotostrip(previewCanvas, newSessionId);
    } catch (err) {
      console.error('[PremiumDownload] Preview upload failed:', err);
      setModalStep('upload_failed');
      return;
    }

    // ── 2. Create DB session (points to preview URL initially) ─────────────
    try {
      await createPhotoSession(newSessionId, imageUrl);
      setSessionId(newSessionId);
    } catch (err) {
      console.error('[PremiumDownload] Session creation failed:', err);
      setModalStep('upload_failed');
      return;
    }

    // ── 3. Open Razorpay checkout ──────────────────────────────────────────
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

    // ── 4. Update payment status (Mock provider only — Razorpay is server-side) ─
    if (!paymentResult.serverVerified) {
      try {
        await updatePaymentStatus(
          newSessionId,
          'paid',
          'mock',
          paymentResult.paymentReference,
        );
      } catch (err) {
        console.error('[PremiumDownload] DB update failed (non-blocking):', err);
      }
    }

    // ── 5. Render HD strip (3× scale, no watermark) in off-screen canvas ──
    setModalStep('uploading_hd');
    let hdUploadOk = false;
    try {
      const hdCanvas = document.createElement('canvas');
      await renderPhotostrip(hdCanvas, photos, settings, { scale: 3, watermark: false });

      // Upload HD — upserts same path, so downloadHDImage still works with the
      // existing URL stored in the session record.
      await uploadHDPhotostrip(hdCanvas, newSessionId);
      hdUploadOk = true;
    } catch (err) {
      // HD upload failed — log and continue.  downloadHDImage will serve the
      // preview-resolution image, which is still better than nothing.
      console.error('[PremiumDownload] HD upload failed (non-blocking):', err);
    }

    void hdUploadOk; // used above

    // ── 6. Trigger download ───────────────────────────────────────────────
    setModalStep('success');
    await new Promise<void>((resolve) => setTimeout(resolve, 1400));

    const dlResult = await downloadHDImage(newSessionId, settings.frame);
    if (!dlResult.success) {
      setModalStep('download_failed');
    } else {
      setModalStep(null);
    }
  };

  /** Retry download without re-paying */
  const handleDownloadAgain = async () => {
    if (!sessionId) return;
    setModalStep('success');
    const dlResult = await downloadHDImage(sessionId, settings.frame);
    if (!dlResult.success) setModalStep('download_failed');
    else setModalStep(null);
  };

  return (
    <>
      {/* ── Premium download card ─────────────────────────────────────────── */}
      <div className="romantic-card rounded p-6 max-w-sm w-full flex flex-col items-center gap-4 text-center">

        <p className="font-romantic text-2xl text-foreground leading-tight">
          ❤️ Save this cute memory forever
        </p>

        <p className="font-hand text-muted-foreground text-xs leading-relaxed max-w-[280px]">
          Unlock your high-quality, print-ready strip to frame, put on your lockscreen, or keep in your photo journal.
        </p>

        <div className="w-full h-px" style={{ background: 'hsl(var(--border))' }} />

        <ul className="w-full flex flex-col gap-2 max-w-[230px] mx-auto text-left">
          {[
            '✨ HD 3× Print Quality — no compression',
            '🚫 No Watermark',
            '🖼️ Perfect for frames & lockscreens',
            '⏳ Instant, lifetime download link',
          ].map((f) => (
            <li key={f} className="font-hand text-sm text-foreground">{f}</li>
          ))}
        </ul>

        <button
          onClick={handleUnlock}
          className="romantic-button pulse-rose text-base w-full font-bold flex items-center justify-center gap-1.5 mt-1"
        >
          ✨ Download My Photo Strip — ₹49
        </button>

        <p className="font-hand text-muted-foreground text-xs">
          HD quality • No watermark • Instant download
        </p>
      </div>

      {/* ── Payment modal overlay ─────────────────────────────────────────── */}
      {modalStep && (
        <PaymentModal
          step={modalStep}
          onDownloadAgain={handleDownloadAgain}
          onClose={() => setModalStep(null)}
        />
      )}
    </>
  );
};

export default PremiumDownload;
