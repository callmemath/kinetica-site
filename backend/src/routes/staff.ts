import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/staff - Ottieni tutti i membri dello staff attivi
router.get('/', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        specialization: true,
        yearsOfExperience: true,
        bio: true,
        avatar: true,
        workingHours: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Staff recuperato con successo',
      data: staff
    });

  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello staff'
    });
  }
});

// GET /api/staff/:id - Ottieni un membro dello staff specifico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const staffMember = await prisma.staff.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Membro dello staff non trovato'
      });
    }

    res.json({
      success: true,
      message: 'Membro dello staff recuperato con successo',
      data: staffMember
    });

  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del membro dello staff'
    });
  }
});

// ========== ENDPOINTS PER LO STAFF AUTENTICATO ==========

// GET /api/staff/my-profile - Ottieni il proprio profilo staff
router.get('/my-profile', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    console.log('=== MY-PROFILE DEBUG ===');
    console.log('User from token:', req.user);
    console.log('UserId:', userId);
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Trova il profilo staff associato all'utente
    const staffProfile = await prisma.staff.findUnique({
      where: { userId },
      include: {
        services: {
          include: {
            service: true
          }
        }
      }
    });

    console.log('Staff profile found:', staffProfile);

    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profilo staff non trovato'
      });
    }

    res.json({
      success: true,
      message: 'Profilo staff recuperato con successo',
      data: staffProfile
    });

  } catch (error) {
    console.error('Error fetching staff profile:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del profilo staff'
    });
  }
});

// GET /api/staff/my-services - Ottieni solo i servizi assegnati allo staff
router.get('/my-services', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== MY-SERVICES ENDPOINT CALLED ===');
    console.log('Request URL:', req.originalUrl);
    console.log('Request params:', req.params);
    console.log('User from token:', req.user);
    
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    // Trova il profilo staff associato all'utente
    console.log('Looking for staff with userId:', userId);
    const staffProfile = await prisma.staff.findUnique({
      where: { userId }
    });

    console.log('Staff profile found:', staffProfile);

    if (!staffProfile) {
      console.log('Staff profile NOT found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'Profilo staff non trovato'
      });
    }

    // Ottieni solo i servizi assegnati a questo staff
    const services = await prisma.service.findMany({
      where: {
        staff: {
          some: {
            staffId: staffProfile.id
          }
        },
        isActive: true
      },
      include: {
        staff: {
          where: {
            staffId: staffProfile.id
          },
          include: {
            staff: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      message: 'Servizi dello staff recuperati con successo',
      data: services
    });

  } catch (error) {
    console.error('Error fetching staff services:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei servizi dello staff'
    });
  }
});

// GET /api/staff/my-working-hours - Ottieni i propri orari di lavoro
router.get('/my-working-hours', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    const staffProfile = await prisma.staff.findUnique({
      where: { userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workingHours: true
      }
    });

    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profilo staff non trovato'
      });
    }

    // Parse degli orari di lavoro (JSON string)
    let workingHours = {};
    if (staffProfile.workingHours) {
      try {
        workingHours = JSON.parse(staffProfile.workingHours);
      } catch (e) {
        console.error('Error parsing working hours:', e);
        workingHours = {};
      }
    }

    res.json({
      success: true,
      message: 'Orari di lavoro recuperati con successo',
      data: {
        staffId: staffProfile.id,
        firstName: staffProfile.firstName,
        lastName: staffProfile.lastName,
        workingHours
      }
    });

  } catch (error) {
    console.error('Error fetching working hours:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero degli orari di lavoro'
    });
  }
});

// PUT /api/staff/my-working-hours - Aggiorna i propri orari di lavoro
router.put('/my-working-hours', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const { workingHours } = req.body;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utente non autenticato'
      });
    }

    if (!workingHours || typeof workingHours !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Orari di lavoro non validi'
      });
    }

    // Validazione della struttura degli orari
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of validDays) {
      if (workingHours[day]) {
        const daySchedule = workingHours[day];
        if (typeof daySchedule !== 'object' || 
            typeof daySchedule.isWorking !== 'boolean' ||
            (daySchedule.isWorking && (!daySchedule.startTime || !daySchedule.endTime))) {
          return res.status(400).json({
            success: false,
            message: `Orari non validi per ${day}`
          });
        }
      }
    }

    const staffProfile = await prisma.staff.findUnique({
      where: { userId }
    });

    if (!staffProfile) {
      return res.status(404).json({
        success: false,
        message: 'Profilo staff non trovato'
      });
    }

    // Aggiorna gli orari di lavoro
    const updatedStaff = await prisma.staff.update({
      where: { id: staffProfile.id },
      data: {
        workingHours: JSON.stringify(workingHours)
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        workingHours: true
      }
    });

    res.json({
      success: true,
      message: 'Orari di lavoro aggiornati con successo',
      data: {
        staffId: updatedStaff.id,
        firstName: updatedStaff.firstName,
        lastName: updatedStaff.lastName,
        workingHours: JSON.parse(updatedStaff.workingHours || '{}')
      }
    });

  } catch (error) {
    console.error('Error updating working hours:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento degli orari di lavoro'
    });
  }
});

export default router;
