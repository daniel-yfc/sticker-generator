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
  return {
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(400 * 400 * 4),
      width: 400,
      height: 400
    })),
    putImageData: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    fillRect: vi.fn(),
    measureText: vi.fn(() => ({ width: 0, actualBoundingBoxAscent: 0, actualBoundingBoxDescent: 0 })),
    fillText: vi.fn(),
    beginPath: vi.fn(),
    roundRect: vi.fn(),
    fill: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn()
  };
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
