import React from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  Clock,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCheck
} from 'lucide-react';
import { Notification } from '../../types';
import { api } from '../../services/api';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onRefresh,
  onNavigateTab,
}) => {
  if (!isOpen) return null;

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllAsRead();
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await api.notifications.markAsRead(notif.id);
        onRefresh();
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.linkTab) {
      onNavigateTab(notif.linkTab);
      onClose();
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'attendance':
        return <Clock className="w-4 h-4 text-emerald-400" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-purple-400" />;
      case 'payroll':
        return <DollarSign className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-sm">Notifications & Reminders</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleMarkAllRead}
              className="text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800 text-xs">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleItemClick(notif)}
              className={`p-4 transition cursor-pointer hover:bg-slate-800/40 flex items-start space-x-3 ${
                !notif.read ? 'bg-slate-800/20' : ''
              }`}
            >
              <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 mt-0.5">
                {getIcon(notif.type)}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${!notif.read ? 'text-white' : 'text-slate-300'}`}>
                    {notif.title}
                  </span>
                  {!notif.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{notif.message}</p>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {notifications.length === 0 && (
            <div className="py-12 text-center text-slate-500">No new notifications.</div>
          )}
        </div>
      </div>
    </div>
  );
};
