import { Router } from 'express';
import { prisma } from '../utils/database';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  isValidBookingDate, 
  isOnlineBookingAllowed, 
  getBookingLimitsMessage 
} from '../services/bookingValidation';
import { EmailService } from '../services/EmailService';

const router = Router();
const emailService = new EmailService();

// GET /api/bookings/limits - Ottieni i limiti di prenotazione
router.get('/limits', async (req, res) => {
  try {
    const { 
      getAvailableBookingDates, 
      getBookingLimitsMessage 
    } = await import('../services/bookingValidation');
    
    const limits = await getAvailableBookingDates();
    const message = await getBookingLimitsMessage();

    res.json({
      success: true,
      data: {
        ...limits,
        message
      }
    });
  } catch (error) {
    console.error('Error fetching booking limits:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei limiti di prenotazione'
    });
  }
});

// Schema di validazione per la creazione di una prenotazione
const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID è richiesto'),
  staffId: z.string().min(1, 'Staff ID è richiesto'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve essere in formato YYYY-MM-DD'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Orario deve essere in formato HH:MM'),
  notes: z.string().optional()
});

// GET /api/bookings - Ottieni le prenotazioni dell'utente
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        service: true,
        staff: true
      },
      orderBy: [
        { date: 'desc' },
        { startTime: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle prenotazioni'
    });
  }
});

// POST /api/bookings - Crea una nuova prenotazione
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Verifica se le prenotazioni online sono consentite
    const onlineBookingAllowed = await isOnlineBookingAllowed();
    if (!onlineBookingAllowed) {
      const limitsMessage = await getBookingLimitsMessage();
      return res.status(403).json({
        success: false,
        message: limitsMessage
      });
    }

    const validation = createBookingSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: validation.error.errors
      });
    }

    const { serviceId, staffId, date, startTime, notes } = validation.data;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Crea la data completa per la validazione
    const [validationHours, validationMinutes] = startTime.split(':').map(Number);
    const bookingDateTime = new Date(date);
    bookingDateTime.setHours(validationHours, validationMinutes, 0, 0);

    // Verifica se la data di prenotazione è valida secondo le impostazioni
    const dateValidation = await isValidBookingDate(bookingDateTime);
    if (!dateValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: dateValidation.reason
      });
    }

    // Verifica che il servizio esista e sia attivo
    const service = await prisma.service.findFirst({
      where: { id: serviceId, isActive: true }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato o non disponibile'
      });
    }

    // Verifica che il servizio abbia orari configurati
    if (!service.availability || service.availability.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Il servizio selezionato non ha orari configurati e non è prenotabile'
      });
    }

    // Verifica che l'orario richiesto sia disponibile per il servizio
    try {
      const availabilityConfig = JSON.parse(service.availability);
      const bookingDate = new Date(date);
      const dayOfWeek = bookingDate.getDay();
      const dayMapping = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayKey = dayMapping[dayOfWeek];
      
      const dayConfig = availabilityConfig[dayKey];
      if (!dayConfig || !dayConfig.enabled || !dayConfig.timeSlots || dayConfig.timeSlots.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Il servizio non è disponibile per il giorno selezionato'
        });
      }

      // Verifica che l'orario rientri in una delle fasce disponibili
      const [requestHours, requestMinutes] = startTime.split(':').map(Number);
      const requestStartMinutes = requestHours * 60 + requestMinutes;
      const requestEndMinutes = requestStartMinutes + service.duration;

      const isTimeSlotValid = dayConfig.timeSlots.some((slot: any) => {
        const [slotStartHours, slotStartMinutes] = slot.start.split(':').map(Number);
        const [slotEndHours, slotEndMinutes] = slot.end.split(':').map(Number);
        const slotStartTotalMinutes = slotStartHours * 60 + slotStartMinutes;
        const slotEndTotalMinutes = slotEndHours * 60 + slotEndMinutes;
        
        return requestStartMinutes >= slotStartTotalMinutes && requestEndMinutes <= slotEndTotalMinutes;
      });

      if (!isTimeSlotValid) {
        return res.status(400).json({
          success: false,
          message: 'L\'orario selezionato non è disponibile per questo servizio'
        });
      }
    } catch (error) {
      console.error('Errore nel parsing della disponibilità del servizio:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore nella configurazione degli orari del servizio'
      });
    }

    // Verifica che lo staff esista e sia attivo
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, isActive: true }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff non trovato o non disponibile'
      });
    }

    // Calcola l'orario di fine basato sulla durata del servizio
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDateTime = new Date(date);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + service.duration);
    
    const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

    console.log('=== BOOKING CREATION DEBUG ===');
    console.log('userId:', userId);
    console.log('serviceId:', serviceId);
    console.log('staffId:', staffId);
    console.log('date:', date);
    console.log('startTime:', startTime);
    console.log('endTime:', endTime);
    console.log('service found:', !!service);
    console.log('staff found:', !!staff);
    console.log('================================');

    // Crea la prenotazione
    const booking = await prisma.booking.create({
      data: {
        userId,
        serviceId,
        staffId,
        date: new Date(date),
        startTime,
        endTime,
        notes,
        status: 'PENDING'
      },
      include: {
        service: true,
        staff: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Invia email di conferma prenotazione
    try {
      const bookingDetails = {
        id: booking.id,
        serviceName: booking.service.name,
        date: booking.date.toISOString(),
        time: booking.startTime,
        therapistName: `${booking.staff.firstName} ${booking.staff.lastName}`,
        duration: booking.service.duration,
        price: booking.service.price,
        notes: booking.notes || undefined
      };

      await emailService.sendBookingConfirmation(
        booking.user.email,
        booking.user.firstName,
        bookingDetails
      );
      
      console.log(`✅ Booking confirmation email sent for booking ${booking.id}`);
    } catch (emailError) {
      console.error(`❌ Failed to send booking confirmation email for booking ${booking.id}:`, emailError);
      // Non blocchiamo la creazione della prenotazione se l'email fallisce
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Prenotazione creata con successo'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della prenotazione'
    });
  }
});

