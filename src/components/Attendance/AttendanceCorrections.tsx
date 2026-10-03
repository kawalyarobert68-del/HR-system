import React, { useState, useEffect } from 'react';
import {
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Check,
  X,
  Send,
  HelpCircle
} from 'lucide-react';
import { AttendanceCorrection, Employee, Role } from '../../types';
import { api } from '../../services/api';

interface AttendanceCorrectionsProps {
  employees: Employee[];
  userRole: Role;
  currentEmployee?: Employee | null;
  onRefresh: () => void;
}

export const AttendanceCorrections: React.FC<AttendanceCorrectionsProps> = ({
  employees,
  userRole,
  currentEmployee,
  onRefresh,
}) => {
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Form State
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedIn, setRequestedIn] = useState('08:00:00');
  const [requestedOut, setRequestedOut] = useState('17:00:00');
  const [reason, setReason] = useState('Facial recognition camera glare / illumination failure');
  const [selectedEmpId, setSelectedEmpId] = useState(currentEmployee?.id || employees[0]?.id || '');
  const [submitting, setSubmitting] = useState(false);

  // Approval Comment state
  const [reviewComment, setReviewComment] = useState('');

  const fetchCorrections = async () => {
    try {
      setLoading(true);
      const data = await api.attendance.getCorrections(
        userRole === 'employee' && currentEmployee ? currentEmployee.id : undefined
      );
      setCorrections(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCorrections();
  }, [userRole, currentEmployee]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await api.attendance.createCorrection({
        employeeId: selectedEmpId,
        date: targetDate,
        requestedClockIn: requestedIn,
        requestedClockOut: requestedOut,
        requestedStatus: 'present',
        reason,
      });
      setIsSubmitModalOpen(false);
      fetchCorrections();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.attendance.resolveCorrection(id, {
        status,
        approverComment: reviewComment || (status === 'approved' ? 'Approved by Manager' : 'Rejected'),
      });
      setReviewComment('');
      fetchCorrections();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const canApprove = userRole === 'admin' || userRole === 'hr_manager' || userRole === 'supervisor';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Attendance Exceptions & Correction Requests</h3>
          <p className="text-xs text-slate-400">
            Submit or review attendance discrepancy corrections with complete audit trails.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Correction Request</span>
        </button>
      </div>

      {/* Corrections List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="divide-y divide-slate-800 text-xs">
          {corrections.map((corr) => {
            const emp = employees.find((e) => e.id === corr.employeeId);
            return (
              <div key={corr.id} className="p-4 hover:bg-slate-800/30 transition flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100">
                      {emp?.firstName} {emp?.lastName} ({emp?.employeeNumber})
                    </span>
                    <span className="text-slate-400 font-mono">• Date: {corr.date}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        corr.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : corr.status === 'rejected'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {corr.status}
                    </span>
                  </div>

                  <p className="text-slate-300">
                    <span className="text-slate-500">Requested Times:</span> In: {corr.requestedClockIn || '—'} | Out:{' '}
                    {corr.requestedClockOut || '—'}
                  </p>
                  <p className="text-slate-400 italic">" {corr.reason} "</p>

                  {corr.approverComment && (
                    <p className="text-[11px] text-cyan-400">
                      Approver Comment: {corr.approverComment}
                    </p>
                  )}
                </div>

                {/* Approver Actions */}
                {canApprove && corr.status === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Optional comment..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none"
                    />
                    <button
                      onClick={() => handleResolve(corr.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleResolve(corr.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px] flex items-center space-x-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {corrections.length === 0 && !loading && (
            <div className="py-8 text-center text-slate-500">No attendance correction requests recorded.</div>
          )}
        </div>
      </div>

      {/* Submit Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">Submit Attendance Correction</h4>
              <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Employee</label>
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
                <label className="text-slate-300 font-semibold block mb-1">Attendance Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Actual Clock In</label>
                  <input
                    type="time"
                    step="1"
                    value={requestedIn}
                    onChange={(e) => setRequestedIn(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Actual Clock Out</label>
                  <input
                    type="time"
                    step="1"
                    value={requestedOut}
                    onChange={(e) => setRequestedOut(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Detailed Reason for Exception</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  {submitting ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
