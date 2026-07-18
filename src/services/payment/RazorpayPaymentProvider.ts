import { supabase } from '@/services/supabase';
import type { PaymentProvider, PaymentDetails, PaymentResult } from './PaymentProvider';

// ── Razorpay global type declarations ─────────────────────────────────────────
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  handler: (response: RazorpaySuccessResponse) => void;
  modal: { ondismiss: () => void };
  theme?: { color?: string };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: string, handler: (response: unknown) => void): void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// ── Script loading ────────────────────────────────────────────────────────────

let scriptLoadPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoadPromise = null;
      reject(new Error('Failed to load Razorpay checkout. Please check your connection.'));
    };
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// ── RazorpayPaymentProvider ───────────────────────────────────────────────────

/**
 * RazorpayPaymentProvider — production payment provider.
 *
 * Flow:
 *   1. Call `create-razorpay-order` Edge Function → get Razorpay order
 *   2. Load Razorpay checkout.js script
 *   3. Open Razorpay Checkout popup
 *   4. On payment success → call `verify-razorpay-payment` Edge Function
 *   5. Edge Function verifies signature + amount + marks session as paid in DB
 *   6. Return { success: true, serverVerified: true, paymentReference }
 *
 * The Key Secret NEVER touches the browser.
 * Payment status is ONLY set server-side by the verify Edge Function.
 */
export class RazorpayPaymentProvider implements PaymentProvider {
  async startPayment(details: PaymentDetails): Promise<PaymentResult> {
    // ── Step 1: Create Razorpay order via secure Edge Function ────────────
    let orderData: {
      order_id: string;
      amount: number;
      currency: string;
      key_id: string;
      alreadyPaid?: boolean;
      error?: string;
    };

    try {
      const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
        body: { session_id: details.sessionId },
      });

      if (error) throw error;
      orderData = data;
    } catch (err) {
      console.error('[RazorpayProvider] Order creation failed:', err);
      return { success: false, error: 'Failed to create payment order. Please try again.' };
    }

    if (orderData.error) {
      return { success: false, error: orderData.error };
    }

    // ── Already paid guard ────────────────────────────────────────────────
    if (orderData.alreadyPaid) {
      return {
        success: true,
        serverVerified: true,
        paymentReference: 'already_paid',
      };
    }

    // ── Step 2: Load Razorpay checkout script ─────────────────────────────
    try {
      await loadRazorpayScript();
    } catch (err) {
      console.error('[RazorpayProvider] Script load failed:', err);
      return {
        success: false,
        error: 'Failed to load payment checkout. Please check your connection and try again.',
      };
    }

    // ── Step 3: Open Razorpay Checkout and wait for user action ──────────
    const checkoutResult = await this.openCheckout(orderData, details);

    return checkoutResult;
  }

  /**
   * Verification is handled inside startPayment via the server-side Edge Function.
   * This method is here to satisfy the PaymentProvider interface.
   */
  async verifyPayment(_paymentReference: string): Promise<boolean> {
    return true;
  }

  // ── Private: Open Razorpay Checkout popup ──────────────────────────────────

  private openCheckout(
    orderData: { order_id: string; amount: number; currency: string; key_id: string },
    details: PaymentDetails,
  ): Promise<PaymentResult> {
    return new Promise((resolve) => {
      const options: RazorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.order_id,
        name: 'SketchBooth',
        description: details.description ?? 'Premium HD Photobooth Strip',
        handler: async (response: RazorpaySuccessResponse) => {
          // Razorpay Checkout success callback — DO NOT trust this alone.
          // Must verify server-side before unlocking download.
          const verifyResult = await this.verifyWithServer(
            details.sessionId,
            response.razorpay_payment_id,
            response.razorpay_order_id,
            response.razorpay_signature,
          );
          resolve(verifyResult);
        },
        modal: {
          ondismiss: () => {
            resolve({
              success: false,
              error: 'Payment was cancelled. Your photo is saved — you can try again anytime.',
            });
          },
        },
        theme: { color: 'hsl(220, 20%, 20%)' },
      };

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: unknown) => {
        const r = response as { error?: { description?: string } };
        const msg = r?.error?.description ?? 'Payment failed. Please try again.';
        resolve({ success: false, error: msg });
      });

      rzp.open();
    });
  }

  // ── Private: Call verify Edge Function ────────────────────────────────────

  private async verifyWithServer(
    sessionId: string,
    razorpayPaymentId: string,
    razorpayOrderId: string,
    razorpaySignature: string,
  ): Promise<PaymentResult> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
        body: {
          session_id: sessionId,
          razorpay_payment_id: razorpayPaymentId,
          razorpay_order_id: razorpayOrderId,
          razorpay_signature: razorpaySignature,
        },
      });

      if (error) throw error;

      if (!data?.success) {
        return {
          success: false,
          error: data?.error ?? 'Payment verification failed. Please contact support.',
        };
      }

      // Server has verified the payment and updated payment_status = 'paid'
      return {
        success: true,
        serverVerified: true, // Tells PremiumDownload to skip client-side DB update
        paymentReference: razorpayPaymentId,
      };
    } catch (err) {
      console.error('[RazorpayProvider] Verification failed:', err);
      return {
        success: false,
        error: 'Payment verification failed. Please contact support with your payment ID.',
      };
    }
  }
}
