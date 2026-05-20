import React from 'react';

interface LoadingScreenProps {
  message?: string;
  isAbsolute?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Loading data...", 
  isAbsolute = false 
}) => {
  const containerClasses = isAbsolute 
    ? "absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
    : "flex-1 flex flex-col items-center justify-center min-h-[400px] bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm";

  return (
    <div className={containerClasses}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
