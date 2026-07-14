import { AircraftData, ComponentData } from '../types.js';

/**
 * Predicts maintenance status and Remaining Useful Life (RUL) for a aircraft component
 * based on operational and environmental IoT sensor inputs.
 * 
 * In a production deployment with a real 'model.pkl' (LightGBM):
 * This function can be modified to call a local Python microservice or run an
 * ONNX / WebAssembly LightGBM runner.
 * 
 * Features utilized:
 * - WearLevel (%)
 * - OperatingTemp (°C)
 * - VibrationLevel (mm/s)
 * - Pressure (psi)
 * - FlightHours (hours)
 */
export function predictComponent(
  aircraftId: string,
  componentName: string,
  wearLevel: number,
  operatingTemp: number,
  vibrationLevel: number,
  pressure: number,
  flightHours: number
): ComponentData {
  // LightGBM decision tree simulation logic:
  let status: 'Healthy' | 'Marginal' | 'Critical' = 'Healthy';
  let confidenceScore = 0.95; // default base confidence
  let RUL = 1200; // default Remaining Useful Life (hours)

  // 1. Critical splits (High wear, high temp, high vibration, extreme pressure)
  if (
    wearLevel >= 80 ||
    vibrationLevel >= 8.2 ||
    operatingTemp >= 115 ||
    (componentName === 'Brake Unit' && pressure < 1000) ||
    (componentName === 'Brake Unit' && pressure > 3500)
  ) {
    status = 'Critical';
    // Higher wear / stress yields higher certainty of failure prediction
    const wearFactor = Math.min(1, (wearLevel - 80) / 20);
    const vibrationFactor = Math.min(1, (vibrationLevel - 8.2) / 4);
    confidenceScore = 0.90 + 0.09 * Math.max(wearFactor, vibrationFactor);
    
    // Remaining useful life degrades rapidly under critical conditions
    RUL = Math.max(10, Math.round(150 * (1 - (wearLevel / 100)) + Math.random() * 20));
  }
  // 2. Marginal splits (Moderate wear, elevated temp or vibration)
  else if (
    wearLevel >= 50 ||
    vibrationLevel >= 5.0 ||
    operatingTemp >= 90 ||
    (componentName === 'Brake Unit' && pressure < 1500) ||
    (componentName === 'Brake Unit' && pressure > 3000)
  ) {
    status = 'Marginal';
    const wearFactor = (wearLevel - 50) / 30;
    confidenceScore = 0.85 + 0.12 * wearFactor;
    
    // Marginal status has moderate RUL
    RUL = Math.round(300 + (600 - 300) * (1 - (wearLevel / 100)) + Math.random() * 50);
  }
  // 3. Healthy split (Normal operation limits)
  else {
    status = 'Healthy';
    const safetyMargin = 1 - (wearLevel / 50);
    confidenceScore = 0.92 + 0.06 * safetyMargin;
    
    // Healthy components have long RUL
    RUL = Math.round(1000 + 1500 * (1 - (wearLevel / 100)) + Math.random() * 100);
  }

  // Cap confidence score representation
  if (confidenceScore > 0.999) confidenceScore = 0.999;
  if (confidenceScore < 0.60) confidenceScore = 0.60;

  // Add standard non-Gemini fallbacks for reasons and actions
  let reason = `Operating within acceptable parameters. Temperature is stable at ${operatingTemp}°C with normal vibration of ${vibrationLevel} mm/s.`;
  let recommendedAction = 'No immediate maintenance required. Continue standard operation schedule.';

  if (status === 'Critical') {
    reason = `Critical telemetry detected. Component exhibits extremely high wear level (${wearLevel}%) and elevated vibration of ${vibrationLevel} mm/s and temperature of ${operatingTemp}°C.`;
    recommendedAction = `Immediate visual inspection required before the next scheduled flight. Replacement of worn components is highly recommended.`;
  } else if (status === 'Marginal') {
    reason = `Elevated operational wear (${wearLevel}%) and moderate temperature reading of ${operatingTemp}°C and vibration of ${vibrationLevel} mm/s. Signs of gradual degradation.`;
    recommendedAction = `Schedule preventive maintenance review during the next standard service cycle. Monitor wear closely.`;
  }

  const componentId = `${aircraftId}-${componentName.toLowerCase().replace(/\s+/g, '-')}`;

  return {
    id: componentId,
    name: componentName,
    status,
    remainingUsefulLife: RUL,
    confidenceScore: parseFloat(confidenceScore.toFixed(3)),
    wearLevel,
    flightHours,
    operatingTemp,
    vibrationLevel,
    pressure,
    reason,
    recommendedAction,
  };
}

/**
 * Aggregates component-level predictions by Aircraft ID and determines overall health.
 */
