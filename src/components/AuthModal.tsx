import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, ShieldX, KeyRound, AlertTriangle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  passwordHash: string | null;
  setPasswordHash: (hash: string) => void;
}

export function AuthModal({ isOpen, onClose, onSuccess, passwordHash, setPasswordHash }: AuthModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordHash) {
      // First-time lock configuration
      if (password.length < 4) {
        setError('Password must be at least 4 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setPasswordHash(password); // Simple storage hash
      onSuccess();
      setPassword('');
      setConfirmPassword('');
      onClose();
    } else {
      // Verification mode
      if (password === passwordHash) {
        onSuccess();
        setPassword('');
        onClose();
      } else {
        setError('Incorrect password. Access denied.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="font-extrabold text-slate-900 tracking-tight text-base">
              {passwordHash ? 'Parental Security Verification' : 'Initialize Administrator Key'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 leading-relaxed mb-2 font-medium">
              {passwordHash 
                ? 'To change uninstallation rules, stop VPN filters, or view confidential logs, please authenticate using your chosen master security PIN/Password.'
                : 'Define a secure password that will be required to uninstall configuration certificates, alter DNS block rules, or suspend parental protections.'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Administrator PIN or Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 outline-none transition-colors font-sans text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {!passwordHash && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Confirm PIN or Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-400 outline-none transition-colors font-sans text-sm focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex gap-2 items-start bg-red-50 border border-red-200 p-3 rounded-xl text-red-700 text-xs mt-2 font-semibold shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-colors shadow-md hover:shadow-lg cursor-pointer"
            >
              {passwordHash ? 'Authenticate' : 'Save Rules'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
