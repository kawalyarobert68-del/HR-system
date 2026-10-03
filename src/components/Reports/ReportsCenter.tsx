import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Printer,
  Clock,
  UserCheck,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Building2
} from 'lucide-react';
import { Employee, AttendanceRecord, Department, Branch, LeaveApplication, PayrollRecord } from '../../types';

interface ReportsCenterProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  departments: Department[];
  branches: Branch[];
  leaveApplications: LeaveApplication[];
  payroll: PayrollRecord[];
}

export const ReportsCenter: React.FC<ReportsCenterProps> = ({
  employees,
  attendance,
  departments,
  branches,
  leaveApplications,
  payroll,
}) => {
  const [selectedReport, setSelectedReport] = useState<string>('daily_attendance');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  const reportTypes = [
    { id: 'daily_attendance', title: '1. Daily Attendance Report', icon: Clock, desc: 'Clock-in, clock-out, and verification methods for selected date.' },
    { id: 'monthly_summary', title: '2. Monthly Days Worked Report', icon: Calendar, desc: 'Aggregated days present, absent, and compliance percentage.' },
    { id: 'late_arrivals', title: '3. Late Arrivals & Punctuality Report', icon: AlertTriangle, desc: 'Detailed minutes late, arrival trends, and grace period breaches.' },
    { id: 'absenteeism', title: '4. Absenteeism & Truancy Report', icon: AlertTriangle, desc: 'Unexcused absences vs approved authorized leaves.' },
    { id: 'dept_attendance', title: '5. Department Attendance Analysis', icon: Building2, desc: 'Attendance compliance comparison broken down by department.' },
    { id: 'overtime_hours', title: '6. Overtime & Working Hours Report', icon: TrendingUp, desc: 'Normal hours vs approved overtime hours per employee.' },
    { id: 'leave_utilization', title: '7. Leave Utilization & Balances', icon: Calendar, desc: 'Annual leave taken, pending approvals, and remaining entitlements.' },
    { id: 'payroll_summary', title: '8. Payroll & Statutory Tax Report', icon: DollarSign, desc: 'Gross salary, Uganda PAYE tax, NSSF contributions, and net payouts.' },
  ];

  // Dynamic Data Generator based on selected report
  const generateReportData = () => {
    let rows: Record<string, any>[] = [];
    let headers: string[] = [];

    if (selectedReport === 'daily_attendance') {
      headers = ['Employee ID', 'Employee Name', 'Department', 'Clock In', 'Clock Out', 'Status', 'Minutes Late', 'Verification Method'];
      rows = attendance
        .filter((r) => !selectedDate || r.date === selectedDate)
        .map((r) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          const dept = departments.find((d) => d.id === emp?.departmentId);
          return {
            'Employee ID': emp?.employeeNumber || '',
            'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
            Department: dept?.name || '',
            'Clock In': r.clockInTime || '—',
            'Clock Out': r.clockOutTime || '—',
            Status: r.status.toUpperCase(),
            'Minutes Late': r.minutesLate,
            'Verification Method': r.clockInMethod === 'face' ? 'Face Biometric' : 'Manual Supervisor',
          };
        });
    } else if (selectedReport === 'late_arrivals') {
      headers = ['Employee ID', 'Employee Name', 'Department', 'Date', 'Clock In Time', 'Minutes Late', 'Supervisor Note'];
      rows = attendance
        .filter((r) => r.status === 'late')
        .map((r) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          const dept = departments.find((d) => d.id === emp?.departmentId);
          return {
            'Employee ID': emp?.employeeNumber || '',
            'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
            Department: dept?.name || '',
            Date: r.date,
            'Clock In Time': r.clockInTime || '—',
            'Minutes Late': r.minutesLate,
            'Supervisor Note': r.notes || 'Traffic / commute delay',
          };
        });
    } else if (selectedReport === 'overtime_hours') {
      headers = ['Employee ID', 'Employee Name', 'Job Title', 'Date', 'Total Worked Hours', 'Overtime Hours', 'Shift'];
      rows = attendance
        .filter((r) => (r.overtimeHours || 0) > 0)
        .map((r) => {
          const emp = employees.find((e) => e.id === r.employeeId);
          return {
            'Employee ID': emp?.employeeNumber || '',
            'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
            'Job Title': emp?.jobTitle || '',
            Date: r.date,
            'Total Worked Hours': `${r.totalHours} hrs`,
            'Overtime Hours': `${r.overtimeHours} hrs`,
            Shift: r.shiftId,
          };
        });
    } else if (selectedReport === 'leave_utilization') {
      headers = ['Employee ID', 'Employee Name', 'Start Date', 'End Date', 'Days Count', 'Reason', 'Approval Status'];
      rows = leaveApplications.map((l) => {
        const emp = employees.find((e) => e.id === l.employeeId);
        return {
          'Employee ID': emp?.employeeNumber || '',
          'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
          'Start Date': l.startDate,
          'End Date': l.endDate,
          'Days Count': `${l.daysCount} days`,
          Reason: l.reason,
          'Approval Status': l.status.toUpperCase(),
        };
      });
    } else if (selectedReport === 'payroll_summary') {
      headers = ['Payslip #', 'Employee Name', 'Base Salary', 'Allowances', 'Gross Pay', 'PAYE Tax (URA)', 'NSSF (5%)', 'Net Salary'];
      rows = payroll.map((p) => {
        const emp = employees.find((e) => e.id === p.employeeId);
        return {
          'Payslip #': p.payslipNumber,
          'Employee Name': `${emp?.firstName} ${emp?.lastName}`,
          'Base Salary': `UGX ${p.baseSalary.toLocaleString()}`,
          Allowances: `UGX ${p.allowances.toLocaleString()}`,
          'Gross Pay': `UGX ${p.grossPay.toLocaleString()}`,
          'PAYE Tax (URA)': `UGX ${p.payeTax.toLocaleString()}`,
          'NSSF (5%)': `UGX ${p.nssfEmployee.toLocaleString()}`,
          'Net Salary': `UGX ${p.netSalary.toLocaleString()}`,
        };
      });
    } else {
      // Default: Monthly Days Worked
      headers = ['Employee ID', 'Employee Name', 'Department', 'Branch', 'Days Present', 'Days Late', 'Days Absent', 'Compliance %'];
      rows = employees.map((emp) => {
        const empRecs = attendance.filter((r) => r.employeeId === emp.id);
        const pCount = empRecs.filter((r) => r.status === 'present').length;
        const lCount = empRecs.filter((r) => r.status === 'late').length;
        const aCount = empRecs.filter((r) => r.status === 'absent').length;
        const dept = departments.find((d) => d.id === emp.departmentId);
        const branch = branches.find((b) => b.id === emp.branchId);

        return {
          'Employee ID': emp.employeeNumber,
          'Employee Name': `${emp.firstName} ${emp.lastName}`,
          Department: dept?.name || '',
          Branch: branch?.city || 'Kampala',
          'Days Present': pCount,
          'Days Late': lCount,
          'Days Absent': aCount,
          'Compliance %': `${Math.round(((pCount + lCount) / Math.max(1, pCount + lCount + aCount)) * 100)}%`,
        };
      });
    }

    return { headers, rows };
  };

  const { headers, rows } = generateReportData();

  const handleDownloadCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => headers.map((h) => `"${row[h] || ''}"`).join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `${selectedReport}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Reporting & Analytics Center</h2>
          <p className="text-xs text-slate-400">
            Generate and export consolidated compliance, late arrival, leave, overtime, and statutory payroll ledgers.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          const isSelected = selectedReport === r.id;

          return (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`p-3.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                <span className="font-bold text-xs truncate">{r.title}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-2 line-clamp-2">{r.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Parameters */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs">
        <span className="text-slate-400 font-semibold flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filters:
        </span>

        {selectedReport === 'daily_attendance' && (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        )}

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        <select
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="all">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <span className="ml-auto text-slate-400 font-mono text-[11px]">{rows.length} rows matched</span>
      </div>

      {/* Rendered Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="py-3 px-4">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  {headers.map((h, i) => (
                    <td key={i} className="py-2.5 px-4 font-medium">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={headers.length} className="py-8 text-center text-slate-500">
                    No data records found for current report parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
