import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_INTERVAL_MS = 60_000;

function firebaseProjectId() {
  if (process.env.SMART_HOME_FIREBASE_PROJECT_ID) return process.env.SMART_HOME_FIREBASE_PROJECT_ID;

  try {
    const config = JSON.parse(readFileSync(resolve(".firebaserc"), "utf8"));
    return config.projects?.default ?? "mad-mini--project";
  } catch {
    return "mad-mini--project";
  }
}

const intervalMs = Number(process.env.SMART_HOME_AUTOMATION_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
if (!Number.isFinite(intervalMs) || intervalMs < 1_000) {
  throw new Error("SMART_HOME_AUTOMATION_INTERVAL_MS must be at least 1000 milliseconds.");
}

const projectId = firebaseProjectId();
const endpoint = `http://127.0.0.1:5001/${projectId}/us-central1/runAutomation`;
let evaluating = false;

async function evaluate() {
  if (evaluating) return;
  evaluating = true;

  try {
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error(`Functions emulator returned ${response.status}.`);
    console.log(`[automation] Evaluated safety and schedules at ${new Date().toLocaleTimeString()}.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[automation] Evaluation failed: ${message}`);
    console.error("[automation] Start the Firebase Emulator Suite with pnpm dev:firebase, then keep this worker running.");
  } finally {
    evaluating = false;
  }
}

console.log(`[automation] Local worker started. Evaluating every ${Math.round(intervalMs / 1000)} seconds.`);
console.log(`[automation] Functions endpoint: ${endpoint}`);
await evaluate();

const timer = setInterval(() => void evaluate(), intervalMs);
function stop() {
  clearInterval(timer);
  console.log("\n[automation] Local worker stopped.");
  process.exit(0);
}

process.on("SIGINT", stop);
process.on("SIGTERM", stop);
