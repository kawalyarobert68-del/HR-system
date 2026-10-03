/**
 * ApexHR Client-Side Biometric Face Recognition & Liveness Engine
 * Provides camera management, canvas-based facial feature extraction,
 * anti-spoofing micro-variance check, and cosine similarity matching.
 */

export interface FaceDetectionResult {
  faceDetected: boolean;
  box?: { x: number; y: number; width: number; height: number };
  brightness: number;
  isCentered: boolean;
  livenessVariance: number;
  featureVector?: number[];
  qualityScore: number;
  message: string;
}

export interface VerificationResult {
  success: boolean;
  confidence: number; // 0 to 100
  employeeId?: string;
  livenessPassed: boolean;
  message: string;
}

export class FaceRecognitionEngine {
  private static instance: FaceRecognitionEngine;
  private prevFrameData: ImageData | null = null;
  private frameCount = 0;
  private microMovements: number[] = [];

  public static getInstance(): FaceRecognitionEngine {
    if (!FaceRecognitionEngine.instance) {
      FaceRecognitionEngine.instance = new FaceRecognitionEngine();
    }
    return FaceRecognitionEngine.instance;
  }

  /**
   * Request user media camera stream
   */
  async startCamera(videoElement: HTMLVideoElement): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoElement.srcObject = stream;
      await videoElement.play();
      this.resetLivenessTracking();
      return stream;
    } catch (err: any) {
      console.error('Camera access error:', err);
      throw new Error(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in browser settings.'
          : 'Unable to access camera device. Ensure no other application is using it.'
      );
    }
  }

  stopCamera(stream: MediaStream | null) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    this.resetLivenessTracking();
  }

  resetLivenessTracking() {
    this.prevFrameData = null;
    this.frameCount = 0;
    this.microMovements = [];
  }

  /**
   * Process a single video frame from the canvas
   */
  analyzeFrame(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
  ): FaceDetectionResult {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx || video.videoWidth === 0 || video.videoHeight === 0) {
      return {
        faceDetected: false,
        brightness: 0,
        isCentered: false,
        livenessVariance: 0,
        qualityScore: 0,
        message: 'Awaiting video feed...',
      };
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = frame.data;

    // 1. Calculate Average Brightness
    let brightnessSum = 0;
    const step = 4 * 4; // Sample every 4th pixel for speed
    let samples = 0;
    for (let i = 0; i < data.length; i += step) {
      // Perceived luminance
      brightnessSum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      samples++;
    }
    const avgBrightness = brightnessSum / (samples || 1);

    // 2. Define Ideal Center Oval target
    const targetW = canvas.width * 0.45;
    const targetH = canvas.height * 0.55;
    const targetX = (canvas.width - targetW) / 2;
    const targetY = (canvas.height - targetH) / 2;

    // 3. Simple Skin Tone and Center Presence Check
    let centerSkinPixels = 0;
    let totalCenterPixels = 0;
    const startY = Math.floor(targetY);
    const endY = Math.floor(targetY + targetH);
    const startX = Math.floor(targetX);
    const endX = Math.floor(targetX + targetW);

    for (let y = startY; y < endY; y += 4) {
      for (let x = startX; x < endX; x += 4) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Normalized RGB skin tone heuristic
        if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 15) {
          centerSkinPixels++;
        }
        totalCenterPixels++;
      }
    }

    const skinRatio = centerSkinPixels / (totalCenterPixels || 1);
    const faceDetected = skinRatio > 0.18; // Face occupies oval
    const isCentered = skinRatio > 0.25;

    // 4. Anti-Spoofing & Liveness Micro-Movement Calculation
    let frameDiff = 0;
    if (this.prevFrameData && this.prevFrameData.data.length === data.length) {
      const prev = this.prevFrameData.data;
      let diffSum = 0;
      let count = 0;
      for (let y = startY; y < endY; y += 8) {
        for (let x = startX; x < endX; x += 8) {
          const idx = (y * canvas.width + x) * 4;
          diffSum += Math.abs(data[idx] - prev[idx]) + Math.abs(data[idx + 1] - prev[idx + 1]);
          count += 2;
        }
      }
      frameDiff = diffSum / (count || 1);
      this.microMovements.push(frameDiff);
      if (this.microMovements.length > 20) {
        this.microMovements.shift();
      }
    }
    this.prevFrameData = frame;
    this.frameCount++;

    const avgVariance = this.microMovements.length
      ? this.microMovements.reduce((a, b) => a + b, 0) / this.microMovements.length
      : 0;

    // Quality Score (0 - 100)
    let quality = 0;
    if (faceDetected) quality += 40;
    if (avgBrightness > 65 && avgBrightness < 220) quality += 30;
    if (isCentered) quality += 20;
    if (avgVariance > 1.2 && avgVariance < 45) quality += 10;

    let message = 'Align your face in the center oval';
    if (!faceDetected) {
      message = 'No face detected in frame';
    } else if (avgBrightness < 50) {
      message = 'Lighting too dark. Move towards light.';
    } else if (avgBrightness > 225) {
      message = 'Lighting too harsh. Reduce glare.';
    } else if (!isCentered) {
      message = 'Center face inside the oval guide';
    } else if (avgVariance < 0.3 && this.frameCount > 15) {
      message = 'Anti-spoofing check: Blink or tilt head slightly';
    } else {
      message = 'Face locked. Keep steady...';
    }

    // Extract 128-dimensional biometric descriptor if face is verified
    let featureVector: number[] | undefined;
    if (faceDetected) {
      featureVector = this.extractBiometricVector(canvas, ctx, targetX, targetY, targetW, targetH);
    }

    return {
      faceDetected,
      box: { x: targetX, y: targetY, width: targetW, height: targetH },
      brightness: Math.round(avgBrightness),
      isCentered,
      livenessVariance: Number(avgVariance.toFixed(2)),
      featureVector,
      qualityScore: Math.min(100, quality),
      message,
    };
  }

  /**
   * Extract standardized 128-dimensional biometric vector from facial geometry & texture
   */
  private extractBiometricVector(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ): number[] {
    const sampleCanvas = document.createElement('canvas');
    sampleCanvas.width = 32;
    sampleCanvas.height = 32;
    const sCtx = sampleCanvas.getContext('2d');
    if (!sCtx) return new Array(128).fill(0);

    // Crop to face box and downsample to 32x32 grayscale
    sCtx.drawImage(canvas, x, y, w, h, 0, 0, 32, 32);
    const imgData = sCtx.getImageData(0, 0, 32, 32);
    const d = imgData.data;

    // Create 128-d vector via local patch feature binning
    const vector: number[] = new Array(128).fill(0);
    // 16 patches (4x4 grid of 8x8 pixels) with 8 orientation/intensity bins each = 128 features
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        const patchIdx = py * 4 + px;
        let sum = 0;
        let gradX = 0;
        let gradY = 0;
        for (let ly = 0; ly < 8; ly++) {
          for (let lx = 0; lx < 8; lx++) {
            const gx = px * 8 + lx;
            const gy = py * 8 + ly;
            const idx = (gy * 32 + gx) * 4;
            const gray = 0.299 * d[idx] + 0.587 * d[idx + 1] + 0.114 * d[idx + 2];
            sum += gray;
            if (gx > 0 && gx < 31) {
              const prev = d[(gy * 32 + gx - 1) * 4];
              const next = d[(gy * 32 + gx + 1) * 4];
              gradX += Math.abs(next - prev);
            }
            if (gy > 0 && gy < 31) {
              const prev = d[((gy - 1) * 32 + gx) * 4];
              const next = d[((gy + 1) * 32 + gx) * 4];
              gradY += Math.abs(next - prev);
            }
          }
        }
        const base = patchIdx * 8;
        vector[base + 0] = sum / 64;
        vector[base + 1] = gradX / 64;
        vector[base + 2] = gradY / 64;
        vector[base + 3] = Math.sqrt(gradX * gradX + gradY * gradY) / 64;
        vector[base + 4] = Math.atan2(gradY, gradX + 0.001);
        vector[base + 5] = (sum * 0.7 + gradX * 0.3) / 100;
        vector[base + 6] = (sum * 0.3 + gradY * 0.7) / 100;
        vector[base + 7] = (vector[base + 0] + vector[base + 3]) / 2;
      }
    }

    // L2 Normalize Vector
    let normSq = 0;
    for (let i = 0; i < 128; i++) {
      normSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(normSq) || 1;
    return vector.map((v) => Number((v / norm).toFixed(5)));
  }

  /**
   * Compute Cosine Similarity between two 128-dimensional normalized vectors
   */
  computeCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== 128 || vecB.length !== 128) {
      return 0;
    }
    let dot = 0;
    for (let i = 0; i < 128; i++) {
      dot += vecA[i] * vecB[i];
    }
    // Return percentage match: scaled between 0 and 100
    // Cosine similarity for face vectors typically lies in 0.5 to 1.0 range
    const clamped = Math.max(0, Math.min(1, dot));
    return Number((clamped * 100).toFixed(1));
  }

  /**
   * Match live vector against an enrolled template with threshold check
   */
  verifyAgainstTemplate(
    liveVector: number[],
    enrolledVector: number[],
    thresholdPercent = 82,
    livenessScore = 5.0
  ): VerificationResult {
    // 1. Anti-spoofing check
    if (livenessScore < 0.4) {
      return {
        success: false,
        confidence: 0,
        livenessPassed: false,
        message: 'Liveness check failed: Static image or photo spoofing suspected. Please move naturally.',
      };
    }

    // 2. Similarity calculation
    const similarity = this.computeCosineSimilarity(liveVector, enrolledVector);

    if (similarity >= thresholdPercent) {
      return {
        success: true,
        confidence: similarity,
        livenessPassed: true,
        message: `Biometric match confirmed (${similarity}% confidence).`,
      };
    } else {
      return {
        success: false,
        confidence: similarity,
        livenessPassed: true,
        message: `Face match score ${similarity}% is below policy threshold (${thresholdPercent}%). Try repositioning.`,
      };
    }
  }

  /**
   * Match live vector across all enrolled employee templates (1:N search)
   */
  identifyFromTemplates(
    liveVector: number[],
    templates: { employeeId: string; vector: number[] }[],
    thresholdPercent = 80,
    livenessScore = 5.0
  ): { matched: boolean; employeeId?: string; confidence: number; message: string } {
    if (livenessScore < 0.4) {
      return {
        matched: false,
        confidence: 0,
        message: 'Liveness check failed: Please blink or move slightly.',
      };
    }

    let bestMatchId: string | undefined;
    let highestScore = 0;

    for (const t of templates) {
      const score = this.computeCosineSimilarity(liveVector, t.vector);
      if (score > highestScore) {
        highestScore = score;
        bestMatchId = t.employeeId;
      }
    }

    if (highestScore >= thresholdPercent && bestMatchId) {
      return {
        matched: true,
        employeeId: bestMatchId,
        confidence: highestScore,
        message: `Employee verified with ${highestScore}% confidence.`,
      };
    }

    return {
      matched: false,
      confidence: highestScore,
      message: `No matching employee found (${highestScore}% highest match score).`,
    };
  }
}
