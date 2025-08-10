import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Edit, Trash2, AlertTriangle } from 'lucide-react';
import type { StaffBlock, StaffBlockFormData } from '../../types';

interface StaffBlockModalProps {
  block: StaffBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (blockId: string, data: StaffBlockFormData) => Promise<void>;
  onDelete: (blockId: string) => Promise<void>;
  mode: 'view' | 'edit';
}

const StaffBlockModal: React.FC<StaffBlockModalProps> = ({
  block,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  mode: initialMode
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState<StaffBlockFormData>({
    startDate: '',
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    type: 'VACATION',
    reason: ''
  });

  // Inizializza il form data quando il blocco cambia
  useEffect(() => {
    if (block) {
      setFormData({
        startDate: block.startDate.split('T')[0], // Estrae solo la data
        endDate: block.endDate.split('T')[0],
        startTime: block.startTime,
        endTime: block.endTime,
        type: block.type,
        reason: block.reason
      });
    }
  }, [block]);

  // Reset quando il modal si chiude
  useEffect(() => {
    if (!isOpen) {
      setMode(initialMode);
      setError(null);
      setIsLoading(false);
      setIsAnimating(false);
    } else {
      // Attiva l'animazione di entrata
      setIsAnimating(true);
    }
  }, [isOpen, initialMode]);

  // Gestione chiusura animata
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  if (!isOpen || !block) return null;

  const getBlockTypeLabel = (type: string) => {
    const types = {
      VACATION: 'Vacanza',
      SICK_LEAVE: 'Malattia',
      TRAINING: 'Formazione',
      OTHER: 'Altro'
    };
    return types[type as keyof typeof types] || type;
  };

  const getBlockTypeColor = (type: string) => {
    const colors = {
      VACATION: 'bg-blue-100 text-blue-800 border-blue-200',
      SICK_LEAVE: 'bg-red-100 text-red-800 border-red-200',
      TRAINING: 'bg-green-100 text-green-800 border-green-200',
      OTHER: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5);
  };

  const calculateDuration = () => {
    const start = new Date(block.startDate);
    const end = new Date(block.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 per includere il giorno di inizio
    return diffDays;
  };

  const handleSave = async () => {
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      setError('Compila tutti i campi obbligatori');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('La data di fine deve essere successiva alla data di inizio');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onUpdate(block.id, formData);
      // Chiudi automaticamente il modal dopo il salvataggio
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'aggiornamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onDelete(block.id);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore durante l\'eliminazione');
    } finally {
      setIsLoading(false);
    }
  };

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
        className={`bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isAnimating 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {mode === 'edit' ? 'Modifica Blocco Orario' : 'Dettagli Blocco Orario'}
              </h2>
              <p className="text-sm text-gray-500">
                Creato il {formatDate(block.createdAt || new Date().toISOString())}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {mode === 'view' ? (
            // Modalità visualizzazione
            <div className="space-y-4">
              {/* Tipo di blocco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo di Blocco
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBlockTypeColor(block.type)}`}>
                  {getBlockTypeLabel(block.type)}
                </span>
              </div>

              {/* Periodo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Inizio
                  </label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(block.startDate)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Fine
                  </label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{formatDate(block.endDate)}</span>
                  </div>
                </div>
              </div>

              {/* Orari */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Inizio
                  </label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatTime(block.startTime)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Fine
                  </label>
                  <div className="flex items-center space-x-2 text-gray-900">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{formatTime(block.endTime)}</span>
                  </div>
                </div>
              </div>

              {/* Durata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durata
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <span className="text-blue-800 font-medium">
                    {calculateDuration()} {calculateDuration() === 1 ? 'giorno' : 'giorni'}
                  </span>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <p className="text-gray-800">{block.reason}</p>
                </div>
              </div>
            </div>
          ) : (
            // Modalità modifica
            <div className="space-y-4">
              {/* Tipo di blocco */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo di Blocco *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="VACATION">Vacanza</option>
                  <option value="SICK_LEAVE">Malattia</option>
                  <option value="TRAINING">Formazione</option>
                  <option value="OTHER">Altro</option>
                </select>
              </div>

              {/* Periodo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Inizio *
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Fine *
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Orari */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Inizio
                  </label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Per blocchi multigiorno: ora di inizio del primo giorno
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ora Fine
                  </label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Per blocchi multigiorno: ora di fine dell'ultimo giorno
                  </p>
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Descrivi il motivo del blocco orario..."
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          {mode === 'view' ? (
            <div className="flex space-x-3">
              <button
                onClick={() => setMode('edit')}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Edit className="h-4 w-4 mr-2" />
                Modifica
              </button>
              
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isLoading ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          ) : (
            <div className="flex justify-between w-full">
              <button
                onClick={() => setMode('view')}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annulla
              </button>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Elimina
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Salvataggio...' : 'Salva Modifiche'}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleClose}
            disabled={isLoading}
            className="ml-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffBlockModal;
