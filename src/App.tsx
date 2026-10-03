/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { EmployeeList } from './components/Employees/EmployeeList';
import { AttendanceManager } from './components/Attendance/AttendanceManager';
import { MonthlyAttendanceSheet } from './components/Attendance/MonthlyAttendanceSheet';
import { FaceEnrollment } from './components/Biometrics/FaceEnrollment';
import { LeaveManager } from './components/Leave/LeaveManager';
import { ScheduleManager } from './components/Schedules/ScheduleManager';
import { PayrollManager } from './components/Payroll/PayrollManager';
import { PerformanceManager } from './components/Performance/PerformanceManager';
import { ReportsCenter } from './components/Reports/ReportsCenter';
import { EmployeePortal } from './components/SelfService/EmployeePortal';
import { SettingsAndExport } from './components/Admin/SettingsAndExport';
import { AuditLogs } from './components/Admin/AuditLogs';
import { FaceAttendanceModal } from './components/Attendance/FaceAttendanceModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { api } from './services/api';
import {
  User,
  Employee,
  AttendanceRecord,
  Department,
  Branch,
  Shift,
  Holiday,
  LeaveBalance,
  LeaveApplication,
  PayrollRecord,
  Notification,
  AuditLog,
  SystemSettings,
  Role,
} from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  // Tab State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Master Data Collections
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveApplications, setLeaveApplications] = useState<LeaveApplication[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Modals
  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const [
        meData,
        empData,
        attData,
        deptData,
        branchData,
        shiftData,
        holData,
        leaveBalData,
        leaveAppData,
        payrollData,
        notifData,
        auditData,
      ] = await Promise.all([
        api.auth.getMe(),
        api.employees.getAll(),
        api.attendance.getAll(),
        api.departments.getAll(),
        api.branches.getAll(),
        api.shifts.getAll(),
        api.holidays.getAll(),
        api.leave.getBalances(),
        api.leave.getApplications(),
        api.payroll.getRecords(),
        api.notifications.getAll(),
        api.auditLogs.getAll(),
      ]);

      setCurrentUser(meData.user);
      setCurrentEmployee(meData.employee);
      setSettings(meData.settings);

      setEmployees(empData);
      setAttendance(attData);
      setDepartments(deptData);
      setBranches(branchData);
      setShifts(shiftData);
      setHolidays(holData);
      setLeaveBalances(leaveBalData);
      setLeaveApplications(leaveAppData);
      setPayrollRecords(payrollData);
      setNotifications(notifData);
      setAuditLogs(auditData);
    } catch (err) {
      console.error('Data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSwitchRole = async (role: Role) => {
    try {
      await api.auth.switchUser(role);
      const meData = await api.auth.getMe();
      setCurrentUser(meData.user);
      setCurrentEmployee(meData.employee);

      // Auto route persona
      if (role === 'employee') {
        setCurrentTab('self-service');
      } else if (currentTab === 'self-service') {
        setCurrentTab('dashboard');
      }
      loadAllData();
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  if (loading || !currentUser || !settings) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500 flex items-center justify-center animate-pulse">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-slate-300">
          Loading ApexHR Enterprise Systems...
        </p>
      </div>
    );
  }

  const activeBranch = branches.find((b) => b.id === currentUser.branchId) || branches[0];
  const pendingApprovalsCount = leaveApplications.filter((l) => l.status.startsWith('pending')).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        onSwitchRole={handleSwitchRole}
        onOpenFaceModal={() => setIsFaceModalOpen(true)}
        onOpenNotifications={() => setIsNotifDrawerOpen(true)}
        activeBranchName={activeBranch?.name || 'Kampala Corporate Headquarters'}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          userRole={currentUser.role}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Dynamic Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-950/90">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                employees={employees}
                attendance={attendance}
                departments={departments}
                branches={branches}
                leaveApplications={leaveApplications}
                onOpenFaceModal={() => setIsFaceModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'self-service' && (
              <EmployeePortal
                currentEmployee={currentEmployee || employees[0]}
                attendance={attendance}
                leaveBalances={leaveBalances}
                leaveApplications={leaveApplications}
                holidays={holidays}
                payroll={payrollRecords}
                onOpenFaceModal={() => setIsFaceModalOpen(true)}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'employees' && (
              <EmployeeList
                employees={employees}
                departments={departments}
                branches={branches}
                attendance={attendance}
                leaveApplications={leaveApplications}
                userRole={currentUser.role}
                onRefresh={loadAllData}
                onNavigateTab={(tab) => setCurrentTab(tab)}
              />
            )}

            {currentTab === 'attendance' && (
              <AttendanceManager
                attendance={attendance}
                employees={employees}
                departments={departments}
                branches={branches}
                userRole={currentUser.role}
                currentEmployee={currentEmployee}
                onOpenFaceModal={() => setIsFaceModalOpen(true)}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'monthly-sheet' && (
              <MonthlyAttendanceSheet departments={departments} branches={branches} />
            )}

            {currentTab === 'biometrics' && (
              <FaceEnrollment employees={employees} onRefresh={loadAllData} />
            )}

            {currentTab === 'leave' && (
              <LeaveManager
                employees={employees}
                userRole={currentUser.role}
                currentEmployee={currentEmployee}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'schedules' && (
              <ScheduleManager
                shifts={shifts}
                holidays={holidays}
                employees={employees}
                departments={departments}
                branches={branches}
              />
            )}

            {currentTab === 'payroll' && (
              <PayrollManager
                employees={employees}
                userRole={currentUser.role}
                currentEmployee={currentEmployee}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'performance' && (
              <PerformanceManager
                employees={employees}
                userRole={currentUser.role}
                currentEmployee={currentEmployee}
                onRefresh={loadAllData}
              />
            )}

            {currentTab === 'reports' && (
              <ReportsCenter
                employees={employees}
                attendance={attendance}
                departments={departments}
                branches={branches}
                leaveApplications={leaveApplications}
                payroll={payrollRecords}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsAndExport settings={settings} onRefresh={loadAllData} />
            )}

            {currentTab === 'audit' && <AuditLogs logs={auditLogs} />}
          </div>
        </main>
      </div>

      {/* Facial Attendance Camera Modal */}
      <FaceAttendanceModal
        isOpen={isFaceModalOpen}
        onClose={() => setIsFaceModalOpen(false)}
        employees={employees}
        currentEmployee={currentEmployee}
        onAttendanceRecorded={loadAllData}
      />

      {/* Notifications Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onRefresh={loadAllData}
        onNavigateTab={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}
