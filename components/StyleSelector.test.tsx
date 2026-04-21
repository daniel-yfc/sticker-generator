import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockT = vi.fn((key) => key);

describe('StyleSelector performance baseline', () => {
  afterEach(() => {
    cleanup();
  });

  it('measures render time of StyleSelector', () => {
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

    // Simulate hover to trigger re-renders
    const styleCards = screen.getAllByRole('button');
    for(let i=0; i<5; i++) {
        fireEvent.mouseEnter(styleCards[i]);
        fireEvent.mouseLeave(styleCards[i]);
    }
  });
});