import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Visitors', action, detail, userId } }); } catch {}
};

// GET /api/visitors
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, status, studentId } = req.query;
    const where = { adminId: req.admin.id };

    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        {
          student: {
            adminId: req.admin.id,
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    const visitors = await prisma.visitor.findMany({
      where,
      orderBy: { checkIn: 'desc' },
      include: {
        student: { select: { firstName: true, lastName: true, className: true } }
      }
    });

    res.json({ success: true, visitors });
  } catch (err) { next(err); }
});

// POST /api/visitors OR /api/visitors/checkin
const createVisitor = async (req, res, next) => {
  try {
    const { studentId, name, phone, relation, purpose, idProof, notes } = req.body;
    const student = await prisma.student.findFirst({ where: { id: studentId, adminId: req.admin.id } });
    if (!student) return res.status(400).json({ success: false, message: 'Invalid Student ID' });

    const visitor = await prisma.visitor.create({
      data: {
        studentId,
        name,
        phone,
        relation: relation || 'Other',
        purpose,
        idProof,
        notes,
        checkIn: new Date(),
        status: 'CheckedIn',
        adminId: req.admin.id
      }
    });
    await log('CheckIn', `Visitor ${visitor.name} checked in to meet student ID ${visitor.studentId}`, req.admin.id);
    res.status(201).json({ success: true, visitor });
  } catch (err) { next(err); }
};

router.post('/', protect, createVisitor);
router.post('/checkin', protect, createVisitor);

// PUT /api/visitors/:id/checkout
router.put('/:id/checkout', protect, async (req, res, next) => {
  try {
    const exists = await prisma.visitor.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Visitor record not found' });

    if (exists.status === 'CheckedOut') {
      return res.status(400).json({ success: false, message: 'Visitor has already checked out' });
    }

    const visitor = await prisma.visitor.update({
      where: { id: req.params.id },
      data: {
        checkOut: new Date(),
        status: 'CheckedOut'
      }
    });
    await log('CheckOut', `Visitor ${visitor.name} checked out`, req.admin.id);
    res.json({ success: true, visitor });
  } catch (err) { next(err); }
});

export default router;
