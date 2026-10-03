import React, { useState, useEffect } from 'react';
import {
  Bell,
  Camera,
  ShieldCheck,
  User as UserIcon,
  ChevronDown,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  DollarSign
} from 'lucide-react';
import { User, Notification, Role } from '../types';

interface NavbarProps {
  currentUser: User;
  notifications: Notification[];
  onSwitchRole: (role: Role) => void;
  onOpenFaceModal: () => void;
  onOpenNotifications: () => void;
  activeBranchName: string;
  onNavigateTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notifications,
  onSwitchRole,
  onOpenFaceModal,
  onOpenNotifications,
  activeBranchName,
  onNavigateTab,
}) => {
  const [time, setTime] = useState<string>('');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const roleLabels: Record<Role, { name: string; badge: string; color: string }> = {
    admin: { name: 'System Administrator', badge: 'SUPER ADMIN', color: 'bg-indigo-600 text-white' },
    hr_manager: { name: 'HR Manager', badge: 'HR DIR', color: 'bg-emerald-600 text-white' },
    supervisor: { name: 'Supervisor / Manager', badge: 'SUPERVISOR', color: 'bg-amber-600 text-white' },
    employee: { name: 'Staff Employee', badge: 'EMPLOYEE', color: 'bg-blue-600 text-white' },
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity & Active Branch */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigateTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 font-black text-xl text-white tracking-wider">
              A
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">ApexHR</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>{activeBranchName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Digital Clock & Biometric Quick Action */}
        <div className="hidden md:flex items-center space-x-4">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 font-mono text-sm">
            <Clock className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-100">{time}</span>
            <span className="text-[11px] text-slate-400 font-sans">EAT (UTC+3)</span>
          </div>

          <button
            onClick={onOpenFaceModal}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer transform active:scale-95"
          >
            <Camera className="w-4 h-4 text-white" />
            <span>Face Clock-In / Out</span>
          </button>
        </div>

        {/* Right: Role Switcher & Notifications & User Profile */}
        <div className="flex items-center space-x-3">
          {/* Quick Role Switcher Pill Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <div className="text-left hidden sm:block">
                <span className="text-slate-400 text-[10px] block leading-none">Simulate Role:</span>
                <span className="font-semibold">{roleLabels[currentUser.role]?.name}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-800 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="px-2 py-1.5 border-b border-slate-700 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Active Persona
                </div>
                {(['admin', 'hr_manager', 'supervisor', 'employee'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      onSwitchRole(r);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      currentUser.role === r ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{roleLabels[r].name}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold ${roleLabels[r].color}`}>
                      {roleLabels[r].badge}
                    </span>
                  </button>
                ))}
                <div className="mt-2 p-2 rounded bg-slate-900/80 text-[11px] text-slate-400">
                  Allows instant testing of full RBAC permissions, approvals & portals.
                </div>
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="System Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Avatar & Name */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-indigo-600 border border-slate-600 flex items-center justify-center text-xs font-bold text-white shadow">
              {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">{currentUser.name}</p>
              <p className="text-[10px] text-slate-400">{currentUser.email}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
