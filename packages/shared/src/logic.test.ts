import assert from "node:assert/strict";
import test from "node:test";
import { isSafetyCutoffDue, isScheduleActive } from "./automation.ts";
import { canToggleDevice, nextToggleStatus, shouldTrackUsage } from "./controls.ts";
import { canPlace, fitsGrid, positionsOverlap } from "./layout.ts";

test("layout validation accepts in-bounds non-overlapping rectangles", () => {
  assert.equal(fitsGrid({ column: 1, row: 1, width: 2, height: 2 }, 6, 4), true);
  assert.equal(canPlace({ column: 3, row: 3, width: 2, height: 2 }, [{ column: 1, row: 1, width: 2, height: 2 }], 6, 4), true);
});

test("layout validation rejects overlap and out-of-bounds rectangles", () => {
  assert.equal(positionsOverlap({ column: 1, row: 1, width: 2, height: 2 }, { column: 2, row: 2, width: 2, height: 2 }), true);
  assert.equal(canPlace({ column: 2, row: 2, width: 2, height: 2 }, [{ column: 1, row: 1, width: 2, height: 2 }], 6, 4), false);
  assert.equal(fitsGrid({ column: 6, row: 4, width: 2, height: 1 }, 6, 4), false);
});

test("schedule boundaries use Asia/Colombo and exclude the end minute", () => {
  const schedule = { days: [1], startTime: "18:00", endTime: "23:00", timezone: "Asia/Colombo" };
  assert.equal(isScheduleActive(schedule, new Date("2026-01-05T12:30:00.000Z")), true);
  assert.equal(isScheduleActive(schedule, new Date("2026-01-05T17:30:00.000Z")), false);
});

test("safety cutoff begins exactly at the configured maximum duration", () => {
  const onAt = new Date("2026-01-01T00:00:00.000Z");
  assert.equal(isSafetyCutoffDue(onAt, 30, new Date("2026-01-01T00:29:59.000Z")), false);
  assert.equal(isSafetyCutoffDue(onAt, 30, new Date("2026-01-01T00:30:00.000Z")), true);
});

test("connected outlets can toggle but unsafe health states cannot", () => {
  assert.equal(canToggleDevice("OFF", "CONNECTED"), true);
  assert.equal(nextToggleStatus("OFF"), "ON");
  assert.equal(canToggleDevice("ON", "DISCONNECTED"), false);
  assert.equal(canToggleDevice("ERROR", "CONNECTED"), false);
});

test("usage tracking ignores safety and non-power transitions", () => {
  assert.equal(shouldTrackUsage("OFF", "ON", "USER"), true);
  assert.equal(shouldTrackUsage("ON", "OFF", "SIMULATOR"), true);
  assert.equal(shouldTrackUsage("ON", "OFF", "SAFETY"), false);
  assert.equal(shouldTrackUsage("ON", "ERROR", "USER"), false);
});
