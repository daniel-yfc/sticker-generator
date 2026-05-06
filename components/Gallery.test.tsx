import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Gallery from './Gallery';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Palette: () => <svg data-testid="palette-icon" />,
  PlayCircle: () => <svg data-testid="play-circle-icon" />,
  DownloadCloud: () => <svg data-testid="download-cloud-icon" />,
}));

// Mock constants
vi.mock('../constants/gallery', () => ({
  GALLERY_ITEMS: [
    { id: '1', imageUrl: 'images/test1.png', styleId: 1, author: 'Author1' },
    { id: '2', imageUrl: 'images/test2.png', styleId: 2, author: 'Author2' },
  ],
}));

describe('Gallery', () => {
  const mockProps = {
    onSelectStyle: vi.fn(),
    t: (key: string) => key,
    stylesTranslation: {
      1: { name: 'Style One', features: 'F1' },
      2: { name: 'Style Two', features: 'F2' },
    },
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders title and subtitle', () => {
    render(<Gallery {...mockProps} />);
    expect(screen.getByText('gallery_title')).toBeInTheDocument();
    expect(screen.getByText('gallery_subtitle')).toBeInTheDocument();
  });

  it('renders gallery items correctly', () => {
    render(<Gallery {...mockProps} />);

    // Check authors
    expect(screen.getByText('@Author1')).toBeInTheDocument();
    expect(screen.getByText('@Author2')).toBeInTheDocument();

    // Check style names from translation
    expect(screen.getByText('Style One')).toBeInTheDocument();
    expect(screen.getByText('Style Two')).toBeInTheDocument();

    // Check images
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'images/test1.png');
    expect(images[1]).toHaveAttribute('src', 'images/test2.png');
  });

  it('calls onSelectStyle with styleId when "Try Style" is clicked', () => {
    render(<Gallery {...mockProps} />);

    const tryButtons = screen.getAllByText('gallery_btn_try');
    expect(tryButtons).toHaveLength(2);

    fireEvent.click(tryButtons[0]);
    expect(mockProps.onSelectStyle).toHaveBeenCalledWith(1);

    fireEvent.click(tryButtons[1]);
    expect(mockProps.onSelectStyle).toHaveBeenCalledWith(2);
  });

  it('calls onSelectStyle with styleId and imageUrl when "Import Sample" is clicked', () => {
    render(<Gallery {...mockProps} />);

    const importButtons = screen.getAllByText('gallery_btn_import');
    expect(importButtons).toHaveLength(2);

    fireEvent.click(importButtons[0]);
    expect(mockProps.onSelectStyle).toHaveBeenCalledWith(1, 'images/test1.png');

    fireEvent.click(importButtons[1]);
    expect(mockProps.onSelectStyle).toHaveBeenCalledWith(2, 'images/test2.png');
  });
});
