import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import {
  initialBranches,
  initialDepartments,
  initialEmployees,
  initialHolidays,
  initialLeaveApplications,
  initialLeaveBalances,
  initialLeaveTypes,
  initialPayrollRecords,
  initialPerformanceReviews,
  initialNotifications,
  initialAuditLogs,
  initialSettings,
  initialShifts,
  initialUsers,
  generateSeedAttendance,
  generateSeedBiometricTemplates,
} from './src/data/seedData.ts';
import {
  AttendanceRecord,
  AttendanceEvent,
  Employee,
  BiometricTemplate,
  LeaveApplication,
  LeaveBalance,
  AttendanceCorrection,
  PayrollRecord,
  PerformanceReview,
  Notification,
  AuditLog,
  SystemSettings,
  User,
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// In-Memory Database Store
const db = {
  branches: [...initialBranches],
  departments: [...initialDepartments],
  shifts: [...initialShifts],
  employees: [...initialEmployees],
  users: [...initialUsers],
  attendance: generateSeedAttendance(),
  attendanceEvents: [] as AttendanceEvent[],
  biometrics: generateSeedBiometricTemplates(),
  leaveTypes: [...initialLeaveTypes],
  leaveBalances: [...initialLeaveBalances],
  leaveApplications: [...initialLeaveApplications],
  corrections: [] as AttendanceCorrection[],
  holidays: [...initialHolidays],
  payroll: [...initialPayrollRecords],
  performance: [...initialPerformanceReviews],
  notifications: [...initialNotifications],
  auditLogs: [...initialAuditLogs],
  settings: { ...initialSettings },
  currentUser: initialUsers[0], // Default Super Admin
};

// Helper to log audit event
function recordAudit(action: string, entity: string, entityId: string, details: string, req: Request) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  const log: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: db.currentUser.id,
    userName: db.currentUser.name,
    action,
    entity,
    entityId,
    details,
    ipAddress: ip,
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) db.auditLogs.pop();
}

// -------------------------------------------------------------
// Authentication & Role-Based Access APIs
// -------------------------------------------------------------
app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({
    user: db.currentUser,
    employee: db.employees.find((e) => e.id === db.currentUser.employeeId) || null,
    settings: db.settings,
  });
});

app.post('/api/auth/switch-user', (req: Request, res: Response) => {
  const { role, userId } = req.body;
  let targetUser = db.users.find((u) => u.id === userId);
  if (!targetUser && role) {
    targetUser = db.users.find((u) => u.role === role);
  }
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  db.currentUser = targetUser;
  recordAudit('USER_ROLE_SWITCH', 'User', targetUser.id, `Switched active session to role ${targetUser.role} (${targetUser.name})`, req);
  res.json({ success: true, user: db.currentUser });
});

// -------------------------------------------------------------
// Organization Master APIs
// -------------------------------------------------------------
app.get('/api/branches', (_req: Request, res: Response) => {
  res.json(db.branches);
});

app.get('/api/departments', (_req: Request, res: Response) => {
  res.json(db.departments);
});

app.get('/api/shifts', (_req: Request, res: Response) => {
  res.json(db.shifts);
});

app.get('/api/holidays', (_req: Request, res: Response) => {
  res.json(db.holidays);
});

// -------------------------------------------------------------
// Employees Management APIs
// -------------------------------------------------------------
app.get('/api/employees', (req: Request, res: Response) => {
  let list = [...db.employees];
  const { dept, branch, status, query } = req.query;

  if (dept && dept !== 'all') {
    list = list.filter((e) => e.departmentId === dept);
  }
  if (branch && branch !== 'all') {
    list = list.filter((e) => e.branchId === branch);
  }
  if (status && status !== 'all') {
    list = list.filter((e) => e.status === status);
  }
  if (query) {
    const q = String(query).toLowerCase();
    list = list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeNumber.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
    );
  }

  // Hide salary if user is supervisor or regular employee
  const currentRole = db.currentUser.role;
  if (currentRole === 'supervisor' || currentRole === 'employee') {
    list = list.map((emp) => {
      if (emp.id !== db.currentUser.employeeId) {
        return { ...emp, baseSalary: 0, allowances: 0 };
      }
      return emp;
    });
  }

  res.json(list);
});

app.get('/api/employees/:id', (req: Request, res: Response) => {
  const emp = db.employees.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });
  res.json(emp);
});

