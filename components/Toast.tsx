
import React, { useEffect, useState } from 'react';
import { Check, X, AlertOctagon, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setMounted(true));

    const timer = setTimeout(() => {
      handleClose();
    }, 4000); // Auto close after 4s

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 400); // Wait for exit animation
  };

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <Check size={18} strokeWidth={3} className="text-white" />,
          containerClass: 'bg-emerald-900/90 border-emerald-500/30 text-emerald-50 shadow-emerald-900/20',
          iconContainer: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]',
          title: 'Thành công'
        };
      case 'error':
        return {
          icon: <AlertOctagon size={18} strokeWidth={3} className="text-white" />,
          containerClass: 'bg-rose-950/90 border-rose-500/30 text-rose-50 shadow-rose-900/20',
          iconContainer: 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.4)]',
          title: 'Lỗi'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} strokeWidth={3} className="text-white" />,
          containerClass: 'bg-amber-950/90 border-amber-500/30 text-amber-50 shadow-amber-900/20',
          iconContainer: 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
          title: 'Cảnh báo'
        };
      default:
        return {
          icon: <Info size={18} strokeWidth={3} className="text-white" />,
          containerClass: 'bg-slate-900/90 border-slate-500/30 text-slate-50 shadow-slate-900/20',
          iconContainer: 'bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.4)]',
          title: 'Thông báo'
        };
    }
  };

  const config = getConfig();

  return (
    <div 
      className={`
        relative flex items-center gap-4 p-4 pr-10 rounded-2xl shadow-2xl border backdrop-blur-xl
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] transform origin-top-right min-w-[320px] max-w-sm overflow-hidden group cursor-pointer
        ${config.containerClass}
        ${mounted && !isExiting ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-12 opacity-0 scale-95'}
      `}
      onClick={handleClose}
    >
      {/* Glossy Reflection Effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>

      {/* Icon */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.iconContainer} transition-transform group-hover:scale-110 duration-300`}>
        {config.icon}
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold tracking-wide leading-none mb-1.5 opacity-90">{config.title}</h4>
        <p className="text-sm font-medium opacity-80 leading-snug break-words">{toast.message}</p>
      </div>

      {/* Close Button (Hidden by default, shown slightly on hover, or imply click to dismiss) */}
      <button 
        onClick={(e) => { e.stopPropagation(); handleClose(); }}
        className="absolute top-2 right-2 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default Toast;
