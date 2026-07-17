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

export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  floorId: string;
}
