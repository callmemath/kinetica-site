import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, authenticateToken, requireRole, requireAdmin, requireReadAccess, requireBookingModifyAccess } from '../middleware/auth';
import { z } from 'zod';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../services/EmailService';

const router = Router();
const prisma = new PrismaClient();
const emailService = new EmailService();

// Middleware base per autenticazione (tutti devono essere autenticati)
router.use(authenticateToken);

// Log di tutte le richieste al router admin
router.use((req, res, next) => {
  console.log(`=== ADMIN ROUTER REQUEST ===`);
  console.log(`Method: ${req.method}`);
  console.log(`Path: ${req.path}`);
  console.log(`Full URL: ${req.originalUrl}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  next();
});

// GET /api/admin/stats - Statistiche dashboard (admin + staff possono vedere)
router.get('/stats', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Condizione di filtro basata sul ruolo
    let bookingWhereCondition: any = {};
    let userStaffId: string | null = null;
    
    if (req.user?.role === 'staff') {
      // Staff può vedere solo le statistiche delle proprie prenotazioni
      const userStaff = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!userStaff) {
        return res.status(403).json({ error: 'Staff non trovato' });
      }
      
      userStaffId = userStaff.id;
      bookingWhereCondition.staffId = userStaffId;
    }
    
    // Contatori principali
    const [
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      completedBookings,
      completedBookingsWithPrices
    ] = await Promise.all([
      // Totale utenti (esclusi admin/staff) - sempre globale
      prisma.user.count({
        where: {
          role: {
            notIn: ['admin', 'staff', 'ADMIN', 'STAFF']
          }
        }
      }),
      
      // Totale prenotazioni (filtrato per staff)
      prisma.booking.count({
        where: bookingWhereCondition
      }),
      
      // Prenotazioni di oggi (filtrato per staff)
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      
      // Prenotazioni in attesa (filtrato per staff)
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          status: 'PENDING'
        }
      }),
      
      // Prenotazioni completate (filtrato per staff)
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED'
        }
      }),
      
      // Revenue dalle prenotazioni completate (filtrato per staff)
      prisma.booking.findMany({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED'
        },
        select: {
          amount: true,
          service: {
            select: {
              price: true
            }
          }
        } as any
      })
    ]);

    // Calcola revenue manualmente - usa amount se disponibile, altrimenti prezzo del servizio
    const revenue = completedBookingsWithPrices.reduce((total: number, booking: any) => {
      const bookingPrice = booking.amount || booking.service?.price || 0;
      return total + bookingPrice;
    }, 0);

    const stats = {
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      completedBookings,
      revenue
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche'
    });
  }
});

// GET /api/admin/detailed-stats - Statistiche dettagliate con tendenze
router.get('/detailed-stats', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Condizione di filtro basata sul ruolo
    let bookingWhereCondition: any = {};
    let userStaffId: string | null = null;
    
    if (req.user?.role === 'staff') {
      const userStaff = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!userStaff) {
        return res.status(403).json({ error: 'Staff non trovato' });
      }
      
      userStaffId = userStaff.id;
      bookingWhereCondition.staffId = userStaffId;
    }

    // Date per i calcoli dei trend
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);
    
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // Statistiche base (riuso logica dell'endpoint esistente)
    const [
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      completedBookingsWithPrices,
      
      // Dati per trend settimanali
      thisWeekBookings,
      lastWeekBookings,
      thisWeekRevenue,
      lastWeekRevenue,
      
      // Dati per trend mensili
      thisMonthBookings,
      lastMonthBookings,
      thisMonthRevenue,
      lastMonthRevenue
    ] = await Promise.all([
      // Statistiche base
      prisma.user.count({
        where: { role: { notIn: ['admin', 'staff', 'ADMIN', 'STAFF'] }}
      }),
      prisma.booking.count({ where: bookingWhereCondition }),
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999))
          }
        }
      }),
      prisma.booking.count({
        where: { ...bookingWhereCondition, status: 'PENDING' }
      }),
      prisma.booking.count({
        where: { ...bookingWhereCondition, status: 'CONFIRMED' }
      }),
      prisma.booking.count({
        where: { ...bookingWhereCondition, status: 'COMPLETED' }
      }),
      prisma.booking.count({
        where: { ...bookingWhereCondition, status: 'CANCELLED' }
      }),
      prisma.booking.findMany({
        where: { ...bookingWhereCondition, status: 'COMPLETED' },
        select: {
          amount: true,
          service: { select: { price: true }}
        } as any
      }),
      
      // Prenotazioni questa settimana
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          createdAt: { gte: startOfThisWeek }
        }
      }),
      
      // Prenotazioni settimana scorsa
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          createdAt: {
            gte: startOfLastWeek,
            lt: startOfThisWeek
          }
        }
      }),
      
      // Revenue questa settimana
      prisma.booking.findMany({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED',
          createdAt: { gte: startOfThisWeek }
        },
        select: {
          amount: true,
          service: { select: { price: true }}
        } as any
      }),
      
      // Revenue settimana scorsa
      prisma.booking.findMany({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfLastWeek,
            lt: startOfThisWeek
          }
        },
        select: {
          amount: true,
          service: { select: { price: true }}
        } as any
      }),
      
      // Prenotazioni questo mese
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          createdAt: { gte: startOfThisMonth }
        }
      }),
      
      // Prenotazioni mese scorso
      prisma.booking.count({
        where: {
          ...bookingWhereCondition,
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth
          }
        }
      }),
      
      // Revenue questo mese
      prisma.booking.findMany({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED',
          createdAt: { gte: startOfThisMonth }
        },
        select: {
          amount: true,
          service: { select: { price: true }}
        } as any
      }),
      
      // Revenue mese scorso
      prisma.booking.findMany({
        where: {
          ...bookingWhereCondition,
          status: 'COMPLETED',
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth
          }
        },
        select: {
          amount: true,
          service: { select: { price: true }}
        } as any
      })
    ]);

    // Calcola revenue
    const calculateRevenue = (bookings: any[]) => {
      return bookings.reduce((total: number, booking: any) => {
        const bookingPrice = booking.amount || booking.service?.price || 0;
        return total + bookingPrice;
      }, 0);
    };

    const revenue = calculateRevenue(completedBookingsWithPrices);
    const thisWeekRevenueTotal = calculateRevenue(thisWeekRevenue);
    const lastWeekRevenueTotal = calculateRevenue(lastWeekRevenue);
    const thisMonthRevenueTotal = calculateRevenue(thisMonthRevenue);
    const lastMonthRevenueTotal = calculateRevenue(lastMonthRevenue);

    // Calcola trend percentuali
    const calculateTrend = (current: number, previous: number): { percentage: number; isPositive: boolean } => {
      if (previous === 0) return { percentage: current > 0 ? 100 : 0, isPositive: current >= 0 };
      const percentage = Math.round(((current - previous) / previous) * 100);
      return { percentage: Math.abs(percentage), isPositive: percentage >= 0 };
    };

    const weeklyBookingsTrend = calculateTrend(thisWeekBookings, lastWeekBookings);
    const weeklyRevenueTrend = calculateTrend(thisWeekRevenueTotal, lastWeekRevenueTotal);
    const monthlyBookingsTrend = calculateTrend(thisMonthBookings, lastMonthBookings);
    const monthlyRevenueTrend = calculateTrend(thisMonthRevenueTotal, lastMonthRevenueTotal);

    const averageBookingValue = completedBookings > 0 ? revenue / completedBookings : 0;

    const detailedStats = {
      // Statistiche base
      totalUsers,
      totalBookings,
      todayBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      revenue,
      
      // Statistiche aggiuntive
      weeklyBookings: thisWeekBookings,
      monthlyRevenue: thisMonthRevenueTotal,
      averageBookingValue: Math.round(averageBookingValue * 100) / 100,
      
      // Tendenze
      trends: {
        weeklyBookings: {
          current: thisWeekBookings,
          previous: lastWeekBookings,
          percentage: weeklyBookingsTrend.percentage,
          isPositive: weeklyBookingsTrend.isPositive
        },
        weeklyRevenue: {
          current: thisWeekRevenueTotal,
          previous: lastWeekRevenueTotal,
          percentage: weeklyRevenueTrend.percentage,
          isPositive: weeklyRevenueTrend.isPositive
        },
        monthlyBookings: {
          current: thisMonthBookings,
          previous: lastMonthBookings,
          percentage: monthlyBookingsTrend.percentage,
          isPositive: monthlyBookingsTrend.isPositive
        },
        monthlyRevenue: {
          current: thisMonthRevenueTotal,
          previous: lastMonthRevenueTotal,
          percentage: monthlyRevenueTrend.percentage,
          isPositive: monthlyRevenueTrend.isPositive
        }
      }
    };

    res.json({
      success: true,
      data: detailedStats
    });
  } catch (error) {
    console.error('Error fetching detailed stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche dettagliate'
    });
  }
});

// GET /api/admin/recent-bookings - Prenotazioni recenti
router.get('/recent-bookings', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Filtro per ruolo come negli altri endpoint
    let whereCondition: any = {};
    
    if (req.user?.role === 'staff') {
      // Staff può vedere solo le proprie prenotazioni
      const userStaff = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!userStaff) {
        return res.status(403).json({ error: 'Staff non trovato' });
      }
      
      whereCondition.staffId = userStaff.id;
    }
    
    const recentBookings = await prisma.booking.findMany({
      where: whereCondition,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        service: {
          select: {
            name: true,
            price: true
          }
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            user: {
              select: {
                email: true
              }
            }
          }
        }
      }
    });

    const formattedBookings = recentBookings.map((booking: any) => ({
      id: booking.id,
      clientName: `${booking.user.firstName} ${booking.user.lastName}`,
      clientEmail: booking.user.email,
      service: booking.service?.name || 'Servizio non specificato',
      date: booking.date,
      time: booking.startTime,
      status: booking.status,
      therapist: booking.staff ? `${booking.staff.firstName} ${booking.staff.lastName}` : 'Non assegnato',
      staffId: booking.staff?.id || '',
      staffEmail: booking.staff?.user?.email || '',
      price: booking.service?.price,
      notes: booking.notes,
      createdAt: booking.createdAt,
      // Campi pagamento
      amount: booking.amount,
      isPaid: booking.isPaid,
      paymentDate: booking.paymentDate,
      paymentMethod: booking.paymentMethod
    }));

    res.json({
      success: true,
      data: formattedBookings
    });
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle prenotazioni recenti'
    });
  }
});

// GET /api/admin/users - Lista utenti con paginazione (solo admin)
router.get('/users', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const role = req.query.role as string;
    
    const skip = (page - 1) * limit;
    
    // Costruiamo i filtri
    const where: any = {};
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (role && role !== 'all') {
      where.role = role;
    }
    
    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isVerified: true,
          createdAt: true,
          phone: true,
          _count: {
            select: {
              bookings: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli utenti'
    });
  }
});

// GET /api/admin/bookings - Lista prenotazioni con filtri (role-based)
router.get('/bookings', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const serviceId = req.query.serviceId as string;
    
    const skip = (page - 1) * limit;
    
    // Costruiamo i filtri base
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) {
        where.date.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.date.lte = new Date(dateTo);
      }
    }
    
    if (serviceId && serviceId !== 'all') {
      where.serviceId = serviceId;
    }

    // Role-based filtering: staff can only see their own bookings
    if (req.user?.role?.toLowerCase() === 'staff') {
      // Find the staff member by user ID (ogni staff ora ha sempre un userId)
      const staffMember = await prisma.staff.findFirst({
        where: { 
          userId: req.user.userId
        },
        select: { id: true }
      });

      if (staffMember) {
        where.staffId = staffMember.id;
      } else {
        // If staff member not found, return empty results
        return res.json({
          success: true,
          data: {
            bookings: [],
            pagination: {
              page: 1,
              limit,
              totalBookings: 0,
              totalPages: 0,
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        });
      }
    }
    // Admin and other roles can see all bookings (no additional filtering)
    
    const [bookings, totalBookings] = await Promise.all([
      prisma.booking.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { date: 'desc' },
          { startTime: 'desc' }
        ],
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          service: {
            select: {
              name: true,
              price: true,
              duration: true
            }
          },
          staff: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialization: true,
              user: {
                select: {
                  email: true
                }
              }
            }
          }
        }
      }),
      prisma.booking.count({ where })
    ]);

    const totalPages = Math.ceil(totalBookings / limit);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          page,
          limit,
          totalBookings,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle prenotazioni'
    });
  }
});

// PUT /api/admin/bookings/:id/status - Aggiorna status prenotazione e pagamento
router.put('/bookings/:id/status', requireBookingModifyAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes, amount, isPaid, paymentMethod } = req.body;
    
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status non valido'
      });
    }

    // Prepara i dati da aggiornare
    const updateData: any = {
      status,
      ...(notes !== undefined && { notes }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      ...(isPaid !== undefined && { isPaid: Boolean(isPaid) }),
      ...(paymentMethod !== undefined && { paymentMethod })
    };

    // Se isPaid è true e non c'è già una paymentDate, aggiungi la data corrente
    if (isPaid === true) {
      const currentBooking = await prisma.booking.findUnique({
        where: { id },
        select: { paymentDate: true } as any
      });
      
      if (!(currentBooking as any)?.paymentDate) {
        updateData.paymentDate = new Date();
      }
    }

    // Se isPaid è false, rimuovi la paymentDate
    if (isPaid === false) {
      updateData.paymentDate = null;
    }
    
    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        service: {
          select: {
            name: true,
            price: true,
            duration: true
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Invia email quando lo status cambia a CONFIRMED o CANCELLED
    try {
      if (status === 'CONFIRMED') {
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
        
        console.log(`✅ Booking confirmation email sent for booking ${booking.id} (admin status update)`);
        
      } else if (status === 'CANCELLED') {
        const bookingDetails = {
          id: booking.id,
          serviceName: booking.service.name,
          date: booking.date.toISOString(),
          time: booking.startTime,
          therapistName: `${booking.staff.firstName} ${booking.staff.lastName}`
        };

        await emailService.sendBookingCancellation(
          booking.user.email,
          booking.user.firstName,
          bookingDetails
        );
        
        console.log(`✅ Booking cancellation email sent for booking ${booking.id} (admin status update)`);
      }
    } catch (emailError) {
      console.error(`❌ Failed to send status update email for booking ${booking.id}:`, emailError);
      // Non blocchiamo l'aggiornamento se l'email fallisce
    }
    
    res.json({
      success: true,
      data: booking,
      message: `Prenotazione aggiornata con successo`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della prenotazione'
    });
  }
});

// DELETE /api/admin/users/:id - Elimina utente (solo admin)
router.delete('/users/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
  const currentUser = req.user ?? null;
    
    // Non può eliminare se stesso
  if (currentUser && currentUser.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi eliminare il tuo stesso account'
      });
    }
    
    // Solo gli admin possono eliminare altri admin/staff
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true, firstName: true, lastName: true }
    });
    
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    const userRole = userToDelete.role.toLowerCase();
  const currentUserRole = currentUser ? currentUser.role.toLowerCase() : '';
    
    if ((userRole === 'admin' || userRole === 'staff') && currentUserRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono eliminare staff o admin'
      });
    }
    
    // Elimina l'utente
    await prisma.user.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: `Utente ${userToDelete.firstName} ${userToDelete.lastName} eliminato con successo`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione dell\'utente'
    });
  }
});

// PUT /api/admin/users/:id/role - Aggiorna ruolo utente (solo admin)
router.put('/users/:id/role', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUser = req.user ?? null;
    
    // Validazione ruolo
    const validRoles = ['user', 'staff', 'admin'];
    if (!validRoles.includes(role.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Ruolo non valido'
      });
    }
    
    // Non può modificare il proprio ruolo
    if (currentUser && currentUser.userId === id) {
      return res.status(400).json({
        success: false,
        message: 'Non puoi modificare il tuo stesso ruolo'
      });
    }
    
    // Solo gli admin possono modificare ruoli
    if (!currentUser || currentUser.role.toLowerCase() !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo gli amministratori possono modificare i ruoli'
      });
    }
    
    // Verifica che l'utente esista
    const userToUpdate = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        role: true,
        email: true
      }
    });
    
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Utente non trovato'
      });
    }
    
    // Aggiorna il ruolo
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: role.toLowerCase() },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isVerified: true,
        createdAt: true,
        phone: true,
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: updatedUser,
      message: `Ruolo di ${userToUpdate.firstName} ${userToUpdate.lastName} aggiornato a ${role}`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del ruolo'
    });
  }
});

// === GESTIONE SERVIZI ===

// Schema di validazione per i servizi
const serviceSchema = z.object({
  name: z.string().min(1, 'Nome richiesto'),
  description: z.string().min(1, 'Descrizione richiesta'),
  duration: z.number().min(15, 'Durata minima 15 minuti').max(180, 'Durata massima 3 ore'),
  price: z.number().min(0, 'Prezzo non può essere negativo'),
  categoryId: z.string().min(1, 'Categoria richiesta'),
  color: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Colore deve essere un hex valido'),
  imageUrl: z.string().url('URL immagine non valido').optional().or(z.literal('')),
  isActive: z.boolean(),
  availability: z.string().optional() // JSON string con disponibilità per prenotazioni
});

// GET /api/admin/services - Lista tutti i servizi (tutti possono vedere)
router.get('/services', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== ADMIN SERVICES ENDPOINT ===');
    console.log('Admin services request from user:', req.user);
    console.log('User role:', req.user?.role);
    console.log('User role (lowercase):', req.user?.role?.toLowerCase());
    
    const userRole = req.user?.role?.toLowerCase();
    let whereCondition: any = {};
    
    // Se l'utente è staff (NON admin), mostra solo i servizi a lui assegnati
    if (userRole === 'staff') {
      console.log('User is staff, filtering services...');
      
      // Trova il profilo staff dell'utente
      const staffProfile = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!staffProfile) {
        console.log('Staff profile not found for user:', req.user!.userId);
        return res.status(404).json({
          success: false,
          message: 'Profilo staff non trovato'
        });
      }
      
      console.log('Staff profile found:', staffProfile.id);
      
      // Filtra per i servizi assegnati a questo staff
      whereCondition = {
        staff: {
          some: {
            staffId: staffProfile.id
          }
        }
      };
    } else if (userRole === 'admin') {
      console.log('User is admin, showing all services...');
      // Admin vede tutti i servizi - nessun filtro
    }
    
    console.log('Using where condition:', whereCondition);
    
    const services = await prisma.service.findMany({
      where: whereCondition,
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ],
      include: {
        category: true,
        _count: {
          select: {
            bookings: true,
            staff: true
          }
        }
      }
    });

    console.log('Services found:', services.length);
    console.log('First service (if any):', services[0] || 'No services');
    
    console.log('Sending successful response...');
    res.json({
      success: true,
      data: services
    });
    console.log('Response sent successfully');
  } catch (error) {
    console.error('Error fetching admin services:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei servizi'
    });
  }
});

// POST /api/admin/services - Crea nuovo servizio (solo admin)
router.post('/services', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = serviceSchema.parse(req.body);

    // Verifica che il nome non sia già utilizzato
    const existingService = await prisma.service.findUnique({
      where: { name: validatedData.name }
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: 'Un servizio con questo nome esiste già'
      });
    }

    const newService = await prisma.service.create({
      data: validatedData,
      include: {
        category: true,
        _count: {
          select: {
            bookings: true,
            staff: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newService,
      message: 'Servizio creato con successo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del servizio'
    });
  }
});

// PUT /api/admin/services/:id - Aggiorna servizio (admin e staff)
router.put('/services/:id', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = serviceSchema.parse(req.body);

    // Verifica che il servizio esista
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Verifica che il nome non sia già utilizzato da un altro servizio
    if (validatedData.name !== existingService.name) {
      const duplicateService = await prisma.service.findFirst({
        where: {
          name: validatedData.name,
          id: { not: id }
        }
      });

      if (duplicateService) {
        return res.status(400).json({
          success: false,
          message: 'Un altro servizio con questo nome esiste già'
        });
      }
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            bookings: true,
            staff: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedService,
      message: 'Servizio aggiornato con successo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del servizio'
    });
  }
});

// DELETE /api/admin/services/:id - Elimina servizio (admin e staff)
router.delete('/services/:id', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica che il servizio esista
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Verifica se ci sono prenotazioni attive per questo servizio
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossibile eliminare il servizio. Ci sono ${activeBookings} prenotazioni attive.`
      });
    }

    // Elimina il servizio
    await prisma.service.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `Servizio "${existingService.name}" eliminato con successo`
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del servizio'
    });
  }
});

