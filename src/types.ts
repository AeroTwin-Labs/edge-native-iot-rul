export interface ComponentData {
  id: string;
  name: string;
  status: 'Healthy' | 'Marginal' | 'Critical';
  remainingUsefulLife: number; // in hours
  confidenceScore: number; // e.g., 0.987 (98.7%)
  wearLevel: number; // percentage (e.g., 85)
  flightHours: number;
  operatingTemp: number; // in Celsius
  vibrationLevel: number; // in mm/s
  pressure: number; // in psi
  reason?: string;
  recommendedAction?: string;
}

export interface GeminiAnalysis {
  humanExplanation: string;
  maintenanceRecommendation: string;
  riskSummary: string;
  aircraftMaintenanceReport: string;
  aiGeneratedInsights: string;
  generatedAt: string;
}

export interface AircraftData {
  aircraftId: string;
  status: 'Healthy' | 'Marginal' | 'Critical';
  remainingUsefulLife: number; // minimum of components RUL
  components: ComponentData[];
  riskLevel: 'Low' | 'Medium' | 'High';
  lastInspectionDate: string;
  nextMaintenanceRecommendation: string;
  flightHours: number;
  cycles: number;
  model: string; // e.g., "Boeing 737-800", "Airbus A320"
  operator: string; // e.g., "AeroGlobal", "SkyWest"
  geminiAnalysis?: GeminiAnalysis | null;
}

export interface FleetDashboardSummary {
  totalAircraft: number;
  totalComponents: number;
  healthyAircraft: number;
  marginalAircraft: number;
  criticalAircraft: number;
  statusCounts: {
    Healthy: number;
    Marginal: number;
    Critical: number;
  };
  componentFailureAlerts: {
    componentName: string;
    criticalCount: number;
    marginalCount: number;
    healthyCount: number;
  }[];
}
