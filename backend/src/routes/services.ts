import { Router } from 'express';
import { prisma } from '../utils/database';
import { z } from 'zod';

const router = Router();

// GET /api/services - Ottieni tutti i servizi attivi
router.get('/', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei servizi'
    });
  }
});

// GET /api/services/:id - Ottieni un servizio specifico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: {
        category: true
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servizio non trovato'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del servizio'
    });
  }
});

// GET /api/services/:id/staff - Ottieni lo staff disponibile per un servizio
router.get('/:id/staff', async (req, res) => {
  try {
    const { id } = req.params;

    const serviceStaff = await prisma.serviceStaff.findMany({
      where: { 
        serviceId: id,
        staff: { isActive: true }
      },
      include: {
        staff: true
      }
    });

    const staff = serviceStaff.map((ss: any) => ss.staff);

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('Error fetching service staff:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dello staff'
    });
  }
});

export default router;
