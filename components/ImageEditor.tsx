import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';

type ImageEditorProps = {
  imageSrc: string;
  onConfirm: (croppedDataUrl: string) => void;
  onCancel: () => void;
  t: (key: string) => string;
};

const CANVAS_SIZE = 512;

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onConfirm, onCancel, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();
    ctx.translate(CANVAS_SIZE / 2 + offset.x, CANVAS_SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
    ctx.restore();
  }, [scale, rotation, offset]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fitScale = Math.max(CANVAS_SIZE / img.naturalWidth, CANVAS_SIZE / img.naturalHeight);
      setScale(fitScale);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    setOffset({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <h3 className="text-base font-bold text-gray-900">{t('editor_title')}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{t('editor_desc')}</p>
      </div>

      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="rounded-xl border-2 border-dashed border-indigo-300 cursor-move max-w-full"
        style={{ touchAction: 'none', maxHeight: '50vh', width: 'auto' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRotation(r => r - 90)}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label={t('editor_rotate')}
        >
          <RotateCw className="w-4 h-4 text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => setScale(s => Math.max(0.1, s - 0.1))}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label={t('editor_zoom')}
        >
          <ZoomOut className="w-4 h-4 text-gray-700" />
        </button>
        <span className="text-sm text-gray-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          onClick={() => setScale(s => Math.min(5, s + 0.1))}
          className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          aria-label={t('editor_zoom')}
        >
          <ZoomIn className="w-4 h-4 text-gray-700" />
        </button>
      </div>

      {/* Confirm / Cancel */}
      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-4 h-4" />
          {t('editor_btn_cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {t('editor_btn_confirm')}
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;
