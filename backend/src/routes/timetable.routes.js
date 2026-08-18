import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(protect);

// 1. Create Timetable Timing Slot
router.post(
  '/',
  [
    body('className').notEmpty().withMessage('Class name is required'),
    body('day').notEmpty().withMessage('Day is required'),
    body('subjectName').notEmpty().withMessage('Subject name is required'),
    body('teacherName').notEmpty().withMessage('Teacher name is required'),
    body('startTime').notEmpty().withMessage('Start time is required'),
    body('endTime').notEmpty().withMessage('End time is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { className, day, subjectName, teacherName, startTime, endTime } = req.body;
      const slot = await prisma.timetable.create({
        data: {
          adminId: req.admin.id,
          className,
          day,
          subjectName,
          teacherName,
          startTime,
          endTime
        }
      });
      res.status(201).json({ success: true, slot });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Fetch Timetable list
router.get('/', async (req, res, next) => {
  try {
    const { className } = req.query;
    const whereClause = { adminId: req.admin.id };
    if (className) whereClause.className = className;

    const timetable = await prisma.timetable.findMany({
      where: whereClause,
      orderBy: [
        { startTime: 'asc' }
      ]
    });
    res.json({ success: true, timetable });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Timetable slot
router.delete('/:id', async (req, res, next) => {
  try {
    const slot = await prisma.timetable.findFirst({
      where: { id: req.params.id, adminId: req.admin.id }
    });

    if (!slot) return res.status(404).json({ success: false, message: 'Timetable entry slot not found' });

    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Timetable entry deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
