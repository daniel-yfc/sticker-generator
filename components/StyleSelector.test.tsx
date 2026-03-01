import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockT = vi.fn((key) => key);

describe('StyleSelector performance baseline', () => {
  it('measures render time of StyleSelector', () => {
    const start = performance.now();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={() => {}}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    const end = performance.now();
    console.log(`Initial Render time: ${(end - start).toFixed(2)}ms`);

    // Simulate hover to trigger re-renders
    const styleCards = screen.getAllByRole('button');
    const hoverStart = performance.now();
    for(let i=0; i<5; i++) {
        fireEvent.mouseEnter(styleCards[i]);
        fireEvent.mouseLeave(styleCards[i]);
    }
    const hoverEnd = performance.now();
    console.log(`Hover re-render time (5 items): ${(hoverEnd - hoverStart).toFixed(2)}ms`);
  });
});
