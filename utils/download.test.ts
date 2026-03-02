import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadImage } from './download';

describe('download utility', () => {
  let createElementSpy: any;
  let appendChildSpy: any;
  let removeChildSpy: any;
  let clickSpy: any;

  beforeEach(() => {
    // Create a mock anchor element
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
      style: {},
    };

    clickSpy = mockAnchor.click;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
    removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create and click download link', () => {
    const imageUrl = 'data:image/png;base64,iVBORw0KG';
    const filename = 'test-sticker.png';

    downloadImage(imageUrl, filename);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should set correct href and download attributes', () => {
    const imageUrl = 'data:image/png;base64,test';
    const filename = 'my-sticker.png';

    downloadImage(imageUrl, filename);

    const mockAnchor = createElementSpy.mock.results[0].value;
    expect(mockAnchor.href).toBe(imageUrl);
    expect(mockAnchor.download).toBe(filename);
  });

  it('should handle different filenames', () => {
    const imageUrl = 'data:image/png;base64,test';
    
    downloadImage(imageUrl, 'sticker1.png');
    let mockAnchor = createElementSpy.mock.results[0].value;
    expect(mockAnchor.download).toBe('sticker1.png');

    createElementSpy.mockClear();
    
    downloadImage(imageUrl, 'my-awesome-sticker.png');
    mockAnchor = createElementSpy.mock.results[0].value;
    expect(mockAnchor.download).toBe('my-awesome-sticker.png');
  });

  it('should clean up DOM after download', () => {
    const imageUrl = 'data:image/png;base64,test';
    const filename = 'test.png';

    downloadImage(imageUrl, filename);

    expect(removeChildSpy).toHaveBeenCalled();
    const appendedElement = appendChildSpy.mock.calls[0][0];
    const removedElement = removeChildSpy.mock.calls[0][0];
    expect(appendedElement).toBe(removedElement);
  });
});
