import React, { useState } from "react";
import { AircraftData } from "../types.js";
import { ArrowLeft, Cpu, ShieldAlert, Sparkles, FileText, Download, Printer, Calendar, Clock, Activity, AlertOctagon, HelpCircle, Mail, CheckCircle } from "lucide-react";
import { sendManualAlert } from "../services/emailAlertService";

interface AircraftDetailsProps {
  aircraft: AircraftData;
  onBack: () => void;
  onUpdateAircraft: (updated: AircraftData) => void;
}

export default function AircraftDetails({ aircraft, onBack, onUpdateAircraft }: AircraftDetailsProps) {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Send email alert for this aircraft
  const handleSendEmail = async () => {
    setEmailSending(true);
    const success = await sendManualAlert(aircraft);
    setEmailSending(false);
    if (success) {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 4000);
    }
  };

  // Triggers Gemini AI diagnostics in the Express backend
  const handleTriggerGemini = async () => {
    setIsAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch(`/api/aircraft/${aircraft.aircraftId}/gemini`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute Groq AI diagnostic reasoning.");
      }

      onUpdateAircraft(data);
    } catch (err: any) {
      setAiError(err.message || "Failed to compile Groq AI report.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Triggers Excel report generation & download
  const handleDownloadExcel = () => {
    const url = `/api/generate-report?format=excel&aircraftId=${encodeURIComponent(aircraft.aircraftId)}`;
    window.location.href = url;
  };

  // Triggers professional browser print dialog for PDF saving / physical printing
  const handlePrint = () => {
    window.print();
  };

  // Styling helper for status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Marginal":
        return "bg-orange-100 text-orange-700 border-orange-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  // Overall Aircraft Maintenance Recommendation text helper
  const getOverallRecommendation = () => {
    if (aircraft.status === "Critical") {
      return {
        text: "Immediate Maintenance Required Before Next Flight.",
        style: "bg-red-50 border-red-200 text-red-800",
        icon: AlertOctagon
      };
    } else if (aircraft.status === "Marginal") {
      return {
        text: "Preventive Maintenance Recommended.",
        style: "bg-orange-50 border-orange-200 text-orange-800",
        icon: ShieldAlert
      };
    } else {
      return {
        text: "Aircraft is Safe for Operation.",
        style: "bg-green-50 border-green-200 text-green-800",
        icon: Clock
      };
    }
  };

  const rec = getOverallRecommendation();
  const RecIcon = rec.icon;

  return (
    <div className="space-y-6">
      
      {/* Detail Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 print:hidden">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-2 text-slate-500 hover:text-slate-900 font-semibold text-xs"
          id="btn-back-to-fleet"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Fleet Overview</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Print PDF Button */}
          <button
            onClick={handlePrint}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
            id="btn-print-report"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF Report</span>
          </button>

          {/* Download Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all border border-slate-200"
            id="btn-download-excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Excel</span>
          </button>

          {/* Trigger Groq AI Diagnostic Button */}
          <button
            onClick={handleTriggerGemini}
            disabled={isAiLoading}
            className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-blue-500/10 disabled:opacity-50"
            id="btn-trigger-gemini-analysis"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
            <span>{isAiLoading ? "Compiling Air Safety Insights..." : "Run Groq AI Diagnosis"}</span>
          </button>

          {/* Send Email Alert Button */}
          {(aircraft.status === 'Critical' || aircraft.status === 'Marginal') && (
            <button
              onClick={handleSendEmail}
              disabled={emailSending}
              className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm disabled:opacity-50 ${
                emailSent
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : aircraft.status === 'Critical'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
              id="btn-send-email-alert"
            >
              {emailSent ? (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Alert Email Sent!</span>
                </>
              ) : (
                <>
                  <Mail className={`h-3.5 w-3.5 ${emailSending ? 'animate-pulse' : ''}`} />
                  <span>{emailSending ? 'Sending...' : `Send ${aircraft.status} Alert Email`}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* --- REPORT CONTAINER (OPTIMIZED FOR WEB DISPLAY AND PRINT) --- */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-8 space-y-8 print:border-0 print:shadow-none print:p-0" id="printable-report">
        
        {/* Print Only Header (Invisible on standard web UI) */}
        <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 uppercase tracking-tight">PREDICTIVE AIRWORTHINESS & MAINTENANCE REPORT</h1>
            <p className="text-xs text-slate-500 font-mono">AUTHORIZED COPIES ONLY - AERO CORE INTELLIGENCE SERVICES</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-blue-600 font-mono">{aircraft.aircraftId}</span>
            <p className="text-[10px] text-slate-400 font-mono">SYSTEM TIME: {new Date().toISOString()}</p>
          </div>
        </div>

        {/* 1. Aircraft Metadata Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50 border border-slate-200/50 p-6 rounded-xl print:bg-transparent print:p-0 print:border-0 print:grid-cols-4 print:gap-4">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Aircraft Profile</span>
            <p className="text-sm font-bold text-slate-900">{aircraft.aircraftId}</p>
            <p className="text-xs text-slate-500">{aircraft.model}</p>
            <p className="text-xs text-slate-400 font-mono">{aircraft.operator}</p>
          </div>
          
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Operational Metrics</span>
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-slate-900 font-mono">{aircraft.flightHours}</span>
              <span className="text-xs text-slate-500">Flight Hours</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <span className="font-bold text-slate-700 font-mono">{aircraft.cycles}</span>
              <span>Cycles</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Airworthiness Health</span>
            <div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(aircraft.status)}`}>
                {aircraft.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">Risk Matrix Level: <span className="font-bold text-slate-700">{aircraft.riskLevel}</span></p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Service Windows</span>
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Last Insp: {aircraft.lastInspectionDate}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-bold text-blue-600 font-mono">RUL: {aircraft.remainingUsefulLife} hrs</span>
            </div>
          </div>
        </div>

        {/* 2. Component-Wise Diagnostics Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Component Telemetry & ML Predictions</h4>
            <span className="text-[10px] font-mono text-slate-400">Classified using LightGBM machine learning</span>
          </div>

          <div className="overflow-x-auto border border-slate-200/60 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="px-5 py-3">Component Subsystem</th>
                  <th className="px-5 py-3">Condition</th>
                  <th className="px-5 py-3">Hours Before Service</th>
                  <th className="px-5 py-3">Confidence</th>
                  <th className="px-5 py-3">Diagnostic Reason</th>
                  <th className="px-5 py-3">Recommended Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {aircraft.components.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/40">
                    <td className="px-5 py-4 font-bold text-slate-900">
                      <div>{c.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-normal mt-0.5">{c.id}</div>
                    </td>
                    
                    {/* Status badge */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    
                    {/* RUL */}
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">{c.remainingUsefulLife} hrs</td>
                    
                    {/* Confidence */}
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-500">{(c.confidenceScore * 100).toFixed(1)}%</td>
                    
                    {/* Reason */}
                    <td className="px-5 py-4 max-w-xs text-slate-600 leading-relaxed font-sans">{c.reason}</td>
                    
                    {/* Recommended action */}
                    <td className="px-5 py-4 max-w-xs font-semibold text-blue-700 leading-relaxed">{c.recommendedAction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. GEMINI AI ANALYSIS PANEL (Renders if available) */}
        {aircraft.geminiAnalysis ? (
          <div className="border border-indigo-100 bg-indigo-50/20 rounded-xl p-6 space-y-6 print:border-0 print:bg-transparent print:p-0">
            
            {/* AI Diagnostics Section Header */}
            <div className="flex items-center space-x-2 border-b border-indigo-100/50 pb-3">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              <h4 className="text-sm font-bold text-indigo-950 uppercase tracking-tight">Groq Generative Operations Intelligence</h4>
            </div>

            {/* Grid of AI Outputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Human-Readable Explanation */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 font-mono">Airframe Synthesis Summary</h5>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/75 border border-indigo-50 p-4 rounded-lg shadow-sm print:shadow-none print:border-0 print:p-0">
                  {aircraft.geminiAnalysis.humanExplanation}
                </p>
              </div>

              {/* Maintenance Recommendation */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 font-mono">Advanced Maintenance Prescription</h5>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/75 border border-indigo-50 p-4 rounded-lg shadow-sm print:shadow-none print:border-0 print:p-0">
                  {aircraft.geminiAnalysis.maintenanceRecommendation}
                </p>
              </div>

              {/* Risk Summary */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 font-mono">Engineering Performance & Safety Risks</h5>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/75 border border-indigo-50 p-4 rounded-lg shadow-sm print:shadow-none print:border-0 print:p-0">
                  {aircraft.geminiAnalysis.riskSummary}
                </p>
              </div>

              {/* AI Generated Insights */}
              <div className="space-y-1.5">
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 font-mono">Fleet preventive Strategy Insights</h5>
                <p className="text-xs text-slate-700 leading-relaxed bg-white/75 border border-indigo-50 p-4 rounded-lg shadow-sm print:shadow-none print:border-0 print:p-0">
                  {aircraft.geminiAnalysis.aiGeneratedInsights}
                </p>
              </div>

            </div>

            {/* Formal Report Block */}
            <div className="space-y-1.5 border-t border-indigo-100/50 pt-4">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-indigo-900 font-mono">System Airworthiness Engineering Declaration</h5>
              <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-[10px] whitespace-pre-line leading-relaxed shadow-inner">
                {aircraft.geminiAnalysis.aircraftMaintenanceReport}
              </div>
            </div>

            {/* Generated At */}
            <div className="text-right text-[10px] text-slate-400 font-mono pt-1">
              DIAGNOSTIC COMPILATION DATE: {new Date(aircraft.geminiAnalysis.generatedAt).toLocaleString()}
            </div>

          </div>
        ) : (
          /* Prompts to run AI Analysis */
          <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-xl p-8 text-center space-y-3 print:hidden">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-full w-fit mx-auto">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-slate-900">Enrich Report with Groq AI Intelligence</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Connect the ML LightGBM classification limits to Groq (Llama 3.3) to auto-generate safety reasons, risk vectors, airframe engineering insights, and complete maintenance schedules.
              </p>
            </div>
            <button
              onClick={handleTriggerGemini}
              disabled={isAiLoading}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow"
            >
              <Sparkles className={`h-3.5 w-3.5 ${isAiLoading ? "animate-spin" : ""}`} />
              <span>{isAiLoading ? "Processing Core AI..." : "Execute AI Diagnostics"}</span>
            </button>
            {aiError && (
              <p className="text-xs text-rose-600 font-medium font-mono pt-1">{aiError}</p>
            )}
          </div>
        )}

        {/* 4. Overall Aircraft Recommendation Banner */}
        <div className={`p-5 rounded-xl border flex items-center space-x-4 ${rec.style}`}>
          <div className="p-3 bg-white/80 rounded-lg shrink-0">
            <RecIcon className="h-6 w-6" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 font-mono">Airworthiness Operational Decision</span>
            <h5 className="text-sm font-bold tracking-tight">{rec.text}</h5>
          </div>
        </div>

        {/* Formal Signing Section (Visible only when printed) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 text-xs text-slate-600 font-mono">
          <div className="space-y-8">
            <p>I hereby certify that the predictive risk profiles have been reviewed against established airworthiness thresholds.</p>
            <div className="border-b border-slate-400 w-64 pt-4"></div>
            <span>Aircraft Airworthiness Inspector Signature</span>
          </div>
          <div className="space-y-8">
            <p>Maintenance Operations Director authorization status for scheduled component overhaul swap operations.</p>
            <div className="border-b border-slate-400 w-64 pt-4"></div>
            <span>Operations Center Lead Signature</span>
          </div>
        </div>

      </div>

    </div>
  );
}
