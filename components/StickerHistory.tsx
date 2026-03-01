import React, { useCallback } from 'react';
import { StickerRecord, StyleTranslation } from '../types';
import { Download, Trash2, Clock } from 'lucide-react';
import { downloadImage } from '../utils/download';

interface StickerHistoryProps {
  history: StickerRecord[];
  onDelete: (id: string) => void;
  t: (key: string) => string;
  stylesTranslation: Record<number, StyleTranslation>;
}

const StickerHistory: React.FC<StickerHistoryProps> = ({ history, onDelete, t, stylesTranslation }) => {
  const handleDelete = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const id = e.currentTarget.dataset.id;
    if (id) {
      onDelete(id);
    }
  }, [onDelete]);

  const handleDownload = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const url = e.currentTarget.dataset.url;
    const id = e.currentTarget.dataset.id;
    if (url && id) {
      downloadImage(url, `sticker-${id}.png`);
    }
  }, []);

  if (history.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{t('history_empty')}</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('history_title')}</h2>
          <p className="text-sm text-gray-500">{t('history_subtitle')}</p>
        </div>
        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          {history.length} Items
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {history.map((item) => {
          const styleName = stylesTranslation[item.styleId]?.name || `Style #${item.styleId}`;
          const date = new Date(item.timestamp).toLocaleDateString();

          return (
            <div key={item.id} className="group relative bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
              <div className="aspect-square bg-gray-100 transparent-grid p-4 relative">
                 <img 
                   src={item.imageUrl} 
                   alt="Sticker" 
                   className="w-full h-full object-contain drop-shadow-sm transition-transform group-hover:scale-105" 
                   loading="lazy"
                 />
                 
                 {/* Actions Overlay */}
                 <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={handleDownload}
                      data-id={item.id}
                      data-url={item.imageUrl}
                      className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                      title={t('btn_download')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={handleDelete}
                      data-id={item.id}
                      className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
              
              <div className="p-3">
                <p className="text-xs font-bold text-gray-800 truncate">{styleName}</p>
                <p className="text-[10px] text-gray-400">{date}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StickerHistory;
