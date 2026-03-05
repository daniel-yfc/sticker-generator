import React, { useState } from 'react';
import { Key, Save, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onSave: (key: string) => void;
  onClose: () => void;
  t: (key: string) => any;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onSave, onClose, t }) => {
  const [keyInput, setKeyInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Key className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('api_key_title') || 'API Key Required'}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-6">
          {t('api_key_desc') || 'Please enter your Gemini API Key to continue. Your key is stored locally in your browser and is never sent to our servers.'}
        </p>

        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={t('api_key_placeholder') || 'Enter Gemini API Key...'}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all mb-4 font-mono text-sm"
        />

        <div className="text-xs text-gray-500 mb-6">
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
            {t('api_key_link') || 'Get your Gemini API Key here'}
          </a>
        </div>

        <button
          onClick={() => {
            if (keyInput.trim()) {
              onSave(keyInput.trim());
              setKeyInput('');
            }
          }}
          disabled={!keyInput.trim()}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          {t('api_key_save') || 'Save API Key'}
        </button>
      </div>
    </div>
  );
};

export default ApiKeyModal;
