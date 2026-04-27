import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Header from './Header';

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <svg data-testid="sparkles-icon" />,
  Sticker: () => <svg data-testid="sticker-icon" />,
  Globe: () => <svg data-testid="globe-icon" />,
}));

describe('Header', () => {
  const mockProps = {
    currentView: 'create' as const,
    onViewChange: vi.fn(),
    currentLang: 'en' as const,
    onLangChange: vi.fn(),
    t: (key: string) => key,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('header_title')).toBeInTheDocument();
    expect(screen.getByText('header_subtitle')).toBeInTheDocument();
    expect(screen.getByText('nav_create')).toBeInTheDocument();
    expect(screen.getByText('nav_history')).toBeInTheDocument();
    expect(screen.getByText('nav_gallery')).toBeInTheDocument();
    expect(screen.getByTestId('sparkles-icon')).toBeInTheDocument();
    expect(screen.getByTestId('sticker-icon')).toBeInTheDocument();
    expect(screen.getByTestId('globe-icon')).toBeInTheDocument();
  });

  it('applies active styling to the current view navigation item', () => {
    render(<Header {...mockProps} />);
    const createBtn = screen.getByText('nav_create');
    const historyBtn = screen.getByText('nav_history');

    expect(createBtn).toHaveClass('bg-white');
    expect(createBtn).toHaveClass('text-indigo-600');
    expect(historyBtn).toHaveClass('text-gray-500');
  });

  it('calls onViewChange when logo is clicked', () => {
    render(<Header {...mockProps} />);
    // The logo area has the title, click it
    fireEvent.click(screen.getByText('header_title'));
    expect(mockProps.onViewChange).toHaveBeenCalledWith('create');
  });

  it('calls onViewChange when navigation items are clicked', () => {
    render(<Header {...mockProps} />);

    fireEvent.click(screen.getByText('nav_history'));
    expect(mockProps.onViewChange).toHaveBeenCalledWith('history');

    fireEvent.click(screen.getByText('nav_gallery'));
    expect(mockProps.onViewChange).toHaveBeenCalledWith('gallery');
  });

  it('calls onLangChange when language is changed', () => {
    render(<Header {...mockProps} />);

    // Check current language is rendered
    expect(screen.getByText('en')).toBeInTheDocument();

    // Click language options
    fireEvent.click(screen.getByText('繁體中文'));
    expect(mockProps.onLangChange).toHaveBeenCalledWith('zh-TW');

    fireEvent.click(screen.getByText('日本語'));
    expect(mockProps.onLangChange).toHaveBeenCalledWith('ja');

    fireEvent.click(screen.getByText('English'));
    expect(mockProps.onLangChange).toHaveBeenCalledWith('en');
  });
});
