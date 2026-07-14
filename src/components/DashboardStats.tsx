import React from "react";
import { FleetDashboardSummary } from "../types.js";
import { Plane, Cpu, ShieldCheck, AlertTriangle, RadioReceiver } from "lucide-react";

interface DashboardStatsProps {
  summary: FleetDashboardSummary;
}

export default function DashboardStats({ summary }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Total Aircraft Card */}
      <div id="stat-total-aircraft" className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Total Aircraft</p>
          <p className="text-3xl font-black font-mono text-slate-900">{summary.totalAircraft}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-blue-600 font-bold font-mono">Active Assets</p>
          <Plane className="h-4 w-4 text-blue-500" />
        </div>
      </div>

      {/* Components Tracked Card */}
      <div id="stat-total-components" className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Components Tracked</p>
          <p className="text-3xl font-black font-mono text-slate-900">{summary.totalComponents}</p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-slate-400 font-bold font-mono">99.8% Coverage</p>
          <Cpu className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* Healthy Card */}
      <div id="stat-healthy" className="bg-white p-5 border border-slate-200 border-l-4 border-l-green-500 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-green-700 uppercase font-bold tracking-wider mb-1">Healthy</p>
          <p className="text-3xl font-black font-mono text-slate-900">{summary.healthyAircraft}</p>
        </div>
        <div>
          <div className="flex gap-1 mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-green-500 h-full rounded-full" style={{ width: `${(summary.healthyAircraft / (summary.totalAircraft || 1)) * 100}%` }}></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 font-mono">Operating Normally</span>
            <ShieldCheck className="h-4 w-4 text-green-500" />
          </div>
        </div>
      </div>

      {/* Marginal Card */}
      <div id="stat-marginal" className="bg-white p-5 border border-slate-200 border-l-4 border-l-amber-500 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Marginal</p>
          <p className="text-3xl font-black font-mono text-slate-900">{summary.marginalAircraft}</p>
        </div>
        <div>
          <div className="flex gap-1 mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(summary.marginalAircraft / (summary.totalAircraft || 1)) * 100}%` }}></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 font-mono">Early Wear Warnings</span>
            <RadioReceiver className="h-4 w-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Critical Card */}
      <div id="stat-critical" className="bg-white p-5 border border-slate-200 border-l-4 border-l-rose-500 rounded-xl shadow-sm flex flex-col justify-between">
        <div>
          <p className="text-[10px] text-rose-700 uppercase font-bold tracking-wider mb-1">Critical</p>
          <p className="text-3xl font-black font-mono text-slate-900">{summary.criticalAircraft}</p>
        </div>
        <div>
          <div className="flex gap-1 mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${(summary.criticalAircraft / (summary.totalAircraft || 1)) * 100}%` }}></div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 font-mono">Urgent Service Needed (AOG)</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
