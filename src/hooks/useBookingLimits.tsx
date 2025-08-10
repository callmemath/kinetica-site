import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import type { BookingLimits } from '../services/api';

export const useBookingLimits = () => {
  const [limits, setLimits] = useState<BookingLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getBookingLimits();
      
      if (response.success && response.data) {
        setLimits(response.data);
      } else {
        throw new Error(response.message || 'Errore nel recupero dei limiti di prenotazione');
      }
    } catch (err: any) {
      console.error('Error fetching booking limits:', err);
      setError(err.message || 'Errore nel recupero dei limiti di prenotazione');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  /**
   * Verifica se una data è valida per le prenotazioni
   */
  const isDateValid = (date: Date): { valid: boolean; reason?: string } => {
    if (!limits) return { valid: false, reason: 'Limiti di prenotazione non disponibili' };

    if (!limits.allowOnlineBooking) {
      return { valid: false, reason: 'Le prenotazioni online non sono attualmente consentite' };
    }

    const minDate = new Date(limits.minDate);
    const maxDate = new Date(limits.maxDate);

    if (date < minDate) {
      return { valid: false, reason: 'Data troppo vicina, seleziona una data successiva' };
    }

    if (date > maxDate) {
      return { valid: false, reason: 'Data troppo lontana, seleziona una data precedente' };
    }

    return { valid: true };
  };

  /**
   * Ottiene il range di date valide per il date picker
   */
  const getValidDateRange = () => {
    if (!limits) return { min: undefined, max: undefined };

    return {
      min: limits.minDate,
      max: limits.maxDate
    };
  };

  /**
   * Formatta il messaggio informativo sui limiti
   */
  const getLimitsMessage = (): string => {
    if (!limits) return 'Caricamento limiti di prenotazione...';
    return limits.message;
  };

  return {
    limits,
    loading,
    error,
    refresh: fetchLimits,
    isDateValid,
    getValidDateRange,
    getLimitsMessage,
    isOnlineBookingAllowed: limits?.allowOnlineBooking ?? false
  };
};

export default useBookingLimits;
