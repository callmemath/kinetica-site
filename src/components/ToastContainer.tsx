import { createPortal } from 'react-dom';
import Toast, { type ToastProps } from './Toast';

interface ToastContainerProps {
  toasts: ToastProps[];
  onRemoveToast: (id: string) => void;
}

const ToastContainer = ({ toasts, onRemoveToast }: ToastContainerProps) => {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="absolute top-4 right-4 left-4 sm:left-auto space-y-3 sm:max-w-md sm:w-96">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={onRemoveToast}
          />
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ToastContainer;
