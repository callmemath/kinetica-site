import React, { useState, useEffect } from 'react';
import { X, Clock, Save, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/api';
import { useToastContext } from '../../contexts/ToastContext';
import LoadingSpinner from '../LoadingSpinner';

interface WorkingHoursModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DaySchedule {
  isWorking: boolean;
  startTime: string;
  endTime: string;
}

interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

const defaultDaySchedule: DaySchedule = {
  isWorking: false,
  startTime: '09:00',
  endTime: '18:00'
};

const defaultWorkingHours: WorkingHours = {
  monday: { ...defaultDaySchedule, isWorking: true },
  tuesday: { ...defaultDaySchedule, isWorking: true },
  wednesday: { ...defaultDaySchedule, isWorking: true },
  thursday: { ...defaultDaySchedule, isWorking: true },
  friday: { ...defaultDaySchedule, isWorking: true },
  saturday: defaultDaySchedule,
  sunday: defaultDaySchedule
};

const dayNames = {
  monday: 'Lunedì',
  tuesday: 'Martedì',
  wednesday: 'Mercoledì',
  thursday: 'Giovedì',
  friday: 'Venerdì',
  saturday: 'Sabato',
  sunday: 'Domenica'
};

const WorkingHoursModal: React.FC<WorkingHoursModalProps> = ({ isOpen, onClose }) => {
  const { showSuccess, showError } = useToastContext();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);

  useEffect(() => {
    if (isOpen) {
      loadWorkingHours();
    }
  }, [isOpen]);

  const loadWorkingHours = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getMyWorkingHours();
      
      if (response.success && response.data) {
        setStaffName(`${response.data.firstName} ${response.data.lastName}`);
        
        // Merge dei dati esistenti con quelli di default
        const existingHours = response.data.workingHours || {};
        const mergedHours = { ...defaultWorkingHours };
        
        Object.keys(mergedHours).forEach(day => {
          if (existingHours[day]) {
            mergedHours[day as keyof WorkingHours] = {
              ...mergedHours[day as keyof WorkingHours],
              ...existingHours[day]
            };
          }
        });
        
        setWorkingHours(mergedHours);
      }
    } catch (error) {
      console.error('Error loading working hours:', error);
      showError('Errore', 'Impossibile caricare gli orari di lavoro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDayToggle = (day: keyof WorkingHours) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isWorking: !prev[day].isWorking
      }
    }));
  };

  const handleTimeChange = (day: keyof WorkingHours, field: 'startTime' | 'endTime', value: string) => {
    setWorkingHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Validazione orari
      for (const [day, schedule] of Object.entries(workingHours)) {
        if (schedule.isWorking) {
          if (!schedule.startTime || !schedule.endTime) {
            showError('Errore', `Orari mancanti per ${dayNames[day as keyof typeof dayNames]}`);
            return;
          }
          
          if (schedule.startTime >= schedule.endTime) {
            showError('Errore', `Orario di fine deve essere successivo a quello di inizio per ${dayNames[day as keyof typeof dayNames]}`);
            return;
          }
        }
      }
      
      const response = await apiService.updateMyWorkingHours(workingHours);
      
      if (response.success) {
        showSuccess('Successo', 'Orari di lavoro aggiornati con successo');
        onClose();
      } else {
        throw new Error(response.message || 'Errore nel salvataggio');
      }
    } catch (error: any) {
      console.error('Error saving working hours:', error);
      showError('Errore', error.message || 'Impossibile salvare gli orari di lavoro');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                I Miei Orari di Lavoro
              </h2>
              {staffName && (
                <p className="text-sm text-gray-600 mt-1">{staffName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(workingHours).map(([day, schedule]) => (
                <div key={day} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={`working-${day}`}
                        checked={schedule.isWorking}
                        onChange={() => handleDayToggle(day as keyof WorkingHours)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`working-${day}`}
                        className="text-sm font-medium text-gray-900"
                      >
                        {dayNames[day as keyof typeof dayNames]}
                      </label>
                    </div>
                    <div className="text-xs text-gray-500">
                      {schedule.isWorking ? 'Lavorativo' : 'Riposo'}
                    </div>
                  </div>

                  {schedule.isWorking && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Inizio
                        </label>
                        <input
                          type="time"
                          value={schedule.startTime}
                          onChange={(e) => handleTimeChange(day as keyof WorkingHours, 'startTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Fine
                        </label>
                        <input
                          type="time"
                          value={schedule.endTime}
                          onChange={(e) => handleTimeChange(day as keyof WorkingHours, 'endTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
            <button
              onClick={loadWorkingHours}
              disabled={isSaving || isLoading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Ricarica</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Salva Orari</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkingHoursModal;
