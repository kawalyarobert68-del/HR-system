import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  UserMinus,
  Calendar,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  ScanFace,
  Briefcase
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { Employee, AttendanceRecord, Department, Branch, LeaveApplication } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  departments: Department[];
  branches: Branch[];
  leaveApplications: LeaveApplication[];
  onOpenFaceModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  employees,
  attendance,
  departments,
  branches,
  leaveApplications,
  onOpenFaceModal,
  onNavigateTab,
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Filtered dataset
  const filteredEmployees = useMemo(() => {
    let list = employees;
    if (selectedBranch !== 'all') list = list.filter((e) => e.branchId === selectedBranch);
    if (selectedDept !== 'all') list = list.filter((e) => e.departmentId === selectedDept);
    return list;
  }, [employees, selectedBranch, selectedDept]);

  const empIds = useMemo(() => new Set(filteredEmployees.map((e) => e.id)), [filteredEmployees]);

  // Today's attendance
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = useMemo(() => {
    return attendance.filter((r) => r.date === todayStr && empIds.has(r.employeeId));
  }, [attendance, todayStr, empIds]);

  // Calculations
  const totalEmployees = filteredEmployees.length;
  const activeEmployees = filteredEmployees.filter((e) => e.status === 'active').length;
  const presentToday = todayAttendance.filter((r) => r.status === 'present').length;
  const lateToday = todayAttendance.filter((r) => r.status === 'late').length;
  const leaveToday = todayAttendance.filter((r) => r.status === 'on_leave').length;
  const clockedInLive = todayAttendance.filter((r) => r.clockInTime && !r.clockOutTime).length;
  const absentToday = Math.max(0, activeEmployees - (presentToday + lateToday + leaveToday));

  const attendanceRate = activeEmployees > 0 ? Math.round(((presentToday + lateToday) / activeEmployees) * 100) : 0;
  const pendingLeaves = leaveApplications.filter((l) => l.status.startsWith('pending')).length;

  const totalLateMins = todayAttendance.reduce((acc, r) => acc + (r.minutesLate || 0), 0);
  const avgLateMins = lateToday > 0 ? Math.round(totalLateMins / lateToday) : 0;

  // Chart 1: Daily Attendance Trend (Last 7 Days)
  const past7Days = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const trendData = useMemo(() => {
    const presentCounts = past7Days.map((d) => {
      return attendance.filter((r) => r.date === d && empIds.has(r.employeeId) && (r.status === 'present' || r.status === 'late')).length;
    });
    const lateCounts = past7Days.map((d) => {
      return attendance.filter((r) => r.date === d && empIds.has(r.employeeId) && r.status === 'late').length;
    });

    return {
      labels: past7Days.map((d) => {
        const parts = d.split('-');
        return `${parts[1]}/${parts[2]}`;
      }),
      datasets: [
        {
          label: 'Total Present',
          data: presentCounts,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
        },
        {
          label: 'Late Arrivals',
          data: lateCounts,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
        },
      ],
    };
  }, [past7Days, attendance, empIds]);

  // Chart 2: Attendance Status Breakdown (Doughnut)
  const statusDoughnutData = {
    labels: ['On-Time Present', 'Late Arrivals', 'Absent', 'On Approved Leave'],
    datasets: [
      {
        data: [presentToday, lateToday, absentToday, leaveToday],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  };

  // Chart 3: Department Attendance Compliance (Bar)
  const deptComplianceData = useMemo(() => {
    const labels = departments.map((d) => d.name.split(' ')[0]);
    const complianceRates = departments.map((d) => {
      const deptEmps = employees.filter((e) => e.departmentId === d.id);
      if (deptEmps.length === 0) return 0;
      const deptTodayAtt = todayAttendance.filter((r) => {
        const emp = employees.find((e) => e.id === r.employeeId);
        return emp?.departmentId === d.id && (r.status === 'present' || r.status === 'late');
      });
      return Math.round((deptTodayAtt.length / deptEmps.length) * 100);
    });

    return {
      labels,
      datasets: [
        {
          label: 'Compliance Rate %',
          data: complianceRates,
          backgroundColor: '#3b82f6',
          borderRadius: 6,
        },
      ],
    };
  }, [departments, employees, todayAttendance]);

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Workforce Executive Dashboard</h1>
          <p className="text-xs text-slate-400">
            Real-time biometric attendance metrics, operational compliance, and exceptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* Dept Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Quick Action Face Clock */}
          <button
            onClick={onOpenFaceModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md transition cursor-pointer"
          >
            <ScanFace className="w-4 h-4" />
            <span>Launch Face Scanner</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Matrix */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Total Employees */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Total Staff</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">{totalEmployees}</p>
            <p className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
              <span>{activeEmployees} active</span>
            </p>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Present Today</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-emerald-400">{presentToday}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">On-time verified</p>
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Late Arrivals</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-amber-400">{lateToday}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Avg: {avgLateMins}m late</p>
          </div>
        </div>

        {/* Absent Today */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Absent Today</span>
            <UserMinus className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-rose-400">{absentToday}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Unscheduled</p>
          </div>
        </div>

        {/* Attendance Compliance Rate */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Compliance Rate</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-cyan-400">{attendanceRate}%</p>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${attendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pending Leave Approvals */}
        <div
          onClick={() => onNavigateTab('leave')}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between cursor-pointer hover:border-indigo-500/50 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold">Pending Leave</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-purple-400">{pendingLeaves}</p>
            <p className="text-[11px] text-indigo-300 underline mt-0.5">Review requests →</p>
          </div>
        </div>
      </div>

      {/* Visualizations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Line Chart (7 Columns) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">7-Day Attendance & Lateness Trends</h3>
              <p className="text-xs text-slate-400">Comparison of daily on-time presence against late check-ins</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Present
              </span>
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Late
              </span>
            </div>
          </div>

          <div className="h-64">
            <Line
              data={trendData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderWidth: 1,
                    titleColor: '#e2e8f0',
                    bodyColor: '#cbd5e1',
                  },
                },
                scales: {
                  x: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', font: { size: 11 } },
                  },
                  y: {
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', stepSize: 1, font: { size: 11 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Status Distribution (4 Columns) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm">Today's Workforce Distribution</h3>
            <p className="text-xs text-slate-400">Breakdown of attendance statuses across employees</p>
          </div>

          <div className="h-52 relative flex items-center justify-center">
            <Doughnut
              data={statusDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '72%',
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderWidth: 1,
                  },
                },
              }}
            />
            <div className="absolute text-center pointer-events-none">
              <span className="text-xs text-slate-400 block font-medium">Present</span>
              <span className="text-2xl font-black text-white">{presentToday + lateToday}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Present: {presentToday}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-300">Late: {lateToday}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-300">Absent: {absentToday}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-slate-300">On Leave: {leaveToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Department Compliance Bar Chart & Live Active Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Department Compliance (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Department Attendance Compliance %</h3>
              <p className="text-xs text-slate-400">Rate of employees present by division</p>
            </div>
          </div>

          <div className="h-56">
            <Bar
              data={deptComplianceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: {
                    callbacks: {
                      label: (item) => `${item.raw}% Attendance`,
                    },
                  },
                },
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } },
                  y: {
                    max: 100,
                    grid: { color: '#1e293b' },
                    ticks: { color: '#94a3b8', stepSize: 25 },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Live Clock-in Feed (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Recent Biometric Verification Activity</h3>
              <p className="text-xs text-slate-400">Live incoming clock-ins recorded from terminals</p>
            </div>
            <button
              onClick={() => onNavigateTab('attendance')}
              className="text-xs text-indigo-400 hover:text-indigo-300 cursor-pointer font-medium"
            >
              View Full Log →
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-56">
            {todayAttendance.slice(0, 4).map((rec) => {
              const emp = employees.find((e) => e.id === rec.employeeId);
              return (
                <div key={rec.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300">
                      {emp?.firstName[0]}
                      {emp?.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-200">
                        {emp?.firstName} {emp?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">{rec.clockInLocation || 'HQ Terminal'}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono text-slate-200 block">{rec.clockInTime}</span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        rec.status === 'late' ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {rec.status} {rec.minutesLate > 0 ? `(+${rec.minutesLate}m)` : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {todayAttendance.length === 0 && (
              <div className="py-8 text-center text-slate-500 text-xs">
                No attendance events logged yet today. Click "Launch Face Scanner" to test.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
