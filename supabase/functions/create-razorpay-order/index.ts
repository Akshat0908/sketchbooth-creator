import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // ── Parse request ──────────────────────────────────────────────────────
    const { session_id } = await req.json();

    if (!session_id || typeof session_id !== 'string') {
      return json({ error: 'session_id is required' }, 400);
    }

    // ── Initialise Supabase with service role (bypasses RLS) ───────────────
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ── Validate session ───────────────────────────────────────────────────
    const { data: session, error: sessionError } = await supabase
      .from('photo_sessions')
      .select('session_id, payment_status, razorpay_order_id')
      .eq('session_id', session_id)
      .single();

    if (sessionError || !session) {
      return json({ error: 'Session not found.' }, 404);
    }

    // ── Double-payment guard ───────────────────────────────────────────────
    if (session.payment_status === 'paid') {
      return json({ alreadyPaid: true, message: 'This session has already been paid.' }, 200);
    }

    // ── Create Razorpay Order server-side ──────────────────────────────────
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials are not configured in Edge Function secrets.');
      return json({ error: 'Payment service is not configured.' }, 500);
    }

    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const orderResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 4900,    // ₹49 in paise — ALWAYS defined server-side, NEVER from frontend
        currency: 'INR', // Always INR
        receipt: session_id.slice(0, 40), // Razorpay receipt max 40 chars
        notes: {
          session_id,
          product: 'SketchBooth Premium HD Download',
        },
      }),
    });

    if (!orderResponse.ok) {
      const errData = await orderResponse.json().catch(() => ({}));
      console.error('Razorpay order creation failed:', errData);
      return json({ error: 'Failed to create payment order. Please try again.' }, 502);
    }

    const order = await orderResponse.json();

    // ── Store Razorpay order_id in session record ──────────────────────────
    await supabase
      .from('photo_sessions')
      .update({ razorpay_order_id: order.id })
      .eq('session_id', session_id);

    // ── Return only what the frontend Razorpay Checkout needs ──────────────
    return json({
      order_id: order.id,
      amount: order.amount,      // Will always be 4900
      currency: order.currency,  // Will always be INR
      key_id: razorpayKeyId,     // Key ID is public — Key Secret never leaves this function
    }, 200);

  } catch (err) {
    console.error('[create-razorpay-order] Unhandled error:', err);
    return json({ error: 'An unexpected error occurred. Please try again.' }, 500);
  }
});

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
