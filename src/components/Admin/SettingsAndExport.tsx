import React, { useState, useEffect } from 'react';
import {
  Settings,
  Database,
  Download,
  Copy,
  Check,
  Code2,
  Server,
  ShieldCheck,
  Save,
  Building2,
  Sliders,
  MapPin
} from 'lucide-react';
import { SystemSettings } from '../../types';
import { api } from '../../services/api';

interface SettingsAndExportProps {
  settings: SystemSettings;
  onRefresh: () => void;
}

export const SettingsAndExport: React.FC<SettingsAndExportProps> = ({ settings, onRefresh }) => {
  const [activeSubTab, setActiveSubTab] = useState<'policy' | 'mysql' | 'php_mvc' | 'deploy'>('policy');
  const [formSettings, setFormSettings] = useState<SystemSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.settings.update(formSettings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const sampleSqlSnippet = `-- =====================================================================
-- APEX HR & FACIAL RECOGNITION ATTENDANCE MANAGEMENT SYSTEM
-- Relational Database Schema (MySQL 8.0+ / MariaDB 10.5+)
-- =====================================================================
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    employee_number VARCHAR(30) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    department_id VARCHAR(36) NOT NULL,
    branch_id VARCHAR(36) NOT NULL,
    base_salary DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    biometric_enrolled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE employee_face_templates (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL UNIQUE,
    template_vector JSON NOT NULL COMMENT '128-d L2 normalized facial embedding array',
    quality_score DECIMAL(5, 2) NOT NULL,
    biometric_hash VARCHAR(64) NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE attendance_records (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL,
    attendance_date DATE NOT NULL,
    clock_in_time TIME NULL,
    clock_out_time TIME NULL,
    total_hours DECIMAL(5, 2) DEFAULT 0.00,
    status ENUM('present', 'late', 'absent', 'on_leave') NOT NULL,
    minutes_late INT DEFAULT 0,
    clock_in_method ENUM('face', 'manual', 'badge') DEFAULT 'face',
    face_confidence DECIMAL(5, 4) NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE KEY uq_emp_date (employee_id, attendance_date)
) ENGINE=InnoDB;`;

  const samplePhpControllerSnippet = `<?php
declare(strict_types=1);

namespace App\\Controllers;

use App\\Config\\Database;
use App\\Services\\BiometricVerificationService;

class AttendanceController {
    /**
     * Process Facial Recognition Clock-in / Clock-out
     */
    public function clock(): void {
        header('Content-Type: application/json');
        $input = json_decode(file_get_contents('php://input'), true);
        
        $employeeId = $input['employeeId'] ?? null;
        $liveVector = $input['vector'] ?? null;
        $livenessScore = (float)($input['livenessScore'] ?? 0.0);

        // Verification service checks anti-spoofing and cosine similarity >= 82%
        $service = new BiometricVerificationService();
        $res = $service->verify($liveVector, $enrolledVector, $livenessScore);
        
        if (!$res['matched']) {
            http_response_code(401);
            echo json_encode(['error' => 'Biometric verification failed']);
            return;
        }

        // Automatic late detection based on official shift + grace period
        $timeStr = date('H:i:s');
        $status = ($timeStr > '08:15:00') ? 'late' : 'present';
        // Persist to MySQL via Prepared PDO Statement...
    }
}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSchemaFile = () => {
    window.open('/api/export/schema.sql', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header and Sub Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Architecture Deliverables</h2>
          <p className="text-xs text-slate-400">
            Configure biometric thresholds, company policies, and export MySQL schemas & PHP MVC project files.
          </p>
        </div>

        <div className="flex p-1 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('policy')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'policy' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Policy & Biometric Tuning
          </button>
          <button
            onClick={() => setActiveSubTab('mysql')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'mysql' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            MySQL 8.0 Schema DDL
          </button>
          <button
            onClick={() => setActiveSubTab('php_mvc')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'php_mvc' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            PHP 8.2 MVC Architecture
          </button>
          <button
            onClick={() => setActiveSubTab('deploy')}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'deploy' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Production Deployment Guide
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs flex items-center space-x-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>System configuration parameters saved and applied successfully across all terminals.</span>
        </div>
      )}

      {/* SubTab 1: Policy & Biometrics Configuration Form */}
      {activeSubTab === 'policy' && (
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organization Identity */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Organization Profile & Identity
              </h3>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Company Trading Name</label>
                <input
                  type="text"
                  value={formSettings.companyName}
                  onChange={(e) => setFormSettings({ ...formSettings, companyName: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Company Code</label>
                <input
                  type="text"
                  value={formSettings.companyCode}
                  onChange={(e) => setFormSettings({ ...formSettings, companyCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Operational Timezone</label>
                <input
                  type="text"
                  value={formSettings.timezone}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-slate-400"
                />
              </div>
            </div>

            {/* Biometric Algorithm Tuning */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Facial Biometric & Liveness Parameters
              </h3>

              <div>
                <div className="flex justify-between mb-1">
                  <label className="font-semibold text-slate-300">Facial Match Threshold (Cosine Similarity)</label>
                  <span className="font-bold text-cyan-400">{formSettings.facialMatchThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="70"
                  max="95"
                  value={formSettings.facialMatchThreshold}
                  onChange={(e) => setFormSettings({ ...formSettings, facialMatchThreshold: Number(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Recommended: 80% - 85% for balanced false rejection vs false acceptance rate.
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Liveness Strictness</label>
                <select
                  value={formSettings.livenessStrictness}
                  onChange={(e) => setFormSettings({ ...formSettings, livenessStrictness: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="low">Low (Standard movement variance)</option>
                  <option value="medium">Medium (Requires micro-motion & eye blink)</option>
                  <option value="high">High (Strict head tilt + dynamic temporal variance)</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Default Morning Late Grace Period (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={formSettings.defaultGracePeriodMinutes}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, defaultGracePeriodMinutes: Number(e.target.value) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Statutory Options */}
          <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.enableUgandaPayrollRules}
                onChange={(e) => setFormSettings({ ...formSettings, enableUgandaPayrollRules: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 border-slate-700 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Enforce Uganda URA PAYE & NSSF Rules</span>
                <span className="text-[10px] text-slate-400">
                  Applies statutory progressive brackets (0% - 40%) and 5% employee / 10% employer NSSF.
                </span>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formSettings.enableGeofencing}
                onChange={(e) => setFormSettings({ ...formSettings, enableGeofencing: e.target.checked })}
                className="w-4 h-4 rounded text-indigo-600 border-slate-700 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-200 block">Enforce GPS Geofence Check on Mobile</span>
                <span className="text-[10px] text-slate-400">
                  Restricts employee clock-in within 300 meters of assigned branch office coordinate.
                </span>
              </div>
            </label>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Policy...' : 'Save Configuration Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* SubTab 2: MySQL 8.0 Database Schema DDL */}
      {activeSubTab === 'mysql' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> MySQL 8.0+ Production Schema (schema.sql)
              </h3>
              <p className="text-xs text-slate-400">
                Complete relational DDL with InnoDB engines, foreign keys, triggers, and indices for 20+ tables.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(sampleSqlSnippet)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy DDL'}</span>
              </button>
              <button
                onClick={handleDownloadSchemaFile}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download schema.sql</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto max-h-[420px] leading-relaxed">
            {sampleSqlSnippet}
          </pre>
        </div>
      )}

      {/* SubTab 3: PHP 8.2 MVC Architecture */}
      {activeSubTab === 'php_mvc' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-indigo-400" /> PHP 8.2 MVC Architecture Source
              </h3>
              <p className="text-xs text-slate-400">
                Clean MVC pattern: Controllers, Services, Models, and PDO connection pooling for Apache/Nginx.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(samplePhpControllerSnippet)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto max-h-[420px] leading-relaxed">
            {samplePhpControllerSnippet}
          </pre>
        </div>
      )}

      {/* SubTab 4: Production Deployment Guide */}
      {activeSubTab === 'deploy' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
          <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-amber-400" /> Standard Production Deployment Instructions
          </h3>

          <div className="space-y-3 text-slate-300 leading-relaxed">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Step 1: Database Provisioning</h4>
              <p className="text-slate-400">
                Create a MySQL 8.0+ database with UTF8MB4 charset, then run the bundled schema:
              </p>
              <code className="block bg-slate-900 p-2.5 rounded-lg font-mono text-cyan-300 text-[11px]">
                mysql -u root -p -e "CREATE DATABASE apex_hr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"<br />
                mysql -u root -p apex_hr_db &lt; database/schema.sql
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Step 2: Environment Variables (.env)</h4>
              <p className="text-slate-400">
                Configure your database credentials and encryption keys in <code className="text-indigo-300 font-mono">.env</code>:
              </p>
              <code className="block bg-slate-900 p-2.5 rounded-lg font-mono text-cyan-300 text-[11px]">
                DB_HOST=127.0.0.1<br />
                DB_PORT=3306<br />
                DB_NAME=apex_hr_db<br />
                DB_USER=apex_user<br />
                DB_PASS=secure_strong_password<br />
                APP_ENV=production
              </code>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider">Step 3: Web Server & HTTPS Camera Access</h4>
              <p className="text-slate-400">
                HTML5 UserMedia camera streaming requires HTTPS (SSL/TLS). Point your web server root to <code className="text-indigo-300 font-mono">public/</code> and enable Let's Encrypt SSL certificate.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
