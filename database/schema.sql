-- =====================================================================
-- APEX HR & FACIAL RECOGNITION ATTENDANCE MANAGEMENT SYSTEM
-- Relational Database Schema (MySQL 8.0+ / MariaDB 10.5+)
-- Engine: InnoDB | Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP SCHEMA IF EXISTS apex_hr_db;
CREATE SCHEMA apex_hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apex_hr_db;

-- ---------------------------------------------------------------------
-- 1. System Roles & Access Control
-- ---------------------------------------------------------------------
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE permissions (
    id VARCHAR(36) PRIMARY KEY,
    module VARCHAR(50) NOT NULL,
    permission_code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE role_permissions (
    role_id VARCHAR(36) NOT NULL,
    permission_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. Organization Structure: Branches & Departments
-- ---------------------------------------------------------------------
CREATE TABLE branches (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Uganda',
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geofence_radius_meters INT DEFAULT 300,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE departments (
    id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) NOT NULL,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    manager_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_branch_dept_code (branch_id, code)
) ENGINE=InnoDB;

CREATE TABLE designations (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    level VARCHAR(50) DEFAULT 'Mid-Level',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. Employees Master Table
-- ---------------------------------------------------------------------
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    employee_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    gender ENUM('male', 'female', 'other') NOT NULL,
    date_of_birth DATE NOT NULL,
    nationality VARCHAR(80) NOT NULL DEFAULT 'Ugandan',
    national_id VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    work_email VARCHAR(150) NOT NULL UNIQUE,
    residential_address TEXT,
    emergency_contact_name VARCHAR(150),
    emergency_contact_relationship VARCHAR(50),
    emergency_contact_phone VARCHAR(30),
    hire_date DATE NOT NULL,
    contract_type ENUM('permanent', 'contract', 'probation', 'intern') DEFAULT 'permanent',
    job_title VARCHAR(150) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    supervisor_id VARCHAR(36) NULL,
    employment_status ENUM('active', 'on_leave', 'probation', 'suspended', 'terminated') DEFAULT 'active',
    base_salary DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    allowances DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    profile_photo_url VARCHAR(500) NULL,
    biometric_enrolled BOOLEAN DEFAULT FALSE,
    biometric_enrolled_at TIMESTAMP NULL,
    biometric_consent_given BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL,
    INDEX idx_emp_number (employee_number),
    INDEX idx_emp_dept (department_id),
    INDEX idx_emp_branch (branch_id),
    INDEX idx_emp_status (employment_status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. Users Table (Authentication linked to Employees)
-- ---------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NULL,
    role_id VARCHAR(36) NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_users_email (email)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. Biometric Face Templates
-- ---------------------------------------------------------------------
CREATE TABLE employee_face_templates (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL UNIQUE,
    template_vector JSON NOT NULL COMMENT '128-dimensional L2 normalized facial embedding array',
    quality_score DECIMAL(5, 2) NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    consent_signed BOOLEAN NOT NULL DEFAULT TRUE,
    biometric_hash VARCHAR(64) NOT NULL COMMENT 'SHA256 signature for template integrity',
    enrolled_by_user_id VARCHAR(36) NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    revoked_at TIMESTAMP NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (enrolled_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_face_emp (employee_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. Shifts & Work Schedules
-- ---------------------------------------------------------------------
CREATE TABLE shifts (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_minutes INT DEFAULT 60,
    grace_period_minutes INT DEFAULT 15,
    is_overnight BOOLEAN DEFAULT FALSE,
    work_days_mask VARCHAR(20) DEFAULT '1,2,3,4,5' COMMENT '1=Mon .. 7=Sun',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employee_shifts (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    shift_id VARCHAR(36) NOT NULL,
    effective_from DATE NOT NULL,
    effective_to DATE NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
    INDEX idx_emp_shift (employee_id, shift_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. Holidays Master
-- ---------------------------------------------------------------------
CREATE TABLE holidays (
    id VARCHAR(36) PRIMARY KEY,
    branch_id VARCHAR(36) NULL,
    name VARCHAR(150) NOT NULL,
    holiday_date DATE NOT NULL,
    is_recurring BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    INDEX idx_holiday_date (holiday_date)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 8. Daily Attendance Records & Raw Clock Events
-- ---------------------------------------------------------------------
CREATE TABLE attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    shift_id VARCHAR(36) NOT NULL,
    clock_in_time TIME NULL,
    clock_out_time TIME NULL,
    total_hours DECIMAL(5, 2) DEFAULT 0.00,
    break_hours DECIMAL(4, 2) DEFAULT 0.00,
    overtime_hours DECIMAL(4, 2) DEFAULT 0.00,
    status ENUM('present', 'late', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend', 'incomplete', 'excused') NOT NULL,
    minutes_late INT DEFAULT 0,
    early_departure_minutes INT DEFAULT 0,
    clock_in_method ENUM('face', 'manual', 'badge') DEFAULT 'face',
    clock_out_method ENUM('face', 'manual', 'badge') NULL,
    clock_in_location VARCHAR(200) NULL,
    clock_out_location VARCHAR(200) NULL,
    face_confidence DECIMAL(5, 4) NULL,
    verified_by_user_id VARCHAR(36) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(id) ON DELETE RESTRICT,
    FOREIGN KEY (verified_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_emp_attendance_date (employee_id, attendance_date),
    INDEX idx_att_date (attendance_date),
    INDEX idx_att_status (status),
    INDEX idx_att_emp_date (employee_id, attendance_date)
) ENGINE=InnoDB;

CREATE TABLE attendance_events (
    id VARCHAR(36) PRIMARY KEY,
    attendance_record_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    event_type ENUM('clock_in', 'clock_out') NOT NULL,
    event_timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    verification_method ENUM('face', 'manual', 'badge') NOT NULL,
    location_label VARCHAR(200),
    device_info VARCHAR(255),
    face_confidence DECIMAL(5, 4),
    liveness_score DECIMAL(5, 2),
    supervisor_override_reason TEXT,
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_event_time (event_timestamp)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. Attendance Corrections & Exceptions
-- ---------------------------------------------------------------------
CREATE TABLE attendance_corrections (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    attendance_record_id VARCHAR(36) NULL,
    attendance_date DATE NOT NULL,
    requested_clock_in TIME NULL,
    requested_clock_out TIME NULL,
    requested_status VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    supporting_doc_url VARCHAR(500) NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approver_id VARCHAR(36) NULL,
    approver_comment TEXT,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_record_id) REFERENCES attendance_records(id) ON DELETE SET NULL,
    FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_corr_status (status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. Leave Management
-- ---------------------------------------------------------------------
CREATE TABLE leave_types (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    default_days_per_year INT NOT NULL DEFAULT 21,
    is_paid BOOLEAN DEFAULT TRUE,
    requires_attachment BOOLEAN DEFAULT FALSE,
    carry_forward_max INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE leave_balances (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    leave_type_id VARCHAR(36) NOT NULL,
    entitled_days DECIMAL(5, 1) NOT NULL,
    accrued_days DECIMAL(5, 1) NOT NULL,
    taken_days DECIMAL(5, 1) DEFAULT 0.0,
    pending_days DECIMAL(5, 1) DEFAULT 0.0,
    remaining_days DECIMAL(5, 1) NOT NULL,
    carried_forward_days DECIMAL(5, 1) DEFAULT 0.0,
    period_year INT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_emp_leave_year (employee_id, leave_type_id, period_year)
) ENGINE=InnoDB;

CREATE TABLE leave_applications (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    leave_type_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count INT NOT NULL,
    reason TEXT NOT NULL,
    attachment_url VARCHAR(500) NULL,
    status ENUM('pending_supervisor', 'pending_hr', 'approved', 'rejected', 'cancelled') DEFAULT 'pending_supervisor',
    supervisor_id VARCHAR(36) NULL,
    supervisor_comment TEXT,
    supervisor_approved_at TIMESTAMP NULL,
    hr_approver_id VARCHAR(36) NULL,
    hr_comment TEXT,
    hr_approved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE RESTRICT,
    FOREIGN KEY (supervisor_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (hr_approver_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_leave_status (status),
    INDEX idx_leave_emp (employee_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 11. Overtime & Payroll Records
-- ---------------------------------------------------------------------
CREATE TABLE payroll_periods (
    id VARCHAR(36) PRIMARY KEY,
    period_name VARCHAR(100) NOT NULL,
    period_month INT NOT NULL,
    period_year INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    processed_by VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_payroll_period (period_year, period_month)
) ENGINE=InnoDB;

CREATE TABLE payroll_records (
    id VARCHAR(36) PRIMARY KEY,
    payroll_period_id VARCHAR(36) NOT NULL,
    employee_id VARCHAR(36) NOT NULL,
    payslip_number VARCHAR(50) NOT NULL UNIQUE,
    base_salary DECIMAL(14, 2) NOT NULL,
    allowances DECIMAL(14, 2) DEFAULT 0.00,
    overtime_hours DECIMAL(5, 2) DEFAULT 0.00,
    overtime_pay DECIMAL(14, 2) DEFAULT 0.00,
    late_deductions DECIMAL(14, 2) DEFAULT 0.00,
    absentee_deductions DECIMAL(14, 2) DEFAULT 0.00,
    gross_pay DECIMAL(14, 2) NOT NULL,
    paye_tax DECIMAL(14, 2) NOT NULL COMMENT 'Uganda PAYE or standard progressive tax',
    nssf_employee DECIMAL(14, 2) NOT NULL COMMENT '5% mandatory NSSF employee deduction in Uganda',
    nssf_employer DECIMAL(14, 2) NOT NULL COMMENT '10% mandatory NSSF employer contribution in Uganda',
    other_deductions DECIMAL(14, 2) DEFAULT 0.00,
    net_salary DECIMAL(14, 2) NOT NULL,
    status ENUM('draft', 'approved', 'paid') DEFAULT 'draft',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (payroll_period_id) REFERENCES payroll_periods(id) ON DELETE RESTRICT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT,
    INDEX idx_payroll_emp (employee_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. Employee Performance & Reviews
-- ---------------------------------------------------------------------
CREATE TABLE performance_reviews (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    reviewer_id VARCHAR(36) NOT NULL,
    period_label VARCHAR(50) NOT NULL,
    overall_score DECIMAL(3, 2) NOT NULL,
    supervisor_feedback TEXT,
    employee_comments TEXT,
    status ENUM('draft', 'submitted', 'acknowledged') DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE performance_kpis (
    id VARCHAR(36) PRIMARY KEY,
    review_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    target_metric VARCHAR(255) NOT NULL,
    achieved_metric VARCHAR(255) NOT NULL,
    score DECIMAL(3, 2) NOT NULL,
    FOREIGN KEY (review_id) REFERENCES performance_reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. System Notifications & Security Audit Logs
-- ---------------------------------------------------------------------
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    employee_id VARCHAR(36) NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('attendance', 'leave', 'payroll', 'system', 'security') DEFAULT 'system',
    is_read BOOLEAN DEFAULT FALSE,
    link_tab VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    user_name VARCHAR(150) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. System Configuration & Policy Settings
-- ---------------------------------------------------------------------
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    setting_type VARCHAR(30) DEFAULT 'string',
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insert Default Settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('company_name', 'Apex Enterprise Solutions Ltd', 'string', 'Organization Legal Trading Name'),
('company_code', 'APEX-UG', 'string', 'Corporate Identifier'),
('timezone', 'Africa/Kampala', 'string', 'System operational timezone'),
('default_grace_period_minutes', '15', 'integer', 'Late threshold grace period in minutes'),
('facial_match_threshold', '82', 'integer', 'Minimum similarity percentage for biometric verification'),
('liveness_strictness', 'medium', 'string', 'Anti-spoofing challenge strictness'),
('enable_geofencing', '1', 'boolean', 'Enforce branch GPS boundaries for mobile/terminal clock-in'),
('allowed_radius_meters', '300', 'integer', 'Allowed radius around branch GPS coordinate'),
('enable_uganda_payroll_rules', '1', 'boolean', 'Apply Uganda URA PAYE progressive rates & NSSF 5%/10%'),
('currency_symbol', 'UGX', 'string', 'Display currency symbol');

SET FOREIGN_KEY_CHECKS = 1;
-- =====================================================================
-- END OF SCHEMA
-- =====================================================================
