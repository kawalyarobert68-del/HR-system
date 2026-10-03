import React, { useState } from 'react';
import {
  X,
  User,
  Briefcase,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  ScanFace
} from 'lucide-react';
import { Employee, AttendanceRecord, LeaveApplication, Role } from '../../types';

interface EmployeeProfileModalProps {
  employee: Employee | null;
  attendance: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  userRole: Role;
  onClose: () => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  attendance,
  leaveApplications,
  userRole,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'leave' | 'payroll' | 'documents'>('overview');

  if (!employee) return null;

  const empAttendance = attendance.filter((r) => r.employeeId === employee.id);
  const empLeaves = leaveApplications.filter((l) => l.employeeId === employee.id);

  const canViewSalary = userRole === 'admin' || userRole === 'hr_manager';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
        {/* Top Header Card */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {employee.firstName[0]}
              {employee.lastName[0]}
            </div>

            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-white">
                  {employee.firstName} {employee.middleName ? `${employee.middleName} ` : ''}
                  {employee.lastName}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {employee.employeeNumber}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 uppercase">
                  {employee.status}
                </span>
              </div>
              <p className="text-xs text-indigo-300 font-medium">{employee.jobTitle}</p>
              <p className="text-xs text-slate-400 flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-slate-500" /> {employee.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-500" /> {employee.phone}
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 text-xs">
          {[
            { id: 'overview', label: 'Overview & Bio', icon: User },
            { id: 'attendance', label: 'Attendance Records', icon: Clock },
            { id: 'leave', label: 'Leave History', icon: Calendar },
            ...(canViewSalary ? [{ id: 'payroll', label: 'Salary & Compensation', icon: DollarSign }] : []),
            { id: 'documents', label: 'Documents & Attachments', icon: FileText },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-4 font-semibold border-b-2 flex items-center space-x-2 transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-slate-800/40'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal & Statutory Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Personal & Identification
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">GENDER</span>
                      <span className="font-semibold capitalize">{employee.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">DATE OF BIRTH</span>
                      <span className="font-semibold">{employee.dateOfBirth}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">NATIONALITY</span>
                      <span className="font-semibold">{employee.nationality}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">NATIONAL ID (NIN)</span>
                      <span className="font-mono font-semibold text-white">{employee.nationalId}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500 block text-[10px]">RESIDENTIAL ADDRESS</span>
                      <span className="font-semibold">{employee.residentialAddress}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact & Biometric State */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                    Emergency Contact & Biometrics
                  </h4>
                  <div className="space-y-2 text-slate-300">
                    <div>
                      <span className="text-slate-500 block text-[10px]">PRIMARY EMERGENCY CONTACT</span>
                      <span className="font-semibold text-white">
                        {employee.emergencyContact.name} ({employee.emergencyContact.relationship})
                      </span>
                      <span className="block text-indigo-400">{employee.emergencyContact.phone}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-500 block text-[10px]">FACIAL BIOMETRICS STATUS</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {employee.biometricEnrolled ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Enrolled (128-d Vector Template)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Biometric Not Enrolled
                          </span>
                        )}
                      </div>
                      {employee.biometricEnrolledAt && (
                        <p className="text-[10px] text-slate-500 mt-1">
                          Enrolled on {new Date(employee.biometricEnrolledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Employment Lifecycle Information */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Employment Contract Lifecycle</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">DATE OF HIRE</span>
                    <span className="font-semibold text-white">{employee.hireDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CONTRACT TYPE</span>
                    <span className="font-semibold capitalize text-indigo-300">{employee.contractType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">PROBATION STATUS</span>
                    <span className="font-semibold text-emerald-400">
                      {employee.contractType === 'probation' ? 'Under 6-Month Review' : 'Confirmed Permanent'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">SYSTEM STATUS</span>
                    <span className="font-semibold uppercase text-emerald-400">{employee.status}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-200 text-sm">Attendance History Log ({empAttendance.length})</h4>
              </div>

              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Clock In</th>
                      <th className="p-3">Clock Out</th>
                      <th className="p-3">Total Worked</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {empAttendance.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-white">{rec.date}</td>
                        <td className="p-3 font-mono">{rec.clockInTime || '—'}</td>
                        <td className="p-3 font-mono">{rec.clockOutTime || '—'}</td>
                        <td className="p-3 font-semibold">{rec.totalHours > 0 ? `${rec.totalHours} hrs` : '—'}</td>
                        <td className="p-3">
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
                            {rec.status} {rec.minutesLate > 0 ? `(+${rec.minutesLate}m)` : ''}
                          </span>
                        </td>
                        <td className="p-3 text-[11px] text-slate-400">
                          {rec.clockInMethod === 'face' ? (
                            <span className="text-cyan-400 font-semibold">Face Biometric</span>
                          ) : (
                            <span className="text-amber-400">Manual Override</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {empAttendance.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500">
                          No attendance records found for this employee.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Leave Applications & Approvals</h4>
              <div className="divide-y divide-slate-800/80 rounded-xl border border-slate-800 overflow-hidden">
                {empLeaves.map((l) => (
                  <div key={l.id} className="p-4 bg-slate-950/40 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-200 text-xs">
                          {l.startDate} to {l.endDate} ({l.daysCount} days)
                        </span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                            l.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : l.status.startsWith('pending')
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {l.status}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-1">{l.reason}</p>
                      {l.supervisorComment && (
                        <p className="text-[11px] text-indigo-400 mt-1">Supervisor note: {l.supervisorComment}</p>
                      )}
                    </div>
                  </div>
                ))}

                {empLeaves.length === 0 && (
                  <div className="p-6 text-center text-slate-500">No leave requests recorded.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'payroll' && canViewSalary && (
            <div className="space-y-4">
              <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-200 text-sm">Compensation & Statutory Package (Restricted Access)</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">BASE MONTHLY SALARY</span>
                    <span className="text-base font-bold text-white">UGX {employee.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">FIXED ALLOWANCES</span>
                    <span className="text-base font-bold text-emerald-400">UGX {employee.allowances.toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">GROSS MONTHLY</span>
                    <span className="text-base font-bold text-indigo-300">
                      UGX {(employee.baseSalary + employee.allowances).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">NSSF CONTRIBUTION (15%)</span>
                    <span className="text-base font-bold text-cyan-400">
                      UGX {Math.round((employee.baseSalary + employee.allowances) * 0.15).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h4 className="font-bold text-slate-200 text-sm">Employee Onboarding Documents</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <p className="font-semibold text-slate-200 text-xs">National Identity Document</p>
                      <p className="text-[10px] text-slate-400">PDF • Verified against NIRA registry</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300">Verified</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="font-semibold text-slate-200 text-xs">Employment Contract Letter</p>
                      <p className="text-[10px] text-slate-400">Signed digital agreement</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-indigo-500/20 text-indigo-300">Signed</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
