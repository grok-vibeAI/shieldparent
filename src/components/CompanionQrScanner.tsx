import React, { useState, useEffect, useRef } from 'react';
import { ManagedDevice } from '../types';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Smartphone, Info, ChevronRight, Focus, Zap } from 'lucide-react';

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
    payload: "https://shieldparent.vercel.app/enroll?type=device&name=Maya's Galaxy S24&platform=Android&uuid=e2fb-3c1a-8d9e-4a0b&ipAddress=192.168.1.148&blockAdult=true&blockGambling=false&blockSocial=true"
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
    payload: "https://shieldparent.vercel.app/enroll?type=device&name=Caitlin's ChromeBook&platform=ChromeOS&uuid=0b2f-3c3e-1a8d-9e4a&ipAddress=192.168.1.162&blockAdult=false&blockGambling=true&blockSocial=true"
  }
];

export function CompanionQrScanner({ onDeviceEnrolled, onCancel }: CompanionQrScannerProps) {
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [scannedDevice, setScannedDevice] = useState<ManagedDevice | null>(null);
  const [manualPayload, setManualPayload] = useState<string>('');
  const [enrolling, setEnrolling] = useState<boolean>(false);
  const [focusStatus, setFocusStatus] = useState<string>('Auto-focusing...');
  const [detectionQuality, setDetectionQuality] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScanRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const focusIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoTrackRef = useRef<MediaStreamVideoTrack | null>(null);
  const lastDetectionRef = useRef<string>('');
  const detectionDebounceRef = useRef<number>(0);

  const parsePayload = (text: string): ManagedDevice => {
    let parsed: Partial<ManagedDevice> = {};

    if (text.startsWith('guardiannet://') || text.includes('shieldparent.vercel.app')) {
      const url = new URL(text.startsWith('guardiannet://') ? text.replace('guardiannet://', 'http://x/') : text);
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
    const now = Date.now();
    
    // Debounce: Ignore if same code detected within 500ms or different code within 100ms
    if (text === lastDetectionRef.current && now - detectionDebounceRef.current < 500) {
      return;
    }
    if (text !== lastDetectionRef.current && now - detectionDebounceRef.current < 100) {
      return;
    }

    lastDetectionRef.current = text;
    detectionDebounceRef.current = now;

    try {
      const device = parsePayload(text);
      setScannedDevice(device);
      setEnrolling(true);
      stopScanner();
      onDeviceEnrolled(device);
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
    if (focusIntervalRef.current) {
      clearInterval(focusIntervalRef.current);
      focusIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setScannerActive(false);
    setFocusStatus('');
  };

  // ✅ Advanced focus handling
  const applyAdvancedFocus = async (videoTrack: MediaStreamVideoTrack): Promise<void> => {
    try {
      const capabilities = videoTrack.getCapabilities?.() as Record<string, unknown>;
      
      // Try multiple focus modes
      const focusModes = ['continuous', 'manual', 'auto'];
      
      for (const mode of focusModes) {
        try {
          await videoTrack.applyConstraints({
            advanced: [{ focusMode: mode as ConstraintSetType }] as unknown as MediaConstraintSet[]
          });
          setFocusStatus(`✓ Focus: ${mode}`);
          break;
        } catch {
          continue;
        }
      }

      // Set ideal focus distance for QR codes (typically 10-20cm)
      try {
        await videoTrack.applyConstraints({
          advanced: [{ focusDistance: 0.3 }] as unknown as MediaConstraintSet[]
        });
      } catch {
        // Not supported
      }

      // Enable exposure control
      try {
        await videoTrack.applyConstraints({
          advanced: [{ exposureMode: 'continuous' }] as unknown as MediaConstraintSet[]
        });
      } catch {
        // Not supported
      }

      // Zoom for better focus
      try {
        if (capabilities.zoom) {
          await videoTrack.applyConstraints({
            advanced: [{ zoom: 1.5 }] as unknown as MediaConstraintSet[]
          });
        }
      } catch {
        // Not supported
      }
    } catch (err) {
      console.log('Advanced focus not fully supported');
    }
  };

  // ✅ Enhanced image processing for QR detection
  const enhanceImageForQR = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate histogram for better contrast
    let minPixel = 255;
    let maxPixel = 0;

    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      minPixel = Math.min(minPixel, gray);
      maxPixel = Math.max(maxPixel, gray);
    }

    // Adaptive contrast enhancement
    const range = maxPixel - minPixel || 1;
    for (let i = 0; i < data.length; i += 4) {
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      const normalized = ((gray - minPixel) / range) * 255;
      const threshold = normalized > 128 ? 255 : 0;
      
      data[i] = threshold;
      data[i + 1] = threshold;
      data[i + 2] = threshold;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const scanLoop = async (): Promise<void> => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    const now = Date.now();
    const SCAN_INTERVAL = 100; // Optimized: 10 scans per second for smooth, efficient scanning
    if (now - lastScanRef.current < SCAN_INTERVAL) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    lastScanRef.current = now;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(scanLoop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    try {
      if (typeof BarcodeDetector !== 'undefined') {
        const detector = new BarcodeDetector({ formats: ['qr_code'] });

        // Attempt 1: Original frame (full) - fastest and most reliable
        let codes = await detector.detect(canvas);
        if (codes.length > 0) {
          consecutiveFailuresRef.current = 0;
          setDetectionQuality(100);
          handleScanned(codes[0].rawValue);
          return;
        }

        // Attempt 2: Center-focused region (most common case)
        const centerSize = Math.min(canvas.width, canvas.height) * 0.75;
        const startX = (canvas.width - centerSize) / 2;
        const startY = (canvas.height - centerSize) / 2;

        const centerCanvas = document.createElement('canvas');
        centerCanvas.width = centerSize;
        centerCanvas.height = centerSize;
        const centerCtx = centerCanvas.getContext('2d');
        if (centerCtx) {
          centerCtx.drawImage(
            canvas,
            startX, startY, centerSize, centerSize,
            0, 0, centerSize, centerSize
          );
          
          codes = await detector.detect(centerCanvas);
          if (codes.length > 0) {
            consecutiveFailuresRef.current = 0;
            setDetectionQuality(95);
            handleScanned(codes[0].rawValue);
            return;
          }
        }

        // Attempt 3: Enhanced contrast for better visibility
        const enhancedCanvas = document.createElement('canvas');
        enhancedCanvas.width = canvas.width;
        enhancedCanvas.height = canvas.height;
        const enhancedCtx = enhancedCanvas.getContext('2d');
        if (enhancedCtx) {
          enhancedCtx.drawImage(canvas, 0, 0);
          enhanceImageForQR(enhancedCtx, enhancedCanvas);
          
          codes = await detector.detect(enhancedCanvas);
          if (codes.length > 0) {
            consecutiveFailuresRef.current = 0;
            setDetectionQuality(85);
            handleScanned(codes[0].rawValue);
            return;
          }
        }

        // Attempt 4: Small center region (targeted scan)
        const smallSize = Math.min(canvas.width, canvas.height) * 0.5;
        const smallStartX = (canvas.width - smallSize) / 2;
        const smallStartY = (canvas.height - smallSize) / 2;

        const smallCanvas = document.createElement('canvas');
        smallCanvas.width = smallSize;
        smallCanvas.height = smallSize;
        const smallCtx = smallCanvas.getContext('2d');
        if (smallCtx) {
          smallCtx.drawImage(
            canvas,
            smallStartX, smallStartY, smallSize, smallSize,
            0, 0, smallSize, smallSize
          );
          
          codes = await detector.detect(smallCanvas);
          if (codes.length > 0) {
            consecutiveFailuresRef.current = 0;
            setDetectionQuality(90);
            handleScanned(codes[0].rawValue);
            return;
          }
        }

        // Attempt 5: Super contrast enhancement for poor lighting (only if struggling)
        if (consecutiveFailuresRef.current > 15) {
          const superEnhancedCanvas = document.createElement('canvas');
          superEnhancedCanvas.width = canvas.width;
          superEnhancedCanvas.height = canvas.height;
          const superCtx = superEnhancedCanvas.getContext('2d');
          if (superCtx) {
            superCtx.drawImage(canvas, 0, 0);
            const imageData = superCtx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Extreme contrast boost
            for (let i = 0; i < data.length; i += 4) {
              const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
              const extreme = gray > 100 ? 255 : 0;
              data[i] = extreme;
              data[i + 1] = extreme;
              data[i + 2] = extreme;
            }
            superCtx.putImageData(imageData, 0, 0);

            codes = await detector.detect(superEnhancedCanvas);
            if (codes.length > 0) {
              consecutiveFailuresRef.current = 0;
              setDetectionQuality(70);
              handleScanned(codes[0].rawValue);
              return;
            }
          }
        }

        consecutiveFailuresRef.current++;
        // Smooth quality degradation: slower, more natural decline
        setDetectionQuality(Math.max(0, 100 - Math.floor(Math.sqrt(consecutiveFailuresRef.current) * 8)));
      }
    } catch (_err: unknown) {
      consecutiveFailuresRef.current++;
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  const startScanner = async (): Promise<void> => {
    setErrorStatus('');
    setScannedDevice(null);
    setDetectionQuality(0);
    consecutiveFailuresRef.current = 0;
    lastDetectionRef.current = '';
    detectionDebounceRef.current = 0;
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1440, min: 480 },
          // Optimize for QR code scanning
          aspectRatio: { ideal: 4 / 3 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const videoTrack = stream.getVideoTracks()[0] as MediaStreamVideoTrack;
      videoTrackRef.current = videoTrack;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Apply advanced focus settings
      setFocusStatus('Applying focus...');
      await applyAdvancedFocus(videoTrack);

      // Continuous focus re-application every 2 seconds (reduced from 1s to avoid jitter)
      focusIntervalRef.current = setInterval(() => {
        if (videoTrackRef.current && scannerActive) {
          applyAdvancedFocus(videoTrackRef.current).catch(() => {
            // Silently continue
          });
        }
      }, 2000);

      setScannerActive(true);
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission denied.';
      setErrorStatus(`❌ Camera Error: ${msg}`);
      setFocusStatus('');
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
              • Keep QR code in center of screen (8-12cm distance)
              • Ensure good lighting
              • Hold phone steady
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
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">✓ Device Enrolled Successfully!</p>
            <p className="font-black text-slate-900 text-sm mt-1">{scannedDevice.name}</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              {scannedDevice.platform} · {scannedDevice.ipAddress}
            </p>
          </div>
          {enrolling && (
            <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-bold bg-emerald-100 px-4 py-2 rounded-xl">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Enrollment in progress...
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">

          {/* Camera viewport */}
          <div className="relative bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center min-h-[280px]">
            <video
              ref={videoRef}
              className={`w-full max-h-[280px] object-cover ${scannerActive ? 'block' : 'hidden'}`}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {scannerActive && (
              <>
                {/* Focus indicator */}
                <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 text-[9px] font-black text-cyan-400 font-mono px-2 py-1 rounded uppercase flex items-center gap-1.5 z-20">
                  <Focus className="w-3 h-3 animate-pulse" />
                  {focusStatus}
                </div>

                {/* QR Center frame guide */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="w-40 h-40 border-2 border-emerald-400/50 rounded-lg"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-emerald-500/10"></div>
                </div>

                {/* Detection quality indicator */}
                <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700 text-[9px] font-black text-lime-400 font-mono px-2 py-1 rounded uppercase flex items-center gap-1.5 z-20">
                  <Zap className="w-3 h-3" />
                  {detectionQuality}% Ready
                </div>

                {/* Scanning line */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-500 shadow-lg shadow-emerald-500 animate-pulse pointer-events-none" />

                <button
                  onClick={stopScanner}
                  className="absolute bottom-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg cursor-pointer z-20 transition-colors"
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
                  <h6 className="font-extrabold text-xs text-white">📷 Point Camera at QR Code</h6>
                  <p className="text-[10px] text-slate-400 mt-2 font-semibold leading-relaxed">
                    Position QR code in center · 8-12cm distance · Good lighting recommended
                  </p>
                </div>
                <button
                  onClick={() => { void startScanner(); }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-5 py-2.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
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
                JSON / https://
              </span>
            </div>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Paste https://shieldparent.vercel.app/enroll?... or JSON string..."
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

      {/* Footer Tips */}
      <div className="flex items-start gap-2 bg-slate-100 p-3 rounded-2xl text-[10px] border border-slate-200 text-slate-600 font-semibold mt-auto">
        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p><strong>Tips for best results:</strong></p>
          <p className="text-slate-500">• Keep QR code in the center frame · Good lighting is important · Hold steady for 1-2 seconds</p>
        </div>
      </div>
    </div>
  );
}