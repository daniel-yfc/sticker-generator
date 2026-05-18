import React from 'react';
import Header from './components/Header';
import StyleSelector from './components/StyleSelector';
import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import ResultDisplay from './components/ResultDisplay';
import Gallery from './components/Gallery';
import StickerHistory from './components/StickerHistory';
import ImageEditor from './components/ImageEditor';
import StickerSetView from './components/StickerSetView';
import TurnstileWidget from './components/TurnstileWidget';
import { STYLES, TRANSLATIONS } from './constants';
import { AppStatus } from './types';
import { AlertCircle, Layers, Sticker, RefreshCw, Sparkles } from 'lucide-react';
import { useAppState } from './hooks';

const App: React.FC = () => {
  const {
    status, setStatus,
    selectedStyle,
    generatedImage,
    generatedSet,
    errorMessage,
    rawImage, setRawImage,
    processedImage,
    view, setView,
    language, setLanguage,
    history,
    isProcessing,
    t,
    captchaTokenRef,
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
  } = useAppState();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header 
        currentView={view} 
        onViewChange={setView}
        currentLang={language}
        onLangChange={setLanguage}
        t={t}
      />

      <main className="flex-grow max-w-5xl mx-auto w-full px-4 py-8">
                {/* --- WORKSPACE LAYOUT (Active State) --- */}
            {(status !== AppStatus.IDLE && view === 'create') && (
              <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[600px]">
                
                {/* LEFT SIDEBAR: Controls */}
                <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 h-full overflow-hidden">
                   
                   {/* Style Selector Panel */}
                   <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-4 overflow-hidden flex flex-col">
                      <StyleSelector 
                        selectedStyle={selectedStyle} 
                        onSelect={handleStyleSelect} 
                        disabled={isProcessing}
                        t={t}
                        stylesTranslation={TRANSLATIONS[language].styles}
                        mode="sidebar"
                      />
                   </div>

                   {/* Action Panel */}
                   <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 space-y-3 shrink-0">
                      <FileUpload 
                        onFileSelect={handleFileSelect} 
                        disabled={isProcessing}
                        t={t}
                        mode="compact"
                      />

                      {/* CO4-008: Turnstile CAPTCHA widget */}
                      <TurnstileWidget
                        onToken={(token) => { captchaTokenRef.current = token; }}
                        onExpire={() => { captchaTokenRef.current = ''; }}
                      />
                      
                      {status === AppStatus.READY && (
                        <>
                          <button
                            onClick={handleGenerate}
                            disabled={isProcessing}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Sparkles className="w-5 h-5" />
                            GO! (Single)
                          </button>
                          <button
                            onClick={handleGenerateSet}
                            disabled={isProcessing}
                            className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl font-bold border border-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Layers className="w-4 h-4" />
                            {t('btn_generate_set')}
                          </button>
                        </>
                      )}

                      {status === AppStatus.ERROR && (
                        <button
                          onClick={handleGenerate}
                          disabled={isProcessing}
                          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold border border-red-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('btn_retry')}
                        </button>
                      )}
                   </div>
                </div>

                {/* MAIN STAGE: Preview & Result */}
                <div className="flex-1 bg-gray-100 rounded-3xl border border-gray-200 shadow-inner overflow-hidden relative flex flex-col">
                   
                   <div className="absolute top-4 left-4 z-10 flex gap-2">
                      <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-500 shadow-sm border border-gray-200">
                        {status === AppStatus.EDITING ? 'Editing' : 
                         status === AppStatus.PROCESSING ? 'Processing' : 
                         status === AppStatus.SUCCESS ? 'Result' : 'Preview'}
                      </span>
                   </div>

                   <div className="flex-1 flex items-center justify-center p-4 lg:p-8 overflow-auto">
                      
                      {status === AppStatus.EDITING && rawImage && (
                         <div className="w-full max-w-xl">
                            <ImageEditor 
                              imageSrc={rawImage}
                              onConfirm={handleEditConfirm}
                              onCancel={() => {
                                 setRawImage(null);
                                 setStatus(AppStatus.IDLE);
                              }}
                              t={t}
                            />
                         </div>
                      )}

                      {status === AppStatus.READY && processedImage && (
                        <div className="relative group">
                           <div className="bg-white p-2 rounded-xl shadow-lg border border-gray-200">
                              <div className="transparent-grid rounded-lg overflow-hidden">
                                <img src={processedImage} alt="Ready" className="max-h-[500px] object-contain" />
                              </div>
                           </div>
                           <button 
                              onClick={() => setStatus(AppStatus.EDITING)}
                              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-600"
                           >
                              <RefreshCw className="w-4 h-4" />
                           </button>
                        </div>
                      )}

                      {isProcessing && (
                         <ProcessingView t={t} />
                      )}

                      {status === AppStatus.SUCCESS && generatedImage && (
                         <ResultDisplay 
                            imageUrl={generatedImage} 
                            style={selectedStyle} 
                            onReset={handleReset} 
                            onReuse={handleReuse}
                            onImageUpdate={handleImageUpdate}
                            t={t}
                            stylesTranslation={TRANSLATIONS[language].styles}
                         />
                      )}

                      {status === AppStatus.SET_SUCCESS && generatedSet.length > 0 && (
                         <StickerSetView 
                            stickers={generatedSet}
                            style={selectedStyle}
                            onReset={handleReset}
                            t={t}
                            stylesTranslation={TRANSLATIONS[language].styles}
                         />
                      )}

                      {status === AppStatus.ERROR && errorMessage && (
                         <div className="text-center p-8 max-w-md">
                            <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                               <AlertCircle className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('error_header')}</h3>
                            <p className="text-gray-600">{errorMessage}</p>
                         </div>
                      )}
                   </div>
                </div>
              </div>
            )}

            {/* --- IDLE / WELCOME STATE --- */}
            {(status === AppStatus.IDLE && view === 'create') && (
              <div className="max-w-2xl mx-auto text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-3">{t('welcome_title')}</h2>
                <p className="text-gray-600 mb-8">
                  {t('welcome_desc')} <strong>{t('welcome_default_style')}</strong>
                </p>
                <div className="mb-8">
                  <StyleSelector 
                    selectedStyle={selectedStyle} 
                    onSelect={handleStyleSelect} 
                    disabled={false}
                    t={t}
                    stylesTranslation={TRANSLATIONS[language].styles}
                    mode="grid"
                  />
                </div>
                <FileUpload 
                  onFileSelect={handleFileSelect} 
                  disabled={false}
                  t={t}
                  mode="full"
                />
              </div>
            )}

            {view === 'gallery' && (
              <Gallery 
                onStyleSelect={handleGallerySelect}
                t={t}
              />
            )}

            {view === 'history' && (
              <StickerHistory 
                history={history}
                onDelete={deleteFromHistory}
                t={t}
              />
            )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400">{t('footer')}</footer>
    </div>
  );
};

export default App;
