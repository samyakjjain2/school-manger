import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(protect);

// 1. Create Transport Route
router.post(
  '/',
  [
    body('vehicleNumber').notEmpty().withMessage('Vehicle number is required'),
    body('routeName').notEmpty().withMessage('Route name is required'),
    body('driverName').notEmpty().withMessage('Driver name is required'),
    body('driverPhone').notEmpty().withMessage('Driver contact details are required'),
    body('monthlyCharge').isFloat({ min: 0 }).withMessage('Monthly charge must be positive')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { vehicleNumber, routeName, driverName, driverPhone, monthlyCharge } = req.body;
      const route = await prisma.transportRoute.create({
        data: {
          adminId: req.admin.id,
          vehicleNumber,
          routeName,
          driverName,
          driverPhone,
          monthlyCharge: parseFloat(monthlyCharge)
        }
      });
      res.status(201).json({ success: true, route });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Fetch Routes Catalog
router.get('/', async (req, res, next) => {
  try {
    const routes = await prisma.transportRoute.findMany({
      where: { adminId: req.admin.id },
      include: {
        students: true
      },
      orderBy: { routeName: 'asc' }
    });
    res.json({ success: true, routes });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Transport Route
router.delete('/:id', async (req, res, next) => {
  try {
    const route = await prisma.transportRoute.findFirst({
      where: { id: req.params.id, adminId: req.admin.id }
    });

    if (!route) return res.status(404).json({ success: false, message: 'Route not found' });

    await prisma.transportRoute.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Route deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// 4. Allocate Student to Route
router.put(
  '/allocate',
  [
    body('studentId').notEmpty().withMessage('Student ID is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { studentId, routeId } = req.body; // routeId can be null to deallocate

      const student = await prisma.student.findFirst({
        where: { id: studentId, adminId: req.admin.id }
      });

      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      if (routeId) {
        const route = await prisma.transportRoute.findFirst({
          where: { id: routeId, adminId: req.admin.id }
        });
        if (!route) return res.status(404).json({ success: false, message: 'Transport route not found' });
      }

      const updated = await prisma.student.update({
        where: { id: studentId },
        data: { transportRouteId: routeId || null }
      });

      res.json({ success: true, student: updated });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
