import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Image
class MockImage {
  onload: () => void;
  onerror: () => void;
  src: string;
  width: number;
  height: number;

  constructor() {
    this.onload = () => {};
    this.onerror = () => {};
    this.src = '';
    this.width = 100;
    this.height = 100;

    setTimeout(() => {
      if (this.src === 'invalid-url') {
        this.onerror();
      } else {
        if (this.src.includes('5000')) {
          this.width = 5000;
          this.height = 5000;
        } else if (this.src.includes('512')) {
          this.width = 512;
          this.height = 512;
        }
        this.onload();
      }
    }, 0);
  }
}
global.Image = MockImage as any;

// Mock Canvas API manually
HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return {
      fillStyle: '',
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn((x: number, y: number, w: number, h: number) => {
        // Return a mock ImageData object
        return {
          data: new Uint8ClampedArray(w * h * 4).map((_, i) => i % 4 === 3 ? 0 : 255), // Some transparent pixels
          width: w,
          height: h,
        };
      }),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      createPattern: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 0 })),
      transform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
  }
  return null;
}) as any;

HTMLCanvasElement.prototype.toDataURL = vi.fn(function(this: HTMLCanvasElement) {
  if (this.width === 5000) {
     return 'data:image/png;base64,mocked5000';
  }
  if (this.width === 512) {
     return 'data:image/png;base64,mocked512';
  }
  return 'data:image/png;base64,mocked';
});
