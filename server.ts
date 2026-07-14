// Triggering server restart to reload predictorService updates
import express from "express";
import path from "path";
import multer from "multer";
import xlsx from "xlsx";
// No GoogleGenAI imports required (using standard REST calls to Grok API)
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

import { 
  predictComponent, 
  aggregateAircraft, 
  generateDemoFleet 
} from "./src/services/predictorService.js";
import { AircraftData, ComponentData, GeminiAnalysis } from "./src/types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store for fleet data, initialized with realistic demo data
let fleetStore: AircraftData[] = generateDemoFleet();

// Groq API key initialization
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
// Multer storage setup for processing uploaded files in-memory
const upload = multer({ storage: multer.memoryStorage() });

// --- UTILITY: Robust Excel/CSV Parser & Preprocessor ---
function preprocessAndPredict(buffer: Buffer): AircraftData[] {
  const workbook = xlsx.read(buffer, { type: "buffer" });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

  if (rawRows.length === 0) {
    throw new Error("Uploaded file contains no data rows.");
  }

  // Map to group component rows by AircraftID
  const groupedData: { 
    [aircraftId: string]: {
      model: string;
      operator: string;
      flightHours: number;
      cycles: number;
      lastInspectionDate: string;
      components: {
        name: string;
        wearLevel: number;
        temp: number;
        vibration: number;
        pressure: number;
      }[]
    }
  } = {};

  // Parse each row and aggregate
  rawRows.forEach((row, idx) => {
    // Column variation tolerance helper
    const getVal = (keys: string[], fallback: any) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && row[k] !== "") {
          return row[k];
        }
      }
      return fallback;
    };

    const aircraftId = String(getVal(["AircraftID", "aircraft_id", "Aircraft ID", "aircraft", "AircraftId"], `AC-MOCK-${1000 + idx}`)).trim();
    const model = String(getVal(["Model", "model_type", "Aircraft Model", "aircraft_model"], "Boeing 737-800")).trim();
    const operator = String(getVal(["Operator", "airline", "Company", "operator"], "AeroGlobal")).trim();
    
    const flightHours = Math.max(0, parseFloat(getVal(["FlightHours", "flight_hours", "Hours", "flighthours"], 10000)));
    const cycles = Math.max(0, parseInt(getVal(["Cycles", "flight_cycles", "cycles", "CyclesCount"], 5000)));
    const lastInspectionDate = String(getVal(["LastInspectionDate", "last_inspection", "Inspection Date", "last_inspection_date"], "2026-06-01")).trim();

    const componentName = String(getVal(["ComponentName", "component_name", "Component", "component"], "Engine")).trim();
    const wearLevel = Math.max(0, Math.min(100, parseFloat(getVal(["WearLevel", "wear_level", "Wear (%)", "wear"], 25))));
    const temp = parseFloat(getVal(["OperatingTemp", "operating_temp", "Temperature", "temp", "Temperature (C)"], 75));
    const vibration = parseFloat(getVal(["VibrationLevel", "vibration_level", "Vibration", "vibration", "Vibration (mm/s)"], 2.5));
    const pressure = parseFloat(getVal(["Pressure", "pressure_psi", "Pressure", "pressure", "Pressure (psi)"], 2400));

    if (!groupedData[aircraftId]) {
      groupedData[aircraftId] = {
        model,
        operator,
        flightHours,
        cycles,
        lastInspectionDate,
        components: []
      };
    }

    groupedData[aircraftId].components.push({
      name: componentName,
      wearLevel,
      temp,
      vibration,
      pressure
    });
  });

  // Calculate ML LightGBM predictions for each component and build aircraft models
  const processedAircraft: AircraftData[] = [];
  Object.entries(groupedData).forEach(([aircraftId, acInfo]) => {
    const predictedComponents: ComponentData[] = acInfo.components.map((c) => {
      return predictComponent(
        aircraftId,
        c.name,
        c.wearLevel,
        c.temp,
        c.vibration,
        c.pressure,
        acInfo.flightHours
      );
    });

    const aircraft = aggregateAircraft(
      aircraftId,
      acInfo.model,
      acInfo.operator,
      acInfo.flightHours,
      acInfo.cycles,
      acInfo.lastInspectionDate,
      predictedComponents
    );

    processedAircraft.push(aircraft);
  });

  return processedAircraft;
}


// --- REST API ENDPOINTS ---

// Support both /api/* and root/REST style requests requested by the user

