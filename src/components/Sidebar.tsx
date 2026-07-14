import React from "react";
import { Plane, BarChart3, Database, ShieldCheck, Cpu, AlertTriangle, RefreshCw } from "lucide-react";

interface SidebarProps {
  onResetDemo: () => void;
  onOpenUpload: () => void;
  isPredicting: boolean;
  onTriggerPredict: () => void;
}

export default function Sidebar({ onResetDemo, onOpenUpload, isPredicting, onTriggerPredict }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#0f172a] text-white flex flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Branding Header */}
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3 bg-[#0a0f1d]">
        <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white">
          <Plane className="h-5 w-5" id="sidebar-logo-icon" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-white uppercase leading-tight">AERO-MAINTAIN</h1>
          <span className="text-[10px] font-mono text-slate-500">Fleet Operations</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 space-y-6 overflow-y-auto">
        <div>
          <span className="px-6 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">Fleet Operations</span>
          <nav className="space-y-1">
            <button
              className="w-full flex items-center space-x-3 px-6 py-3 bg-blue-600 text-white font-medium text-sm text-left transition-all hover:bg-blue-700"
              id="nav-dashboard"
            >
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </button>
          </nav>
        </div>

        <div>
          <span className="px-6 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">Operations Control</span>
          <div className="space-y-1">
            <button
              onClick={onOpenUpload}
              className="w-full flex items-center space-x-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-left text-sm"
              id="nav-upload-dataset"
            >
              <Database className="h-5 w-5 text-emerald-400" />
              <span>Datasets (Upload)</span>
            </button>
            <button
              onClick={onTriggerPredict}
              disabled={isPredicting}
              className="w-full flex items-center space-x-3 px-6 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all text-left disabled:opacity-50 text-sm"
              id="nav-predict"
            >
              <Cpu className={`h-5 w-5 text-indigo-400 ${isPredicting ? "animate-spin" : ""}`} />
              <span>{isPredicting ? "Analyzing IoT..." : "Predict Maintenance"}</span>
            </button>
          </div>
        </div>

        <div>
          <span className="px-6 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-2">System Integrations</span>
          <div className="mx-4 space-y-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-green-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-300">LightGBM V.2.4 Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0" />
              <span className="text-[11px] font-mono text-slate-300">Groq API ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-4 border-t border-slate-800 bg-[#0a0f1d]/50 space-y-2">
        <button
          onClick={onResetDemo}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg text-xs font-semibold transition-all"
          id="btn-reset-demo"
        >
          <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
          <span>Reload Demo Fleet</span>
        </button>
        <div className="text-center">
          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Authorized Personnel Only</p>
        </div>
      </div>
    </aside>
  );
}
