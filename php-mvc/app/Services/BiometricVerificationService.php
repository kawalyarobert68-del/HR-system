<?php
declare(strict_types=1);

namespace App\Services;

class BiometricVerificationService {
    private const DEFAULT_THRESHOLD = 82.0;

    /**
     * Compute Cosine Similarity between two 128-dimensional vectors
     */
    public function computeSimilarity(array $vecA, array $vecB): float {
        if (count($vecA) !== 128 || count($vecB) !== 128) {
            return 0.0;
        }

        $dotProduct = 0.0;
        for ($i = 0; $i < 128; $i++) {
            $dotProduct += ((float)$vecA[$i] * (float)$vecB[$i]);
        }

        $clamped = max(0.0, min(1.0, $dotProduct));
        return round($clamped * 100.0, 2);
    }

    /**
     * Verify Live Captured Vector against Enrolled Template
     */
    public function verify(?array $liveVector, ?array $enrolledVector, float $livenessScore, float $threshold = self::DEFAULT_THRESHOLD): array {
        if ($livenessScore < 0.4) {
            return [
                'matched' => false,
                'confidence' => 0.0,
                'message' => 'Liveness validation failed: Static image spoofing suspected.'
            ];
        }

        if (empty($liveVector) || empty($enrolledVector)) {
            return [
                'matched' => false,
                'confidence' => 0.0,
                'message' => 'Missing biometric vector descriptors.'
            ];
        }

        $similarity = $this->computeSimilarity($liveVector, $enrolledVector);

        if ($similarity >= $threshold) {
            return [
                'matched' => true,
                'confidence' => $similarity,
                'message' => "Biometric identity verified ({$similarity}% similarity)."
            ];
        }

        return [
            'matched' => false,
            'confidence' => $similarity,
            'message' => "Face score ({$similarity}%) does not meet organizational threshold ({$threshold}%)."
        ];
    }
}
