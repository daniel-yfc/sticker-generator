import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FileUpload from './FileUpload';
import { MAX_FILE_SIZE } from '../constants/config';

// Mock translation function
const mockT = (key: string) => `translated_${key}`;

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly in hero mode (default)', () => {
    render(<FileUpload onFileSelect={vi.fn()} disabled={false} t={mockT} />);

    expect(screen.getByText('translated_step2_title')).toBeInTheDocument();
    expect(screen.getByText('translated_step2_drag')).toBeInTheDocument();
    expect(screen.getByText('translated_step2_hint')).toBeInTheDocument();
  });

  it('renders correctly in compact mode', () => {
    render(<FileUpload onFileSelect={vi.fn()} disabled={false} t={mockT} mode="compact" />);

    expect(screen.getByText('translated_step2_change')).toBeInTheDocument();
    expect(screen.queryByText('translated_step2_title')).not.toBeInTheDocument();
  });

  it('renders with current preview when provided in hero mode', () => {
    const mockPreview = 'data:image/png;base64,mock';
    render(<FileUpload onFileSelect={vi.fn()} disabled={false} t={mockT} currentPreview={mockPreview} onEditClick={vi.fn()} />);

    const previewImage = screen.getByAltText('Preview');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute('src', mockPreview);
    expect(screen.getByText('translated_step2_ready')).toBeInTheDocument();

    // Check if edit button is present
    expect(screen.getByTitle('translated_step2_reedit')).toBeInTheDocument();
  });

  it('calls onFileSelect with a valid file', () => {
    const mockOnFileSelect = vi.fn();
    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} disabled={false} t={mockT} />);

    // Create a mock valid file
    const file = new File(['valid file content'], 'valid.png', { type: 'image/png' });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    expect(mockOnFileSelect).toHaveBeenCalledTimes(1);
    expect(mockOnFileSelect).toHaveBeenCalledWith(file);
  });

  it('shows an alert and does not call onFileSelect when file is too large', () => {
    const mockAlert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const mockOnFileSelect = vi.fn();

    const { container } = render(<FileUpload onFileSelect={mockOnFileSelect} disabled={false} t={mockT} />);

    // Create a file larger than MAX_FILE_SIZE
    const largeFile = new File(['a'.repeat(MAX_FILE_SIZE + 10)], 'large.png', { type: 'image/png' });

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [largeFile] } });

    expect(mockAlert).toHaveBeenCalledWith('translated_error_upload: File size exceeds 10MB limit.');
    expect(mockOnFileSelect).not.toHaveBeenCalled();

    mockAlert.mockRestore();
  });

  it('disables input when disabled prop is true', () => {
    const { container } = render(<FileUpload onFileSelect={vi.fn()} disabled={true} t={mockT} />);

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDisabled();
  });
});