// PUT /api/bookings/:id - Aggiorna una prenotazione esistente
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Verifica che la prenotazione esista e appartenga all'utente
    const existingBooking = await prisma.booking.findFirst({
      where: { 
        id: bookingId, 
        userId,
        status: { not: 'CANCELLED' }
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }

    // Verifica che la prenotazione sia modificabile (almeno 48 ore prima)
    const bookingDate = new Date(existingBooking.date);
    const [hours, minutes] = existingBooking.startTime.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    const now = new Date();
    const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursDifference < 48) {
      return res.status(400).json({
        success: false,
        message: 'Non è possibile modificare la prenotazione meno di 48 ore prima dell\'appuntamento'
      });
    }

    // Aggiorna la prenotazione
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        date: req.body.date ? new Date(req.body.date) : undefined,
        startTime: req.body.time || undefined,
        notes: req.body.notes !== undefined ? req.body.notes : undefined
      },
      include: {
        service: true,
        staff: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Prenotazione aggiornata con successo'
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della prenotazione'
    });
  }
});

// DELETE /api/bookings/:id - Cancella una prenotazione
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Verifica che la prenotazione esista e appartenga all'utente
    const existingBooking = await prisma.booking.findFirst({
      where: { 
        id: bookingId, 
        userId,
        status: { not: 'CANCELLED' }
      }
    });

    if (!existingBooking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata o già cancellata'
      });
    }

    // Verifica che la prenotazione sia cancellabile secondo le impostazioni dinamiche
    const bookingDate = new Date(existingBooking.date);
    const [hours, minutes] = existingBooking.startTime.split(':').map(Number);
    bookingDate.setHours(hours, minutes, 0, 0);
    
    const { canCancelFree } = await import('../services/bookingValidation');
    const cancellationCheck = await canCancelFree(bookingDate);
    
    if (!cancellationCheck.canCancel) {
      return res.status(400).json({
        success: false,
        message: cancellationCheck.reason,
        hoursRemaining: cancellationCheck.hoursRemaining
      });
    }

    // Aggiorna lo status a CANCELLED invece di eliminare fisicamente
    const cancelledBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      },
      include: {
        service: true,
        staff: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Invia email di conferma cancellazione
    try {
      const bookingDetails = {
        id: cancelledBooking.id,
        serviceName: cancelledBooking.service.name,
        date: cancelledBooking.date.toISOString(),
        time: cancelledBooking.startTime,
        therapistName: `${cancelledBooking.staff.firstName} ${cancelledBooking.staff.lastName}`
      };

      await emailService.sendBookingCancellation(
        cancelledBooking.user.email,
        cancelledBooking.user.firstName,
        bookingDetails
      );
      
      console.log(`✅ Booking cancellation email sent for booking ${cancelledBooking.id}`);
    } catch (emailError) {
      console.error(`❌ Failed to send booking cancellation email for booking ${cancelledBooking.id}:`, emailError);
      // Non blocchiamo la cancellazione se l'email fallisce
    }

    res.json({
      success: true,
      data: cancelledBooking,
      message: 'Prenotazione cancellata con successo'
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella cancellazione della prenotazione'
    });
  }
});

// GET /api/bookings/availability/:staffId/:date - Ottieni gli slot occupati per una data e staff specifici
router.get('/availability/:staffId/:date', async (req, res) => {
  try {
    const { staffId, date } = req.params;

    // Valida il formato della data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Formato data non valido. Usare YYYY-MM-DD'
      });
    }

    // Verifica che lo staff esista
    const staff = await prisma.staff.findFirst({
      where: { id: staffId, isActive: true }
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff non trovato o non disponibile'
      });
    }

    // Trova tutte le prenotazioni per quella data e staff che non sono cancellate
    const bookings = await prisma.booking.findMany({
      where: {
        staffId,
        date: new Date(date),
        status: { not: 'CANCELLED' }
      },
      select: {
        startTime: true,
        endTime: true,
        service: {
          select: {
            duration: true
          }
        }
      }
    });

    // Crea un array di slot occupati (startTime-endTime)
    const bookedSlots = bookings.map(booking => ({
      startTime: booking.startTime,
      endTime: booking.endTime,
      duration: booking.service.duration
    }));

    res.json({
      success: true,
      data: {
        date,
        staffId,
        bookedSlots
      }
    });

  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della disponibilità'
    });
  }
});

export default router;
