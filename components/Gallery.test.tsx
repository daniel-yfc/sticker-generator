import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Gallery from './Gallery';
import { GALLERY_ITEMS } from '../constants';

describe('Gallery', () => {
  const mockOnSelectStyle = vi.fn();
  const mockT = vi.fn((key: string) => {
    const translations: Record<string, string> = {
      gallery_title: 'Gallery Title',
      gallery_subtitle: 'Gallery Subtitle',
      gallery_btn_try: 'Try Style',
      gallery_btn_import: 'Import Sample',
    };
    return translations[key] || key;
  });

  const mockStylesTranslation: any = {
    1: { name: 'Style 1' },
    2: { name: 'Style 2' },
  };

  const defaultProps = {
    onSelectStyle: mockOnSelectStyle,
    t: mockT,
    stylesTranslation: mockStylesTranslation,
  };

  it('renders gallery title and subtitle', () => {
    render(<Gallery {...defaultProps} />);
    expect(screen.getByText('Gallery Title')).toBeInTheDocument();
    expect(screen.getByText('Gallery Subtitle')).toBeInTheDocument();
  });

  it('renders all gallery items', () => {
    render(<Gallery {...defaultProps} />);
    const items = screen.getAllByRole('img');
    expect(items).toHaveLength(GALLERY_ITEMS.length);
  });

  it('calls onSelectStyle when "Try Style" button is clicked', () => {
    render(<Gallery {...defaultProps} />);

    // Gallery items have buttons that appear on hover.
    // In JSDOM, we can just find them.
    const tryButtons = screen.getAllByText('Try Style');
    fireEvent.click(tryButtons[0]);

    const firstItem = GALLERY_ITEMS[0];
    expect(mockOnSelectStyle).toHaveBeenCalledWith(firstItem.styleId);
  });

  it('calls onSelectStyle with image URL when "Import Sample" button is clicked', () => {
    render(<Gallery {...defaultProps} />);

    const importButtons = screen.getAllByText('Import Sample');
    fireEvent.click(importButtons[0]);

    const firstItem = GALLERY_ITEMS[0];
    expect(mockOnSelectStyle).toHaveBeenCalledWith(firstItem.styleId, firstItem.imageUrl);
  });

  it('renders fallback style name when translation is missing', () => {
    render(<Gallery {...defaultProps} />);

    // Find an item with a styleId not in mockStylesTranslation
    const itemWithMissingStyle = GALLERY_ITEMS.find(item => !mockStylesTranslation[item.styleId]);
    if (itemWithMissingStyle) {
      expect(screen.getByText(`Style #${itemWithMissingStyle.styleId}`)).toBeInTheDocument();
    }
  });
});
