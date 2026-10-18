import React, { useState } from 'react';
import { Calendar, CheckCircle2, Shield, RefreshCw, Key, Globe, Bell } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [googleConnected, setGoogleConnected] = useState(true);
  const [msftConnected, setMsftConnected] = useState(false);
  const [scorecardBlinding, setScorecardBlinding] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(15);
  const [timezone, setTimezone] = useState('America/New_York');

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-lg font-black text-white tracking-tight">System Integrations & Governance</h2>
        <p className="text-xs text-slate-400">
          Two-way calendar synchronizations, webhook dispatchers, and anti-bias security settings
        </p>
      </div>

      {/* Calendar Providers */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" /> Enterprise Calendar Integrations
        </h3>

        {/* Google Workspace */}
        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-900 text-lg shadow">
              G
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Google Workspace / Google Calendar API v3</h4>
              <p className="text-[11px] text-slate-400">
                Two-way push webhook sync with automatic Google Meet video conference creation
              </p>
            </div>
          </div>
          <button
            onClick={() => setGoogleConnected(!googleConnected)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              googleConnected
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-blue-600 text-white shadow'
            }`}
          >
            {googleConnected ? 'Connected (Active Sync)' : 'Connect Google Workspace'}
          </button>
        </div>

        {/* Microsoft 365 */}
        <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white text-lg shadow">
              M
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Microsoft 365 / Microsoft Graph API v1.0</h4>
              <p className="text-[11px] text-slate-400">
                Outlook calendar subscription webhooks with Microsoft Teams meeting dispatch
              </p>
            </div>
          </div>
          <button
            onClick={() => setMsftConnected(!msftConnected)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition ${
              msftConnected
                ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {msftConnected ? 'Connected' : 'Connect Microsoft 365'}
          </button>
        </div>
      </div>

      {/* Governance & Anti-Bias Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" /> Evaluation Governance & Concurrency Rules
        </h3>

        <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
          <div>
            <p className="text-xs font-bold text-white">Scorecard Anti-Bias Blinding Gate</p>
            <p className="text-[11px] text-slate-400">
              Hide panelist reviews until the viewer has submitted their own scorecard
            </p>
          </div>
          <input
            type="checkbox"
            checked={scorecardBlinding}
            onChange={(e) => setScorecardBlinding(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded bg-slate-700 border-slate-600 focus:ring-0"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/40 rounded-xl">
          <div>
            <p className="text-xs font-bold text-white">Minimum Inter-Interview Buffer Window</p>
            <p className="text-[11px] text-slate-400">
              Mandatory rest buffer enforced between consecutive interviews
            </p>
          </div>
          <select
            value={bufferMinutes}
            onChange={(e) => setBufferMinutes(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
          >
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
          </select>
        </div>
      </div>
    </div>
  );
};
