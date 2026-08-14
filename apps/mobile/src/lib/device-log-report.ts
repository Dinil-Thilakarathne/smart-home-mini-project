import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { EncodingType, StorageAccessFramework } from "expo-file-system/legacy";
import { Platform } from "react-native";
import type { DeviceLog, UsageRecord } from "@smart-home/shared";

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character] ?? character);
}

function getFileName(selectedDeviceName: string) {
  const name = selectedDeviceName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "device-log";
  return `smart-home-${name}-audit-${new Date().toISOString().slice(0, 10)}`;
}

export async function createDeviceLogPdf(logs: DeviceLog[], usage: UsageRecord[], selectedDeviceName: string) {
  const rows = logs.map((log) => `<tr><td>${escapeHtml(log.createdAt)}</td><td>${escapeHtml(log.deviceName)}</td><td>${escapeHtml(log.source)}</td><td>${log.changes.map(escapeHtml).join("<br />")}</td></tr>`).join("");
  const totalKwh = usage.reduce((total, item) => total + (item.estimatedEnergyKwh ?? 0), 0);
  const usageRows = usage.map((item) => `<tr><td>${escapeHtml(item.deviceId)}</td><td>${item.powerWatts ?? 0}W</td><td>${Math.round((item.durationSeconds ?? 0) / 60)} min</td><td>${(item.estimatedEnergyKwh ?? 0).toFixed(4)} kWh</td></tr>`).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif;color:#132019;padding:28px}h1{font-size:24px;margin:0 0 6px}h2{font-size:16px;margin:28px 0 10px}p{color:#68766C;font-size:12px;margin:0 0 16px}.metric{background:#E1F3E8;border:1px solid #B8DEC6;border-radius:10px;padding:12px;color:#176B4D;font-weight:bold}table{width:100%;border-collapse:collapse;font-size:11px}th{text-align:left;background:#176B4D;color:#fff;padding:9px}td{vertical-align:top;border-bottom:1px solid #D8E2D9;padding:9px;line-height:1.45}</style></head><body><h1>Smart Home Device Audit Log</h1><p>Scope: ${escapeHtml(selectedDeviceName)} | Generated: ${escapeHtml(new Date().toLocaleString())}</p><p class="metric">Estimated energy used: ${totalKwh.toFixed(4)} kWh</p><h2>Power usage sessions</h2><table><thead><tr><th>Device</th><th>Rated load</th><th>Duration</th><th>Energy</th></tr></thead><tbody>${usageRows || "<tr><td colspan=\"4\">No completed power sessions recorded.</td></tr>"}</tbody></table><h2>Audit timeline</h2><table><thead><tr><th>Time</th><th>Device</th><th>Source</th><th>Change</th></tr></thead><tbody>${rows || "<tr><td colspan=\"4\">No device changes recorded.</td></tr>"}</tbody></table></body></html>`;
  return Print.printToFileAsync({ html });
}

export async function shareDeviceLogPdf(logs: DeviceLog[], usage: UsageRecord[], selectedDeviceName: string) {
  const file = await createDeviceLogPdf(logs, usage, selectedDeviceName);
  if (!await Sharing.isAvailableAsync()) throw new Error("PDF sharing is not available on this device.");
  await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: "Export device audit log" });
}

export async function downloadDeviceLogPdf(logs: DeviceLog[], usage: UsageRecord[], selectedDeviceName: string) {
  const file = await createDeviceLogPdf(logs, usage, selectedDeviceName);

  if (Platform.OS !== "android") {
    if (!await Sharing.isAvailableAsync()) throw new Error("Saving PDFs is not available on this device.");
    await Sharing.shareAsync(file.uri, { mimeType: "application/pdf", dialogTitle: "Save device audit log" });
    return;
  }

  const permission = await StorageAccessFramework.requestDirectoryPermissionsAsync();
  if (!permission.granted) throw new Error("Download cancelled.");

  const destination = await StorageAccessFramework.createFileAsync(permission.directoryUri, getFileName(selectedDeviceName), "application/pdf");
  const pdf = await StorageAccessFramework.readAsStringAsync(file.uri, { encoding: EncodingType.Base64 });
  await StorageAccessFramework.writeAsStringAsync(destination, pdf, { encoding: EncodingType.Base64 });
}
