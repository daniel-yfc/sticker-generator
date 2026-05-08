import { useState, useRef, useEffect, useCallback } from 'react';
import { AppStatus, StyleOption, Language, ViewMode, StickerRecord } from '../types';
import { STYLES, STYLES_MAP, TRANSLATIONS } from '../constants';
import { logger } from '../utils/logger';
import { validateHistory } from '../utils/validation';
import { generateSticker, generateStickerSet } from '../services/geminiService';

const HISTORY_KEY = 'sticker_maker_history_v2';

export const useAppState = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [selectedStyle, setSelectedStyle] = useState<StyleOption>(STYLES[0]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedSet, setGeneratedSet] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [rawImage, setRawImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const [view, setView] = useState<ViewMode>('create');
  const [language, setLanguage] = useState<Language>('zh-TW');

  const [history, setHistory] = useState<StickerRecord[]>([]);

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
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
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
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setRawImage(reader.result);
        setStatus(AppStatus.EDITING);
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
    if (!processedImage) return;

    setStatus(AppStatus.PROCESSING);
    setErrorMessage(null);
    setGeneratedImage(null);

    const uiTimeout = setTimeout(() => {
      if (statusRef.current === AppStatus.PROCESSING) {
        setErrorMessage(t("error_timeout"));
        setStatus(AppStatus.ERROR);
      }
    }, 70000);

    try {
      const resultImage = await generateSticker(processedImage, selectedStyle);

      const img = new Image();
      img.onload = () => {
          clearTimeout(uiTimeout);
          setGeneratedImage(resultImage);
          addToHistory([{ imageUrl: resultImage, styleId: selectedStyle.id }]);
          setStatus(AppStatus.SUCCESS);
      };
      img.onerror = () => {
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
    if (!processedImage) return;

    setStatus(AppStatus.SET_PROCESSING);
    setErrorMessage(null);
    setGeneratedSet([]);

    const variations = [
      "giving a friendly thumbs up with a big smile",
      "looking very happy and laughing joyfully",
      "looking surprised with wide eyes and open mouth",
      "looking cool wearing stylish sunglasses"
    ];

    try {
      const results = await generateStickerSet(processedImage, selectedStyle, variations);
      addToHistory(results.map(imgUrl => ({ imageUrl: imgUrl, styleId: selectedStyle.id })));
      setGeneratedSet(results);
      setStatus(AppStatus.SET_SUCCESS);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(t(error.message));
      } else {
        setErrorMessage(t('error_process'));
      }
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setGeneratedImage(null);
    setGeneratedSet([]);
    setErrorMessage(null);
    setRawImage(null);
    setProcessedImage(null);
  };

  const handleReuse = () => {
    setStatus(AppStatus.READY);
    setGeneratedImage(null);
    setGeneratedSet([]);
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
    errorMessage, setErrorMessage,
    rawImage, setRawImage,
    processedImage, setProcessedImage,
    view, setView,
    language, setLanguage,
    history, setHistory,
    isProcessing,
    t,
    addToHistory,
    deleteFromHistory,
    handleStyleSelect,
    handleGallerySelect,
    handleFileSelect,
    handleEditConfirm,
    handleGenerate,
    handleGenerateSet,
    handleReset,
    handleReuse,
    handleImageUpdate
  };
};
