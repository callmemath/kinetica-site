import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  itemName?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(false);
      setIsAnimating(false);
    } else {
      setIsAnimating(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      await onConfirm();
      handleClose();
    } catch (error) {
      // L'errore viene gestito dal parent
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 z-50 transition-all duration-300 ${
        isAnimating 
          ? 'backdrop-blur-md bg-black/20' 
          : 'backdrop-blur-none bg-transparent pointer-events-none'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex-1">
            <p className="text-gray-700 mb-4">
              {message}
            </p>
            {itemName && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                <p className="text-sm font-medium text-gray-900">
                  {itemName}
                </p>
              </div>
            )}
            
            {/* Professional Warning Banner */}
            <div className={`bg-amber-50 border border-amber-200 rounded-xl p-4 mb-0 transition-all duration-400 delay-300 ${
              isAnimating ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
            }`}>
              <div className="flex items-center">
                <div className="p-2 bg-amber-100 rounded-full mr-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-amber-800 font-semibold text-sm">Operazione Irreversibile</p>
                  <p className="text-amber-700 text-xs mt-1">Questa azione non potrà essere annullata una volta confermata</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Annulla
          </button>
          
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {isLoading ? 'Eliminazione...' : 'Elimina Definitivamente'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
