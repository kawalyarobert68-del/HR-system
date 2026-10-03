import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Download,
  Camera,
  Search,
  ScanFace,
  ShieldCheck,
  MapPin,
  FileEdit
} from 'lucide-react';
import { AttendanceRecord, Employee, Department, Branch, Role } from '../../types';
import { AttendanceCorrections } from './AttendanceCorrections';

interface AttendanceManagerProps {
  attendance: AttendanceRecord[];
  employees: Employee[];
  departments: Department[];
  branches: Branch[];
  userRole: Role;
  currentEmployee?: Employee | null;
  onOpenFaceModal: () => void;
  onRefresh: () => void;
}

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  attendance,
  employees,
  departments,
  branches,
  userRole,
  currentEmployee,
  onOpenFaceModal,
  onRefresh,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'records' | 'exceptions'>('records');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchEmp, setSearchEmp] = useState<string>('');

  const filteredRecords = attendance.filter((rec) => {
    const emp = employees.find((e) => e.id === rec.employeeId);
    if (!emp) return false;

    // In employee role, only show own records
    if (userRole === 'employee' && currentEmployee && rec.employeeId !== currentEmployee.id) {
      return false;
    }

    if (selectedDate && rec.date !== selectedDate) return false;
    if (selectedDept !== 'all' && emp.departmentId !== selectedDept) return false;
    if (selectedStatus !== 'all' && rec.status !== selectedStatus) return false;

    if (searchEmp) {
      const q = searchEmp.toLowerCase();
      const matchName = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(q);
      const matchNum = emp.employeeNumber.toLowerCase().includes(q);
      if (!matchName && !matchNum) return false;
    }

    return true;
  });

  // Calculate stats for current filter
  const totalPresent = filteredRecords.filter((r) => r.status === 'present').length;
  const totalLate = filteredRecords.filter((r) => r.status === 'late').length;
  const totalAbsent = filteredRecords.filter((r) => r.status === 'absent').length;
  const totalLateMins = filteredRecords.reduce((acc, r) => acc + (r.minutesLate || 0), 0);

  const handleExportCSV = () => {
    const headers = ['Record ID', 'Date', 'Employee ID', 'Employee Name', 'Shift', 'Clock In', 'Clock Out', 'Hours Worked', 'Status', 'Minutes Late', 'Method', 'Location'];
    const rows = filteredRecords.map((r) => {
      const emp = employees.find((e) => e.id === r.employeeId);
      return [
        r.id,
        r.date,
        emp?.employeeNumber || '',
        `"${emp?.firstName} ${emp?.lastName}"`,
        r.shiftId,
        r.clockInTime || '',
        r.clockOutTime || '',
        r.totalHours,
        r.status,
        r.minutesLate,
        r.clockInMethod,
        `"${r.clockInLocation || ''}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `attendance_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Attendance Logs & Exceptions</h2>
          <p className="text-xs text-slate-400">
            Real-time biometric attendance ledger, late time tracking, and verification audits.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveSubTab('records')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeSubTab === 'records' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Attendance Records
            </button>
            <button
              onClick={() => setActiveSubTab('exceptions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
                activeSubTab === 'exceptions' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>Correction Requests</span>
            </button>
          </div>

          <button
            onClick={onOpenFaceModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Face Clock-In / Out</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'exceptions' ? (
        <AttendanceCorrections
          employees={employees}
          userRole={userRole}
          currentEmployee={currentEmployee}
          onRefresh={onRefresh}
        />
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Counters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Present</span>
              <span className="text-2xl font-black text-emerald-400">{totalPresent}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Late Check-ins</span>
              <span className="text-2xl font-black text-amber-400">{totalLate}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Absent Records</span>
              <span className="text-2xl font-black text-rose-400">{totalAbsent}</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Cumulative Late Minutes</span>
              <span className="text-2xl font-black text-cyan-400">{totalLateMins} mins</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search staff or ID..."
                value={searchEmp}
                onChange={(e) => setSearchEmp(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Date */}
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Dept */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="present">Present (On-Time)</option>
                <option value="late">Late Arrival</option>
                <option value="absent">Absent</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>

            {/* Export */}
            <div className="flex items-center">
              <button
                onClick={handleExportCSV}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center space-x-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Log (CSV)</span>
              </button>
            </div>
          </div>

          {/* Records Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Clock In</th>
                    <th className="py-3.5 px-4">Clock Out</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Status & Lateness</th>
                    <th className="py-3.5 px-4">Method & Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredRecords.map((rec) => {
                    const emp = employees.find((e) => e.id === rec.employeeId);
                    return (
                      <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-200">{rec.date}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-100">
                            {emp?.firstName} {emp?.lastName}
                          </p>
                          <span className="text-[10px] text-slate-400">{emp?.employeeNumber}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                          {rec.clockInTime || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                          {rec.clockOutTime || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white">
                            {rec.totalHours > 0 ? `${rec.totalHours} hrs` : 'In Progress'}
                          </span>
                          {rec.overtimeHours > 0 && (
                            <span className="block text-[10px] text-cyan-400 font-mono">
                              +{rec.overtimeHours}h OT
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              rec.status === 'present'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : rec.status === 'late'
                                ? 'bg-amber-500/20 text-amber-300'
                                : rec.status === 'on_leave'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {rec.status}
                          </span>
                          {rec.minutesLate > 0 && (
                            <span className="block text-[10px] text-amber-400 mt-0.5">
                              {rec.minutesLate} mins late
                            </span>
                          )}
                          {rec.notes && <p className="text-[10px] text-slate-400 italic mt-0.5">{rec.notes}</p>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            {rec.clockInMethod === 'face' ? (
                              <span className="flex items-center gap-1 text-[11px] text-cyan-300 font-semibold">
                                <ScanFace className="w-3.5 h-3.5" /> Face (
                                {Math.round((rec.faceConfidence || 0.92) * 100)}%)
                              </span>
                            ) : (
                              <span className="text-[11px] text-amber-400 font-semibold">
                                Manual ({rec.verifiedBy || 'Supervisor'})
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">
                            {rec.clockInLocation || 'HQ Kampala'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                        No attendance records match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
