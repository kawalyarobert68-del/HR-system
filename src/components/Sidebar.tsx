import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarCheck,
  ScanFace,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  ShieldAlert,
  UserCheck,
  Database,
  Briefcase
} from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userRole: Role;
  pendingApprovalsCount?: number;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  badge?: number;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  userRole,
  pendingApprovalsCount = 0,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'HR Executive Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'hr_manager', 'supervisor'],
    },
    {
      id: 'self-service',
      label: 'Employee Portal',
      icon: UserCheck,
      roles: ['admin', 'hr_manager', 'supervisor', 'employee'],
      highlight: userRole === 'employee',
    },
    {
      id: 'employees',
      label: 'Employee Management',
      icon: Users,
      roles: ['admin', 'hr_manager', 'supervisor'],
    },
    {
      id: 'attendance',
      label: 'Daily Attendance & Logs',
      icon: Clock,
      roles: ['admin', 'hr_manager', 'supervisor', 'employee'],
    },
    {
      id: 'monthly-sheet',
      label: 'Monthly Attendance Sheet',
      icon: CalendarCheck,
      roles: ['admin', 'hr_manager', 'supervisor'],
    },
    {
      id: 'biometrics',
      label: 'Face Biometric Enrollment',
      icon: ScanFace,
      roles: ['admin', 'hr_manager'],
    },
    {
      id: 'leave',
      label: 'Leave Management',
      icon: Calendar,
      roles: ['admin', 'hr_manager', 'supervisor', 'employee'],
      badge: pendingApprovalsCount,
    },
    {
      id: 'schedules',
      label: 'Work Schedules & Shifts',
      icon: Layers,
      roles: ['admin', 'hr_manager', 'supervisor'],
    },
    {
      id: 'payroll',
      label: 'Payroll & Payslips',
      icon: DollarSign,
      roles: ['admin', 'hr_manager', 'employee'],
    },
    {
      id: 'performance',
      label: 'Performance & KPIs',
      icon: TrendingUp,
      roles: ['admin', 'hr_manager', 'supervisor', 'employee'],
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      icon: FileSpreadsheet,
      roles: ['admin', 'hr_manager', 'supervisor'],
    },
    {
      id: 'settings',
      label: 'System & MySQL Export',
      icon: Settings,
      roles: ['admin'],
    },
    {
      id: 'audit',
      label: 'Security & Audit Logs',
      icon: ShieldAlert,
      roles: ['admin', 'hr_manager'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Navigation Modules
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              } ${item.highlight && !isActive ? 'ring-1 ring-cyan-500/50 bg-cyan-950/20 text-cyan-200' : ''}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && item.badge > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-slate-900">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Biometric Engine Online</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Liveness anti-spoofing & 128-d cosine template matching active.
          </p>
        </div>
      </div>
    </aside>
  );
};
