import { supabase } from './supabase';

const BUCKET_NAME = 'photobooth-images';

/**
 * Uploads the rendered (preview) canvas to Supabase Storage.
 * Used before payment to create the session record.
 * Returns the public URL.
 */
export async function uploadPhotostrip(
  canvas: HTMLCanvasElement,
  sessionId: string,
): Promise<string> {
  return _uploadCanvas(canvas, sessionId, false, 0.95);
}

/**
 * Uploads the HD (3x-scale, no watermark) canvas, OVERWRITING the preview.
 * Because the path is the same, `downloadHDImage` needs no changes — it
 * fetches the same URL which now resolves to the HD blob.
 * Called AFTER successful payment.
 */
export async function uploadHDPhotostrip(
  canvas: HTMLCanvasElement,
  sessionId: string,
): Promise<string> {
  return _uploadCanvas(canvas, sessionId, true, 0.97);
}

// ── shared helper ─────────────────────────────────────────────────────────────
function _uploadCanvas(
  canvas: HTMLCanvasElement,
  sessionId: string,
  upsert: boolean,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) { reject(new Error('Failed to convert canvas to blob.')); return; }

        const filePath = `strips/${sessionId}.jpg`;

        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, { contentType: 'image/jpeg', upsert });

        if (error) { reject(error); return; }

        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        resolve(data.publicUrl);
      },
      'image/jpeg',
      quality,
    );
  });
}
