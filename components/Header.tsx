import React from 'react';
import { Sparkles, Sticker, Globe } from 'lucide-react';
import { Language, ViewMode } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
  t: (key: string) => string;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, currentLang, onLangChange, t }) => {
  const navItems: { id: ViewMode; label: string }[] = [
    { id: 'create', label: t('nav_create') },
    { id: 'history', label: t('nav_history') },
    { id: 'gallery', label: t('nav_gallery') },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onViewChange('create')}>
            <div className="bg-indigo-600 p-2 rounded-lg shrink-0">
              <Sticker className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-tight">{t('header_title')}</h1>
              <p className="text-xs text-gray-500 font-medium">{t('header_subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-6 flex-1">
            {/* Navigation */}
            <nav className="flex bg-gray-100/80 p-1 rounded-lg">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`px-3 md:px-4 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    currentView === item.id 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-2 py-1 rounded-md transition-colors">
                  <Globe className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase">{currentLang}</span>
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1 w-24 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block">
                  <button onClick={() => onLangChange('zh-TW')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">繁體中文</button>
                  <button onClick={() => onLangChange('en')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">English</button>
                  <button onClick={() => onLangChange('ja')} className="block w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 text-gray-700">日本語</button>
                </div>
              </div>

              {/* Version Badge */}
              <div className="hidden sm:flex items-center gap-1 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>V2.1</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