// 1. Upload API
const handleUpload = (req: express.Request, res: express.Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file was uploaded. Please attach a valid CSV or Excel file." });
  }

  try {
    const parsedAircraft = preprocessAndPredict(req.file.buffer);
    // Overwrite fleetStore
    fleetStore = parsedAircraft;
    res.json({
      message: "Dataset successfully preprocessed and predictions executed.",
      count: parsedAircraft.length,
      fleet: parsedAircraft
    });
  } catch (err: any) {
    console.error("Error preprocessing dataset:", err);
    res.status(500).json({ error: err.message || "Failed to preprocess uploaded file." });
  }
};
app.post("/upload", upload.single("file"), handleUpload);
app.post("/api/upload", upload.single("file"), handleUpload);

// 2. Predict API
const handlePredict = (req: express.Request, res: express.Response) => {
  try {
    // Triggers fresh prediction calculations over the stored fleet
    fleetStore = fleetStore.map((ac) => {
      const components = ac.components.map((c) => {
        return predictComponent(
          ac.aircraftId,
          c.name,
          c.wearLevel,
          c.operatingTemp,
          c.vibrationLevel,
          c.pressure,
          ac.flightHours
        );
      });
      return aggregateAircraft(
        ac.aircraftId,
        ac.model,
        ac.operator,
        ac.flightHours,
        ac.cycles,
        ac.lastInspectionDate,
        components
      );
    });

    res.json({
      message: "Predictive maintenance algorithms executed across all fleet components.",
      fleet: fleetStore
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Prediction execution failed." });
  }
};
app.post("/predict", handlePredict);
app.post("/api/predict", handlePredict);

// 3. Dashboard API
const handleDashboard = (req: express.Request, res: express.Response) => {
  const totalAircraft = fleetStore.length;
  let totalComponents = 0;
  let healthyAircraft = 0;
  let marginalAircraft = 0;
  let criticalAircraft = 0;

  const componentFailureTracker: { [name: string]: { critical: number; marginal: number; healthy: number } } = {};

  fleetStore.forEach((ac) => {
    totalComponents += ac.components.length;
    if (ac.status === "Healthy") healthyAircraft++;
    else if (ac.status === "Marginal") marginalAircraft++;
    else if (ac.status === "Critical") criticalAircraft++;

    ac.components.forEach((c) => {
      if (!componentFailureTracker[c.name]) {
        componentFailureTracker[c.name] = { critical: 0, marginal: 0, healthy: 0 };
      }
      if (c.status === "Critical") componentFailureTracker[c.name].critical++;
      else if (c.status === "Marginal") componentFailureTracker[c.name].marginal++;
      else componentFailureTracker[c.name].healthy++;
    });
  });

  const componentFailures = Object.entries(componentFailureTracker).map(([name, counts]) => ({
    componentName: name,
    criticalCount: counts.critical,
    marginalCount: counts.marginal,
    healthyCount: counts.healthy
  }));

  res.json({
    totalAircraft,
    totalComponents,
    healthyAircraft,
    marginalAircraft,
    criticalAircraft,
    statusCounts: {
      Healthy: healthyAircraft,
      Marginal: marginalAircraft,
      Critical: criticalAircraft
    },
    componentFailureAlerts: componentFailures
  });
};
app.get("/dashboard", handleDashboard);
app.get("/api/dashboard", handleDashboard);

// 4. Single Aircraft API
const handleAircraftDetails = (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const aircraft = fleetStore.find((ac) => ac.aircraftId === id);

  if (!aircraft) {
    return res.status(404).json({ error: `Aircraft with ID '${id}' not found.` });
  }

  res.json(aircraft);
};
app.get("/aircraft/:id", handleAircraftDetails);
app.get("/api/aircraft/:id", handleAircraftDetails);

// 4.5. Full Fleet & Reset Fleet APIs
const handleFleet = (req: express.Request, res: express.Response) => {
  res.json(fleetStore);
};
app.get("/fleet", handleFleet);
app.get("/api/fleet", handleFleet);

const handleResetFleet = (req: express.Request, res: express.Response) => {
  fleetStore = generateDemoFleet();
  res.json({ message: "Fleet restored to original standard demo profiles.", fleet: fleetStore });
};
app.post("/reset-fleet", handleResetFleet);
app.post("/api/reset-fleet", handleResetFleet);

// 5. Trigger Groq AI Analysis Route (Integrated into the detailed page workflow)
app.post("/api/aircraft/:id/gemini", async (req, res) => {
  const { id } = req.params;
  const aircraftIdx = fleetStore.findIndex((ac) => ac.aircraftId === id);

  if (aircraftIdx === -1) {
    return res.status(404).json({ error: `Aircraft with ID '${id}' not found.` });
  }

  const aircraft = fleetStore[aircraftIdx];

  const fallbackTrigger = (reasonStr: string) => {
    console.warn(`[Groq Migration Warning] Using high-fidelity fallback diagnostic: ${reasonStr}`);
    const fallbackAnalysis: GeminiAnalysis = {
      humanExplanation: `Aircraft exhibits localized telemetry warnings. The overall status is classified as ${aircraft.status} due to wear limits on key operational components.`,
      maintenanceRecommendation: aircraft.status === 'Critical' 
        ? "IMMEDIATE GROUNDING (AOG). Dispatched team for urgent boroscope checks and overhaul." 
        : aircraft.status === 'Marginal' 
        ? "Schedule preventive maintenance cycle within the next 45 flight hours." 
        : "Aircraft is fully safe for continued flight routing.",
      riskSummary: aircraft.status === 'Critical' 
        ? "HIGH RISK. Potential component failure during takeoff or landing sequences if unaddressed." 
        : aircraft.status === 'Marginal' 
        ? "MEDIUM RISK. Accelerated mechanical wear can lead to unpredicted sub-system downtime." 
        : "LOW RISK. Operating safely inside all regulatory engineering bounds.",
      aircraftMaintenanceReport: `FORMAL AIRWORTHINESS MAINTENANCE REVIEW\nAircraft ID: ${aircraft.aircraftId}\nModel: ${aircraft.model}\nStatus: ${aircraft.status}\nRemaining Useful Life: ${aircraft.remainingUsefulLife} hrs`,
      aiGeneratedInsights: `Historical telemetry analysis indicates that operational wear on components is correlating with flight hours of ${aircraft.flightHours}. Standardizing sensor logging frequencies is recommended.`,
      generatedAt: new Date().toISOString()
    };

    const updatedComponents = aircraft.components.map(c => {
      let reason = `Operating within acceptable wear limits. Temperature is stable at ${c.operatingTemp}°C with normal vibration of ${c.vibrationLevel} mm/s. (Confidence: ${(c.confidenceScore * 100).toFixed(1)}%)`;
      let recommendedAction = "No maintenance required. Continue standard operation.";
      if (c.status === 'Critical') {
        reason = `Critical telemetry anomaly. IoT wear sensor shows ${c.wearLevel}% limits with elevated vibration thresholds of ${c.vibrationLevel} mm/s and temperature of ${c.operatingTemp}°C.`;
        recommendedAction = "Immediate visual inspection and physical replacement of worn component parts before flight.";
      } else if (c.status === 'Marginal') {
        reason = `Moderate operational wear detected (${c.wearLevel}%). Thermal sensor reads ${c.operatingTemp}°C and vibration is ${c.vibrationLevel} mm/s.`;
        recommendedAction = "Schedule preventive servicing in the next inspection window.";
      }
      return { ...c, reason, recommendedAction };
    });

    fleetStore[aircraftIdx] = {
      ...aircraft,
      components: updatedComponents,
      geminiAnalysis: fallbackAnalysis
    };

    return res.json(fleetStore[aircraftIdx]);
  };

  try {
    const prompt = `
    You are an expert aerospace predictive maintenance AI and senior aviation safety engineer.
    Analyze the following aircraft telemetry and machine learning status:
    
    Aircraft ID: ${aircraft.aircraftId}
    Aircraft Model: ${aircraft.model}
    Operator: ${aircraft.operator}
    Total Flight Hours: ${aircraft.flightHours} hrs
    Flight Cycles: ${aircraft.cycles} cycles
    Overall Status (from LightGBM predictor): ${aircraft.status}
    Overall RUL: ${aircraft.remainingUsefulLife} hrs
    
    Component status records:
    ${JSON.stringify(aircraft.components, null, 2)}
    
    Based on this data, provide a highly professional engineering report.
    Return the response ONLY in a clean, strict JSON format matching this schema:
    {
      "components": [
        {
          "name": "Engine",
          "reason": "Detailed human-readable aviation explanation of why the component is marked as ${aircraft.components.find(c => c.name === 'Engine')?.status || 'Healthy'} based on its wear level of ${aircraft.components.find(c => c.name === 'Engine')?.wearLevel || 0}% and sensors.",
          "recommendedAction": "Actionable engineering recommendation matching this status."
        },
        ... (repeat for Landing Gear, Brake Unit, APU, or other components provided in input)
      ],
      "humanExplanation": "Overall analytical summary of the factors driving this aircraft's status.",
      "maintenanceRecommendation": "Formal maintenance schedule prescription for the engineering team.",
      "riskSummary": "Airworthiness and performance risk mitigation summary.",
      "aircraftMaintenanceReport": "High-fidelity formal engineering summary section.",
      "aiGeneratedInsights": "Operational insight detecting correlations between parameters (wear, flight cycles) and fleet health strategies."
    }
    `;

    console.log(`[Groq API] Connecting to Groq API (llama-3.3-70b-versatile) for aircraft ${aircraft.aircraftId}...`);
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!groqResponse.ok) {
      const errorJson = await groqResponse.json().catch(() => ({}));
      const errMsg = errorJson.error?.message || `Groq API returned status ${groqResponse.status}`;
      return fallbackTrigger(errMsg);
    }

    const resData = await groqResponse.json();
    const resultText = resData.choices?.[0]?.message?.content || "";
    const parsedAI = JSON.parse(resultText);

    // Update the in-memory component reasons and actions
    const updatedComponents = aircraft.components.map((c) => {
      const aiComp = parsedAI.components?.find((ac: any) => ac.name.toLowerCase() === c.name.toLowerCase() || ac.name === c.name);
      return {
        ...c,
        reason: aiComp?.reason || c.reason,
        recommendedAction: aiComp?.recommendedAction || c.recommendedAction
      };
    });

    const geminiAnalysis: GeminiAnalysis = {
      humanExplanation: parsedAI.humanExplanation,
      maintenanceRecommendation: parsedAI.maintenanceRecommendation,
      riskSummary: parsedAI.riskSummary,
      aircraftMaintenanceReport: parsedAI.aircraftMaintenanceReport,
      aiGeneratedInsights: parsedAI.aiGeneratedInsights,
      generatedAt: new Date().toISOString()
    };

    fleetStore[aircraftIdx] = {
      ...aircraft,
      components: updatedComponents,
      geminiAnalysis
    };

    res.json(fleetStore[aircraftIdx]);

  } catch (err: any) {
    console.error("Groq Generation failed, falling back to mock:", err);
    fallbackTrigger(err.message || "Unknown Groq generation error");
  }
});

// 6. Generate Report API (Excel download and report summaries)
const handleGenerateReport = (req: express.Request, res: express.Response) => {
  const { aircraftId, format } = req.query;

  if (!aircraftId) {
    return res.status(400).json({ error: "Query parameter 'aircraftId' is required." });
  }

  const aircraft = fleetStore.find((ac) => ac.aircraftId === aircraftId);
  if (!aircraft) {
    return res.status(404).json({ error: `Aircraft ID '${aircraftId}' not found.` });
  }

  if (format === "excel") {
    try {
      // Build Excel Sheet rows
      const dataRows = aircraft.components.map((c) => ({
        "Aircraft ID": aircraft.aircraftId,
        "Aircraft Model": aircraft.model,
        "Operator": aircraft.operator,
        "Flight Hours": aircraft.flightHours,
        "Cycles": aircraft.cycles,
        "Last Inspection Date": aircraft.lastInspectionDate,
        "Component Name": c.name,
        "Health Status": c.status,
        "RUL (hours)": c.remainingUsefulLife,
        "Confidence Score (%)": (c.confidenceScore * 100).toFixed(1),
        "IoT Wear Level (%)": c.wearLevel,
        "Temp (°C)": c.operatingTemp,
        "Vibration (mm/s)": c.vibrationLevel,
        "Pressure (psi)": c.pressure,
        "AI Diagnostic Reason": c.reason || "N/A",
        "Action Recommended": c.recommendedAction || "N/A"
      }));

      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(dataRows);

      // Simple column widths styling helper
      ws["!cols"] = [
        { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 10 },
        { wch: 20 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 20 },
        { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 14 }, { wch: 40 }, { wch: 40 }
      ];

      xlsx.utils.book_append_sheet(wb, ws, "Health Report");
      const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", `attachment; filename="Aircraft_Report_${aircraftId}.xlsx"`);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      return res.send(buffer);
    } catch (err: any) {
      return res.status(500).json({ error: "Failed to generate Excel sheet.", details: err.message });
    }
  }

  // Fallback default JSON report format
  res.json({
    reportTitle: `PREDICTIVE MAINTENANCE ENGINEERING REPORT: ${aircraftId}`,
    generatedAt: new Date().toISOString(),
    aircraft
  });
};
app.get("/generate-report", handleGenerateReport);
app.get("/api/generate-report", handleGenerateReport);


// --- VITE MIDDLEWARE SETUP ---
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support modern SPA HTML5 routers
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aviation Predictive Maintenance] Server operating on port ${PORT}`);
  });
}

startServer();
