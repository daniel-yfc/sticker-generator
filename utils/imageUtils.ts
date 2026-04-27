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

        // Finish execution and resolve promise
        const finish = () => {
          ctx.putImageData(imageData, 0, 0);
          const newUrl = canvas.toDataURL('image/png');
          resolve(newUrl);
        };

        if (data.byteOffset % 4 === 0 && data.length % 4 === 0) {
          const data32 = new Uint32Array(data.buffer, data.byteOffset, data.length / 4);
          const len = data32.length;
          const isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;
          const CHUNK_SIZE = 250000;
          let i = 0;

          const processChunk = () => {
            const end = Math.min(i + CHUNK_SIZE, len);
            if (isLittleEndian) {
              for (; i < end; i++) {
                const pixel = data32[i];
                if ((pixel & 0xFF) > 240 && ((pixel >> 8) & 0xFF) > 240 && ((pixel >> 16) & 0xFF) > 240) {
                  data32[i] = pixel & 0x00FFFFFF;
                }
              }
            } else {
              for (; i < end; i++) {
                const pixel = data32[i];
                if ((pixel >>> 24) > 240 && ((pixel >> 16) & 0xFF) > 240 && ((pixel >> 8) & 0xFF) > 240) {
                  data32[i] = pixel & 0xFFFFFF00;
                }
              }
            }
            if (i < len) {
              setTimeout(processChunk, 0);
            } else {
              finish();
            }
          };
          processChunk();
        } else {
          const CHUNK_SIZE = 1000000;
          let i = 0;
          const processChunk = () => {
            const end = Math.min(i + CHUNK_SIZE, data.length);
            for (; i < end; i += 4) {
              if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
                data[i + 3] = 0;
              }
            }
            if (i < data.length) {
              setTimeout(processChunk, 0);
            } else {
              finish();
            }
          };
          processChunk();
        }
      } catch (error: unknown) {
        reject(error);
      }
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};
