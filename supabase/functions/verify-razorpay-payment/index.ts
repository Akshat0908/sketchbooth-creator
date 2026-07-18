import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Parse request ──────────────────────────────────────────────────────
    const { session_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      await req.json();

    if (!session_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return json({ error: 'Missing required payment fields.' }, 400);
    }

    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials are not configured.');
      return json({ error: 'Payment service is not configured.' }, 500);
    }

    // ── Step 1: Verify Razorpay HMAC signature (server-side, timing-safe) ──
    const signatureValid = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret,
    );

    if (!signatureValid) {
      console.warn('[verify] Signature mismatch — possible tampered request');
      return json({ error: 'Payment verification failed. Invalid signature.' }, 400);
    }

    // ── Step 2: Fetch payment details from Razorpay to verify amount ────────
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpay_payment_id}`,
      { headers: { Authorization: `Basic ${auth}` } },
    );

    if (!paymentResponse.ok) {
      console.error('[verify] Failed to fetch payment from Razorpay');
      return json({ error: 'Failed to verify payment with Razorpay.' }, 502);
    }

    const payment = await paymentResponse.json();

    // ── Step 3: Validate amount, currency, and payment status ──────────────
    if (payment.amount !== 4900) {
      console.warn(`[verify] Amount mismatch: expected 4900, got ${payment.amount}`);
      return json({ error: 'Payment amount does not match expected value.' }, 400);
    }

    if (payment.currency !== 'INR') {
      console.warn(`[verify] Currency mismatch: expected INR, got ${payment.currency}`);
      return json({ error: 'Payment currency mismatch.' }, 400);
    }

    if (!['captured', 'authorized'].includes(payment.status)) {
      console.warn(`[verify] Unexpected payment status: ${payment.status}`);
      return json({ error: 'Payment has not been captured.' }, 400);
    }

    if (payment.order_id !== razorpay_order_id) {
      console.warn('[verify] Order ID mismatch');
      return json({ error: 'Payment order ID mismatch.' }, 400);
    }

    // ── Step 4: Validate session in Supabase ────────────────────────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: session, error: sessionError } = await supabase
      .from('photo_sessions')
      .select('session_id, payment_status, razorpay_order_id')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !session) {
      return json({ error: 'Session not found.' }, 404);
    }

    if (session.payment_status === 'paid') {
      // Already paid — idempotent, return success
      return json({ success: true, alreadyPaid: true }, 200);
    }

    // ── Step 5: Verify stored order_id matches the one being verified ───────
    if (session.razorpay_order_id !== razorpay_order_id) {
      console.warn('[verify] Stored order_id does not match provided order_id');
      return json({ error: 'Order ID does not match this session.' }, 400);
    }

    // ── Step 6: Mark session as PAID using service role (bypasses RLS) ──────
    const { error: updateError } = await supabase
      .from('photo_sessions')
      .update({
        payment_status: 'paid',
        payment_provider: 'razorpay',
        payment_reference: razorpay_payment_id,
        razorpay_order_id: razorpay_order_id,
        paid_at: new Date().toISOString(),
      })
      .eq('session_id', session_id);

    if (updateError) {
      console.error('[verify] Failed to update payment_status:', updateError);
      return json({ error: 'Failed to record payment. Please contact support.' }, 500);
    }

    return json({ success: true }, 200);

  } catch (err) {
    console.error('[verify-razorpay-payment] Unhandled error:', err);
    return json({ error: 'An unexpected error occurred. Please try again.' }, 500);
  }
});

/**
 * Verifies the Razorpay payment signature using HMAC-SHA256.
 * Uses timing-safe comparison to prevent timing attacks.
 *
 * Razorpay signature formula:
 *   HMAC-SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
 */
async function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const message = `${orderId}|${paymentId}`;

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));

    const computed = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // Timing-safe comparison
    if (computed.length !== signature.length) return false;
    let mismatch = 0;
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return mismatch === 0;
  } catch {
    return false;
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
