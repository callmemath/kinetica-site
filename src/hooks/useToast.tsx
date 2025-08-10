import { useState, useCallback } from 'react';
import { type ToastType, type ToastProps } from '../components/Toast';

export interface UseToastReturn {
  toasts: ToastProps[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => string;
  removeToast: (id: string) => void;
  showSuccess: (title: string, message?: string) => string;
  showError: (title: string, message?: string) => string;
  showWarning: (title: string, message?: string) => string;
  showInfo: (title: string, message?: string) => string;
  clearAll: () => void;
}

export const useToast = (): UseToastReturn => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((
    type: ToastType, 
    title: string, 
    message?: string, 
    duration = 5000
  ): string => {
    const id = Math.random().toString(36).substr(2, 9);
    
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration,
      onClose: removeToast,
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string) => {
    return addToast('success', title, message);
  }, [addToast]);

  const showError = useCallback((title: string, message?: string) => {
    return addToast('error', title, message, 7000); // Errori durano di più
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string) => {
    return addToast('warning', title, message);
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string) => {
    return addToast('info', title, message);
  }, [addToast]);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  return {
    toasts,
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearAll,
  };
};

export default useToast;
