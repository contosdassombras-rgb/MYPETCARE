import { supabase } from './supabaseClient';

const BUCKET_NAME = 'pet-care';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload (File object or Base64 string)
 * @param path The path within the bucket (e.g., 'userId/petId/filename')
 */
export async function uploadFile(
  file: File | string,
  path: string
): Promise<string> {
  let fileBody: File | Blob;

  if (typeof file === 'string' && file.startsWith('data:')) {
    // Convert base64 to Blob
    const res = await fetch(file);
    fileBody = await res.blob();
  } else if (file instanceof File) {
    fileBody = file;
  } else {
    throw new Error('Invalid file format. Expected File or Base64 string.');
  }

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileBody, {
      upsert: true,
      cacheControl: '3600',
    });

  if (error) {
    console.error('Error uploading file:', error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Deletes a file from Supabase Storage.
 * @param path The full path within the bucket
 */
export async function deleteFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);

  if (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

/**
 * Extracts the file path from a Supabase public URL.
 */
export function getPathFromUrl(url: string): string | null {
  if (!url.includes(BUCKET_NAME)) return null;
  const parts = url.split(`${BUCKET_NAME}/`);
  return parts.length > 1 ? parts[1] : null;
}
