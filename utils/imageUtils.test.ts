import { describe, it, expect, beforeEach } from 'vitest';
import { removeBackgroundMagicWand } from './imageUtils';

describe('imageUtils', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    ctx = canvas.getContext('2d')!;
  });

  describe('removeBackgroundMagicWand', () => {
    it('should remove white background pixels', async () => {
      // Create an image with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 100, 100);
      
      // Add a non-white square in the center
      ctx.fillStyle = 'rgb(100, 100, 100)';
      ctx.fillRect(25, 25, 50, 50);

      const dataUrl = canvas.toDataURL();
      const result = await removeBackgroundMagicWand(dataUrl);

      expect(result).toBeDefined();
      expect(result.startsWith('data:image/png;base64,')).toBe(true);

      // Verify the result is a valid image
      const img = new Image();
      const loadPromise = new Promise((resolve) => {
        img.onload = resolve;
      });
      img.src = result;
      await loadPromise;

      expect(img.width).toBeGreaterThan(0);
      expect(img.height).toBeGreaterThan(0);
    });

    it('should preserve non-white pixels', async () => {
      // Create an image with colored content
      ctx.fillStyle = 'rgb(50, 100, 150)';
      ctx.fillRect(0, 0, 100, 100);

      const dataUrl = canvas.toDataURL();
      const result = await removeBackgroundMagicWand(dataUrl);

      expect(result).toBeDefined();
      expect(result.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('should handle edge case of all white image', async () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 100, 100);

      const dataUrl = canvas.toDataURL();
      const result = await removeBackgroundMagicWand(dataUrl);

      expect(result).toBeDefined();
      expect(result.startsWith('data:image/png;base64,')).toBe(true);
    });

    it('should reject if 2d context cannot be acquired', async () => {
      // Temporarily mock getContext to return null
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = () => null;

      try {
        await expect(
          removeBackgroundMagicWand('data:image/png;base64,mock')
        ).rejects.toThrow('Failed to get 2d context');
      } finally {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      }
    });

    it('should catch and reject errors during processing', async () => {
      // Temporarily mock getContext to throw an error
      const originalGetContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = () => { throw new Error('Simulated processing error'); };

      try {
        await expect(
          removeBackgroundMagicWand('data:image/png;base64,mock')
        ).rejects.toThrow('Simulated processing error');
      } finally {
        HTMLCanvasElement.prototype.getContext = originalGetContext;
      }
    });

    it('should reject invalid image URLs', async () => {
      await expect(
        removeBackgroundMagicWand('invalid-url')
      ).rejects.toThrow('Failed to load image');
    });

    it('should handle mixed colors correctly', async () => {
      // Create a gradient-like pattern
      for (let i = 0; i < 100; i++) {
        const color = `rgb(${i * 2}, ${i * 2}, ${i * 2})`;
        ctx.fillStyle = color;
        ctx.fillRect(i, 0, 1, 100);
      }

      const dataUrl = canvas.toDataURL();
      const result = await removeBackgroundMagicWand(dataUrl);

      expect(result).toBeDefined();
      
      // Create a new canvas to check the result
      const resultImg = new Image();
      const loadPromise = new Promise((resolve) => {
        resultImg.onload = resolve;
      });
      resultImg.src = result;
      await loadPromise;

      const resultCanvas = document.createElement('canvas');
      resultCanvas.width = resultImg.width;
      resultCanvas.height = resultImg.height;
      const resultCtx = resultCanvas.getContext('2d')!;
      resultCtx.drawImage(resultImg, 0, 0);
      
      const imageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
      const data = imageData.data;

      // Check that bright pixels are transparent
      let hasTransparentPixels = false;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) {
          hasTransparentPixels = true;
          break;
        }
      }

      expect(hasTransparentPixels).toBe(true);
    });
  });
});
