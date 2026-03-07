import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ImageEditor from './ImageEditor';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  RotateCw: () => <svg data-testid="rotate-icon" />,
  ZoomIn: () => <svg data-testid="zoom-icon" />,
  Move: () => <svg data-testid="move-icon" />,
  Check: () => <svg data-testid="check-icon" />,
  X: () => <svg data-testid="x-icon" />,
}));

describe('ImageEditor', () => {
  const mockProps = {
    imageSrc: 'data:image/png;base64,test-image',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    t: (key: string) => key,
  };

  const OriginalImage = window.Image;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup basic mocks for canvas that might be needed
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      save: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      stroke: vi.fn(),
      setLineDash: vi.fn(),
    } as any);

    HTMLCanvasElement.prototype.toDataURL = vi.fn().mockReturnValue('data:image/png;base64,mocked-data-url');
  });

  afterEach(() => {
    cleanup();
    window.Image = OriginalImage;
  });

  it('renders correctly with title and controls', () => {
    render(<ImageEditor {...mockProps} />);
    expect(screen.getByText('editor_title')).toBeInTheDocument();
    expect(screen.getByText('editor_zoom')).toBeInTheDocument();
    expect(screen.getByText('editor_rotate')).toBeInTheDocument();
    expect(screen.getByText('editor_btn_confirm')).toBeInTheDocument();
  });

  it('calls onCancel when close button is clicked', () => {
    render(<ImageEditor {...mockProps} />);
    const closeButtons = screen.getAllByRole('button');
    // First button is the close button in the header
    const closeBtn = closeButtons[0];
    fireEvent.click(closeBtn);
    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('updates scale when zoom slider is changed', () => {
    render(<ImageEditor {...mockProps} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '2' } });
    expect((slider as HTMLInputElement).value).toBe('2');
  });

  it('calls onConfirm with image data when confirm button is clicked', () => {
    render(<ImageEditor {...mockProps} />);
    const confirmBtn = screen.getByText('editor_btn_confirm');
    fireEvent.click(confirmBtn);
    expect(mockProps.onConfirm).toHaveBeenCalledWith('data:image/png;base64,mocked-data-url');
  });

  it('handles image loading', () => {
    class MockImage {
      src = '';
      onload: (() => void) | null = null;
      width = 100;
      height = 100;

      constructor() {
        setTimeout(() => {
            if (this.onload) this.onload();
        }, 0);
      }
    }

    window.Image = MockImage as any;

    render(<ImageEditor {...mockProps} />);
  });

  it('handles rotation button click', () => {
    render(<ImageEditor {...mockProps} />);
    const rotateBtn = screen.getByText('editor_rotate');
    fireEvent.click(rotateBtn);
    // Button click should not throw
  });

  it('handles mouse drag events on canvas', () => {
    render(<ImageEditor {...mockProps} />);
    // Wait for canvas to be present
    const canvas = document.querySelector('canvas');

    if (canvas) {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseUp(canvas);
      fireEvent.mouseLeave(canvas);
    }
  });

  it('handles touch drag events on canvas', () => {
    render(<ImageEditor {...mockProps} />);
    const canvas = document.querySelector('canvas');

    if (canvas) {
      fireEvent.touchStart(canvas, { touches: [{ clientX: 100, clientY: 100 }] });
      fireEvent.touchMove(canvas, { touches: [{ clientX: 150, clientY: 150 }] });
      fireEvent.touchEnd(canvas);
    }
  });
});
