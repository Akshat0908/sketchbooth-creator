/**
 * PaymentProvider interface.
 *
 * Implemented by:
 *   - MockPaymentProvider  (development / VITE_PAYMENT_PROVIDER=mock)
 *   - RazorpayPaymentProvider (production / VITE_PAYMENT_PROVIDER=razorpay)
 *
 * To switch providers: change ONE LINE in PaymentService.ts.
 * Nothing else in the application needs to change.
 */

export interface PaymentDetails {
  /** Amount in the smallest currency unit (4900 = ₹49 in paise) */
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
  /** Provider-specific transaction/order reference (e.g. razorpay_payment_id) */
  paymentReference?: string;
  /**
   * If true, the server-side Edge Function has already marked payment_status = 'paid'.
   * PremiumDownload.tsx must skip its client-side updatePaymentStatus call.
   *
   * MockPaymentProvider returns false (client-side update needed).
   * RazorpayPaymentProvider returns true (server already updated the DB).
   */
  serverVerified?: boolean;
  /** Human-readable error if success is false */
  error?: string;
}

export interface PaymentProvider {
  /**
   * Initiates the full payment flow.
   * Opens the payment UI and resolves when the user completes or cancels.
   */
  startPayment(details: PaymentDetails): Promise<PaymentResult>;

  /**
   * Verifies that a payment reference is genuinely paid.
   * - MockPaymentProvider: returns true immediately (no real verification needed).
   * - RazorpayPaymentProvider: verification is performed inside startPayment
   *   via the server-side Edge Function; this method returns true if called.
   */
  verifyPayment(paymentReference: string): Promise<boolean>;
}
