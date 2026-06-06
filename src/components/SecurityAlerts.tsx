import { AlertLog } from '../types';
import { Bell, AlertTriangle, ShieldCheck, RefreshCw, EyeOff } from 'lucide-react';

interface SecurityAlertsProps {
  alerts: AlertLog[];
  onResolve: (id: string) => void;
  onClearAll: () => void;
}

export function SecurityAlerts({ alerts, onResolve, onClearAll }: SecurityAlertsProps) {
  const activeAlerts = alerts.filter(a => !a.resolved);
  const resolvedAlerts = alerts.filter(a => a.resolved);

  return (
    <div className="space-y-5">
      {/* Overview */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-white border border-slate-200 p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <Bell className={`w-5 h-5 ${activeAlerts.length > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900">Bypass Attempt Detection System</h4>
            <p className="text-xs text-slate-500">
              Scans recursive DNS endpoints and connection spikes. Notifies hosts on VPN disruption attempts.
            </p>
          </div>
        </div>
        {activeAlerts.length > 0 && (
          <button
            onClick={onClearAll}
            className="self-start sm:self-auto text-xs px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Acknowledge All Alerts
          </button>
        )}
      </div>

      {/* Grid: Unresolved vs Resolved */}
      <div className="space-y-4">
        {/* Active Threat Log alerts */}
        <div className="space-y-2.5">
          <h5 className="text-xs font-bold text-red-600 uppercase tracking-widest pl-1">Active Suspicious Triggers ({activeAlerts.length})</h5>
          {activeAlerts.length === 0 ? (
            <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center shadow-sm">
              <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">No active threats detected on local VPN interfaces.</p>
              <p className="text-xs text-slate-500 mt-1">Device is secured with standard parental filters.</p>
            </div>
          ) : (
            activeAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={`border-t-0 border-r border-b border-l-4 p-5 rounded-r-2xl flex justify-between items-start transition-all gap-4 shadow-sm ${
                  alert.severity === 'high' 
                    ? 'bg-red-50/60 border-slate-200 border-l-red-500 text-red-950' 
                    : 'bg-amber-50/60 border-slate-200 border-l-amber-500 text-amber-950'
                }`}
              >
                <div className="flex gap-3">
                  <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'}`} />
                  <div className="space-y-1">
                    <p className="text-sm font-bold">{alert.category}</p>
                    <p className={`text-xs font-mono font-bold ${alert.severity === 'high' ? 'text-red-800' : 'text-amber-800'}`}>domain: {alert.domain}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[9.5px] uppercase px-2 py-0.5 rounded-full font-extrabold ${
                        alert.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {alert.severity} Risk Status
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onResolve(alert.id)}
                  className="text-xs font-bold px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg shrink-0 transition-colors cursor-pointer shadow-sm"
                >
                  Dismiss
                </button>
              </div>
            ))
          )}
        </div>

        {/* Resolved list */}
        {resolvedAlerts.length > 0 && (
          <div className="space-y-2 pt-2">
            <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Acknowledged Activity Reports ({resolvedAlerts.length})</h5>
            <div className="space-y-1.5">
              {resolvedAlerts.map(alert => (
                <div key={alert.id} className="bg-white border border-slate-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-slate-400" />
                    <span className="text-xs text-slate-500 line-through truncate max-w-[200px]">{alert.category} ({alert.domain})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono font-bold">{new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
