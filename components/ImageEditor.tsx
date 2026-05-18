import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, Move, Check, X } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onConfirm: (processedImage: string) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

const PATTERN_SIZE = 20;
let sharedPattern: CanvasPattern | null = null;

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onConfirm, onCancel, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      setPosition({ x: 0, y: 0 });
    };
  }, [imageSrc]);

  // Draw display canvas (grid + guide circle intact — display only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_SIZE = 400;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!sharedPattern) {
      const pCanvas = document.createElement('canvas');
      pCanvas.width = PATTERN_SIZE * 2;
      pCanvas.height = PATTERN_SIZE * 2;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCtx.fillStyle = '#f0f0f0';
        pCtx.fillRect(0, 0, pCanvas.width, pCanvas.height);
        pCtx.fillStyle = '#ddd';
        pCtx.fillRect(0, 0, PATTERN_SIZE, PATTERN_SIZE);
        pCtx.fillRect(PATTERN_SIZE, PATTERN_SIZE, PATTERN_SIZE, PATTERN_SIZE);
        sharedPattern = ctx.createPattern(pCanvas, 'repeat');
      }
    }

    if (sharedPattern) {
      ctx.fillStyle = sharedPattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    const scaleFactor = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.8;
    const drawWidth = image.width * scaleFactor;
    const drawHeight = image.height * scaleFactor;

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Guide circle (display only — not exported)
    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, scale, rotation, position]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    rafRef.current = requestAnimationFrame(() => {
      const rotRad = (-rotation * Math.PI) / 180;
      const rotatedDx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
      const rotatedDy = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);
      setPosition({ x: rotatedDx / scale, y: rotatedDy / scale });
      rafRef.current = null;
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // GP55-011 fix: export via off-screen canvas — no grid, no guide circle, transparent PNG
  const handleConfirm = () => {
    if (!image) return;

    const EXPORT_SIZE = 512;
    const DISPLAY_SIZE = 400;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = EXPORT_SIZE;
    exportCanvas.height = EXPORT_SIZE;

    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Scale transform from display (400px) to export (512px)
    const exportRatio = EXPORT_SIZE / DISPLAY_SIZE;

    ctx.save();
    ctx.translate(EXPORT_SIZE / 2, EXPORT_SIZE / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale * exportRatio, scale * exportRatio);
    ctx.translate(position.x, position.y);

    const scaleFactor = Math.min(DISPLAY_SIZE / image.width, DISPLAY_SIZE / image.height) * 0.8;
    const drawWidth = image.width * scaleFactor;
    const drawHeight = image.height * scaleFactor;

    ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    onConfirm(exportCanvas.toDataURL('image/png'));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-xl mx-auto">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Move className="w-4 h-4 text-indigo-600" />
          {t('editor_title')}
        </h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 bg-gray-100 flex justify-center overflow-hidden touch-none relative">
        <canvas
          ref={canvasRef}
          className="rounded-lg shadow-sm cursor-move bg-white"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        />
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-xs pointer-events-none">
          {t('editor_desc')}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600 min-w-[60px]">
            <ZoomIn className="w-4 h-4" />
            <span className="text-xs font-bold">{t('editor_zoom')}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
        </div>

        <div className="flex justify-between gap-4">
          <button
            onClick={() => setRotation(r => (r - 90) % 360)}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 flex items-center justify-center gap-2"
          >
            <RotateCw className="w-4 h-4" />
            {t('editor_rotate')}
          </button>

          <button
            onClick={handleConfirm}
            className="flex-[2] py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t('editor_btn_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
