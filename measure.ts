import { performance } from 'perf_hooks';

// Simulate history setup
interface StickerRecord {
  id: string;
  imageUrl: string;
  styleId: number;
  timestamp: number;
}

const generateHistory = (count: number): StickerRecord[] => {
  const history: StickerRecord[] = [];
  for (let i = 0; i < count; i++) {
    history.push({
      id: `id-${i}`,
      imageUrl: `url-${i}`,
      styleId: i % 10,
      timestamp: Date.now()
    });
  }
  return history;
};

const N = 50000;
const history = generateHistory(N);
const targetId = `id-${Math.floor(N / 2)}`;

// Optimized implementation - using findIndex and splice
const deleteFromHistoryV2 = (id: string, currentHistory: StickerRecord[]) => {
  const index = currentHistory.findIndex(item => item.id === id);
  if (index !== -1) {
    const newHistory = [...currentHistory];
    newHistory.splice(index, 1);
    return newHistory;
  }
  return currentHistory;
};

// Benchmark optimized
const start2 = performance.now();
for (let i = 0; i < 1000; i++) {
  deleteFromHistoryV2(targetId, history);
}
const end2 = performance.now();
console.log(`Optimized implementation (findIndex + splice): ${end2 - start2} ms`);
