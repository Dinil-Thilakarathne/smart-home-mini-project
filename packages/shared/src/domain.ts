import type { DeviceSource, DeviceStatus, DeviceType } from "./device";

export const ALERT_SEVERITIES = ["INFO", "WARNING", "CRITICAL"] as const;
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];

export const USAGE_EVENT_TYPES = ["POWER_SESSION", "SAFETY_CUTOFF"] as const;
export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

export interface Household {
  id: string;
  name: string;
  timezone: string;
  demo: boolean;
}

export interface Schedule {
  id: string;
  name?: string;
  householdId: string;
  deviceId: string;
  switchId?: string;
  action?: Extract<DeviceStatus, "ON" | "OFF">;
  days: number[];
  startTime: string;
  endTime: string;
  enabled: boolean;
  timezone: string;
}

export interface Alert {
  id: string;
  householdId: string;
  severity: AlertSeverity;
  message: string;
  source: DeviceSource;
  deviceId?: string;
  read: boolean;
  createdAt: string;
}

export interface UsageRecord {
  id: string;
  householdId: string;
  deviceId: string;
  deviceType: DeviceType;
  eventType: UsageEventType;
  source: DeviceSource;
  startTime: string;
  endTime?: string;
  durationSeconds?: number;
  powerWatts?: number;
  estimatedEnergyKwh?: number;
  cutoffReason?: string;
}

export interface DeviceLog {
  id: string;
  householdId: string;
  deviceId: string;
  deviceName: string;
  deviceType: DeviceType;
  source: DeviceSource;
  changes: string[];
  createdAt: string;
}

export interface DeviceCommand {
  deviceId: string;
  status: Extract<DeviceStatus, "ON" | "OFF">;
  source: Extract<DeviceSource, "USER" | "SIMULATOR">;
  requestedAt: string;
}

export const COLLECTIONS = {
  households: "households",
  floors: "floors",
  devices: "devices",
  switches: "switches",
  schedules: "schedules",
  alerts: "alerts",
  usage: "usage",
  logs: "logs",
} as const;

export function householdPath(householdId: string) {
  return `${COLLECTIONS.households}/${householdId}`;
}

export function floorCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.floors}`;
}

export function deviceCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.devices}`;
}

export function devicePath(householdId: string, deviceId: string) {
  return `${deviceCollectionPath(householdId)}/${deviceId}`;
}

export function switchCollectionPath(householdId: string, deviceId: string) {
  return `${devicePath(householdId, deviceId)}/${COLLECTIONS.switches}`;
}

export function scheduleCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.schedules}`;
}

export function alertCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.alerts}`;
}

export function usageCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.usage}`;
}

export function deviceLogCollectionPath(householdId: string) {
  return `${householdPath(householdId)}/${COLLECTIONS.logs}`;
}
