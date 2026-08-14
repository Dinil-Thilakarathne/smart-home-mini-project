import type { Device, Floor, Switch } from "./device";
import type { Household, Schedule } from "./domain";

export const DEMO_HOUSEHOLD_ID = "demo-household";

export const demoHousehold: Household = {
  id: DEMO_HOUSEHOLD_ID,
  name: "Colombo Demo Home",
  timezone: "Asia/Colombo",
  demo: true,
};

export const demoFloors: Floor[] = [
  { id: "ground-floor", name: "Ground floor", order: 0, gridColumns: 6, gridRows: 4 },
  { id: "upper-floor", name: "Upper floor", order: 1, gridColumns: 6, gridRows: 4 },
];

export const demoDevices: Device[] = [
  {
    id: "kitchen-outlet",
    name: "Kitchen outlet",
    type: "outlet",
    status: "OFF",
    health: "CONNECTED",
    floorId: "ground-floor",
    position: { column: 1, row: 1, width: 2, height: 2 },
    capabilities: { canToggle: true },
    lastChangedSource: "USER",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "living-room-light",
    name: "Living room light",
    type: "light",
    status: "OFF",
    health: "CONNECTED",
    floorId: "ground-floor",
    position: { column: 3, row: 3, width: 2, height: 2 },
    capabilities: { canToggle: true, supportsSchedule: true },
    lastChangedSource: "USER",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "kitchen-iron",
    name: "Kitchen iron",
    type: "iron",
    status: "ON",
    health: "CONNECTED",
    floorId: "ground-floor",
    position: { column: 5, row: 1, width: 2, height: 2 },
    capabilities: { canToggle: true, safetyMaxDurationMinutes: 30 },
    lastChangedSource: "SIMULATOR",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "front-door-camera",
    name: "Front door camera",
    type: "camera",
    status: "ON",
    health: "CONNECTED",
    floorId: "ground-floor",
    position: { column: 3, row: 1, width: 1, height: 1 },
    capabilities: { canToggle: false },
    lastChangedSource: "SIMULATOR",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bedroom-switch-unit",
    name: "Bedroom switches",
    type: "switch-unit",
    status: "OFF",
    health: "CONNECTED",
    floorId: "upper-floor",
    position: { column: 3, row: 2, width: 2, height: 2 },
    capabilities: { canToggle: true },
    lastChangedSource: "USER",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "garden-camera",
    name: "Garden camera",
    type: "camera",
    status: "ON",
    health: "CONNECTED",
    floorId: "upper-floor",
    position: { column: 5, row: 1, width: 1, height: 1 },
    capabilities: { canToggle: false },
    lastChangedSource: "SIMULATOR",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const demoSchedules: Schedule[] = [
  {
    id: "living-room-evening-light",
    householdId: DEMO_HOUSEHOLD_ID,
    deviceId: "living-room-light",
    days: [1, 2, 3, 4, 5, 6, 0],
    startTime: "18:00",
    endTime: "23:00",
    enabled: true,
    timezone: "Asia/Colombo",
  },
];

export const demoSwitches: Switch[] = [
  { id: "bedroom-switch-1", deviceId: "bedroom-switch-unit", name: "Ceiling light", index: 0, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-2", deviceId: "bedroom-switch-unit", name: "Bedside lamp", index: 1, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-3", deviceId: "bedroom-switch-unit", name: "Desk lamp", index: 2, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-4", deviceId: "bedroom-switch-unit", name: "Fan", index: 3, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-5", deviceId: "bedroom-switch-unit", name: "Accent light", index: 4, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
];
