import { getPhotoSession, incrementDownloadCount } from './photoSession';

export interface DownloadResult {
  success: boolean;
  error?: string;
}

/**
 * Downloads the HD photo strip for a session.
 *
 * Security: ALWAYS re-fetches payment_status from Supabase before downloading.
 * The download is blocked unless payment_status === 'paid'.
 */
export async function downloadHDImage(
  sessionId: string,
  frameStyle: string,
): Promise<DownloadResult> {
  // ── 1. Security gate — re-verify payment status from DB ──────────────────
  const session = await getPhotoSession(sessionId);

  if (!session) {
    return { success: false, error: 'Photo not found.' };
  }

  if (session.payment_status !== 'paid') {
    return { success: false, error: 'Payment required to download.' };
  }

  // ── 2. Fetch image and trigger browser download ───────────────────────────
  try {
    const response = await fetch(session.image_url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `sketchbooth-${frameStyle}-hd.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL after a short delay
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

    // ── 3. Increment download counter ─────────────────────────────────────
    await incrementDownloadCount(sessionId);

    return { success: true };
  } catch (err) {
    console.error('[downloadHDImage] Error:', err);
    return {
      success: false,
      error: 'Unable to save your photo. Please try again.',
    };
  }
}
