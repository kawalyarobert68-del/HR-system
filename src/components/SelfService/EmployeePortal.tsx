import React, { useState } from 'react';
import {
  User,
  Clock,
  Calendar,
  DollarSign,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  Send,
  Plus,
  TrendingUp,
  ShieldCheck,
  Eye
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveApplication, LeaveBalance, Holiday, PayrollRecord } from '../../types';

interface EmployeePortalProps {
  currentEmployee: Employee;
  attendance: AttendanceRecord[];
  leaveBalances: LeaveBalance[];
  leaveApplications: LeaveApplication[];
  holidays: Holiday[];
  payroll: PayrollRecord[];
  onOpenFaceModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  currentEmployee,
  attendance,
  leaveBalances,
  leaveApplications,
  holidays,
  payroll,
  onOpenFaceModal,
  onNavigateTab,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayAtt = attendance.find((r) => r.employeeId === currentEmployee.id && r.date === todayStr);

  const curMonth = todayStr.substring(0, 7);
  const myMonthAtt = attendance.filter((r) => r.employeeId === currentEmployee.id && r.date.startsWith(curMonth));

  const daysWorked = myMonthAtt.filter((r) => r.status === 'present' || r.status === 'late').length;
  const lateDays = myMonthAtt.filter((r) => r.status === 'late').length;
  const totalLateMins = myMonthAtt.reduce((sum, r) => sum + (r.minutesLate || 0), 0);
  const totalHours = myMonthAtt.reduce((sum, r) => sum + (r.totalHours || 0), 0);

  const myLeaves = leaveApplications.filter((l) => l.employeeId === currentEmployee.id);
  const myPayslips = payroll.filter((p) => p.employeeId === currentEmployee.id);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 border border-indigo-400/40 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {currentEmployee.firstName[0]}
              {currentEmployee.lastName[0]}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-white">
                  Welcome back, {currentEmployee.firstName}!
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentEmployee.employeeNumber}
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                {currentEmployee.jobTitle} • Standard Shift (08:00 — 17:00 EAT)
              </p>
            </div>
          </div>

          {/* Quick Clock Button */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenFaceModal}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Face Clock-In / Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Status & Monthly Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Today's Attendance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Today's Attendance</span>
          {myTodayAtt ? (
            <div className="mt-2 space-y-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  myTodayAtt.status === 'present'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : myTodayAtt.status === 'late'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-indigo-500/20 text-indigo-300'
                }`}
              >
                {myTodayAtt.status} {myTodayAtt.minutesLate > 0 ? `(+${myTodayAtt.minutesLate}m)` : ''}
              </span>
              <p className="text-xs text-slate-300 font-mono mt-1">In: {myTodayAtt.clockInTime || '—'}</p>
            </div>
          ) : (
            <div className="mt-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                Not Clocked In Yet
              </span>
              <p className="text-[11px] text-indigo-400 mt-1 cursor-pointer" onClick={onOpenFaceModal}>
                Clock in now →
              </p>
            </div>
          )}
        </div>

        {/* Days Worked */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Days Worked This Month</span>
          <p className="text-2xl font-black text-white mt-1">{daysWorked} Days</p>
          <p className="text-[10px] text-emerald-400 mt-0.5">{totalHours.toFixed(1)} total hours logged</p>
        </div>

        {/* Late Days */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Late Check-ins</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{lateDays} Days</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{totalLateMins} mins total delay</p>
        </div>

        {/* Leave Balance Quick Card */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Annual Leave Remaining</span>
          {(() => {
            const bal = leaveBalances.find((b) => b.employeeId === currentEmployee.id);
            return (
              <p className="text-2xl font-black text-indigo-400 mt-1">
                {bal ? bal.remainingDays : 21} <span className="text-xs text-slate-400 font-normal">/ 21 Days</span>
              </p>
            );
          })()}
          <span
            onClick={() => onNavigateTab('leave')}
            className="text-[11px] text-indigo-300 underline cursor-pointer mt-1"
          >
            Apply for leave →
          </span>
        </div>
      </div>

      {/* Grid: My Recent Logs & Upcoming Holidays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: My Attendance History (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">My Personal Attendance Records</h3>
              <p className="text-xs text-slate-400">Verified biometric records for {curMonth}</p>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Submit Discrepancy Correction
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Clock In</th>
                  <th className="p-3">Clock Out</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {myMonthAtt.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-semibold text-white font-sans">{r.date}</td>
                    <td className="p-3 text-emerald-400">{r.clockInTime || '—'}</td>
                    <td className="p-3 text-amber-400">{r.clockOutTime || '—'}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-sans ${
                          r.status === 'present'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : r.status === 'late'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        {r.status} {r.minutesLate > 0 ? `(+${r.minutesLate}m)` : ''}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-slate-400 font-sans">
                      {r.clockInMethod === 'face' ? 'Face Scanner' : 'Supervisor Manual'}
                    </td>
                  </tr>
                ))}

                {myMonthAtt.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500 font-sans">
                      No clock records logged for current month yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Upcoming Holidays & Payslips (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upcoming Holidays */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Calendar className="w-4 h-4" />
              <h3 className="font-bold text-white text-xs uppercase tracking-wider">Upcoming Holidays</h3>
            </div>
            <div className="divide-y divide-slate-800 text-xs">
              {holidays.slice(0, 3).map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-200">{h.name}</p>
                    <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">Statutory</span>
                </div>
              ))}
            </div>
          </div>

          {/* My Digital Payslips */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <h3 className="font-bold text-white text-xs uppercase tracking-wider">My Digital Payslips</h3>
              </div>
              <button
                onClick={() => onNavigateTab('payroll')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                View all →
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {myPayslips.slice(0, 2).map((p) => (
                <div key={p.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-indigo-400 font-semibold">{p.payslipNumber}</span>
                    <p className="text-[11px] text-slate-300 mt-0.5">Net: UGX {p.netSalary.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('payroll')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {myPayslips.length === 0 && (
                <p className="text-xs text-slate-500 py-3 text-center">No published payslips for your account yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
