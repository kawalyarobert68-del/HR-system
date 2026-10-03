import {
  AttendanceRecord,
  AttendanceCorrection,
  Branch,
  Department,
  Employee,
  Holiday,
  LeaveApplication,
  LeaveBalance,
  LeaveType,
  Notification,
  PayrollRecord,
  PerformanceReview,
  Role,
  Shift,
  SystemSettings,
  User,
  AuditLog,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  auth: {
    getMe: () => fetchJson<{ user: User; employee: Employee | null; settings: SystemSettings }>('/auth/me'),
    switchUser: (role?: Role, userId?: string) =>
      fetchJson<{ success: boolean; user: User }>('/auth/switch-user', {
        method: 'POST',
        body: JSON.stringify({ role, userId }),
      }),
  },

  employees: {
    getAll: (params?: { dept?: string; branch?: string; status?: string; query?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return fetchJson<Employee[]>(`/employees${q ? `?${q}` : ''}`);
    },
    getById: (id: string) => fetchJson<Employee>(`/employees/${id}`),
    create: (data: Partial<Employee>) =>
      fetchJson<Employee>('/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Employee>) =>
      fetchJson<Employee>(`/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchJson<{ success: boolean; message: string }>(`/employees/${id}`, {
        method: 'DELETE',
      }),
  },

  branches: {
    getAll: () => fetchJson<Branch[]>('/branches'),
  },

  departments: {
    getAll: () => fetchJson<Department[]>('/departments'),
  },

  shifts: {
    getAll: () => fetchJson<Shift[]>('/shifts'),
  },

  holidays: {
    getAll: () => fetchJson<Holiday[]>('/holidays'),
  },

  attendance: {
    getAll: (params?: { date?: string; employeeId?: string; dept?: string; branch?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return fetchJson<AttendanceRecord[]>(`/attendance${q ? `?${q}` : ''}`);
    },
    clock: (data: {
      employeeId: string;
      type: 'clock_in' | 'clock_out';
      method?: 'face' | 'manual' | 'badge';
      location?: string;
      faceConfidence?: number;
      livenessScore?: number;
      overrideReason?: string;
    }) =>
      fetchJson<{ success: boolean; message: string; record: AttendanceRecord; event: any }>('/attendance/clock', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getSummary: () =>
      fetchJson<{
        totalEmployees: number;
        presentToday: number;
        lateToday: number;
        absentToday: number;
        leaveToday: number;
        clockedInCurrently: number;
        attendanceRate: number;
        totalLateMinutes: number;
        totalOvertimeHours: number;
        avgHoursWorked: number;
        todayDate: string;
      }>('/attendance/summary'),
    getMonthlyMatrix: (month = '2026-10', dept = 'all', branch = 'all') =>
      fetchJson<{
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
      }>(`/attendance/monthly-matrix?month=${month}&dept=${dept}&branch=${branch}`),
    getCorrections: (employeeId?: string) =>
      fetchJson<AttendanceCorrection[]>(`/attendance/corrections${employeeId ? `?employeeId=${employeeId}` : ''}`),
    createCorrection: (data: Partial<AttendanceCorrection>) =>
      fetchJson<AttendanceCorrection>('/attendance/corrections', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resolveCorrection: (id: string, data: { status: 'approved' | 'rejected'; approverComment?: string }) =>
      fetchJson<AttendanceCorrection>(`/attendance/corrections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  biometrics: {
    getTemplates: () => fetchJson<{ employeeId: string; qualityScore: number; enrolledAt: string; hash: string; vector: number[] }[]>('/biometrics/templates'),
    enroll: (data: { employeeId: string; vector: number[]; qualityScore: number; consentSigned: boolean }) =>
      fetchJson<{ success: boolean; message: string; template: any }>('/biometrics/enroll', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    revoke: (employeeId: string) =>
      fetchJson<{ success: boolean; message: string }>(`/biometrics/${employeeId}`, {
        method: 'DELETE',
      }),
  },

  leave: {
    getTypes: () => fetchJson<LeaveType[]>('/leave/types'),
    getBalances: (employeeId?: string) =>
      fetchJson<LeaveBalance[]>(`/leave/balances${employeeId ? `?employeeId=${employeeId}` : ''}`),
    getApplications: (params?: { employeeId?: string; status?: string }) => {
      const q = new URLSearchParams(params as any).toString();
      return fetchJson<LeaveApplication[]>(`/leave/applications${q ? `?${q}` : ''}`);
    },
    apply: (data: Partial<LeaveApplication>) =>
      fetchJson<LeaveApplication>('/leave/apply', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    review: (id: string, data: { action: 'supervisor_approve' | 'supervisor_reject' | 'hr_approve' | 'hr_reject'; comment?: string }) =>
      fetchJson<LeaveApplication>(`/leave/applications/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },

  payroll: {
    getRecords: () => fetchJson<PayrollRecord[]>('/payroll'),
    generatePeriod: (month: number, year: number) =>
      fetchJson<{ success: boolean; count: number; records: PayrollRecord[] }>('/payroll/generate', {
        method: 'POST',
        body: JSON.stringify({ month, year }),
      }),
  },

  performance: {
    getAll: () => fetchJson<PerformanceReview[]>('/performance'),
    create: (data: Partial<PerformanceReview>) =>
      fetchJson<PerformanceReview>('/performance', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  notifications: {
    getAll: () => fetchJson<Notification[]>('/notifications'),
    markAsRead: (id: string) =>
      fetchJson<{ success: boolean }>(`/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllAsRead: () =>
      fetchJson<{ success: boolean }>('/notifications/read-all', {
        method: 'PUT',
      }),
  },

  auditLogs: {
    getAll: () => fetchJson<AuditLog[]>('/audit-logs'),
  },

  settings: {
    get: () => fetchJson<SystemSettings>('/settings'),
    update: (data: Partial<SystemSettings>) =>
      fetchJson<SystemSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};
