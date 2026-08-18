import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// All exam routes require auth protection
router.use(protect);

// 1. Create Exam Session
router.post(
  '/',
  [
    body('title').notEmpty().withMessage('Exam title is required'),
    body('term').notEmpty().withMessage('Exam term is required'),
    body('date').notEmpty().withMessage('Exam date is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { title, term, date } = req.body;
      const exam = await prisma.exam.create({
        data: {
          adminId: req.admin.id,
          title,
          term,
          date: new Date(date)
        }
      });

      res.status(201).json({ success: true, exam });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Fetch Exam Sessions
router.get('/', async (req, res, next) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { adminId: req.admin.id },
      orderBy: { date: 'desc' }
    });
    res.json({ success: true, exams });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Exam Session
router.delete('/:id', async (req, res, next) => {
  try {
    const exam = await prisma.exam.findFirst({
      where: { id: req.params.id, adminId: req.admin.id }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam session not found' });

    await prisma.exam.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Exam session deleted successfully' });
  } catch (err) {
    next(err);
  }
});

// 4. Submit Student Grades/Marks
router.post(
  '/marks',
  [
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('examId').notEmpty().withMessage('Exam ID is required'),
    body('subjectName').notEmpty().withMessage('Subject name is required'),
    body('marksObtained').isFloat({ min: 0 }).withMessage('Marks obtained must be positive'),
    body('maxMarks').isFloat({ min: 1 }).withMessage('Max marks must be greater than 0')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { studentId, examId, subjectName, marksObtained, maxMarks, remarks } = req.body;

      // Simple grading scale
      const pct = (marksObtained / maxMarks) * 100;
      let grade = 'F';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';
      else if (pct >= 50) grade = 'D';
      else if (pct >= 33) grade = 'E';

      // Check if existing record exists to update, else create
      const existingMark = await prisma.mark.findFirst({
        where: { studentId, examId, subjectName }
      });

      let mark;
      if (existingMark) {
        mark = await prisma.mark.update({
          where: { id: existingMark.id },
          data: { marksObtained, maxMarks, grade, remarks }
        });
      } else {
        mark = await prisma.mark.create({
          data: { studentId, examId, subjectName, marksObtained, maxMarks, grade, remarks }
        });
      }

      res.json({ success: true, mark });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Get Student Report Card details
router.get('/students/:studentId/report-card/:examId', async (req, res, next) => {
  try {
    const marks = await prisma.mark.findMany({
      where: {
        studentId: req.params.studentId,
        examId: req.params.examId
      }
    });

    const exam = await prisma.exam.findFirst({
      where: { id: req.params.examId, adminId: req.admin.id }
    });

    const student = await prisma.student.findFirst({
      where: { id: req.params.studentId, adminId: req.admin.id }
    });

    if (!student || !exam) {
      return res.status(404).json({ success: false, message: 'Student or Exam registry not found' });
    }

    res.json({ success: true, student, exam, marks });
  } catch (err) {
    next(err);
  }
});

// 6. GET marks sheet for a class in an exam
router.get('/:examId/class/:className', async (req, res, next) => {
  try {
    const { examId, className } = req.params;

    const exam = await prisma.exam.findFirst({
      where: { id: examId, adminId: req.admin.id }
    });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    // All students in this class under this admin
    const students = await prisma.student.findMany({
      where: { className, adminId: req.admin.id, status: 'Active' },
      orderBy: { rollNumber: 'asc' }
    });

    // All existing marks for this exam + these students
    const studentIds = students.map(s => s.id);
    const marks = await prisma.mark.findMany({
      where: { examId, studentId: { in: studentIds } }
    });

    res.json({ success: true, exam, students, marks });
  } catch (err) { next(err); }
});

// 7. Bulk save marks for multiple students
router.post('/marks/bulk', async (req, res, next) => {
  try {
    const { examId, entries } = req.body;
    // entries = [{ studentId, subjectName, marksObtained, maxMarks, remarks }]
    if (!examId || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'examId and entries array are required' });
    }

    const exam = await prisma.exam.findFirst({ where: { id: examId, adminId: req.admin.id } });
    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });

    const calcGrade = (obtained, max) => {
      const pct = (obtained / max) * 100;
      if (pct >= 90) return 'A+';
      if (pct >= 80) return 'A';
      if (pct >= 70) return 'B';
      if (pct >= 60) return 'C';
      if (pct >= 50) return 'D';
      if (pct >= 33) return 'E';
      return 'F';
    };

    let saved = 0;
    for (const entry of entries) {
      const { studentId, subjectName, marksObtained, maxMarks, remarks } = entry;
      if (!studentId || !subjectName || marksObtained === '' || marksObtained === undefined) continue;
      const obtained = parseFloat(marksObtained);
      const max = parseFloat(maxMarks) || 100;
      const grade = calcGrade(obtained, max);

      const existing = await prisma.mark.findFirst({ where: { studentId, examId, subjectName } });
      if (existing) {
        await prisma.mark.update({ where: { id: existing.id }, data: { marksObtained: obtained, maxMarks: max, grade, remarks: remarks || null } });
      } else {
        await prisma.mark.create({ data: { studentId, examId, subjectName, marksObtained: obtained, maxMarks: max, grade, remarks: remarks || null } });
      }
      saved++;
    }

    res.json({ success: true, saved, message: `${saved} mark records saved successfully.` });
  } catch (err) { next(err); }
});

export default router;
