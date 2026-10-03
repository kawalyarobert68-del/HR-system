import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ScanFace,
  Building2,
  MapPin,
  Check
} from 'lucide-react';
import { Employee, Department, Branch, Role, AttendanceRecord, LeaveApplication } from '../../types';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { api } from '../../services/api';

interface EmployeeListProps {
  employees: Employee[];
  departments: Department[];
  branches: Branch[];
  attendance: AttendanceRecord[];
  leaveApplications: LeaveApplication[];
  userRole: Role;
  onRefresh: () => void;
  onNavigateTab: (tab: string) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  departments,
  branches,
  attendance,
  leaveApplications,
  userRole,
  onRefresh,
  onNavigateTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // New Employee Form State
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male',
    dateOfBirth: '1995-01-01',
    nationality: 'Ugandan',
    nationalId: '',
    jobTitle: '',
    departmentId: departments[0]?.id || '',
    branchId: branches[0]?.id || '',
    contractType: 'permanent',
    baseSalary: 3000000,
    allowances: 300000,
    residentialAddress: 'Kampala',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter employees
  const filtered = employees.filter((emp) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      emp.firstName.toLowerCase().includes(q) ||
      emp.lastName.toLowerCase().includes(q) ||
      emp.employeeNumber.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      emp.jobTitle.toLowerCase().includes(q);

    const matchesDept = selectedDept === 'all' || emp.departmentId === selectedDept;
    const matchesBranch = selectedBranch === 'all' || emp.branchId === selectedBranch;
    const matchesStatus = selectedStatus === 'all' || emp.status === selectedStatus;

    return matchesQuery && matchesDept && matchesBranch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Department', 'Branch', 'Status', 'Biometric Enrolled'];
    const rows = filtered.map((e) => {
      const d = departments.find((dept) => dept.id === e.departmentId)?.name || '';
      const b = branches.find((br) => br.id === e.branchId)?.name || '';
      return [
        e.employeeNumber,
        e.firstName,
        e.lastName,
        e.email,
        e.phone,
        e.jobTitle,
        `"${d}"`,
        `"${b}"`,
        e.status,
        e.biometricEnrolled ? 'Yes' : 'No',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employees_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.jobTitle) {
      setFormError('Please fill in all mandatory fields (Name, Email, Job Title).');
      return;
    }

    try {
      setFormSubmitting(true);
      await api.employees.create(formData);
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register employee.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.employees.delete(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Employee Directory & Workforce Master</h2>
          <p className="text-xs text-slate-400">
            Lifecycle administration, contracts, role assignments, and biometric status.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          {(userRole === 'admin' || userRole === 'hr_manager') && (
            <button
              onClick={() => {
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  gender: 'male',
                  dateOfBirth: '1995-01-01',
                  nationality: 'Ugandan',
                  nationalId: `UG-${Date.now().toString().slice(-6)}`,
                  jobTitle: '',
                  departmentId: departments[0]?.id || '',
                  branchId: branches[0]?.id || '',
                  contractType: 'permanent',
                  baseSalary: 3500000,
                  allowances: 300000,
                  residentialAddress: 'Kampala',
                });
                setIsAddModalOpen(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, ID, title or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Branch Filter */}
        <div>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Branches ({branches.length})</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="on_leave">On Leave</option>
            <option value="probation">Probation</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Employee Data Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4">Role & Department</th>
                <th className="py-3.5 px-4">Branch</th>
                <th className="py-3.5 px-4">Biometric Status</th>
                <th className="py-3.5 px-4">Contract</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filtered.map((emp) => {
                const dept = departments.find((d) => d.id === emp.departmentId);
                const branch = branches.find((b) => b.id === emp.branchId);

                return (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0">
                          {emp.firstName[0]}
                          {emp.lastName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">
                            {emp.firstName} {emp.lastName}
                          </p>
                          <span className="text-[10px] font-mono text-indigo-400">{emp.employeeNumber}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-200">{emp.jobTitle}</p>
                      <p className="text-[10px] text-slate-400">{dept?.name || 'General Dept'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        <span className="truncate max-w-[140px]">{branch?.city || 'Kampala'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {emp.biometricEnrolled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-2.5 h-2.5" /> Enrolled
                        </span>
                      ) : (
                        <button
                          onClick={() => onNavigateTab('biometrics')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 cursor-pointer"
                        >
                          <ScanFace className="w-2.5 h-2.5" /> Enroll Now
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 capitalize">
                      <span className="text-slate-300 font-medium">{emp.contractType}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          emp.status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : emp.status === 'on_leave'
                            ? 'bg-indigo-500/20 text-indigo-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          title="View Complete 360 Profile"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {(userRole === 'admin' || userRole === 'hr_manager') && (
                          <button
                            onClick={() => handleDeactivate(emp.id, `${emp.firstName} ${emp.lastName}`)}
                            title="Deactivate / Offboard"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No matching employees found for the selected query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 360 Profile Modal */}
      {viewingEmployee && (
        <EmployeeProfileModal
          employee={viewingEmployee}
          attendance={attendance}
          leaveApplications={leaveApplications}
          userRole={userRole}
          onClose={() => setViewingEmployee(null)}
        />
      )}

      {/* Register New Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Register New Employee</h3>
                  <p className="text-xs text-slate-400">Generates unique EMP code and initiates onboarding workflow</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Work Location / Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Contract Type</label>
                  <select
                    value={formData.contractType}
                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="permanent">Permanent Confirmed</option>
                    <option value="probation">Probationary (6 Months)</option>
                    <option value="contract">Fixed-Term Contract</option>
                    <option value="intern">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Monthly Base Salary (UGX)</label>
                  <input
                    type="number"
                    value={formData.baseSalary}
                    onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">National ID (NIN)</label>
                  <input
                    type="text"
                    value={formData.nationalId}
                    onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition cursor-pointer"
                >
                  {formSubmitting ? 'Registering...' : 'Save & Onboard Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
