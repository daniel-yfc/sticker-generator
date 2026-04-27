
import { useCallback, type FC, type MouseEvent } from 'react';
import { GALLERY_ITEMS } from '../constants';
import { GalleryItem, StyleTranslation } from '../types';
import { Palette, PlayCircle, DownloadCloud } from 'lucide-react';

interface GalleryProps {
  onSelectStyle: (styleId: number, imageUrl?: string) => void;
  t: (key: string) => string;
  stylesTranslation: Record<number, StyleTranslation>;
}

const Gallery: FC<GalleryProps> = ({ onSelectStyle, t, stylesTranslation }) => {
  const handleTryStyle = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const styleId = parseInt(e.currentTarget.dataset.styleid || "0", 10);
    if (styleId) {
      onSelectStyle(styleId);
    }
  }, [onSelectStyle]);

  const handleImportSample = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    const styleId = parseInt(e.currentTarget.dataset.styleid || "0", 10);
    const imageUrl = e.currentTarget.dataset.url;
    if (styleId && imageUrl) {
      onSelectStyle(styleId, imageUrl);
    }
  }, [onSelectStyle]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-4xl font-black text-gray-900 tracking-tight">{t('gallery_title')}</h2>
        <p className="text-gray-500 max-w-2xl mx-auto text-lg">{t('gallery_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {GALLERY_ITEMS.map((item: GalleryItem) => {
          const styleName = stylesTranslation[item.styleId]?.name || `Style #${item.styleId}`;
          
          return (
            <div key={item.id} className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col">
              {/* Image Container */}
              <div className="aspect-square w-full overflow-hidden bg-gray-50 transparent-grid relative">
                <img 
                  src={item.imageUrl} 
                  alt={`Sticker by ${item.author}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3 p-4">
                  <button 
                    onClick={handleTryStyle}
                    data-styleid={item.styleId}
                    className="w-full bg-white text-indigo-600 px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 shadow-xl hover:scale-105"
                  >
                    <PlayCircle className="w-5 h-5" />
                    {t('gallery_btn_try')}
                  </button>
                  <button 
                    onClick={handleImportSample}
                    data-styleid={item.styleId}
                    data-url={item.imageUrl}
                    className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 shadow-xl hover:bg-indigo-700 hover:scale-105"
                  >
                    <DownloadCloud className="w-5 h-5" />
                    {t('gallery_btn_import')}
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="p-5 mt-auto">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 mb-2 uppercase tracking-widest">
                  <Palette className="w-4 h-4" />
                  <span>{styleName}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-800">@{item.author}</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Gallery;
