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

        // Optimization: Process 4 channels (RGBA) at once using Uint32Array
        // We check for alignment to ensure we can safely use Uint32Array over the buffer
        if (data.byteOffset % 4 === 0 && data.length % 4 === 0) {
          const data32 = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
          const len = data32.length;
          const isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;

          if (isLittleEndian) {
            for (let i = 0; i < len; i++) {
              const pixel = data32[i];
              // Little Endian: 0xAABBGGRR (Alpha, Blue, Green, Red)
              if ((pixel & 0xFF) > 240 &&
                  ((pixel >> 8) & 0xFF) > 240 &&
                  ((pixel >> 16) & 0xFF) > 240) {
                data32[i] = pixel & 0x00FFFFFF; // Set Alpha to 0
              }
            }
          } else {
            for (let i = 0; i < len; i++) {
              const pixel = data32[i];
              // Big Endian: 0xRRGGBBAA (Red, Green, Blue, Alpha)
              // Use >>> for unsigned right shift to avoid sign extension
              if ((pixel >>> 24) > 240 &&
                  ((pixel >> 16) & 0xFF) > 240 &&
                  ((pixel >> 8) & 0xFF) > 240) {
                data32[i] = pixel & 0xFFFFFF00; // Set Alpha to 0
              }
            }
          }
        } else {
          // Fallback for unaligned data
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
              data[i + 3] = 0;
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
