import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Printer,
  Sparkles,
  Info
} from 'lucide-react';
import { Employee, Department, Branch } from '../../types';
import { api } from '../../services/api';

interface MonthlyAttendanceSheetProps {
  departments: Department[];
  branches: Branch[];
}

export const MonthlyAttendanceSheet: React.FC<MonthlyAttendanceSheetProps> = ({ departments, branches }) => {
  const [selectedMonth, setSelectedMonth] = useState('2026-10');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [matrixData, setMatrixData] = useState<{
    month: string;
    daysInMonth: number;
    matrix: {
      employee: Employee;
      dailyStatus: Record<number, { status: string; code: string; in?: string; out?: string }>;
      summary: {
        presentCount: number;
        lateCount: number;
        absentCount: number;
        leaveCount: number;
        daysWorked: number;
        totalWorkedHours: number;
        complianceRate: number;
      };
    }[];
  } | null>(null);

  const [loading, setLoading] = useState(false);

  const fetchMatrix = async () => {
    try {
      setLoading(true);
      const res = await api.attendance.getMonthlyMatrix(selectedMonth, selectedDept, selectedBranch);
      setMatrixData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatrix();
  }, [selectedMonth, selectedDept, selectedBranch]);

  const handleExportCSV = () => {
    if (!matrixData) return;
    const days = Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1);
    const headers = ['Employee ID', 'Name', 'Department', ...days.map((d) => `Day ${d}`), 'Days Worked', 'Late Days', 'Absent Days', 'Compliance %'];

    const rows = matrixData.matrix.map((row) => {
      const deptName = departments.find((d) => d.id === row.employee.departmentId)?.name || '';
      const dayCodes = days.map((d) => row.dailyStatus[d]?.code || '-');
      return [
        row.employee.employeeNumber,
        `"${row.employee.firstName} ${row.employee.lastName}"`,
        `"${deptName}"`,
        ...dayCodes,
        row.summary.daysWorked,
        row.summary.lateCount,
        row.summary.absentCount,
        `${row.summary.complianceRate}%`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `monthly_attendance_matrix_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCodeBadge = (code: string) => {
    switch (code) {
      case 'P':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'L':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'A':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'OL':
        return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
      case 'H':
        return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
      case 'W':
        return 'bg-slate-800 text-slate-500 border border-slate-700/50';
      default:
        return 'text-slate-600';
    }
  };

  const daysArray = matrixData ? Array.from({ length: matrixData.daysInMonth }, (_, i) => i + 1) : [];

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Monthly Attendance Matrix Sheet</h2>
          <p className="text-xs text-slate-400">
            Day-by-day workforce attendance grid from 1st to 31st with automated calculations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Matrix (CSV)</span>
          </button>
        </div>
      </div>

      {/* Legend Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-300">
        <span className="font-semibold text-slate-400 uppercase text-[10px]">Matrix Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">P</span>
          <span>Present (On-Time)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">L</span>
          <span>Late Check-in</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">A</span>
          <span>Absent</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">OL</span>
          <span>Approved Leave</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">H</span>
          <span>Public Holiday</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-400 border border-slate-700">W</span>
          <span>Weekend</span>
        </span>
      </div>

      {/* Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-3 px-3 text-left sticky left-0 bg-slate-800 z-10 min-w-[180px]">
                  Employee
                </th>
                {daysArray.map((day) => (
                  <th key={day} className="py-3 px-1.5 min-w-[32px] text-[11px] font-mono">
                    {day}
                  </th>
                ))}
                <th className="py-3 px-2 bg-slate-850 min-w-[70px] text-emerald-400">Worked</th>
                <th className="py-3 px-2 bg-slate-850 min-w-[60px] text-amber-400">Late</th>
                <th className="py-3 px-2 bg-slate-850 min-w-[60px] text-rose-400">Absent</th>
                <th className="py-3 px-2 bg-slate-850 min-w-[70px] text-cyan-400">Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {matrixData?.matrix.map((row) => (
                <tr key={row.employee.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-3 text-left sticky left-0 bg-slate-900 z-10 border-r border-slate-800 font-sans">
                    <p className="font-bold text-slate-100 text-xs truncate max-w-[170px]">
                      {row.employee.firstName} {row.employee.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">{row.employee.employeeNumber}</p>
                  </td>

                  {daysArray.map((day) => {
                    const cell = row.dailyStatus[day];
                    return (
                      <td key={day} className="py-2 px-1 text-[11px]" title={cell ? `${cell.status} ${cell.in ? `(In: ${cell.in})` : ''}` : ''}>
                        {cell ? (
                          <span
                            className={`inline-block w-6 h-6 leading-6 text-center rounded text-[10px] font-bold ${getCodeBadge(
                              cell.code
                            )}`}
                          >
                            {cell.code}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                    );
                  })}

                  <td className="py-2.5 px-2 bg-slate-950/40 font-bold text-emerald-400 text-xs">
                    {row.summary.daysWorked}d
                  </td>
                  <td className="py-2.5 px-2 bg-slate-950/40 font-bold text-amber-400 text-xs">
                    {row.summary.lateCount}d
                  </td>
                  <td className="py-2.5 px-2 bg-slate-950/40 font-bold text-rose-400 text-xs">
                    {row.summary.absentCount}d
                  </td>
                  <td className="py-2.5 px-2 bg-slate-950/40 font-bold text-cyan-400 text-xs">
                    {row.summary.complianceRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
