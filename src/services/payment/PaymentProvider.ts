/**
 * PaymentProvider interface.
 *
 * To add Razorpay (or any provider) later:
 *   1. Create RazorpayPaymentProvider.ts implementing this interface
 *   2. In PaymentService.ts change ONE LINE: `new MockPaymentProvider()` → `new RazorpayPaymentProvider(...)`
 *   3. Nothing else in the app needs to change.
 */

export interface PaymentDetails {
  /** Amount in the smallest currency unit (e.g. paise for INR — 49 = ₹0.49, 4900 = ₹49) */
  amount: number;
  /** ISO 4217 currency code e.g. "INR" */
  currency: string;
  /** Unique session identifier for this purchase */
  sessionId: string;
  /** Human-readable description shown in payment UI */
  description?: string;
}

export interface PaymentResult {
  success: boolean;
  /** Provider-specific transaction/order reference */
  paymentReference?: string;
  /** Human-readable error if success is false */
  error?: string;
}

export interface PaymentProvider {
  /**
   * Initiates payment flow.
   * Opens payment UI (or simulates it) and resolves when the user completes or cancels.
   */
  startPayment(details: PaymentDetails): Promise<PaymentResult>;

  /**
   * Verifies that a payment reference is genuinely paid.
   * With Razorpay this calls their verify API; with Mock it always returns true.
   */
  verifyPayment(paymentReference: string): Promise<boolean>;
}
