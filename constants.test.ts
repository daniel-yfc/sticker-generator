import { describe, it, expect } from 'vitest';
import { MAX_FILE_SIZE, STYLES, TRANSLATIONS, GALLERY_ITEMS } from './constants';

describe('constants', () => {
  describe('MAX_FILE_SIZE', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });

  describe('STYLES', () => {
    it('should not be empty', () => {
      expect(STYLES.length).toBeGreaterThan(0);
    });

    it('should have unique IDs', () => {
      const ids = STYLES.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have all required properties for each style', () => {
      STYLES.forEach(style => {
        expect(style.id).toBeDefined();
        expect(style.style).toBeDefined();
        expect(style.basePrompt).toBeDefined();
        expect(style.modifiers).toBeDefined();
        expect(style.modifiers.person).toBeDefined();
        expect(style.modifiers.object).toBeDefined();
        expect(style.modifiers.landscape).toBeDefined();
        expect(style.previewColor).toBeDefined();
        expect(style.iconName).toBeDefined();
      });
    });
  });

  describe('TRANSLATIONS', () => {
    const languages = ['zh-TW', 'en', 'ja'] as const;

    it('should contain all supported languages', () => {
      languages.forEach(lang => {
        expect(TRANSLATIONS[lang]).toBeDefined();
      });
    });

    it('should have consistent translation keys across languages', () => {
      const enKeys = Object.keys(TRANSLATIONS['en']).sort();
      languages.forEach(lang => {
        const langKeys = Object.keys(TRANSLATIONS[lang]).sort();
        expect(langKeys).toEqual(enKeys);
      });
    });

    it('should have translations for each style ID in STYLES', () => {
      const styleIds = STYLES.map(s => s.id);
      languages.forEach(lang => {
        const translationStyles = TRANSLATIONS[lang].styles;
        styleIds.forEach(id => {
          expect(translationStyles[id]).toBeDefined();
          expect(translationStyles[id].name).toBeDefined();
          expect(translationStyles[id].features).toBeDefined();
        });
      });
    });
  });

  describe('GALLERY_ITEMS', () => {
    it('should not be empty', () => {
      expect(GALLERY_ITEMS.length).toBeGreaterThan(0);
    });

    it('should reference valid style IDs', () => {
      const styleIds = new Set(STYLES.map(s => s.id));
      GALLERY_ITEMS.forEach(item => {
        expect(styleIds.has(item.styleId)).toBe(true);
      });
    });

    it('should have all required properties for each item', () => {
      GALLERY_ITEMS.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.imageUrl).toBeDefined();
        expect(item.styleId).toBeDefined();
        expect(item.author).toBeDefined();
      });
    });
  });
});