app.post('/api/employees', (req: Request, res: Response) => {
  const body = req.body;
  // Duplicate check
  const existsEmail = db.employees.some((e) => e.email.toLowerCase() === body.email?.toLowerCase());
  if (existsEmail) {
    return res.status(400).json({ error: 'An employee with this work email already exists.' });
  }

  const newId = `emp-${Date.now()}`;
  const empCount = db.employees.length + 1;
  const empNumber = `EMP-${new Date().getFullYear()}-${String(empCount).padStart(3, '0')}`;

  const newEmp: Employee = {
    id: newId,
    employeeNumber: empNumber,
    firstName: body.firstName || 'New',
    middleName: body.middleName || '',
    lastName: body.lastName || 'Employee',
    gender: body.gender || 'male',
    dateOfBirth: body.dateOfBirth || '1995-01-01',
    nationality: body.nationality || 'Ugandan',
    nationalId: body.nationalId || `UG-${Date.now().toString().slice(-8)}`,
    phone: body.phone || '+256 700 000 000',
    email: body.email,
    residentialAddress: body.residentialAddress || 'Kampala, Uganda',
    emergencyContact: body.emergencyContact || { name: 'Emergency Contact', relationship: 'Relative', phone: '+256 700 000 000' },
    hireDate: body.hireDate || new Date().toISOString().split('T')[0],
    contractType: body.contractType || 'permanent',
    jobTitle: body.jobTitle || 'Associate',
    departmentId: body.departmentId || 'dept-1',
    branchId: body.branchId || 'b-1',
    supervisorId: body.supervisorId || undefined,
    status: 'active',
    baseSalary: Number(body.baseSalary) || 2500000,
    allowances: Number(body.allowances) || 200000,
    profilePhoto: body.profilePhoto || undefined,
    biometricEnrolled: false,
    biometricConsentGiven: false,
    documents: [],
  };

  db.employees.unshift(newEmp);

  // Initialize leave balances for default leave types
  db.leaveTypes.forEach((lt) => {
    db.leaveBalances.push({
      id: `lb-${Date.now()}-${lt.id}`,
      employeeId: newEmp.id,
      leaveTypeId: lt.id,
      entitledDays: lt.defaultDaysPerYear,
      accruedDays: lt.defaultDaysPerYear / 12,
      takenDays: 0,
      pendingDays: 0,
      remainingDays: lt.defaultDaysPerYear,
      carriedForwardDays: 0,
    });
  });

  recordAudit('EMPLOYEE_REGISTER', 'Employee', newEmp.id, `Registered new employee ${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeNumber})`, req);
  res.status(201).json(newEmp);
});

