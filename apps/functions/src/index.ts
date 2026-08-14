import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { isSafetyCutoffDue, isScheduleActive } from "./automation.js";

const adminApp = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(adminApp);

const DEMO_HOUSEHOLD_ID = "demo-household";
const demoHousehold = { id: DEMO_HOUSEHOLD_ID, name: "Colombo Demo Home", timezone: "Asia/Colombo", demo: true };
const demoFloors = [
  { id: "ground-floor", name: "Ground floor", order: 0, gridColumns: 6, gridRows: 4 },
  { id: "upper-floor", name: "Upper floor", order: 1, gridColumns: 6, gridRows: 4 },
];
const demoDevices = [
  { id: "kitchen-outlet", name: "Kitchen outlet", type: "outlet", status: "OFF", health: "CONNECTED", floorId: "ground-floor", position: { column: 1, row: 1, width: 2, height: 2 }, capabilities: { canToggle: true }, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "living-room-light", name: "Living room light", type: "light", status: "OFF", health: "CONNECTED", floorId: "ground-floor", position: { column: 3, row: 3, width: 2, height: 2 }, capabilities: { canToggle: true, supportsSchedule: true }, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "kitchen-iron", name: "Kitchen iron", type: "iron", status: "ON", health: "CONNECTED", floorId: "ground-floor", position: { column: 5, row: 1, width: 2, height: 2 }, capabilities: { canToggle: true, safetyMaxDurationMinutes: 30 }, lastChangedSource: "SIMULATOR", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "front-door-camera", name: "Front door camera", type: "camera", status: "ON", health: "CONNECTED", floorId: "ground-floor", position: { column: 3, row: 1, width: 1, height: 1 }, capabilities: { canToggle: false }, lastChangedSource: "SIMULATOR", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-unit", name: "Bedroom switches", type: "switch-unit", status: "OFF", health: "CONNECTED", floorId: "upper-floor", position: { column: 3, row: 2, width: 2, height: 2 }, capabilities: { canToggle: true }, lastChangedSource: "USER", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "garden-camera", name: "Garden camera", type: "camera", status: "ON", health: "CONNECTED", floorId: "upper-floor", position: { column: 5, row: 1, width: 1, height: 1 }, capabilities: { canToggle: false }, lastChangedSource: "SIMULATOR", updatedAt: "2026-01-01T00:00:00.000Z" },
];
const demoSchedules = [{ id: "living-room-evening-light", householdId: DEMO_HOUSEHOLD_ID, deviceId: "living-room-light", days: [1, 2, 3, 4, 5, 6, 0], startTime: "18:00", endTime: "23:00", enabled: true, timezone: "Asia/Colombo" }];
const demoSwitches = [
  { id: "bedroom-switch-1", deviceId: "bedroom-switch-unit", name: "Ceiling light", index: 0, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-2", deviceId: "bedroom-switch-unit", name: "Bedside lamp", index: 1, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-3", deviceId: "bedroom-switch-unit", name: "Desk lamp", index: 2, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-4", deviceId: "bedroom-switch-unit", name: "Fan", index: 3, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
  { id: "bedroom-switch-5", deviceId: "bedroom-switch-unit", name: "Accent light", index: 4, status: "OFF", updatedAt: "2026-01-01T00:00:00.000Z" },
];

export const health = onRequest((_request, response) => {
  response.json({ service: "smart-home-functions", status: "ok" });
});

export const seedDemo = onRequest(async (_request, response) => {
  const batch = db.batch();
  const householdRef = db.doc(`households/${DEMO_HOUSEHOLD_ID}`);
  batch.set(householdRef, demoHousehold);
  for (const floor of demoFloors) batch.set(db.doc(`${householdRef.path}/floors/${floor.id}`), floor);
  for (const device of demoDevices) {
    batch.set(db.doc(`${householdRef.path}/devices/${device.id}`), {
      ...device,
      updatedAt: Timestamp.fromDate(new Date(device.updatedAt)),
    });
  }
  for (const item of demoSwitches) batch.set(db.doc(`${householdRef.path}/devices/${item.deviceId}/switches/${item.id}`), item);
  for (const schedule of demoSchedules) batch.set(db.doc(`${householdRef.path}/schedules/${schedule.id}`), schedule);
  await batch.commit();
  response.json({ householdId: DEMO_HOUSEHOLD_ID, seeded: true });
});

export const safetyCutoff = onRequest(async (request, response) => {
  const deviceId = typeof request.query.deviceId === "string" ? request.query.deviceId : "kitchen-iron";
  const deviceRef = db.doc(`households/${DEMO_HOUSEHOLD_ID}/devices/${deviceId}`);
  const device = (await deviceRef.get()).data();
  if (!device) { response.status(404).json({ error: "Device not found" }); return; }
  const now = new Date();
  const batch = db.batch();
  batch.update(deviceRef, { status: "OFF", lastChangedSource: "SAFETY", updatedAt: Timestamp.fromDate(now) });
  const alertRef = db.collection(`households/${DEMO_HOUSEHOLD_ID}/alerts`).doc(`safety-${deviceId}-${now.getTime()}`);
  batch.set(alertRef, { id: alertRef.id, householdId: DEMO_HOUSEHOLD_ID, severity: "CRITICAL", message: `${device.name} was turned off by safety monitoring.`, source: "SAFETY", deviceId, read: false, createdAt: Timestamp.fromDate(now) });
  const usageRef = db.collection(`households/${DEMO_HOUSEHOLD_ID}/usage`).doc(`cutoff-${deviceId}-${now.getTime()}`);
  batch.set(usageRef, { id: usageRef.id, householdId: DEMO_HOUSEHOLD_ID, deviceId, deviceType: device.type, eventType: "SAFETY_CUTOFF", source: "SAFETY", startTime: device.updatedAt, endTime: Timestamp.fromDate(now), cutoffReason: "Maximum active duration exceeded" });
  await batch.commit();
  response.json({ deviceId, cutoff: true, alertId: alertRef.id, usageId: usageRef.id });
});

async function runAutomationEvaluation(now = new Date()) {
  const devices = await db.collection(`households/${DEMO_HOUSEHOLD_ID}/devices`).get();
  const batch = db.batch();
  let writes = 0;
  for (const item of devices.docs) {
    const device = item.data();
    const maxMinutes = device.capabilities?.safetyMaxDurationMinutes;
    const updatedAt = device.updatedAt?.toDate?.() ?? new Date(device.updatedAt);
    if (device.type === "iron" && device.status === "ON" && maxMinutes && isSafetyCutoffDue(updatedAt, maxMinutes, now)) {
      batch.update(item.ref, { status: "OFF", lastChangedSource: "SAFETY", updatedAt: Timestamp.fromDate(now) });
      const alertRef = db.collection(`households/${DEMO_HOUSEHOLD_ID}/alerts`).doc(`auto-safety-${item.id}-${updatedAt.getTime()}`);
      batch.set(alertRef, { id: alertRef.id, householdId: DEMO_HOUSEHOLD_ID, severity: "CRITICAL", message: `${device.name} was turned off by safety monitoring.`, source: "SAFETY", deviceId: item.id, read: false, createdAt: Timestamp.fromDate(now) }, { merge: true });
      const usageRef = db.collection(`households/${DEMO_HOUSEHOLD_ID}/usage`).doc(`auto-cutoff-${item.id}-${updatedAt.getTime()}`);
      batch.set(usageRef, { id: usageRef.id, householdId: DEMO_HOUSEHOLD_ID, deviceId: item.id, deviceType: device.type, eventType: "SAFETY_CUTOFF", source: "SAFETY", startTime: device.updatedAt, endTime: Timestamp.fromDate(now), cutoffReason: "Maximum active duration exceeded" }, { merge: true });
      writes += 3;
    }
  }
  if (writes) await batch.commit();

  const schedules = await db.collection(`households/${DEMO_HOUSEHOLD_ID}/schedules`).where("enabled", "==", true).get();
  const scheduleBatch = db.batch();
  let scheduleWrites = 0;
  for (const scheduleDoc of schedules.docs) {
    const schedule = scheduleDoc.data() as { deviceId: string; days: number[]; startTime: string; endTime: string; timezone: string };
    const deviceRef = db.doc(`households/${DEMO_HOUSEHOLD_ID}/devices/${schedule.deviceId}`);
    const deviceSnapshot = await deviceRef.get();
    const device = deviceSnapshot.data();
    if (!device || device.health !== "CONNECTED") continue;
    const desiredStatus = isScheduleActive(schedule, now) ? "ON" : "OFF";
    if (device.status !== desiredStatus && device.lastChangedSource !== "SAFETY") {
      scheduleBatch.update(deviceRef, { status: desiredStatus, lastChangedSource: "SCHEDULE", updatedAt: Timestamp.fromDate(now) });
      const eventRef = db.collection(`households/${DEMO_HOUSEHOLD_ID}/events`).doc(`schedule-${scheduleDoc.id}-${now.toISOString().slice(0, 13)}`);
      scheduleBatch.set(eventRef, { id: eventRef.id, householdId: DEMO_HOUSEHOLD_ID, deviceId: schedule.deviceId, source: "SCHEDULE", message: `${device.name} changed to ${desiredStatus} by schedule.`, createdAt: Timestamp.fromDate(now) }, { merge: true });
      scheduleWrites += 2;
    }
  }
  if (scheduleWrites) await scheduleBatch.commit();
}

/** Cloud Scheduler invokes this in deployed environments. */
export const evaluateSafetyAndSchedules = onSchedule("every 1 minutes", async () => {
  await runAutomationEvaluation();
});

/** Lets the local Emulator Suite execute the same scheduled evaluation on demand. */
export const runAutomation = onRequest(async (_request, response) => {
  await runAutomationEvaluation();
  response.json({ evaluated: true });
});

/** Records ordinary ON to OFF usage sessions. Safety cutoffs create their own
 * SAFETY_CUTOFF record, so this trigger deliberately ignores SAFETY writes. */
export const trackDeviceUsage = onDocumentUpdated("households/{householdId}/devices/{deviceId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();
  if (!before || !after || before.status === after.status || after.status === "ERROR" || after.status === "DISCONNECTED" || after.lastChangedSource === "SAFETY") return;

  const householdId = event.params.householdId;
  const deviceId = event.params.deviceId;
  const usage = db.collection(`households/${householdId}/usage`);
  const changedAt = after.updatedAt?.toDate?.() ?? new Date(after.updatedAt ?? Date.now());

  if (after.status === "ON") {
    const id = `session-${deviceId}-${changedAt.getTime()}`;
    await usage.doc(id).set({ id, householdId, deviceId, deviceType: after.type, eventType: "POWER_SESSION", source: after.lastChangedSource ?? "USER", startTime: Timestamp.fromDate(changedAt) }, { merge: true });
    return;
  }

  const open = await usage.where("deviceId", "==", deviceId).where("eventType", "==", "POWER_SESSION").get();
  const session = open.docs.find((doc) => !doc.data().endTime);
  if (!session) return;
  const data = session.data();
  const start = data.startTime?.toDate?.() ?? new Date(data.startTime);
  await session.ref.update({ endTime: Timestamp.fromDate(changedAt), durationSeconds: Math.max(0, Math.round((changedAt.getTime() - start.getTime()) / 1000)) });
});
