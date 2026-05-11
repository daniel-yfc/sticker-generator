import React from 'react';
import Header from './components/Header';
import StyleSelector from './components/StyleSelector';
import FileUpload from './components/FileUpload';
import ProcessingView from './components/ProcessingView';
import ResultDisplay from './components/ResultDisplay';
import Button from './components/Button';
import Button from './components/Button';
import Gallery from './components/Gallery';
import StickerHistory from './components/StickerHistory';
import ImageEditor from './components/ImageEditor';
import StickerSetView from './components/StickerSetView';
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
                      
                      {status === AppStatus.READY && (
                        <>
                          <Button
                            onClick={handleGenerate}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-5 h-5" />
                            GO! (Single)
                          </Button>
                          <Button
                            onClick={handleGenerateSet}
                            variant="outline"
                            className="w-full py-3"
                          >
                            <Layers className="w-4 h-4" />
                            {t('btn_generate_set')}
                          </Button>
                        </>
                      )}

                      {status === AppStatus.ERROR && (
                        <Button
                          onClick={handleGenerate}
                          variant="danger"
                          className="w-full py-3"
                        >
                          <RefreshCw className="w-4 h-4" />
                          {t('btn_retry')}
                        </Button>
                      )}
                   </div>
                </div>

                {/* MAIN STAGE: Preview & Result */}
                <div className="flex-1 bg-gray-100 rounded-3xl border border-gray-200 shadow-inner overflow-hidden relative flex flex-col">
                   
                   {/* Stage Header/Tabs (Optional, maybe just title) */}
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
                           <Button
                              onClick={() => setStatus(AppStatus.EDITING)}
                              className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md hover:bg-gray-50 text-gray-600"
                           >
                              <RefreshCw className="w-4 h-4" />
                           </Button>
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

            {/* --- LANDING LAYOUT (Idle State) --- */}
            {(status === AppStatus.IDLE && view === 'create') && (
               <div className="max-w-3xl mx-auto space-y-12 animate-fadeIn">
                 
                 {/* Hero Section */}
                 <div className="text-center space-y-6 pt-8">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
                      Turn Photos into <br/>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                        Amazing Stickers
                      </span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                      {t('welcome_desc')}
                    </p>
                 </div>

                 {/* Hero Upload */}
                 <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-indigo-50 p-2 transform hover:scale-[1.01] transition-transform duration-300">
                    <FileUpload 
                      onFileSelect={handleFileSelect} 
                      disabled={false}
                      t={t}
                      mode="hero"
                    />
                 </div>

                 {/* Quick Style Preview (Teaser) */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="font-bold text-gray-400 uppercase tracking-wider text-sm">Popular Styles</h3>
                       <Button onClick={() => setView('gallery')} className="text-indigo-600 font-bold text-sm hover:underline">View All</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       {STYLES.slice(0, 4).map(style => (
                          <div key={style.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-lg ${style.previewColor}`}></div>
                             <div className="text-xs font-bold text-gray-700">{TRANSLATIONS[language].styles[style.id].name}</div>
                          </div>
                       ))}
                    </div>
                 </div>
               </div>
            )}
            
            {/* --- OTHER VIEWS (Gallery / History) --- */}
            {view === 'gallery' && (
              <Gallery 
                onSelectStyle={handleGallerySelect} 
                t={t}
                stylesTranslation={TRANSLATIONS[language].styles}
              />
            )}

            {view === 'history' && (
              <div className="space-y-10 animate-fadeIn">
                {/* ... existing history header ... */}
                <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col md:flex-row items-center gap-6">
                  <div className="bg-white/20 p-4 rounded-2xl">
                     <Layers className="w-12 h-12" />
                  </div>
                  <div className="text-center md:text-left">
                     <h2 className="text-3xl font-bold">{t('history_title')}</h2>
                     <p className="text-indigo-100 mt-1">{t('history_subtitle')}</p>
                  </div>
                  <Button
                    onClick={() => setView('create')}
                    className="md:ml-auto bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg"
                  >
                    + {t('nav_create')}
                  </Button>
                </div>
                <StickerHistory 
                  history={history} 
                  onDelete={deleteFromHistory} 
                  t={t}
                  stylesTranslation={TRANSLATIONS[language].styles}
                />
              </div>
            )}
      </main>

      <footer className="bg-white border-t border-gray-100 py-10 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex justify-center gap-4 mb-4">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Sticker className="w-6 h-6" />
             </div>
          </div>
          <p className="text-gray-400 text-sm">{t('footer')}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
