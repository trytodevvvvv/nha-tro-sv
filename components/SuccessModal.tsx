import React from 'react';
import { createPortal } from 'react-dom';
import { Check, ArrowRight } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  buttonText = 'Tiếp tục' 
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center animate-bounce-in border border-gray-100 dark:border-gray-700 overflow-hidden">
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-green-50/50 to-transparent dark:from-green-900/10 pointer-events-none"></div>

        {/* Animated Icon */}
        <div className="relative mb-6 mx-auto w-20 h-20">
          <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-ping opacity-25"></div>
          <div className="relative w-full h-full bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center border-2 border-green-100 dark:border-green-800">
             <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                <Check className="text-white w-7 h-7 stroke-[3]" />
             </div>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">
          {title}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 font-medium mb-8 leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="group w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {buttonText}
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>,
    document.body
  );
};

export default SuccessModal;