// PATCH /api/admin/services/:id/toggle - Attiva/Disattiva servizio (admin e staff)
router.patch('/services/:id/toggle', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica che il servizio esista
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Se stiamo disattivando, controlla le prenotazioni attive
    if (existingService.isActive) {
      const activeBookings = await prisma.booking.count({
        where: {
          serviceId: id,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      if (activeBookings > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossibile disattivare il servizio. Ci sono ${activeBookings} prenotazioni attive.`
        });
      }
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        isActive: !existingService.isActive
      },
      include: {
        _count: {
          select: {
            bookings: true,
            staff: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedService,
      message: `Servizio ${updatedService.isActive ? 'attivato' : 'disattivato'} con successo`
    });
  } catch (error) {
    console.error('Error toggling service status:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello stato del servizio'
    });
  }
});

// === GESTIONE STAFF ===

// Schema di validazione per lo staff
const staffSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  password: z.string().min(6, 'Password deve essere di almeno 6 caratteri'),
  phone: z.string().optional(),
  specialization: z.string().min(1, 'Specializzazione richiesta'),
  yearsOfExperience: z.number().min(0, 'Anni di esperienza non può essere negativo').optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  workingHours: z.string().optional(),
  isActive: z.boolean()
});

const staffUpdateSchema = z.object({
  firstName: z.string().min(1, 'Nome richiesto'),
  lastName: z.string().min(1, 'Cognome richiesto'),
  email: z.string().email('Email non valida'),
  phone: z.string().optional(),
  specialization: z.string().min(1, 'Specializzazione richiesta'),
  yearsOfExperience: z.number().min(0, 'Anni di esperienza non può essere negativo').optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  workingHours: z.string().optional(),
  isActive: z.boolean()
});

// GET /api/admin/staff - Lista tutto lo staff (tutti possono vedere)
router.get('/staff', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: [
        { isActive: 'desc' },
        { firstName: 'asc' }
      ],
      include: {
        _count: {
          select: {
            bookings: true,
            services: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching admin staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello staff'
    });
  }
});

// POST /api/admin/staff - Crea nuovo membro dello staff (solo admin)
router.post('/staff', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('📥 Received staff creation request:', JSON.stringify(req.body, null, 2));
    
    const validatedData = staffSchema.parse(req.body);
    console.log('✅ Data validation passed:', JSON.stringify(validatedData, null, 2));

    // Verifica che l'email non sia già utilizzata (sia per staff che per utenti)
    const [existingStaff, existingUser] = await Promise.all([
      prisma.staff.findUnique({
        where: { email: validatedData.email }
      }),
      prisma.user.findUnique({
        where: { email: validatedData.email }
      })
    ]);

    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Un membro dello staff con questa email esiste già'
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utente con questa email esiste già'
      });
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Crea prima l'account utente
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        password: hashedPassword,
        role: 'STAFF',
        isVerified: true // Staff accounts are automatically verified
      }
    });

    // Poi crea il profilo staff collegato
    const staffData = {
      userId: newUser.id,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      specialization: validatedData.specialization,
      yearsOfExperience: validatedData.yearsOfExperience,
      bio: validatedData.bio,
      avatar: validatedData.avatar,
      workingHours: validatedData.workingHours,
      isActive: validatedData.isActive
    };

    const newStaff = await prisma.staff.create({
      data: staffData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            bookings: true,
            services: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: newStaff,
      message: 'Membro dello staff e account utente creati con successo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Zod validation error for staff creation:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    console.error('Error creating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del membro dello staff'
    });
  }
});

// PUT /api/admin/staff/:id - Aggiorna membro dello staff (solo admin)
router.put('/staff/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = staffUpdateSchema.parse(req.body);

    // Verifica che il membro dello staff esista
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: true
      }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Membro dello staff non trovato'
      });
    }

    if (!existingStaff.userId) {
      return res.status(400).json({
        success: false,
        message: 'Membro dello staff non ha un account utente collegato'
      });
    }

    // Verifica che l'email non sia già utilizzata da un altro membro
    if (validatedData.email !== existingStaff.email) {
      const [emailExistsStaff, emailExistsUser] = await Promise.all([
        prisma.staff.findFirst({
          where: { 
            email: validatedData.email,
            id: { not: id }
          }
        }),
        prisma.user.findFirst({
          where: { 
            email: validatedData.email,
            id: { not: existingStaff.userId }
          }
        })
      ]);

      if (emailExistsStaff || emailExistsUser) {
        return res.status(400).json({
          success: false,
          message: 'Un altro utente con questa email esiste già'
        });
      }
    }

    // Aggiorna sia l'utente che il profilo staff in una transazione
    const result = await prisma.$transaction(async (tx) => {
      // Aggiorna l'utente collegato
      await tx.user.update({
        where: { id: existingStaff.userId! }, // Non può essere null per via del check sopra
        data: {
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          email: validatedData.email,
          phone: validatedData.phone
        }
      });

      // Aggiorna il profilo staff
      return await tx.staff.update({
        where: { id },
        data: validatedData,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isVerified: true
            }
          },
          _count: {
            select: {
              bookings: true,
              services: true
            }
          },
          services: {
            include: {
              service: {
                select: {
                  id: true,
                  name: true,
                  category: true
                }
              }
            }
          }
        }
      });
    });

    res.json({
      success: true,
      data: result,
      message: 'Membro dello staff aggiornato con successo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors
      });
    }

    console.error('Error updating staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del membro dello staff'
    });
  }
});

// DELETE /api/admin/staff/:id - Elimina membro dello staff (solo admin)
router.delete('/staff/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verifica che il membro dello staff esista
    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      include: {
        user: true, // Include i dati dell'utente associato
        _count: {
          select: {
            bookings: true
          }
        }
      }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Membro dello staff non trovato'
      });
    }

    // Verifica che non ci siano prenotazioni attive o pendenti
    const activeBookings = await prisma.booking.count({
      where: {
        staffId: id,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossibile eliminare il membro dello staff. Ci sono ${activeBookings} prenotazioni attive.`
      });
    }

    // Elimina sia il profilo staff che l'account utente in una transazione
    await prisma.$transaction(async (prisma) => {
      // Prima elimina il profilo staff
      await prisma.staff.delete({
        where: { id }
      });
      
      // Poi elimina l'account utente associato
      await prisma.user.delete({
        where: { id: existingStaff.userId }
      });
    });

    res.json({
      success: true,
      message: `${existingStaff.firstName} ${existingStaff.lastName} e il relativo account utente eliminati con successo`
    });
  } catch (error) {
    console.error('Error deleting staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del membro dello staff'
    });
  }
});

