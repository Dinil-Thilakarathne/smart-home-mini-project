import { useEffect, useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { canToggleDevice, DEMO_HOUSEHOLD_ID, demoDevices, demoFloors, demoHousehold, devicePath, formatRuntime, getLiveRuntime, type Device, type UsageRecord } from "@smart-home/shared";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { useDemoAlerts, useDemoDevices, useDemoSwitches, useDemoUsage } from "@/lib/demo-data";
import { firestore } from "@/lib/firebase";
import { AppNav } from "@/components/app-nav";
import { FeedbackBanner } from "@/components/feedback-banner";
import { DismissibleAlert } from "@/components/dismissible-alert";
import { statusColors, toneForAlert } from "@/constants/status";
import { deviceTone, DeviceHealthBadge } from "@/components/device-state";
import Toast from "react-native-toast-message";
import { useDemoProfile } from "@/lib/demo-profile";

const colors = { background: "#EEF2EE", ink: "#132019", muted: "#68766C", card: "#FFFFFF", line: "#D8E2D9", accent: "#176B4D", warning: "#A85A16" };

export default function HomeScreen() {
  const profile = useDemoProfile();
  const live = useDemoDevices();
  const { alerts, dismissAlert } = useDemoAlerts();
  const usage = useDemoUsage();
  const [pendingDevice, setPendingDevice] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);
  const devices = live.ready ? live.devices : demoDevices;
  const activeDevices = useMemo(() => devices.filter((device) => device.status === "ON"), [devices]);
  const attentionCount = devices.filter((device) => device.health !== "CONNECTED").length;

  async function setDeviceStatus(deviceId: string, next: "ON" | "OFF") {
    const device = devices.find((item) => item.id === deviceId);
    if (!device || !live.ready || !canToggleDevice(device.status, device.health) || pendingDevice) return;
    setPendingDevice(deviceId);
    try {
      if (device.type === "switch-unit") {
        const switchDocs = await getDocs(collection(firestore, `${devicePath(DEMO_HOUSEHOLD_ID, deviceId)}/switches`));
        await Promise.all(switchDocs.docs.map((item) => updateDoc(item.ref, { status: next, updatedAt: new Date().toISOString() })));
      }
      await updateDoc(doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, deviceId)), { status: next, lastChangedSource: "USER", updatedAt: new Date().toISOString() });
      Toast.show({ type: "success", text1: "Device updated", text2: `${device.name} is now ${next}.` });
    } catch { Toast.show({ type: "error", text1: "Update failed", text2: `We could not update ${device.name}. Check the connection and try again.` }); }
    finally { setPendingDevice(null); }
  }

  if (!profile.ready) return <SafeAreaView style={styles.safeArea} />;
  if (!profile.name) return <Redirect href="/welcome" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Box style={styles.header}>
          <Box><Text style={styles.eyebrow}>SMART HOME · {profile.name.toUpperCase()}</Text><Text style={styles.title}>{demoHousehold.name}</Text></Box>
          <Box style={styles.statusPill}><Box style={styles.statusDot} /><Text style={styles.statusText}>Connected</Text></Box>
        </Box>
        {live.error && <FeedbackBanner tone="danger" title="Sync unavailable" message={`${live.error} Check the emulator host and Wi-Fi connection.`} />}
        {alerts.slice(0, 2).map((alert) => <DismissibleAlert key={alert.id} tone={toneForAlert(alert.severity)} title={`${alert.severity} · ${alert.time}`} message={alert.message} onDismiss={() => void dismissAlert(alert.id).catch(() => Toast.show({ type: "error", text1: "Could not dismiss alert", text2: "Try again when the connection is restored." }))} />)}
        <Card style={styles.summaryCard}><CardHeader>
          <Text style={styles.cardLabel}>RIGHT NOW</Text>
          <Text style={styles.summaryTitle}>{activeDevices.length} device{activeDevices.length === 1 ? "" : "s"} active</Text>
          </CardHeader><CardBody>
          <Text style={styles.summaryBody}>{attentionCount === 0 ? "Everything is reporting normally." : `${attentionCount} device needs your attention.`}</Text>
          </CardBody></Card>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Floors</Text><Text style={styles.sectionMeta}>{devices.length} devices</Text></View>
        {demoFloors.map((floor) => {
          const floorDevices = devices.filter((device) => device.floorId === floor.id);
          return <Pressable key={floor.id} style={styles.floorCard} accessibilityRole="button">
            <Box style={styles.floorTopline}><Text style={styles.floorName}>{floor.name}</Text><Text style={styles.chevron}>›</Text></Box>
            <Text style={styles.floorMeta}>{floorDevices.length} device{floorDevices.length === 1 ? "" : "s"} · {floor.gridColumns} × {floor.gridRows} grid</Text>
            <Box style={styles.deviceStack}>{floorDevices.map((device) => { const unavailable = !canToggleDevice(device.status, device.health); const tone = deviceTone(device.status, device.health); const palette = statusColors[tone]; return <View key={device.id} style={[styles.deviceAction, { backgroundColor: palette.surface, borderColor: palette.border }]}><Box style={styles.deviceActionCopy}><Text style={styles.deviceName} numberOfLines={1}>{device.name}</Text><Text style={[styles.deviceHint, { color: palette.text }]}>{pendingDevice === device.id ? "Saving change…" : unavailable ? `${device.health === "ERROR" ? "Error detected" : "Offline"} · control unavailable` : runtimeSummary(device, usage, now)}</Text></Box><DevicePowerControl status={device.status} disabled={unavailable || pendingDevice !== null} pending={pendingDevice === device.id} onChange={(next) => void setDeviceStatus(device.id, next)} /><DeviceHealthBadge health={device.health} /></View>; })}</Box>
            {floorDevices.filter((device) => device.type === "switch-unit").map((device) => <Switches key={`${device.id}-switches`} deviceId={device.id} />)}
          </Pressable>;
        })}
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Today</Text><Text style={styles.sectionMeta}>Asia/Colombo</Text></View>
        <View style={styles.activityCard}><Text style={styles.activityTitle}>Safety monitoring is ready</Text><Text style={styles.activityBody}>Iron cutoffs and scheduled lighting will appear here as activity.</Text><Text style={styles.activitySource}>DEMO HOUSEHOLD</Text></View>
        <View style={styles.activityCard}><Text style={styles.activityTitle}>Camera preview</Text><Text style={styles.activityBody}>Front door camera · Snapshot placeholder · No live stream configured</Text><Text style={styles.activitySource}>GROUND FLOOR</Text></View>
        {usage.map((item) => <View key={item.id} style={styles.activityCard}><Text style={styles.activityTitle}>{item.eventType.replace("_", " ")}</Text><Text style={styles.activityBody}>{item.deviceId} · {item.cutoffReason ?? "Device activity recorded"}</Text></View>)}
      </ScrollView>
      <AppNav />
    </SafeAreaView>
  );
}

