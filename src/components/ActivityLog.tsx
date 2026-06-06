import { ConnectionLog } from '../types';
import { Activity, ShieldAlert, Wifi, Ban, CheckCircle, Smartphone } from 'lucide-react';

interface ActivityLogProps {
  logs: ConnectionLog[];
}

export function ActivityLog({ logs }: ActivityLogProps) {
  return (
    <div className="space-y-4">
      {/* Short Stat Bar inside logs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Allowed queries</span>
          <p className="text-2xl font-black text-slate-900">{logs.filter(l => l.action === 'Allowed').length}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider">Blocked targets</span>
          <p className="text-2xl font-black text-red-600">{logs.filter(l => l.action === 'Blocked').length}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Unique domains</span>
          <p className="text-2xl font-black text-slate-900">{new Set(logs.map(l => l.domain)).size}</p>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Protected devices</span>
          <p className="text-2xl font-black text-slate-900">{new Set(logs.map(l => l.device)).size}</p>
        </div>
      </div>

      <div className="hidden md:block bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-55/80">
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Timestamp</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Protected Device</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Queried Domain</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Category Tag</th>
                <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500">Access Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-xs text-slate-400 italic bg-white">
                    Waiting for network packets. Active local DNS listeners are waiting for traffic interface hooks.
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isBlocked = log.action === 'Blocked';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors bg-white">
                      <td className="px-5 py-3 text-xs text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium">{log.device}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-900 font-mono font-bold truncate max-w-[200px]" title={log.domain}>
                        {log.domain}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.category === 'Adult' ? 'bg-red-50 border-red-200 text-red-650' :
                          log.category === 'Gambling' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                          log.category === 'Malware' ? 'bg-rose-50 border-rose-250 text-rose-700' :
                          log.category === 'Social' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {log.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          {isBlocked ? (
                            <>
                              <Ban className="w-3.5 h-3.5 text-red-600" />
                              <span className="font-extrabold text-red-600 tracking-wider">BLOCKED</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-650" />
                              <span className="font-extrabold text-emerald-650 tracking-wider">ALLOWED</span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card-Based Logs: Hidden on Desktop */}
      <div className="block md:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="bg-white border border-slate-200 p-8 rounded-2xl text-center text-xs text-slate-400 italic">
            Waiting for network packets. Active local DNS listeners are waiting for traffic interface hooks.
          </div>
        ) : (
          logs.map(log => {
            const isBlocked = log.action === 'Blocked';
            return (
              <div key={log.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-sm hover:border-slate-300 transition-colors">
                <div className="flex items-center justify-between">
                  {/* Timestamp & Device */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-slate-200">•</span>
                    <div className="flex items-center gap-1 text-slate-700">
                      <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-bold">{log.device}</span>
                    </div>
                  </div>

                  {/* Access Status badge */}
                  <div className="flex items-center">
                    {isBlocked ? (
                      <span className="text-[10px] font-black text-red-600 flex items-center gap-1 tracking-wider">
                        <Ban className="w-3 h-3" /> BLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-650 flex items-center gap-1 tracking-wider">
                        <CheckCircle className="w-3 h-3" /> ALLOWED
                      </span>
                    )}
                  </div>
                </div>

                {/* Domain & Category */}
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-xs font-black text-slate-900 break-all leading-tight" title={log.domain}>
                    {log.domain}
                  </span>
                  
                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Category Category:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${
                      log.category === 'Adult' ? 'bg-red-50 border-red-200 text-red-600' :
                      log.category === 'Gambling' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      log.category === 'Malware' ? 'bg-rose-50 border-rose-200 text-rose-705' :
                      log.category === 'Social' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                      'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {log.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
