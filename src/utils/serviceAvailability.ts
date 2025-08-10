import type { ServiceAvailability } from '../types';

// Mapping giorni della settimana per JavaScript Date
const DAY_MAPPING = {
  0: 'sunday',    // Domenica
  1: 'monday',    // Lunedì
  2: 'tuesday',   // Martedì
  3: 'wednesday', // Mercoledì
  4: 'thursday',  // Giovedì
  5: 'friday',    // Venerdì
  6: 'saturday'   // Sabato
};

/**
 * Verifica se un servizio è disponibile in una data e orario specifici
 */
export const isServiceAvailable = (
  serviceAvailability: string | undefined,
  date: Date | string,
  startTime: string,
  endTime: string
): boolean => {
  // Se non c'è configurazione di disponibilità, il servizio NON è disponibile
  if (!serviceAvailability || serviceAvailability.trim() === '') {
    return false;
  }

  try {
    const availability: ServiceAvailability = JSON.parse(serviceAvailability);
    const bookingDate = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = bookingDate.getDay();
    const dayKey = DAY_MAPPING[dayOfWeek as keyof typeof DAY_MAPPING];

    // Controlla se il giorno è abilitato
    const dayConfig = availability[dayKey];
    if (!dayConfig || !dayConfig.enabled) {
      return false;
    }

    // Se non ci sono fasce orarie definite, non è disponibile
    if (!dayConfig.timeSlots || dayConfig.timeSlots.length === 0) {
      return false;
    }

    // Converte gli orari in minuti per facilitare il confronto
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const bookingStart = timeToMinutes(startTime);
    const bookingEnd = timeToMinutes(endTime);

    // Verifica se l'orario della prenotazione rientra in almeno una fascia disponibile
    return dayConfig.timeSlots.some(slot => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);
      
      // L'orario della prenotazione deve essere completamente contenuto nella fascia
      return bookingStart >= slotStart && bookingEnd <= slotEnd;
    });

  } catch (error) {
    console.error('Errore nel parsing della disponibilità del servizio:', error);
    // In caso di errore nel parsing, considera il servizio non disponibile per sicurezza
    return false;
  }
};

/**
 * Ottiene tutti gli orari disponibili per un servizio in una data specifica
 */
export const getAvailableTimeSlotsForService = (
  serviceAvailability: string | undefined,
  date: Date | string,
  serviceDuration: number = 60 // Durata in minuti
): string[] => {
  // Se non c'è configurazione, il servizio non ha orari disponibili
  if (!serviceAvailability || serviceAvailability.trim() === '') {
    return [];
  }

  try {
    const availability: ServiceAvailability = JSON.parse(serviceAvailability);
    const bookingDate = typeof date === 'string' ? new Date(date) : date;
    const dayOfWeek = bookingDate.getDay();
    const dayKey = DAY_MAPPING[dayOfWeek as keyof typeof DAY_MAPPING];

    const dayConfig = availability[dayKey];
    if (!dayConfig || !dayConfig.enabled || !dayConfig.timeSlots) {
      return [];
    }

    // Genera gli orari disponibili per tutte le fasce del giorno
    const availableSlots: string[] = [];
    
    dayConfig.timeSlots.forEach(slot => {
      const slotsForRange = generateTimeSlots(slot.start, slot.end, serviceDuration);
      availableSlots.push(...slotsForRange);
    });

    // Rimuove duplicati e ordina
    return [...new Set(availableSlots)].sort();

  } catch (error) {
    console.error('Errore nel parsing della disponibilità del servizio:', error);
    // In caso di errore nel parsing, non restituisce slot disponibili per sicurezza
    return [];
  }
};

/**
 * Genera slot temporali in base a start, end e durata
 * Ora genera slot ogni 30 minuti indipendentemente dalla durata del servizio
 */
const generateTimeSlots = (startTime: string, endTime: string, duration: number): string[] => {
  const slots: string[] = [];
  
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  // Genera slot ogni 30 minuti, controllando che ci sia tempo sufficiente per il servizio
  for (let current = start; current + duration <= end; current += 30) {
    slots.push(minutesToTime(current));
  }

  return slots;
};

/**
 * Calcola l'orario di fine in base all'orario di inizio e durata
 */
export const calculateEndTime = (startTime: string, duration: number): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + duration;
  
  const endHours = Math.floor(endMinutes / 60);
  const endMins = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
};
