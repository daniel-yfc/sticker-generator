import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import StickerSetView from './StickerSetView';
import { downloadImage } from '../utils/download';

// Mock download utility
vi.mock('../utils/download', () => ({
  downloadImage: vi.fn(),
}));

// Mock Lucide icons
vi.mock('lucide-react', () => ({
    Download: () => <svg data-testid="download-icon" />,
    RefreshCcw: () => <svg data-testid="refresh-icon" />,
    Check: () => <svg data-testid="check-icon" />,
}));

describe('StickerSetView', () => {
  const mockProps = {
    stickers: [
      'data:image/png;base64,sticker1',
      'data:image/png;base64,sticker2',
      'data:image/png;base64,sticker3',
    ],
    style: { id: 1, name: 'Test Style', prompt: 'test' },
    onReset: vi.fn(),
    t: (key: string) => key,
    stylesTranslation: { 1: { name: 'Translated Test Style', features: 'test features' } },
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('renders correctly with given stickers', () => {
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

  it('calls downloadImage for each sticker when download all button is clicked', () => {
    vi.useFakeTimers();
    render(<StickerSetView {...mockProps} />);

    // There are multiple "btn_download" texts: one on the main button and one on each individual sticker title attribute.
    // The main button has the text 'btn_download' inside it.
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
      expect.stringContaining('sticker-pro-set-1-0-')
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      2,
      'data:image/png;base64,sticker2',
      expect.stringContaining('sticker-pro-set-1-1-')
    );
    expect(downloadImage).toHaveBeenNthCalledWith(
      3,
      'data:image/png;base64,sticker3',
      expect.stringContaining('sticker-pro-set-1-2-')
    );
  });

  it('calls downloadImage for a single sticker when an individual download button is clicked', () => {
    render(<StickerSetView {...mockProps} />);

    // The individual download buttons have title="btn_download"
    const individualDownloadButtons = screen.getAllByTitle('btn_download');
    expect(individualDownloadButtons).toHaveLength(3);

    fireEvent.click(individualDownloadButtons[1]); // Click second sticker's download

    expect(downloadImage).toHaveBeenCalledTimes(1);
    expect(downloadImage).toHaveBeenCalledWith(
      'data:image/png;base64,sticker2',
      'sticker-variation-1.png'
    );
  });
});