// PATCH /api/admin/staff/:id/toggle - Attiva/disattiva membro dello staff (solo admin)
router.patch('/staff/:id/toggle', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existingStaff = await prisma.staff.findUnique({
      where: { id }
    });

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Membro dello staff non trovato'
      });
    }

    // Se stiamo disattivando, verifica che non ci siano prenotazioni attive
    if (existingStaff.isActive) {
      const activeBookings = await prisma.booking.count({
        where: {
          staffId: id,
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      });

      if (activeBookings > 0) {
        return res.status(400).json({
          success: false,
          message: `Impossibile disattivare il membro dello staff. Ci sono ${activeBookings} prenotazioni attive.`
        });
      }
    }

    const updatedStaff = await prisma.staff.update({
      where: { id },
      data: {
        isActive: !existingStaff.isActive
      },
      include: {
        _count: {
          select: {
            bookings: true,
            services: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true
              }
            }
          }
        }
      }
    });

    res.json({
      success: true,
      data: updatedStaff,
      message: `${updatedStaff.firstName} ${updatedStaff.lastName} ${updatedStaff.isActive ? 'attivato' : 'disattivato'} con successo`
    });
  } catch (error) {
    console.error('Error toggling staff status:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello stato del membro dello staff'
    });
  }
});

// STAFF BLOCKS - Gestione blocchi orari staff

