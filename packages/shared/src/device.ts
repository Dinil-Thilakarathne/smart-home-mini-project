export const DEVICE_STATUSES = [
  "ON",
  "OFF",
  "ERROR",
  "DISCONNECTED",
] as const;

export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const DEVICE_TYPES = [
  "outlet",
  "switch-unit",
  "light",
  "iron",
  "camera",
] as const;

export type DeviceType = (typeof DEVICE_TYPES)[number];

export const DEVICE_SOURCES = [
  "USER",
  "SIMULATOR",
  "SAFETY",
  "SCHEDULE",
] as const;

export type DeviceSource = (typeof DEVICE_SOURCES)[number];

export const DEVICE_HEALTH = ["CONNECTED", "ERROR", "DISCONNECTED"] as const;

export type DeviceHealth = (typeof DEVICE_HEALTH)[number];

export interface DevicePosition {
  column: number;
  row: number;
  width: number;
  height: number;
}

export interface DeviceCapabilities {
  canToggle: boolean;
  safetyMaxDurationMinutes?: number;
  supportsSchedule?: boolean;
}

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  health: DeviceHealth;
  floorId: string;
  position: DevicePosition;
  capabilities: DeviceCapabilities;
  powerWatts: number;
  lastChangedSource: DeviceSource;
  updatedAt: string;
}

export interface Switch {
  id: string;
  deviceId: string;
  name: string;
  index: number;
  status: DeviceStatus;
  updatedAt: string;
}

export interface Floor {
  id: string;
  name: string;
  order: number;
  gridColumns: number;
  gridRows: number;
  planAsset?: string;
}
