import React, { useState, useRef } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle, Download } from "lucide-react";

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (fleet: any[]) => void;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generates CSV template on the fly and downloads it
  const downloadCSVTemplate = () => {
    const headers = "AircraftID,Model,Operator,FlightHours,Cycles,ComponentName,WearLevel,OperatingTemp,VibrationLevel,Pressure,LastInspectionDate\n";
    const rows = [
      "AC-7023,Boeing 737-800,AeroGlobal,12450,6120,Engine,85,118,8.6,2400,2026-06-15",
      "AC-7023,Boeing 737-800,AeroGlobal,12450,6120,Landing Gear,32,45,2.1,2900,2026-06-15",
      "AC-7023,Boeing 737-800,AeroGlobal,12450,6120,Brake Unit,45,88,3.4,1950,2026-06-15",
      "AC-7023,Boeing 737-800,AeroGlobal,12450,6120,APU,68,94,5.6,1200,2026-06-15",
      "AC-1055,Bombardier CRJ-900,RegionalExpress,14200,9140,Engine,41,88,3.2,2420,2026-05-28",
      "AC-1055,Bombardier CRJ-900,RegionalExpress,14200,9140,Landing Gear,82,58,8.5,2950,2026-05-28",
      "AC-1055,Bombardier CRJ-900,RegionalExpress,14200,9140,Brake Unit,88,110,4.5,950,2026-05-28",
      "AC-1055,Bombardier CRJ-900,RegionalExpress,14200,9140,APU,40,75,3.0,1120,2026-05-28"
    ].join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Aviation_IoT_Maintenance_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const extension = droppedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
        setFile(droppedFile);
        setStatus(null);
      } else {
        setStatus({ type: 'error', message: 'Unsupported file format. Please upload a CSV or Excel sheet (.xlsx, .xls).' });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select or drop an IoT dataset first.' });
      return;
    }

    setIsUploading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process data.");
      }

      setStatus({ type: 'success', message: `Successfully preprocessed dataset. Modeled ${data.count} aircraft telemetry profiles.` });
      setTimeout(() => {
        onUploadSuccess(data.fleet);
        onClose();
      }, 1500);
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || "Network error. Backend connection failed." });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-950 text-base">Upload Fleet Telemetry Dataset</h3>
            <p className="text-xs text-slate-500">Provide CSV/Excel logs containing sensor telemetry data</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Instructions & Template Downloads */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between space-x-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-900 block">Fleet Data Requirements</span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Ensure columns match: <code className="font-mono bg-slate-200 px-1 rounded">AircraftID</code>, <code className="font-mono bg-slate-200 px-1 rounded">ComponentName</code>, <code className="font-mono bg-slate-200 px-1 rounded">WearLevel</code>, <code className="font-mono bg-slate-200 px-1 rounded">OperatingTemp</code>, etc.
              </p>
            </div>
            <button
              onClick={downloadCSVTemplate}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-medium transition-all shrink-0 border border-blue-200/40"
              id="btn-download-template"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV Template</span>
            </button>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv, .xlsx, .xls"
              className="hidden"
            />

            <div className={`p-3 rounded-full mb-3 ${dragActive ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
              <Upload className="h-6 w-6" />
            </div>

            {file ? (
              <div className="text-center">
                <span className="text-sm font-semibold text-slate-950 flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4 text-slate-500" />
                  <span>{file.name}</span>
                </span>
                <span className="text-xs text-slate-400 block mt-1">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-950">Drag & drop your dataset here</p>
                <p className="text-xs text-slate-400">or click to browse from files</p>
              </div>
            )}
          </div>

          {/* Feedback Message */}
          {status && (
            <div className={`p-4 rounded-lg flex items-start space-x-3 text-xs leading-relaxed border ${
              status.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60' 
                : 'bg-rose-50 text-rose-800 border-rose-200/60'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-md shadow-blue-600/10 flex items-center space-x-1.5 disabled:opacity-50"
            disabled={isUploading || !file}
            id="btn-submit-upload"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing Model...</span>
              </>
            ) : (
              <span>Predict Maintenance</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
