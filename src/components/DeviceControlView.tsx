import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { ManagedDevice } from '../types';
import { 
  Smartphone, Tablet, Laptop, Wifi, WifiOff, Lock, Unlock, ShieldAlert, ShieldCheck, 
  Plus, Trash2, QrCode, ClipboardList, RefreshCw, KeyRound, Check, HelpCircle, BadgeInfo, Settings, X, Copy
} from 'lucide-react';
import { CompanionQrScanner } from './CompanionQrScanner';

interface DeviceControlViewProps {
  devices: ManagedDevice[];
  setDevices: React.Dispatch<React.SetStateAction<ManagedDevice[]>>;
  isLocked: boolean;
  onUnlockRequest: () => void;
  onFilterLogToDevice: (deviceName: string) => void;
}

function QrCanvas({ data }: { data: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: 160,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
    }
  }, [data]);
  return <canvas ref={canvasRef} className="w-full h-full rounded-lg" />;
}

export function DeviceControlView({ 
  devices, 
  setDevices, 
  isLocked, 
  onUnlockRequest,
  onFilterLogToDevice 
}: DeviceControlViewProps) {
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDevicePlatform, setNewDevicePlatform] = useState<ManagedDevice['platform']>('Android');
  const [enrollmentMode, setEnrollmentMode] = useState<'idle' | 'form' | 'scan'>('idle');
  const [enrollSuccessMsg, setEnrollSuccessMsg] = useState('');

  // QR Modal States
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedDeviceForQr, setSelectedDeviceForQr] = useState<string>('global');
  const [copiedText, setCopiedText] = useState(false);

  // Enroll device simulation
  const handleEnrollDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    const name = newDeviceName.trim();
    if (!name) return;

    const newDevice: ManagedDevice = {
      id: `dev_${Date.now()}`,
      name,
      platform: newDevicePlatform,
      status: 'Online',
      screenLocked: false,
      internetBlocked: false,
      blockAdult: true,
      blockGambling: true,
      blockSocial: false,
      ipAddress: `192.168.1.${Math.floor(Math.random() * 150) + 100}`,
      uuid: `${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}-${Math.random().toString(16).substr(2, 4)}`,
      lastSeen: 'Just now'
    };

    setDevices(prev => [...prev, newDevice]);
    setNewDeviceName('');
    setEnrollmentMode('idle');
    setEnrollSuccessMsg(`Device "${name}" has been successfully registered with Secure MDM Profiling!`);
    setTimeout(() => setEnrollSuccessMsg(''), 5000);
  };

  const handleQrDeviceEnrolled = (newDevice: ManagedDevice) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setDevices(prev => [...prev, newDevice]);
    setEnrollmentMode('idle');
    setEnrollSuccessMsg(`Device "${newDevice.name}" has been successfully configured and enrolled via scanned QR!`);
    setTimeout(() => setEnrollSuccessMsg(''), 5000);
  };

  const handleToggleState = (deviceId: string, field: keyof Pick<ManagedDevice, 'screenLocked' | 'internetBlocked' | 'blockAdult' | 'blockGambling' | 'blockSocial'>) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setDevices(prev => 
      prev.map(dev => {
        if (dev.id === deviceId) {
          const updatedValue = !dev[field];
          let updatedStatus = dev.status;

          // Adjust status icon based on blocking state
          if (field === 'internetBlocked') {
            updatedStatus = updatedValue ? 'Restricted' : 'Online';
          }

          return {
            ...dev,
            [field]: updatedValue,
            status: updatedStatus,
            lastSeen: 'Just now'
          };
        }
        return dev;
      })
    );
  };

  const handleDeleteDevice = (deviceId: string, deviceName: string) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setDevices(prev => prev.filter(dev => dev.id !== deviceId));
  };

  return (
    <div className="space-y-6">
      {/* Settings Lock indicator */}
      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-left">
            <h4 className="text-sm font-bold text-amber-900">Device Toggles are Locked</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Modifying settings, blocking internet access, or releasing screen locks on specific child phones requires parent Passcode validation.
            </p>
            <button
              onClick={onUnlockRequest}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline mt-1 block cursor-pointer"
            >
              Unlock Administration Controls
            </button>
          </div>
        </div>
      )}

      {/* Main Informational Header explaining how specific phones get targeted/blocked */}
      <div className="bg-[#4f46e5]/5 border border-[#4f46e5]/10 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-left">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-700">
            <Settings className="w-4.5 h-4.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">How specific phones are blocked</span>
          </div>
          <h3 className="font-extrabold text-slate-900 tracking-tight text-sm">Targeted Client Profile Administration</h3>
          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            By assigning a custom local companion VPN or registering the phone as a Device Owner (MDM), GuardianNet intercepts loops from <strong className="text-slate-900">specific phones and children groups</strong>. Toggle direct settings to block adult sites, lock screens, or stop Internet entirely for that precise device.
          </p>
        </div>
        <button
          onClick={() => {
            if (isLocked) {
              onUnlockRequest();
            } else {
              setIsQrModalOpen(true);
            }
          }}
          className="shrink-0 flex items-center gap-2.5 bg-white hover:bg-indigo-50/25 active:scale-95 border-2 border-indigo-600/30 hover:border-indigo-600 px-4 py-3 rounded-2xl shadow-sm transition-all text-left cursor-pointer group"
        >
          <QrCode className="w-10 h-10 text-indigo-600 group-hover:scale-115 transition-transform" />
          <div>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-tight flex items-center gap-1">
              Parent Enrollment
              <span className="inline-flex w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </p>
            <p className="text-[9px] text-[#4f46e5] font-black uppercase tracking-wider">Local QR Sync Profile</p>
          </div>
        </button>
      </div>

      {enrollSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl text-xs text-emerald-800 font-bold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{enrollSuccessMsg}</span>
        </div>
      )}

      {/* Grid containing Managed Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {devices.map(device => {
          const isPhone = device.platform === 'Android' || device.platform === 'iOS';
          const isTablet = device.platform === 'Tablet';
          const isBlocked = device.internetBlocked;
          const isLockedScreen = device.screenLocked;

          return (
            <div 
              key={device.id} 
              className={`bg-white border text-slate-800 rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                isBlocked
                  ? 'border-red-200 bg-red-50/10'
                  : isLockedScreen
                  ? 'border-amber-200 bg-amber-50/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Device Title Card */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl flex items-center justify-center ${
                      isBlocked ? 'bg-red-50 text-red-600' : isLockedScreen ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isPhone ? <Smartphone className="w-5 h-5" /> : isTablet ? <Tablet className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                    </div>
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{device.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">{device.ipAddress} • {device.platform}</p>
                    </div>
                  </div>

                  {/* Operational Status Dot */}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                    device.status === 'Online' && !isBlocked
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                      : isBlocked
                      ? 'bg-red-100 text-red-700 animate-pulse'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isBlocked ? 'Suspended' : device.status}
                  </span>
                </div>

                {/* Device Information Parameters Bar */}
                <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-left text-[10px] space-y-1 text-slate-500 font-medium">
                  <div className="flex justify-between">
                    <span>Enroll UUID:</span>
                    <span className="font-mono text-slate-700 font-bold">{device.uuid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Companion Client Sync:</span>
                    <span className="text-[#4f46e5] font-black uppercase tracking-wider">Active Loopback</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Polled Ping:</span>
                    <span className="text-slate-800 font-bold">{device.lastSeen}</span>
                  </div>
                </div>

                {/* Direct Command Buttons for the Specific Phone */}
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ACCESS CONTROLS</span>
                  
                  {/* Action 1: Access Control - Suspend Internet Access */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Internet Access</p>
                      <p className="text-[9.5px] text-slate-500 leading-tight">Block or resume web access</p>
                    </div>
                    <button
                      onClick={() => handleToggleState(device.id, 'internetBlocked')}
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        device.internetBlocked
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {device.internetBlocked ? '🚫 BLOCKED' : '🟢 ALLOWED'}
                    </button>
                  </div>

                  {/* Action 2: Shield Overlay - Lock Target Device Screen */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Lock Screen Overlay</p>
                      <p className="text-[9.5px] text-slate-500 leading-tight">Display un-bypassable lock</p>
                    </div>
                    <button
                      onClick={() => handleToggleState(device.id, 'screenLocked')}
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        device.screenLocked
                          ? 'bg-amber-100 border-amber-300 text-amber-700 font-black animate-pulse'
                          : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {device.screenLocked ? '⚡ LOCKED' : '🔓 OPEN'}
                    </button>
                  </div>

                  {/* Action 3: Filtering Adult content specifically for this phone */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div>
                      <p className="font-bold text-xs text-slate-900">Disable Adult Sites</p>
                      <p className="text-[9.5px] text-slate-500 leading-tight">Strict DNS porn filter</p>
                    </div>
                    <button
                      onClick={() => handleToggleState(device.id, 'blockAdult')}
                      className={`px-3 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                        device.blockAdult
                          ? 'bg-indigo-50 border-[#4f46e5]/30 text-[#4f46e5]'
                          : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-500'
                      }`}
                    >
                      {device.blockAdult ? '🛡️ FILTER ON' : '⚠️ OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Card Footer Options */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => onFilterLogToDevice(device.name)}
                  className="text-[10px] font-black text-[#4f46e5] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  View DNS logs
                </button>
                <button
                  onClick={() => handleDeleteDevice(device.id, device.name)}
                  className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Remove Device"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Enroll Device Action triggers */}
        {enrollmentMode === 'idle' && (
          <div className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-3xl flex flex-col justify-between min-h-[350px] shadow-sm text-left">
            <div className="space-y-4 my-auto text-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h5 className="font-extrabold text-sm text-slate-900">Enroll Child's Device</h5>
                <p className="text-xs text-slate-400 leading-relaxed max-w-[190px] mx-auto font-semibold">
                  Select your enrollment pathway to link and manage a companion client.
                </p>
              </div>
              <div className="space-y-2 pt-2 max-w-[200px] mx-auto">
                <button
                  onClick={() => {
                    if (isLocked) {
                      onUnlockRequest();
                    } else {
                      setEnrollmentMode('scan');
                    }
                  }}
                  className="w-full bg-[#4f46e5] hover:bg-indigo-500 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/25 active:scale-95"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Scan Mobile QR Code
                </button>
                <button
                  onClick={() => {
                    if (isLocked) {
                      onUnlockRequest();
                    } else {
                      setEnrollmentMode('form');
                    }
                  }}
                  className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
                  className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                  Manual Form Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {enrollmentMode === 'form' && (
          <div className="bg-white border border-slate-200 p-6 rounded-3xl flex flex-col justify-between min-h-[350px] shadow-sm text-left">
            <form onSubmit={handleEnrollDevice} className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h5 className="font-extrabold text-sm text-slate-900">Profile Device Installer</h5>
                <button 
                  type="button" 
                  onClick={() => setEnrollmentMode('idle')}
                  className="text-slate-400 text-xs hover:text-slate-700 font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone Label / Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Leo's Pixel 7 Phone"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-[#4f46e5]/50 focus:ring-1 focus:ring-indigo-400 rounded-xl px-3 py-2.5 text-xs text-slate-950 outline-none placeholder-slate-400 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Platform Group</label>
                <select
                  value={newDevicePlatform}
                  onChange={(e) => setNewDevicePlatform(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer text-slate-800"
                >
                  <option value="Android">Android Device (VpnService)</option>
                  <option value="iOS">Apple iOS Device (MDM Profiles / Secure DNS)</option>
                  <option value="Tablet">Android Tablet (S8/S9)</option>
                  <option value="ChromeOS">ChromeOS Laptop</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-colors mt-2"
              >
                Sync & Provision Device
              </button>
            </form>

            <span className="text-[9.5px] text-slate-400 block leading-tight font-semibold mt-4">
              Enrollment will generates an encrypted MDM enrollment pairing profile containing target filter rulesets.
            </span>
          </div>
        )}

        {enrollmentMode === 'scan' && (
          <CompanionQrScanner
            onDeviceEnrolled={handleQrDeviceEnrolled}
            onCancel={() => setEnrollmentMode('idle')}
          />
        )}
      </div>

      {/* Technical FAQ explaining how the specific child's phone behaves */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-left space-y-4">
        <h4 className="font-extrabold text-[#4f46e5] text-xs uppercase tracking-wider flex items-center gap-1.5">
          <BadgeInfo className="w-4 h-4 text-indigo-500 shrink-0" />
          Technical Guide: How Device-Specific Blocking and Access Control Operates
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2 text-xs leading-relaxed font-semibold text-slate-600">
            <p className="text-slate-950 font-extrabold flex items-center gap-1.5 text-sm">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">1</span>
              How does the adult content DNS block work?
            </p>
            <p className="pl-6">
              When a child triggers a web request to an inappropriate or adult site on their specific phone, the native Android companion <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono font-black text-[10px]">VpnService</code> (intercepts UDP port 53 queries) or the Supervised <strong className="text-slate-900">iOS Encrypted Secure DNS Profile (DoH/DoT)</strong> automatically intercepts the query. 
            </p>
            <p className="pl-6 text-slate-500 font-medium">
              Instead of resolving the IP, it queries our local threat list. If adult content filters are toggled for that specific target phone, requests resolve directly to a null loopback address (<code className="font-mono text-slate-800 text-[9.5px]">0.0.0.0</code>), preventing browsers from ever serving the content.
            </p>
          </div>

          <div className="space-y-2 text-xs leading-relaxed font-semibold text-slate-600">
            <p className="text-slate-950 font-extrabold flex items-center gap-1.5 text-sm">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">2</span>
              How can a parent block or allow access instantly?
            </p>
            <p className="pl-6">
              Toggling <strong className="text-slate-900">"Internet Access"</strong> sends a silent encrypted broadcast via Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs). 
            </p>
            <p className="pl-6 text-slate-500 font-medium">
              The device client parses the JSON command: Android shuts down outgoing loops on the TUN gateway, while iOS activates global black-hole proxy rule controls defined in the supervised MDM profile payload, suspending all external TCP/UDP connections.
            </p>
          </div>

          <div className="space-y-2 text-xs leading-relaxed font-semibold text-slate-600">
            <p className="text-slate-950 font-extrabold flex items-center gap-1.5 text-sm">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">3</span>
              How does the "Remote Lock" freeze the phone screen?
            </p>
            <p className="pl-6">
              On Android, registration as a Device Admin enables the <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">DevicePolicyManager.lockNow()</code> API. On iOS, the MDM server broadcasts Apple's native <code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono text-[10px]">DeviceLock</code> payload command.
            </p>
            <p className="pl-6 text-slate-500 font-medium">
              Furthermore, a secure iOS profile can activate ASAM (Autonomous Single App Mode) to suspend home screen gestures, lock keys, and present our custom Guardian lock screen overlay until released by the parent master passcode.
            </p>
          </div>

          <div className="space-y-2 text-xs leading-relaxed font-semibold text-slate-600">
            <p className="text-slate-950 font-extrabold flex items-center gap-1.5 text-sm">
              <span className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs">4</span>
              How do I enroll my child's physical phone?
            </p>
            <p className="pl-6">
              Click <strong className="text-slate-900">"Enroll Child's Phone"</strong>, select the platform type (Android or iOS), name it, and click provision. Scan the generated QR enrollment code with the companion mobile client.
            </p>
            <p className="pl-6 text-slate-500 font-medium">
              For Android devices, this activates the Device Owner profile. For iOS, it downloads the secure <code className="font-mono text-slate-800 text-[10px]">.mobileconfig</code> enrollment payload, certifying parental supervision with deep tamper protection preventing child bypasses.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic QR Enrollment Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 text-left">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#4f46e5]/5">
              <div className="space-y-1">
                <h3 className="font-black text-slate-950 flex items-center gap-2.5 text-base">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  GuardianNet MDM Configuration & Pairing Sync
                </h3>
                <p className="text-xs text-slate-500 font-semibold leading-none">
                  Sync a target device configuration instantly via local profile scanning
                </p>
              </div>
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: QR Generator and Dynamic Selector (5 cols) */}
              <div className="md:col-span-5 flex flex-col gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    1. Select Profile Instance
                  </label>
                  <select
                    value={selectedDeviceForQr}
                    onChange={(e) => {
                      setSelectedDeviceForQr(e.target.value);
                      setCopiedText(false);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
                  >
                    <option value="global">Global Shared Guardian Configuration</option>
                    <optgroup label="Dedicated Child Devices">
                      {devices.map(dev => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name} ({dev.platform})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* QR Code Canvas Frame */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 relative overflow-hidden group">
                  <div className="absolute top-1.5 left-1.5 text-[8.5px] font-black text-indigo-500 uppercase tracking-widest font-mono bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.5">
                    {selectedDeviceForQr === 'global' ? 'Global Core' : 'Device Client ID'}
                  </div>

                  {/* QR Image Container */}
                  <div className="w-[180px] h-[180px] bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-center shadow-inner relative">
                    <QrCanvas data={
                      selectedDeviceForQr === 'global'
                        ? `guardiannet://enroll/global?parent=vibeai789%40gmail.com&timestamp=${new Date().toISOString()}&key=8b2a-fd3c`
                        : (() => {
                            const dev = devices.find(d => d.id === selectedDeviceForQr);
                            return `guardiannet://enroll/device?name=${encodeURIComponent(dev?.name || 'Unknown Device')}&platform=${dev?.platform || 'Android'}&uuid=${dev?.uuid || 'unknown'}&ipAddress=${dev?.ipAddress || '192.168.1.100'}&blockAdult=${dev?.blockAdult}&blockGambling=${dev?.blockGambling}&blockSocial=${dev?.blockSocial}&dns=dns.guardiannet.family`;
                          })()
                    } />
                  </div>

                  {/* Status labels */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-wider font-mono bg-white border border-slate-200 px-3 py-1 rounded-full shadow-xs">
                      {selectedDeviceForQr === 'global' 
                        ? 'Master Policy QR' 
                        : `${devices.find(d => d.id === selectedDeviceForQr)?.name}`}
                    </span>
                    <p className="text-[9.5px] text-slate-500 font-bold leading-tight mt-1">
                      Scan with target device camera or companion enrollment utility
                    </p>
                  </div>
                </div>

                {/* Copy parameters configuration fallback */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    2. Manual Setup configuration link
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={
                        selectedDeviceForQr === 'global'
                          ? `guardiannet://enroll/global?parent=vibeai789%40gmail.com&timestamp=2026-06-06`
                          : (() => {
                              const dev = devices.find(d => d.id === selectedDeviceForQr);
                              return `guardiannet://enroll/device?name=${encodeURIComponent(dev?.name || 'Unknown Device')}&platform=${dev?.platform || 'Android'}&uuid=${dev?.uuid || 'unknown'}&ipAddress=${dev?.ipAddress || '192.168.1.100'}&blockAdult=${dev?.blockAdult}&blockGambling=${dev?.blockGambling}&blockSocial=${dev?.blockSocial}&dns=dns.guardiannet.family`;
                            })()
                      }
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10.5px] font-mono text-slate-700 outline-none select-all"
                    />
                    <button
                      onClick={() => {
                        const val = selectedDeviceForQr === 'global'
                          ? `guardiannet://enroll/global?parent=vibeai789%40gmail.com&timestamp=2026-06-06`
                          : (() => {
                              const dev = devices.find(d => d.id === selectedDeviceForQr);
                              return `guardiannet://enroll/device?name=${encodeURIComponent(dev?.name || 'Unknown Device')}&platform=${dev?.platform || 'Android'}&uuid=${dev?.uuid || 'unknown'}&ipAddress=${dev?.ipAddress || '192.168.1.100'}&blockAdult=${dev?.blockAdult}&blockGambling=${dev?.blockGambling}&blockSocial=${dev?.blockSocial}&dns=dns.guardiannet.family`;
                            })();
                        navigator.clipboard.writeText(val);
                        setCopiedText(true);
                        setTimeout(() => setCopiedText(false), 2000);
                      }}
                      className={`px-3 py-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                        copiedText 
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800' 
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-600'
                      }`}
                      title="Copy Connection Payload"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Tailored Sync Checklists (7 cols) */}
              <div className="md:col-span-7 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                
                {selectedDeviceForQr === 'global' ? (
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Settings className="w-4 h-4 text-indigo-600" />
                      Global Master Enrollment Procedure
                    </h4>
                    
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      Scanning the master configuration code triggers automatic parent validation. It authorizes this parent account (<strong className="text-slate-900">vibeai789@gmail.com</strong>) as the secure manager for child profiles synced to this dashboard.
                    </p>

                    <div className="space-y-3.5">
                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">A</div>
                        <div className="text-xs space-y-1">
                          <p className="font-extrabold text-slate-950">Install the Companion Client</p>
                          <p className="text-slate-500 font-semibold leading-relaxed">
                            Download the target GuardianNet companion from the Google Play Store or Apple App Store on your kid's phone.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">B</div>
                        <div className="text-xs space-y-1">
                          <p className="font-extrabold text-slate-950">Initiate Setup</p>
                          <p className="text-slate-500 font-semibold leading-relaxed">
                            Open the app on the kid's phone, select "Sync Parent Configuration", and trigger the physical camera barcode scanner.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 items-start">
                        <div className="w-5 h-5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">C</div>
                        <div className="text-xs space-y-1">
                          <p className="font-extrabold text-slate-950">Authenticate and Authorize VPN/MDM</p>
                          <p className="text-slate-500 font-semibold leading-relaxed">
                            Confirm VPN routing profiles (for Android) or download the Supervised Profiles Certs (for iOS) as shown in the platform specific menus.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-indigo-600" />
                        Platform Sync: {devices.find(d => d.id === selectedDeviceForQr)?.platform} Profile Instructions
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 font-black">
                        UUID: {devices.find(d => d.id === selectedDeviceForQr)?.uuid}
                      </span>
                    </div>

                    {/* Show Android Sync guidelines */}
                    {devices.find(d => d.id === selectedDeviceForQr)?.platform !== 'iOS' ? (
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Follow these precise settings to complete integration on this <strong className="text-slate-950">Android Target</strong> phone/device, allowing strict background rules enforcement.
                        </p>

                        <div className="space-y-3.5">
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-slate-900 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Provision Device Admin Rights via QR</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Aligning with native protocols, scan this code inside the companion client to automatically trigger setting the device owner. This blocks bypass tricks.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-slate-900 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Grant VpnService Permissions</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Confirm the system confirmation modal on the phone asking for permission to capture DNS lookups.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-slate-900 text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Prevent Android App Standby sleeping</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Enter App Info Settings and mark GuardianNet battery parameters to "Unrestricted" so services operate non-stop.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Show iOS / Apple Supervision Sync Guidelines
                      <div className="space-y-4">
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Follow these parameters to configure the <strong className="text-slate-900">Apple iOS Supervision Profile</strong> on your child's iPhone/iPad securely.
                        </p>

                        <div className="space-y-3.5">
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-[#4f46e5] text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Install Apple Certificate Configuration Profile</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                Scanning the QR triggers Safari to download the generated config. Open <code className="bg-slate-100 text-slate-800 px-1 py-0.5 font-mono text-[9px] rounded">Settings &gt; Profile Downloaded</code> and tap Install.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-[#4f46e5] text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Authorize DNS-Over-HTTPS Encrypted Filter</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                The profile maps the unique device UUID directly to this dashboard, automatically routing Safari, Chrome, and application DNS lookups to our blocklist query loop.
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-[#4f46e5] text-white font-extrabold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
                            <div className="text-xs space-y-0.5">
                              <p className="font-extrabold text-slate-950">Activate MDM Non-Removability Lock</p>
                              <p className="text-slate-500 font-semibold leading-relaxed">
                                For complete bypass prevention, link the iOS device payload via an Apple School Manager or Configurator 2 setup to disallow manual profile deletion.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live connection simulator feedback */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between mt-1">
                      <div className="text-xs space-y-0.5 text-left">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">PENDING DEVICE FIRST HANDSHAKE...</span>
                        <p className="text-[10.5px] text-slate-500 font-semibold">Active device pairing queue: listening for pairing signal...</p>
                      </div>
                      <div className="flex items-center justify-center text-[#4f46e5]">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end rounded-b-3xl">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                Close Settings Console
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}