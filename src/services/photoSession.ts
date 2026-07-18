import { supabase } from './supabase';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed';

export interface PhotoSession {
  id: string;
  session_id: string;
  image_url: string;
  payment_status: PaymentStatus;
  download_count: number;
  created_at: string;
  expires_at: string;
  payment_provider: string | null;
  payment_reference: string | null;
  razorpay_order_id: string | null;  // Stored by create-razorpay-order Edge Function
  paid_at: string | null;            // Set by verify-razorpay-payment Edge Function
}


/**
 * Creates a new photo session record in Supabase.
 * Sets payment_status to 'unpaid' and expires_at to 24 hours from now.
 */
export async function createPhotoSession(
  sessionId: string,
  imageUrl: string,
): Promise<PhotoSession> {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('photo_sessions')
    .insert({
      session_id: sessionId,
      image_url: imageUrl,
      payment_status: 'unpaid' as PaymentStatus,
      download_count: 0,
      expires_at: expiresAt,
      payment_provider: null,
      payment_reference: null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as PhotoSession;
}

/**
 * Updates payment status, provider, and reference for a session.
 * Called after a successful payment.
 */
export async function updatePaymentStatus(
  sessionId: string,
  status: PaymentStatus,
  paymentProvider: string,
  paymentReference: string,
): Promise<void> {
  const { error } = await supabase
    .from('photo_sessions')
    .update({
      payment_status: status,
      payment_provider: paymentProvider,
      payment_reference: paymentReference,
    })
    .eq('session_id', sessionId);

  if (error) throw error;
}

/**
 * Fetches a session by session_id.
 * Returns null if not found.
 */
export async function getPhotoSession(
  sessionId: string,
): Promise<PhotoSession | null> {
  const { data, error } = await supabase
    .from('photo_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) return null;
  return data as PhotoSession;
}

/**
 * Increments download_count for a session.
 * Uses a safe read-then-write pattern.
 */
export async function incrementDownloadCount(sessionId: string): Promise<void> {
  const { data: session } = await supabase
    .from('photo_sessions')
    .select('download_count')
    .eq('session_id', sessionId)
    .single();

  if (!session) return;

  await supabase
    .from('photo_sessions')
    .update({ download_count: (session.download_count as number) + 1 })
    .eq('session_id', sessionId);
}
