import { useState, useEffect } from 'react';
import { 
  ShieldAlert, Shield, ToggleLeft, ToggleRight, Laptop, Activity, Lock, Unlock, AlertTriangle, 
  Smartphone, Bell, Award, User, RefreshCw, KeyRound, Wifi, Ban, Check, ExternalLink, Settings, ShieldCheck, Menu, Trash2, Plus, Info, CheckCircle2, ChevronRight
} from 'lucide-react';
import { ConnectionLog, FilterConfig, AlertLog, ManagedDevice } from './types';
import { INITIAL_FILTER_CONFIG, SAMPLE_CONNECTIONS, SAMPLE_ALERTS, MOCK_DEVICES, INITIAL_DEVICES } from './mockData';
import { AuthModal } from './components/AuthModal';
import { FilterConfigView } from './components/FilterConfigView';
import { ActivityLog } from './components/ActivityLog';
import { SecurityAlerts } from './components/SecurityAlerts';
import { HowToConfigure } from './components/HowToConfigure';
import { DeviceControlView } from './components/DeviceControlView';

export default function App() {
  // Config & Master States
  const [isVpnActive, setIsVpnActive] = useState(true);
  const [remoteLocked, setRemoteLocked] = useState(false);
  const [filterConfig, setConfig] = useState<FilterConfig>(INITIAL_FILTER_CONFIG);
  const [devices, setDevices] = useState<ManagedDevice[]>(INITIAL_DEVICES);
  
  // Real-Time Activity Metrics
  const [logs, setLogs] = useState<ConnectionLog[]>(SAMPLE_CONNECTIONS);
  const [alerts, setAlerts] = useState<AlertLog[]>(SAMPLE_ALERTS);

  // Security Lock configuration
  const [passwordHash, setPasswordHash] = useState<string | null>('1234'); // Safe prototype default pass
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authSuccessCallback, setAuthSuccessCallback] = useState<(() => void) | null>(null);

  // Layout View Tabs
  const [currentTab, setCurrentTab] = useState<'devices' | 'rules' | 'logs' | 'alerts' | 'how-to'>('devices');
  const [activeDeviceFilter, setActiveDeviceFilter] = useState<string>('All Devices');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Notification Banner triggers
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Auto-enroll device from QR scan URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const enrollType = params.get('enroll');
    if (enrollType === 'device') {
      const name = params.get('name') || 'Scanned Device';
      const platform = (params.get('platform') as ManagedDevice['platform']) || 'Android';
      const uuid = params.get('uuid') || `uuid-${Date.now()}`;
      const ipAddress = params.get('ipAddress') || '192.168.1.100';
      const newDevice: ManagedDevice = {
        id: `dev_${Date.now()}`,
        name,
        platform,
        status: 'Online',
        screenLocked: false,
        internetBlocked: false,
        blockAdult: params.get('blockAdult') === 'true',
        blockGambling: params.get('blockGambling') === 'true',
        blockSocial: params.get('blockSocial') === 'true',
        ipAddress,
        uuid,
        lastSeen: 'Just now',
      };
      setDevices(prev => {
        const exists = prev.some(d => d.uuid === uuid);
        return exists ? prev : [newDevice, ...prev];
      });
      setBannerAlert(`✅ Device "${name}" enrolled successfully via QR scan!`);
      // Clean URL so refresh doesn't re-enroll
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Background Telemetry Simulation to give dynamic feel
  useEffect(() => {
    if (!isVpnActive || remoteLocked || devices.length === 0) return;

    const interval = setInterval(() => {
      // Simulate real-time activities being captured by the VPN filter
      const categories: ('Adult' | 'Gambling' | 'Malware' | 'Social' | 'Normal')[] = 
        ['Normal', 'Social', 'Normal', 'Adult', 'Normal', 'Malware'];
      
      const category = categories[Math.floor(Math.random() * categories.length)];
      const targetDeviceObj = devices[Math.floor(Math.random() * devices.length)];
      const targetDevice = targetDeviceObj.name;
      
      let domain = 'google.com';
      let action: 'Allowed' | 'Blocked' = 'Allowed';

      if (category === 'Adult') {
        const adultDomains = ['forbidden-portal.xxx', 'restricted-videos-network.net', 'sketchy-adult-site.club'];
        domain = adultDomains[Math.floor(Math.random() * adultDomains.length)];
        action = (filterConfig.blockAdult || targetDeviceObj.blockAdult) ? 'Blocked' : 'Allowed';
      } else if (category === 'Gambling') {
        const gamblingDomains = ['crypto-bet-slots.com', 'wager-royal-chips.cc'];
        domain = gamblingDomains[Math.floor(Math.random() * gamblingDomains.length)];
        action = (filterConfig.blockGambling || targetDeviceObj.blockGambling) ? 'Blocked' : 'Allowed';
      } else if (category === 'Malware') {
        const malwareDomains = ['phish-invoice-ref2026.ru', 'coin-miner-payload.cn'];
        domain = malwareDomains[Math.floor(Math.random() * malwareDomains.length)];
        action = filterConfig.blockMalware ? 'Blocked' : 'Allowed';
      } else if (category === 'Social') {
        const socialDomains = ['tiktok-video-direct.com', 'instagram-feed-cache.com'];
        domain = socialDomains[Math.floor(Math.random() * socialDomains.length)];
        action = (filterConfig.blockSocial || targetDeviceObj.blockSocial) ? 'Blocked' : 'Allowed';
      } else {
        const standardDomains = ['wikipedia.org', 'coursera.org', 'stackexchange.com', 'classroom.google.com'];
        domain = standardDomains[Math.floor(Math.random() * standardDomains.length)];
        action = 'Allowed';
      }

      // If specific phone internet is blocked completely, override access to Blocked
      if (targetDeviceObj.internetBlocked) {
        action = 'Blocked';
      }

      // Special dynamic override: if blacklisted
      if (filterConfig.customBlacklist.some(black => domain.includes(black))) {
        action = 'Blocked';
      }
      
      // If whitelisted, force Allowed unless device internet is completely blocked
      if (filterConfig.customWhitelist.some(white => domain.includes(white))) {
        action = targetDeviceObj.internetBlocked ? 'Blocked' : 'Allowed';
      }

      const newLog: ConnectionLog = {
        id: Math.random().toString(),
        timestamp: new Date().toISOString(),
        domain,
        category,
        action,
        ip: targetDeviceObj.ipAddress,
        device: targetDevice
      };

      setLogs(prev => [newLog, ...prev.slice(0, 39)]);

      // If VPN blocks adult/malware, generate critical system alert
      if (action === 'Blocked' && (category === 'Adult' || category === 'Malware' || category === 'Gambling')) {
        const newAlert: AlertLog = {
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          domain,
          category: `Device ${targetDevice} triggered ${category} restriction`,
          severity: category === 'Adult' || category === 'Malware' ? 'high' : 'medium',
          resolved: false
        };
        setAlerts(prev => [newAlert, ...prev]);
        setBannerAlert(`Security Intercept: Blocked query from ${targetDevice} to "${domain}"`);
      }

    }, 7000);

    return () => clearInterval(interval);
  }, [isVpnActive, remoteLocked, filterConfig, devices]);

  // Request Auth action helper
  const triggerParentAuth = (onSuccessAction: () => void) => {
    if (isUnlocked) {
      onSuccessAction();
    } else {
      setAuthSuccessCallback(() => onSuccessAction);
      setIsAuthModalOpen(true);
    }
  };

  const handleToggleVpn = () => {
    triggerParentAuth(() => {
      setIsVpnActive(!isVpnActive);
    });
  };

  const handleRemoteLockToggle = () => {
    triggerParentAuth(() => {
      setRemoteLocked(!remoteLocked);
    });
  };

  const handleResetLock = () => {
    triggerParentAuth(() => {
      setIsUnlocked(!isUnlocked);
    });
  };

  const handleResolveAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  };

  const handleClearAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, resolved: true })));
  };

  const activeAlertCount = alerts.filter(a => !a.resolved).length;
  const filteredLogs = activeDeviceFilter === 'All Devices' 
    ? logs 
    : logs.filter(l => l.device === activeDeviceFilter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans antialiased text-slate-800">
      
      {/* SIDEBAR ON DESKTOP - Dark executive theme requested in Sleek design guidelines */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 md:min-h-screen border-r border-slate-950 shadow-2xl">
        {/* Sidebar Header Brand */}
        <div className="px-6 py-5 border-b border-slate-950 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-950/20">
            <Shield className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-white text-base tracking-tight">GuardianNet</h1>
              <span className="bg-emerald-500/20 text-emerald-400 text-[8.5px] px-1.5 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                v2.4
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Device Intercept Port</p>
          </div>
        </div>

        {/* Sidebar Tab Options */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          <button
            onClick={() => setCurrentTab('devices')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'devices'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Target Devices Control</span>
            <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${currentTab === 'devices' ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentTab('rules')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'rules'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Filter & Guard Rules</span>
            <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${currentTab === 'rules' ? 'rotate-90' : ''}`} />
          </button>

          <button
            onClick={() => setCurrentTab('logs')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'logs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>Dashboard Analytics</span>
            <span className="text-[10px] bg-slate-950/80 text-slate-300 font-mono px-1.5 py-0.5 rounded ml-auto">
              {logs.length}
            </span>
          </button>

          <button
            onClick={() => setCurrentTab('alerts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span>Real-Time Alerts</span>
            {activeAlertCount > 0 ? (
              <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full ml-auto animate-pulse">
                {activeAlertCount}
              </span>
            ) : (
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-500" />
            )}
          </button>

          <button
            onClick={() => setCurrentTab('how-to')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              currentTab === 'how-to'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4 shrink-0" />
            <span>Android Compilation</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-500" />
          </button>
        </nav>

        {/* Sidebar Footer student tag */}
        <div className="p-4 mx-4 mb-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-1 text-left">
          <div className="flex items-center gap-2 text-indigo-400">
            <Award className="w-3.5 h-3.5" />
            <span className="text-[10px] font-black uppercase tracking-wider">SECURE VPN CORE</span>
          </div>
          <p className="text-[11px] font-bold text-white">Greg Garrido</p>
          <p className="text-[10px] text-slate-400 leading-relaxed">IT Cybersecurity Scholar</p>
        </div>
      </aside>

      {/* MOBILE HEADER BAR - Sticky top-0, only visible on mobile screen view < md */}
      <div className="flex md:hidden items-center justify-between bg-slate-900 text-slate-200 px-5 py-3.5 border-b border-slate-950 sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="w-4.5 h-4.5 text-white stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-white text-xs tracking-tight">GuardianNet Mobile</h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Active Device Intercept</p>
          </div>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-950 transition-colors cursor-pointer flex items-center justify-center"
          title="Open Menu Menu"
        >
          <Menu className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* MOBILE COMPACT SLIDE-OUT DRAWER OVERLAY */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Transparent clickaway backdrop */}
          <div 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-sm transition-opacity duration-300"
          />
          {/* Drawer Menu Frame sliding out from left */}
          <div className="relative flex-1 flex flex-col max-w-[290px] w-full bg-slate-900 text-slate-200 p-6 shadow-2xl justify-between z-50 animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              {/* Drawer Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-sm">
                    <Shield className="w-4 h-4 text-white stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-white text-xs tracking-tight">GuardianNet</h2>
                    <p className="text-[9px] text-slate-400">Mobile security portal</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-705 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer text-xs font-black uppercase tracking-wider"
                >
                  ✕
                </button>
              </div>

              {/* Touch Friendly Routing links */}
              <nav className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentTab('devices');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentTab === 'devices'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Target Devices Control</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('rules');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentTab === 'rules'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Config Filter Rules</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" />
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('logs');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentTab === 'logs'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Dashboard Logs</span>
                  <span className="text-[10px] bg-slate-955/80 text-slate-300 font-mono px-1.5 py-0.5 rounded ml-auto">
                    {logs.length}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('alerts');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentTab === 'alerts'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Bell className="w-4 h-4 shrink-0" />
                  <span>Real-Time Alerts</span>
                  {activeAlertCount > 0 ? (
                    <span className="text-[10px] bg-red-600 text-white font-black px-2 py-0.5 rounded-full ml-auto animate-pulse">
                      {activeAlertCount}
                    </span>
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentTab('how-to');
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    currentTab === 'how-to'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Laptop className="w-4 h-4 shrink-0" />
                  <span>Android Blueprint</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-600" />
                </button>
              </nav>
            </div>

            {/* Bottom Controls / Academic Tag inside drawer */}
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-850 border border-slate-800 rounded-2xl text-left space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-400 font-black text-[9px] uppercase tracking-wider">
                  <Award className="w-3.5 h-3.5" />
                  <span>SECURE VPN CORE</span>
                </div>
                <p className="text-xs font-bold text-white">Greg Garrido</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">IT Cybersecurity Scholar</p>
              </div>

              {/* Fast Status Interlock inside drawer */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-black text-center">
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleToggleVpn();
                  }}
                  className={`py-2 px-1 rounded-xl border cursor-pointer font-bold ${
                    isVpnActive 
                      ? 'bg-emerald-900/20 border-emerald-900/50 text-emerald-400' 
                      : 'bg-red-900/20 border-red-900/50 text-red-400'
                  }`}
                >
                  VPN: {isVpnActive ? 'ACTIVE' : 'OFFLINE'}
                </button>
                <button
                  onClick={() => {
                    setIsMobileSidebarOpen(false);
                    handleResetLock();
                  }}
                  className={`py-2 px-1 rounded-xl border cursor-pointer font-bold ${
                    isUnlocked 
                      ? 'bg-amber-900/20 border-amber-900/50 text-amber-400' 
                      : 'bg-slate-850 border-slate-800 text-slate-400'
                  }`}
                >
                  {isUnlocked ? 'UNLOCKED' : 'PROTECTED'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Remote System-level Block Simulation Overlay */}
        {remoteLocked && (
          <div className="bg-red-650 text-white text-center py-2.5 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 font-bold text-xs tracking-wide shadow-lg select-none">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-white animate-bounce shrink-0" />
              <span>[WARNING] SYSTEM IS REMOTELY LOCKED. Network access is disabled.</span>
            </div>
            <button 
              onClick={() => triggerParentAuth(() => setRemoteLocked(false))}
              className="px-3 py-1 bg-white hover:bg-red-50 text-red-700 rounded-lg text-[10px] uppercase font-extrabold shadow-sm transition-all cursor-pointer mt-1 sm:mt-0"
            >
              Master Bypass Unlock
            </button>
          </div>
        )}

        {/* Dynamic Notification Banner */}
        {bannerAlert && (
          <div className="bg-indigo-50 border-b border-indigo-150 text-indigo-900 text-center py-2 px-6 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 mx-auto">
              <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="font-bold truncate max-w-[280px] sm:max-w-md">{bannerAlert}</span>
            </div>
            <button 
              onClick={() => setBannerAlert(null)}
              className="text-[10px] uppercase font-black text-indigo-600 hover:text-indigo-800 cursor-pointer min-w-[36px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Global Toolbar Header */}
        <header className="bg-white border-b border-slate-200 relative md:sticky md:top-0 z-30 px-4 md:px-6 py-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6366f1]">Parental Administration</span>
              <h2 className="text-base md:text-lg font-black tracking-tight text-slate-900">Device Controller</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {/* Quick Status Pill VPN */}
              <button
                onClick={handleToggleVpn}
                className={`text-[11px] font-bold flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  isVpnActive 
                    ? 'bg-emerald-50 text-emerald-800' 
                    : 'bg-red-50 text-red-800'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isVpnActive ? 'bg-emerald-500 animate-ping' : 'bg-red-500'}`} />
                <span className="hidden sm:inline">VPN Filter:</span>
                <span>{isVpnActive ? 'ACTIVE' : 'OFFLINE'}</span>
              </button>

              {/* Master Settings authorization control */}
              <button
                onClick={handleResetLock}
                className={`text-[11px] font-bold flex items-center gap-2 px-3 py-2 rounded-xl transition-all cursor-pointer ${
                  isUnlocked 
                    ? 'bg-amber-50 text-amber-900' 
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {isUnlocked ? <Unlock className="w-3.5 h-3.5 text-amber-700" /> : <Lock className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{isUnlocked ? 'Unlocked State' : 'Parent Protected'}</span>
              </button>

              {/* Info Dropdown Menu (IT Student Greg Garrido portfolio as requested) */}
              <div className="relative">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Info className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Info Hub</span>
                </button>

                {isMobileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-5 z-50 text-left space-y-4 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 leading-tight">GuardianNet Info Hub</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">IT Capstone Demonstration</p>
                      </div>
                      <button 
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="text-xs text-slate-400 hover:text-slate-900 cursor-pointer p-0.5 rounded bg-slate-50"
                      >
                        ✕
                      </button>
                    </div>

                    {/* IT Student Portfolio and ADB parameters */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <Award className="w-4 h-4 text-indigo-500" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wider">Created By</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-900">
                        Greg Garrido
                      </p>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Greg is an IT scholar specializing in network firewalls, DNS loopbacks blocking, and custom mobile Device Admin services integration.
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3 rounded-lg text-[10px] text-slate-400 font-mono font-semibold">
                      <p className="text-slate-500">• Host Bound: 0.0.0.0 Proxy Intercept</p>
                      <p className="text-slate-500">• Target: Android VpnService compatible</p>
                      <p className="text-slate-500">• Lock Passcode: Master PIN check</p>
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        setCurrentTab('how-to');
                      }}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
                    >
                      View Android Blueprint
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* MASTER SCENE GRID */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-4 md:py-6 space-y-5 md:space-y-6">
          
          {/* Top Quick Interceptions Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Control card 1: Tunnel Status */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[11px]">
                      01
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest">Gateway Network</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Active Tunnel Status</p>
                    </div>
                  </div>
                  <span className={`w-2.5 h-2.5 rounded-full ${isVpnActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                </div>

                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">VPN Packet Intercept:</span>
                    <span className={`font-bold capitalize ${isVpnActive ? 'text-emerald-700' : 'text-red-600'}`}>
                      {isVpnActive ? 'Enforced filters' : 'Disabled / Suspend'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Adult Block (X18):</span>
                    <span className="text-slate-900 font-extrabold">{filterConfig.blockAdult ? 'COMPLETELY BLOCKED' : 'Allowed'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-600 font-extrabold">Active Devices:</span>
                    <span className="text-indigo-600 font-black">{devices.length} Online</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleToggleVpn}
                  className={`flex-1 px-3 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isVpnActive 
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                      : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white'
                  }`}
                >
                  {isVpnActive ? 'Suspend DNS Filters' : 'Resume DNS Filters'}
                </button>

                <button
                  onClick={() => {
                    if (isUnlocked) {
                      setIsUnlocked(false);
                    } else {
                      triggerParentAuth(() => setIsUnlocked(true));
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                    isUnlocked 
                      ? 'bg-amber-50 border-amber-250 text-amber-700' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-250 text-slate-500'
                  }`}
                  title={isUnlocked ? 'Lock Settings Modification' : 'Unlock Settings'}
                >
                  {isUnlocked ? 'Relock settings' : 'Unlock'}
                </button>
              </div>
            </div>

            {/* Control card 2: Telemetry Interceptions */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center font-bold text-[11px]">
                      02
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest">Guard Firewall</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Real-Time Threat logs</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${activeAlertCount > 0 ? 'bg-red-100 text-red-750 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                    {activeAlertCount} Trigger{activeAlertCount !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Inspected queries:</span>
                    <span className="font-mono text-slate-900 font-bold">{logs.length} sessions</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Blocked requests:</span>
                    <span className="font-mono text-red-600 font-extrabold">{logs.filter(l => l.action === 'Blocked').length} Hits</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Latest blocked domain:</span>
                    <span className="font-mono text-slate-900 font-bold truncate max-w-[120px]">{logs.find(l => l.action === 'Blocked')?.domain || 'None recorded'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentTab('alerts')}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Examine Blocked Metrics
              </button>
            </div>

            {/* Control card 3: Device Interlock Controls */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-[11px]">
                      03
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-widest">Lock Shield</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">System Intervention</p>
                    </div>
                  </div>
                  <span className={`w-3 h-3 rounded-full ${remoteLocked ? 'bg-red-500 animate-ping' : 'bg-slate-200'}`} />
                </div>

                <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-xl font-medium">
                  <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                    Simulates system-level lockdown overlay blocks targeting local user profiles on client devices. Requires Password auth to override.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRemoteLockToggle}
                className={`w-full py-2 font-bold text-xs rounded-xl shadow transition-all cursor-pointer border ${
                  remoteLocked 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' 
                    : 'bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-red-100'
                }`}
              >
                {remoteLocked ? 'Lift Remote Lock Screen' : '⚡ Lock Target Host Screen'}
              </button>
            </div>
          </div>

          {/* ACTIVE CONTENT WORKSPACE FRAME */}
          <div className="space-y-4">
            
            {/* Filter Logs header if logs tab is open */}
            {currentTab === 'logs' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
                <div className="space-y-0.5">
                  <h3 className="font-extrabold text-sm text-slate-950 uppercase tracking-wider">Filtered Host Telemetry logs</h3>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-tight">DNS activity and blocks tracker index</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Viewing:</span>
                  <select
                    value={activeDeviceFilter}
                    onChange={(e) => setActiveDeviceFilter(e.target.value)}
                    className="bg-white border border-slate-250 text-slate-900 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="All Devices">All Logged Clients</option>
                    {devices.map(device => (
                      <option key={device.id} value={device.name}>{device.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Selected Tab Frame Output */}
            <div className="transition-all animate-in fade-in duration-200">
              {currentTab === 'devices' && (
                <DeviceControlView 
                  devices={devices}
                  setDevices={setDevices}
                  isLocked={!isUnlocked}
                  onUnlockRequest={() => triggerParentAuth(() => setIsUnlocked(true))}
                  onFilterLogToDevice={(deviceName) => {
                    setActiveDeviceFilter(deviceName);
                    setCurrentTab('logs');
                  }}
                />
              )}

              {currentTab === 'rules' && (
                <FilterConfigView 
                  config={filterConfig} 
                  setConfig={setConfig} 
                  isLocked={!isUnlocked}
                  onUnlockRequest={() => triggerParentAuth(() => setIsUnlocked(true))}
                />
              )}

              {currentTab === 'logs' && (
                <ActivityLog logs={filteredLogs} />
              )}

              {currentTab === 'alerts' && (
                <SecurityAlerts 
                  alerts={alerts} 
                  onResolve={handleResolveAlert}
                  onClearAll={handleClearAllAlerts}
                />
              )}

              {currentTab === 'how-to' && (
                <HowToConfigure />
              )}
            </div>
          </div>

          {/* Educational Specifications Disclaimer panel - Premium Slate themed */}
          <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-2.5 shadow-sm">
            <div className="flex items-center gap-2 text-[#4f46e5]">
              <ShieldCheck className="w-4 h-4 mr-0.5 fill-[#e0e7ff]" />
              <h4 className="text-xs font-black uppercase tracking-wider">Local Proxy Intercept & Android Device Specs</h4>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold">
              Parental blocks require deep OS packet interception. This demonstration application configures custom blocking profiles, DNS rules matrices, remote lockdown relays, and uninstallation verification. It represents Greg Garrido's portfolio design, suitable for compilation into native Kotlin `VpnService` structures inside Android Studio.
            </p>
          </div>
        </main>

        {/* Persistent Page Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-[10.5px] text-slate-400 font-bold space-y-1 mt-auto">
          <p>© 2026 GuardParent Gateway Project. Registered under academic cybersecurity requirements.</p>
          <p>Created by Greg Garrido — Information Technology Graduate Candidate.</p>
        </footer>
      </div>

      {/* Security Gate authentication modal component */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          setIsAuthModalOpen(false);
          setAuthSuccessCallback(null);
        }}
        onSuccess={() => {
          if (authSuccessCallback) {
            authSuccessCallback();
          }
          setIsAuthModalOpen(false);
          setAuthSuccessCallback(null);
        }}
        passwordHash={passwordHash}
        setPasswordHash={setPasswordHash}
      />
    </div>
  );
}