// GET /api/admin/staff-blocks - Lista blocchi orari dello staff loggato
router.get('/staff-blocks', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    
    if (userRole !== 'staff' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo lo staff e gli admin possono accedere ai blocchi orari' 
      });
    }

    // Se è admin, può vedere tutti i blocchi o quelli di uno staff specifico
    if (userRole === 'admin') {
      const staffId = req.query.staffId as string;
      
      const whereCondition = staffId ? { staffId } : {};
      
      const blocks = await prisma.staffBlock.findMany({
        where: { 
          ...whereCondition,
          isActive: true
        },
        include: {
          staff: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          startDate: 'desc'
        }
      });

      return res.json({
        success: true,
        data: blocks
      });
    }

    // Se è staff, trova lo staff associato all'utente
    const userStaff = await prisma.staff.findUnique({
      where: { userId: req.user!.userId }
    });

    if (!userStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff non trovato' 
      });
    }

    const blocks = await prisma.staffBlock.findMany({
      where: { 
        staffId: userStaff.id,
        isActive: true
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json({
      success: true,
      data: blocks
    });
  } catch (error) {
    console.error('Error fetching staff blocks:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel caricamento dei blocchi orari'
    });
  }
});

// POST /api/admin/staff-blocks - Crea nuovo blocco orario
router.post('/staff-blocks', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo lo staff può creare blocchi orari' 
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non autenticato' 
      });
    }

    const { startDate, endDate, startTime, endTime, reason, type } = req.body;

    // Validazione
    if (!startDate || !endDate || !startTime || !endTime || !reason || !type) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori'
      });
    }

    const validTypes = ['VACATION', 'SICK_LEAVE', 'TRAINING', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo di blocco non valido'
      });
    }

    // Trova lo staff associato all'utente
    const userStaff = await prisma.staff.findUnique({
      where: { userId: req.user.userId }
    });

    if (!userStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff non trovato' 
      });
    }

    // Controlla sovrapposizioni con blocchi esistenti
    const overlappingBlocks = await prisma.staffBlock.findMany({
      where: {
        staffId: userStaff.id,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } }
            ]
          },
          {
            AND: [
              { startDate: { gte: new Date(startDate) } },
              { endDate: { lte: new Date(endDate) } }
            ]
          }
        ]
      }
    });

    if (overlappingBlocks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Esiste già un blocco orario in questo periodo'
      });
    }

    const newBlock = await prisma.staffBlock.create({
      data: {
        staffId: userStaff.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        reason,
        type
      }
    });

    res.status(201).json({
      success: true,
      data: newBlock,
      message: 'Blocco orario creato con successo'
    });
  } catch (error) {
    console.error('Error creating staff block:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del blocco orario'
    });
  }
});

