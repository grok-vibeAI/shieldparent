import { ConnectionLog, AlertLog, ManagedDevice } from './types';

export const INITIAL_FILTER_CONFIG = {
  blockAdult: true,
  blockGambling: true,
  blockMalware: true,
  blockSocial: false,
  customBlacklist: ['sketchyexample.com', 'badsite.net'],
  customWhitelist: ['google.com', 'wikipedia.org']
};

export const MOCK_DEVICES: string[] = [];

// Empty — devices only appear after QR scan or manual enrollment
export const INITIAL_DEVICES: ManagedDevice[] = [];

// Empty — logs and alerts only generate after devices are enrolled
export const SAMPLE_CONNECTIONS: ConnectionLog[] = [];
export const SAMPLE_ALERTS: AlertLog[] = [];