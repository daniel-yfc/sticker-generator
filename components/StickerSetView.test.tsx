import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StickerSetView from './StickerSetView';
import { downloadImage } from '../utils/download';

vi.mock('../utils/download', () => ({
  downloadImage: vi.fn(),
}));

vi.mock('lucide-react', () => ({
  Download: () => <svg data-testid="download-icon" />,
  RefreshCcw: () => <svg data-testid="refresh-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  AlertTriangle: () => <svg data-testid="alert-icon" />,
  Loader2: () => <svg data-testid="loader-icon" />,
  RotateCcw: () => <svg data-testid="rotate-icon" />,
}));

describe('StickerSetView', () => {
  const mockProps = {
    tiles: [
      { variationId: 'thumbs_up', status: 'done' as const, imageUrl: 'data:image/png;base64,sticker1', retryable: false },
      { variationId: 'laughing',  status: 'done' as const, imageUrl: 'data:image/png;base64,sticker2', retryable: false },
      { variationId: 'surprised', status: 'done' as const, imageUrl: 'data:image/png;base64,sticker3', retryable: false },
    ],
    style: {
      id: 1,
      style: 'Test Style',
      basePrompt: 'test',
      modifiers: { person: '', object: '', landscape: '' },
      previewColor: '',
      iconName: '',
    },
    onReset: vi.fn(),
    onRetryTile: vi.fn(),
    t: (key: string) => key,
    stylesTranslation: { 1: { name: 'Translated Test Style', features: 'test features' } },
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders correctly with given tiles', () => {
    render(<StickerSetView {...mockProps} />);

    expect(screen.getByText('set_title')).toBeInTheDocument();
    expect(screen.getByText('set_desc')).toBeInTheDocument();
    expect(screen.getByText(/Translated Test Style/)).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('src', 'data:image/png;base64,sticker1');
    expect(images[1]).toHaveAttribute('src', 'data:image/png;base64,sticker2');
    expect(images[2]).toHaveAttribute('src', 'data:image/png;base64,sticker3');
  });

  it('calls onReset when reset button is clicked', () => {
    render(<StickerSetView {...mockProps} />);
    fireEvent.click(screen.getByText('btn_reset'));
    expect(mockProps.onReset).toHaveBeenCalledTimes(1);
  });

  it('calls downloadImage for each tile when download all button is clicked', () => {
    vi.useFakeTimers();
    render(<StickerSetView {...mockProps} />);

    const downloadAllButton = screen.getAllByText('btn_download').find(el => el.tagName.toLowerCase() === 'button');
    if (!downloadAllButton) {
      throw new Error('Download all button not found');
    }

    fireEvent.click(downloadAllButton);
    vi.runAllTimers();

    expect(downloadImage).toHaveBeenCalledTimes(3);
    expect(downloadImage).toHaveBeenNthCalledWith(
      1,
      'data:image/png;base64,sticker1',
      expect.stringContaining('sticker-pro-set-1-thumbs_up-')
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      2,
      'data:image/png;base64,sticker2',
      expect.stringContaining('sticker-pro-set-1-laughing-')
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      3,
      'data:image/png;base64,sticker3',
      expect.stringContaining('sticker-pro-set-1-surprised-')
    );
  });

  it('calls downloadImage for a single tile when an individual download button is clicked', () => {
    render(<StickerSetView {...mockProps} />);

    const individualDownloadButtons = screen.getAllByTitle('btn_download');
    expect(individualDownloadButtons).toHaveLength(3);

    fireEvent.click(individualDownloadButtons[1]);

    expect(downloadImage).toHaveBeenCalledTimes(1);
    expect(downloadImage).toHaveBeenCalledWith(
      'data:image/png;base64,sticker2',
      'sticker-variation-laughing.png'
    );
  });
});
