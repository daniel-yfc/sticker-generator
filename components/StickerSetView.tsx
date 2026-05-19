import React from 'react';
import { Download, RefreshCcw, Check, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { StyleOption, StickerSetTile } from '../types';
import { downloadImage } from '../utils/download';
import { VariationId } from '../utils/promptBuilder';

interface StickerSetViewProps {
  tiles: StickerSetTile[];
  style: StyleOption;
  onReset: () => void;
  onRetryTile: (variationId: VariationId) => void;
  t: (key: string) => string;
  stylesTranslation: Record<number, { name: string; features: string }>;
}

function StickerSetView({
  tiles,
  style,
  onReset,
  onRetryTile,
  t,
  stylesTranslation,
}: StickerSetViewProps): React.ReactElement {
  const styleEntry = stylesTranslation[style.id];
  const styleName = styleEntry ? styleEntry.name : String(style.id);
  const doneTiles = tiles.filter(tile => tile.status === 'done');
  const hasPartialFailure = tiles.some(tile => tile.status === 'failed');
  const allPending = tiles.every(tile => tile.status === 'pending');

  const handleDownloadAll = () => {
    doneTiles.forEach((tile, index) => {
      if (tile.imageUrl) {
        const url = tile.imageUrl;
        setTimeout(() => {
          downloadImage(url, `sticker-pro-set-${style.id}-${tile.variationId}-${Date.now()}.png`);
        }, index * 150);
      }
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{t('set_title')}</h2>
            {hasPartialFailure && (
              <p className="text-amber-600 text-sm font-medium mt-1">
                {t('sticker_partial_success')}
              </p>
            )}
            {!hasPartialFailure && (
              <p className="text-gray-500 text-sm">{t('set_desc')}</p>
            )}
            <p className="text-indigo-600 text-xs font-bold mt-1 uppercase tracking-wider">
              {t('result_style_label')}: {styleName}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
            >
              <RefreshCcw className="w-4 h-4" />
              {t('btn_reset')}
            </button>
            {doneTiles.length > 0 && (
              <button
                onClick={handleDownloadAll}
                disabled={allPending}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md"
              >
                <Download className="w-4 h-4" />
                {t('btn_download')}
              </button>
            )}
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiles.map((tile) => (
              <div key={tile.variationId} className="group relative">
                {tile.status === 'pending' && (
                  <div className="aspect-square bg-gray-100 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    <span className="text-xs text-gray-400">{t('sticker_generating_variation')}</span>
                  </div>
                )}

                {tile.status === 'done' && tile.imageUrl && (
                  <>
                    <div className="aspect-square bg-gray-100 transparent-grid rounded-xl overflow-hidden border border-gray-200 shadow-sm p-4 hover:border-indigo-200 transition-colors">
                      <img
                        src={tile.imageUrl}
                        alt={`Sticker variation ${tile.variationId}`}
                        className="w-full h-full object-contain drop-shadow-md transition-transform group-hover:scale-110"
                      />
                    </div>
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <button
                      onClick={() => {
                        const url = tile.imageUrl;
                        if (url) {
                          downloadImage(url, `sticker-variation-${tile.variationId}.png`);
                        }
                      }}
                      className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-indigo-700"
                      title={t('btn_download')}
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </>
                )}

                {tile.status === 'failed' && (
                  <div className="aspect-square bg-red-50 rounded-xl border border-red-200 shadow-sm flex flex-col items-center justify-center gap-3 p-4">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                    <span className="text-xs text-red-500 text-center">
                      {t(tile.errorPublicKey ?? 'sticker_tile_failed')}
                    </span>
                    {tile.retryable && (
                      <button
                        onClick={() => onRetryTile(tile.variationId as VariationId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {t('btn_retry_variation')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StickerSetView;
