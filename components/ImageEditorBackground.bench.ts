import { bench, describe } from 'vitest';
// Vitest with JSDOM might mock canvas incompletely.
// However, memory context says:
// "When testing canvas or image functionalities in Vitest with JSDOM, manually mock HTMLCanvasElement.prototype.getContext"
// But since JSDOM canvas performance isn't representative anyway, let's write a pure JS mockup or check how vitest setup does it.

describe('ImageEditor Checkerboard Background benchmark structure', () => {
  bench('dummy', () => {
    let x = 1;
  });
});
