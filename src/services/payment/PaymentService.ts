import type { PaymentDetails, PaymentResult } from './PaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';
import { RazorpayPaymentProvider } from './RazorpayPaymentProvider';

// ─────────────────────────────────────────────────────────────────────────────
// Provider selection via environment variable:
//
//   Development (.env.local):  VITE_PAYMENT_PROVIDER=mock
//   Production  (Vercel):      VITE_PAYMENT_PROVIDER=razorpay
//
// Defaults to 'razorpay' if the variable is missing or unrecognised,
// so production is always safe even if the env var is accidentally omitted.
// ─────────────────────────────────────────────────────────────────────────────

const providerName = import.meta.env.VITE_PAYMENT_PROVIDER ?? 'razorpay';

function buildProvider() {
  if (providerName === 'mock') {
    console.info('[PaymentService] Using MockPaymentProvider (development mode)');
    return new MockPaymentProvider();
  }

  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error(
      'VITE_RAZORPAY_KEY_ID is not set. ' +
        'Add it to .env.local for development or to Vercel env vars for production.',
    );
  }

  console.info('[PaymentService] Using RazorpayPaymentProvider (production mode)');
  return new RazorpayPaymentProvider();
}

const activeProvider = buildProvider();

/**
 * PaymentService orchestrates the full payment flow.
 * Consumers interact only with this service — never the provider directly.
 */
export class PaymentService {
  async processPayment(details: PaymentDetails): Promise<PaymentResult> {
    let result: PaymentResult;

    try {
      result = await activeProvider.startPayment(details);
    } catch {
      return { success: false, error: 'Payment failed. Please try again.' };
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error ?? 'Payment failed. Please try again.',
      };
    }

    // If the provider handled server-side verification (Razorpay Edge Function),
    // skip the redundant client-side verifyPayment call.
    if (result.serverVerified) {
      return result;
    }

    // For MockPaymentProvider: do client-side verification (always returns true).
    try {
      const verified = await activeProvider.verifyPayment(result.paymentReference ?? '');
      if (!verified) {
        return { success: false, error: 'Payment verification failed. Please try again.' };
      }
    } catch {
      return { success: false, error: 'Payment verification failed. Please try again.' };
    }

    return result;
  }
}

export const paymentService = new PaymentService();
