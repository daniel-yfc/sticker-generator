import React from 'react';
import { UploadCloud, Edit, RefreshCw } from 'lucide-react';
import { MAX_FILE_SIZE } from '../constants';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  currentPreview?: string;
  onEditClick?: () => void;
  disabled: boolean;
  t: (key: string) => string;
  mode?: 'hero' | 'compact';
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, currentPreview, onEditClick, disabled, t, mode = 'hero' }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        alert(t('error_upload') + ': File size exceeds 10MB limit.');
        return;
      }
      onFileSelect(file);
    }
  };

  if (mode === 'compact') {
    return (
      <div className="w-full">
         <label className={`
            flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border-2 border-dashed transition-all cursor-pointer
            ${disabled ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed' : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/10 text-gray-600 hover:text-indigo-600'}
         `}>
            <UploadCloud className="w-5 h-5" />
            <span className="text-sm font-bold">{t('step2_change')}</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/webp"
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
         </label>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-gray-800">{t('step2_title')}</h2>
      
      {currentPreview ? (
        <div className="bg-white rounded-xl border-2 border-indigo-100 p-4 shadow-sm animate-fadeIn">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative mb-3 transparent-grid">
             <img src={currentPreview} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-between">
             <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
               {t('step2_ready')}
             </span>
             <div className="flex gap-2">
               {onEditClick && (
                 <button onClick={onEditClick} className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors" title={t('step2_reedit')}>
                   <Edit className="w-4 h-4" />
                 </button>
               )}
               <label className="p-2 text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" title={t('step2_change')}>
                 <RefreshCw className="w-4 h-4" />
                 <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                  />
               </label>
             </div>
          </div>
        </div>
      ) : (
        <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors h-[280px] flex flex-col items-center justify-center
          ${disabled ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/10'}`}>
          
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-4 bg-indigo-50 rounded-full text-indigo-600">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-medium text-gray-900">
                {t('step2_drag')}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {t('step2_hint')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
