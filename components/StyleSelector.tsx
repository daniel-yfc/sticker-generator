import React, { useState, useCallback, memo } from 'react';
import { STYLES } from '../constants/styles';
import { StyleOption, StyleTranslation } from '../types';
import { CheckCircle2, Info } from 'lucide-react';
import * as Icons from 'lucide-react';

interface StyleSelectorProps {
  selectedStyle: StyleOption;
  onSelect: (style: StyleOption) => void;
  disabled: boolean;
  t: (key: string) => string;
  stylesTranslation: Record<number, StyleTranslation>;
  mode?: 'grid' | 'sidebar';
}

const renderIcon = (iconName: string) => {
  const IconComponent = (Icons as Record<string, React.ElementType>)[iconName] || Icons.Image;
  return <IconComponent className="w-5 h-5 text-white" />;
};

interface TooltipProps {
  style: StyleOption;
  styleInfo: StyleTranslation;
  isGrid?: boolean;
}

const Tooltip: React.FC<TooltipProps> = memo(({ style, styleInfo, isGrid }) => {
  if (isGrid) {
    return (
      <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none animate-fadeIn">
        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 bg-gray-900 transform rotate-45"></div>
        <div className="relative z-10">
          <p className="font-bold mb-1 text-indigo-300">{styleInfo.name}</p>
          <p className="opacity-90 leading-relaxed mb-2">{styleInfo.features}</p>
          <div className="bg-white/10 p-2 rounded-lg">
            <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">Example</p>
            <p className="italic opacity-80">"{style.modifiers.person.split(',')[0]}..."</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute z-50 w-64 p-3 bg-gray-900 text-white text-xs rounded-xl shadow-2xl -top-2 left-full ml-4 pointer-events-none animate-fadeIn">
      <div className="absolute top-4 -left-2 w-4 h-4 bg-gray-900 transform rotate-45"></div>
      <div className="relative z-10">
        <p className="font-bold mb-1 text-indigo-300">{styleInfo.name}</p>
        <p className="opacity-90 leading-relaxed mb-2">{styleInfo.features}</p>
        <div className="bg-white/10 p-2 rounded-lg">
          <p className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">Example</p>
          <p className="italic opacity-80">"{style.modifiers.person.split(',')[0]}..."</p>
        </div>
      </div>
    </div>
  );
});

interface StyleItemProps {
  styleOption: StyleOption;
  styleInfo: StyleTranslation;
  isSelected: boolean;
  disabled: boolean;
  isHovered: boolean;
  onMouseEnter: (id: number) => void;
  onMouseLeave: () => void;
  onSelect: (style: StyleOption) => void;
}

const SidebarStyleItem: React.FC<StyleItemProps> = memo(({
  styleOption, styleInfo, isSelected, disabled, isHovered, onMouseEnter, onMouseLeave, onSelect
}) => {
  const handleMouseEnter = useCallback(() => onMouseEnter(styleOption.id), [onMouseEnter, styleOption.id]);
  const handleSelect = useCallback(() => onSelect(styleOption), [onSelect, styleOption]);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={handleSelect}
        disabled={disabled}
        className={`
          w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 text-left group
          ${isSelected
            ? 'bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200'
            : 'hover:bg-gray-50 text-gray-700'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`w-10 h-10 rounded-md ${styleOption.previewColor} shrink-0 relative overflow-hidden shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center`}>
           <div className="absolute inset-0 bg-black/10"></div>
           <div className="relative z-10">
             {renderIcon(styleOption.iconName)}
           </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-xs truncate flex items-center gap-1">
            {styleInfo.name}
            <Info className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="text-[10px] text-gray-400 truncate opacity-80">{styleInfo.features}</div>
        </div>
        {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto shrink-0" />}
      </button>
      {isHovered && <Tooltip style={styleOption} styleInfo={styleInfo} />}
    </div>
  );
});

const GridStyleItem: React.FC<StyleItemProps> = memo(({
  styleOption, styleInfo, isSelected, disabled, isHovered, onMouseEnter, onMouseLeave, onSelect
}) => {
  const handleMouseEnter = useCallback(() => onMouseEnter(styleOption.id), [onMouseEnter, styleOption.id]);
  const handleSelect = useCallback(() => onSelect(styleOption), [onSelect, styleOption]);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <button
        onClick={handleSelect}
        disabled={disabled}
        className={`
          w-full relative group flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 text-left
          ${isSelected
            ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
            : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <div className={`w-full h-20 mb-3 rounded-lg ${styleOption.previewColor} flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            {renderIcon(styleOption.iconName)}
          </div>
          <div className="absolute bottom-2 right-2 text-white/90 text-xs font-bold font-mono">
             #{styleOption.id.toString().padStart(2, '0')}
          </div>
        </div>

        <div className="w-full">
          <div className="flex justify-between items-start w-full">
            <span className={`font-bold text-sm ${isSelected ? 'text-indigo-700' : 'text-gray-900'} flex items-center gap-1`}>
              {styleInfo.name}
              <Info className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
            {styleInfo.features}
          </p>
        </div>
      </button>

      {isHovered && <Tooltip style={styleOption} styleInfo={styleInfo} isGrid={true} />}
    </div>
  );
});

const StyleSelector: React.FC<StyleSelectorProps> = ({ selectedStyle, onSelect, disabled, t, stylesTranslation, mode = 'grid' }) => {
  const selectedStyleName = stylesTranslation[selectedStyle.id]?.name || selectedStyle.id;
  const [hoveredStyle, setHoveredStyle] = useState<number | null>(null);

  const handleMouseEnter = useCallback((id: number) => setHoveredStyle(id), []);
  const handleMouseLeave = useCallback(() => setHoveredStyle(null), []);
  const handleSelect = useCallback((style: StyleOption) => onSelect(style), [onSelect]);

  if (mode === 'sidebar') {
    return (
      <div className="space-y-3 h-full overflow-y-auto pr-2 custom-scrollbar pb-20">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">{t('step1_title')}</h3>
        <div className="space-y-2 relative">
          {STYLES.map((style) => {
            const isSelected = selectedStyle.id === style.id;
            const styleInfo = stylesTranslation[style.id] || { name: `Style ${style.id}`, features: '' };
            const isHovered = hoveredStyle === style.id;

            return (
              <SidebarStyleItem
                key={style.id}
                styleOption={style}
                styleInfo={styleInfo}
                isSelected={isSelected}
                disabled={disabled}
                isHovered={isHovered}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onSelect={handleSelect}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">{t('step1_title')}</h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {t('step1_selected')}：{selectedStyleName}
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {STYLES.map((style) => {
          const isSelected = selectedStyle.id === style.id;
          const styleInfo = stylesTranslation[style.id] || { name: `Style ${style.id}`, features: '' };
          const isHovered = hoveredStyle === style.id;

          return (
            <GridStyleItem
              key={style.id}
              styleOption={style}
              styleInfo={styleInfo}
              isSelected={isSelected}
              disabled={disabled}
              isHovered={isHovered}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onSelect={handleSelect}
            />
          );
        })}
      </div>
    </div>
  );
};

export default memo(StyleSelector);
