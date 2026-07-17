import type {
  PaymentProvider,
  PaymentDetails,
  PaymentResult,
} from './PaymentProvider';

/**
 * MockPaymentProvider — simulates a successful payment after a 2-second delay.
 *
 * Used during development while Razorpay verification is pending.
 * Replace with RazorpayPaymentProvider by changing ONE LINE in PaymentService.ts.
 */
export class MockPaymentProvider implements PaymentProvider {
  async startPayment(details: PaymentDetails): Promise<PaymentResult> {
    // Simulate payment gateway processing time
    await new Promise<void>((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      paymentReference: `mock_${Date.now()}_${details.sessionId}`,
    };
  }

  async verifyPayment(_paymentReference: string): Promise<boolean> {
    // Mock always verifies as successful
    return true;
  }
}
