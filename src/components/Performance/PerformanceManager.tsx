import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Star,
  Plus,
  Award,
  AlertTriangle,
  UserCheck,
  CheckCircle2,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { PerformanceReview, Employee, Role } from '../../types';
import { api } from '../../services/api';

interface PerformanceManagerProps {
  employees: Employee[];
  userRole: Role;
  currentEmployee?: Employee | null;
  onRefresh: () => void;
}

export const PerformanceManager: React.FC<PerformanceManagerProps> = ({
  employees,
  userRole,
  currentEmployee,
  onRefresh,
}) => {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Review Form
  const [selectedEmpId, setSelectedEmpId] = useState(employees[0]?.id || '');
  const [period, setPeriod] = useState('Q4 2026');
  const [score, setScore] = useState(4.5);
  const [feedback, setFeedback] = useState('');
  const [achievements, setAchievements] = useState('');

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const data = await api.performance.getAll();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.performance.create({
        employeeId: selectedEmpId,
        period,
        score: Number(score),
        supervisorFeedback: feedback,
        achievements: achievements ? achievements.split(',').map((s) => s.trim()) : [],
        kpis: [
          { id: 'k1', title: 'Operational Delivery', target: '95%', achieved: '96%', score: 5 },
          { id: 'k2', title: 'Workplace Attendance & Punctuality', target: '>98%', achieved: '99%', score: 4.8 },
        ],
      });
      setIsAddOpen(false);
      setFeedback('');
      setAchievements('');
      fetchReviews();
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const visibleReviews =
    userRole === 'employee' && currentEmployee
      ? reviews.filter((r) => r.employeeId === currentEmployee.id)
      : reviews;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Performance Appraisals & KPIs</h2>
          <p className="text-xs text-slate-400">
            Objectives, periodic reviews, achievements, and supervisor appraisals distinct from raw attendance metrics.
          </p>
        </div>

        {(userRole === 'admin' || userRole === 'hr_manager' || userRole === 'supervisor') && (
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Performance Review</span>
          </button>
        )}
      </div>

      {/* Reviews Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleReviews.map((rev) => {
          const emp = employees.find((e) => e.id === rev.employeeId);
          return (
            <div key={rev.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold text-sm">
                    {emp?.firstName[0]}
                    {emp?.lastName[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">
                      {emp?.firstName} {emp?.lastName}
                    </h3>
                    <p className="text-[11px] text-slate-400">{emp?.jobTitle} • Period: {rev.period}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{rev.score} / 5.0</span>
                </div>
              </div>

              {/* KPIs Table */}
              <div className="space-y-1.5 text-xs">
                <span className="text-[10px] font-semibold uppercase text-slate-400">Assigned KPI Objectives</span>
                <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-3 divide-y divide-slate-800/80">
                  {rev.kpis.map((k) => (
                    <div key={k.id} className="py-1.5 flex items-center justify-between first:pt-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-slate-200">{k.title}</p>
                        <p className="text-[10px] text-slate-400">Target: {k.target}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-semibold">{k.achieved}</span>
                        <span className="text-[10px] text-slate-500 block font-mono">Score: {k.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supervisor Feedback */}
              <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                  Supervisor Appraisal Feedback
                </span>
                <p className="italic">" {rev.supervisorFeedback} "</p>
              </div>

              {/* Achievements */}
              {rev.achievements && rev.achievements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rev.achievements.map((ach, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                    >
                      <Award className="w-3 h-3 text-emerald-400" /> {ach}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {visibleReviews.length === 0 && !loading && (
          <div className="col-span-2 py-12 text-center text-slate-500 text-xs">
            No performance appraisals recorded yet.
          </div>
        )}
      </div>

      {/* Add Review Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-bold text-white text-sm">Add Performance Appraisal</h4>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReview} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Target Employee</label>
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Review Period</label>
                  <input
                    type="text"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Rating Score (1.0 to 5.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1.0"
                    max="5.0"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Supervisor Assessment Feedback</label>
                <textarea
                  required
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Detail accomplishments, feature deliverables, and growth areas..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Key Achievements (Comma separated)</label>
                <input
                  type="text"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="e.g. Employee of Month, AWS Solution Architect, Zero downtime"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                >
                  Save Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
