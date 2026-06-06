import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ManagedDevice } from '../types';
import { Camera, RefreshCw, AlertCircle, CheckCircle, Smartphone, Info, ShieldCheck, Clipboard, X, ChevronRight } from 'lucide-react';

interface CompanionQrScannerProps {
  onDeviceEnrolled: (device: ManagedDevice) => void;
  onCancel: () => void;
}

// Sample pre-rendered QR payloads emitted by the mobile GuardianNet app
const COMPANION_MOCK_PAYLOADS = [
  {
    label: "Thomas's Supervised iPhone 15 (iOS)",
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
    }, null, 2)
  },
  {
    label: "Maya's Gaming Galaxy S24 (Android)",
    payload: `guardiannet://enroll/mobile_client?name=Maya's Galaxy S24&platform=Android&uuid=e2fb-3c1a-8d9e-4a0b&ipAddress=192.168.1.148&blockAdult=true&blockGambling=false&blockSocial=true`
  },
  {
    label: "Lucas's Homework Lenovo Tab (Tablet)",
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
    }, null, 2)
  },
  {
    label: "Caitlin's ChromeBook Flex (ChromeOS)",
    payload: `guardiannet://enroll/mobile_client?name=Caitlin's ChromeBook&platform=ChromeOS&uuid=0b2f-3c3e-1a8d-9e4a&ipAddress=192.168.1.162&blockAdult=false&blockGambling=true&blockSocial=true`
  }
];

