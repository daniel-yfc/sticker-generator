
export interface StyleModifiers {
  person: string;
  object: string;
  landscape: string;
}

export interface StyleOption {
  id: number;
  style: string;
  basePrompt: string;
  modifiers: StyleModifiers;
  previewColor: string;
  iconName: string;
}

export enum AppStatus {
  IDLE = 'idle',
  EDITING = 'editing',
  READY = 'ready',
  UPLOADING = 'uploading',
  PROCESSING = 'processing',
  SET_PROCESSING = 'set_processing', // New: Processing a batch set
  SUCCESS = 'success',
  SET_SUCCESS = 'set_success',       // New: Displaying a batch set
  ERROR = 'error',
}

export interface StickerGenerationResult {
  imageUrl: string;
  isValid: boolean;
  errors?: string[];
}

export type Language = 'zh-TW' | 'en' | 'ja';
export type ViewMode = 'create' | 'gallery' | 'history';

export interface GalleryItem {
  id: string;
  imageUrl: string;
  styleId: number;
  author: string;
}

export interface StickerRecord {
  id: string;
  imageUrl: string;
  styleId: number;
  timestamp: number;
  sourceImageId?: string;
}

export interface StickerSet {
  sourceId: string;
  stickers: StickerRecord[];
}