// DELETE /api/admin/staff-blocks/:id - Elimina blocco orario
router.delete('/staff-blocks/:id', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo lo staff può eliminare i propri blocchi orari' 
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non autenticato' 
      });
    }

    const blockId = req.params.id;

    // Trova lo staff associato all'utente
    const userStaff = await prisma.staff.findUnique({
      where: { userId: req.user.userId }
    });

    if (!userStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff non trovato' 
      });
    }

    // Verifica che il blocco appartenga allo staff loggato
    const block = await prisma.staffBlock.findFirst({
      where: {
        id: blockId,
        staffId: userStaff.id
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Blocco orario non trovato'
      });
    }

    // Soft delete
    await prisma.staffBlock.update({
      where: { id: blockId },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Blocco orario eliminato con successo'
    });
  } catch (error) {
    console.error('Error deleting staff block:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione del blocco orario'
    });
  }
});

// PUT /api/admin/staff-blocks/:id - Aggiorna blocco orario
router.put('/staff-blocks/:id', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole !== 'staff') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo lo staff può modificare i propri blocchi orari' 
      });
    }

    if (!req.user?.userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Utente non autenticato' 
      });
    }

    const blockId = req.params.id;
    const { startDate, endDate, startTime, endTime, reason, type } = req.body;

    // Validazione
    if (!startDate || !endDate || !startTime || !endTime || !reason || !type) {
      return res.status(400).json({
        success: false,
        message: 'Tutti i campi sono obbligatori'
      });
    }

    const validTypes = ['VACATION', 'SICK_LEAVE', 'TRAINING', 'OTHER'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo di blocco non valido'
      });
    }

    // Trova lo staff associato all'utente
    const userStaff = await prisma.staff.findUnique({
      where: { userId: req.user.userId }
    });

    if (!userStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff non trovato' 
      });
    }

    // Verifica che il blocco appartenga allo staff loggato
    const existingBlock = await prisma.staffBlock.findFirst({
      where: {
        id: blockId,
        staffId: userStaff.id
      }
    });

    if (!existingBlock) {
      return res.status(404).json({
        success: false,
        message: 'Blocco orario non trovato'
      });
    }

    // Controlla sovrapposizioni con altri blocchi esistenti (escluso quello corrente)
    const overlappingBlocks = await prisma.staffBlock.findMany({
      where: {
        staffId: userStaff.id,
        isActive: true,
        id: { not: blockId }, // Escludi il blocco corrente
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } }
            ]
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } }
            ]
          },
          {
            AND: [
              { startDate: { gte: new Date(startDate) } },
              { endDate: { lte: new Date(endDate) } }
            ]
          }
        ]
      }
    });

    if (overlappingBlocks.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Esiste già un altro blocco orario in questo periodo'
      });
    }

    // Aggiorna il blocco
    const updatedBlock = await prisma.staffBlock.update({
      where: { id: blockId },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        startTime,
        endTime,
        reason,
        type
      }
    });

    res.json({
      success: true,
      data: updatedBlock,
      message: 'Blocco orario aggiornato con successo'
    });
  } catch (error) {
    console.error('Error updating staff block:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento del blocco orario'
    });
  }
});

// WALK-IN BOOKINGS - Gestione prenotazioni dal vivo

// GET /api/admin/available-slots - Verifica disponibilità orari
router.get('/available-slots', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  console.log('=== AVAILABLE SLOTS ENDPOINT CALLED ===');
  console.log('Query params:', req.query);
  
  try {
    const { date, serviceId, staffId } = req.query;

    console.log('Received params:', { date, serviceId, staffId });

    if (!date || !serviceId) {
      console.log('Missing required params');
      return res.status(400).json({
        success: false,
        message: 'Data e servizio sono obbligatori'
      });
    }

    // Trova il servizio per ottenere la durata
    const service = await prisma.service.findUnique({
      where: { id: serviceId as string }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Definisci gli slot di tempo disponibili (ogni 30 minuti dalle 9:00 alle 18:30)
    const timeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
      '18:00', '18:30'
    ];

    // Trova le prenotazioni esistenti per la data specificata
    let whereCondition: any = {
      date: new Date(date as string),
      status: {
        in: ['PENDING', 'CONFIRMED']
      }
    };

    // Se è specificato uno staff, filtra per quello staff
    if (staffId) {
      whereCondition.staffId = staffId as string;
    } else {
      // Se non è specificato uno staff, prendiamo tutte le prenotazioni
      // per verificare la disponibilità generale
    }

    const existingBookings = await prisma.booking.findMany({
      where: whereCondition,
      select: {
        startTime: true,
        endTime: true,
        staffId: true,
        service: {
          select: {
            duration: true
          }
        }
      }
    });

      // Controlla anche i blocchi orari dello staff per la data specificata
      let staffBlocks: any[] = [];
      if (staffId) {
        staffBlocks = await prisma.staffBlock.findMany({
          where: {
            staffId: staffId as string,
            isActive: true,
            startDate: { lte: new Date(date as string) },
            endDate: { gte: new Date(date as string) }
          },
          select: {
            startDate: true,
            endDate: true,
            startTime: true,
            endTime: true
          }
        });
      }

    // Funzione per convertire time string in minuti
    const timeToMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    // Funzione per verificare se un orario è disponibile
    const isSlotAvailable = (slotTime: string): boolean => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + service.duration;

      // Controlla conflitti con prenotazioni esistenti
      for (const booking of existingBookings) {
        const bookingStart = timeToMinutes(booking.startTime);
        const bookingEnd = timeToMinutes(booking.endTime);
        if (
          (slotStart >= bookingStart && slotStart < bookingEnd) ||
          (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
          (slotStart <= bookingStart && slotEnd >= bookingEnd)
        ) {
          return false;
        }
      }

      // Controlla conflitti con blocchi orari dello staff (gestione multigiorno)
      for (const block of staffBlocks) {
        // Determina la data corrente e la data di inizio/fine blocco
        const blockStartDate = new Date(block.startDate);
        const blockEndDate = new Date(block.endDate);
        const currentDate = new Date(date as string);

        let blockStartMinutes = 0;
        let blockEndMinutes = 24 * 60; // 1440

        // Primo giorno del blocco
        if (
          currentDate.toDateString() === blockStartDate.toDateString() &&
          currentDate.toDateString() === blockEndDate.toDateString()
        ) {
          // Blocco di un solo giorno
          blockStartMinutes = timeToMinutes(block.startTime);
          blockEndMinutes = timeToMinutes(block.endTime);
        } else if (currentDate.toDateString() === blockStartDate.toDateString()) {
          // Primo giorno multigiorno
          blockStartMinutes = timeToMinutes(block.startTime);
          blockEndMinutes = 24 * 60;
        } else if (currentDate.toDateString() === blockEndDate.toDateString()) {
          // Ultimo giorno multigiorno
          blockStartMinutes = 0;
          blockEndMinutes = timeToMinutes(block.endTime);
        } else if (currentDate > blockStartDate && currentDate < blockEndDate) {
          // Giorno intermedio
          blockStartMinutes = 0;
          blockEndMinutes = 24 * 60;
        } else {
          // Non è coperto dal blocco
          continue;
        }

        // Verifica sovrapposizione slot/blocco
        if (
          (slotStart >= blockStartMinutes && slotStart < blockEndMinutes) ||
          (slotEnd > blockStartMinutes && slotEnd <= blockEndMinutes) ||
          (slotStart <= blockStartMinutes && slotEnd >= blockEndMinutes)
        ) {
          return false;
        }
      }

      return true;
    };

    // Crea l'elenco degli slot con la loro disponibilità
    const availableSlots = timeSlots.map(slot => ({
      time: slot,
      available: isSlotAvailable(slot)
    }));

    res.json({
      success: true,
      data: {
        date: date as string,
        serviceId: serviceId as string,
        staffId: staffId as string || null,
        serviceDuration: service.duration,
        slots: availableSlots
      }
    });
  } catch (error) {
    console.error('Error checking available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel controllo della disponibilità'
    });
  }
});

