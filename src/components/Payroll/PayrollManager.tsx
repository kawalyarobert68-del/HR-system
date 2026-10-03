import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Download,
  Printer,
  CheckCircle2,
  FileText,
  Building2,
  RefreshCw,
  Eye,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { PayrollRecord, Employee, Role } from '../../types';
import { api } from '../../services/api';

interface PayrollManagerProps {
  employees: Employee[];
  userRole: Role;
  currentEmployee?: Employee | null;
  onRefresh: () => void;
}

export const PayrollManager: React.FC<PayrollManagerProps> = ({
  employees,
  userRole,
  currentEmployee,
  onRefresh,
}) => {
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const data = await api.payroll.getRecords();
      setPayrollRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, []);

  const handleGeneratePeriod = async () => {
    try {
      setIsProcessing(true);
      await api.payroll.generatePeriod(10, 2026);
      fetchPayroll();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintPayslip = () => {
    window.print();
  };

  // Filter records if employee
  const visibleRecords =
    userRole === 'employee' && currentEmployee
      ? payrollRecords.filter((p) => p.employeeId === currentEmployee.id)
      : payrollRecords;

  const totalGross = visibleRecords.reduce((acc, r) => acc + r.grossPay, 0);
  const totalNet = visibleRecords.reduce((acc, r) => acc + r.netSalary, 0);
  const totalTax = visibleRecords.reduce((acc, r) => acc + r.payeTax, 0);
  const totalNssf = visibleRecords.reduce((acc, r) => acc + (r.nssfEmployee + r.nssfEmployer), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Generation Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Payroll Processing & Payslips</h2>
          <p className="text-xs text-slate-400">
            Uganda statutory PAYE progressive tax brackets, NSSF contributions (5% employee + 10% employer), and overtime compensation.
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'hr_manager') && (
          <button
            onClick={handleGeneratePeriod}
            disabled={isProcessing}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
            <span>Process October 2026 Payroll Batch</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      {(userRole === 'admin' || userRole === 'hr_manager') && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total Gross Disbursed</span>
            <span className="text-xl font-black text-white">UGX {totalGross.toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Net Salaries Payable</span>
            <span className="text-xl font-black text-emerald-400">UGX {totalNet.toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">URA PAYE Remittance</span>
            <span className="text-xl font-black text-amber-400">UGX {totalTax.toLocaleString()}</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Total NSSF (15%)</span>
            <span className="text-xl font-black text-cyan-400">UGX {totalNssf.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Records Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm">Processed Payslips & Disbursal Records</h3>
          <span className="text-xs text-slate-400">{visibleRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Payslip Ref</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Basic + Allowances</th>
                <th className="py-3 px-4">Overtime Pay</th>
                <th className="py-3 px-4">PAYE Tax</th>
                <th className="py-3 px-4">NSSF (5%)</th>
                <th className="py-3 px-4">Net Salary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {visibleRecords.map((r) => {
                const emp = employees.find((e) => e.id === r.employeeId);
                return (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-indigo-400">{r.payslipNumber}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-100">
                        {emp?.firstName} {emp?.lastName}
                      </p>
                      <span className="text-[10px] text-slate-400">{emp?.jobTitle}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {r.periodMonth}/{r.periodYear}
                    </td>
                    <td className="py-3 px-4">
                      UGX {(r.baseSalary + r.allowances).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono">
                      {r.overtimeHours > 0 ? `+UGX ${r.overtimePay.toLocaleString()} (${r.overtimeHours}h)` : '—'}
                    </td>
                    <td className="py-3 px-4 text-amber-400 font-mono">
                      UGX {r.payeTax.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-mono">
                      UGX {r.nssfEmployee.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400 font-mono">
                      UGX {r.netSalary.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPayslip(r)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Payslip</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Payslip Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl p-8 space-y-6 print:m-0 print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-slate-900">APEX ENTERPRISE SOLUTIONS LTD</h3>
                <p className="text-xs text-slate-500">Plot 42 Nakasero Road, Kampala, Uganda</p>
                <p className="text-xs text-slate-500">TIN: 1004928172 • NSSF Reg: 88472910</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-xs font-bold rounded bg-slate-100 text-slate-800 uppercase tracking-wider">
                  OFFICIAL PAYSLIP
                </span>
                <p className="text-xs text-slate-500 font-mono mt-1">{selectedPayslip.payslipNumber}</p>
                <p className="text-xs text-slate-500">Period: {selectedPayslip.periodMonth}/{selectedPayslip.periodYear}</p>
              </div>
            </div>

            {/* Employee Details Box */}
            {(() => {
              const emp = employees.find((e) => e.id === selectedPayslip.employeeId);
              return (
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">EMPLOYEE NAME</span>
                    <span className="font-bold text-sm text-slate-900">
                      {emp?.firstName} {emp?.lastName}
                    </span>
                    <span className="block text-slate-600">{emp?.jobTitle}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EMPLOYEE NUMBER</span>
                    <span className="font-mono font-bold text-slate-900">{emp?.employeeNumber}</span>
                    <span className="block text-slate-600">NIN: {emp?.nationalId}</span>
                  </div>
                </div>
              );
            })()}

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-2 border-r pr-6">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                  Earnings
                </h4>
                <div className="flex justify-between py-1 border-b border-dashed">
                  <span className="text-slate-600">Basic Salary</span>
                  <span className="font-mono font-semibold">UGX {selectedPayslip.baseSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed">
                  <span className="text-slate-600">Transport & Housing Allowances</span>
                  <span className="font-mono font-semibold">UGX {selectedPayslip.allowances.toLocaleString()}</span>
                </div>
                {selectedPayslip.overtimePay > 0 && (
                  <div className="flex justify-between py-1 border-b border-dashed text-cyan-700">
                    <span>Overtime ({selectedPayslip.overtimeHours} hrs)</span>
                    <span className="font-mono font-semibold">UGX {selectedPayslip.overtimePay.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 font-bold text-sm text-slate-900">
                  <span>Gross Earnings</span>
                  <span className="font-mono">UGX {selectedPayslip.grossPay.toLocaleString()}</span>
                </div>
              </div>

              {/* Statutory Deductions */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] border-b pb-1">
                  Statutory Deductions
                </h4>
                <div className="flex justify-between py-1 border-b border-dashed">
                  <span className="text-slate-600">Uganda PAYE (Income Tax)</span>
                  <span className="font-mono font-semibold text-rose-700">
                    UGX {selectedPayslip.payeTax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed">
                  <span className="text-slate-600">NSSF Employee (5%)</span>
                  <span className="font-mono font-semibold text-rose-700">
                    UGX {selectedPayslip.nssfEmployee.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed">
                  <span className="text-slate-600">Staff Welfare Fund</span>
                  <span className="font-mono font-semibold text-rose-700">
                    UGX {selectedPayslip.otherDeductions.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between pt-2 font-bold text-sm text-rose-800">
                  <span>Total Deductions</span>
                  <span className="font-mono">
                    UGX {(selectedPayslip.payeTax + selectedPayslip.nssfEmployee + selectedPayslip.otherDeductions).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-700">
                  NET TAKE-HOME SALARY
                </span>
                <span className="text-xs text-emerald-800">Transferred via Bank EFT / Standard Settlement</span>
              </div>
              <span className="text-2xl font-black font-mono text-emerald-800">
                UGX {selectedPayslip.netSalary.toLocaleString()}
              </span>
            </div>

            {/* Actions: Print & Close */}
            <div className="flex items-center justify-end space-x-3 pt-2 print:hidden">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handlePrintPayslip}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Payslip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
