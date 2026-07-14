import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, PieChart, Pie
} from "recharts";

// ═══════════════════════════════════════════════════════
// TYPES (mirror server response)
// ═══════════════════════════════════════════════════════
interface ComponentData {
  id: string;
  name: string;
  status: "Healthy" | "Marginal" | "Critical";
  remainingUsefulLife: number;
  confidenceScore: number;
  wearLevel: number;
  flightHours: number;
  operatingTemp: number;
  vibrationLevel: number;
  pressure: number;
  reason?: string;
  recommendedAction?: string;
}
interface AircraftData {
  aircraftId: string;
  status: "Healthy" | "Marginal" | "Critical";
  remainingUsefulLife: number;
  components: ComponentData[];
  riskLevel: "Low" | "Medium" | "High";
  lastInspectionDate: string;
  nextMaintenanceRecommendation: string;
  flightHours: number;
  cycles: number;
  model: string;
  operator: string;
}

// ═══════════════════════════════════════════════════════
// FALLBACK EMBEDDED DATASET (shown when no upload)
// ═══════════════════════════════════════════════════════
const SAMPLE_AIRCRAFT_DATA = [
  { id:"AC-100", critical:84, warning:154, healthy:777, avg_wear:35.6, avg_life:64.4, avg_temp:80.1, avg_vib:3.6, total:1015 },
  { id:"AC-101", critical:106, warning:160, healthy:746, avg_wear:37.1, avg_life:62.8, avg_temp:81.3, avg_vib:3.79, total:1012 },
  { id:"AC-102", critical:94, warning:157, healthy:766, avg_wear:36.2, avg_life:63.7, avg_temp:80.3, avg_vib:3.65, total:1017 },
  { id:"AC-103", critical:104, warning:145, healthy:727, avg_wear:37.6, avg_life:62.3, avg_temp:80.3, avg_vib:3.69, total:976 },
  { id:"AC-104", critical:96, warning:184, healthy:713, avg_wear:37.8, avg_life:62.4, avg_temp:80.7, avg_vib:3.78, total:993 },
  { id:"AC-105", critical:94, warning:160, healthy:739, avg_wear:36.1, avg_life:63.8, avg_temp:81.0, avg_vib:3.7, total:993 },
  { id:"AC-106", critical:86, warning:158, healthy:737, avg_wear:35.9, avg_life:63.9, avg_temp:80.7, avg_vib:3.67, total:981 },
  { id:"AC-107", critical:93, warning:160, healthy:737, avg_wear:36.5, avg_life:63.4, avg_temp:80.1, avg_vib:3.73, total:990 },
  { id:"AC-108", critical:104, warning:161, healthy:765, avg_wear:36.9, avg_life:63.4, avg_temp:80.6, avg_vib:3.79, total:1030 },
  { id:"AC-109", critical:90, warning:151, healthy:752, avg_wear:35.9, avg_life:64.0, avg_temp:78.7, avg_vib:3.59, total:993 }
];
const SAMPLE_COMP_TYPES = [
  { name:"Fuel System", count:1480 }, { name:"Landing Gear", count:1469 },
  { name:"APU", count:1448 }, { name:"Avionics", count:1446 },
  { name:"Hydraulic System", count:1437 }, { name:"Engine", count:1380 },
  { name:"Electrical", count:1340 }
];
const SAMPLE_CRITICAL = [
  { comp_id:"COMP-0006", type:"Landing Gear", model:"Main LG Assembly", aircraft:"AC-105", wear:97.1, temp:80.3, vib:4.52, pressure:1518, status:"Critical", orig_status:"Unserviceable", life:0.0, next_insp:"2026-09-17", reason:"Severe wear at limit", recommendation:"Ground immediately" },
  { comp_id:"COMP-0025", type:"Landing Gear", model:"Nose LG Assembly", aircraft:"AC-100", wear:94.7, temp:87.9, vib:7.48, pressure:1860, status:"Critical", orig_status:"Unserviceable", life:9.0, next_insp:"2026-06-17", reason:"Critical wear and high vibration", recommendation:"Immediate service required" },
  { comp_id:"COMP-0044", type:"Electrical", model:"Wiring Harness", aircraft:"AC-109", wear:90.3, temp:116.0, vib:9.05, pressure:1507, status:"Critical", orig_status:"Unserviceable", life:5.0, next_insp:"2025-02-08", reason:"Overtemperature condition", recommendation:"Immediate service required" },
  { comp_id:"COMP-0053", type:"APU", model:"Auxiliary Power Unit", aircraft:"AC-106", wear:89.9, temp:121.8, vib:9.86, pressure:884, status:"Critical", orig_status:"Unserviceable", life:14.3, next_insp:"2024-01-18", reason:"Extreme vibration and heat", recommendation:"Service within 24 hrs" },
  { comp_id:"COMP-0075", type:"Hydraulic System", model:"Reservoir", aircraft:"AC-101", wear:98.8, temp:140.5, vib:8.93, pressure:1136, status:"Critical", orig_status:"Unserviceable", life:0.0, next_insp:"2026-07-05", reason:"Zero remaining useful life", recommendation:"Ground immediately" },
  { comp_id:"COMP-0085", type:"Electrical", model:"Wiring Harness", aircraft:"AC-109", wear:82.7, temp:116.1, vib:9.60, pressure:3358, status:"Critical", orig_status:"Unserviceable", life:12.3, next_insp:"2026-09-11", reason:"High temp and vibration", recommendation:"Service within 24 hrs" },
  { comp_id:"COMP-09984", type:"APU", model:"Hydraulic Pump", aircraft:"AC-109", wear:95.93, temp:122.9, vib:9.98, pressure:948, status:"Critical", orig_status:"Critical", life:5.51, next_insp:"2023-11-02", reason:"Critical operational limits exceeded", recommendation:"Immediate service required" },
  { comp_id:"COMP-09988", type:"APU", model:"Hydraulic Pump", aircraft:"AC-106", wear:80.82, temp:106.4, vib:8.55, pressure:753, status:"Critical", orig_status:"Critical", life:18.24, next_insp:"2024-06-06", reason:"Exceeding vibration threshold", recommendation:"Service within 24 hrs" },
  { comp_id:"COMP-0061", type:"Electrical", model:"Generator", aircraft:"AC-104", wear:86.7, temp:105.2, vib:3.83, pressure:1851, status:"Critical", orig_status:"Under Repair", life:12.1, next_insp:"2026-09-26", reason:"Elevated wear and temperature", recommendation:"Service within 24 hrs" },
  { comp_id:"COMP-0027", type:"Hydraulic System", model:"Reservoir", aircraft:"AC-108", wear:75.2, temp:105.9, vib:7.08, pressure:2748, status:"Critical", orig_status:"Under Repair", life:27.1, next_insp:"2025-07-05", reason:"Progressive hydraulic degradation", recommendation:"Service within 72 hrs" }
];

