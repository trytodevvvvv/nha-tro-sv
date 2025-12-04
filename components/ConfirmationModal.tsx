
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, CheckCircle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  type = 'danger',
}) => {
  if (!isOpen) return null;

  const getConfig = () => {
    switch (type) {
      case 'danger':
        return {
          bg: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
          button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200 dark:shadow-none',
          icon: <AlertTriangle size={24} />
        };
      case 'warning':
        return {
          bg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
          button: 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200 dark:shadow-none',
          icon: <AlertTriangle size={24} />
        };
      case 'success':
        return {
            bg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 dark:shadow-none',
            icon: <CheckCircle size={24} />
        };
      default:
        return {
          bg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          button: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none',
          icon: <Info size={24} />
        };
    }
  };

  const config = getConfig();

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-scale-in transform transition-all">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full flex-shrink-0 ${config.bg}`}>
              {config.icon}
            </div>
            <div className="flex-1 mt-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-750/50 p-4 flex justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-all shadow-sm hover:shadow"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 ${config.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
