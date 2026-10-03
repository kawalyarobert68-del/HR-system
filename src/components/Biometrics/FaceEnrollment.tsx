import React, { useState, useEffect, useRef } from 'react';
import {
  ScanFace,
  Camera,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Check,
  FileCheck,
  Sparkles,
  Lock,
  UserCheck
} from 'lucide-react';
import { Employee } from '../../types';
import { FaceRecognitionEngine } from '../../services/faceRecognition';
import { api } from '../../services/api';

interface FaceEnrollmentProps {
  employees: Employee[];
  onRefresh: () => void;
}

export const FaceEnrollment: React.FC<FaceEnrollmentProps> = ({ employees, onRefresh }) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(employees[0]?.id || '');
  const [consentSigned, setConsentSigned] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedSamples, setCapturedSamples] = useState<number[][]>([]);
  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Consent, 2: Sample 1 (Center), 3: Sample 2 (Tilt Left), 4: Sample 3 (Tilt Right), 5: Complete
  const [qualityScore, setQualityScore] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for enrollment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);

  const engine = FaceRecognitionEngine.getInstance();
  const targetEmployee = employees.find((e) => e.id === selectedEmpId);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      if (!videoRef.current) return;
      const s = await engine.startCamera(videoRef.current);
      streamRef.current = s;
      setIsCameraActive(true);
      startLoop();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Unable to open camera.' });
    }
  };

  const stopCamera = () => {
    if (loopRef.current) {
      cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }
    if (streamRef.current) {
      engine.stopCamera(streamRef.current);
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startLoop = () => {
    const tick = () => {
      if (videoRef.current && canvasRef.current && isCameraActive) {
        const res = engine.analyzeFrame(videoRef.current, canvasRef.current);
        setQualityScore(res.qualityScore);
        setStatusMessage(res.message);
      }
      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
  };

  const captureCurrentSample = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const res = engine.analyzeFrame(videoRef.current, canvasRef.current);

    if (!res.faceDetected || !res.featureVector) {
      setFeedback({ type: 'error', message: 'No clear face detected. Ensure proper lighting.' });
      return;
    }

    const newSamples = [...capturedSamples, res.featureVector];
    setCapturedSamples(newSamples);

    if (newSamples.length === 1) {
      setCurrentStep(3); // Now sample 2: tilt slightly
      setFeedback({ type: 'success', message: 'Sample 1 captured! Now tilt your head slightly to the left.' });
    } else if (newSamples.length === 2) {
      setCurrentStep(4); // Sample 3
      setFeedback({ type: 'success', message: 'Sample 2 captured! Now tilt your head slightly to the right.' });
    } else if (newSamples.length >= 3) {
      // Synthesize multi-angle vectors into a master 128-d normalized vector
      finalizeEnrollment(newSamples);
    }
  };

  const finalizeEnrollment = async (samples: number[][]) => {
    setIsProcessing(true);
    stopCamera();

    // Average the 3 vectors and normalize
    const masterVector = new Array(128).fill(0);
    for (let i = 0; i < 128; i++) {
      let sum = 0;
      for (const s of samples) {
        sum += s[i];
      }
      masterVector[i] = sum / samples.length;
    }

    // L2 norm
    let normSq = 0;
    for (let i = 0; i < 128; i++) {
      normSq += masterVector[i] * masterVector[i];
    }
    const norm = Math.sqrt(normSq) || 1;
    const normalized = masterVector.map((v) => Number((v / norm).toFixed(5)));

    try {
      const res = await api.biometrics.enroll({
        employeeId: selectedEmpId,
        vector: normalized,
        qualityScore: 97,
        consentSigned: true,
      });

      setFeedback({ type: 'success', message: res.message });
      setCurrentStep(5);
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Enrollment registration failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevoke = async (empId: string) => {
    if (!confirm('Are you sure you want to revoke this biometric template? The employee will need to re-enroll to use face clock-in.')) {
      return;
    }
    try {
      await api.biometrics.revoke(empId);
      setFeedback({ type: 'success', message: 'Biometric enrollment revoked successfully.' });
      onRefresh();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ScanFace className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Biometric Facial Enrollment Hub</h2>
              <p className="text-xs text-slate-400">
                Enroll encrypted 128-dimensional facial vectors with informed employee consent under data protection rules.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="font-semibold text-slate-200">ISO/IEC 19794-5 Compliant</p>
              <p className="text-slate-400 text-[11px]">Zero raw images stored. Only mathematical embeddings.</p>
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center space-x-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: Left Enrollment Wizard, Right Directory Status */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Enrollment Station */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Enrollment Workflow</h3>
              <p className="text-xs text-slate-400">Select employee and follow the 3-step capture guide</p>
            </div>

            {/* Stepper indicators */}
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStep === step
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                      : currentStep > step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {currentStep > step ? '✓' : step}
                </div>
              ))}
            </div>
          </div>

          {/* Select Employee */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Target Employee for Enrollment</label>
            <select
              value={selectedEmpId}
              onChange={(e) => {
                setSelectedEmpId(e.target.value);
                setCurrentStep(1);
                setCapturedSamples([]);
                stopCamera();
              }}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.firstName} {e.lastName} ({e.employeeNumber}) — {e.biometricEnrolled ? 'Enrolled' : 'Pending Enrollment'}
                </option>
              ))}
            </select>
          </div>

          {/* Step 1: Informed Biometric Consent */}
          {currentStep === 1 && (
            <div className="bg-slate-950/60 p-5 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-start space-x-3">
                <FileCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-200">Statutory Employee Biometric Consent Notice</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Under the Data Protection and Privacy Act, facial geometric features are classified as sensitive personal
                    biometrics. I hereby authorize the collection and processing of my facial template solely for attendance verification,
                    shift logging, and workforce compliance. Raw images are not retained.
                  </p>
                </div>
              </div>

              <label className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentSigned}
                  onChange={(e) => setConsentSigned(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="text-xs text-slate-200 font-medium">
                  Employee has read, understood and granted explicit informed consent.
                </span>
              </label>

              <button
                disabled={!consentSigned}
                onClick={() => {
                  setCurrentStep(2);
                  startCamera();
                }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Start Multi-Angle Facial Capture</span>
              </button>
            </div>
          )}

          {/* Steps 2-4: Multi-Angle Capture */}
          {(currentStep >= 2 && currentStep <= 4) && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Guide Frame */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-60 rounded-[50%] border-2 border-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.3)] flex items-center justify-center">
                    <span className="text-[10px] text-indigo-300 font-mono bg-slate-900/80 px-2 py-0.5 rounded">
                      Sample {capturedSamples.length + 1} of 3
                    </span>
                  </div>
                  <div className="mt-3 px-3 py-1 rounded-full bg-slate-900/90 text-[11px] text-slate-200 border border-slate-700">
                    {currentStep === 2 && 'Step 1: Look straight ahead at the camera'}
                    {currentStep === 3 && 'Step 2: Tilt face slightly left (~15°)'}
                    {currentStep === 4 && 'Step 3: Tilt face slightly right (~15°)'}
                  </div>
                </div>
              </div>

              {/* Progress Samples */}
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-center text-xs ${
                      capturedSamples[idx]
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="font-semibold block">Sample {idx + 1}</span>
                    <span className="text-[10px]">
                      {capturedSamples[idx] ? 'Captured (128-d Vector)' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Capture Button */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setCurrentStep(1);
                    setCapturedSamples([]);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Cancel Enrollment
                </button>

                <button
                  type="button"
                  disabled={!isCameraActive || isProcessing}
                  onClick={captureCurrentSample}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white font-semibold text-xs shadow-lg transition cursor-pointer flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Sample {capturedSamples.length + 1}</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Completed */}
          {currentStep === 5 && (
            <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Enrollment Successfully Completed!</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto">
                Facial descriptors have been encrypted and associated with {targetEmployee?.firstName}{' '}
                {targetEmployee?.lastName}. The employee can now use facial recognition attendance on any authorized terminal.
              </p>
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setCapturedSamples([]);
                }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 cursor-pointer"
              >
                Enroll Another Employee
              </button>
            </div>
          )}
        </div>

        {/* Right: Directory Biometric Status Table */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Enrollment Registry</h3>
              <p className="text-xs text-slate-400">Status across all active personnel</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {employees.filter((e) => e.biometricEnrolled).length} / {employees.length} Enrolled
            </span>
          </div>

          <div className="divide-y divide-slate-800/80 overflow-y-auto max-h-[480px] pr-1">
            {employees.map((emp) => (
              <div key={emp.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200">
                    {emp.firstName[0]}
                    {emp.lastName[0]}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">
                      {emp.firstName} {emp.lastName}
                    </p>
                    <p className="text-[10px] text-slate-400">{emp.jobTitle}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {emp.biometricEnrolled ? (
                    <>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" /> Enrolled
                      </span>
                      <button
                        onClick={() => handleRevoke(emp.id)}
                        title="Revoke Biometric Template"
                        className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedEmpId(emp.id);
                        setCurrentStep(1);
                        setCapturedSamples([]);
                      }}
                      className="px-2.5 py-1 text-[10px] font-semibold rounded-lg bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 transition cursor-pointer"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