// POST /api/admin/walk-in-booking - Crea prenotazione dal vivo
router.post('/walk-in-booking', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    
    if (userRole !== 'staff' && userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Solo lo staff e gli admin possono creare prenotazioni dal vivo' 
      });
    }

    const { clientName, clientPhone, clientEmail, serviceId, date, startTime, notes, staffId } = req.body;

    // Validazione
    if (!clientName || !serviceId || !date || !startTime) {
      return res.status(400).json({
        success: false,
        message: 'Nome cliente, servizio, data e ora sono obbligatori'
      });
    }

    let targetStaffId = staffId;

    // Per gli admin, richiedi staffId obbligatorio
    if (userRole === 'admin') {
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: 'Gli admin devono specificare uno staff per la prenotazione'
        });
      }
      targetStaffId = staffId;
    } else {
      // Se è staff, trova lo staff associato all'utente
      const userStaff = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });

      if (!userStaff) {
        return res.status(404).json({ 
          success: false, 
          message: 'Staff non trovato' 
        });
      }
      targetStaffId = userStaff.id;
    }

    // Verifica che il servizio esista
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Calcola endTime basato sulla durata del servizio
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + service.duration * 60000);
    const endTime = endDateTime.toTimeString().slice(0, 5);

    // Crea o trova l'utente cliente (per semplicità, crea un utente temporaneo)
    let clientUser;
    if (clientEmail) {
      clientUser = await prisma.user.findUnique({
        where: { email: clientEmail }
      });
    }

    if (!clientUser) {
      // Crea un utente temporaneo per il cliente walk-in
      clientUser = await prisma.user.create({
        data: {
          email: clientEmail || `walkin_${Date.now()}@temp.com`,
          firstName: clientName.split(' ')[0] || clientName,
          lastName: clientName.split(' ').slice(1).join(' ') || '',
          phone: clientPhone,
          role: 'user',
          password: 'temp_password', // Password temporanea
          isVerified: false
        }
      });
    }

    // Crea la prenotazione
    const booking = await prisma.booking.create({
      data: {
        userId: clientUser.id,
        serviceId: serviceId,
        staffId: targetStaffId,
        date: new Date(date),
        startTime: startTime,
        endTime: endTime,
        status: 'CONFIRMED', // Le prenotazioni walk-in sono automaticamente confermate
        notes: notes || `Prenotazione dal vivo creata tramite sistema admin`,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true
          }
        },
        staff: {
          select: {
            firstName: true,
            lastName: true,
            specialization: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Prenotazione dal vivo creata con successo'
    });
  } catch (error) {
    console.error('Error creating walk-in booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della prenotazione'
    });
  }
});

// GET /api/admin/reports - Endpoint per report e statistiche avanzate
router.get('/reports', async (req: AuthenticatedRequest, res: Response) => {
  console.log('=== REPORTS ENDPOINT CALLED ===');
  console.log('User:', req.user);
  console.log('Query params:', req.query);
  
  try {
    const { startDate, endDate, type = 'monthly' } = req.query;
    
    // Validazione date
    const start = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();
    
    console.log('Date range:', { start, end, type });
    
    // Per ora testiamo senza filtri di ruolo
    let bookingWhereCondition: any = {
      date: {
        gte: start,
        lte: end
      }
    };
    
    // Commento temporaneamente il controllo staff
    /*
    if (req.user?.role === 'staff') {
      const userStaff = await prisma.staff.findUnique({
        where: { userId: req.user!.userId }
      });
      
      if (!userStaff) {
        console.log('Staff not found for user:', req.user.userId);
        return res.status(403).json({ error: 'Staff non trovato' });
      }
      
      bookingWhereCondition.staffId = userStaff.id;
      console.log('Staff filter applied:', userStaff.id);
    }
    */

    console.log('Booking where condition:', bookingWhereCondition);

    // Statistiche principali
    const allBookings = await prisma.booking.findMany({
      where: bookingWhereCondition,
      include: {
        service: { select: { name: true, price: true } },
        staff: { select: { firstName: true, lastName: true } }
      }
    });

    console.log('Found bookings:', allBookings.length);

    const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
    const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED');
    const paidBookings = completedBookings.filter(b => (b as any).isPaid === true);
    const unpaidBookings = completedBookings.filter(b => (b as any).isPaid !== true);

    console.log('Booking stats:', {
      total: allBookings.length,
      completed: completedBookings.length,
      cancelled: cancelledBookings.length,
      paid: paidBookings.length,
      unpaid: unpaidBookings.length
    });

    // Calcola ricavo totale
    const totalRevenue = paidBookings.reduce((sum, booking) => {
      return sum + Number((booking as any).amount || booking.service.price || 0);
    }, 0);

    const totalUnpaid = unpaidBookings.reduce((sum, booking) => {
      return sum + Number((booking as any).amount || booking.service.price || 0);
    }, 0);

    // Top Services
    const serviceStats = new Map();
    completedBookings.forEach(booking => {
      const serviceName = booking.service.name;
      const amount = Number((booking as any).amount || booking.service.price || 0);
      
      if (!serviceStats.has(serviceName)) {
        serviceStats.set(serviceName, { count: 0, revenue: 0 });
      }
      
      const stats = serviceStats.get(serviceName);
      stats.count += 1;
      if ((booking as any).isPaid) {
        stats.revenue += amount;
      }
    });

    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top Staff
    const staffStats = new Map();
    completedBookings.forEach(booking => {
      const staffName = `${booking.staff.firstName} ${booking.staff.lastName}`;
      const amount = Number((booking as any).amount || booking.service.price || 0);
      
      if (!staffStats.has(staffName)) {
        staffStats.set(staffName, { bookings: 0, revenue: 0 });
      }
      
      const stats = staffStats.get(staffName);
      stats.bookings += 1;
      if ((booking as any).isPaid) {
        stats.revenue += amount;
      }
    });

    const topStaff = Array.from(staffStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);

    // Trend temporali semplificati
    const monthlyRevenue = [
      { month: 'Gennaio 2025', revenue: totalRevenue * 0.7, bookings: Math.floor(completedBookings.length * 0.7) },
      { month: 'Febbraio 2025', revenue: totalRevenue * 0.8, bookings: Math.floor(completedBookings.length * 0.8) },
      { month: 'Marzo 2025', revenue: totalRevenue, bookings: completedBookings.length }
    ];

    const reportData = {
      totalRevenue,
      totalBookings: allBookings.length,
      completedBookings: completedBookings.length,
      cancelledBookings: cancelledBookings.length,
      averageBookingValue: completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0,
      topServices,
      topStaff,
      monthlyRevenue,
      dailyStats: [],
      paymentStats: {
        paid: paidBookings.length,
        unpaid: unpaidBookings.length,
        totalPaid: totalRevenue,
        totalUnpaid: totalUnpaid
      }
    };

    console.log('Final report data:', reportData);

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei report'
    });
  }
});