export function aggregateAircraft(
  aircraftId: string,
  model: string,
  operator: string,
  flightHours: number,
  cycles: number,
  lastInspectionDate: string,
  components: ComponentData[]
): AircraftData {
  // Determine overall status
  let overallStatus: 'Healthy' | 'Marginal' | 'Critical' = 'Healthy';
  if (components.some((c) => c.status === 'Critical')) {
    overallStatus = 'Critical';
  } else if (components.some((c) => c.status === 'Marginal')) {
    overallStatus = 'Marginal';
  }

  // Calculate Remaining Useful Life (RUL) as the minimum RUL among components
  const remainingUsefulLife = Math.min(...components.map((c) => c.remainingUsefulLife));

  // Risk Level mapping
  let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
  if (overallStatus === 'Critical') {
    riskLevel = 'High';
  } else if (overallStatus === 'Marginal') {
    riskLevel = 'Medium';
  }

  // General next recommendations
  let nextMaintenanceRecommendation = 'Schedule routine check in 150 flight hours.';
  if (overallStatus === 'Critical') {
    nextMaintenanceRecommendation = 'AOG (Aircraft on Ground) active. Perform emergency component swap immediately.';
  } else if (overallStatus === 'Marginal') {
    nextMaintenanceRecommendation = 'Schedule preventive replacement within the next 45 flight hours.';
  }

  return {
    aircraftId,
    status: overallStatus,
    remainingUsefulLife,
    components,
    riskLevel,
    lastInspectionDate: lastInspectionDate || new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextMaintenanceRecommendation,
    flightHours,
    cycles,
    model: model || 'Boeing 737-800',
    operator: operator || 'AeroGlobal',
    geminiAnalysis: null,
  };
}

/**
 * Generates a default fleet dataset for initial demo loading or templates.
 */
export function generateDemoFleet(): AircraftData[] {
  const demoData = [
    {
      aircraftId: 'AC-7023',
      model: 'Boeing 737-800',
      operator: 'AeroGlobal',
      flightHours: 12450,
      cycles: 6120,
      lastInspectionDate: '2026-06-15',
      components: [
        { name: 'Engine', wearLevel: 85, temp: 118, vibration: 8.6, pressure: 2400 },
        { name: 'Landing Gear', wearLevel: 32, temp: 45, vibration: 2.1, pressure: 2900 },
        { name: 'Brake Unit', wearLevel: 45, temp: 88, vibration: 3.4, pressure: 1950 },
        { name: 'APU', wearLevel: 68, temp: 94, vibration: 5.6, pressure: 1200 },
      ],
    },
    {
      aircraftId: 'AC-8194',
      model: 'Airbus A320neo',
      operator: 'SkyWest Airways',
      flightHours: 8940,
      cycles: 4120,
      lastInspectionDate: '2026-07-01',
      components: [
        { name: 'Engine', wearLevel: 22, temp: 84, vibration: 2.3, pressure: 2350 },
        { name: 'Landing Gear', wearLevel: 15, temp: 32, vibration: 1.1, pressure: 3000 },
        { name: 'Brake Unit', wearLevel: 28, temp: 55, vibration: 2.2, pressure: 2100 },
        { name: 'APU', wearLevel: 31, temp: 72, vibration: 3.1, pressure: 1150 },
      ],
    },
    {
      aircraftId: 'AC-3022',
      model: 'Boeing 787-9',
      operator: 'TransWorld Air',
      flightHours: 16820,
      cycles: 5310,
      lastInspectionDate: '2026-06-20',
      components: [
        { name: 'Engine', wearLevel: 55, temp: 92, vibration: 5.4, pressure: 2500 },
        { name: 'Landing Gear', wearLevel: 62, temp: 51, vibration: 5.8, pressure: 2850 },
        { name: 'Brake Unit', wearLevel: 38, temp: 72, vibration: 3.2, pressure: 2000 },
        { name: 'APU', wearLevel: 58, temp: 88, vibration: 5.2, pressure: 1100 },
      ],
    },
    {
      aircraftId: 'AC-1055',
      model: 'Bombardier CRJ-900',
      operator: 'RegionalExpress',
      flightHours: 14200,
      cycles: 9140,
      lastInspectionDate: '2026-05-28',
      components: [
        { name: 'Engine', wearLevel: 41, temp: 88, vibration: 3.2, pressure: 2420 },
        { name: 'Landing Gear', wearLevel: 82, temp: 58, vibration: 8.5, pressure: 2950 },
        { name: 'Brake Unit', wearLevel: 88, temp: 110, vibration: 4.5, pressure: 950 }, // Low pressure & high wear
        { name: 'APU', wearLevel: 40, temp: 75, vibration: 3.0, pressure: 1120 },
      ],
    },
    {
      aircraftId: 'AC-9541',
      model: 'Embraer E190',
      operator: 'AeroGlobal',
      flightHours: 5600,
      cycles: 3100,
      lastInspectionDate: '2026-07-05',
      components: [
        { name: 'Engine', wearLevel: 12, temp: 78, vibration: 1.5, pressure: 2400 },
        { name: 'Landing Gear', wearLevel: 10, temp: 28, vibration: 0.8, pressure: 3100 },
        { name: 'Brake Unit', wearLevel: 15, temp: 42, vibration: 1.5, pressure: 2050 },
        { name: 'APU', wearLevel: 18, temp: 65, vibration: 1.9, pressure: 1180 },
      ],
    },
  ];

  return demoData.map((ac) => {
    const computedComponents = ac.components.map((comp) =>
      predictComponent(
        ac.aircraftId,
        comp.name,
        comp.wearLevel,
        comp.temp,
        comp.vibration,
        comp.pressure,
        ac.flightHours
      )
    );
    return aggregateAircraft(
      ac.aircraftId,
      ac.model,
      ac.operator,
      ac.flightHours,
      ac.cycles,
      ac.lastInspectionDate,
      computedComponents
    );
  });
}
