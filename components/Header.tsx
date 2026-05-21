import React from 'react';
import { Sparkles } from 'lucide-react';
import { Language } from '../types';

type View = 'create' | 'gallery' | 'history';

type HeaderProps = {
  currentView: View;
  onViewChange: (view: View) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  t: (key: string) => string;
};

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, currentLang, onLangChange, t }) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">{t('header_title')}</h1>
              <p className="text-xs text-gray-500">{t('header_subtitle')}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {(['create', 'gallery', 'history'] as View[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => onViewChange(view)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  currentView === view
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {view === 'create' ? t('nav_create') :
                 view === 'gallery' ? t('nav_gallery') :
                 t('nav_history')}
              </button>
            ))}
          </nav>

          {/* Language Selector */}
          <div className="flex items-center gap-1">
            {(['zh-TW', 'en', 'ja'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLangChange(lang)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  currentLang === lang
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {lang === 'zh-TW' ? '中' : lang === 'en' ? 'EN' : 'JA'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
