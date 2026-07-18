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
      style={{ background: 'hsl(var(--sketch-line) / 0.4)', backdropFilter: 'blur(3px)' }}
    >
      {/* Modal card */}
      <div
        className="relative bg-card sketch-border rounded p-8 max-w-xs w-full mx-4 flex flex-col items-center gap-5 text-center shadow-lg"
        style={{
          boxShadow: '4px 4px 0 hsl(var(--sketch-line) / 0.15)',
          border: '2px solid hsl(var(--sketch-line))'
        }}
      >

        {/* ── Saving / Uploading ─────────────────────────────────── */}
        {step === 'uploading' && (
          <>
            <Spinner />
            <p className="font-sketch text-2xl text-foreground">
              saving your memory...
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              Uploading your photostrip safely to our secure server 🤍
            </p>
          </>
        )}

        {/* ── Processing payment ────────────────────────────────── */}
        {step === 'processing' && (
          <>
            <Spinner />
            <p className="font-sketch text-2xl text-foreground">
              preparing your order...
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              Connecting with Razorpay. Please do not close this window.
            </p>
          </>
        )}

        {/* ── Payment success / downloading ─────────────────────── */}
        {step === 'success' && (
          <>
            <span className="text-5xl animate-bounce">🎉</span>
            <p className="font-romantic text-2xl text-foreground font-semibold">
              Your photobooth strip is ready!
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              Thanks for capturing this special moment with SketchBooth. 🤍
            </p>
          </>
        )}

        {/* ── Download failed (payment was OK, download failed) ─── */}
        {step === 'download_failed' && (
          <>
            <span className="text-4xl">🎁</span>
            <p className="font-sketch text-xl text-foreground">
              Download didn't start
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              Your payment was successful! Tap the button below to download your paid strip again.
            </p>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={onDownloadAgain}
                className="romantic-button pulse-rose text-base w-full font-bold"
              >
                Download Now ↓
              </button>
              <button
                onClick={onClose}
                className="font-hand text-muted-foreground text-sm underline underline-offset-2 hover:text-foreground transition-colors mt-1"
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
            <p className="font-sketch text-xl text-foreground">
              Unable to save photo
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              We couldn't upload your photo. Please check your internet connection and try again.
            </p>
            <button onClick={onClose} className="sketch-button text-base w-full mt-2">
              try again
            </button>
          </>
        )}

        {/* ── Payment failed ────────────────────────────────────── */}
        {step === 'payment_failed' && (
          <>
            <span className="text-4xl">❌</span>
            <p className="font-sketch text-xl text-foreground">
              Payment Cancelled
            </p>
            <p className="font-hand text-muted-foreground text-sm leading-relaxed">
              Your photo is safely saved. You can try unlocking it again whenever you're ready.
            </p>
            <button onClick={onClose} className="sketch-button text-base w-full mt-2">
              try again
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/** Simple CSS spinner consistent with the romantic theme */
const Spinner: FC = () => (
  <div
    className="w-10 h-10 rounded-full border-4"
    style={{
      borderColor: 'hsl(var(--rose) / 0.15)',
      borderTopColor: 'hsl(var(--rose))',
      animation: 'spin 0.8s linear infinite',
    }}
  />
);

export default PaymentModal;