// ═══════════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════════
const C = {
  bg: "#080c18", card: "#0f1623", border: "#1e2d45", borderLight: "#253448",
  critical: "#ef4444", criticalBg: "rgba(239,68,68,0.12)", criticalBorder: "rgba(239,68,68,0.35)",
  warning: "#f59e0b", warningBg: "rgba(245,158,11,0.12)", warningBorder: "rgba(245,158,11,0.35)",
  healthy: "#10b981", healthyBg: "rgba(16,185,129,0.12)", healthyBorder: "rgba(16,185,129,0.35)",
  accent: "#3b82f6", accentBg: "rgba(59,130,246,0.12)", accentBorder: "rgba(59,130,246,0.35)",
  purple: "#8b5cf6", purpleBg: "rgba(139,92,246,0.12)",
  text: "#f1f5f9", textSub: "#94a3b8", textMuted: "#4b6280",
  rowHover: "#131f30",
};

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════
const getRecommendation = (life: number) => {
  if (life === 0) return "GROUND IMMEDIATELY — Zero remaining life";
  if (life < 10) return "IMMEDIATE SERVICE REQUIRED";
  if (life < 20) return "Schedule service within 24 hours";
  if (life < 30) return "Schedule service within 72 hours";
  return "Monitor closely — schedule inspection";
};
const lifeColor = (life: number) => life < 20 ? C.critical : life < 50 ? C.warning : C.healthy;
const statusColor = (s: string) => s === "Critical" ? C.critical : s === "Marginal" || s === "Warning" ? C.warning : C.healthy;
const statusBg = (s: string) => s === "Critical" ? C.criticalBg : s === "Marginal" || s === "Warning" ? C.warningBg : C.healthyBg;
const statusBorder = (s: string) => s === "Critical" ? C.criticalBorder : s === "Marginal" || s === "Warning" ? C.warningBorder : C.healthyBorder;
const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
const fmt1 = (n: number) => n.toFixed(1);

// ═══════════════════════════════════════════════════════
// DERIVE CHART DATA FROM UPLOADED FLEET
// ═══════════════════════════════════════════════════════
function deriveAircraftRows(fleet: AircraftData[]) {
  return fleet.map(ac => {
    const comps = ac.components;
    const critical = comps.filter(c => c.status === "Critical").length;
    const warning = comps.filter(c => c.status === "Marginal").length;
    const healthy = comps.filter(c => c.status === "Healthy").length;
    return {
      id: ac.aircraftId,
      critical, warning, healthy,
      total: comps.length,
      avg_wear: parseFloat(fmt1(avg(comps.map(c => c.wearLevel)))),
      avg_life: parseFloat(fmt1(avg(comps.map(c => c.remainingUsefulLife)))),
      avg_temp: parseFloat(fmt1(avg(comps.map(c => c.operatingTemp)))),
      avg_vib: parseFloat(fmt1(avg(comps.map(c => c.vibrationLevel)))),
    };
  });
}

