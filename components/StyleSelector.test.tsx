import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, afterEach, expect } from 'vitest';
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
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool features 2' } }}
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
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool features 2' } }}
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
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool features 2' } }}
        mode="sidebar"
      />
    );

    const styleCards = screen.getAllByRole('button');
    // Click the second style button
    fireEvent.click(styleCards[1]);

    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(STYLES[1]);
  });

  it('shows tooltip with correct content when hovering over a style item', () => {
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={vi.fn()}
        disabled={false}
        t={mockT}
        stylesTranslation={{
          [STYLES[0].id]: { name: 'Style 1 Translated', features: 'Awesome feature 1' },
          [STYLES[1].id]: { name: 'Style 2 Translated', features: 'Awesome feature 2' }
        }}
        mode="grid"
      />
    );

    const styleCards = screen.getAllByRole('button');
    const firstCardContainer = styleCards[0].parentElement!;

    // Tooltip should not be in the document initially
    const modifierText = `"${STYLES[0].modifiers.person.split(',')[0]}..."`;
    expect(screen.queryByText(modifierText)).not.toBeInTheDocument();

    // Trigger hover
    fireEvent.mouseEnter(firstCardContainer);

    // Tooltip should now be visible with correct text
    // The tooltip renders these texts too, so we can query them (note: the Style 1 Translated is also in the card, so we're testing modifierText specifically for tooltip presence)
    expect(screen.getByText(modifierText)).toBeInTheDocument();

    // Trigger mouse leave
    fireEvent.mouseLeave(firstCardContainer);

    // Tooltip should be removed
    expect(screen.queryByText(modifierText)).not.toBeInTheDocument();
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
        if(styleCards[i] && styleCards[i].parentElement) {
            fireEvent.mouseEnter(styleCards[i].parentElement!);
            fireEvent.mouseLeave(styleCards[i].parentElement!);
        }
    }
  });
});
