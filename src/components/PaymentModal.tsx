import type { FC } from 'react';

export type PaymentStep =
  | 'uploading'
  | 'processing'
  | 'success'
  | 'download_failed'
  | 'upload_failed'
  | 'payment_failed';

interface PaymentModalProps {
  step: PaymentStep;
  onDownloadAgain: () => void;
  onClose: () => void;
}

const PaymentModal: FC<PaymentModalProps> = ({ step, onDownloadAgain, onClose }) => {
  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'hsl(220 20% 20% / 0.55)', backdropFilter: 'blur(2px)' }}
    >
      {/* Modal card */}
      <div
        className="relative bg-card sketch-border rounded p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-5"
        style={{ boxShadow: '4px 4px 0 hsl(220 20% 20% / 0.15)' }}
      >

        {/* ── Uploading ─────────────────────────────────────────── */}
        {step === 'uploading' && (
          <>
            <Spinner />
            <p className="font-sketch text-2xl text-foreground text-center">
              saving your photo...
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Uploading HD strip to secure storage
            </p>
          </>
        )}

        {/* ── Processing payment ────────────────────────────────── */}
        {step === 'processing' && (
          <>
            <Spinner />
            <p className="font-sketch text-2xl text-foreground text-center">
              Processing Payment...
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Please wait, do not close this window
            </p>
          </>
        )}

        {/* ── Payment success / downloading ─────────────────────── */}
        {step === 'success' && (
          <>
            <span className="text-5xl animate-bounce">🎉</span>
            <p className="font-sketch text-2xl text-foreground text-center">
              Payment Successful!
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Preparing your download...
            </p>
          </>
        )}

        {/* ── Download failed (payment was OK, download failed) ─── */}
        {step === 'download_failed' && (
          <>
            <span className="text-4xl">📥</span>
            <p className="font-sketch text-xl text-foreground text-center">
              Download didn't start
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Your payment was successful. Click below to try again.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button onClick={onDownloadAgain} className="sketch-button text-base w-full">
                Download Again ↓
              </button>
              <button
                onClick={onClose}
                className="font-hand text-muted-foreground text-sm underline underline-offset-2 hover:text-foreground transition-colors"
              >
                dismiss
              </button>
            </div>
          </>
        )}

        {/* ── Upload failed ─────────────────────────────────────── */}
        {step === 'upload_failed' && (
          <>
            <span className="text-4xl">☁️</span>
            <p className="font-sketch text-xl text-foreground text-center">
              Unable to save your photo.
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Please try again.
            </p>
            <button onClick={onClose} className="sketch-button text-base w-full">
              try again
            </button>
          </>
        )}

        {/* ── Payment failed ────────────────────────────────────── */}
        {step === 'payment_failed' && (
          <>
            <span className="text-4xl">❌</span>
            <p className="font-sketch text-xl text-foreground text-center">
              Payment Failed
            </p>
            <p className="font-hand text-muted-foreground text-center text-sm">
              Please try again.
            </p>
            <button onClick={onClose} className="sketch-button text-base w-full">
              try again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/** Simple CSS spinner consistent with the sketch aesthetic */
const Spinner: FC = () => (
  <div
    className="w-10 h-10 rounded-full border-4"
    style={{
      borderColor: 'hsl(220 20% 20% / 0.15)',
      borderTopColor: 'hsl(220 20% 20%)',
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

export default PaymentModal;
