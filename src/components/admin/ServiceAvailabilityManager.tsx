import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Plus, Trash2, Calendar } from 'lucide-react';
import type { ServiceAvailability } from '../../types';

interface ServiceAvailabilityManagerProps {
  availability: string;
  onChange: (availability: string) => void;
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lunedì', short: 'Lun' },
  { key: 'tuesday', label: 'Martedì', short: 'Mar' },
  { key: 'wednesday', label: 'Mercoledì', short: 'Mer' },
  { key: 'thursday', label: 'Giovedì', short: 'Gio' },
  { key: 'friday', label: 'Venerdì', short: 'Ven' },
  { key: 'saturday', label: 'Sabato', short: 'Sab' },
  { key: 'sunday', label: 'Domenica', short: 'Dom' }
];

const ServiceAvailabilityManager: React.FC<ServiceAvailabilityManagerProps> = ({
  availability,
  onChange
}) => {
  const [scheduleData, setScheduleData] = useState<ServiceAvailability>({});
  const isInitializing = useRef(true);

  // Inizializza i dati della disponibilità
  useEffect(() => {
    if (availability) {
      try {
        const parsed = JSON.parse(availability);
        setScheduleData(parsed);
      } catch (error) {
        console.error('Errore nel parsing della disponibilità:', error);
        setScheduleData({});
      }
    } else {
      // Inizializza con dati di default
      const defaultSchedule: ServiceAvailability = {};
      DAYS_OF_WEEK.forEach(day => {
        defaultSchedule[day.key] = {
          enabled: false,
          timeSlots: [{ start: '09:00', end: '18:00' }]
        };
      });
      setScheduleData(defaultSchedule);
    }
    isInitializing.current = false;
  }, [availability]);

  // Funzione per aggiornare i dati e notificare il parent
  const updateScheduleData = useCallback((newData: ServiceAvailability) => {
    setScheduleData(newData);
    if (!isInitializing.current) {
      onChange(JSON.stringify(newData));
    }
  }, [onChange]);

  const toggleDay = (dayKey: string) => {
    const newData = {
      ...scheduleData,
      [dayKey]: {
        ...scheduleData[dayKey],
        enabled: !scheduleData[dayKey]?.enabled
      }
    };
    updateScheduleData(newData);
  };

  const addTimeSlot = (dayKey: string) => {
    const newData = {
      ...scheduleData,
      [dayKey]: {
        ...scheduleData[dayKey],
        timeSlots: [
          ...(scheduleData[dayKey]?.timeSlots || []),
          { start: '09:00', end: '10:00' }
        ]
      }
    };
    updateScheduleData(newData);
  };

  const removeTimeSlot = (dayKey: string, slotIndex: number) => {
    const newData = {
      ...scheduleData,
      [dayKey]: {
        ...scheduleData[dayKey],
        timeSlots: scheduleData[dayKey]?.timeSlots.filter((_, index) => index !== slotIndex) || []
      }
    };
    updateScheduleData(newData);
  };

  const updateTimeSlot = (dayKey: string, slotIndex: number, field: 'start' | 'end', value: string) => {
    const newData = {
      ...scheduleData,
      [dayKey]: {
        ...scheduleData[dayKey],
        timeSlots: scheduleData[dayKey]?.timeSlots.map((slot, index) => 
          index === slotIndex ? { ...slot, [field]: value } : slot
        ) || []
      }
    };
    updateScheduleData(newData);
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceData = scheduleData[sourceDay];
    if (!sourceData) return;

    const newData = { ...scheduleData };
    DAYS_OF_WEEK.forEach(day => {
      if (day.key !== sourceDay) {
        newData[day.key] = {
          enabled: sourceData.enabled,
          timeSlots: [...sourceData.timeSlots]
        };
      }
    });
    updateScheduleData(newData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium text-gray-900">
          Disponibilità per Prenotazioni
        </h3>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          <strong>Info:</strong> Imposta i giorni e gli orari in cui questo servizio può essere prenotato. 
          Gli utenti potranno prenotare solo negli orari qui specificati.
        </p>
      </div>

      <div className="space-y-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = scheduleData[day.key] || { enabled: false, timeSlots: [] };
          
          return (
            <div key={day.key} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`day-${day.key}`}
                    checked={dayData.enabled}
                    onChange={() => toggleDay(day.key)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`day-${day.key}`}
                    className={`text-sm font-medium ${dayData.enabled ? 'text-gray-900' : 'text-gray-500'}`}
                  >
                    {day.label}
                  </label>
                </div>

                {dayData.enabled && dayData.timeSlots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => copyToAllDays(day.key)}
                    className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50"
                  >
                    Copia a tutti
                  </button>
                )}
              </div>

              {dayData.enabled && (
                <div className="space-y-2">
                  {dayData.timeSlots.map((slot, slotIndex) => (
                    <div key={slotIndex} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                      <Clock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'start', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent w-20"
                      />
                      
                      <span className="text-xs text-gray-500">-</span>
                      
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => updateTimeSlot(day.key, slotIndex, 'end', e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-transparent w-20"
                      />

                      {dayData.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeSlot(day.key, slotIndex)}
                          className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => addTimeSlot(day.key)}
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-xs p-2 rounded hover:bg-blue-50 border border-dashed border-blue-200 hover:border-blue-300 w-full justify-center"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Aggiungi fascia</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Anteprima Disponibilità</h4>
        <div className="grid grid-cols-7 gap-1 text-xs">
          {DAYS_OF_WEEK.map((day) => {
            const dayData = scheduleData[day.key];
            return (
              <div key={day.key} className="text-center">
                <div className={`font-medium text-xs ${dayData?.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {day.short}
                </div>
                {dayData?.enabled && dayData.timeSlots.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayData.timeSlots.slice(0, 2).map((slot, idx) => (
                      <div key={idx} className="text-gray-600 bg-green-100 rounded px-1 text-xs">
                        {slot.start.slice(0, 5)}-{slot.end.slice(0, 5)}
                      </div>
                    ))}
                    {dayData.timeSlots.length > 2 && (
                      <div className="text-gray-500 text-xs">+{dayData.timeSlots.length - 2}</div>
                    )}
                  </div>
                )}
                {dayData?.enabled && dayData.timeSlots.length === 0 && (
                  <div className="text-gray-400 mt-1 text-xs">Vuoto</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ServiceAvailabilityManager;
