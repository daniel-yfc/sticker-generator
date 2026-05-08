import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, afterEach } from 'vitest';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

const mockT = vi.fn((key) => key);

describe('StyleSelector interactions', () => {
  afterEach(() => {
    cleanup();
  });

  it('calls onSelect when an enabled style button is clicked in grid mode', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool' } }}
        mode="grid"
      />
    );

    const styleCards = screen.getAllByRole('button');
    // Click the second style button
    fireEvent.click(styleCards[1]);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(STYLES[1]);
  });

  it('does not call onSelect when a style button is clicked and disabled is true', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={true}
        t={mockT}
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool' } }}
        mode="grid"
      />
    );

    const styleCards = screen.getAllByRole('button');
    // Click the second style button
    fireEvent.click(styleCards[1]);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('calls onSelect when an enabled style button is clicked in sidebar mode', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool' } }}
        mode="sidebar"
      />
    );

    const styleCards = screen.getAllByRole('button');
    // Click the second style button
    fireEvent.click(styleCards[1]);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(STYLES[1]);
  });
});

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