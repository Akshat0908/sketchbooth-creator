import { supabase } from './supabase';

const BUCKET_NAME = 'photobooth-images';

/**
 * Uploads the rendered canvas photostrip to Supabase Storage.
 * Returns the public URL of the uploaded image.
 * Throws if the upload fails.
 */
export async function uploadPhotostrip(
  canvas: HTMLCanvasElement,
  sessionId: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to convert canvas to image blob.'));
          return;
        }

        const filePath = `strips/${sessionId}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          reject(uploadError);
          return;
        }

        const { data } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

        resolve(data.publicUrl);
      },
      'image/jpeg',
      0.95,
    );
  });
}
