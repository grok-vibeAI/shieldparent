import React, { useState, useEffect, useRef } from 'react';
import { ManagedDevice } from '../types';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Smartphone, Info, ChevronRight } from 'lucide-react';

interface CompanionQrScannerProps {
  onDeviceEnrolled: (device: ManagedDevice) => void;
  onCancel: () => void;
}

interface BarcodeDetectorResult {
  rawValue: string;
}

declare class BarcodeDetector {
  constructor(options: { formats: string[] });
  detect(image: HTMLCanvasElement): Promise<BarcodeDetectorResult[]>;
}

const COMPANION_MOCK_PAYLOADS = [
  {
    label: "Thomas's iPhone 15 (iOS)",
    payload: JSON.stringify({
      name: "Thomas's iPhone 15",
      platform: "iOS",
      status: "Online",
      screenLocked: false,
      internetBlocked: false,
      blockAdult: true,
      blockGambling: true,
      blockSocial: false,
      ipAddress: "192.168.1.140",
      uuid: "9f3c-8a1d-72fb-4e0a",
      lastSeen: "Just now"
    })
  },
  {
    label: "Maya's Galaxy S24 (Android)",
    payload: "guardiannet://enroll/mobile_client?name=Maya's Galaxy S24&platform=Android&uuid=e2fb-3c1a-8d9e-4a0b&ipAddress=192.168.1.148&blockAdult=true&blockGambling=false&blockSocial=true"
  },
  {
    label: "Lucas's Lenovo Tab (Tablet)",
    payload: JSON.stringify({
      name: "Lucas's Lenovo Tab",
      platform: "Tablet",
      status: "Online",
      screenLocked: false,
      internetBlocked: false,
      blockAdult: true,
      blockGambling: false,
      blockSocial: true,
      ipAddress: "192.168.1.155",
      uuid: "1a8d-9e4a-0b2f-3c3e",
      lastSeen: "Just now"
    })
  },
  {
    label: "Caitlin's ChromeBook (ChromeOS)",
    payload: "guardiannet://enroll/mobile_client?name=Caitlin's ChromeBook&platform=ChromeOS&uuid=0b2f-3c3e-1a8d-9e4a&ipAddress=192.168.1.162&blockAdult=false&blockGambling=true&blockSocial=true"
  }
];