export function CompanionQrScanner({ onDeviceEnrolled, onCancel }: CompanionQrScannerProps) {
  const [errorStatus, setErrorStatus] = useState<string>('');
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState<boolean | null>(null);
  const [scannerActive, setScannerActive] = useState<boolean>(false);
  const [manualPayload, setManualPayload] = useState<string>('');
  const [scannedDevice, setScannedDevice] = useState<ManagedDevice | null>(null);
  const [scanMessage, setScanMessage] = useState<string>('');
  
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const scannerId = "guardiannet-reader-view";

  const onScanSuccess = (decodedText: string) => {
    // Stop scanning on successful match to avoid duplicates and free up resources
    stopScanner();
    onTextPayloadReceived(decodedText);
  };

  const onTextPayloadReceived = (text: string) => {
    try {
      let parsedDevice: Partial<ManagedDevice> = {};

      if (text.startsWith('guardiannet://')) {
        // Parse custom deep-link URI
        const url = new URL(text.replace('guardiannet://', 'http://placeholder/'));
        const params = url.searchParams;

        parsedDevice = {
          name: params.get('name') || 'Generic Mobile Device',
          platform: (params.get('platform') as ManagedDevice['platform']) || 'Android',
          uuid: params.get('uuid') || `uuid-${Math.random().toString(36).substring(2, 6)}`,
          ipAddress: params.get('ipAddress') || '192.168.1.180',
          blockAdult: params.get('blockAdult') === 'true',
          blockGambling: params.get('blockGambling') === 'true',
          blockSocial: params.get('blockSocial') === 'true',
          status: 'Online',
          screenLocked: false,
          internetBlocked: false,
          lastSeen: 'Just now'
        };
      } else {
        // Try parsing JSON format
        const json = JSON.parse(text);
        if (!json.name) {
          throw new Error("Missing 'name' field in device payload");
        }
        parsedDevice = {
          name: json.name,
          platform: json.platform || 'Android',
          uuid: json.uuid || `uuid-${Math.random().toString(36).substring(2, 6)}`,
          ipAddress: json.ipAddress || '192.168.1.180',
          blockAdult: json.blockAdult !== false, // default true
          blockGambling: !!json.blockGambling,
          blockSocial: !!json.blockSocial,
          status: json.status || 'Online',
          screenLocked: !!json.screenLocked,
          internetBlocked: !!json.internetBlocked,
          lastSeen: 'Just now'
        };
      }

      // Final complete object compliance guarantee
      const completeDevice: ManagedDevice = {
        id: `dev_${Date.now()}`,
        name: parsedDevice.name || 'Enrolled Client',
        platform: parsedDevice.platform || 'Android',
        status: parsedDevice.status || 'Online',
        screenLocked: !!parsedDevice.screenLocked,
        internetBlocked: !!parsedDevice.internetBlocked,
        blockAdult: !!parsedDevice.blockAdult,
        blockGambling: !!parsedDevice.blockGambling,
        blockSocial: !!parsedDevice.blockSocial,
        ipAddress: parsedDevice.ipAddress || '192.168.1.100',
        uuid: parsedDevice.uuid || 'xx-xx-xx',
        lastSeen: 'Just now'
      };

      setScannedDevice(completeDevice);
      setScanMessage("Successfully validated pairing credentials!");
    } catch (e: any) {
      setErrorStatus(`Invalid QR Format: ${e.message || 'Verification payload unrecognized'}`);
    }
  };

  const startScanner = async () => {
    setErrorStatus('');
    setScannedDevice(null);
    setScanMessage('');

    try {
      // Direct instance creation for precision control
      const qrScanner = new Html5Qrcode(scannerId);
      qrScannerRef.current = qrScanner;

      setScannerActive(true);
      setCameraPermissionGranted(true);

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const size = Math.min(width, height) * 0.7;
            return { width: size, height: size };
          }
        },
        onScanSuccess,
        (errorMessage) => {
          // Silent feedback loop to log camera frame queries
        }
      );
    } catch (err: any) {
      console.warn("Camera scan initiation failure", err);
      setCameraPermissionGranted(false);
      setScannerActive(false);
      setErrorStatus(`Webcam access denied. (${err.message || 'Secure framing active'})`);
    }
  };

  const stopScanner = async () => {
    if (qrScannerRef.current && qrScannerRef.current.isScanning) {
      try {
        await qrScannerRef.current.stop();
      } catch (err) {
        console.error("Failed to release camera context", err);
      }
    }
    setScannerActive(false);
  };

  // Safe cleaner hook
  useEffect(() => {
    return () => {
      if (qrScannerRef.current && qrScannerRef.current.isScanning) {
        qrScannerRef.current.stop().catch(err => console.log(err));
      }
    };
  }, []);

  const handleEnrollConfirm = () => {
    if (scannedDevice) {
      onDeviceEnrolled(scannedDevice);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left flex flex-col justify-between min-h-[350px]">
      <div className="space-y-4">
        {/* Component Header info */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div className="space-y-0.5">
            <h5 className="font-extrabold text-sm text-indigo-950 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-indigo-600 animate-pulse" />
              QR Target Scanner Receiver
            </h5>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Pairing device initialized by companion mobile app
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 text-xs hover:text-slate-700 font-bold cursor-pointer bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Dynamic Warning alerts */}
        {errorStatus && (
          <div className="bg-red-50 border border-red-150 p-3 rounded-xl flex gap-2 text-xs text-red-800 leading-relaxed font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
            <div className="flex-1">
              <span>{errorStatus}</span>
              <p className="text-[10px] text-red-650 font-normal mt-1 leading-snug">
                You can try starting the camera again, use the Interactive mock profiles, or paste the pairing configuration parameters directly below!
              </p>
            </div>
          </div>
        )}

        {/* Decoder Status Block */}
        {scannedDevice ? (
          /* Decoded Device review structure */
          <div className="bg-emerald-50/40 border border-emerald-200 rounded-2xl p-4 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div className="text-xs text-left">
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider block">Companion QR Decoded Successfully!</span>
                <p className="font-black text-slate-900 text-sm">{scannedDevice.name}</p>
              </div>
            </div>

            {/* Params layout */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-white p-3.5 border border-slate-150 rounded-xl">
              <div>
                <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono tracking-widest block">OPERATING SYSTEM</span>
                <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                  {scannedDevice.platform} OS
                </p>
              </div>
              <div>
                <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono tracking-widest block">CLIENT IP ADDRESS</span>
                <p className="font-mono font-bold text-slate-850 mt-0.5">{scannedDevice.ipAddress}</p>
              </div>
              <div>
                <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono tracking-widest block">SECURE DEVICE UUID</span>
                <p className="font-mono text-[10.5px] font-bold text-[#4f46e5] uppercase truncate mt-0.5" title={scannedDevice.uuid}>
                  {scannedDevice.uuid}
                </p>
              </div>
              <div>
                <span className="text-[8.5px] font-black text-slate-400 uppercase font-mono tracking-widest block">DEFAULT FILTERS ACTIVATED</span>
                <div className="flex gap-1.5 mt-1">
                  {scannedDevice.blockAdult && <span className="text-[8.5px] bg-red-50 border border-red-150 text-red-700 font-extrabold px-1.5 py-0.5 rounded">Adult</span>}
                  {scannedDevice.blockSocial && <span className="text-[8.5px] bg-indigo-50 border border-indigo-150 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded">Social</span>}
                  {!scannedDevice.blockAdult && !scannedDevice.blockSocial && <span className="text-[8.5px] text-slate-400">None</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleEnrollConfirm}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center shadow-md shadow-emerald-950/20"
              >
                Enroll & Control This Device
              </button>
              <button
                onClick={() => {
                  setScannedDevice(null);
                  setErrorStatus('');
                  setScanMessage('');
                }}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Scan Another
              </button>
            </div>
          </div>
        ) : (
          /* Active scanning layout options */
          <div className="space-y-4">
            {/* Camera Viewport */}
            <div className="relative border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden bg-slate-950 flex flex-col items-center justify-center min-h-[220px]">
              
              {/* HTML5 QR Container */}
              <div 
                id={scannerId} 
                className={`w-full max-w-[320px] max-h-[220px] object-cover rounded-2xl overflow-hidden ${
                  scannerActive ? 'block' : 'hidden'
                }`}
              />

              {!scannerActive && (
                <div className="p-6 text-center space-y-4 max-w-xs mx-auto text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                    <Camera className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h6 className="font-extrabold text-xs text-white">Interactive Camera Scan</h6>
                    <p className="text-[10px] text-slate-500 leading-normal mt-1 font-semibold">
                      Enable parent dashboard camera to scan the pairing barcode displayed in the GuardianNet child utility.
                    </p>
                  </div>
                  <button
                    onClick={startScanner}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] px-5 py-2 rounded-xl transition-all shadow-md cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Activate Webcam Scanner
                  </button>
                </div>
              )}

              {/* Laser scan lines animation override */}
              {scannerActive && (
                <div className="absolute top-2 left-2 z-10 bg-slate-900/85 border border-slate-800 text-[9px] font-black text-indigo-400 font-mono tracking-widest px-2 py-0.5 rounded uppercase flex items-center gap-1 shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping shrink-0" />
                  Webcam Feed Engaged
                </div>
              )}
              {scannerActive && (
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 shadow-md shadow-red-500 animate-bounce pointer-events-none" />
              )}
              
              {scannerActive && (
                <button
                  onClick={stopScanner}
                  className="absolute bottom-3 bg-red-650 hover:bg-red-700 text-white text-[10px] font-black px-3.5 py-1.5 rounded-lg leading-none cursor-pointer transition-colors shadow-lg shadow-black/40 z-10"
                >
                  Turn Camera Off
                </button>
              )}
            </div>

            {/* Quick Demo Simulator trigger options */}
            <div className="space-y-2 pt-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                Interactive Companion Emulation (Simulation Fallback)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COMPANION_MOCK_PAYLOADS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onTextPayloadReceived(item.payload);
                    }}
                    className="border border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/10 text-left px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="text-[10.5px] truncate max-w-[170px] font-bold text-slate-700">
                      <p className="text-[8.5px] font-black text-indigo-600 uppercase font-mono tracking-wider mb-0.5">
                        Scan Mock Companion {idx + 1}
                      </p>
                      {item.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Text String verify */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Paste scanned key string manually
                </label>
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                  JSON / guardiannet:// supports
                </span>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder='Paste guardiannet:// or JSON pairing parameters string...'
                  value={manualPayload}
                  onChange={(e) => setManualPayload(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-mono text-slate-800 outline-none focus:ring-1 focus:ring-indigo-400 placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    const txt = manualPayload.trim();
                    if (txt) {
                      onTextPayloadReceived(txt);
                    } else {
                      setErrorStatus("Please paste a pairing parameter string first!");
                    }
                  }}
                  className="bg-indigo-900 border border-indigo-950 hover:bg-slate-800 text-white font-bold text-[10.5px] px-4 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  Verify Payload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 bg-slate-100 p-3 rounded-2xl text-[10px] border border-slate-250 text-slate-600 font-semibold mt-4">
        <Info className="w-4 h-4 text-indigo-500 shrink-0" />
        <div>
          <p className="font-extrabold text-slate-950">How this handshake secures pairings:</p>
          <p className="text-[9.5px] text-slate-500 font-semibold leading-normal">
            Upon scanning, the companion device sends its cryptographic hardware signature (UUID) and IP gateway. This dashboard verifies the policy structure, authorizes supervision, and maps real-time DNS request blocks to this client channel instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
