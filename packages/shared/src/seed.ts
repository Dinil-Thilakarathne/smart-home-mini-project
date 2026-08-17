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
    powerWatts: 100,
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
    powerWatts: 10,
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
    powerWatts: 1200,
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
    powerWatts: 8,
    lastChangedSource: "SIMULATOR",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  { id: "hallway-light", name: "Hallway light", type: "light", status: "ON", health: "CONNECTED", floorId: "ground-floor", position: { column: 4, row: 1, width: 1, height: 1 }, capabilities: { canToggle: true, supportsSchedule: true }, powerWatts: 9, lastChangedSource: "SCHEDULE", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "dining-outlet", name: "Dining outlet", type: "outlet", status: "OFF", health: "CONNECTED", floorId: "ground-floor", position: { column: 1, row: 3, width: 2, height: 2 }, capabilities: { canToggle: true }, powerWatts: 150, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "garage-camera", name: "Garage camera", type: "camera", status: "ON", health: "CONNECTED", floorId: "ground-floor", position: { column: 4, row: 2, width: 1, height: 1 }, capabilities: { canToggle: false }, powerWatts: 8, lastChangedSource: "SIMULATOR", updatedAt: "2026-01-01T00:00:00.000Z" },
  {
    id: "bedroom-switch-unit",
    name: "Bedroom switches",
    type: "switch-unit",
    status: "OFF",
    health: "CONNECTED",
    floorId: "upper-floor",
    position: { column: 3, row: 2, width: 2, height: 2 },
    capabilities: { canToggle: true },
    powerWatts: 60,
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
    powerWatts: 8,
    lastChangedSource: "SIMULATOR",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  { id: "bedroom-lamp", name: "Bedroom lamp", type: "light", status: "OFF", health: "CONNECTED", floorId: "upper-floor", position: { column: 1, row: 1, width: 2, height: 1 }, capabilities: { canToggle: true, supportsSchedule: true }, powerWatts: 8, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "study-light", name: "Study light", type: "light", status: "ON", health: "CONNECTED", floorId: "upper-floor", position: { column: 5, row: 2, width: 1, height: 1 }, capabilities: { canToggle: true, supportsSchedule: true }, powerWatts: 10, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bathroom-outlet", name: "Bathroom outlet", type: "outlet", status: "OFF", health: "CONNECTED", floorId: "upper-floor", position: { column: 5, row: 3, width: 1, height: 1 }, capabilities: { canToggle: true }, powerWatts: 80, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "balcony-camera", name: "Balcony camera", type: "camera", status: "ON", health: "CONNECTED", floorId: "upper-floor", position: { column: 6, row: 1, width: 1, height: 1 }, capabilities: { canToggle: false }, powerWatts: 8, lastChangedSource: "SIMULATOR", updatedAt: "2026-01-01T00:00:00.000Z" },
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

const switchNames = ["Ceiling light", "Bedside lamp", "Desk lamp", "Fan", "Accent light"];

export function createSwitchUnitFixture(deviceId: string, count: 2 | 3 | 5): Switch[] {
  return switchNames.slice(0, count).map((name, index) => ({
    id: `${deviceId}-${index + 1}`,
    deviceId,
    name,
    index,
    status: "OFF" as const,
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
}

export const demoSwitchUnitFixtures = {
  two: createSwitchUnitFixture("two-switch-unit", 2),
  three: createSwitchUnitFixture("three-switch-unit", 3),
  five: createSwitchUnitFixture("bedroom-switch-unit", 5),
};

export const demoSwitches: Switch[] = demoSwitchUnitFixtures.five;
