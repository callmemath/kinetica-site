import { createContext, useContext, type ReactNode } from 'react';
import { useToast, type UseToastReturn } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

interface ToastProviderProps {
  children: ReactNode;
}

const ToastContext = createContext<UseToastReturn | undefined>(undefined);

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer 
        toasts={toastMethods.toasts} 
        onRemoveToast={toastMethods.removeToast} 
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
