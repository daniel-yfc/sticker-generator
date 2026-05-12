import { renderHook, act } from '@testing-library/react';
import { useAppState } from './useAppState';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useAppState history debouncing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('debounces history save', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const { result, unmount } = renderHook(() => useAppState());

    // Initially should be called with empty array due to first render
    act(() => {
        vi.advanceTimersByTime(500);
    });

    expect(setItemSpy).toHaveBeenCalledWith('sticker_maker_history_v2', '[]');
    setItemSpy.mockClear();

    // Now update history rapidly
    act(() => {
        result.current.addToHistory([{ imageUrl: 'test1', styleId: 1 }]);
    });
    act(() => {
        result.current.addToHistory([{ imageUrl: 'test2', styleId: 1 }]);
    });

    // Before timer fires, shouldn't have been called
    expect(setItemSpy).not.toHaveBeenCalled();

    // Fast forward timer
    act(() => {
        vi.advanceTimersByTime(500);
    });

    // Should only have been called once after the updates with the combined data
    expect(setItemSpy).toHaveBeenCalledTimes(1);
    const savedData = JSON.parse(setItemSpy.mock.calls[0][1]);
    expect(savedData).toHaveLength(2);
    expect(savedData[0].imageUrl).toBe('test2');
    expect(savedData[1].imageUrl).toBe('test1');

    unmount();
  });
});
