import React, { useState } from 'react';
import { FilterConfig } from '../types';
import { Shield, Plus, Trash2, Check, Lock, Unlock, HelpCircle } from 'lucide-react';

interface FilterConfigViewProps {
  config: FilterConfig;
  setConfig: React.Dispatch<React.SetStateAction<FilterConfig>>;
  isLocked: boolean;
  onUnlockRequest: () => void;
}

export function FilterConfigView({ config, setConfig, isLocked, onUnlockRequest }: FilterConfigViewProps) {
  const [newBlackDomain, setNewBlackDomain] = useState('');
  const [newWhiteDomain, setNewWhiteDomain] = useState('');

  const toggleCategory = (key: keyof Pick<FilterConfig, 'blockAdult' | 'blockGambling' | 'blockMalware' | 'blockSocial'>) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    const domain = newBlackDomain.trim().toLowerCase();
    if (!domain) return;
    if (!config.customBlacklist.includes(domain)) {
      setConfig(prev => ({
        ...prev,
        customBlacklist: [domain, ...prev.customBlacklist]
      }));
    }
    setNewBlackDomain('');
  };

  const handleAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    const domain = newWhiteDomain.trim().toLowerCase();
    if (!domain) return;
    if (!config.customWhitelist.includes(domain)) {
      setConfig(prev => ({
        ...prev,
        customWhitelist: [domain, ...prev.customWhitelist]
      }));
    }
    setNewWhiteDomain('');
  };

  const handleRemoveBlacklist = (domain: string) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setConfig(prev => ({
      ...prev,
      customBlacklist: prev.customBlacklist.filter(d => d !== domain)
    }));
  };

  const handleRemoveWhitelist = (domain: string) => {
    if (isLocked) {
      onUnlockRequest();
      return;
    }
    setConfig(prev => ({
      ...prev,
      customWhitelist: prev.customWhitelist.filter(d => d !== domain)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Warning Alert if settings are Locked */}
      {isLocked && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3 shadow-sm">
          <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900">Policy Rules are Locked</h4>
            <p className="text-xs text-amber-700 leading-relaxed">
              Settings require parental authentication to prevent bypass efforts. Click any rule toggle or list item to insert your Password PIN and unlock.
            </p>
            <button
              onClick={onUnlockRequest}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 underline mt-1 block cursor-pointer"
            >
              Unlock Configuration Settings
            </button>
          </div>
        </div>
      )}

      {/* Main Categories Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Adult Block */}
        <div 
          onClick={() => toggleCategory('blockAdult')}
          className={`relative border p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between overflow-hidden group ${
            config.blockAdult 
              ? 'bg-slate-900 border-red-500/20 text-white shadow-md' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          {config.blockAdult && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.blockAdult ? 'bg-red-400 animate-pulse' : 'bg-slate-300'}`} />
              <h4 className="font-bold text-sm">Disable Adult Content & Pornography</h4>
            </div>
            <p className={`text-xs max-w-none sm:max-w-[85%] leading-relaxed ${config.blockAdult ? 'text-slate-300' : 'text-slate-500'}`}>
              Maintains strict deep-packet and DNS blocking across all user agents. Implements clean searching forced protocols.
            </p>
          </div>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            config.blockAdult ? 'bg-red-500 border-red-400 text-white' : 'border-slate-300'
          }`}>
            {config.blockAdult && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>

        {/* Gambling Block */}
        <div 
          onClick={() => toggleCategory('blockGambling')}
          className={`relative border p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between overflow-hidden group ${
            config.blockGambling 
              ? 'bg-slate-900 border-amber-500/20 text-white shadow-md' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          {config.blockGambling && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.blockGambling ? 'bg-amber-400' : 'bg-slate-300'}`} />
              <h4 className="font-bold text-sm">Block Gambling & Wagering</h4>
            </div>
            <p className={`text-xs max-w-none sm:max-w-[85%] leading-relaxed ${config.blockGambling ? 'text-slate-300' : 'text-slate-500'}`}>
              Bridges secure routing blocklists targeting crypto casinos, betting gateways, and slots simulators.
            </p>
          </div>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            config.blockGambling ? 'bg-amber-500 border-amber-400 text-white' : 'border-slate-300'
          }`}>
            {config.blockGambling && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>

        {/* Malware Block */}
        <div 
          onClick={() => toggleCategory('blockMalware')}
          className={`relative border p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between overflow-hidden group ${
            config.blockMalware 
              ? 'bg-slate-900 border-emerald-500/20 text-white shadow-md' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          {config.blockMalware && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.blockMalware ? 'bg-emerald-400' : 'bg-slate-300'}`} />
              <h4 className="font-bold text-sm">Anti-Malware & Phishing</h4>
            </div>
            <p className={`text-xs max-w-none sm:max-w-[85%] leading-relaxed ${config.blockMalware ? 'text-slate-300' : 'text-slate-500'}`}>
              Blocks connection attempts to verified crypto-jacking domains, command nodes, and zero-day threat repositories.
            </p>
          </div>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            config.blockMalware ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-slate-300'
          }`}>
            {config.blockMalware && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>

        {/* Social Media Block */}
        <div 
          onClick={() => toggleCategory('blockSocial')}
          className={`relative border p-5 rounded-2xl cursor-pointer transition-all flex items-center justify-between overflow-hidden group ${
            config.blockSocial 
              ? 'bg-slate-900 border-blue-500/20 text-white shadow-md' 
              : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
          }`}
        >
          {config.blockSocial && (
            <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${config.blockSocial ? 'bg-blue-400' : 'bg-slate-300'}`} />
              <h4 className="font-bold text-sm">Time-Out Social Media</h4>
            </div>
            <p className={`text-xs max-w-none sm:max-w-[85%] leading-relaxed ${config.blockSocial ? 'text-slate-300' : 'text-slate-500'}`}>
              Restrict access to prominent apps (TikTok, Instagram, etc) to promote healthy family screen-time intervals.
            </p>
          </div>
          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            config.blockSocial ? 'bg-blue-500 border-blue-400 text-white' : 'border-slate-300'
          }`}>
            {config.blockSocial && <Check className="w-4 h-4 stroke-[3]" />}
          </div>
        </div>
      </div>

      {/* Lists Rule Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Custom Blacklist */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900">Custom Target Blocklist</h4>
            <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-2.5 py-0.5 rounded-full font-bold">
              Force Deny DNS
            </span>
          </div>

          <form onSubmit={handleAddBlacklist} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. addictive-gaming.ru"
              value={newBlackDomain}
              onChange={(e) => setNewBlackDomain(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-red-500/50 rounded-lg px-3 py-2 text-xs text-slate-950 outline-none flex-1 placeholder-slate-400 focus:ring-1 focus:ring-red-400"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {config.customBlacklist.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No custom domains added to blocklist yet.</p>
            ) : (
              config.customBlacklist.map(domain => (
                <div key={domain} className="flex items-center justify-between bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg group hover:border-slate-300 transition-all">
                  <span className="text-xs font-mono text-slate-700">{domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlacklist(domain)}
                    className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Custom Whitelist (Exceptions) */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-bold text-sm text-slate-900">Safe Exceptions (Whitelist)</h4>
            <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
              Bypass Rules
            </span>
          </div>

          <form onSubmit={handleAddWhitelist} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="e.g. educational-k12.org"
              value={newWhiteDomain}
              onChange={(e) => setNewWhiteDomain(e.target.value)}
              className="bg-slate-50 border border-slate-200 focus:border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-slate-950 outline-none flex-1 placeholder-slate-400 focus:ring-1 focus:ring-emerald-400"
            />
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg cursor-pointer flex items-center justify-center transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
            {config.customWhitelist.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">No exceptions configured.</p>
            ) : (
              config.customWhitelist.map(domain => (
                <div key={domain} className="flex items-center justify-between bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg group hover:border-slate-300 transition-all">
                  <span className="text-xs font-mono text-slate-700">{domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWhitelist(domain)}
                    className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