function DevicePowerControl({ status, disabled, pending, onChange }: { status: Device["status"]; disabled: boolean; pending: boolean; onChange: (status: "ON" | "OFF") => void }) {
  const controllable = status === "ON" || status === "OFF";
  return <View style={styles.powerControl} accessibilityLabel={`Power ${status === "ON" ? "on" : "off"}`}><Pressable disabled={disabled || pending || !controllable} onPress={() => onChange("OFF")} style={[styles.powerButton, status === "OFF" && styles.powerButtonActive]} accessibilityRole="button" accessibilityState={{ disabled: disabled || pending, selected: status === "OFF" }}><Text style={[styles.powerButtonText, status === "OFF" && styles.powerButtonTextActive]}>OFF</Text></Pressable><Pressable disabled={disabled || pending || !controllable} onPress={() => onChange("ON")} style={[styles.powerButton, status === "ON" && styles.powerButtonActive]} accessibilityRole="button" accessibilityState={{ disabled: disabled || pending, selected: status === "ON" }}><Text style={[styles.powerButtonText, status === "ON" && styles.powerButtonTextActive]}>ON</Text></Pressable></View>;
}

function runtimeSummary(device: Device, usage: UsageRecord[], now: number) {
  const runtime = getLiveRuntime(device, now);
  if (runtime.isRunning) {
    if (device.type === "iron" && runtime.remainingSafetySeconds !== null) {
      return runtime.safetyCutoffDue
        ? "Safety cutoff pending"
        : `Auto-off in ${formatRuntime(runtime.remainingSafetySeconds)} · ${runtime.estimatedEnergyKwh.toFixed(4)} kWh`;
    }
    const label = device.type === "camera" ? "Online" : "Running";
    return `${label} ${formatRuntime(runtime.elapsedSeconds)} · ${device.powerWatts}W · ${runtime.estimatedEnergyKwh.toFixed(4)} kWh`;
  }
  const lastSession = usage.find((item) => item.deviceId === device.id);
  return lastSession
    ? `Last active ${formatRuntime(lastSession.durationSeconds ?? 0)} · ${(lastSession.estimatedEnergyKwh ?? 0).toFixed(4)} kWh`
    : "Tap to toggle power";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, gap: 14, paddingBottom: 34 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 24, backgroundColor: "#E0EEE6", paddingHorizontal: 12, paddingVertical: 9 }, statusDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.accent }, statusText: { color: colors.accent, fontSize: 11, fontWeight: "800" },
  summaryCard: { backgroundColor: colors.accent, borderRadius: 26, padding: 22, shadowColor: "#0B3E2B", shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, cardLabel: { color: "#B9D9C8", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 }, summaryTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginTop: 10 }, summaryBody: { color: "#D9ECE1", fontSize: 14, lineHeight: 20, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.2 }, sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: "600" }, floorCard: { backgroundColor: colors.card, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: colors.line, shadowColor: "#183126", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, floorTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, floorName: { color: colors.ink, fontSize: 17, fontWeight: "800" }, chevron: { color: colors.accent, fontSize: 28, lineHeight: 24, fontWeight: "300" }, floorMeta: { color: colors.muted, fontSize: 12, marginTop: 6 },
  deviceStack: { gap: 8, marginTop: 15 }, deviceAction: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, borderWidth: 1, borderRadius: 16, paddingHorizontal: 13, paddingVertical: 12 }, deviceActionCopy: { flex: 1 }, deviceName: { color: colors.ink, fontSize: 14, fontWeight: "800" }, deviceHint: { fontSize: 11, fontWeight: "600", marginTop: 3 }, deviceState: { fontSize: 10, fontWeight: "800", letterSpacing: 0.6 }, powerControl: { flexDirection: "row", borderRadius: 9, backgroundColor: "rgba(19, 32, 25, 0.08)", padding: 2, gap: 2 }, powerButton: { minWidth: 38, alignItems: "center", borderRadius: 7, paddingHorizontal: 6, paddingVertical: 6 }, powerButtonActive: { backgroundColor: colors.accent }, powerButtonText: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }, powerButtonTextActive: { color: "#FFFFFF" }, activityCard: { backgroundColor: colors.card, borderRadius: 20, padding: 17, borderWidth: 1, borderColor: colors.line }, activityTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" }, activityBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, activitySource: { color: colors.warning, fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginTop: 14 },
  syncError: { color: "#A33A2B", backgroundColor: "#FCE9E5", borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18 }, alertCard: { backgroundColor: "#FFF1D8", borderRadius: 14, padding: 13, borderWidth: 1, borderColor: "#F0D19B" }, alertLabel: { color: colors.warning, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 }, alertText: { color: colors.ink, fontSize: 13, marginTop: 4 }, switchBox: { marginTop: 8, gap: 6, backgroundColor: colors.background, borderRadius: 12, padding: 8 }, switchHeader: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 8, paddingBottom: 2 }, switchLabel: { color: colors.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1.2 }, switchCount: { color: colors.accent, fontSize: 10, fontWeight: "800" }, switchRow: { flexDirection: "row", justifyContent: "space-between", padding: 9, borderWidth: 1, borderRadius: 9 }, switchRowOn: { backgroundColor: "#E1F3E8", borderColor: "#B8DEC6" }, switchRowOff: { backgroundColor: "#F5F7F5", borderColor: "#D9E0DA" },
});

function Switches({ deviceId }: { deviceId: string }) {
  const { switches, toggleSwitch } = useDemoSwitches(deviceId);
  const activeCount = switches.filter((item) => item.status === "ON").length;
  return <View style={styles.switchBox}><View style={styles.switchHeader}><Text style={styles.switchLabel}>INDIVIDUAL SWITCHES</Text><Text style={styles.switchCount}>{activeCount}/{switches.length} ON</Text></View>{switches.map((item) => { const active = item.status === "ON"; return <Pressable key={item.id} onPress={() => void toggleSwitch(item.id, item.status)} style={[styles.switchRow, active ? styles.switchRowOn : styles.switchRowOff]}><Text style={styles.deviceName}>{item.name}</Text><Text style={[styles.deviceState, { color: active ? colors.accent : colors.muted }]}>{item.status}</Text></Pressable>; })}</View>;
}
