export interface ConnectionLog {
  id: string;
  timestamp: string;
  domain: string;
  category: 'Adult' | 'Gambling' | 'Malware' | 'Social' | 'Normal';
  action: 'Allowed' | 'Blocked';
  ip: string;
  device: string;
}

export interface FilterConfig {
  blockAdult: boolean;
  blockGambling: boolean;
  blockMalware: boolean;
  blockSocial: boolean;
  customBlacklist: string[];
  customWhitelist: string[];
}

export interface AlertLog {
  id: string;
  timestamp: string;
  domain: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  resolved: boolean;
}

export interface ParentalControls {
  parentPasswordHash: string | null;
  remoteLockActive: boolean;
  isUnlocked: boolean;
}

export interface ManagedDevice {
  id: string;
  name: string;
  platform: 'Android' | 'iOS' | 'Tablet' | 'ChromeOS';
  status: 'Online' | 'Offline' | 'Restricted';
  screenLocked: boolean;
  internetBlocked: boolean;
  blockAdult: boolean;
  blockGambling: boolean;
  blockSocial: boolean;
  ipAddress: string;
  uuid: string;
  lastSeen: string;
}

