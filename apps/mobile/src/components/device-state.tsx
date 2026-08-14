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
  if (health === "ERROR" || status === "ERROR") return "Error";
  if (health === "DISCONNECTED" || status === "DISCONNECTED") return "Offline";
  return status === "ON" ? "On" : "Off";
}

export function DeviceStateBadge({ status, health }: { status: DeviceStatus; health: DeviceHealth }) {
  const tone = deviceTone(status, health); const color = statusColors[tone];
  return <View style={[styles.root, { backgroundColor: color.surface, borderColor: color.border }]}><View style={[styles.dot, { backgroundColor: color.strong }]} /><Text style={[styles.text, { color: color.text }]}>{deviceStateLabel(status, health)}</Text></View>;
}

const styles = StyleSheet.create({ root: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 }, dot: { width: 7, height: 7, borderRadius: 4 }, text: { fontSize: 10, fontWeight: "800", letterSpacing: 0.4 } });
