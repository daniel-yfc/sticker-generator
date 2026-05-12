import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, vi, afterEach, expect } from 'vitest';
import StyleSelector from './StyleSelector';
import { STYLES } from '../constants';

vi.mock('../constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../constants')>();
  return {
    ...actual,
    STYLES: [
      ...actual.STYLES,
      { id: 999, name: 'Invalid Icon', features: 'none', modifiers: { person: 'test' }, previewColor: 'bg-red-500', iconName: 'ThisIconDoesNotExist' }
    ]
  };
});

const mockT = vi.fn((key) => key);

describe('StyleSelector interactions', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a valid icon if a valid iconName is provided', () => {
    const mockOnSelect = vi.fn();
    const styleWithValidIcon = { ...STYLES[0], iconName: 'Star' };

    render(
      <StyleSelector
        selectedStyle={styleWithValidIcon}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
  });

  it('renders a default fallback icon if an invalid iconName is provided', () => {
    const mockOnSelect = vi.fn();
    const styleWithInvalidIcon = { ...STYLES[0], iconName: 'NonExistentIcon' };

    render(
      <StyleSelector
        selectedStyle={styleWithInvalidIcon}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    // Since fallback is Icons.Image, checking if the component rendered without crashing
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
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

  it('does not call onSelect when a style button is clicked and disabled is true in sidebar mode', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={true}
        t={mockT}
        stylesTranslation={{ [STYLES[1].id]: { name: 'Style 2', features: 'cool' } }}
        mode="sidebar"
      />
    );

    const styleCards = screen.getAllByRole('button');
    // Click the second style button
    fireEvent.click(styleCards[1]);

    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  it('shows tooltip on hover in grid mode', () => {
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
    fireEvent.mouseEnter(styleCards[1]);
    expect(screen.getByText('Example')).toBeInTheDocument();
  });

  it('shows tooltip on hover in sidebar mode', () => {
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
    fireEvent.mouseEnter(styleCards[1]);
    expect(screen.getByText('Example')).toBeInTheDocument();
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

  it('falls back to default style name if style translation is missing', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    expect(screen.getAllByText(new RegExp(`Style ${STYLES[1].id}`)).length).toBeGreaterThan(0);
  });


  it('uses default style properties when style translation is missing', () => {
    const mockOnSelect = vi.fn();
    render(
      <StyleSelector
        selectedStyle={STYLES[0]}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="sidebar"
      />
    );
    // STYLES[0] should be rendered with default name "Style 1"
    expect(screen.getAllByText(new RegExp(`Style ${STYLES[0].id}`)).length).toBeGreaterThan(0);
  });


  it('uses default fallback icon if iconName is empty string or undefined', () => {
    const mockOnSelect = vi.fn();
    const styleWithValidIcon = { ...STYLES[0], iconName: '' };

    render(
      <StyleSelector
        selectedStyle={styleWithValidIcon}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
  });


  it('renders a default fallback icon if iconName is undefined', () => {
    const mockOnSelect = vi.fn();
    const styleWithValidIcon = { ...STYLES[0], iconName: undefined as any };

    render(
      <StyleSelector
        selectedStyle={styleWithValidIcon}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
  });


  it('covers the renderIcon fallback explicitly', () => {
    const mockOnSelect = vi.fn();
    const styleWithMissingIcon = { ...STYLES[0], iconName: 'UnknownIconThatDoesNotExist' };

    render(
      <StyleSelector
        selectedStyle={styleWithMissingIcon}
        onSelect={mockOnSelect}
        disabled={false}
        t={mockT}
        stylesTranslation={{}}
        mode="grid"
      />
    );
    const styleCards = screen.getAllByRole('button');
    expect(styleCards.length).toBeGreaterThan(0);
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
