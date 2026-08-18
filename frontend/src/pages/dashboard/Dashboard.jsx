import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, useAuth } from '../../context/AuthContext';
import { RevenueChart } from '../../components/charts/DashboardCharts';
import { 
  Users, 
  FileText,
  AlertTriangle,
  Calendar, 
  ChevronRight, 
  Receipt,
  FileBarChart,
  UserPlus,
  ClipboardList,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    formatSystemDate();
  }, []);

  const formatSystemDate = () => {
    const d = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setCurrentDate(d.toLocaleDateString('en-US', options));
  };

  const fetchDashboardData = async () => {
    try {
      const [resStats, resRev, resLogs] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/fee-trend`),
        axios.get(`${API_URL}/dashboard/activity`)
      ]);

      if (resStats.data.success) setStats(resStats.data.stats);
      if (resRev.data.success) setRevenueData(resRev.data.data);
      if (resLogs.data.success) setLogs(resLogs.data.logs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Students', 
      value: stats?.totalStudents || 0, 
      sub: `${stats?.activeStudents || 0} Active`, 
      icon: Users, 
      iconBg: 'bg-blue-50', 
      iconColor: 'text-blue-600',
      path: '/students'
    },
    { 
      title: 'Total Staff', 
      value: stats?.totalStaff || 0, 
      sub: 'Teachers & Support', 
      icon: UserCheck, 
      iconBg: 'bg-emerald-50', 
      iconColor: 'text-emerald-600',
      path: '/staff'
    },
    { 
      title: 'Monthly Revenue', 
      value: `₹ ${stats?.monthlyRevenue?.toLocaleString('en-IN') || '0'}`, 
      sub: 'Tuition fees collected', 
      icon: TrendingUp, 
      iconBg: 'bg-purple-50', 
      iconColor: 'text-purple-600',
      path: '/fees'
    },
    { 
      title: 'Pending Fees', 
      value: `₹ ${stats?.pendingFees?.toLocaleString('en-IN') || '0'}`, 
      sub: 'Outstanding balance', 
      icon: FileText, 
      iconBg: 'bg-orange-50', 
      iconColor: 'text-orange-600',
      path: '/fees?status=Pending'
    },
    { 
      title: 'Open Complaints', 
      value: String(stats?.pendingComplaints || 0).padStart(2, '0'), 
      sub: 'Academic & Facilities', 
      icon: AlertTriangle, 
      iconBg: 'bg-rose-50', 
      iconColor: 'text-rose-600',
      path: '/complaints?status=Pending'
    },
    { 
      title: 'Today\'s Visitors', 
      value: stats?.todayVisitors || 0, 
      sub: 'Parents & Guests', 
      icon: Users, 
      iconBg: 'bg-slate-50', 
      iconColor: 'text-slate-600',
      path: '/visitors'
    }
  ];

  const quickActions = [
    { name: 'Enroll Student', icon: UserPlus, path: '/students', color: 'hover:border-blue-500 hover:text-blue-600' },
    { name: 'Add Staff Member', icon: UserCheck, path: '/staff', color: 'hover:border-emerald-500 hover:text-emerald-600' },
    { name: 'Collect Fee', icon: Receipt, path: '/fees', color: 'hover:border-orange-500 hover:text-orange-600' },
    { name: 'Visitor Log', icon: UserCheck, path: '/visitors', color: 'hover:border-purple-500 hover:text-purple-600' },
    { name: 'Post Notice', icon: ClipboardList, path: '/notices', color: 'hover:border-pink-500 hover:text-pink-600' },
    { name: 'Generate Reports', icon: FileBarChart, path: '/reports', color: 'hover:border-cyan-500 hover:text-cyan-600' }
  ];

  return (
    <div className="space-y-6 text-xs sm:text-sm text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-1.5 font-sans">
            {(() => {
              const hr = new Date().getHours();
              const greet = hr < 12 ? 'Good Morning' : hr < 17 ? 'Good Afternoon' : 'Good Evening';
              return `${greet}, ${user?.name || 'Principal'}`;
            })() } 👋
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Welcome to {user?.schoolName || 'Greenwood High'} school portal.</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 border border-blue-100 bg-blue-50/40 text-blue-600 font-semibold rounded-lg text-xs shadow-sm">
          <Calendar size={14} className="shrink-0" />
          <span>{currentDate}</span>
        </div>
      </div>

      {/* Quick Actions Grid layout */}
      <div className="premium-card p-6 !rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Quick Operations
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border border-border-custom bg-white text-txt-secondary cursor-pointer transition-all duration-150 active:scale-95 hover:-translate-y-0.5 ${action.color} hover:shadow-sm`}
            >
              <action.icon size={20} className="mb-2 shrink-0" />
              <span className="text-xs font-bold tracking-wide">{action.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div 
            key={i} 
            onClick={() => navigate(card.path)}
            className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-36 hover:shadow-md cursor-pointer select-none hover:scale-[1.02] duration-150 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor}`}>
                <card.icon size={16} />
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {card.value}
              </span>
              <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500">
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class distribution progress bars */}
        <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Class Distribution (Top 5)
          </h3>
          
          <div className="space-y-4 my-2 overflow-y-auto max-h-[220px] pr-1">
            {stats?.classDistribution?.map((c, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-705">
                  <span>{c.className || 'Unknown'}</span>
                  <span>{c.count} Students</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full" 
                    style={{ width: `${stats.totalStudents > 0 ? (c.count / stats.totalStudents) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {(!stats?.classDistribution || stats.classDistribution.length === 0) && (
              <p className="text-slate-400 italic text-center py-16">No class data found.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4 text-center">
            <Link to="/students" className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1">
              View Student Roster <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        {/* Collections trend chart */}
        <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fee Collections Trend
            </h3>
          </div>

          <div className="h-[260px] w-full">
            <RevenueChart data={revenueData} />
          </div>
        </div>
      </div>

      {/* Bottom row: System Activity Log */}
      <div className="premium-card p-6 !rounded-2xl flex flex-col justify-between h-96">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
          System Activity Logs
        </h3>

        <div className="space-y-4 py-2 max-h-[260px] overflow-y-auto pr-1 grow mt-2">
          {logs.slice(0, 5).map((log, i) => {
            const sliced = logs.slice(0, 5);
            return (
              <div key={i} className="flex gap-3 text-xs text-left">
                <div className="relative flex flex-col items-center">
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-sm" />
                  {i !== sliced.length - 1 && <div className="w-[1px] bg-slate-100 grow" />}
                </div>
                <div>
                  <p className="text-slate-700 font-medium">
                    <span className="text-slate-800 font-bold">{log.admin?.name}</span> {log.detail}
                  </p>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {log.module}
                  </span>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && (
            <p className="text-slate-400 italic text-center py-16">No recent activity logged.</p>
          )}
        </div>
      </div>
    </div>
  );
};
