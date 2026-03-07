export const removeBackgroundMagicWand = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2d context'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple logic: Assume corners are background. Make white/light pixels transparent if they are connected to corners?
        // For stickers, usually the background is white. Let's make pure white transparent.
        // A robust flood fill is better, but expensive. Let's try color keying near white.

        // Optimization: Use Uint32Array for faster iteration
        const data32 = new Uint32Array(data.buffer);
        const isLittleEndian = new Uint8Array(new Uint32Array([0x11223344]).buffer)[0] === 0x44;

        if (isLittleEndian) {
          for (let i = 0; i < data32.length; i++) {
            const pixel = data32[i];
            const r = pixel & 0xFF;
            const g = (pixel >> 8) & 0xFF;
            const b = (pixel >> 16) & 0xFF;

            // Check for white/near-white
            if (r > 240 && g > 240 && b > 240) {
              data32[i] = pixel & 0x00FFFFFF; // Alpha 0 (top byte to 00)
            }
          }
        } else {
          for (let i = 0; i < data32.length; i++) {
            const pixel = data32[i];
            const r = (pixel >>> 24) & 0xFF;
            const g = (pixel >>> 16) & 0xFF;
            const b = (pixel >>> 8) & 0xFF;

            // Check for white/near-white
            if (r > 240 && g > 240 && b > 240) {
              data32[i] = pixel & 0xFFFFFF00; // Alpha 0 (bottom byte to 00)
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const newUrl = canvas.toDataURL('image/png');
        resolve(newUrl);
      } catch (error: unknown) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};
