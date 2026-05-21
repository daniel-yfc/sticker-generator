import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import { HistoryItem } from '../types';

type StickerHistoryProps = {
  history: HistoryItem[];
  onDelete: (id: string) => void;
  t: (key: string) => string;
};

const StickerHistory: React.FC<StickerHistoryProps> = ({ history, onDelete, t }) => {
  const handleDownload = (item: HistoryItem) => {
    const link = document.createElement('a');
    link.href = item.imageUrl;
    link.download = `sticker-${item.styleId}-${item.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <div className="text-5xl mb-4">🗂️</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">{t('history_title')}</h2>
        <p className="text-gray-500">{t('history_empty')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('history_title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('history_subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {history.map((item) => (
          <div key={item.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="aspect-square bg-gray-50">
              <div className="transparent-grid w-full h-full">
                <img
                  src={item.imageUrl}
                  alt={`Sticker style ${item.styleId}`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="p-2">
              <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => handleDownload(item)}
                className="p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Download sticker"
              >
                <Download className="w-4 h-4 text-gray-700" />
              </button>
              <button
                type="button"
                onClick={() => onDelete(item.id)}
                className="p-2 bg-white rounded-lg hover:bg-red-50 transition-colors"
                aria-label="Delete sticker"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StickerHistory;
