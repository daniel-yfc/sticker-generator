import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ResultDisplay from './ResultDisplay';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Download: () => <svg data-testid="download-icon" />,
    RefreshCcw: () => <svg data-testid="refresh-icon" />,
    Check: () => <svg data-testid="check-icon" />,
    Wand2: () => <svg data-testid="wand-icon" />,
    Repeat: () => <svg data-testid="repeat-icon" />,
}));

describe('ResultDisplay', () => {
  const mockProps = {
    imageUrl: 'data:image/png;base64,test-image',
    style: { id: 1, name: 'Test Style' } as any,
    onReset: vi.fn(),
    onReuse: vi.fn(),
    onImageUpdate: vi.fn(),
    t: (key: string) => key,
    stylesTranslation: { 1: { name: 'Test Style' } },
  };

  // Cleanup after each test to avoid multiple renders in the DOM
  afterEach(() => {
    cleanup();
  });

  it('renders correctly', () => {
    render(<ResultDisplay {...mockProps} />);
    expect(screen.getByText('result_title')).toBeInTheDocument();
    expect(screen.getByAltText('Generated Sticker')).toHaveAttribute('src', mockProps.imageUrl);
  });

  it('calls onReset when reset button is clicked', () => {
    render(<ResultDisplay {...mockProps} />);
    fireEvent.click(screen.getByText('btn_reset'));
    expect(mockProps.onReset).toHaveBeenCalled();
  });

   it('calls onReuse when reuse button is clicked', () => {
    render(<ResultDisplay {...mockProps} />);
    fireEvent.click(screen.getByText('btn_reuse'));
    expect(mockProps.onReuse).toHaveBeenCalled();
  });
});
