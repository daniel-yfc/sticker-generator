
import React from 'react';
import Button from './Button';
import { Download, RefreshCcw, Check } from 'lucide-react';
import { StyleOption } from '../types';
import { downloadImage } from '../utils/download';

interface StickerSetViewProps {
  stickers: string[];
  style: StyleOption;
  onReset: () => void;
  t: (key: string) => string;
  stylesTranslation: Record<number, { name: string, features: string }>;
}

const StickerSetView: React.FC<StickerSetViewProps> = ({ stickers, style, onReset, t, stylesTranslation }) => {
  const styleName = stylesTranslation[style.id]?.name || style.id;

  const handleDownloadAll = () => {
    stickers.forEach((url, index) => {
      setTimeout(() => {
        downloadImage(url, `sticker-pro-set-${style.id}-${index}-${Date.now()}.png`);
      }, index * 150);
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('set_title')}</h2>
            <p className="text-gray-500 text-sm">{t('set_desc')}</p>
            <p className="text-indigo-600 text-xs font-bold mt-1 uppercase tracking-wider">{t('result_style_label')}: {styleName}</p>
          </div>
          <div className="flex gap-3">
             <Button
              onClick={onReset}
              variant="secondary"
              className="py-2"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('btn_reset')}
            </Button>
            <Button
              onClick={handleDownloadAll}
              variant="primary"
              className="py-2"
            >
              <Download className="w-4 h-4" />
              {t('btn_download')}
            </Button>
          </div>
        </div>

        <div className="p-8">
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {stickers.map((url, idx) => (
               <div key={idx} className="group relative">
                 <div className="aspect-square bg-gray-100 transparent-grid rounded-xl overflow-hidden border border-gray-200 shadow-sm p-4 hover:border-indigo-200 transition-colors">
                   <img 
                     src={url} 
                     alt={`Sticker variation ${idx + 1}`} 
                     className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110"
                   />
                 </div>
                 <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                   <Check className="w-4 h-4 text-green-600" />
                 </div>
                 <button
                   onClick={() => downloadImage(url, `sticker-variation-${idx}.png`)}
                   className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-indigo-700"
                   title={t('btn_download')}
                 >
                   <Download className="w-4 h-4" />
                 </button>
               </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default StickerSetView;
