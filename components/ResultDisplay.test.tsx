import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import ResultDisplay from './ResultDisplay';
import { downloadImage } from '../utils/download';
import { removeBackgroundMagicWand } from '../utils/imageUtils';

// Mock utilities
vi.mock('../utils/download', () => ({
  downloadImage: vi.fn(),
}));

vi.mock('../utils/imageUtils', () => ({
  removeBackgroundMagicWand: vi.fn(),
}));

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
    style: { id: 'style-1', name: 'Test Style' } as any,
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

  it('calls downloadImage when download button is clicked', () => {
    const mockDate = 1625097600000;
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(mockDate);

    render(<ResultDisplay {...mockProps} />);
    fireEvent.click(screen.getByText('btn_download'));

    expect(downloadImage).toHaveBeenCalledWith(
      mockProps.imageUrl,
      `sticker-pro-style-1-${mockDate}.png`
    );

    dateSpy.mockRestore();
  });

  it('calls removeBackgroundMagicWand when magic wand button is clicked', async () => {
    const mockNewUrl = 'data:image/png;base64,new-image';
    vi.mocked(removeBackgroundMagicWand).mockResolvedValue(mockNewUrl);

    render(<ResultDisplay {...mockProps} />);

    // The magic wand button is an icon button with title 'btn_magic_wand'
    const wandBtn = screen.getByTitle('btn_magic_wand');
    fireEvent.click(wandBtn);

    expect(removeBackgroundMagicWand).toHaveBeenCalledWith(mockProps.imageUrl);

    await waitFor(() => {
      expect(mockProps.onImageUpdate).toHaveBeenCalledWith(mockNewUrl);
    });
  });
});
