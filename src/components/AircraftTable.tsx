import React, { useState } from "react";
import { AircraftData } from "../types.js";
import { Search, SlidersHorizontal, ChevronRight, Activity, Calendar, Shield, Clock } from "lucide-react";

interface AircraftTableProps {
  aircraftList: AircraftData[];
  onSelectAircraft: (id: string) => void;
}

export default function AircraftTable({ aircraftList, onSelectAircraft }: AircraftTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Filtering Logic
  const filteredList = aircraftList.filter((ac) => {
    const matchesSearch = ac.aircraftId.toLowerCase().includes(search.toLowerCase()) || 
                          ac.model.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || ac.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">ACTIVE FLEET INVENTORY</h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Real-time airworthiness and maintenance monitoring</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Aircraft ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-slate-200 rounded-md text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-56 font-medium"
              id="input-aircraft-search"
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center space-x-2 border border-slate-200 rounded-md px-3 py-1.5 bg-white">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs text-slate-600 bg-transparent focus:outline-none cursor-pointer border-none p-0 pr-6 font-semibold uppercase tracking-wider"
              id="dropdown-status-filter"
            >
              <option value="All">Filter: ALL STATUS</option>
              <option value="Healthy">HEALTHY (OPERATIONAL)</option>
              <option value="Marginal">MARGINAL (MONITOR)</option>
              <option value="Critical">CRITICAL (AOG)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              <th className="px-6 py-3">Aircraft ID</th>
              <th className="px-6 py-3">Model Ref</th>
              <th className="px-6 py-3">Operator</th>
              <th className="px-6 py-3 text-center">Overall Status</th>
              <th className="px-6 py-3">Hours Before Service</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-mono text-[11px]">
                  No active aircraft matching search queries or filters.
                </td>
              </tr>
            ) : (
              filteredList.map((ac) => {
                // Class configurations for status badges according to theme
                let badgeClass = "bg-green-100 text-green-700";
                if (ac.status === "Critical") {
                  badgeClass = "bg-red-100 text-red-700 animate-pulse";
                } else if (ac.status === "Marginal") {
                  badgeClass = "bg-orange-100 text-orange-700";
                }

                return (
                  <tr 
                    key={ac.aircraftId} 
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                    onClick={() => onSelectAircraft(ac.aircraftId)}
                  >
                    {/* Aircraft ID */}
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">{ac.aircraftId}</td>

                    {/* Aircraft Model */}
                    <td className="px-6 py-4 text-slate-500 font-medium">{ac.model}</td>

                    {/* Operator */}
                    <td className="px-6 py-4 text-slate-400 font-mono text-[10px] uppercase">{ac.operator}</td>

                    {/* Overall Status Badge */}
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}>
                        {ac.status}
                      </span>
                    </td>

                    {/* Remaining Useful Life */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className={`font-bold font-mono text-[11px] ${
                          ac.status === 'Critical' ? 'text-red-600' : ac.status === 'Marginal' ? 'text-orange-600' : 'text-slate-700'
                        }`}>
                          {ac.remainingUsefulLife} Hrs
                        </span>
                      </div>
                    </td>

                    {/* View Details Button */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAircraft(ac.aircraftId);
                        }}
                        className="px-3 py-1 border border-slate-200 rounded text-blue-600 font-bold hover:bg-blue-50 hover:border-blue-300 transition-colors"
                        id={`btn-view-details-${ac.aircraftId}`}
                      >
                        View Detail
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
