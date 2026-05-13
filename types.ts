export interface StyleModifiers {
  person: string;
  object: string;
  landscape: string;
}

export interface StyleOption {
  id: number;
  slug: string;
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
  SET_PROCESSING = 'set_processing',
  SUCCESS = 'success',
  SET_SUCCESS = 'set_success',
  ERROR = 'error',
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

export interface TranslationContent {
  header_title: string;
  header_subtitle: string;
  nav_create: string;
  nav_gallery: string;
  nav_history: string;
  welcome_title: string;
  welcome_desc: string;
  welcome_default_style: string;
  step1_title: string;
  step1_selected: string;
  step2_title: string;
  step2_drag: string;
  step2_hint: string;
  step2_ready: string;
  step2_reedit: string;
  step2_change: string;
  editor_title: string;
  editor_desc: string;
  editor_btn_confirm: string;
  editor_btn_cancel: string;
  editor_rotate: string;
  editor_zoom: string;
  processing_title: string;
  processing_steps: string[];
  processing_set: string;
  result_verified: string;
  result_title: string;
  result_style_label: string;
  result_saved: string;
  btn_magic_wand: string;
  btn_reset: string;
  btn_reuse: string;
  btn_generate_set: string;
  btn_download: string;
  btn_retry: string;
  set_title: string;
  set_desc: string;
  error_header: string;
  error_upload: string;
  error_process: string;
  error_safety: string;
  error_timeout: string;
  error_no_image: string;
  footer: string;
  gallery_title: string;
  gallery_subtitle: string;
  gallery_btn_try: string;
  gallery_btn_import: string;
  history_title: string;
  history_subtitle: string;
  history_empty: string;
  styles: Record<number, StyleTranslation>;
}

export interface StyleTranslation {
  name: string;
  features: string;
}