app.put('/api/employees/:id', (req: Request, res: Response) => {
  const index = db.employees.findIndex((e) => e.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Employee not found' });

  const current = db.employees[index];
  const updated: Employee = {
    ...current,
    ...req.body,
    id: current.id,
    employeeNumber: current.employeeNumber,
  };

  db.employees[index] = updated;
  recordAudit('EMPLOYEE_UPDATE', 'Employee', updated.id, `Updated details for ${updated.firstName} ${updated.lastName}`, req);
  res.json(updated);
});

app.delete('/api/employees/:id', (req: Request, res: Response) => {
  const emp = db.employees.find((e) => e.id === req.params.id);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  emp.status = 'terminated';
  recordAudit('EMPLOYEE_OFFBOARD', 'Employee', emp.id, `Deactivated employee ${emp.firstName} ${emp.lastName}`, req);
  res.json({ success: true, message: 'Employee status set to terminated' });
});

// -------------------------------------------------------------
// Biometric Registration & Template Management
// -------------------------------------------------------------
app.get('/api/biometrics/templates', (_req: Request, res: Response) => {
  res.json(
    db.biometrics.map((b) => ({
      employeeId: b.employeeId,
      qualityScore: b.qualityScore,
      enrolledAt: b.enrolledAt,
      hash: b.hash,
      vector: b.vector,
    }))
  );
});

app.post('/api/biometrics/enroll', (req: Request, res: Response) => {
  const { employeeId, vector, qualityScore, consentSigned } = req.body;
  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  if (!consentSigned) {
    return res.status(400).json({ error: 'Informed biometric consent must be granted by the employee.' });
  }
  if (!vector || !Array.isArray(vector) || vector.length !== 128) {
    return res.status(400).json({ error: 'Invalid 128-dimensional biometric template vector.' });
  }

  // Remove previous template if re-enrolling
  db.biometrics = db.biometrics.filter((b) => b.employeeId !== employeeId);

  const hash = `sha256:${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
  const template: BiometricTemplate = {
    id: `bio-${Date.now()}`,
    employeeId,
    vector,
    qualityScore: qualityScore || 95,
    enrolledAt: new Date().toISOString(),
    consentSigned: true,
    hash,
  };
  db.biometrics.push(template);

  emp.biometricEnrolled = true;
  emp.biometricEnrolledAt = template.enrolledAt;
  emp.biometricConsentGiven = true;

  recordAudit(
    'BIOMETRIC_ENROLLMENT',
    'EmployeeBiometrics',
    employeeId,
    `Enrolled biometric face template (Quality: ${template.qualityScore}%, Hash: ${hash}) for ${emp.firstName} ${emp.lastName}`,
    req
  );

  res.json({
    success: true,
    message: `Biometric template successfully enrolled for ${emp.firstName} ${emp.lastName}`,
    template: {
      employeeId: template.employeeId,
      qualityScore: template.qualityScore,
      enrolledAt: template.enrolledAt,
      hash: template.hash,
    },
  });
});

app.delete('/api/biometrics/:employeeId', (req: Request, res: Response) => {
  const { employeeId } = req.params;
  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  db.biometrics = db.biometrics.filter((b) => b.employeeId !== employeeId);
  emp.biometricEnrolled = false;
  emp.biometricEnrolledAt = undefined;
  emp.biometricConsentGiven = false;

  recordAudit('BIOMETRIC_REVOCATION', 'EmployeeBiometrics', employeeId, `Revoked face biometric template for ${emp.firstName} ${emp.lastName}`, req);
  res.json({ success: true, message: 'Biometric enrollment revoked and template deleted securely' });
});

// -------------------------------------------------------------
// Facial Recognition & Attendance Clocking Engine
// -------------------------------------------------------------
app.get('/api/attendance', (req: Request, res: Response) => {
  let records = [...db.attendance];
  const { date, employeeId, dept, branch, status } = req.query;

  if (date) {
    records = records.filter((r) => r.date === date);
  }
  if (employeeId) {
    records = records.filter((r) => r.employeeId === employeeId);
  }
  if (status && status !== 'all') {
    records = records.filter((r) => r.status === status);
  }
  if (dept && dept !== 'all') {
    const deptEmpIds = db.employees.filter((e) => e.departmentId === dept).map((e) => e.id);
    records = records.filter((r) => deptEmpIds.includes(r.employeeId));
  }
  if (branch && branch !== 'all') {
    const branchEmpIds = db.employees.filter((e) => e.branchId === branch).map((e) => e.id);
    records = records.filter((r) => branchEmpIds.includes(r.employeeId));
  }

  // Sort latest first
  records.sort((a, b) => b.date.localeCompare(a.date));
  res.json(records);
});

app.post('/api/attendance/clock', (req: Request, res: Response) => {
  const {
    employeeId,
    type, // 'clock_in' | 'clock_out'
    method = 'face', // 'face' | 'manual' | 'badge'
    location = 'HQ Kampala Terminal 1',
    faceConfidence = 0.92,
    livenessScore = 8.5,
    overrideReason,
  } = req.body;

  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found.' });

  // Today server date and time
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0]; // "HH:MM:SS"

  const shift = db.shifts[0]; // Standard shift
  const [shiftStartH, shiftStartM] = shift.startTime.split(':').map(Number);
  const graceMins = shift.gracePeriodMinutes || db.settings.defaultGracePeriodMinutes;

  // Find existing record for today
  let record = db.attendance.find((r) => r.employeeId === employeeId && r.date === todayStr);

  if (type === 'clock_in') {
    if (record && record.clockInTime) {
      return res.status(400).json({
        error: `Employee already clocked in today at ${record.clockInTime}. Clock out first before re-clocking.`,
      });
    }

    // Calculate late arrival
    const [clockH, clockM] = timeStr.split(':').map(Number);
    const clockMinutesTotal = clockH * 60 + clockM;
    const shiftMinutesTotal = shiftStartH * 60 + shiftStartM;
    const diff = clockMinutesTotal - shiftMinutesTotal;

    let status: AttendanceRecord['status'] = 'present';
    let minutesLate = 0;
    if (diff > graceMins) {
      status = 'late';
      minutesLate = diff;
    }

    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        employeeId,
        date: todayStr,
        shiftId: shift.id,
        clockInTime: timeStr,
        status,
        minutesLate,
        earlyDepartureMinutes: 0,
        totalHours: 0,
        breakHours: 0,
        overtimeHours: 0,
        clockInMethod: method,
        clockInLocation: location,
        faceConfidence: method === 'face' ? faceConfidence : undefined,
        verifiedBy: method === 'manual' ? db.currentUser.name : undefined,
        notes: overrideReason || undefined,
      };
      db.attendance.unshift(record);
    } else {
      record.clockInTime = timeStr;
      record.status = status;
      record.minutesLate = minutesLate;
      record.clockInMethod = method;
      record.clockInLocation = location;
      record.faceConfidence = faceConfidence;
    }

    // Record Event
    const event: AttendanceEvent = {
      id: `ev-${Date.now()}`,
      attendanceId: record.id,
      employeeId,
      type: 'clock_in',
      timestamp: now.toISOString(),
      method,
      location,
      faceConfidence,
      livenessScore,
      supervisorOverrideReason: overrideReason,
    };
    db.attendanceEvents.unshift(event);

    // In-app Notification
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      employeeId,
      title: 'Clock-In Recorded',
      message: `Clock-in registered at ${timeStr}. Status: ${status.toUpperCase()} ${minutesLate > 0 ? `(${minutesLate}m late)` : '(On Time)'}.`,
      type: 'attendance',
      read: false,
      createdAt: now.toISOString(),
      linkTab: 'attendance',
    });

    recordAudit(
      'ATTENDANCE_CLOCK_IN',
      'AttendanceRecord',
      record.id,
      `Clocked in ${emp.firstName} ${emp.lastName} via ${method}. Time: ${timeStr}, Status: ${status}`,
      req
    );

    return res.json({
      success: true,
      message: `Clock-in successful for ${emp.firstName} ${emp.lastName}!`,
      record,
      event,
    });
  } else if (type === 'clock_out') {
    if (!record || !record.clockInTime) {
      return res.status(400).json({
        error: 'Cannot clock out: No active clock-in recorded for today.',
      });
    }
    if (record.clockOutTime) {
      return res.status(400).json({
        error: `Employee already clocked out today at ${record.clockOutTime}.`,
      });
    }

    record.clockOutTime = timeStr;
    record.clockOutMethod = method;
    record.clockOutLocation = location;

    // Calculate total hours
    const [inH, inM, inS = 0] = record.clockInTime.split(':').map(Number);
    const [outH, outM, outS = 0] = timeStr.split(':').map(Number);
    const inTotalSec = inH * 3600 + inM * 60 + inS;
    const outTotalSec = outH * 3600 + outM * 60 + outS;
    const workedSeconds = Math.max(0, outTotalSec - inTotalSec);
    const workedHours = Number((workedSeconds / 3600).toFixed(2));

    record.totalHours = workedHours;
    record.breakHours = workedHours >= 5 ? 1.0 : 0;
    const netWorked = Math.max(0, record.totalHours - record.breakHours);
    record.overtimeHours = netWorked > 8 ? Number((netWorked - 8).toFixed(2)) : 0;

    // Record Event
    const event: AttendanceEvent = {
      id: `ev-${Date.now()}`,
      attendanceId: record.id,
      employeeId,
      type: 'clock_out',
      timestamp: now.toISOString(),
      method,
      location,
      faceConfidence,
      livenessScore,
      supervisorOverrideReason: overrideReason,
    };
    db.attendanceEvents.unshift(event);

    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      employeeId,
      title: 'Clock-Out Recorded',
      message: `Clock-out registered at ${timeStr}. Total worked: ${record.totalHours} hrs.`,
      type: 'attendance',
      read: false,
      createdAt: now.toISOString(),
      linkTab: 'attendance',
    });

    recordAudit(
      'ATTENDANCE_CLOCK_OUT',
      'AttendanceRecord',
      record.id,
      `Clocked out ${emp.firstName} ${emp.lastName}. Total Hours: ${record.totalHours}h`,
      req
    );

    return res.json({
      success: true,
      message: `Clock-out successful for ${emp.firstName} ${emp.lastName}!`,
      record,
      event,
    });
  } else {
    return res.status(400).json({ error: 'Invalid clock type. Must be clock_in or clock_out.' });
  }
});

// Attendance summary statistics for charts and dashboard
app.get('/api/attendance/summary', (req: Request, res: Response) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = db.attendance.filter((r) => r.date === todayStr);

  const totalEmployees = db.employees.filter((e) => e.status === 'active').length;
  const presentToday = todayRecords.filter((r) => r.status === 'present').length;
  const lateToday = todayRecords.filter((r) => r.status === 'late').length;
  const leaveToday = todayRecords.filter((r) => r.status === 'on_leave').length;
  const clockedInCurrently = todayRecords.filter((r) => r.clockInTime && !r.clockOutTime).length;
  const absentToday = Math.max(0, totalEmployees - (presentToday + lateToday + leaveToday));

  const attendanceRate = totalEmployees > 0 ? Math.round(((presentToday + lateToday) / totalEmployees) * 100) : 0;

  // Monthly stats
  const curMonth = todayStr.substring(0, 7); // "YYYY-MM"
  const monthlyRecords = db.attendance.filter((r) => r.date.startsWith(curMonth));
  const totalLateMinutes = monthlyRecords.reduce((acc, r) => acc + (r.minutesLate || 0), 0);
  const totalOvertimeHours = monthlyRecords.reduce((acc, r) => acc + (r.overtimeHours || 0), 0);
  const avgHoursWorked =
    monthlyRecords.length > 0
      ? Number((monthlyRecords.reduce((acc, r) => acc + (r.totalHours || 0), 0) / monthlyRecords.length).toFixed(1))
      : 8.0;

  res.json({
    totalEmployees,
    presentToday,
    lateToday,
    absentToday,
    leaveToday,
    clockedInCurrently,
    attendanceRate,
    totalLateMinutes,
    totalOvertimeHours,
    avgHoursWorked,
    todayDate: todayStr,
  });
});

// Monthly Attendance Sheet Grid (Matrix 1st to 31st)
app.get('/api/attendance/monthly-matrix', (req: Request, res: Response) => {
  const { month = '2026-10', dept = 'all', branch = 'all' } = req.query;
  const [yearStr, monthStr] = String(month).split('-');
  const year = Number(yearStr);
  const m = Number(monthStr);

  const daysInMonth = new Date(year, m, 0).getDate();

  let emps = [...db.employees];
  if (dept !== 'all') emps = emps.filter((e) => e.departmentId === dept);
  if (branch !== 'all') emps = emps.filter((e) => e.branchId === branch);

  const matrix = emps.map((emp) => {
    const dailyStatus: Record<number, { status: string; code: string; in?: string; out?: string }> = {};
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let leaveCount = 0;
    let totalWorkedHours = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, m - 1, day).getDay(); // 0=Sun, 6=Sat

      const rec = db.attendance.find((r) => r.employeeId === emp.id && r.date === dateStr);
      const hol = db.holidays.find((h) => h.date === dateStr);

      if (rec) {
        if (rec.status === 'present') {
          dailyStatus[day] = { status: 'Present', code: 'P', in: rec.clockInTime, out: rec.clockOutTime };
          presentCount++;
          totalWorkedHours += rec.totalHours || 8;
        } else if (rec.status === 'late') {
          dailyStatus[day] = { status: 'Late', code: 'L', in: rec.clockInTime, out: rec.clockOutTime };
          lateCount++;
          totalWorkedHours += rec.totalHours || 7.5;
        } else if (rec.status === 'on_leave') {
          dailyStatus[day] = { status: 'On Leave', code: 'OL' };
          leaveCount++;
        } else if (rec.status === 'absent') {
          dailyStatus[day] = { status: 'Absent', code: 'A' };
          absentCount++;
        } else {
          dailyStatus[day] = { status: 'Excused', code: 'E' };
        }
      } else if (hol) {
        dailyStatus[day] = { status: `Holiday: ${hol.name}`, code: 'H' };
      } else if (dayOfWeek === 0 || dayOfWeek === 6) {
        dailyStatus[day] = { status: 'Weekend', code: 'W' };
      } else {
        // Scheduled workday with no record
        const isPast = new Date(dateStr) < new Date();
        if (isPast) {
          dailyStatus[day] = { status: 'Absent', code: 'A' };
          absentCount++;
        } else {
          dailyStatus[day] = { status: 'Scheduled', code: '-' };
        }
      }
    }

    return {
      employee: emp,
      dailyStatus,
      summary: {
        presentCount,
        lateCount,
        absentCount,
        leaveCount,
        daysWorked: presentCount + lateCount,
        totalWorkedHours: Number(totalWorkedHours.toFixed(1)),
        complianceRate: Math.round(((presentCount + lateCount) / Math.max(1, presentCount + lateCount + absentCount)) * 100),
      },
    };
  });

  res.json({
    month: String(month),
    daysInMonth,
    matrix,
  });
});

// -------------------------------------------------------------
// Attendance Corrections & Exceptions Workflow
// -------------------------------------------------------------
app.get('/api/attendance/corrections', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  let list = [...db.corrections];
  if (employeeId) {
    list = list.filter((c) => c.employeeId === employeeId);
  }
  res.json(list);
});

app.post('/api/attendance/corrections', (req: Request, res: Response) => {
  const { employeeId, date, requestedClockIn, requestedClockOut, requestedStatus = 'present', reason } = req.body;
  const newCorr: AttendanceCorrection = {
    id: `cor-${Date.now()}`,
    employeeId,
    date,
    requestedClockIn,
    requestedClockOut,
    requestedStatus,
    reason,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  db.corrections.unshift(newCorr);

  recordAudit('ATTENDANCE_CORRECTION_REQUEST', 'AttendanceCorrection', newCorr.id, `Correction requested for date ${date}: ${reason}`, req);

  // Notify HR
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    title: 'New Attendance Correction Request',
    message: `Employee submitted attendance exception for ${date}: ${reason}`,
    type: 'attendance',
    read: false,
    createdAt: new Date().toISOString(),
    linkTab: 'attendance',
  });

  res.status(201).json(newCorr);
});

app.put('/api/attendance/corrections/:id', (req: Request, res: Response) => {
  const { status, approverComment } = req.body;
  const corr = db.corrections.find((c) => c.id === req.params.id);
  if (!corr) return res.status(404).json({ error: 'Correction not found' });

  corr.status = status;
  corr.approverComment = approverComment;
  corr.approverId = db.currentUser.id;

  if (status === 'approved') {
    // Update or insert actual attendance record
    let rec = db.attendance.find((r) => r.employeeId === corr.employeeId && r.date === corr.date);
    if (!rec) {
      rec = {
        id: `att-cor-${Date.now()}`,
        employeeId: corr.employeeId,
        date: corr.date,
        shiftId: db.shifts[0].id,
        clockInTime: corr.requestedClockIn || '08:00:00',
        clockOutTime: corr.requestedClockOut || '17:00:00',
        totalHours: 8.0,
        breakHours: 1.0,
        overtimeHours: 0,
        status: corr.requestedStatus,
        minutesLate: 0,
        earlyDepartureMinutes: 0,
        clockInMethod: 'manual',
        verifiedBy: db.currentUser.name,
        notes: `Correction approved: ${approverComment || corr.reason}`,
      };
      db.attendance.unshift(rec);
    } else {
      rec.clockInTime = corr.requestedClockIn || rec.clockInTime;
      rec.clockOutTime = corr.requestedClockOut || rec.clockOutTime;
      rec.status = corr.requestedStatus;
      rec.notes = `Correction approved by ${db.currentUser.name}: ${approverComment || ''}`;
    }
  }

  recordAudit(
    'ATTENDANCE_CORRECTION_RESOLVE',
    'AttendanceCorrection',
    corr.id,
    `Correction marked ${status} by ${db.currentUser.name}. Comment: ${approverComment || 'None'}`,
    req
  );

  res.json(corr);
});

// -------------------------------------------------------------
// Leave Management APIs
// -------------------------------------------------------------
app.get('/api/leave/types', (_req: Request, res: Response) => {
  res.json(db.leaveTypes);
});

app.get('/api/leave/balances', (req: Request, res: Response) => {
  const { employeeId } = req.query;
  let balances = [...db.leaveBalances];
  if (employeeId) {
    balances = balances.filter((b) => b.employeeId === employeeId);
  }
  res.json(balances);
});

app.get('/api/leave/applications', (req: Request, res: Response) => {
  const { employeeId, status } = req.query;
  let apps = [...db.leaveApplications];
  if (employeeId) {
    apps = apps.filter((a) => a.employeeId === employeeId);
  }
  if (status && status !== 'all') {
    apps = apps.filter((a) => a.status === status);
  }
  res.json(apps);
});

app.post('/api/leave/apply', (req: Request, res: Response) => {
  const { employeeId, leaveTypeId, startDate, endDate, daysCount, reason, attachmentName } = req.body;

  const emp = db.employees.find((e) => e.id === employeeId);
  if (!emp) return res.status(404).json({ error: 'Employee not found' });

  // Check balance
  const balance = db.leaveBalances.find((b) => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId);
  if (balance && balance.remainingDays < daysCount) {
    return res.status(400).json({
      error: `Requested days (${daysCount}) exceed available leave balance (${balance.remainingDays} days).`,
    });
  }

  const appItem: LeaveApplication = {
    id: `la-${Date.now()}`,
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    daysCount: Number(daysCount),
    reason,
    attachmentName,
    status: 'pending_supervisor',
    supervisorId: emp.supervisorId || undefined,
    createdAt: new Date().toISOString(),
  };

  db.leaveApplications.unshift(appItem);

  if (balance) {
    balance.pendingDays += Number(daysCount);
    balance.remainingDays = Math.max(0, balance.entitledDays - (balance.takenDays + balance.pendingDays));
  }

  recordAudit(
    'LEAVE_APPLICATION_SUBMIT',
    'LeaveApplication',
    appItem.id,
    `${emp.firstName} ${emp.lastName} submitted leave request for ${daysCount} days (${startDate} to ${endDate})`,
    req
  );

  res.status(201).json(appItem);
});

app.put('/api/leave/applications/:id/review', (req: Request, res: Response) => {
  const { action, comment } = req.body; // 'supervisor_approve' | 'supervisor_reject' | 'hr_approve' | 'hr_reject'
  const appItem = db.leaveApplications.find((a) => a.id === req.params.id);
  if (!appItem) return res.status(404).json({ error: 'Leave application not found' });

  const balance = db.leaveBalances.find((b) => b.employeeId === appItem.employeeId && b.leaveTypeId === appItem.leaveTypeId);

  if (action === 'supervisor_approve') {
    appItem.status = 'pending_hr';
    appItem.supervisorComment = comment || 'Recommended by Supervisor';
    appItem.supervisorApprovedAt = new Date().toISOString();
  } else if (action === 'supervisor_reject') {
    appItem.status = 'rejected';
    appItem.supervisorComment = comment || 'Rejected by Supervisor';
    if (balance) {
      balance.pendingDays = Math.max(0, balance.pendingDays - appItem.daysCount);
      balance.remainingDays = balance.entitledDays - balance.takenDays;
    }
  } else if (action === 'hr_approve') {
    appItem.status = 'approved';
    appItem.hrComment = comment || 'Approved by HR';
    appItem.hrApprovedAt = new Date().toISOString();
    if (balance) {
      balance.pendingDays = Math.max(0, balance.pendingDays - appItem.daysCount);
      balance.takenDays += appItem.daysCount;
      balance.remainingDays = Math.max(0, balance.entitledDays - balance.takenDays);
    }
    // Also inject on_leave into attendance records for the dates!
    const start = new Date(appItem.startDate);
    const end = new Date(appItem.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        let existing = db.attendance.find((r) => r.employeeId === appItem.employeeId && r.date === dStr);
        if (!existing) {
          db.attendance.push({
            id: `att-leave-${Date.now()}-${dStr}`,
            employeeId: appItem.employeeId,
            date: dStr,
            shiftId: db.shifts[0].id,
            status: 'on_leave',
            minutesLate: 0,
            earlyDepartureMinutes: 0,
            totalHours: 0,
            breakHours: 0,
            overtimeHours: 0,
            clockInMethod: 'manual',
            notes: `Approved Leave (${appItem.reason})`,
          });
        } else {
          existing.status = 'on_leave';
        }
      }
    }
  } else if (action === 'hr_reject') {
    appItem.status = 'rejected';
    appItem.hrComment = comment || 'Rejected by HR';
    if (balance) {
      balance.pendingDays = Math.max(0, balance.pendingDays - appItem.daysCount);
      balance.remainingDays = balance.entitledDays - balance.takenDays;
    }
  }

  recordAudit(
    'LEAVE_APPLICATION_REVIEW',
    'LeaveApplication',
    appItem.id,
    `Action: ${action} by ${db.currentUser.name} (${db.currentUser.role}). Comment: ${comment || 'None'}`,
    req
  );

  res.json(appItem);
});

// -------------------------------------------------------------
// Payroll Engine (Uganda PAYE/NSSF & Standard Calculations)
// -------------------------------------------------------------
app.get('/api/payroll', (_req: Request, res: Response) => {
  res.json(db.payroll);
});

app.post('/api/payroll/generate', (req: Request, res: Response) => {
  const { month = 10, year = 2026 } = req.body;
  const newRecords: PayrollRecord[] = [];

  db.employees.forEach((emp, idx) => {
    const base = emp.baseSalary;
    const allowances = emp.allowances;

    // Overtime from attendance records
    const empMonthRecs = db.attendance.filter(
      (r) => r.employeeId === emp.id && r.date.startsWith(`${year}-${String(month).padStart(2, '0')}`)
    );
    const otHours = empMonthRecs.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);
    const hourlyRate = (base / 176); // 22 days * 8 hours
    const otPay = Math.round(otHours * (hourlyRate * 1.5));

    // Lateness deduction: only if policy requires it (zero by default per labor best practice)
    const lateDeductions = 0;
    const gross = base + allowances + otPay - lateDeductions;

    // Uganda PAYE Progressive Tax calculation
    // 0 - 235k: 0%
    // 235k - 335k: 10%
    // 335k - 410k: 20%
    // 410k - 10M: 30%
    // > 10M: 40% on excess
    let paye = 0;
    if (gross > 235000) {
      const taxable = gross;
      if (taxable <= 335000) {
        paye = (taxable - 235000) * 0.1;
      } else if (taxable <= 410000) {
        paye = 10000 + (taxable - 335000) * 0.2;
      } else if (taxable <= 10000000) {
        paye = 25000 + (taxable - 410000) * 0.3;
      } else {
        paye = 2902000 + (taxable - 10000000) * 0.4;
      }
    }
    paye = Math.round(paye);

    // Uganda NSSF: Employee 5%, Employer 10%
    const nssfEmployee = Math.round(gross * 0.05);
    const nssfEmployer = Math.round(gross * 0.1);
    const otherDeductions = 30000; // welfare/medical scheme

    const net = Math.round(gross - (paye + nssfEmployee + otherDeductions));

    const rec: PayrollRecord = {
      id: `pr-${year}-${month}-${emp.id}`,
      employeeId: emp.id,
      periodMonth: Number(month),
      periodYear: Number(year),
      baseSalary: base,
      allowances,
      overtimeHours: otHours,
      overtimePay: otPay,
      lateDeductions,
      absenteeDeductions: 0,
      grossPay: gross,
      payeTax: paye,
      nssfEmployee,
      nssfEmployer,
      otherDeductions,
      netSalary: net,
      status: 'approved',
      payslipNumber: `PAY-${year}${String(month).padStart(2, '0')}-${String(idx + 1).padStart(3, '0')}`,
      generatedAt: new Date().toISOString(),
    };

    newRecords.push(rec);
  });

  // Replace period records
  db.payroll = [...db.payroll.filter((p) => !(p.periodMonth === Number(month) && p.periodYear === Number(year))), ...newRecords];

  recordAudit('PAYROLL_GENERATED', 'Payroll', `${year}-${month}`, `Generated complete payroll batch for ${newRecords.length} employees`, req);
  res.json({ success: true, count: newRecords.length, records: newRecords });
});

// -------------------------------------------------------------
// Performance Management APIs
// -------------------------------------------------------------
app.get('/api/performance', (_req: Request, res: Response) => {
  res.json(db.performance);
});

app.post('/api/performance', (req: Request, res: Response) => {
  const body = req.body;
  const review: PerformanceReview = {
    id: `perf-${Date.now()}`,
    employeeId: body.employeeId,
    reviewerId: db.currentUser.employeeId || 'emp-1',
    period: body.period || 'Q4 2026',
    score: Number(body.score) || 4.5,
    kpis: body.kpis || [],
    supervisorFeedback: body.supervisorFeedback || 'Consistently meets organizational benchmarks.',
    employeeComments: body.employeeComments || '',
    achievements: body.achievements || [],
    disciplinaryNotes: body.disciplinaryNotes || [],
    status: 'submitted',
    updatedAt: new Date().toISOString(),
  };
  db.performance.unshift(review);
  recordAudit('PERFORMANCE_REVIEW_ADD', 'PerformanceReview', review.id, `Created review for employee ${review.employeeId}`, req);
  res.status(201).json(review);
});

// -------------------------------------------------------------
// Notifications & System Audit Logs
// -------------------------------------------------------------
app.get('/api/notifications', (_req: Request, res: Response) => {
  res.json(db.notifications);
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const n = db.notifications.find((notif) => notif.id === req.params.id);
  if (n) n.read = true;
  res.json({ success: true });
});

app.put('/api/notifications/read-all', (_req: Request, res: Response) => {
  db.notifications.forEach((n) => (n.read = true));
  res.json({ success: true });
});

app.get('/api/audit-logs', (_req: Request, res: Response) => {
  res.json(db.auditLogs);
});

// -------------------------------------------------------------
// System Settings APIs
// -------------------------------------------------------------
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(db.settings);
});

app.put('/api/settings', (req: Request, res: Response) => {
  db.settings = { ...db.settings, ...req.body };
  recordAudit('SYSTEM_SETTINGS_UPDATE', 'SystemSettings', 'settings', `Updated settings: grace period=${db.settings.defaultGracePeriodMinutes}m, threshold=${db.settings.facialMatchThreshold}%`, req);
  res.json(db.settings);
});

// Direct export of complete MySQL Schema
app.get('/api/export/schema.sql', (_req: Request, res: Response) => {
  const schemaPath = path.join(__dirname, 'database', 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', 'attachment; filename="apex_hr_schema.sql"');
    return res.sendFile(schemaPath);
  }
  res.status(404).send('Schema file not found');
});

// -------------------------------------------------------------
// Vite Dev Server Middleware / Production Static Servicing
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`ApexHR Enterprise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
