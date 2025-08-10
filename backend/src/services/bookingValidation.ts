import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface BookingSettings {
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  cancellationHours: number;
  allowOnlineBooking: boolean;
}

/**
 * Ottiene le impostazioni di prenotazione dal database
 */
export async function getBookingSettings(): Promise<BookingSettings> {
  try {
    const settings = await prisma.studioSettings.findFirst();
    
    if (!settings || !settings.bookingSettings) {
      // Impostazioni predefinite se non trovate nel database
      return {
        maxAdvanceBookingDays: 60,
        minAdvanceBookingHours: 2,
        cancellationHours: 24,
        allowOnlineBooking: true
      };
    }

    return JSON.parse(settings.bookingSettings);
  } catch (error) {
    console.error('Errore nel recupero delle impostazioni di prenotazione:', error);
    // Ritorna impostazioni predefinite in caso di errore
    return {
      maxAdvanceBookingDays: 60,
      minAdvanceBookingHours: 2,
      cancellationHours: 24,
      allowOnlineBooking: true
    };
  }
}

/**
 * Verifica se le prenotazioni online sono consentite
 */
export async function isOnlineBookingAllowed(): Promise<boolean> {
  const settings = await getBookingSettings();
  return settings.allowOnlineBooking;
}

/**
 * Calcola la data massima per le prenotazioni in anticipo
 */
export async function getMaxBookingDate(): Promise<Date> {
  const settings = await getBookingSettings();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + settings.maxAdvanceBookingDays);
  return maxDate;
}

/**
 * Calcola la data minima per le prenotazioni
 */
export async function getMinBookingDate(): Promise<Date> {
  const settings = await getBookingSettings();
  const minDate = new Date();
  minDate.setHours(minDate.getHours() + settings.minAdvanceBookingHours);
  return minDate;
}

/**
 * Verifica se una data di prenotazione è valida
 */
export async function isValidBookingDate(bookingDate: Date): Promise<{
  isValid: boolean;
  reason?: string;
}> {
  const settings = await getBookingSettings();
  const now = new Date();
  
  // Verifica se le prenotazioni online sono consentite
  if (!settings.allowOnlineBooking) {
    return {
      isValid: false,
      reason: 'Le prenotazioni online non sono attualmente consentite. Contatta direttamente lo studio.'
    };
  }

  // Verifica data minima (ore minime in anticipo)
  const minDate = await getMinBookingDate();
  if (bookingDate < minDate) {
    return {
      isValid: false,
      reason: `La prenotazione deve essere effettuata almeno ${settings.minAdvanceBookingHours} ore in anticipo.`
    };
  }

  // Verifica data massima (giorni massimi in anticipo)
  const maxDate = await getMaxBookingDate();
  if (bookingDate > maxDate) {
    return {
      isValid: false,
      reason: `Non è possibile prenotare oltre ${settings.maxAdvanceBookingDays} giorni in anticipo.`
    };
  }

  // Verifica che la data non sia nel passato
  if (bookingDate < now) {
    return {
      isValid: false,
      reason: 'Non è possibile prenotare per una data passata.'
    };
  }

  return { isValid: true };
}

/**
 * Verifica se una prenotazione può essere cancellata gratuitamente
 */
export async function canCancelFree(bookingDate: Date): Promise<{
  canCancel: boolean;
  reason?: string;
  hoursRemaining?: number;
}> {
  const settings = await getBookingSettings();
  const now = new Date();
  
  const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilBooking >= settings.cancellationHours) {
    return {
      canCancel: true,
      hoursRemaining: Math.floor(hoursUntilBooking)
    };
  }

  return {
    canCancel: false,
    reason: `La cancellazione gratuita è consentita solo fino a ${settings.cancellationHours} ore prima dell'appuntamento.`,
    hoursRemaining: Math.floor(hoursUntilBooking)
  };
}

/**
 * Ottiene le date disponibili per le prenotazioni nel prossimo periodo
 */
export async function getAvailableBookingDates(): Promise<{
  minDate: Date;
  maxDate: Date;
  allowOnlineBooking: boolean;
}> {
  const settings = await getBookingSettings();
  
  return {
    minDate: await getMinBookingDate(),
    maxDate: await getMaxBookingDate(),
    allowOnlineBooking: settings.allowOnlineBooking
  };
}

/**
 * Formatta un messaggio informativo sui limiti di prenotazione
 */
export async function getBookingLimitsMessage(): Promise<string> {
  const settings = await getBookingSettings();
  
  if (!settings.allowOnlineBooking) {
    return 'Le prenotazioni online non sono attualmente disponibili. Ti preghiamo di contattare direttamente lo studio.';
  }

  const parts = [];
  
  if (settings.minAdvanceBookingHours > 0) {
    if (settings.minAdvanceBookingHours < 24) {
      parts.push(`almeno ${settings.minAdvanceBookingHours} ore di anticipo`);
    } else {
      const days = Math.floor(settings.minAdvanceBookingHours / 24);
      const hours = settings.minAdvanceBookingHours % 24;
      if (hours === 0) {
        parts.push(`almeno ${days} giorno${days > 1 ? 'i' : ''} di anticipo`);
      } else {
        parts.push(`almeno ${days} giorno${days > 1 ? 'i' : ''} e ${hours} ore di anticipo`);
      }
    }
  }
  
  if (settings.maxAdvanceBookingDays < 365) {
    parts.push(`massimo ${settings.maxAdvanceBookingDays} giorni in anticipo`);
  }
  
  let message = 'Puoi prenotare';
  if (parts.length > 0) {
    message += ' con ' + parts.join(' e ');
  }
  message += '.';
  
  if (settings.cancellationHours > 0) {
    message += ` Cancellazione gratuita fino a ${settings.cancellationHours} ore prima dell'appuntamento.`;
  }
  
  return message;
}
