import emailjs from '@emailjs/browser';
import { AircraftData } from '../types.js';

// EmailJS Credentials
const SERVICE_ID = 'service_btvfriz';
const TEMPLATE_ID = 'template_eey210u';
const PUBLIC_KEY = '4P_LWPga-hNnFeQ7t';

// Track which aircraft have already been alerted this session (prevents duplicate emails)
const alertedAircraftIds = new Set<string>();

/**
 * Initialize EmailJS with the public key.
 * Call this once when the app starts.
 */
export function initEmailAlerts() {
  emailjs.init(PUBLIC_KEY);
}

/**
 * Send a critical alert email for an aircraft.
 * Returns true if the email was sent, false if it was skipped (already alerted).
 */
export async function sendCriticalAlert(aircraft: AircraftData): Promise<boolean> {
  // Skip if already alerted this session
  if (alertedAircraftIds.has(aircraft.aircraftId)) {
    console.log(`[EmailJS] Alert already sent for ${aircraft.aircraftId} this session. Skipping.`);
    return false;
  }

  // Build the critical components summary
  const criticalComponents = aircraft.components
    .filter((c) => c.status === 'Critical')
    .map((c) => {
      return `• ${c.name} (ID: ${c.id})
  Status: CRITICAL
  Wear Level: ${c.wearLevel}%
  Temperature: ${c.operatingTemp}°C
  Vibration: ${c.vibrationLevel} mm/s
  Pressure: ${c.pressure} psi
  Hours Before Service: ${c.remainingUsefulLife} hrs
  Reason: ${c.reason || 'N/A'}`;
    })
    .join('\n\n');

  // Also list marginal components for awareness
  const marginalComponents = aircraft.components
    .filter((c) => c.status === 'Marginal')
    .map((c) => {
      return `• ${c.name} (ID: ${c.id}) — MARGINAL (Wear: ${c.wearLevel}%, Temp: ${c.operatingTemp}°C)`;
    })
    .join('\n');

  const allCriticalInfo = criticalComponents + 
    (marginalComponents ? `\n\n━━━ MARGINAL COMPONENTS (WATCH LIST) ━━━\n${marginalComponents}` : '');

  const templateParams = {
    aircraft_id: aircraft.aircraftId,
    aircraft_model: aircraft.model,
    operator: aircraft.operator,
    status: aircraft.status,
    risk_level: aircraft.riskLevel,
    critical_components: allCriticalInfo || 'No critical component details available.',
    maintenance_recommendation: aircraft.nextMaintenanceRecommendation,
    remaining_life: String(aircraft.remainingUsefulLife),
    flight_hours: String(aircraft.flightHours),
    cycles: String(aircraft.cycles),
    last_inspection: aircraft.lastInspectionDate,
    alert_time: new Date().toLocaleString(),
  };

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log(`[EmailJS] ✅ Critical alert sent for ${aircraft.aircraftId}:`, response.status);
    alertedAircraftIds.add(aircraft.aircraftId);
    return true;
  } catch (error) {
    console.error(`[EmailJS] ❌ Failed to send alert for ${aircraft.aircraftId}:`, error);
    return false;
  }
}

/**
 * Send a manual alert for any aircraft (bypasses the duplicate check).
 */
export async function sendManualAlert(aircraft: AircraftData): Promise<boolean> {
  const criticalComponents = aircraft.components
    .filter((c) => c.status === 'Critical' || c.status === 'Marginal')
    .map((c) => {
      return `• ${c.name} (ID: ${c.id})
  Status: ${c.status}
  Wear Level: ${c.wearLevel}%
  Temperature: ${c.operatingTemp}°C
  Vibration: ${c.vibrationLevel} mm/s
  Hours Before Service: ${c.remainingUsefulLife} hrs`;
    })
    .join('\n\n');

  const templateParams = {
    aircraft_id: aircraft.aircraftId,
    aircraft_model: aircraft.model,
    operator: aircraft.operator,
    status: aircraft.status,
    risk_level: aircraft.riskLevel,
    critical_components: criticalComponents || 'All components operating within limits.',
    maintenance_recommendation: aircraft.nextMaintenanceRecommendation,
    remaining_life: String(aircraft.remainingUsefulLife),
    flight_hours: String(aircraft.flightHours),
    cycles: String(aircraft.cycles),
    last_inspection: aircraft.lastInspectionDate,
    alert_time: new Date().toLocaleString(),
  };

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    console.log(`[EmailJS] ✅ Manual alert sent for ${aircraft.aircraftId}:`, response.status);
    return true;
  } catch (error) {
    console.error(`[EmailJS] ❌ Failed to send manual alert for ${aircraft.aircraftId}:`, error);
    return false;
  }
}

/**
 * Check if an aircraft has already been alerted this session.
 */
export function hasBeenAlerted(aircraftId: string): boolean {
  return alertedAircraftIds.has(aircraftId);
}

/**
 * Reset alert tracking (e.g., when fleet data is reloaded).
 */
export function resetAlertTracking() {
  alertedAircraftIds.clear();
}
