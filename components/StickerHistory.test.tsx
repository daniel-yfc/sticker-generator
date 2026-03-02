import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import StickerHistory from './StickerHistory';
import { StickerRecord } from '../types';

describe('StickerHistory', () => {
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      history_empty: 'History Empty',
      history_title: 'History Title',
      history_subtitle: 'History Subtitle',
      btn_download: 'Download',
    };
    return translations[key] || key;
  });

  const mockStylesTranslation: any = {
    1: { name: 'Style 1' },
    2: { name: 'Style 2' },
  };

  const mockHistory: StickerRecord[] = [
    {
      id: '1',
      imageUrl: 'http://example.com/image1.png',
      styleId: 1,
      timestamp: 1672531200000, // 2023-01-01
    },
    {
      id: '2',
      imageUrl: 'http://example.com/image2.png',
      styleId: 3, // style missing from translation
      timestamp: 1672617600000, // 2023-01-02
    },
  ];

  it('renders empty state when history is empty', () => {
    render(<StickerHistory history={[]} onDelete={vi.fn()} t={mockT} stylesTranslation={mockStylesTranslation} />);
    expect(screen.getByText('History Empty')).toBeInTheDocument();
  });

  it('renders history items when history is not empty', () => {
    render(<StickerHistory history={mockHistory} onDelete={vi.fn()} t={mockT} stylesTranslation={mockStylesTranslation} />);

    expect(screen.getByText('History Title')).toBeInTheDocument();
    expect(screen.getByText('History Subtitle')).toBeInTheDocument();
    expect(screen.getByText('2 Items')).toBeInTheDocument();

    // Check images
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'http://example.com/image1.png');
    expect(images[1]).toHaveAttribute('src', 'http://example.com/image2.png');

    // Check style names
    expect(screen.getByText('Style 1')).toBeInTheDocument();
    expect(screen.getByText('Style #3')).toBeInTheDocument(); // fallback name

    // Check dates (can be locale-specific, but generally should be present)
    const date1 = new Date(mockHistory[0].timestamp).toLocaleDateString();
    const date2 = new Date(mockHistory[1].timestamp).toLocaleDateString();
    expect(screen.getByText(date1)).toBeInTheDocument();
    expect(screen.getByText(date2)).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = vi.fn();
    render(<StickerHistory history={mockHistory} onDelete={mockOnDelete} t={mockT} stylesTranslation={mockStylesTranslation} />);

    const deleteButtons = screen.getAllByTitle('Delete');
    expect(deleteButtons).toHaveLength(2);

    fireEvent.click(deleteButtons[0]);
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });

  it('renders correct download button attributes', () => {
    render(<StickerHistory history={mockHistory} onDelete={vi.fn()} t={mockT} stylesTranslation={mockStylesTranslation} />);

    const downloadButtons = screen.getAllByTitle('Download');
    expect(downloadButtons).toHaveLength(2);
    expect(downloadButtons[0]).toHaveAttribute('data-url', 'http://example.com/image1.png');
    expect(downloadButtons[0]).toHaveAttribute('data-id', '1');

    expect(downloadButtons[1]).toHaveAttribute('data-url', 'http://example.com/image2.png');
    expect(downloadButtons[1]).toHaveAttribute('data-id', '2');
  });
});
