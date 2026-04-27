import { performance } from 'perf_hooks';

// We'll mock the JSDOM canvas fillRect call just to measure the JS loop overhead,
// but real browser performance improvement will be much higher since real fillRect
// actually modifies pixel data.

class MockCanvasContext {
  fillStyle: string | object = '';
  fillRectCalls = 0;

  fillRect(x: number, y: number, w: number, h: number) {
    this.fillRectCalls++;
  }

  createPattern(canvas: any, repeat: string) {
    return { type: 'pattern', repeat };
  }
}

const canvasWidth = 400;
const canvasHeight = 400;
const patternSize = 20;

const runBaseline = () => {
  const ctx = new MockCanvasContext();
  const start = performance.now();
  for (let k = 0; k < 1000; k++) {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    ctx.fillStyle = '#ddd';
    for (let i = 0; i < canvasWidth; i += patternSize) {
      for (let j = 0; j < canvasHeight; j += patternSize) {
        if ((i / patternSize + j / patternSize) % 2 === 0) {
          ctx.fillRect(i, j, patternSize, patternSize);
        }
      }
    }
  }
  const end = performance.now();
  return { time: end - start, calls: ctx.fillRectCalls };
};

const runOptimized = () => {
  const ctx = new MockCanvasContext();
  const patternCanvas = {}; // mock
  const pattern = ctx.createPattern(patternCanvas, 'repeat');

  const start = performance.now();
  for (let k = 0; k < 1000; k++) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  const end = performance.now();
  return { time: end - start, calls: ctx.fillRectCalls };
};

const baseline = runBaseline();
const optimized = runOptimized();

console.log(`Baseline JS loop overhead (1000 renders): ${baseline.time.toFixed(2)} ms (${baseline.calls} fillRect calls)`);
console.log(`Optimized JS loop overhead (1000 renders): ${optimized.time.toFixed(2)} ms (${optimized.calls} fillRect calls)`);
console.log(`JS execution time improvement: ${((baseline.time - optimized.time) / baseline.time * 100).toFixed(2)}%`);
