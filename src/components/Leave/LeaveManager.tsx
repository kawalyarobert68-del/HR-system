import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  UserCheck,
  Check,
  X,
  Send,
  PieChart,
  ShieldCheck,
  Info
} from 'lucide-react';
import { LeaveType, LeaveBalance, LeaveApplication, Employee, Role } from '../../types';
import { api } from '../../services/api';

interface LeaveManagerProps {
  employees: Employee[];
  userRole: Role;
  currentEmployee?: Employee | null;
  onRefresh: () => void;
}

export const LeaveManager: React.FC<LeaveManagerProps> = ({
  employees,
  userRole,
  currentEmployee,
  onRefresh,
}) => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // Apply Modal
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState(currentEmployee?.id || employees[0]?.id || '');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Review comment
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [typesData, balancesData, appsData] = await Promise.all([
        api.leave.getTypes(),
        api.leave.getBalances(userRole === 'employee' && currentEmployee ? currentEmployee.id : undefined),
        api.leave.getApplications(userRole === 'employee' && currentEmployee ? { employeeId: currentEmployee.id } : undefined),
      ]);
      setLeaveTypes(typesData);
      if (typesData.length > 0 && !selectedTypeId) {
        setSelectedTypeId(typesData[0].id);
      }
      setBalances(balancesData);
      setApplications(appsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, currentEmployee]);

  // Calculate requested days (excluding weekends)
  const calculateDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;

    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const requestedDays = calculateDays(startDate, endDate);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (requestedDays <= 0) {
      setFormError('Please select a valid date range that includes working days.');
      return;
    }

    try {
      setSubmitting(true);
      await api.leave.apply({
        employeeId: selectedEmpId,
        leaveTypeId: selectedTypeId,
        startDate,
        endDate,
        daysCount: requestedDays,
        reason,
        attachmentName: attachmentName || undefined,
      });

      setIsApplyModalOpen(false);
      setReason('');
      setStartDate('');
      setEndDate('');
      fetchData();
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Leave application failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (appId: string, action: 'supervisor_approve' | 'supervisor_reject' | 'hr_approve' | 'hr_reject') => {
    try {
      const comment = reviewComments[appId] || '';
      await api.leave.review(appId, { action, comment });
      fetchData();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canSupervisorReview = userRole === 'admin' || userRole === 'supervisor';
  const canHrReview = userRole === 'admin' || userRole === 'hr_manager';

  return (
    <div className="space-y-6">
      {/* Header and Application Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Leave Management & Approvals</h2>
          <p className="text-xs text-slate-400">
            Multi-tier leave workflows: Employee Application → Supervisor Endorsement → HR Manager Final Approval.
          </p>
        </div>

        <button
          onClick={() => setIsApplyModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Apply For Leave</span>
        </button>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {leaveTypes.slice(0, 6).map((type) => {
          const empBal = balances.find((b) => b.leaveTypeId === type.id);
          const remaining = empBal ? empBal.remainingDays : type.defaultDaysPerYear;
          const entitled = empBal ? empBal.entitledDays : type.defaultDaysPerYear;

          return (
            <div key={type.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block truncate">
                  {type.name}
                </span>
                <p className="text-2xl font-black text-white mt-1">
                  {remaining} <span className="text-xs font-normal text-slate-400">/ {entitled}d</span>
                </p>
              </div>
              <p className="text-[10px] text-emerald-400 mt-2">Paid: {type.isPaid ? 'Yes' : 'No'}</p>
            </div>
          );
        })}
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-slate-100 text-sm">Leave Applications Ledger</h3>
          <span className="text-xs text-slate-400">{applications.length} applications recorded</span>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {applications.map((app) => {
            const emp = employees.find((e) => e.id === app.employeeId);
            const type = leaveTypes.find((t) => t.id === app.leaveTypeId);

            return (
              <div key={app.id} className="p-4 hover:bg-slate-800/40 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-slate-100 text-sm">
                      {emp?.firstName} {emp?.lastName}
                    </span>
                    <span className="text-slate-400 font-mono">({emp?.employeeNumber})</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {type?.name || 'Annual Leave'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : app.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : app.status === 'pending_hr'
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-slate-300">
                    <span className="font-semibold text-white">
                      {app.startDate} to {app.endDate}
                    </span>{' '}
                    ({app.daysCount} working days)
                  </p>

                  <p className="text-slate-400 italic">" {app.reason} "</p>

                  {/* Multi-tier Approval Status Trail */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                    {app.supervisorComment && (
                      <span className="text-indigo-400">
                        Supervisor: "{app.supervisorComment}"
                      </span>
                    )}
                    {app.hrComment && (
                      <span className="text-emerald-400">
                        HR: "{app.hrComment}"
                      </span>
                    )}
                  </div>
                </div>

                {/* Approver Action Panel */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  {/* Supervisor Tier Review */}
                  {canSupervisorReview && app.status === 'pending_supervisor' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Supervisor note..."
                        value={reviewComments[app.id] || ''}
                        onChange={(e) =>
                          setReviewComments({ ...reviewComments, [app.id]: e.target.value })
                        }
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleReview(app.id, 'supervisor_approve')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        Endorse (→ HR)
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'supervisor_reject')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {/* HR Tier Final Approval */}
                  {canHrReview && app.status === 'pending_hr' && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="HR final remark..."
                        value={reviewComments[app.id] || ''}
                        onChange={(e) =>
                          setReviewComments({ ...reviewComments, [app.id]: e.target.value })
                        }
                        className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none"
                      />
                      <button
                        onClick={() => handleReview(app.id, 'hr_approve')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        Final Approve
                      </button>
                      <button
                        onClick={() => handleReview(app.id, 'hr_reject')}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] cursor-pointer"
                      >
                        HR Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {applications.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-500">No leave requests currently logged.</div>
          )}
        </div>
      </div>

      {/* Leave Application Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">Submit Leave Application</h4>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleApply} className="space-y-3 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Employee</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName} ({e.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Leave Category</label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Entitled: {t.defaultDaysPerYear} days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              {requestedDays > 0 && (
                <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 flex items-center justify-between">
                  <span>Calculated Working Days (Excluding Weekends):</span>
                  <span className="font-bold text-sm text-white">{requestedDays} Days</span>
                </div>
              )}

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Reason for Leave Request</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detail reasons, handover arrangements, and emergency availability..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
