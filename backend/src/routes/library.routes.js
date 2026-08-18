import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

router.use(protect);

// 1. Register Library Book in Catalog
router.post(
  '/books',
  [
    body('title').notEmpty().withMessage('Book title is required'),
    body('author').notEmpty().withMessage('Author name is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { title, author, isbn } = req.body;
      const book = await prisma.book.create({
        data: {
          adminId: req.admin.id,
          title,
          author,
          isbn
        }
      });
      res.status(201).json({ success: true, book });
    } catch (err) {
      next(err);
    }
  }
);

// 2. Fetch Books Catalog
router.get('/books', async (req, res, next) => {
  try {
    const books = await prisma.book.findMany({
      where: { adminId: req.admin.id },
      orderBy: { title: 'asc' }
    });
    res.json({ success: true, books });
  } catch (err) {
    next(err);
  }
});

// 3. Delete Book
router.delete('/books/:id', async (req, res, next) => {
  try {
    const book = await prisma.book.findFirst({
      where: { id: req.params.id, adminId: req.admin.id }
    });

    if (!book) return res.status(404).json({ success: false, message: 'Book asset not found' });

    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Book deleted' });
  } catch (err) {
    next(err);
  }
});

// 4. Issue Book to Student
router.post(
  '/issues',
  [
    body('bookId').notEmpty().withMessage('Book ID is required'),
    body('studentId').notEmpty().withMessage('Student ID is required'),
    body('dueDate').notEmpty().withMessage('Return due date is required')
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    try {
      const { bookId, studentId, dueDate } = req.body;

      // Verify book availability
      const book = await prisma.book.findFirst({
        where: { id: bookId, adminId: req.admin.id }
      });

      if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
      if (book.status !== 'Available') {
        return res.status(400).json({ success: false, message: 'Book is currently issued to another student' });
      }

      // Check student exists
      const student = await prisma.student.findFirst({
        where: { id: studentId, adminId: req.admin.id }
      });
      if (!student) return res.status(404).json({ success: false, message: 'Student profile not found' });

      // Create issue log
      const issue = await prisma.bookIssue.create({
        data: {
          bookId,
          studentId,
          dueDate: new Date(dueDate)
        }
      });

      // Update book status
      await prisma.book.update({
        where: { id: bookId },
        data: { status: 'Issued' }
      });

      res.status(201).json({ success: true, issue });
    } catch (err) {
      next(err);
    }
  }
);

// 5. Log Book Return and Calculate Fine
router.put('/issues/:issueId/return', async (req, res, next) => {
  try {
    const issue = await prisma.bookIssue.findUnique({
      where: { id: req.params.issueId },
      include: { book: true }
    });

    if (!issue) return res.status(404).json({ success: false, message: 'Borrowing transaction not found' });
    if (issue.returnDate) return res.status(400).json({ success: false, message: 'Book is already returned' });

    const returnDate = new Date();
    const dueDate = new Date(issue.dueDate);
    
    // Calculate simple fine (e.g., ₹5 per day late)
    let fineAmount = 0;
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fineAmount = diffDays * 5;
    }

    const updatedIssue = await prisma.bookIssue.update({
      where: { id: req.params.issueId },
      data: {
        returnDate,
        fineAmount
      }
    });

    // Mark book back as Available
    await prisma.book.update({
      where: { id: issue.bookId },
      data: { status: 'Available' }
    });

    res.json({ success: true, issue: updatedIssue });
  } catch (err) {
    next(err);
  }
});

// 6. Fetch Borrow Logs
router.get('/issues', async (req, res, next) => {
  try {
    const issues = await prisma.bookIssue.findMany({
      where: {
        book: {
          adminId: req.admin.id
        }
      },
      include: {
        book: true,
        student: true
      },
      orderBy: { issueDate: 'desc' }
    });
    res.json({ success: true, issues });
  } catch (err) {
    next(err);
  }
});

export default router;