function deriveCompTypes(fleet: AircraftData[]) {
  const counts: Record<string, number> = {};
  fleet.forEach(ac => ac.components.forEach(c => { counts[c.name] = (counts[c.name] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));
}

function deriveCriticalRows(fleet: AircraftData[]) {
  const rows: any[] = [];
  fleet.forEach(ac => {
    ac.components.forEach(c => {
      if (c.status === "Critical" || c.status === "Marginal") {
        rows.push({
          comp_id: c.id, type: c.name, model: c.name, aircraft: ac.aircraftId,
          wear: parseFloat(fmt1(c.wearLevel)), temp: parseFloat(fmt1(c.operatingTemp)),
          vib: parseFloat(fmt1(c.vibrationLevel)), pressure: c.pressure,
          status: c.status === "Marginal" ? "Warning" : c.status,
          orig_status: c.status, life: parseFloat(fmt1(c.remainingUsefulLife)),
          next_insp: ac.lastInspectionDate,
          reason: c.reason || "Wear threshold exceeded",
          recommendation: c.recommendedAction || getRecommendation(c.remainingUsefulLife),
        });
      }
    });
  });
  return rows.sort((a, b) => b.wear - a.wear);
}

// ═══════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, ...style }}>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span style={{
      background: statusBg(status), color: statusColor(status),
      border: `1px solid ${statusBorder(status)}`,
      padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 0.5,
    }}>{status}</span>
  );
}

function WearBar({ pct }: { pct: number }) {
  const col = pct > 80 ? C.critical : pct > 50 ? C.warning : C.healthy;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 64, height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: col, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: col, fontWeight: 700 }}>{pct}%</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// UPLOAD TAB
// ═══════════════════════════════════════════════════════
function UploadTab({ onUploadSuccess }: { onUploadSuccess: (fleet: AircraftData[], filename: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      setError("Please upload an Excel (.xlsx, .xls) or CSV file.");
      return;
    }
    setError(null);
    setUploading(true);
    setUploadProgress(0);
    setUploadedFile(file.name);

    // Simulate progress
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 12, 85)), 300);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      clearInterval(interval);
      setUploadProgress(100);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload failed");
      }
      const data = await res.json();
      setTimeout(() => {
        setUploading(false);
        onUploadSuccess(data.fleet, file.name);
      }, 600);
    } catch (err: any) {
      clearInterval(interval);
      setUploading(false);
      setUploadProgress(0);
      setError(err.message || "Failed to upload file. Please try again.");
    }
  }, [onUploadSuccess]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div style={{ animation: "fadeIn 0.3s ease", maxWidth: 720, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: C.accentBg, border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 16px" }}>📂</div>
        <h2 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 800 }}>Upload Your Fleet Dataset</h2>
        <p style={{ margin: 0, color: C.textSub, fontSize: 14 }}>
          Upload an Excel or CSV file containing your aircraft component data.<br />
          The AI will analyze it and populate all dashboard tabs with real insights.
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? C.accent : C.borderLight}`,
          borderRadius: 16, padding: "48px 32px", textAlign: "center",
          cursor: uploading ? "default" : "pointer",
          background: isDragging ? C.accentBg : C.card,
          transition: "all 0.2s ease",
          marginBottom: 24,
        }}
      >
        <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onInputChange} style={{ display: "none" }} />
        {uploading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <div style={{ width: 48, height: 48, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            <div style={{ width: "100%", maxWidth: 320 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: C.textSub }}>
                <span>Analyzing {uploadedFile}…</span>
                <span style={{ fontFamily: "monospace", color: C.accent }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, background: C.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ width: `${uploadProgress}%`, height: "100%", background: C.accent, borderRadius: 3, transition: "width 0.3s ease" }} />
              </div>
            </div>
            <p style={{ margin: 0, color: C.textSub, fontSize: 13 }}>Running ML prediction models on your data…</p>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, color: C.text }}>
              {isDragging ? "Drop your file here!" : "Drag & drop your dataset here"}
            </p>
            <p style={{ margin: "0 0 16px", color: C.textSub, fontSize: 13 }}>or click to browse your files</p>
            <div style={{ display: "inline-flex", gap: 8 }}>
              {[".xlsx", ".xls", ".csv"].map(ext => (
                <span key={ext} style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>{ext}</span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: C.criticalBg, border: `1px solid ${C.criticalBorder}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <span style={{ color: C.critical, fontSize: 13, fontWeight: 600 }}>{error}</span>
        </div>
      )}

      {/* Expected Format Guide */}
      <Card style={{ padding: 24 }}>
        <h4 style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 1 }}>Expected Column Format</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["AircraftID", "Aircraft identifier (e.g. AC-100)"],
            ["ComponentName", "Component type (e.g. Engine)"],
            ["WearLevel", "Wear percentage (0–100)"],
            ["OperatingTemp", "Temperature in °C"],
            ["VibrationLevel", "Vibration in mm/s"],
            ["Pressure", "Pressure in psi"],
            ["FlightHours", "Total flight hours"],
            ["Cycles", "Flight cycle count"],
            ["Model", "Aircraft model (optional)"],
            ["Operator", "Airline/operator (optional)"],
          ].map(([col, desc]) => (
            <div key={col} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: C.accent, minWidth: 130, flexShrink: 0 }}>{col}</span>
              <span style={{ fontSize: 11, color: C.textSub }}>{desc}</span>
            </div>
          ))}
        </div>
        <p style={{ margin: "16px 0 0", fontSize: 11, color: C.textMuted }}>
          💡 Column names are flexible — the system auto-detects common variations. Extra columns are ignored.
        </p>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TOOLTIP CUSTOM
// ═══════════════════════════════════════════════════════
const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 12 }}>
      <p style={{ margin: "0 0 8px", fontWeight: 700, color: C.text }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ margin: "3px 0", color: p.color }}>{p.name}: <strong>{p.value}</strong></p>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════
