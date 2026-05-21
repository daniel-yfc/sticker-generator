import React from 'react';
import { Download, RefreshCw, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import { StyleOption, TranslationContent, TileState } from '../types';

type StickerSetViewProps = {
  tiles: TileState[];
  style: StyleOption | null;
  onReset: () => void;
  onRetryTile: (variationId: string) => void;
  t: (key: string) => string;
  stylesTranslation: TranslationContent['styles'];
};

const StickerSetView: React.FC<StickerSetViewProps> = ({
  tiles,
  style,
  onReset,
  onRetryTile,
  t,
  stylesTranslation,
}) => {
  const styleName = style ? (stylesTranslation[style.id]?.name ?? style.style) : 'Custom';
  const allDone = tiles.every(tile => tile.status !== 'generating');
  const hasPartialFailure = tiles.some(tile => tile.status === 'error');

  const handleDownloadAll = () => {
    tiles.forEach((tile) => {
      if (tile.imageUrl) {
        const link = document.createElement('a');
        link.href = tile.imageUrl;
        link.download = `sticker-set-${tile.variationId}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg">
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-900">{t('set_title')}</h3>
        <p className="text-sm text-gray-500">
          {t('result_style_label')}: <span className="font-medium text-indigo-600">{styleName}</span>
        </p>
        {hasPartialFailure && (
          <p className="text-xs text-orange-500 mt-1 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('sticker_partial_success')}
          </p>
        )}
      </div>

      {/* 2×2 Grid */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {tiles.map((tile) => (
          <div key={tile.variationId} className="relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden aspect-square">
            {tile.status === 'generating' && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50">
                <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs text-gray-500">{t('sticker_generating_variation')}</span>
              </div>
            )}

            {tile.status === 'done' && tile.imageUrl && (
              <>
                <div className="transparent-grid w-full h-full">
                  <img
                    src={tile.imageUrl}
                    alt={`Variation ${tile.variationId}`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <a
                  href={tile.imageUrl}
                  download={`sticker-${tile.variationId}.png`}
                  className="absolute bottom-1 right-1 p-1.5 bg-white/90 rounded-lg shadow hover:bg-white transition-colors"
                  aria-label="Download this tile"
                >
                  <Download className="w-3.5 h-3.5 text-gray-600" />
                </a>
              </>
            )}

            {tile.status === 'error' && (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-red-50 p-3">
                <AlertCircle className="w-6 h-6 text-red-400" />
                <span className="text-xs text-red-500 text-center">{t('sticker_tile_failed')}</span>
                <button
                  type="button"
                  onClick={() => onRetryTile(tile.variationId)}
                  className="mt-1 px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  {t('btn_retry_variation')}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      {allDone && (
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={handleDownloadAll}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {t('btn_download')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('btn_reset')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StickerSetView;
