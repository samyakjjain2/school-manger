import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(protect);

// 1. Fetch Staff with Payout Ledger history
router.get('/', async (req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { adminId: req.admin.id },
      include: {
        salaryPayouts: {
          orderBy: { paidAt: 'desc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, staff });
  } catch (err) {
    next(err);
  }
});

// 2. Update staff basic salary amount
router.put(
  '/salary/:staffId',
  [body('salary').isFloat({ min: 0 }).withMessage('Salary amount must be positive')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { salary } = req.body;
      const staffMember = await prisma.staff.findFirst({
        where: { id: req.params.staffId, adminId: req.admin.id }
      });

      if (!staffMember) return res.status(404).json({ success: false, message: 'Staff profile not found' });

      const updated = await prisma.staff.update({
        where: { id: req.params.staffId },
        data: { salary: parseFloat(salary) }
      });

      res.json({ success: true, staff: updated });
    } catch (err) {
      next(err);
    }
  }
);

// 3. Log Salary Payout
router.post(
  '/payout',
  [
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Payout amount must be greater than 0'),
    body('paymentMode').notEmpty().withMessage('Payment mode is required'),
    body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
    body('year').isInt({ min: 2000 }).withMessage('Year must be valid')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { staffId, amount, paymentMode, month, year } = req.body;

      const staffMember = await prisma.staff.findFirst({
        where: { id: staffId, adminId: req.admin.id }
      });

      if (!staffMember) return res.status(404).json({ success: false, message: 'Staff profile not found' });

      // Check if already paid for the month/year
      const existing = await prisma.salaryPayout.findFirst({
        where: { staffId, month, year }
      });

      if (existing) {
        return res.status(400).json({ success: false, message: 'Salary already processed for this month/year' });
      }

      const payout = await prisma.salaryPayout.create({
        data: {
          staffId,
          amount: parseFloat(amount),
          paymentMode,
          month: parseInt(month),
          year: parseInt(year)
        }
      });

      // Log system activity log
      await prisma.activityLog.create({
        data: {
          module: 'Payroll',
          action: 'Salary Disbursed',
          detail: `Disbursed salary payout of ₹${amount} to staff member ${staffMember.name}`,
          userId: req.admin.id
        }
      });

      res.status(201).json({ success: true, payout });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
