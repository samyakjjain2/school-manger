import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Fees', action, detail, userId } }); } catch {}
};

const parseInteger = (val) => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseDate = (val) => {
  if (!val || val === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

// GET /api/fees
router.get('/', protect, async (req, res, next) => {
  try {
    const { status, studentId, search, month, year, paymentMode, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;
    
    const parsedMonth = parseInteger(month);
    const parsedYear = parseInteger(year);
    if (parsedMonth !== null) where.month = parsedMonth;
    if (parsedYear !== null) where.year = parsedYear;
    
    if (paymentMode) {
      if (paymentMode.includes(',')) {
        where.paymentMode = { in: paymentMode.split(',') };
      } else {
        where.paymentMode = paymentMode;
      }
    }
    if (search) {
      where.student = {
        adminId: req.admin.id,
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { rollNumber: { contains: search, mode: 'insensitive' } }
        ]
      };
    }

    const [fees, total] = await Promise.all([
      prisma.fee.findMany({
        where,
        skip: (page - 1) * +limit,
        take: +limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, rollNumber: true, parentName: true, address: true } }
        }
      }),
      prisma.fee.count({ where })
    ]);

    res.json({
      success: true,
      fees,
      total,
      page: +page,
      pages: Math.ceil(total / +limit)
    });
  } catch (err) { next(err); }
});

// GET /api/fees/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const stats = await prisma.fee.groupBy({
      by: ['paymentMode'],
      _sum: {
        paidAmount: true
      },
      where: {
        adminId: req.admin.id,
        paidAmount: { gt: 0 }
      }
    });

    const breakdown = {
      UPI: 0,
      Cash: 0,
      "Debit Card": 0,
      "Credit Card": 0,
      "Bank Transfer": 0,
      Cheque: 0,
      Other: 0
    };

    let totalCollected = 0;
    stats.forEach(item => {
      const mode = item.paymentMode || 'Other';
      const amt = item._sum.paidAmount || 0;
      if (breakdown[mode] !== undefined) {
        breakdown[mode] = amt;
      } else {
        breakdown["Other"] = (breakdown["Other"] || 0) + amt;
      }
      totalCollected += amt;
    });

    res.json({ success: true, breakdown, totalCollected });
  } catch (err) { next(err); }
});

// GET /api/fees/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const fee = await prisma.fee.findFirst({
      where: { id: req.params.id, adminId: req.admin.id },
      include: {
        student: true
      }
    });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });
    res.json({ success: true, fee });
  } catch (err) { next(err); }
});

// POST /api/fees/generate
router.post('/generate', protect, async (req, res, next) => {
  try {
    const { month, year, dueDate } = req.body;
    const parsedMonth = parseInteger(month);
    const parsedYear = parseInteger(year);
    if (!parsedMonth || !parsedYear) {
      return res.status(400).json({ success: false, message: 'Valid Month and Year are required' });
    }

    // Read default fee amount from admin's profile settings
    const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });
    const singleAmount = admin?.defaultMonthlyAmount ?? 5000;

    // Get all active students under this admin
    const activeStudents = await prisma.student.findMany({
      where: { status: 'Active', adminId: req.admin.id }
    });

    let count = 0;
    const records = [];

    for (const student of activeStudents) {
      const existingFee = await prisma.fee.findFirst({
        where: {
          studentId: student.id,
          type: 'Tuition',
          month: parsedMonth,
          year: parsedYear,
          adminId: req.admin.id
        }
      });

      if (!existingFee) {
        records.push({
          studentId: student.id,
          adminId: req.admin.id,
          type: 'Tuition',
          month: parsedMonth,
          year: parsedYear,
          amount: singleAmount,
          paidAmount: 0,
          dueDate: parseDate(dueDate),
          status: 'Pending'
        });
        count++;
      }
    }

    if (records.length > 0) {
      await prisma.fee.createMany({ data: records });
      await log('Generated', `Generated tuition bills for ${count} students for month ${parsedMonth}/${parsedYear}`, req.admin.id);
    }

    res.json({ success: true, count, message: `Successfully generated ${count} fee records.` });
  } catch (err) { next(err); }
});

// POST /api/fees
router.post('/', protect, async (req, res, next) => {
  try {
    const { studentId, type, amount, month, year, dueDate } = req.body;
    
    const fee = await prisma.fee.create({
      data: {
        studentId,
        adminId: req.admin.id,
        type: type || 'Tuition',
        month: parseInteger(month),
        year: parseInteger(year),
        amount: parseFloat(amount) || 0,
        paidAmount: 0,
        dueDate: parseDate(dueDate),
        status: 'Pending'
      }
    });
    await log('Created', `Created fee record ID ${fee.id} for student ID ${fee.studentId}`, req.admin.id);
    res.status(201).json({ success: true, fee });
  } catch (err) { next(err); }
});

// PUT /api/fees/:id/pay
router.put('/:id/pay', protect, async (req, res, next) => {
  try {
    const { paidAmount: inputPaidAmount, discount, fine, paymentMode, transactionId, notes } = req.body;
    
    const fee = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    let newPaidAmount = fee.paidAmount + (+inputPaidAmount || 0);
    const totalAmount = fee.amount + (+fine || 0) - (+discount || 0);

    // Cap overpayment — never allow paidAmount to exceed totalAmount
    newPaidAmount = Math.min(newPaidAmount, totalAmount);

    let status = 'Pending';
    if (newPaidAmount >= totalAmount) {
      status = 'Paid';
    } else if (newPaidAmount > 0) {
      status = 'Partial';
    }

    const receiptNumber = 'REC-' + Date.now().toString().slice(-8).toUpperCase();

    const updated = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        paidAmount: newPaidAmount,
        discount: fee.discount + (+discount || 0),
        fine: fee.fine + (+fine || 0),
        paymentMode,
        transactionId,
        notes,
        status,
        receiptNumber: fee.receiptNumber || receiptNumber,
        paidAt: new Date()
      }
    });

    await log('Paid', `Processed payment for record ID ${fee.id}`, req.admin.id);
    res.json({ success: true, fee: updated });
  } catch (err) { next(err); }
});

// PUT /api/fees/:id/cancel-payment
router.put('/:id/cancel-payment', protect, async (req, res, next) => {
  try {
    const fee = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!fee) return res.status(404).json({ success: false, message: 'Fee record not found' });

    const updated = await prisma.fee.update({
      where: { id: req.params.id },
      data: {
        paidAmount: 0,
        paymentMode: null,
        transactionId: null,
        receiptNumber: null,
        status: 'Pending',
        paidAt: null
      }
    });

    await log('Cancelled', `Receipt cancelled for fee record ID ${fee.id}`, req.admin.id);
    res.json({ success: true, fee: updated, message: 'Receipt cancelled and payment reset successfully' });
  } catch (err) { next(err); }
});

// DELETE /api/fees/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.fee.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Fee record not found' });

    await prisma.fee.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted fee record ID ${req.params.id}`, req.admin.id);
    res.json({ success: true, message: 'Fee record deleted' });
  } catch (err) { next(err); }
});

export default router;