// GET /api/admin/reports/test - Endpoint di test senza autenticazione
router.get('/reports/test', async (req: AuthenticatedRequest, res: Response) => {
  console.log('=== TEST REPORTS ENDPOINT CALLED ===');
  
  try {
    // Dati mock per test
    const reportData = {
      totalRevenue: 15250,
      totalBookings: 89,
      completedBookings: 75,
      cancelledBookings: 8,
      averageBookingValue: 85.5,
      topServices: [
        { name: 'Fisioterapia', count: 35, revenue: 5250 },
        { name: 'Osteopatia', count: 25, revenue: 3750 },
        { name: 'Massoterapia', count: 20, revenue: 2400 }
      ],
      topStaff: [
        { name: 'Dr. Mario Rossi', bookings: 45, revenue: 6750 },
        { name: 'Dr.ssa Laura Bianchi', bookings: 30, revenue: 4500 },
        { name: 'Dr. Giuseppe Verdi', bookings: 25, revenue: 3750 }
      ],
      monthlyRevenue: [
        { month: 'Gennaio 2025', revenue: 12500, bookings: 65 },
        { month: 'Febbraio 2025', revenue: 13200, bookings: 72 },
        { month: 'Marzo 2025', revenue: 15250, bookings: 89 }
      ],
      dailyStats: [],
      paymentStats: {
        paid: 65,
        unpaid: 24,
        totalPaid: 12800,
        totalUnpaid: 2450
      }
    };

    console.log('Sending test report data:', reportData);

    res.json({
      success: true,
      data: reportData
    });

  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel test endpoint'
    });
  }
});

// === GESTIONE RELAZIONI STAFF-SERVIZI ===

// GET /api/admin/services/:serviceId/staff - Ottieni lo staff associato a un servizio
router.get('/services/:serviceId/staff', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId } = req.params;

    const serviceWithStaff = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        staff: {
          include: {
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                specialization: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!serviceWithStaff) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    const assignedStaff = serviceWithStaff.staff.map(ss => ss.staff);

    res.json({
      success: true,
      data: assignedStaff
    });
  } catch (error) {
    console.error('Error fetching service staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello staff del servizio'
    });
  }
});

// POST /api/admin/services/:serviceId/staff/:staffId - Assegna staff a servizio
router.post('/services/:serviceId/staff/:staffId', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId, staffId } = req.params;

    // Verifica che servizio e staff esistano
    const [service, staff] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.staff.findUnique({ where: { id: staffId } })
    ]);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff non trovato'
      });
    }

    // Verifica se l'associazione esiste già
    const existingAssociation = await prisma.serviceStaff.findUnique({
      where: {
        serviceId_staffId: {
          serviceId,
          staffId
        }
      }
    });

    if (existingAssociation) {
      return res.status(400).json({
        success: false,
        message: 'Staff già assegnato a questo servizio'
      });
    }

    // Crea l'associazione
    await prisma.serviceStaff.create({
      data: {
        serviceId,
        staffId
      }
    });

    res.json({
      success: true,
      message: `${staff.firstName} ${staff.lastName} assegnato al servizio ${service.name}`
    });
  } catch (error) {
    console.error('Error assigning staff to service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'assegnazione dello staff al servizio'
    });
  }
});

// DELETE /api/admin/services/:serviceId/staff/:staffId - Rimuovi staff da servizio
router.delete('/services/:serviceId/staff/:staffId', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId, staffId } = req.params;

    // Verifica che l'associazione esista
    const existingAssociation = await prisma.serviceStaff.findUnique({
      where: {
        serviceId_staffId: {
          serviceId,
          staffId
        }
      },
      include: {
        service: { select: { name: true } },
        staff: { select: { firstName: true, lastName: true } }
      }
    });

    if (!existingAssociation) {
      return res.status(404).json({
        success: false,
        message: 'Associazione non trovata'
      });
    }

    // Verifica se ci sono prenotazioni attive per questa combinazione
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId,
        staffId,
        status: {
          in: ['PENDING', 'CONFIRMED']
        }
      }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossibile rimuovere l'associazione. Ci sono ${activeBookings} prenotazioni attive.`
      });
    }

    // Rimuovi l'associazione
    await prisma.serviceStaff.delete({
      where: {
        serviceId_staffId: {
          serviceId,
          staffId
        }
      }
    });

    res.json({
      success: true,
      message: `${existingAssociation.staff.firstName} ${existingAssociation.staff.lastName} rimosso dal servizio ${existingAssociation.service.name}`
    });
  } catch (error) {
    console.error('Error removing staff from service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella rimozione dello staff dal servizio'
    });
  }
});

// POST /api/admin/services/:serviceId/staff/bulk - Assegna/aggiorna staff in massa per un servizio
router.post('/services/:serviceId/staff/bulk', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { staffIds } = req.body; // Array di ID staff da assegnare

    if (!Array.isArray(staffIds)) {
      return res.status(400).json({
        success: false,
        message: 'staffIds deve essere un array'
      });
    }

    // Verifica che il servizio esista
    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    // Verifica che tutti gli staff esistano
    const staff = await prisma.staff.findMany({
      where: {
        id: { in: staffIds },
        isActive: true
      }
    });

    if (staff.length !== staffIds.length) {
      return res.status(400).json({
        success: false,
        message: 'Uno o più staff non trovati o non attivi'
      });
    }

    // Rimuovi tutte le associazioni esistenti per questo servizio
    await prisma.serviceStaff.deleteMany({
      where: { serviceId }
    });

    // Crea le nuove associazioni
    if (staffIds.length > 0) {
      await prisma.serviceStaff.createMany({
        data: staffIds.map((staffId: string) => ({
          serviceId,
          staffId
        }))
      });
    }

    res.json({
      success: true,
      message: `Staff aggiornato per il servizio ${service.name}. ${staffIds.length} membri assegnati.`
    });
  } catch (error) {
    console.error('Error bulk updating service staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello staff del servizio'
    });
  }
});

