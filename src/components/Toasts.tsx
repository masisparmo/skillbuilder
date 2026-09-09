import React from 'react';
import { CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const Toasts = () => {
  const { toasts } = useAppContext();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'warning': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getColors = (type: string) => {
    switch (type) {
      case 'success': return 'bg-emerald-950/90 text-emerald-200 border-emerald-500';
      case 'error': return 'bg-rose-950/90 text-rose-200 border-rose-500';
      case 'warning': return 'bg-amber-950/90 text-amber-200 border-amber-500';
      default: return 'bg-slate-900/90 text-slate-200 border-brand-500';
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast: any) => (
        <div key={toast.id} className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-xl text-xs backdrop-blur-md transition-all duration-300 pointer-events-auto',
          getColors(toast.type)
        )}>
          {getIcon(toast.type)}
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};
