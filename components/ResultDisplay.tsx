import React from 'react';
import { Download, RefreshCw, RotateCcw, Wand2 } from 'lucide-react';
import { StyleOption, TranslationContent } from '../types';

type ResultDisplayProps = {
  imageUrl: string;
  style: StyleOption | null;
  onReset: () => void;
  onReuse: () => void;
  onImageUpdate: (newUrl: string) => void;
  t: (key: string) => string;
  stylesTranslation: TranslationContent['styles'];
};

const ResultDisplay: React.FC<ResultDisplayProps> = ({
  imageUrl,
  style,
  onReset,
  onReuse,
  onImageUpdate: _onImageUpdate,
  t,
  stylesTranslation,
}) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `sticker-${style?.id ?? 'custom'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const styleName = style ? (stylesTranslation[style.id]?.name ?? style.style) : 'Custom';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {/* Result Image */}
      <div className="relative">
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-200">
          <div className="transparent-grid rounded-xl overflow-hidden">
            <img
              src={imageUrl}
              alt="Generated sticker"
              className="w-64 h-64 object-contain"
            />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
          ✓ {t('result_verified')}
        </div>
      </div>

      {/* Info */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900">{t('result_title')}</h3>
        <p className="text-sm text-gray-500">
          {t('result_style_label')}: <span className="font-medium text-indigo-600">{styleName}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">{t('result_saved')}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 w-full">
        <button
          type="button"
          onClick={handleDownload}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4" />
          {t('btn_download')}
        </button>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReuse}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {t('btn_reuse')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {t('btn_reset')}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            // Magic wand: placeholder — triggers parent re-inpaint via onImageUpdate
            console.info('Magic wand requested');
          }}
          className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-purple-200"
        >
          <Wand2 className="w-4 h-4" />
          {t('btn_magic_wand')}
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