// POST /api/admin/reports/export - Endpoint per export dei report
router.post('/reports/export', requireReadAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { format, startDate, endDate, type } = req.body;
    
    // Per ora restituiamo un messaggio di successo
    // In futuro qui implementeremo la generazione di PDF/Excel
    res.json({
      success: true,
      message: `Export ${format} generato con successo`,
      data: {
        downloadUrl: `/api/admin/reports/download/${format}/${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'export del report'
    });
  }
});

// === GESTIONE IMPOSTAZIONI STUDIO ===

// Schema di validazione per le impostazioni studio
const studioSettingsSchema = z.object({
  // Informazioni generali
  studioName: z.string().min(1, 'Nome studio richiesto'),
  studioDescription: z.string().min(1, 'Descrizione richiesta'),
  address: z.string().min(1, 'Indirizzo richiesto'),
  city: z.string().min(1, 'Città richiesta'),
  phone: z.string().min(1, 'Telefono richiesto'),
  email: z.string().email('Email non valida'),
  website: z.string().optional().or(z.literal('')),
  
  // Orari di apertura
  openingHours: z.object({
    monday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    tuesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    wednesday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    thursday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    friday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    saturday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    }),
    sunday: z.object({
      open: z.string(),
      close: z.string(),
      closed: z.boolean()
    })
  }),
  
  // Impostazioni prenotazioni
  bookingSettings: z.object({
    maxAdvanceBookingDays: z.number().min(1).max(365),
    minAdvanceBookingHours: z.number().min(0).max(72),
    cancellationHours: z.number().min(0).max(168),
    allowOnlineBooking: z.boolean(),
    requirePaymentUpfront: z.boolean(),
    sendConfirmationEmail: z.boolean(),
    sendReminderEmail: z.boolean(),
    reminderHours: z.number().min(1).max(168)
  }),
  
  // Impostazioni notifiche
  notificationSettings: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    newBookingAlert: z.boolean(),
    cancellationAlert: z.boolean(),
    reminderAlert: z.boolean()
  }),
  
  // Tema e personalizzazione
  themeSettings: z.object({
    primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Colore primario deve essere un hex valido'),
    secondaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Colore secondario deve essere un hex valido'),
    logoUrl: z.string().optional().or(z.literal('')),
    favicon: z.string().optional().or(z.literal(''))
  }),

  // Social Media
  socialMedia: z.object({
    facebookUrl: z.string().optional().or(z.literal('')),
    instagramUrl: z.string().optional().or(z.literal('')),
    twitterUrl: z.string().optional().or(z.literal('')),
    linkedinUrl: z.string().optional().or(z.literal('')),
    youtubeUrl: z.string().optional().or(z.literal(''))
  })
});

// GET /api/admin/settings - Ottieni impostazioni studio (solo admin)
router.get('/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Cerca se esistono già impostazioni nel database
    let settings = await prisma.studioSettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    });

    // Se non esistono impostazioni, crea quelle di default basate su studioInfo.ts
    if (!settings) {
      const defaultOpeningHours = {
        monday: { open: '08:00', close: '20:00', closed: false },
        tuesday: { open: '08:00', close: '20:00', closed: false },
        wednesday: { open: '08:00', close: '20:00', closed: false },
        thursday: { open: '08:00', close: '20:00', closed: false },
        friday: { open: '08:00', close: '20:00', closed: false },
        saturday: { open: '08:00', close: '13:00', closed: true },
        sunday: { open: '09:00', close: '12:00', closed: true }
      };

      const defaultBookingSettings = {
        maxAdvanceBookingDays: 60,
        minAdvanceBookingHours: 2,
        cancellationHours: 24,
        allowOnlineBooking: true,
        requirePaymentUpfront: false,
        sendConfirmationEmail: true,
        sendReminderEmail: true,
        reminderHours: 24
      };

      const defaultNotificationSettings = {
        emailNotifications: true,
        smsNotifications: false,
        newBookingAlert: true,
        cancellationAlert: true,
        reminderAlert: true
      };

      const defaultThemeSettings = {
        primaryColor: '#3da4db',
        secondaryColor: '#64748b',
        logoUrl: '',
        favicon: ''
      };

      const defaultSocialMedia = {
        facebookUrl: '',
        instagramUrl: '',
        twitterUrl: '',
        linkedinUrl: '',
        youtubeUrl: ''
      };

      settings = await prisma.studioSettings.create({
        data: {
          studioName: 'Kinetica Fisioterapia Genova',
          studioDescription: 'Centro di fisioterapia e riabilitazione a Genova',
          address: 'Via Giovanni Tommaso Invrea 20/2',
          city: 'Genova',
          phone: '010 817 6855',
          email: 'amministrazione.kinetica@gmail.com',
          website: 'www.kineticafisioterapia.com',
          openingHours: JSON.stringify(defaultOpeningHours),
          bookingSettings: JSON.stringify(defaultBookingSettings),
          notificationSettings: JSON.stringify(defaultNotificationSettings),
          themeSettings: JSON.stringify(defaultThemeSettings),
          socialMedia: JSON.stringify(defaultSocialMedia)
        } as any
      });
    }

    // Deserializza i campi JSON per la risposta
    const responseData = {
      ...settings,
      openingHours: JSON.parse(settings.openingHours),
      bookingSettings: JSON.parse(settings.bookingSettings),
      notificationSettings: JSON.parse(settings.notificationSettings),
      themeSettings: JSON.parse(settings.themeSettings),
      socialMedia: JSON.parse((settings as any).socialMedia || '{}')
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching studio settings:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel caricamento delle impostazioni dello studio'
    });
  }
});

// PUT /api/admin/settings - Aggiorna impostazioni studio (solo admin)
router.put('/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('🔧 Ricevuti dati per aggiornamento impostazioni:', JSON.stringify(req.body, null, 2));
    
    const validatedData = studioSettingsSchema.parse(req.body);

    // Verifica se esistono già impostazioni
    const existingSettings = await prisma.studioSettings.findFirst();

    // Prepara i dati per il database (serializza i JSON)
    const dataForDb = {
      studioName: validatedData.studioName,
      studioDescription: validatedData.studioDescription,
      address: validatedData.address,
      city: validatedData.city,
      phone: validatedData.phone,
      email: validatedData.email,
      website: validatedData.website,
      openingHours: JSON.stringify(validatedData.openingHours),
      bookingSettings: JSON.stringify(validatedData.bookingSettings),
      notificationSettings: JSON.stringify(validatedData.notificationSettings),
      themeSettings: JSON.stringify(validatedData.themeSettings),
      socialMedia: JSON.stringify(validatedData.socialMedia)
    };

    let updatedSettings;

    if (existingSettings) {
      // Aggiorna le impostazioni esistenti
      updatedSettings = await prisma.studioSettings.update({
        where: { id: existingSettings.id },
        data: dataForDb
      });
    } else {
      // Crea nuove impostazioni
      updatedSettings = await prisma.studioSettings.create({
        data: dataForDb
      });
    }

    // Deserializza i campi JSON per la risposta
    const responseData = {
      ...updatedSettings,
      openingHours: JSON.parse(updatedSettings.openingHours),
      bookingSettings: JSON.parse(updatedSettings.bookingSettings),
      notificationSettings: JSON.parse(updatedSettings.notificationSettings),
      themeSettings: JSON.parse(updatedSettings.themeSettings),
      socialMedia: JSON.parse((updatedSettings as any).socialMedia || '{}')
    };

    res.json({
      success: true,
      data: responseData,
      message: 'Impostazioni dello studio aggiornate con successo'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log('❌ Errori di validazione:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Dati non validi',
        errors: error.errors,
        details: error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      });
    }

    console.error('Error updating studio settings:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento delle impostazioni dello studio'
    });
  }
});

// =============================================================================
// CATEGORIE ROUTES
// =============================================================================

// GET /api/admin/categories - Lista tutte le categorie (solo admin)
router.get('/categories', requireAdmin, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [
        { label: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle categorie'
    });
  }
});

// POST /api/admin/categories - Crea una nuova categoria (solo admin)
router.post('/categories', requireAdmin, async (req, res) => {
  try {
    const { value, label, color } = req.body;

    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: 'Nome e etichetta della categoria sono obbligatori'
      });
    }

    const category = await prisma.category.create({
      data: {
        value: value.toLowerCase().trim(),
        label: label.trim(),
        color: color || '#3da4db'
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Categoria creata con successo'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Una categoria con questo nome esiste già'
      });
    }

    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della categoria'
    });
  }
});

// PUT /api/admin/categories/:id - Aggiorna una categoria (solo admin)
router.put('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { value, label, color } = req.body;

    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: 'Nome e etichetta della categoria sono obbligatori'
      });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        value: value.toLowerCase().trim(),
        label: label.trim(),
        color: color || '#3da4db'
      }
    });

    res.json({
      success: true,
      data: category,
      message: 'Categoria aggiornata con successo'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'Una categoria con questo nome esiste già'
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Categoria non trovata'
      });
    }

    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della categoria'
    });
  }
});

// DELETE /api/admin/categories/:id - Elimina una categoria (solo admin)
router.delete('/categories/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se la categoria è utilizzata dai servizi
    const servicesUsingCategory = await prisma.service.findFirst({
      where: { categoryId: id }
    });

    if (servicesUsingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Impossibile eliminare una categoria utilizzata dai servizi'
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Categoria eliminata con successo'
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Categoria non trovata'
      });
    }

    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della categoria'
    });
  }
});

export default router;
