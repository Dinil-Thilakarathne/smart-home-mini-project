import type { Device, DeviceCapabilities, DeviceHealth, DeviceStatus, DeviceType } from "./device";

type TimestampLike = { toDate?: () => Date };

export interface LiveRuntimeDevice {
  status: DeviceStatus;
  health: DeviceHealth;
  type: DeviceType;
  capabilities: DeviceCapabilities;
  powerWatts: number;
  updatedAt: Device["updatedAt"] | TimestampLike | Date;
}

export interface LiveRuntime {
  isRunning: boolean;
  elapsedSeconds: number;
  estimatedEnergyKwh: number;
  remainingSafetySeconds: number | null;
  safetyCutoffDue: boolean;
}

function dateFromUnknown(value: LiveRuntimeDevice["updatedAt"]) {
  if (value instanceof Date) return value;
  if (typeof (value as TimestampLike)?.toDate === "function") {
    return (value as TimestampLike).toDate?.() ?? null;
  }
  const parsed = new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getLiveRuntime(device: LiveRuntimeDevice, now: Date | number = Date.now()): LiveRuntime {
  const startedAt = dateFromUnknown(device.updatedAt);
  const nowMilliseconds = now instanceof Date ? now.getTime() : now;
  const isRunning = device.status === "ON" && device.health === "CONNECTED";
  const elapsedSeconds = isRunning && startedAt
    ? Math.max(0, Math.floor((nowMilliseconds - startedAt.getTime()) / 1_000))
    : 0;
  const safetySeconds = device.type === "iron" && device.capabilities.safetyMaxDurationMinutes
    ? device.capabilities.safetyMaxDurationMinutes * 60
    : null;
  const remainingSafetySeconds = safetySeconds === null ? null : Math.max(0, safetySeconds - elapsedSeconds);

  return {
    isRunning,
    elapsedSeconds,
    estimatedEnergyKwh: Number(((Math.max(0, device.powerWatts) * elapsedSeconds) / 3_600_000).toFixed(4)),
    remainingSafetySeconds,
    safetyCutoffDue: safetySeconds !== null && elapsedSeconds >= safetySeconds,
  };
}

export function formatRuntime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3_600);
  const minutes = Math.floor((safeSeconds % 3_600) / 60);
  const remainder = safeSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m ${String(remainder).padStart(2, "0")}s`;
}