export function CompanionQrScanner({ onDeviceEnrolled, onCancel }: CompanionQrScannerProps) {
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannedDevice, setScannedDevice] = useState<ManagedDevice | null>(null);
  const [manualPayload, setManualPayload] = useState<string>('');
  const [enrolling, setEnrolling] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<number>(0);

  const parsePayload = (text: string): ManagedDevice => {
    let parsed: Partial<ManagedDevice> = {};

    if (text.startsWith('guardiannet://')) {
      const url = new URL(text.replace('guardiannet://', 'http://x/'));
      const p = url.searchParams;
      parsed = {
        name: p.get('name') ?? 'Unknown Device',
        platform: (p.get('platform') as ManagedDevice['platform']) ?? 'Android',
        uuid: p.get('uuid') ?? `uuid-${Date.now()}`,
        ipAddress: p.get('ipAddress') ?? '192.168.1.100',
        blockAdult: p.get('blockAdult') === 'true',
        blockGambling: p.get('blockGambling') === 'true',
        blockSocial: p.get('blockSocial') === 'true',
        status: 'Online',
        screenLocked: false,
        internetBlocked: false,
        lastSeen: 'Just now',
      };
    } else {
      const json = JSON.parse(text) as Record<string, unknown>;
      if (!json.name) throw new Error("Missing 'name' field");
      parsed = {
        name: String(json.name),
        platform: (json.platform as ManagedDevice['platform']) ?? 'Android',
        uuid: json.uuid ? String(json.uuid) : `uuid-${Date.now()}`,
        ipAddress: json.ipAddress ? String(json.ipAddress) : '192.168.1.100',
        blockAdult: json.blockAdult !== false,
        blockGambling: Boolean(json.blockGambling),
        blockSocial: Boolean(json.blockSocial),
        status: (json.status as ManagedDevice['status']) ?? 'Online',
        screenLocked: Boolean(json.screenLocked),
        internetBlocked: Boolean(json.internetBlocked),
        lastSeen: 'Just now',
      };
    }

    return {
      id: `dev_${Date.now()}`,
      name: parsed.name ?? 'Enrolled Device',
      platform: parsed.platform ?? 'Android',
      status: parsed.status ?? 'Online',
      screenLocked: Boolean(parsed.screenLocked),
      internetBlocked: Boolean(parsed.internetBlocked),
      blockAdult: Boolean(parsed.blockAdult),
      blockGambling: Boolean(parsed.blockGambling),
      blockSocial: Boolean(parsed.blockSocial),
      ipAddress: parsed.ipAddress ?? '192.168.1.100',
      uuid: parsed.uuid ?? 'xx-xx-xx',
      lastSeen: 'Just now',
    };
  };

  const handleScanned = (text: string): void => {
    try {
      const device = parsePayload(text);
      setScannedDevice(device);
      setEnrolling(true);
      stopScanner();
      setTimeout(() => {
        onDeviceEnrolled(device);
      }, 1800);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unrecognized format';
      setErrorStatus(`Invalid QR: ${msg}`);
    }
  };

  const stopScanner = (): void => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScannerActive(false);
  };

  const scanLoop = async (): Promise<void> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const now = Date.now();
    if (now - lastScanRef.current < 500) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    lastScanRef.current = now;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      if (typeof BarcodeDetector !== 'undefined') {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        const codes = await detector.detect(canvas);
        if (codes.length > 0) {
          handleScanned(codes[0].rawValue);
          return;
        }
      }
    } catch (_err: unknown) {
      // BarcodeDetector not supported — silently continue
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const startScanner = async (): Promise<void> => {
    setErrorStatus('');
    setScannedDevice(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScannerActive(true);
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Please allow camera permission and try again.';
      setErrorStatus(`Camera access denied: ${msg}`);
    }
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col gap-4 min-h-[350px]">

      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
        <div className="space-y-0.5">
          <h5 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-indigo-600 animate-pulse" />
            QR Device Scanner
          </h5>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Scan QR to auto-enroll child's device instantly
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 text-xs hover:text-slate-700 font-bold cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      {/* Error */}
      {errorStatus && (
        <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex gap-2 text-xs text-red-800 font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
          <div>
            <span>{errorStatus}</span>
            <p className="text-[10px] text-red-500 font-normal mt-1">
              Try starting the camera again, use a demo device below, or paste the payload manually.
            </p>
          </div>
        </div>
      )}

      {/* Success / Auto-enrolling screen */}
      {scannedDevice ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3 text-center flex-1 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">QR Scanned — Enrolling Now!</p>
            <p className="font-black text-slate-900 text-sm mt-1">{scannedDevice.name}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {scannedDevice.platform} · {scannedDevice.ipAddress}
            </p>
          </div>
          {enrolling && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-100 px-4 py-2 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Enrolling device automatically...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">

          {/* Camera viewport */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[220px]">
            <video
              ref={videoRef}
              className={`w-full max-h-[220px] object-cover ${scannerActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {scannerActive && (
              <>
                <div className="absolute top-2 left-2 bg-slate-900/85 border border-slate-800 text-[9px] font-black text-indigo-400 font-mono px-2 py-0.5 rounded uppercase flex items-center gap-1 z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  Scanning for QR...
                </div>
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 shadow-md shadow-red-500 animate-bounce pointer-events-none" />
                <button
                  onClick={stopScanner}
                  className="absolute bottom-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg cursor-pointer z-10 transition-colors"
                >
                  Stop Camera
                </button>
              </>
            )}

            {!scannerActive && (
              <div className="p-6 text-center space-y-4 max-w-xs mx-auto">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h6 className="font-extrabold text-xs text-white">Point camera at QR code</h6>
                  <p className="text-[10px] text-slate-500 mt-1 font-semibold leading-normal">
                    Device enrolls automatically the moment QR is detected — no extra steps.
                  </p>
                </div>
                <button
                  onClick={() => { void startScanner(); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-5 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Start Camera
                </button>
              </div>
            )}
          </div>

          {/* Demo mock devices */}
          <div className="space-y-2 pt-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Demo — Simulate QR Scan (No camera needed)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMPANION_MOCK_PAYLOADS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScanned(item.payload)}
                  className="border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50 text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <p className="text-[8.5px] font-black text-indigo-600 uppercase font-mono tracking-wider mb-0.5">Mock Device {idx + 1}</p>
                    <p className="text-[10.5px] font-bold text-slate-700 truncate max-w-[160px]">{item.label}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                </button>
              ))}
            </div>
          </div>

          {/* Manual paste */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Paste QR payload manually
              </label>
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                JSON / guardiannet://
              </span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Paste guardiannet:// or JSON string..."
                value={manualPayload}
                onChange={e => setManualPayload(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400 placeholder-slate-400"
              />
              <button
                onClick={() => {
                  const txt = manualPayload.trim();
                  if (txt) handleScanned(txt);
                  else setErrorStatus('Please paste a payload string first.');
                }}
                className="bg-indigo-900 border border-indigo-950 hover:bg-slate-800 text-white font-bold text-[10.5px] px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Enroll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-start gap-2 bg-slate-100 p-3 rounded-2xl text-[10px] border border-slate-200 text-slate-600 font-semibold mt-auto">
        <Info className="w-4 h-4 text-indigo-500 shrink-0" />
        <p>Device is enrolled <strong>automatically</strong> the moment the QR code is detected. No confirmation needed.</p>
      </div>
    </div>
  );
}