import type { PaymentDetails, PaymentResult } from './PaymentProvider';
import { MockPaymentProvider } from './MockPaymentProvider';

// ─────────────────────────────────────────────────────────────────────────────
// 🔌 PROVIDER SWAP — change only this ONE LINE to switch payment providers:
//
//   Current (development):  new MockPaymentProvider()
//   Future  (production):   new RazorpayPaymentProvider({ keyId: '...', ... })
//
// Nothing else in the application needs to change.
// ─────────────────────────────────────────────────────────────────────────────
const activeProvider = new MockPaymentProvider();

/**
 * PaymentService orchestrates the full payment flow:
 *   startPayment → verifyPayment → return result
 *
 * Consumers only interact with this service; they never touch the provider directly.
 */
export class PaymentService {
  /**
   * Processes a payment end-to-end.
   * On success, returns { success: true, paymentReference }.
   * On failure, returns { success: false, error }.
   */
  async processPayment(details: PaymentDetails): Promise<PaymentResult> {
    let result: PaymentResult;

    try {
      result = await activeProvider.startPayment(details);
    } catch {
      return { success: false, error: 'Payment failed. Please try again.' };
    }

    if (!result.success || !result.paymentReference) {
      return {
        success: false,
        error: result.error ?? 'Payment failed. Please try again.',
      };
    }

    try {
      const verified = await activeProvider.verifyPayment(result.paymentReference);
      if (!verified) {
        return { success: false, error: 'Payment verification failed. Please try again.' };
      }
    } catch {
      return { success: false, error: 'Payment verification failed. Please try again.' };
    }

    return result;
  }
}

/** Singleton instance — import this throughout the app */
export const paymentService = new PaymentService();
