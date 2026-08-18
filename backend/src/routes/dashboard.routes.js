import express from 'express';
import prisma from '../config/db.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res, next) => {
  try {
    const adminId = req.admin.id;
    const startOfToday = new Date(new Date().setHours(0,0,0,0));
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalStudents, activeStudents, totalStaff,
      pendingFeesAgg, pendingComplaints, todayVisitors, recentStudents,
      monthlyRevenueAgg, classDistributionGroup
    ] = await Promise.all([
      prisma.student.count({ where: { adminId } }),
      prisma.student.count({ where: { status: 'Active', adminId } }),
      prisma.staff.count({ where: { status: 'Active', adminId } }),
      prisma.fee.aggregate({
        _sum: { amount: true, paidAmount: true },
        where: { status: { in: ['Pending', 'Overdue'] }, adminId }
      }),
      prisma.complaint.count({ where: { status: { in: ['Pending', 'InProgress'] }, adminId } }),
      prisma.visitor.count({ where: { status: 'CheckedIn', adminId, checkIn: { gte: startOfToday } } }),
      prisma.student.findMany({
        where: { adminId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, firstName: true, lastName: true, className: true, admissionDate: true, status: true }
      }),
      prisma.fee.aggregate({
        _sum: { paidAmount: true },
        where: { status: 'Paid', adminId, paidAt: { gte: startOfMonth } }
      }),
      prisma.student.groupBy({
        by: ['className'],
        _count: { id: true },
        where: { adminId }
      })
    ]);

    const pendingFees = Math.max(0, (pendingFeesAgg._sum.amount || 0) - (pendingFeesAgg._sum.paidAmount || 0));
    const monthlyRevenue = monthlyRevenueAgg._sum.paidAmount || 0;

    const classDistribution = classDistributionGroup.map(item => ({
      className: item.className,
      count: item._count.id
    })).sort((a,b) => b.count - a.count).slice(0, 5);

    res.json({
      success: true,
      stats: {
        totalStudents,
        activeStudents,
        totalStaff,
        pendingFees,
        pendingComplaints,
        todayVisitors,
        monthlyRevenue,
        recentStudents,
        classDistribution
      }
    });
  } catch (err) { next(err); }
});

// GET /api/dashboard/activity
router.get('/activity', protect, async (req, res, next) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { userId: req.admin.id },
      take: 20, orderBy: { createdAt: 'desc' },
      include: { admin: { select: { name: true } } }
    });
    res.json({ success: true, logs });
  } catch (err) { next(err); }
});

// GET /api/dashboard/fee-trend
router.get('/fee-trend', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear(), label: d.toLocaleString('default', { month: 'short', year: '2-digit' }) };
    }).reverse();

    const data = await Promise.all(months.map(async ({ month, year, label }) => {
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 1);
      const agg = await prisma.fee.aggregate({
        _sum: { paidAmount: true },
        where: {
          status: 'Paid',
          adminId: req.admin.id,
          paidAt: {
            gte: startOfMonth,
            lt: endOfMonth
          }
        }
      });
      return { label, amount: agg._sum.paidAmount || 0 };
    }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
});

export default router;
