import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Activity,
  Terminal,
  FileText
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogsProps {
  logs: AuditLog[];
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const filteredLogs = logs.filter((log) => {
    const q = searchTerm.toLowerCase();
    const matchQuery =
      !q ||
      log.userName.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q);

    const matchAction = selectedAction === 'all' || log.action.includes(selectedAction);

    return matchQuery && matchAction;
  });

  const handleExportCSV = () => {
    const headers = ['Log ID', 'Timestamp', 'User', 'Action', 'Entity', 'Entity ID', 'IP Address', 'Details'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      `"${l.userName}"`,
      l.action,
      l.entity,
      l.entityId,
      l.ipAddress,
      `"${l.details.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `system_audit_trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('BIOMETRIC')) return 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30';
    if (action.includes('ATTENDANCE')) return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    if (action.includes('LEAVE')) return 'bg-purple-500/20 text-purple-300 border border-purple-500/30';
    if (action.includes('PAYROLL')) return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
    if (action.includes('OFFBOARD') || action.includes('REVOCATION'))
      return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
    return 'bg-slate-800 text-slate-300 border border-slate-700';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Security & Immutable Audit Trail</h2>
          <p className="text-xs text-slate-400">
            Cryptographically timestamped audit log of biometric enrollments, overrides, approvals, and system state transitions.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl text-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by actor, action, IP or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Event Categories</option>
          <option value="BIOMETRIC">Biometric Events</option>
          <option value="ATTENDANCE">Attendance Clocking</option>
          <option value="LEAVE">Leave Approvals</option>
          <option value="PAYROLL">Payroll Disbursements</option>
          <option value="POLICY">System Configuration</option>
        </select>

        <span className="text-slate-400 text-[11px] font-mono">{filteredLogs.length} events logged</span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-sans font-semibold text-white">
                    {log.userName}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-indigo-300">{log.entity}</td>
                  <td className="py-2.5 px-4 text-slate-500">{log.ipAddress}</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300 max-w-md truncate" title={log.details}>
                    {log.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No security audit logs match the selected filter.
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
