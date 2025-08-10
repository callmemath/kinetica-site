import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireReadAccess, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// GET /api/categories - Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { label: 'asc' },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server durante il recupero delle categorie'
    });
  }
});

// GET /api/categories/admin - Get all categories for admin (including inactive)
router.get('/admin', authenticateToken, requireReadAccess, async (req: AuthenticatedRequest, res) => {
  try {    
    // Check if user is staff or admin
    const user = req.user;
    const userRole = user?.role?.toLowerCase();
    
    if (userRole !== 'admin' && userRole !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo gli amministratori possono accedere a questa risorsa.'
      });
    }

    const categories = await prisma.category.findMany({
      orderBy: { label: 'asc' },
      include: {
        _count: {
          select: {
            services: true
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching admin categories:', error);
    res.status(500).json({
      success: false,
      message: 'Errore del server durante il recupero delle categorie'
    });
  }
});

// POST /api/categories - Create new category
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo gli amministratori possono creare categorie.'
      });
    }

    const { value, label, color } = req.body;

    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: 'Nome e etichetta della categoria sono obbligatori'
      });
    }

    // Check if category with same value already exists
    const existingCategory = await prisma.category.findUnique({
      where: { value }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Una categoria con questo nome esiste già'
      });
    }

    const category = await prisma.category.create({
      data: {
        value,
        label,
        color: color || '#3da4db'
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Categoria creata con successo'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della categoria'
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo gli amministratori possono modificare categorie.'
      });
    }

    const { id } = req.params;
    const { value, label, color, isActive } = req.body;

    if (!value || !label) {
      return res.status(400).json({
        success: false,
        message: 'Nome e etichetta della categoria sono obbligatori'
      });
    }

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoria non trovata'
      });
    }

    // Check if another category with same value already exists (exclude current)
    if (value !== existingCategory.value) {
      const duplicateCategory = await prisma.category.findUnique({
        where: { value }
      });

      if (duplicateCategory) {
        return res.status(400).json({
          success: false,
          message: 'Una categoria con questo nome esiste già'
        });
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        value,
        label,
        color: color || '#3da4db',
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json({
      success: true,
      data: category,
      message: 'Categoria aggiornata con successo'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della categoria'
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato. Solo gli amministratori possono eliminare categorie.'
      });
    }

    const { id } = req.params;

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { services: true }
        }
      }
    });

    if (!existingCategory) {
      return res.status(404).json({
        success: false,
        message: 'Categoria non trovata'
      });
    }

    // Check if category is used by services
    if (existingCategory._count.services > 0) {
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
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della categoria'
    });
  }
});

export default router;
