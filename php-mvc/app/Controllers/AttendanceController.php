<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Config\Database;
use App\Services\BiometricVerificationService;
use PDO;

class AttendanceController {
    private PDO $db;
    private BiometricVerificationService $biometricService;

    public function __construct() {
        $this->db = Database::getConnection();
        $this->biometricService = new BiometricVerificationService();
    }

    /**
     * Process Facial Recognition Clock-in / Clock-out
     */
    public function clock(): void {
        header('Content-Type: application/json');
        
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid JSON payload']);
            return;
        }

        $employeeId = $input['employeeId'] ?? null;
        $type = $input['type'] ?? 'clock_in'; // 'clock_in' or 'clock_out'
        $liveVector = $input['vector'] ?? null;
        $livenessScore = (float)($input['livenessScore'] ?? 0.0);
        $method = $input['method'] ?? 'face';
        $location = $input['location'] ?? 'HQ Reception Terminal';

        if (!$employeeId) {
            http_response_code(400);
            echo json_encode(['error' => 'Employee ID is required']);
            return;
        }

        // 1. Fetch Employee and Enrolled Template
        $stmt = $this->db->prepare("
            SELECT e.*, t.template_vector, t.quality_score, t.is_revoked
            FROM employees e
            LEFT JOIN employee_face_templates t ON e.id = t.employee_id
            WHERE e.id = :id AND e.employment_status = 'active'
        ");
        $stmt->execute([':id' => $employeeId]);
        $emp = $stmt->fetch();

        if (!$emp) {
            http_response_code(404);
            echo json_encode(['error' => 'Active employee record not found']);
            return;
        }

        // 2. Biometric Verification if Face Method
        $confidence = 1.0;
        if ($method === 'face') {
            if (empty($emp['template_vector']) || $emp['is_revoked']) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee does not have an active biometric enrollment']);
                return;
            }

            $enrolledVector = json_decode($emp['template_vector'], true);
            $verification = $this->biometricService->verify($liveVector, $enrolledVector, $livenessScore);

            if (!$verification['matched']) {
                http_response_code(401);
                echo json_encode([
                    'error' => 'Biometric authentication failed: ' . $verification['message'],
                    'confidence' => $verification['confidence']
                ]);
                return;
            }
            $confidence = $verification['confidence'] / 100.0;
        }

        // 3. Server-side Timestamp and Date
        $today = date('Y-m-d');
        $currentTime = date('H:i:s');

        // Check existing record for today
        $stmt = $this->db->prepare("SELECT * FROM attendance_records WHERE employee_id = :emp_id AND attendance_date = :att_date");
        $stmt->execute([':emp_id' => $employeeId, ':att_date' => $today]);
        $existing = $stmt->fetch();

        if ($type === 'clock_in') {
            if ($existing && !empty($existing['clock_in_time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Employee already clocked in today at ' . $existing['clock_in_time']]);
                return;
            }

            // Calculate Lateness based on Shift
            $shiftStmt = $this->db->prepare("SELECT * FROM shifts LIMIT 1");
            $shiftStmt->execute();
            $shift = $shiftStmt->fetch();
            $startTime = $shift['start_time'] ?? '08:00:00';
            $grace = (int)($shift['grace_period_minutes'] ?? 15);

            $diffMinutes = (strtotime($currentTime) - strtotime($startTime)) / 60;
            $status = ($diffMinutes > $grace) ? 'late' : 'present';
            $minutesLate = ($diffMinutes > $grace) ? (int)$diffMinutes : 0;

            $recordId = 'att_' . bin2hex(random_bytes(8));
            $insert = $this->db->prepare("
                INSERT INTO attendance_records 
                (id, employee_id, attendance_date, shift_id, clock_in_time, status, minutes_late, clock_in_method, clock_in_location, face_confidence)
                VALUES (:id, :emp_id, :att_date, :shift_id, :in_time, :status, :mins_late, :method, :loc, :conf)
            ");
            $insert->execute([
                ':id' => $recordId,
                ':emp_id' => $employeeId,
                ':att_date' => $today,
                ':shift_id' => $shift['id'] ?? 'shift-1',
                ':in_time' => $currentTime,
                ':status' => $status,
                ':mins_late' => $minutesLate,
                ':method' => $method,
                ':loc' => $location,
                ':conf' => $confidence
            ]);

            echo json_encode([
                'success' => true,
                'message' => "Clock-in successful. Status: {$status}",
                'status' => $status,
                'clock_in_time' => $currentTime,
                'minutes_late' => $minutesLate
            ]);
        } else {
            // Clock-out
            if (!$existing || empty($existing['clock_in_time'])) {
                http_response_code(400);
                echo json_encode(['error' => 'No active clock-in found for today']);
                return;
            }

            $inSec = strtotime($existing['clock_in_time']);
            $outSec = strtotime($currentTime);
            $totalHours = round(max(0, ($outSec - $inSec) / 3600), 2);
            $breakHours = ($totalHours >= 5) ? 1.0 : 0.0;
            $netHours = max(0, $totalHours - $breakHours);
            $overtimeHours = ($netHours > 8.0) ? round($netHours - 8.0, 2) : 0.0;

            $update = $this->db->prepare("
                UPDATE attendance_records
                SET clock_out_time = :out_time,
                    clock_out_method = :method,
                    clock_out_location = :loc,
                    total_hours = :tot,
                    break_hours = :brk,
                    overtime_hours = :ot
                WHERE id = :id
            ");
            $update->execute([
                ':out_time' => $currentTime,
                ':method' => $method,
                ':loc' => $location,
                ':tot' => $totalHours,
                ':brk' => $breakHours,
                ':ot' => $overtimeHours,
                ':id' => $existing['id']
            ]);

            echo json_encode([
                'success' => true,
                'message' => 'Clock-out successful',
                'clock_out_time' => $currentTime,
                'total_hours' => $totalHours,
                'overtime_hours' => $overtimeHours
            ]);
        }
    }
}
