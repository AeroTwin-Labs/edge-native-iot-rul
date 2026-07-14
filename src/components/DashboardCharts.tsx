import React, { useState } from "react";
import { FleetDashboardSummary } from "../types.js";

interface DashboardChartsProps {
  summary: FleetDashboardSummary;
}

export default function DashboardCharts({ summary }: DashboardChartsProps) {
  const [activePie, setActivePie] = useState<number | null>(null);

  // --- 1. PIE CHART MATHEMATICS ---
  const { Healthy, Marginal, Critical } = summary.statusCounts;
  const totalVal = Healthy + Marginal + Critical;
  
  // Data for the pie segments
  const pieData = [
    { label: "Healthy", value: Healthy, color: "#22c55e", hoverColor: "#16a34a" },
    { label: "Marginal", value: Marginal, color: "#f97316", hoverColor: "#ea580c" },
    { label: "Critical", value: Critical, color: "#ef4444", hoverColor: "#dc2626" }
  ].filter(d => d.value > 0);

  // Render SVG Pie slices
  let accumulatedAngle = 0;
  const pieRadius = 70;
  const pieCenter = 100;

  const slices = pieData.map((slice, idx) => {
    if (totalVal === 0) return null;
    const percentage = slice.value / totalVal;
    const angle = percentage * 360;
    
    // Calculate polar coordinate points
    const radStart = (accumulatedAngle - 90) * (Math.PI / 180);
    const radEnd = (accumulatedAngle + angle - 90) * (Math.PI / 180);
    
    accumulatedAngle += angle;

    const x1 = pieCenter + pieRadius * Math.cos(radStart);
    const y1 = pieCenter + pieRadius * Math.sin(radStart);
    const x2 = pieCenter + pieRadius * Math.cos(radEnd);
    const y2 = pieCenter + pieRadius * Math.sin(radEnd);

    const largeArcFlag = angle > 180 ? 1 : 0;
    
    // Draw slice path
    const d = `
      M ${pieCenter} ${pieCenter}
      L ${x1} ${y1}
      A ${pieRadius} ${pieRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      Z
    `;

    return {
      path: d,
      color: activePie === idx ? slice.hoverColor : slice.color,
      label: slice.label,
      value: slice.value,
      percentage: (percentage * 100).toFixed(0) + "%"
    };
  });

  // --- 2. BAR CHART PREPARATION ---
  const barData = summary.componentFailureAlerts;
  const maxVal = Math.max(...barData.map(b => b.criticalCount + b.marginalCount), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Vector Pie Chart Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">FLEET HEALTH STATUS</h3>
          <p className="text-[10px] text-slate-400 font-mono">Predictive Diagnostics Summary</p>
        </div>

        {totalVal === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
            No active telemetry data loaded.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around py-4">
            {/* Pie SVG */}
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 200 200" className="w-full h-full transform hover:scale-[1.02] transition-transform duration-300">
                {slices.map((slice, idx) => {
                  if (!slice) return null;
                  return (
                    <path
                      key={idx}
                      d={slice.path}
                      fill={slice.color}
                      className="cursor-pointer stroke-white stroke-[2px] transition-all duration-300"
                      onMouseEnter={() => setActivePie(idx)}
                      onMouseLeave={() => setActivePie(null)}
                    />
                  );
                })}
                {/* Center Cutout for Donut style */}
                <circle cx="100" cy="100" r="45" fill="white" />
                <text x="100" y="98" textAnchor="middle" className="text-[14px] font-black fill-slate-800 font-mono">
                  {((Healthy / (totalVal || 1)) * 100).toFixed(1)}%
                </text>
                <text x="100" y="112" textAnchor="middle" className="text-[9px] font-mono fill-slate-400 uppercase tracking-widest font-bold">
                  HEALTHY
                </text>
              </svg>
            </div>

            {/* Labels Legend */}
            <div className="space-y-2 shrink-0 mt-4 sm:mt-0">
              {pieData.map((data, idx) => (
                <div 
                  key={data.label} 
                  className={`flex items-center space-x-3 p-1.5 rounded-lg transition-all ${
                    activePie === idx ? "bg-slate-50 scale-105" : ""
                  }`}
                  onMouseEnter={() => setActivePie(idx)}
                  onMouseLeave={() => setActivePie(null)}
                >
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: data.color }}></div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-800 block uppercase tracking-wider">{data.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-medium">
                      {data.value} AC ({((data.value / totalVal) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Real-time Safety Telemetry Update</p>
        </div>
      </div>

      {/* Vector Bar Chart Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 lg:col-span-2 flex flex-col justify-between shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">COMPONENT HEALTH DISTRIBUTION</h3>
          <p className="text-[10px] text-slate-400 font-mono">Fleet-wide component status details</p>
        </div>

        {barData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-slate-400 font-mono">
            No component alerts reported.
          </div>
        ) : (
          <div className="space-y-3.5 py-4">
            {barData.map((bar) => {
              const totalComponents = bar.healthyCount + bar.marginalCount + bar.criticalCount;
              
              return (
                <div key={bar.componentName} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">{bar.componentName}</span>
                    <span className="font-mono text-slate-500 text-[10px] font-bold">
                      <span className="text-green-600 mr-2">{bar.healthyCount} HEALTHY</span>
                      {bar.marginalCount > 0 && (
                        <span className="text-orange-600 mr-2">{bar.marginalCount} MARGINAL</span>
                      )}
                      {bar.criticalCount > 0 && (
                        <span className="text-red-600">{bar.criticalCount} CRITICAL</span>
                      )}
                    </span>
                  </div>

                  {/* Stacked Bar (Green / Orange / Red) */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                    {bar.healthyCount > 0 && (
                      <div 
                        style={{ width: `${(bar.healthyCount / totalComponents) * 100}%` }} 
                        className="bg-green-500 transition-all duration-500 hover:opacity-90"
                        title={`${bar.healthyCount} Healthy`}
                      ></div>
                    )}
                    {bar.marginalCount > 0 && (
                      <div 
                        style={{ width: `${(bar.marginalCount / totalComponents) * 100}%` }} 
                        className="bg-orange-500 transition-all duration-500 hover:opacity-90"
                        title={`${bar.marginalCount} Marginal Warning`}
                      ></div>
                    )}
                    {bar.criticalCount > 0 && (
                      <div 
                        style={{ width: `${(bar.criticalCount / totalComponents) * 100}%` }} 
                        className="bg-red-500 transition-all duration-500 hover:opacity-90"
                        title={`${bar.criticalCount} Critical Swap`}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between text-[9px] font-mono font-bold uppercase tracking-wider text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Healthy (Normal Operations)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            <span>Marginal (Early Wear)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>Critical (Attention Needed)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
