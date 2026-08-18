import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reports/students
router.get('/students', protect, async (req, res, next) => {
  try {
    const report = await prisma.student.findMany({
      where: { adminId: req.admin.id },
      orderBy: [{ className: 'asc' }, { firstName: 'asc' }]
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/fees
router.get('/fees', protect, async (req, res, next) => {
  try {
    const report = await prisma.fee.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/complaints
router.get('/complaints', protect, async (req, res, next) => {
  try {
    const report = await prisma.complaint.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

// GET /api/reports/visitors
router.get('/visitors', protect, async (req, res, next) => {
  try {
    const report = await prisma.visitor.findMany({
      where: { adminId: req.admin.id },
      include: {
        student: { select: { firstName: true, lastName: true, rollNumber: true } }
      },
      orderBy: { checkIn: 'desc' }
    });
    res.json({ success: true, report });
  } catch (err) { next(err); }
});

export default router;
