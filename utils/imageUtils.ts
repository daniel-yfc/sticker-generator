export const applyMagicWand = (imageUrl: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error("Failed to get 2d context"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Simple logic: Assume corners are background. Make white/light pixels transparent if they are connected to corners?
      // For stickers, usually the background is white. Let's make pure white transparent.
      // A robust flood fill is better, but expensive. Let's try color keying near white.

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check for white/near-white
        if (r > 240 && g > 240 && b > 240) {
          data[i + 3] = 0; // Alpha 0
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const newUrl = canvas.toDataURL('image/png');
      resolve(newUrl);
    };
    img.onerror = () => reject(new Error("Failed to load image for magic wand processing"));
  });
};
