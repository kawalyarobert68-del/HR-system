export type Role = 'admin' | 'hr_manager' | 'supervisor' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  employeeId?: string;
  avatar?: string;
  departmentId?: string;
  branchId?: string;
  permissions: string[];
}

export type EmploymentStatus = 'active' | 'on_leave' | 'probation' | 'suspended' | 'terminated';
export type ContractType = 'permanent' | 'contract' | 'probation' | 'intern';

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  nationality: string;
  nationalId: string;
  phone: string;
  email: string;
  residentialAddress: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  hireDate: string;
  contractType: ContractType;
  jobTitle: string;
  departmentId: string;
  branchId: string;
  supervisorId?: string;
  status: EmploymentStatus;
  baseSalary: number;
  allowances: number;
  profilePhoto?: string;
  biometricEnrolled: boolean;
  biometricEnrolledAt?: string;
  biometricConsentGiven?: boolean;
  documents?: {
    id: string;
    title: string;
    type: string;
    uploadDate: string;
    url: string;
  }[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  country: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
  breakMinutes: number;
  gracePeriodMinutes: number;
  isOvernight: boolean;
  workDays: number[]; // 1=Mon, ..., 5=Fri
}

export type AttendanceStatus =
  | 'present'
  | 'late'
  | 'absent'
  | 'half_day'
  | 'on_leave'
  | 'holiday'
  | 'weekend'
  | 'incomplete'
  | 'excused';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // "YYYY-MM-DD"
  shiftId: string;
  clockInTime?: string; // "HH:MM:SS"
  clockOutTime?: string;
  totalHours: number;
  breakHours: number;
  overtimeHours: number;
  status: AttendanceStatus;
  minutesLate: number;
  earlyDepartureMinutes: number;
  clockInMethod: 'face' | 'manual' | 'badge';
  clockOutMethod?: 'face' | 'manual' | 'badge';
  clockInLocation?: string;
  clockOutLocation?: string;
  faceConfidence?: number;
  verifiedBy?: string;
  notes?: string;
}

export interface AttendanceEvent {
  id: string;
  employeeId: string;
  attendanceId: string;
  type: 'clock_in' | 'clock_out';
  timestamp: string;
  method: 'face' | 'manual' | 'badge';
  location?: string;
  faceConfidence?: number;
  livenessScore?: number;
  deviceInfo?: string;
  supervisorOverrideReason?: string;
}

export interface BiometricTemplate {
  id: string;
  employeeId: string;
  vector: number[]; // 128-dimensional embedding
  qualityScore: number;
  enrolledAt: string;
  consentSigned: boolean;
  hash: string;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDaysPerYear: number;
  isPaid: boolean;
  requiresAttachment: boolean;
  carryForwardMax: number;
  description: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  entitledDays: number;
  accruedDays: number;
  takenDays: number;
  pendingDays: number;
  remainingDays: number;
  carriedForwardDays: number;
}

export type LeaveStatus = 'pending_supervisor' | 'pending_hr' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApplication {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  attachmentName?: string;
  status: LeaveStatus;
  supervisorId?: string;
  supervisorComment?: string;
  supervisorApprovedAt?: string;
  hrComment?: string;
  hrApprovedAt?: string;
  createdAt: string;
}

export interface AttendanceCorrection {
  id: string;
  employeeId: string;
  attendanceId?: string;
  date: string;
  requestedClockIn?: string;
  requestedClockOut?: string;
  requestedStatus: AttendanceStatus;
  reason: string;
  supportingDocName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approverComment?: string;
  approverId?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  branchId?: string; // all if undefined
  isRecurring: boolean;
  description: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  periodMonth: number;
  periodYear: number;
  baseSalary: number;
  allowances: number;
  overtimeHours: number;
  overtimePay: number;
  lateDeductions: number;
  absenteeDeductions: number;
  grossPay: number;
  payeTax: number;       // Uganda PAYE / Standard income tax
  nssfEmployee: number;  // 5% in Uganda
  nssfEmployer: number;  // 10% in Uganda
  otherDeductions: number;
  netSalary: number;
  status: 'draft' | 'approved' | 'paid';
  payslipNumber: string;
  generatedAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: string; // e.g., "Q1 2026"
  score: number;  // 1 to 5
  kpis: {
    id: string;
    title: string;
    target: string;
    achieved: string;
    score: number;
  }[];
  supervisorFeedback: string;
  employeeComments?: string;
  achievements?: string[];
  disciplinaryNotes?: string[];
  status: 'draft' | 'submitted' | 'acknowledged';
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId?: string;
  employeeId?: string;
  title: string;
  message: string;
  type: 'attendance' | 'leave' | 'payroll' | 'system' | 'security';
  read: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SystemSettings {
  companyName: string;
  companyCode: string;
  companyLogoUrl?: string;
  timezone: string;
  defaultGracePeriodMinutes: number;
  facialMatchThreshold: number; // 70 to 95 percent
  livenessStrictness: 'low' | 'medium' | 'high';
  enableGeofencing: boolean;
  allowedLocationRadiusMeters: number;
  allowManualClockInOverride: boolean;
  enableUgandaPayrollRules: boolean;
  currencySymbol: string;
  currencyCode: string;
  workingDaysPerWeek: number;
}
