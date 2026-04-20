import { useCallback, useState } from 'react';

/**
 * Shared hook for image-like uploads to the `/_dev/assets` endpoint.
 *
 * Owns file reader state (data URL, filename) and request state
 * (`uploading`, `error`). `handleFileChange` reads the selected file
 * as a data URL; `upload` POSTs it and returns the uploaded asset URL
 * (or throws on failure).
 *
 * @returns {{
 *   imageDataUrl: string | null,
 *   uploading: boolean,
 *   error: string | null,
 *   handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void,
 *   upload: () => Promise<string>,
 * }}
 */
export function useImageUpload() {
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [originalFilename, setOriginalFilename] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFilename(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImageDataUrl(ev.target.result);
    reader.readAsDataURL(file);
  }, []);

  const upload = useCallback(async () => {
    if (!imageDataUrl) throw new Error('No image selected');
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/_dev/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: imageDataUrl, filename: originalFilename }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Upload failed');
      }
      const { url } = await res.json();
      return url;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [imageDataUrl, originalFilename]);

  return { imageDataUrl, uploading, error, handleFileChange, upload };
}
