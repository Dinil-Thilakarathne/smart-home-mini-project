import type { DeviceHealth, DeviceStatus } from "./device";

export function canToggleDevice(status: DeviceStatus, health: DeviceHealth) {
  return health === "CONNECTED" && (status === "ON" || status === "OFF");
}

export function nextToggleStatus(status: Extract<DeviceStatus, "ON" | "OFF">): Extract<DeviceStatus, "ON" | "OFF"> {
  return status === "ON" ? "OFF" : "ON";
}

export function shouldTrackUsage(before: DeviceStatus, after: DeviceStatus, source: string) {
  return before !== after && after !== "ERROR" && after !== "DISCONNECTED" && source !== "SAFETY";
}
