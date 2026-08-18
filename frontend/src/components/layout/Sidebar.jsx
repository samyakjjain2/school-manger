import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  History,
  AlertOctagon, 
  UserCheck, 
  ClipboardList, 
  FileBarChart, 
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert as ShieldIcon,
  Calendar,
  GraduationCap,
  BookOpen,
  Bus,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { user } = useAuth();
  const [openDropdown, setOpenDropdown] = useState({
    students: false,
    finance: false
  });

  const toggleDropdown = (key) => {
    setOpenDropdown(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      title: 'MAIN',
      items: [
        { name: 'Student Registry', path: '/students', icon: Users },
        { name: 'Staff & Teachers', path: '/staff', icon: Users }
      ]
    },
    {
      title: 'ACADEMICS',
      items: [
        { name: 'Class Timetable', path: '/timetable', icon: Calendar },
        { name: 'Exams & Grading', path: '/exams', icon: GraduationCap }
      ]
    },
    {
      title: 'FINANCE',
      items: [
        { name: 'Fee Ledger', path: '/fees', icon: CreditCard },
        { name: 'Staff Payroll', path: '/payroll', icon: Receipt }
      ]
    },
    {
      title: 'RESOURCES',
      items: [
        { name: 'Library Registry', path: '/library', icon: BookOpen },
        { name: 'Transport Routes', path: '/transport', icon: Bus }
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { name: 'Complaints / Issues', path: '/complaints', icon: AlertOctagon },
        { name: 'Visitors Log', path: '/visitors', icon: UserCheck },
        { name: 'Notice Board', path: '/notices', icon: ClipboardList }
      ]
    },
    {
      title: 'REPORTS',
      items: [
        { name: 'Reports & Analytics', path: '/reports', icon: FileBarChart }
      ]
    },
    {
      title: 'SETTINGS',
      items: [
        { name: 'Settings', path: '/profile', icon: Settings }
      ]
    }
  ];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 z-40 w-[280px] bg-white text-slate-750 border-r border-slate-200 transition-transform duration-200 md:translate-x-0 flex flex-col justify-between overflow-y-auto ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <ShieldIcon size={18} className="fill-white/10" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-800 block tracking-tight leading-none">
                EduManager
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wide mt-1 block">
                School Operations
              </span>
            </div>
          </div>
        </div>

        {/* Dashboard Link */}
        <div className="px-4 pt-6">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all group cursor-pointer ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-sm font-bold' 
                  : 'hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </NavLink>
        </div>

        {/* Side Menu Sections */}
        <div className="px-4 py-4 space-y-5">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-1.5">
              <h5 className="text-[10px] font-bold text-slate-400 tracking-wider px-3.5 uppercase">
                {section.title}
              </h5>
              
              <div className="space-y-0.5">
                {section.items.map((item, itemIdx) => {
                  if (item.hasSubmenu) {
                    const isDropdownOpen = openDropdown[item.submenuKey];
                    return (
                      <div key={itemIdx} className="space-y-1">
                        <button
                          onClick={() => toggleDropdown(item.submenuKey)}
                          className="w-full flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <item.icon size={16} />
                            <span>{item.name}</span>
                          </div>
                          {isDropdownOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        {isDropdownOpen && (
                          <div className="pl-9 pr-2 py-1 space-y-1 bg-slate-50 rounded-lg">
                            {item.submenuItems.map((sub, subIdx) => {
                              const isCurrentActive = window.location.pathname === sub.path;
                              return (
                                <NavLink
                                  key={subIdx}
                                  to={sub.path}
                                  className={
                                    `block py-1.5 px-2 rounded-md text-[11px] font-semibold transition ${
                                      isCurrentActive
                                        ? 'text-blue-650 bg-slate-100 font-bold'
                                        : 'text-slate-500 hover:text-slate-805 hover:bg-slate-100'
                                    }`
                                  }
                                >
                                  {sub.name}
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={itemIdx}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all group cursor-pointer ${
                          isActive 
                            ? 'bg-blue-600 text-white shadow-sm font-bold' 
                            : 'hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <item.icon size={16} className="shrink-0 transition-transform group-hover:scale-105" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-200 bg-white sticky bottom-0">
        <Link 
          to="/profile"
          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-50 border border-slate-150 hover:bg-slate-100 transition shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img 
              src={user?.avatar || `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><rect width='40' height='40' rx='20' fill='%232563EB'/><text x='50%25' y='55%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='16' font-family='system-ui' font-weight='bold'>${encodeURIComponent((user?.name || 'A')[0].toUpperCase())}</text></svg>`} 
              alt="avatar" 
              className="h-8 w-8 rounded-full object-cover border border-slate-200 shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' rx='20' fill='%232563EB'/></svg>`; }}
            />
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.name || 'Administrator'}</p>
              <p className="text-[10px] text-slate-400 truncate font-semibold uppercase tracking-wider mt-0.5">
                {user?.schoolName || 'School Admin'}
              </p>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </Link>
      </div>
    </aside>
  );
};