export default function AeroGuardDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadedFleet, setUploadedFleet] = useState<AircraftData[] | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  // Tab 2 filters
  const [filterAircraft, setFilterAircraft] = useState("All");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("wear");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ROWS = 10;

  // Tab 4
  const [alertEmail, setAlertEmail] = useState("");
  const [alertGenerated, setAlertGenerated] = useState(false);
  const [alertTimestamp, setAlertTimestamp] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => { setTimeout(() => setLoading(false), 1200); }, []);

  // Derive data from upload or fall back to sample
  const isLiveData = !!uploadedFleet;
  const aircraftRows = useMemo(() => isLiveData ? deriveAircraftRows(uploadedFleet!) : SAMPLE_AIRCRAFT_DATA, [uploadedFleet, isLiveData]);
  const compTypes = useMemo(() => isLiveData ? deriveCompTypes(uploadedFleet!) : SAMPLE_COMP_TYPES, [uploadedFleet, isLiveData]);
  const allCriticalRows = useMemo(() => isLiveData ? deriveCriticalRows(uploadedFleet!) : SAMPLE_CRITICAL, [uploadedFleet, isLiveData]);

  // Totals
  const totalComponents = useMemo(() => isLiveData ? (uploadedFleet?.reduce((s, ac) => s + ac.components.length, 0) ?? 0) : 10000, [uploadedFleet, isLiveData]);
  const totalCritical = useMemo(() => aircraftRows.reduce((s, r) => s + r.critical, 0), [aircraftRows]);
  const totalWarning = useMemo(() => aircraftRows.reduce((s, r) => s + r.warning, 0), [aircraftRows]);
  const totalHealthy = useMemo(() => aircraftRows.reduce((s, r) => s + r.healthy, 0), [aircraftRows]);

  // Unique type list for filter
  const typeOptions = useMemo(() => {
    const names = new Set(allCriticalRows.map(r => r.type));
    return Array.from(names).sort();
  }, [allCriticalRows]);

  // Filtered components
  const filteredComponents = useMemo(() => {
    let data = [...allCriticalRows];
    if (filterAircraft !== "All") data = data.filter(c => c.aircraft === filterAircraft);
    if (filterType !== "All") data = data.filter(c => c.type === filterType);
    if (filterStatus !== "All") data = data.filter(c => c.status === filterStatus);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(c => c.comp_id.toLowerCase().includes(q) || (c.model || "").toLowerCase().includes(q));
    }
    data.sort((a, b) => {
      const av = (a as any)[sortField], bv = (b as any)[sortField];
      if (typeof av === "number") return sortDir === "asc" ? av - bv : bv - av;
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    return data;
  }, [allCriticalRows, filterAircraft, filterType, filterStatus, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredComponents.length / ROWS));
  const paginated = filteredComponents.slice((currentPage - 1) * ROWS, currentPage * ROWS);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const handleUploadSuccess = (fleet: AircraftData[], filename: string) => {
    setUploadedFleet(fleet);
    setUploadedFilename(filename);
    setFilterAircraft("All"); setFilterType("All"); setFilterStatus("All");
    setSearchQuery(""); setCurrentPage(1); setSortField("wear"); setSortDir("desc");
    setAlertGenerated(false);
    setActiveTab(1); // Jump to Fleet Overview after upload
  };

  const navigateToAircraft = (id: string) => {
    setFilterAircraft(id); setFilterStatus("All"); setFilterType("All");
    setSearchQuery(""); setCurrentPage(1); setActiveTab(2);
  };

  const getAlertText = () => {
    const rows = allCriticalRows.slice(0, 30);
    let txt = `═══ AEROGUARD CRITICAL MAINTENANCE ALERT ═══\nGenerated: ${alertTimestamp}\n`;
    if (uploadedFilename) txt += `Dataset: ${uploadedFilename}\n`;
    txt += `Total Critical/Warning Components: ${totalCritical + totalWarning}\n\n`;
    rows.forEach(c => {
      txt += `Aircraft: ${c.aircraft} | Component: ${c.comp_id} | Type: ${c.type}\n`;
      txt += `  Wear: ${c.wear}% | Life: ${c.life}% | Temp: ${c.temp}°C | Vibration: ${c.vib} mm/s | Pressure: ${c.pressure} psi\n`;
      txt += `  Reason: ${c.reason || "N/A"}\n`;
      txt += `  → ${getRecommendation(c.life)}\n\n`;
    });
    return txt;
  };

  const TABS = [
    { label: "Upload Dataset", icon: "📂" },
    { label: "Fleet Overview", icon: "✈" },
    { label: "Component Analysis", icon: "⚙" },
    { label: "Sensor Analytics", icon: "📊" },
    { label: "Alert Center", icon: "🚨" },
  ];

  const CHART_COLORS = [C.accent, "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", C.warning, C.healthy, "#06b6d4", "#14b8a6"];

  if (loading) return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      <div style={{ width: 56, height: 56, border: `3px solid ${C.border}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      <p style={{ color: C.textSub, fontFamily: "monospace", fontSize: 13, letterSpacing: 1 }}>INITIALIZING AEROGUARD AI…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "system-ui,-apple-system,sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .hov:hover{background:${C.rowHover}!important}
        .card-hov{transition:all .2s ease}
        .card-hov:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.4)!important}
        .tab-btn{transition:all .15s ease;cursor:pointer;border:none;background:transparent}
        .tab-btn:hover{background:rgba(59,130,246,.1)!important}
        .btn{transition:all .15s ease;cursor:pointer}
        .btn:hover{filter:brightness(1.1);transform:scale(1.02)}
        .btn:active{transform:scale(.98)}
        input,select{transition:border-color .2s}
        input:focus,select:focus{outline:none;border-color:${C.accent}!important}
        ::-webkit-scrollbar{height:5px;width:5px}
        ::-webkit-scrollbar-thumb{background:${C.border};border-radius:3px}
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#070b15", borderBottom: `1px solid ${C.border}`, padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${C.accent},#6366f1)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 0 20px ${C.accentBg}` }}>✈</div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>AeroGuard AI</h1>
            <p style={{ margin: 0, fontSize: 10, color: C.textSub, fontFamily: "monospace", letterSpacing: 1.5, textTransform: "uppercase" }}>Predictive Maintenance System</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {uploadedFilename && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.healthyBg, border: `1px solid ${C.healthyBorder}`, padding: "6px 14px", borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>📄</span>
              <span style={{ fontSize: 11, color: C.healthy, fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{uploadedFilename}</span>
            </div>
          )}
          <span style={{ background: C.healthyBg, color: C.healthy, padding: "5px 14px", borderRadius: 20, fontSize: 11, fontWeight: 700, border: `1px solid ${C.healthyBorder}`, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.healthy, animation: "pulse 2s infinite", display: "inline-block" }} />
            SYSTEM ONLINE
          </span>
        </div>
      </header>

      {/* TAB BAR */}
      <nav style={{ background: "#070b15", borderBottom: `1px solid ${C.border}`, padding: "0 32px", display: "flex", gap: 0, overflowX: "auto" }}>
        {TABS.map((tab, i) => (
          <button key={i} className="tab-btn" onClick={() => setActiveTab(i)} style={{
            color: activeTab === i ? C.text : C.textSub,
            padding: "13px 22px", fontSize: 13,
            fontWeight: activeTab === i ? 700 : 500,
            borderBottom: `2px solid ${activeTab === i ? C.accent : "transparent"}`,
            display: "flex", alignItems: "center", gap: 7, whiteSpace: "nowrap",
          }}>
            <span>{tab.icon}</span>{tab.label}
            {i === 0 && !uploadedFleet && <span style={{ background: C.accent, color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>START</span>}
            {i === 0 && uploadedFleet && <span style={{ background: C.healthyBg, color: C.healthy, fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 4, marginLeft: 4, border: `1px solid ${C.healthyBorder}` }}>✓</span>}
          </button>
        ))}
      </nav>

      {/* SAMPLE DATA BANNER */}
      {!isLiveData && activeTab !== 0 && (
        <div style={{ background: "rgba(245,158,11,0.08)", borderBottom: `1px solid rgba(245,158,11,0.2)`, padding: "10px 32px", display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
          <span style={{ fontSize: 16 }}>💡</span>
          <span style={{ color: C.warning, fontWeight: 600 }}>Showing sample data.</span>
          <span style={{ color: C.textSub }}>Upload your fleet dataset to see real AI-powered insights.</span>
          <button className="btn" onClick={() => setActiveTab(0)} style={{ marginLeft: "auto", background: C.warningBg, color: C.warning, border: `1px solid ${C.warningBorder}`, padding: "4px 14px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Upload Now →</button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main style={{ padding: "28px 32px", maxWidth: 1440, margin: "0 auto" }}>

        {/* ══════════════════════════════════════ */}
        {/* TAB 0: UPLOAD                          */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 0 && <UploadTab onUploadSuccess={handleUploadSuccess} />}

        {/* ══════════════════════════════════════ */}
        {/* TAB 1: FLEET OVERVIEW                  */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 1 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Components", value: totalComponents.toLocaleString(), color: C.accent, icon: "⚙", sub: `${aircraftRows.length} aircraft` },
                { label: "Critical", value: totalCritical.toLocaleString(), color: C.critical, icon: "🔴", sub: `${((totalCritical / totalComponents) * 100).toFixed(1)}% of fleet` },
                { label: "Warning", value: totalWarning.toLocaleString(), color: C.warning, icon: "🟡", sub: `${((totalWarning / totalComponents) * 100).toFixed(1)}% of fleet` },
                { label: "Healthy", value: totalHealthy.toLocaleString(), color: C.healthy, icon: "🟢", sub: `${((totalHealthy / totalComponents) * 100).toFixed(1)}% of fleet` },
              ].map((s, i) => (
                <Card key={i} style={{ padding: 22, borderLeft: `4px solid ${s.color}`, cursor: "default" }} >
                  <div className="card-hov" style={{ padding: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <span style={{ fontSize: 11, color: C.textSub, textTransform: "uppercase", fontWeight: 700, letterSpacing: 1 }}>{s.label}</span>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: 38, fontWeight: 900, color: s.color, fontFamily: "monospace", lineHeight: 1 }}>{s.value}</p>
                    <p style={{ margin: 0, fontSize: 11, color: C.textMuted }}>{s.sub}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Fleet Health Bar */}
            <Card style={{ padding: 20, marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Fleet Health Distribution</h3>
                <span style={{ fontSize: 11, color: C.textSub, fontFamily: "monospace" }}>{totalComponents.toLocaleString()} total components</span>
              </div>
              <div style={{ display: "flex", height: 28, borderRadius: 8, overflow: "hidden" }}>
                {[
                  { pct: totalCritical / totalComponents, color: C.critical, label: `${((totalCritical / totalComponents) * 100).toFixed(1)}%` },
                  { pct: totalWarning / totalComponents, color: C.warning, label: `${((totalWarning / totalComponents) * 100).toFixed(1)}%` },
                  { pct: totalHealthy / totalComponents, color: C.healthy, label: `${((totalHealthy / totalComponents) * 100).toFixed(1)}%` },
                ].map((s, i) => (
                  <div key={i} style={{ width: `${s.pct * 100}%`, background: s.color, display: "flex", alignItems: "center", justifyContent: "center", transition: "width 0.8s ease" }}>
                    {s.pct > 0.05 && <span style={{ fontSize: 10, fontWeight: 800, color: i === 1 ? "#000" : "#fff" }}>{s.label}</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 20, marginTop: 10, fontSize: 11, color: C.textSub }}>
                {[["🔴", "Critical", totalCritical, C.critical], ["🟡", "Warning", totalWarning, C.warning], ["🟢", "Healthy", totalHealthy, C.healthy]].map(([icon, label, count, color]) => (
                  <span key={label as string} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: color as string, display: "inline-block" }} />
                    {label} ({(count as number).toLocaleString()})
                  </span>
                ))}
              </div>
            </Card>

            {/* Aircraft Cards */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Aircraft Fleet Status</h3>
              <span style={{ fontSize: 11, color: C.textSub }}>— Click any aircraft to see its components</span>
              {isLiveData && <span style={{ background: C.healthyBg, color: C.healthy, padding: "2px 10px", borderRadius: 5, fontSize: 10, fontWeight: 700, border: `1px solid ${C.healthyBorder}` }}>LIVE DATA</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 16 }}>
              {aircraftRows.map(ac => {
                const critPct = (ac.critical / ac.total) * 100;
                const warnPct = (ac.warning / ac.total) * 100;
                const healthyPct = (ac.healthy / ac.total) * 100;
                return (
                  <div key={ac.id} className="card-hov" onClick={() => navigateToAircraft(ac.id)}
                    style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.critical}`, borderRadius: 14, padding: 20, cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.3)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 18, fontWeight: 900, fontFamily: "monospace", letterSpacing: 1 }}>{ac.id}</span>
                      <span style={{ background: C.criticalBg, color: C.critical, padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, border: `1px solid ${C.criticalBorder}`, animation: "pulse 2s infinite" }}>● CRITICAL</span>
                    </div>
                    <div style={{ display: "flex", height: 7, borderRadius: 4, overflow: "hidden", marginBottom: 14, gap: 1 }}>
                      <div style={{ width: `${critPct}%`, background: C.critical, borderRadius: "4px 0 0 4px" }} />
                      <div style={{ width: `${warnPct}%`, background: C.warning }} />
                      <div style={{ width: `${healthyPct}%`, background: C.healthy, borderRadius: "0 4px 4px 0" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {[
                        ["Avg Wear", `${ac.avg_wear}%`, C.warning],
                        ["Remaining Life", `${ac.avg_life}%`, C.healthy],
                        ["Avg Temp", `${ac.avg_temp}°C`, C.text],
                        ["Avg Vibration", `${ac.avg_vib} mm/s`, C.text],
                      ].map(([lbl, val, col]) => (
                        <div key={lbl as string} style={{ background: "rgba(255,255,255,0.025)", padding: "8px 10px", borderRadius: 8, border: `1px solid ${C.border}` }}>
                          <span style={{ display: "block", fontSize: 9, color: C.textMuted, textTransform: "uppercase", fontWeight: 700, marginBottom: 3, letterSpacing: 0.5 }}>{lbl}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: col as string }}>{val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>
                      <span>🔴 {ac.critical}  🟡 {ac.warning}  🟢 {ac.healthy}</span>
                      <span>{ac.total.toLocaleString()} comps</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* TAB 2: COMPONENT ANALYSIS              */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 2 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Filters */}
            <Card style={{ padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                {[
                  { label: "Aircraft", val: filterAircraft, set: setFilterAircraft, opts: [["All", "All Aircraft"], ...aircraftRows.map(ac => [ac.id, ac.id])] },
                  { label: "Component Type", val: filterType, set: setFilterType, opts: [["All", "All Types"], ...typeOptions.map(t => [t, t])] },
                  { label: "Status", val: filterStatus, set: setFilterStatus, opts: [["All", "All Status"], ["Critical", "Critical"], ["Warning", "Warning"], ["Healthy", "Healthy"]] },
                ].map(({ label, val, set, opts }) => (
                  <div key={label} style={{ flex: "1 1 180px" }}>
                    <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>{label}</label>
                    <select value={val} onChange={e => { (set as any)(e.target.value); setCurrentPage(1); }}
                      style={{ width: "100%", padding: "9px 12px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }}>
                      {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                ))}
                <div style={{ flex: "1 1 240px" }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>Search</label>
                  <input type="text" placeholder="Search Comp ID or model…" value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    style={{ width: "100%", padding: "9px 12px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12 }} />
                </div>
              </div>
            </Card>

            {/* Summary mini-cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Critical Found", count: filteredComponents.filter(c => c.status === "Critical").length, color: C.critical, bg: C.criticalBg, border: C.criticalBorder },
                { label: "Warning Found", count: filteredComponents.filter(c => c.status === "Warning" || c.status === "Marginal").length, color: C.warning, bg: C.warningBg, border: C.warningBorder },
                { label: "Total Showing", count: filteredComponents.length, color: C.accent, bg: C.accentBg, border: C.accentBorder },
              ].map(s => (
                <div key={s.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: "14px 18px" }}>
                  <span style={{ fontSize: 10, color: C.textSub, textTransform: "uppercase", fontWeight: 700 }}>{s.label}</span>
                  <p style={{ margin: "6px 0 0", fontSize: 30, fontWeight: 900, color: s.color, fontFamily: "monospace" }}>{s.count}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <Card style={{ overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 1020 }}>
                  <thead>
                    <tr style={{ background: "#09101e", borderBottom: `1px solid ${C.border}` }}>
                      {[
                        ["comp_id", "Comp ID"], ["aircraft", "Aircraft"], ["type", "Type"], ["model", "Model"],
                        ["wear", "Wear %"], ["temp", "Temp °C"], ["vib", "Vibration"], ["life", "Life %"],
                        ["status", "Status"], ["next_insp", "Next Insp."],
                      ].map(([field, label]) => (
                        <th key={field} onClick={() => handleSort(field)}
                          style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: sortField === field ? C.accent : C.textSub, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}>
                          {label} {sortField === field ? (sortDir === "asc" ? "↑" : "↓") : <span style={{ opacity: 0.3 }}>↕</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.length === 0 ? (
                      <tr><td colSpan={10} style={{ padding: 48, textAlign: "center", color: C.textSub }}>No components match your filters.</td></tr>
                    ) : paginated.map(c => (
                      <tr key={c.comp_id} className="hov" style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `4px solid ${statusColor(c.status)}` }}>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, fontSize: 11 }}>{c.comp_id}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: C.accent }}>{c.aircraft}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11 }}>{c.type}</td>
                        <td style={{ padding: "12px 14px", fontSize: 11, color: C.textSub, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.model}</td>
                        <td style={{ padding: "12px 14px" }}><WearBar pct={c.wear} /></td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: c.temp > 100 ? C.critical : c.temp > 85 ? C.warning : C.text }}>{c.temp}°C</td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 11, color: c.vib > 8 ? C.critical : c.vib > 5 ? C.warning : C.text }}>{c.vib}</td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 800, color: lifeColor(c.life), fontSize: 12 }}>{c.life}%</td>
                        <td style={{ padding: "12px 14px" }}><StatusBadge status={c.status} /></td>
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 10, color: C.textSub }}>{c.next_insp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.textSub }}>
                <span>Showing {filteredComponents.length === 0 ? 0 : (currentPage - 1) * ROWS + 1}–{Math.min(currentPage * ROWS, filteredComponents.length)} of {filteredComponents.length}</span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button className="btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                    style={{ padding: "5px 14px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, opacity: currentPage === 1 ? 0.35 : 1 }}>← Prev</button>
                  <span style={{ padding: "5px 12px", background: C.accent, color: "#fff", borderRadius: 6, fontWeight: 700, minWidth: 32, textAlign: "center" }}>{currentPage}</span>
                  <button className="btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    style={{ padding: "5px 14px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 11, opacity: currentPage === totalPages ? 0.35 : 1 }}>Next →</button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* TAB 3: SENSOR ANALYTICS                */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 3 && (
          <div style={{ animation: "fadeIn 0.3s ease", display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700 }}>Component Count by Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={compTypes} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="name" tick={{ fill: C.textSub, fontSize: 11 }} />
                  <YAxis tick={{ fill: C.textSub, fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Components" radius={[5, 5, 0, 0]}>
                    {compTypes.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700 }}>Status Distribution per Aircraft</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aircraftRows} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis dataKey="id" tick={{ fill: C.textSub, fontSize: 11 }} />
                  <YAxis tick={{ fill: C.textSub, fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.textSub }} />
                  <Bar dataKey="critical" name="Critical" fill={C.critical} stackId="a" />
                  <Bar dataKey="warning" name="Warning" fill={C.warning} stackId="a" />
                  <Bar dataKey="healthy" name="Healthy" fill={C.healthy} stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card style={{ padding: 24 }}>
              <h3 style={{ margin: "0 0 18px", fontSize: 14, fontWeight: 700 }}>Average Wear Level per Aircraft</h3>
              <ResponsiveContainer width="100%" height={Math.max(300, aircraftRows.length * 38)}>
                <BarChart data={aircraftRows} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                  <XAxis type="number" tick={{ fill: C.textSub, fontSize: 11 }} domain={['auto', 'auto']} />
                  <YAxis type="category" dataKey="id" tick={{ fill: C.textSub, fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="avg_wear" name="Avg Wear %" radius={[0, 5, 5, 0]}>
                    {aircraftRows.map((ac, i) => <Cell key={i} fill={ac.avg_wear > 37 ? C.critical : ac.avg_wear > 36 ? C.warning : C.healthy} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}

        {/* ══════════════════════════════════════ */}
        {/* TAB 4: ALERT CENTER                    */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 4 && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <Card style={{ padding: 24, marginBottom: 24 }}>
              <h3 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22 }}>🚨</span> Critical Alert Generator
              </h3>
              <p style={{ margin: "0 0 20px", fontSize: 12, color: C.textSub }}>
                Generates a single consolidated report covering <strong style={{ color: C.critical }}>{allCriticalRows.length}</strong> critical/warning components across all aircraft.
              </p>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px" }}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: C.textSub, textTransform: "uppercase", marginBottom: 6, letterSpacing: 1 }}>Maintenance Team Email</label>
                  <input type="email" placeholder="maintenance@airline.com" value={alertEmail} onChange={e => setAlertEmail(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", background: C.bg, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13 }} />
                </div>
                <button className="btn" onClick={() => { setAlertTimestamp(new Date().toLocaleString()); setAlertGenerated(true); }}
                  style={{ padding: "10px 28px", background: C.critical, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  Generate Alert Report
                </button>
              </div>
            </Card>

            {alertGenerated && (
              <Card style={{ borderColor: C.criticalBorder, borderLeft: `4px solid ${C.critical}`, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 800, color: C.critical }}>⚠ CRITICAL MAINTENANCE ALERT REPORT</h4>
                    <p style={{ margin: 0, fontSize: 11, color: C.textSub, fontFamily: "monospace" }}>Generated: {alertTimestamp}</p>
                    {uploadedFilename && <p style={{ margin: "2px 0 0", fontSize: 11, color: C.textSub, fontFamily: "monospace" }}>Dataset: {uploadedFilename}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn" onClick={async () => { await navigator.clipboard.writeText(getAlertText()); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }}
                      style={{ padding: "8px 16px", background: copySuccess ? C.healthyBg : C.accentBg, color: copySuccess ? C.healthy : C.accent, border: `1px solid ${copySuccess ? C.healthyBorder : C.accentBorder}`, borderRadius: 8, fontSize: 11, fontWeight: 700 }}>
                      {copySuccess ? "✓ Copied!" : "📋 Copy All"}
                    </button>
                    <a href={`mailto:${alertEmail}?subject=${encodeURIComponent(`CRITICAL: Aircraft Maintenance Alert - ${alertTimestamp}`)}&body=${encodeURIComponent(getAlertText())}`}
                      className="btn" style={{ padding: "8px 16px", background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBorder}`, borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                      ✉ Open in Email Client
                    </a>
                  </div>
                </div>

                <div style={{ background: C.criticalBg, border: `1px solid ${C.criticalBorder}`, borderRadius: 8, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: C.critical, fontWeight: 700 }}>🔴 Critical: {totalCritical.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: C.warning, fontWeight: 700 }}>🟡 Warning: {totalWarning.toLocaleString()}</span>
                  <span style={{ fontSize: 12, color: C.textSub }}>Aircraft affected: {new Set(allCriticalRows.map(r => r.aircraft)).size}</span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, minWidth: 900 }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, background: "#09101e" }}>
                        {["Aircraft", "Comp ID", "Type", "Wear %", "Life %", "Temp °C", "Vibration", "Pressure", "Reason", "Recommended Action"].map(h => (
                          <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 9, fontWeight: 700, color: C.textSub, textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allCriticalRows.map(c => (
                        <tr key={c.comp_id} className="hov" style={{ borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${statusColor(c.status)}` }}>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 700, color: C.accent }}>{c.aircraft}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 10 }}>{c.comp_id}</td>
                          <td style={{ padding: "10px 12px" }}>{c.type}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: C.critical, fontWeight: 700 }}>{c.wear}%</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", fontWeight: 800, color: lifeColor(c.life) }}>{c.life}%</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: c.temp > 100 ? C.critical : C.text }}>{c.temp}°C</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", color: c.vib > 8 ? C.critical : C.text }}>{c.vib}</td>
                          <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 10 }}>{c.pressure}</td>
                          <td style={{ padding: "10px 12px", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: C.textSub }}>{c.reason}</td>
                          <td style={{ padding: "10px 12px", fontSize: 10, fontWeight: 700, color: c.life === 0 ? C.critical : c.life < 10 ? C.critical : c.life < 20 ? C.warning : C.textSub, whiteSpace: "nowrap" }}>
                            {getRecommendation(c.life)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer style={{ background: "#070b15", borderTop: `1px solid ${C.border}`, padding: "12px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 10, fontFamily: "monospace", color: C.textMuted, marginTop: 48 }}>
        <div style={{ display: "flex", gap: 20 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.healthy, display: "inline-block", animation: "pulse 2s infinite" }} />ENGINE ONLINE
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: C.accent, display: "inline-block" }} />
            {isLiveData ? `LIVE DATA: ${uploadedFilename}` : "SAMPLE DATA MODE"}
          </span>
        </div>
        <span>AEROGUARD PREDICTIVE MAINTENANCE AI v2.1</span>
      </footer>
    </div>
  );
}
