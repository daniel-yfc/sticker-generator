import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, Move, Check, X } from 'lucide-react';

interface ImageEditorProps {
  imageSrc: string;
  onConfirm: (processedImage: string) => void;
  onCancel: () => void;
  t: (key: string) => any;
}

const ImageEditor: React.FC<ImageEditorProps> = ({ imageSrc, onConfirm, onCancel, t }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Use refs for high-frequency events to avoid re-renders
  const positionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      setImage(img);
      positionRef.current = { x: 0, y: 0 };
    };
  }, [imageSrc]);

  // Define drawing function that uses current state/refs
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CANVAS_SIZE = 400;
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const patternSize = 20;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ddd';
    for (let i = 0; i < canvas.width; i += patternSize) {
      for (let j = 0; j < canvas.height; j += patternSize) {
        if ((i / patternSize + j / patternSize) % 2 === 0) {
          ctx.fillRect(i, j, patternSize, patternSize);
        }
      }
    }

    ctx.save();
    
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(positionRef.current.x, positionRef.current.y);

    const scaleFactor = Math.min(canvas.width / image.width, canvas.height / image.height) * 0.8;
    const drawWidth = image.width * scaleFactor;
    const drawHeight = image.height * scaleFactor;
    
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );

    ctx.restore();

    ctx.strokeStyle = '#4F46E5';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  };

  // Draw on changes
  useEffect(() => {
    drawCanvas();
  }, [image, scale, rotation]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    isDraggingRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStartRef.current = {
      x: clientX - positionRef.current.x * scale,
      y: clientY - positionRef.current.y * scale
    };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    const dx = clientX - dragStartRef.current.x;
    const dy = clientY - dragStartRef.current.y;
    
    let rotRad = (-rotation * Math.PI) / 180;
    const rotatedDx = dx * Math.cos(rotRad) - dy * Math.sin(rotRad);
    const rotatedDy = dx * Math.sin(rotRad) + dy * Math.cos(rotRad);

    positionRef.current = {
      x: rotatedDx / scale,
      y: rotatedDy / scale
    };

    // Trigger paint immediately without React state update overhead
    requestAnimationFrame(drawCanvas);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (canvas) {
        // Export high quality
        onConfirm(canvas.toDataURL('image/png', 1.0));
    }
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
