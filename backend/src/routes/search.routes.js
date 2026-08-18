import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/search?q=query
router.get('/', protect, async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim() === '') {
      return res.json({
        success: true,
        results: { students: [], staff: [], complaints: [], notices: [] }
      });
    }

    const searchQuery = q.trim();

    // Query in parallel
    const [students, staff, complaints, notices] = await Promise.all([
      // 1. Search Students
      prisma.student.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { firstName: { contains: searchQuery, mode: 'insensitive' } },
            { lastName: { contains: searchQuery, mode: 'insensitive' } },
            { rollNumber: { contains: searchQuery, mode: 'insensitive' } },
            { email: { contains: searchQuery, mode: 'insensitive' } },
            { phone: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: 10
      }),

      // 2. Search Staff
      prisma.staff.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { name: { contains: searchQuery, mode: 'insensitive' } },
            { designation: { contains: searchQuery, mode: 'insensitive' } },
            { phone: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: 10
      }),

      // 3. Search Complaints
      prisma.complaint.findMany({
        where: {
          adminId: req.admin.id,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { description: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        include: {
          student: true
        },
        take: 10
      }),

      // 4. Search Notices
      prisma.notice.findMany({
        where: {
          createdBy: req.admin.id,
          OR: [
            { title: { contains: searchQuery, mode: 'insensitive' } },
            { content: { contains: searchQuery, mode: 'insensitive' } }
          ]
        },
        take: 10
      })
    ]);

    res.json({
      success: true,
      results: {
        students,
        staff,
        complaints,
        notices
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
