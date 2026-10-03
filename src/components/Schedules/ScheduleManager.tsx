import React, { useState } from 'react';
import {
  Layers,
  Clock,
  Calendar,
  Plus,
  Moon,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Building2,
  MapPin
} from 'lucide-react';
import { Shift, Holiday, Employee, Department, Branch } from '../../types';

interface ScheduleManagerProps {
  shifts: Shift[];
  holidays: Holiday[];
  employees: Employee[];
  departments: Department[];
  branches: Branch[];
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  shifts,
  holidays,
  employees,
  departments,
  branches,
}) => {
  const [activeTab, setActiveTab] = useState<'shifts' | 'holidays'>('shifts');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Work Schedules, Shifts & Public Holidays</h2>
          <p className="text-xs text-slate-400">
            Define roster shifts, overnight patterns, grace periods, and national statutory holidays.
          </p>
        </div>

        <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('shifts')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Configured Shifts & Rosters
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'holidays' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Public Holidays Calendar ({holidays.length})
          </button>
        </div>
      </div>

      {activeTab === 'shifts' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {shifts.map((shift) => (
            <div
              key={shift.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2.5">
                  {shift.isOvernight ? (
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Moon className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Sun className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{shift.name}</h3>
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold">{shift.code}</span>
                  </div>
                </div>

                {shift.isOvernight && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300">
                    Overnight
                  </span>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Working Hours:</span>
                  <span className="font-mono font-bold text-white">
                    {shift.startTime} — {shift.endTime}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Late Grace Period:</span>
                  <span className="font-bold text-amber-400">{shift.gracePeriodMinutes} mins</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400">Mandatory Meal Break:</span>
                  <span className="font-bold text-slate-200">{shift.breakMinutes} mins</span>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1">Scheduled Work Days:</span>
                  <div className="flex items-center space-x-1">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayChar, idx) => {
                      const dayNum = idx + 1;
                      const isActive = shift.workDays.includes(dayNum);
                      return (
                        <span
                          key={idx}
                          className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold ${
                            isActive
                              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-600'
                          }`}
                        >
                          {dayChar}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm">Recognized Statutory Public Holidays (Uganda)</h3>
            <span className="text-xs text-slate-400">Non-working days excluded from absence calculations</span>
          </div>

          <div className="divide-y divide-slate-800 text-xs">
            {holidays.map((h) => (
              <div key={h.id} className="p-3.5 flex items-center justify-between hover:bg-slate-800/30">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-bold text-slate-200">{h.name}</p>
                    <p className="text-[10px] text-slate-400">{h.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-indigo-400 block">{h.date}</span>
                  <span className="text-[10px] text-slate-500">
                    {h.isRecurring ? 'Annual Recurring' : 'Calendar Specific'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
