import { useEffect, useState, type FC } from 'react';
import { Loader2 } from 'lucide-react';

interface ProcessingViewProps {
  t: (key: string) => any; // Keep 'any' here or use union because 'processing_steps' returns an array of strings
}

const ProcessingView: FC<ProcessingViewProps> = ({ t }) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const steps = t('processing_steps');

  useEffect(() => {
    // 1. More balanced progress bar simulation
    // Aims for a 15-20s "average" wait time feel, slowing down naturally
    const interval = setInterval(() => {
      setProgress((prev) => {
        // First phase: Rapid setup (0-30%)
        if (prev < 30) return prev + 0.6;
        // Second phase: Heavy lifting / API wait (30-70%) - This is the "average" duration
        if (prev < 70) return prev + 0.15;
        // Third phase: Finalizing / Image rendering (70-92%)
        if (prev < 92) return prev + 0.05;
        // Fourth phase: Asymptotic creep to 99% (92-99%)
        if (prev < 99) return prev + 0.01;
        return prev;
      });
    }, 100);

    // 2. Map progress thresholds to human-readable steps more evenly
    const stepInterval = setInterval(() => {
      setProgress(p => {
        if (p < 20) setCurrentStepIndex(0);
        else if (p < 50) setCurrentStepIndex(1);
        else if (p < 80) setCurrentStepIndex(2);
        else setCurrentStepIndex(3);
        return p;
      });
    }, 300);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8 max-w-md mx-auto animate-fadeIn">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-200 rounded-full blur-2xl opacity-40 animate-pulse"></div>
        <div className="relative bg-white p-6 rounded-3xl shadow-xl border border-indigo-50">
          <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-5 w-full px-4">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">{t('processing_title')}</h3>
          <div className="min-h-[1.5rem]">
            <p className="text-indigo-600 font-medium text-sm transition-all duration-700">
              {steps[currentStepIndex]}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-100 shadow-inner relative">
            <div 
              className="h-full bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            >
              {/* Animated Stripes */}
              <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
             <span>Analyzing</span>
             <span className="text-indigo-500">{Math.floor(progress)}%</span>
             <span>Finalizing</span>
          </div>
        </div>
        
        <p className="text-gray-400 text-xs italic px-6">
          {progress > 80 ? "正在渲染最終像素並應用透明遮罩..." : "AI 正在理解照片細節並轉換風格，請放鬆等候。"}
        </p>
      </div>

      <style>{`
        @keyframes slide {
          from { background-position: 0 0; }
          to { background-position: 20px 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ProcessingView;
