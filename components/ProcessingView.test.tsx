import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import ProcessingView from './ProcessingView';

// Mock lucide-react to avoid svg rendering issues
vi.mock('lucide-react', () => ({
  Loader2: () => <svg data-testid="loader2-icon" />,
}));

describe('ProcessingView', () => {
  const mockSteps = [
    'Step 1',
    'Step 2',
    'Step 3',
    'Step 4',
  ];

  const mockT = vi.fn((key: string) => {
    if (key === 'processing_steps') return mockSteps;
    if (key === 'processing_title') return 'Processing Title';
    return key;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders initial state correctly', () => {
    render(<ProcessingView t={mockT} />);

    expect(screen.getByText('Processing Title')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('AI 正在理解照片細節並轉換風格，請放鬆等候。')).toBeInTheDocument();
  });

  it('progresses correctly and updates the step text', () => {
    render(<ProcessingView t={mockT} />);

    // Fast-forward by 1000ms (10 intervals of 100ms)
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Expect progress to be Math.floor(10 * 0.6) = 6%. Since 10 * 0.6 = 5.999999999999999 due to floating point, Math.floor is 5.
    expect(screen.getByText('5%')).toBeInTheDocument();

    // Fast-forward to go past 20% to reach step 2
    act(() => {
      vi.advanceTimersByTime(2500);
    });

    act(() => {
      vi.advanceTimersByTime(300); // trigger stepInterval
    });

    // At >20%, the step should be index 1 ("Step 2")
    expect(screen.getByText('Step 2')).toBeInTheDocument();

    // Fast-forward to go past 50% to reach step 3
    act(() => {
      vi.advanceTimersByTime(15000); // Wait 15 seconds
    });

    act(() => {
      vi.advanceTimersByTime(300); // trigger stepInterval
    });

    // At >50%, the step should be index 2 ("Step 3")
    expect(screen.getByText('Step 3')).toBeInTheDocument();

    // Fast-forward to go past 80% to reach step 4 and check the bottom description text
    act(() => {
      vi.advanceTimersByTime(100000); // Wait a long time to make sure it surpasses 80%
    });

    act(() => {
      vi.advanceTimersByTime(300); // trigger stepInterval
    });

    expect(screen.getByText('Step 4')).toBeInTheDocument();
    expect(screen.getByText('正在渲染最終像素並應用透明遮罩...')).toBeInTheDocument();
  });

  it('progress maxes out correctly without going to 100', () => {
    render(<ProcessingView t={mockT} />);

    // Fast-forward a ridiculous amount of time to reach the last tier
    act(() => {
        vi.advanceTimersByTime(200000); // 200 seconds
    });

    const percentageNodes = screen.getAllByText(/%/);
    const progressNode = percentageNodes.find(node => /\d+%/.test(node.textContent || ''));
    expect(progressNode).toHaveTextContent('99%');
  });

  it('handles edge case when t("processing_steps") returns a string instead of an array', () => {
    const stringMockT = vi.fn((key: string) => {
      if (key === 'processing_steps') return 'Loading...';
      if (key === 'processing_title') return 'Processing Title';
      return key;
    });

    render(<ProcessingView t={stringMockT} />);

    expect(screen.getByText('Processing Title')).toBeInTheDocument();

    // When "Loading..." is returned instead of an array,
    // steps[0] resolves to the first character "L"
    expect(screen.getByText('L')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
