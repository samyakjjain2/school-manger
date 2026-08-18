import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const log = async (action, detail, userId) => {
  try { await prisma.activityLog.create({ data: { module: 'Students', action, detail, userId } }); } catch {}
};

// GET /api/students
router.get('/', protect, async (req, res, next) => {
  try {
    const { search, className, status, page = 1, limit = 20 } = req.query;
    const where = { adminId: req.admin.id };
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { rollNumber: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (className) where.className = className;
    if (status) where.status = status;

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * +limit,
        take: +limit,
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.student.count({ where })
    ]);

    res.json({
      success: true,
      students,
      total,
      page: +page,
      pages: Math.ceil(total / +limit)
    });
  } catch (err) { next(err); }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({
      where: { id: req.params.id, adminId: req.admin.id },
      include: {
        fees: { orderBy: { createdAt: 'desc' } },
        complaints: { orderBy: { createdAt: 'desc' } },
        visitors: { orderBy: { createdAt: 'desc' } }
      }
    });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// POST /api/students
router.post('/', protect, async (req, res, next) => {
  try {
    const { email, rollNumber } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    
    if (normalizedEmail) {
      const existingEmail = await prisma.student.findFirst({ where: { email: normalizedEmail, adminId: req.admin.id } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    if (rollNumber) {
      const existingRoll = await prisma.student.findFirst({ where: { rollNumber, adminId: req.admin.id } });
      if (existingRoll) return res.status(400).json({ success: false, message: 'Roll number already exists' });
    }

    const { 
      firstName, lastName, phone, dateOfBirth, gender, className,
      address, parentName, parentPhone, parentEmail,
      emergencyContact, admissionDate, status, photo
    } = req.body;

    const parseDate = (val) => {
      if (!val || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const dobParsed = parseDate(dateOfBirth);
    if (!dobParsed) {
      return res.status(400).json({ success: false, message: 'Valid Date of Birth is required' });
    }

    const student = await prisma.student.create({ 
      data: { 
        firstName,
        lastName,
        email: normalizedEmail || '',
        phone,
        dateOfBirth: dobParsed,
        gender: gender || 'Male',
        rollNumber,
        className,
        address,
        parentName,
        parentPhone,
        parentEmail: parentEmail ? parentEmail.trim().toLowerCase() : null,
        emergencyContact,
        admissionDate: parseDate(admissionDate) || new Date(),
        status: status || 'Active',
        photo,
        adminId: req.admin.id 
      } 
    });
    await log('Created', `Added student: ${student.firstName} ${student.lastName}`, req.admin.id);
    res.status(201).json({ success: true, student });
  } catch (err) { next(err); }
});

// PUT /api/students/:id
router.put('/:id', protect, async (req, res, next) => {
  try {
    const exists = await prisma.student.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!exists) return res.status(404).json({ success: false, message: 'Student not found' });

    const { email, rollNumber } = req.body;
    const normalizedEmail = email ? email.trim().toLowerCase() : undefined;
    
    if (normalizedEmail) {
      const existingEmail = await prisma.student.findFirst({ where: { email: normalizedEmail, adminId: req.admin.id, NOT: { id: req.params.id } } });
      if (existingEmail) return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    if (rollNumber) {
      const existingRoll = await prisma.student.findFirst({ where: { rollNumber, adminId: req.admin.id, NOT: { id: req.params.id } } });
      if (existingRoll) return res.status(400).json({ success: false, message: 'Roll number already in use' });
    }

    const {
      firstName, lastName, phone, className, gender, dateOfBirth,
      parentName, parentPhone, address, photo,
      admissionDate, status
    } = req.body;

    const parseDate = (val) => {
      if (!val || val === '') return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    };

    const updateData = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (normalizedEmail !== undefined) updateData.email = normalizedEmail;
    if (phone !== undefined) updateData.phone = phone;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (className !== undefined) updateData.className = className;
    if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.dateOfBirth = parseDate(dateOfBirth) || exists.dateOfBirth;
    if (parentName !== undefined) updateData.parentName = parentName;
    if (parentPhone !== undefined) updateData.parentPhone = parentPhone;
    if (address !== undefined) updateData.address = address;
    if (photo !== undefined) updateData.photo = photo;
    if (admissionDate !== undefined) updateData.admissionDate = parseDate(admissionDate) || exists.admissionDate;
    if (status !== undefined) updateData.status = status;

    const student = await prisma.student.update({
      where: { id: req.params.id },
      data: updateData
    });
    await log('Updated', `Updated student: ${student.firstName} ${student.lastName}`, req.admin.id);
    res.json({ success: true, student });
  } catch (err) { next(err); }
});

// DELETE /api/students/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const student = await prisma.student.findFirst({ where: { id: req.params.id, adminId: req.admin.id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    
    await prisma.student.delete({ where: { id: req.params.id } });
    await log('Deleted', `Deleted student: ${student.firstName} ${student.lastName}`, req.admin.id);
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) { next(err); }
});

export default router;
