import { ConnectionLog, AlertLog, ManagedDevice } from './types';

export const INITIAL_FILTER_CONFIG = {
  blockAdult: true,
  blockGambling: true,
  blockMalware: true,
  blockSocial: false,
  customBlacklist: ['sketchyexample.com', 'badsite.net'],
  customWhitelist: ['google.com', 'wikipedia.org']
};

export const MOCK_DEVICES = ['Android Phone (Pixel 7)', 'Tablet (Galaxy Tab S8)', "Kid's Chromebook"];

export const INITIAL_DEVICES: ManagedDevice[] = [
  {
    id: 'dev1',
    name: 'Android Phone (Pixel 7)',
    platform: 'Android',
    status: 'Online',
    screenLocked: false,
    internetBlocked: false,
    blockAdult: true,
    blockGambling: true,
    blockSocial: false,
    ipAddress: '192.168.1.105',
    uuid: '8f3c-9a1b-e5d2-04f7',
    lastSeen: 'Just now'
  },
  {
    id: 'dev2',
    name: 'Tablet (Galaxy Tab S8)',
    platform: 'Tablet',
    status: 'Online',
    screenLocked: false,
    internetBlocked: false,
    blockAdult: true,
    blockGambling: true,
    blockSocial: true,
    ipAddress: '192.168.1.108',
    uuid: '1d4b-7f2e-c5c8-11a3',
    lastSeen: '2 mins ago'
  },
  {
    id: 'dev3',
    name: "Kid's Chromebook",
    platform: 'ChromeOS',
    status: 'Offline',
    screenLocked: true,
    internetBlocked: true,
    blockAdult: true,
    blockGambling: true,
    blockSocial: false,
    ipAddress: '192.168.1.112',
    uuid: '6e1a-4d9f-a0e4-55c2',
    lastSeen: '1 hour ago'
  },
  {
    id: 'dev4',
    name: "Chloe's iPhone 14",
    platform: 'iOS',
    status: 'Online',
    screenLocked: false,
    internetBlocked: false,
    blockAdult: true,
    blockGambling: true,
    blockSocial: false,
    ipAddress: '192.168.1.115',
    uuid: '2a4e-9d2c-f6b8-3901',
    lastSeen: 'Just now'
  },
  {
    id: 'dev5',
    name: "Emily's iPad Air",
    platform: 'iOS',
    status: 'Online',
    screenLocked: false,
    internetBlocked: false,
    blockAdult: true,
    blockGambling: false,
    blockSocial: true,
    ipAddress: '192.168.1.119',
    uuid: '7c8b-5e3e-00b2-4d1a',
    lastSeen: '5 mins ago'
  }
];


export const SAMPLE_CONNECTIONS: ConnectionLog[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 1000).toISOString(),
    domain: 'restricted-content-example.xxx',
    category: 'Adult',
    action: 'Blocked',
    ip: '172.56.21.9',
    device: 'Android Phone (Pixel 7)'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 30 * 1000).toISOString(),
    domain: 'wikipedia.org',
    category: 'Normal',
    action: 'Allowed',
    ip: '208.80.154.224',
    device: 'Android Phone (Pixel 7)'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 60 * 1000).toISOString(),
    domain: 'gamblingcheck-demo.com',
    category: 'Gambling',
    action: 'Blocked',
    ip: '198.51.100.41',
    device: 'Tablet (Galaxy Tab S8)'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 120 * 1000).toISOString(),
    domain: 'google.com',
    category: 'Normal',
    action: 'Allowed',
    ip: '142.250.190.46',
    device: 'Android Phone (Pixel 7)'
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 300 * 1000).toISOString(),
    domain: 'malware-test-site.cn',
    category: 'Malware',
    action: 'Blocked',
    ip: '103.22.200.11',
    device: "Kid's Chromebook"
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 600 * 1000).toISOString(),
    domain: 'educational-math.com',
    category: 'Normal',
    action: 'Allowed',
    ip: '192.168.1.102',
    device: "Kid's Chromebook"
  }
];

export const SAMPLE_ALERTS: AlertLog[] = [
  {
    id: 'a1',
    timestamp: new Date(Date.now() - 5 * 1000).toISOString(),
    domain: 'restricted-content-example.xxx',
    category: 'Adult Website Query Blocked',
    severity: 'high',
    resolved: false
  },
  {
    id: 'a2',
    timestamp: new Date(Date.now() - 300 * 1000).toISOString(),
    domain: 'malware-test-site.cn',
    category: 'Malware Traffic Intercepted',
    severity: 'high',
    resolved: false
  },
  {
    id: 'a3',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    domain: 'gamblingcheck-demo.com',
    category: 'Frequent Gambling Blocks',
    severity: 'medium',
    resolved: true
  }
];
