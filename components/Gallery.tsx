import React, { useState } from 'react';
import { GALLERY_ITEMS, STYLES, TRANSLATIONS } from '../constants';
import { GalleryItem } from '../types';

type GalleryProps = {
  onStyleSelect: (styleId: number) => void;
  t: (key: string) => string;
};

const Gallery: React.FC<GalleryProps> = ({ onStyleSelect, t }) => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const language = 'en';
  const stylesTranslation = TRANSLATIONS[language].styles;

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item === selectedItem ? null : item);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('gallery_title')}</h2>
        <p className="text-gray-600">{t('gallery_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {GALLERY_ITEMS.map((item) => {
          const style = STYLES.find(s => s.id === item.styleId);
          const styleName = style ? (stylesTranslation[style.id]?.name ?? style.style) : 'Unknown';
          const isSelected = selectedItem?.id === item.id;

          return (
            <div
              key={item.id}
              className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg scale-105'
                  : 'hover:shadow-md hover:scale-102'
              }`}
              onClick={() => handleItemClick(item)}
            >
              <div className="aspect-square bg-gray-100">
                <img
                  src={item.imageUrl}
                  alt={`${styleName} sticker by ${item.author}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-${style?.previewColor ?? 'gray'}-100 to-${style?.previewColor ?? 'gray'}-200"><span class="text-4xl">🎨</span></div>`;
                    }
                  }}
                />
              </div>

              <div className="p-2 bg-white">
                <p className="text-xs font-semibold text-gray-800 truncate">{styleName}</p>
                <p className="text-xs text-gray-400">@{item.author}</p>
              </div>

              {isSelected && (
                <div className="absolute inset-0 bg-indigo-500/10 flex items-end p-2">
                  <div className="w-full flex gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStyleSelect(item.styleId);
                      }}
                      className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      {t('gallery_btn_try')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gallery;
