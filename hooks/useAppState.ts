import { useState, useRef, useEffect, useCallback } from 'react';
import { AppStatus, StyleOption, Language, ViewMode, StickerRecord, StickerSetTile } from '../types';
import { STYLES, STYLES_MAP, TRANSLATIONS } from '../constants';
import { logger } from '../utils/logger';
import { validateHistory } from '../utils/validation';
import { generateSticker, generateStickerSet } from '../services/geminiService';
import { VariationId } from '../utils/promptBuilder';

const HISTORY_KEY = 'sticker_maker_history_v2';
const MAX_IMAGE_DIMENSION = 4096;

function validateImageDimensions(dataUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > MAX_IMAGE_DIMENSION || img.height > MAX_IMAGE_DIMENSION) {
        reject(new Error('error_payload'));
      } else {
        resolve();
      }
    };
    img.onerror = () => { reject(new Error('error_payload')); };
    img.src = dataUrl;
  });
}

export const useAppState = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLES[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedSet, setGeneratedSet] = useState<string[]>([]);
  const [generatedTiles, setGeneratedTiles] = useState<StickerSetTile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('create');
  const [language, setLanguage] = useState<Language>('zh-TW');

  const [history, setHistory] = useState<StickerRecord[]>([]);

  const captchaTokenRef = useRef<string>('');
  const generationIdRef = useRef<number>(0);

  const isProcessing = status === AppStatus.PROCESSING || status === AppStatus.SET_PROCESSING;

  const t = (key: string) => {
    const translation = TRANSLATIONS[language];
    if (key in translation) {
      return translation[key as keyof typeof translation] as string;
    }
    return key;
  };

  useEffect(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const validated = validateHistory(parsed);
        setHistory(validated);
      } catch (error: unknown) {
        logger.error("Failed to parse history", error instanceof Error ? error.message : error);
      }
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      } catch (error: unknown) {
        logger.error("Failed to save history", error instanceof Error ? error.message : error);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [history]);

  const addToHistory = useCallback((items: { imageUrl: string; styleId: number }[]) => {
    const newRecords: StickerRecord[] = items.map(item => ({
      id: crypto.randomUUID(),
      imageUrl: item.imageUrl,
      styleId: item.styleId,
      timestamp: Date.now()
    }));
    setHistory(prev => [...newRecords, ...prev]);
  }, []);

  const deleteFromHistory = useCallback((id: string) => {
    setHistory(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1) return prev;
      const next = [...prev];
      next.splice(index, 1);
      return next;
    });
  }, []);

  const handleStyleSelect = useCallback((style: StyleOption) => {
    setSelectedStyle(style);
  }, []);

  const handleGallerySelect = async (styleId: number, imageUrl?: string) => {
    const style = STYLES_MAP[styleId];
    if (style) {
      setSelectedStyle(style);

      if (imageUrl) {
        setStatus(AppStatus.UPLOADING);
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setRawImage(reader.result as string);
            setStatus(AppStatus.EDITING);
          };
          reader.readAsDataURL(blob);
        } catch (error: unknown) {
          logger.error("Failed to import gallery image", error instanceof Error ? error.message : error);
          setStatus(AppStatus.ERROR);
          setErrorMessage(t('error_upload'));
        }
      }

      setView('create');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFileSelect = async (file: File) => {
    setStatus(AppStatus.UPLOADING);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        try {
          await validateImageDimensions(reader.result);
          setRawImage(reader.result);
          setStatus(AppStatus.EDITING);
        } catch {
          setErrorMessage(t('error_payload'));
          setStatus(AppStatus.ERROR);
        }
      }
    };
    reader.onerror = () => {
      setErrorMessage(t('error_upload'));
      setStatus(AppStatus.ERROR);
    };
    reader.readAsDataURL(file);
  };

  const handleEditConfirm = (newImageBase64: string) => {
    setProcessedImage(newImageBase64);
    setStatus(AppStatus.READY);
  };

  const handleGenerate = async () => {
    if (isProcessing || !processedImage) return;

    const token = captchaTokenRef.current;
    if (!token) {
      setErrorMessage(t('error_captcha'));
      setStatus(AppStatus.ERROR);
      return;
    }

    const myId = ++generationIdRef.current;
    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setGeneratedImage(null);

    const uiTimeout = setTimeout(() => {
      if (statusRef.current === AppStatus.PROCESSING) {
        setErrorMessage(t('error_timeout'));
        setStatus(AppStatus.ERROR);
      }
    }, 85000);

    try {
      const resultImage = await generateSticker(processedImage, selectedStyle.style, 'default', token);

      const img = new Image();
      img.onload = () => {
        if (generationIdRef.current !== myId) return;
        clearTimeout(uiTimeout);
        setGeneratedImage(resultImage);
        addToHistory([{ imageUrl: resultImage, styleId: selectedStyle.id }]);
        setStatus(AppStatus.SUCCESS);
      };
      img.onerror = () => {
        if (generationIdRef.current !== myId) return;
        clearTimeout(uiTimeout);
        setErrorMessage(t('error_process'));
        setStatus(AppStatus.ERROR);
      };
      img.src = resultImage;

    } catch (error: unknown) {
      clearTimeout(uiTimeout);
      if (error instanceof Error) {
        setErrorMessage(t(error.message));
      } else {
        setErrorMessage(t('error_process'));
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateSet = async () => {
    if (isProcessing || !processedImage) return;

    const token = captchaTokenRef.current;
    if (!token) {
      setErrorMessage(t('error_captcha'));
      setStatus(AppStatus.ERROR);
      return;
    }

    const myId = ++generationIdRef.current;
    const styleId = selectedStyle.id;
    const variations: VariationId[] = ['thumbs_up', 'laughing', 'surprised', 'cool'];

    const initialTiles: StickerSetTile[] = variations.map(v => ({
      variationId: v,
      status: 'pending',
      retryable: false,
    }));
    setGeneratedTiles(initialTiles);
    setStatus(AppStatus.SET_PROCESSING);
    setErrorMessage(null);
    setGeneratedSet([]);

    function onTileSettled(settledTile: StickerSetTile) {
      if (generationIdRef.current !== myId) return;
      setGeneratedTiles(prev => {
        const next = prev.map(entry =>
          entry.variationId === settledTile.variationId ? settledTile : entry
        );
        const allDone = next.every(entry => entry.status !== 'pending');
        if (allDone) {
          const hasFailure = next.some(entry => entry.status === 'failed');
          const successUrls = next
            .filter(entry => entry.status === 'done' && entry.imageUrl)
            .map(entry => ({ imageUrl: entry.imageUrl as string, styleId }));
          if (successUrls.length > 0) addToHistory(successUrls);
          setStatus(hasFailure ? AppStatus.SET_PARTIAL : AppStatus.SET_SUCCESS);
        }
        return next;
      });
    }

    await generateStickerSet(
      processedImage,
      selectedStyle.style,
      variations,
      token,
      onTileSettled
    );
  };

  const retryStickerSetTile = async (variationId: VariationId) => {
    if (!processedImage) return;

    const token = captchaTokenRef.current;
    if (!token) {
      setErrorMessage(t('error_captcha'));
      return;
    }

    const myId = generationIdRef.current;

    setGeneratedTiles(prev =>
      prev.map(entry =>
        entry.variationId === variationId
          ? { ...entry, status: 'pending', errorPublicKey: undefined }
          : entry
      )
    );

    try {
      const imageUrl = await generateSticker(processedImage, selectedStyle.style, variationId, token);

      if (generationIdRef.current !== myId) return;

      setGeneratedTiles(prev => {
        const next = prev.map(entry =>
          entry.variationId === variationId
            ? { variationId, status: 'done' as const, imageUrl, retryable: false }
            : entry
        );
        const hasFailure = next.some(entry => entry.status === 'failed');
        setStatus(hasFailure ? AppStatus.SET_PARTIAL : AppStatus.SET_SUCCESS);
        addToHistory([{ imageUrl, styleId: selectedStyle.id }]);
        return next;
      });
    } catch (error: unknown) {
      if (generationIdRef.current !== myId) return;
      const errorPublicKey = error instanceof Error ? error.message : 'error_process';
      setGeneratedTiles(prev =>
        prev.map(entry =>
          entry.variationId === variationId
            ? { ...entry, status: 'failed', errorPublicKey, retryable: true }
            : entry
        )
      );
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setGeneratedImage(null);
    setGeneratedSet([]);
    setGeneratedTiles([]);
    setErrorMessage(null);
    setRawImage(null);
    setProcessedImage(null);
  };

  const handleReuse = () => {
    setStatus(AppStatus.READY);
    setGeneratedImage(null);
    setGeneratedSet([]);
    setGeneratedTiles([]);
    setErrorMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpdate = (newUrl: string) => {
    setGeneratedImage(newUrl);
  };

  return {
    status, setStatus,
    selectedStyle, setSelectedStyle,
    generatedImage, setGeneratedImage,
    generatedSet, setGeneratedSet,
    generatedTiles,
    errorMessage, setErrorMessage,
    rawImage, setRawImage,
    processedImage, setProcessedImage,
    view, setView,
    language, setLanguage,
    history, setHistory,
    isProcessing,
    t,
    captchaTokenRef,
    addToHistory,
    deleteFromHistory,
    handleStyleSelect,
    handleGallerySelect,
    handleFileSelect,
    handleEditConfirm,
    handleGenerate,
    handleGenerateSet,
    retryStickerSetTile,
    handleReset,
    handleReuse,
    handleImageUpdate
  };
};
