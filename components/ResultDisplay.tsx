import { useState, type FC } from 'react';
import { Download, RefreshCcw, Check, Wand2, Repeat } from 'lucide-react';
import { StyleOption, StyleTranslation } from '../types';
import { downloadImage } from '../utils/download';
import { removeBackgroundMagicWand } from '../utils/imageUtils';

interface ResultDisplayProps {
  imageUrl: string;
  style: StyleOption;
  onReset: () => void;
  onReuse: () => void;
  onImageUpdate: (newImage: string) => void;
  t: (key: string) => string;
  stylesTranslation: Record<number, StyleTranslation>;
}

const ResultDisplay: FC<ResultDisplayProps> = ({ imageUrl, style, onReset, onReuse, onImageUpdate, t, stylesTranslation }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = () => {
    downloadImage(imageUrl, `sticker-pro-${style.id}-${Date.now()}.png`);
  };

  const handleMagicWand = async () => {
    try {
      setIsProcessing(true);
      const newUrl = await removeBackgroundMagicWand(imageUrl);
      onImageUpdate(newUrl);
    } catch (error: unknown) {
      console.error("Failed to apply magic wand:", error instanceof Error ? error.message : error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const styleName = stylesTranslation[style.id]?.name || style.id;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 text-green-600 mb-1">
             <Check className="w-5 h-5" />
             <span className="font-bold text-sm">{t('result_verified')}</span>
           </div>
           <h2 className="text-2xl font-bold text-gray-900">{t('result_title')}</h2>
           <p className="text-gray-500 text-sm">{t('result_style_label')}：{styleName}</p>
        </div>
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t('result_saved')}
        </div>
      </div>

      <div className="p-8 flex flex-col items-center">
        <div className="relative group">
          <div className="transparent-grid rounded-xl overflow-hidden border-2 border-gray-200 shadow-inner bg-gray-100">
            <img 
              src={imageUrl} 
              alt="Generated Sticker" 
              className={`w-[320px] h-[320px] object-contain transition-opacity ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
            />
          </div>
          
          <div className="absolute top-4 right-4 flex flex-col gap-2">
             <button
               onClick={handleMagicWand}
               className="bg-white p-2 rounded-full shadow-md text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-gray-100 tooltip-trigger group/btn"
               title={t('btn_magic_wand')}
             >
               <Wand2 className="w-5 h-5" />
             </button>
          </div>

          <div className="absolute -bottom-4 -right-4 bg-white px-3 py-1 shadow-md rounded-full text-xs font-mono text-gray-500 border border-gray-200">
            512 x 512 px
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8 w-full max-w-lg">
          <button
            onClick={onReuse}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium transition-colors border border-indigo-100"
          >
            <Repeat className="w-5 h-5" />
            {t('btn_reuse')}
          </button>
          <button
            onClick={onReset}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
          >
            <RefreshCcw className="w-5 h-5" />
            {t('btn_reset')}
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
          >
            <Download className="w-5 h-5" />
            {t('btn_download')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
