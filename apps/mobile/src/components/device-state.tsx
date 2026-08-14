import { StyleSheet, View } from "react-native";
import type { DeviceHealth, DeviceStatus } from "@smart-home/shared";
import { Text } from "@/components/ui/text";
import { statusColors, type FeedbackTone } from "@/constants/status";

export function deviceTone(status: DeviceStatus, health: DeviceHealth): FeedbackTone {
  if (health === "ERROR" || status === "ERROR") return "danger";
  if (health === "DISCONNECTED" || status === "DISCONNECTED") return "warning";
  if (status === "ON") return "success";
  return "neutral";
}

export function deviceStateLabel(status: DeviceStatus, health: DeviceHealth) {
  if (status === "ERROR") return "Failed";
  if (status === "DISCONNECTED") return "Offline";
  return status === "ON" ? "Power on" : "Power off";
}

function healthTone(health: DeviceHealth): FeedbackTone {
  if (health === "ERROR") return "danger";
  if (health === "DISCONNECTED") return "warning";
  return "success";
}

export function DeviceHealthBadge({ health }: { health: DeviceHealth }) {
  const tone = healthTone(health); const color = statusColors[tone];
  const label = health === "CONNECTED" ? "Online" : health === "ERROR" ? "Error" : "Offline";
  return <View style={[styles.badge, { backgroundColor: color.surface, borderColor: color.border }]}><View style={[styles.dot, { backgroundColor: color.strong }]} /><Text style={[styles.text, { color: color.text }]}>{label}</Text></View>;
}

export function DeviceStateBadge({ status, health }: { status: DeviceStatus; health: DeviceHealth }) {
  const tone = deviceTone(status, health); const color = statusColors[tone];
  return <View style={styles.root}><View style={[styles.badge, { backgroundColor: color.surface, borderColor: color.border }]}><View style={[styles.dot, { backgroundColor: color.strong }]} /><Text style={[styles.text, { color: color.text }]}>{deviceStateLabel(status, health)}</Text></View><DeviceHealthBadge health={health} /></View>;
}

const styles = StyleSheet.create({ root: { alignItems: "flex-end", gap: 5 }, badge: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 }, dot: { width: 7, height: 7, borderRadius: 4 }, text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 } });
