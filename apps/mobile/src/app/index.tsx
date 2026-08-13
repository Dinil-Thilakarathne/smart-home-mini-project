import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonText } from "@/components/ui/button";
import { DEMO_HOUSEHOLD_ID, demoDevices, demoFloors, demoHousehold, devicePath } from "@smart-home/shared";
import { doc, updateDoc } from "firebase/firestore";
import { useDemoAlerts, useDemoDevices, useDemoSwitches, useDemoUsage } from "@/lib/demo-data";
import { firestore } from "@/lib/firebase";
import { AppNav } from "@/components/app-nav";

const colors = { background: "#EEF2EE", ink: "#132019", muted: "#68766C", card: "#FFFFFF", line: "#D8E2D9", accent: "#176B4D", warning: "#A85A16" };

export default function HomeScreen() {
  const live = useDemoDevices();
  const alerts = useDemoAlerts();
  const usage = useDemoUsage();
  const [pendingDevice, setPendingDevice] = useState<string | null>(null);
  const [controlError, setControlError] = useState<string | null>(null);
  const devices = live.ready ? live.devices : demoDevices;
  const activeDevices = useMemo(() => devices.filter((device) => device.status === "ON"), [devices]);
  const attentionCount = devices.filter((device) => device.health !== "CONNECTED").length;

  async function toggleDevice(deviceId: string, status: "ON" | "OFF") {
    if (!live.ready || pendingDevice) return;
    setPendingDevice(deviceId); setControlError(null);
    try {
      await updateDoc(doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, deviceId)), { status: status === "ON" ? "OFF" : "ON", lastChangedSource: "USER", updatedAt: new Date().toISOString() });
    } catch { setControlError("Could not update the device. Try again."); }
    finally { setPendingDevice(null); }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Box style={styles.header}>
          <Box><Text style={styles.eyebrow}>SMART HOME</Text><Text style={styles.title}>{demoHousehold.name}</Text></Box>
          <Box style={styles.statusPill}><Box style={styles.statusDot} /><Text style={styles.statusText}>Connected</Text></Box>
        </Box>
        {live.error && <Text style={styles.syncError}>{live.error} Check the emulator host and Wi-Fi connection.</Text>}
        {controlError && <Text style={styles.syncError}>{controlError}</Text>}
        {alerts.map((alert) => <View key={alert.id} style={styles.alertCard}><Text style={styles.alertLabel}>{alert.severity}</Text><Text style={styles.alertText}>{alert.message}</Text></View>)}
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
            <Box style={styles.deviceRow}>{floorDevices.map((device) => <Button key={device.id} isDisabled={device.health !== "CONNECTED" || pendingDevice !== null} onPress={() => void toggleDevice(device.id, device.status === "ON" ? "ON" : "OFF")} style={[styles.deviceChip, device.health !== "CONNECTED" && styles.disabledChip]} accessibilityLabel={`Toggle ${device.name}`}><Box style={[styles.deviceDot, { backgroundColor: device.status === "ON" ? colors.accent : colors.line }]} /><ButtonText style={styles.deviceName} numberOfLines={1}>{device.name}</ButtonText><Text style={styles.deviceState}>{pendingDevice === device.id ? "SAVING" : device.health !== "CONNECTED" ? device.health : device.status}</Text></Button>)}</Box>
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, gap: 14, paddingBottom: 34 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 6 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 24, backgroundColor: "#E0EEE6", paddingHorizontal: 12, paddingVertical: 9 }, statusDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.accent }, statusText: { color: colors.accent, fontSize: 11, fontWeight: "800" },
  summaryCard: { backgroundColor: colors.accent, borderRadius: 26, padding: 22, shadowColor: "#0B3E2B", shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, cardLabel: { color: "#B9D9C8", fontSize: 10, fontWeight: "800", letterSpacing: 1.8 }, summaryTitle: { color: "#FFFFFF", fontSize: 28, fontWeight: "800", letterSpacing: -0.5, marginTop: 10 }, summaryBody: { color: "#D9ECE1", fontSize: 14, lineHeight: 20, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginTop: 10 }, sectionTitle: { color: colors.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.2 }, sectionMeta: { color: colors.muted, fontSize: 12, fontWeight: "600" }, floorCard: { backgroundColor: colors.card, borderRadius: 22, padding: 17, borderWidth: 1, borderColor: colors.line, shadowColor: "#183126", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, floorTopline: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, floorName: { color: colors.ink, fontSize: 17, fontWeight: "800" }, chevron: { color: colors.accent, fontSize: 28, lineHeight: 24, fontWeight: "300" }, floorMeta: { color: colors.muted, fontSize: 12, marginTop: 6 },
  deviceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 15 }, deviceChip: { flexDirection: "row", alignItems: "center", gap: 7, maxWidth: "100%", backgroundColor: "#F0F5F1", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 10 }, deviceDot: { width: 9, height: 9, borderRadius: 9 }, deviceName: { color: colors.ink, fontSize: 12, maxWidth: 125, fontWeight: "700" }, deviceState: { color: colors.accent, fontSize: 10, fontWeight: "800" }, activityCard: { backgroundColor: colors.card, borderRadius: 20, padding: 17, borderWidth: 1, borderColor: colors.line }, activityTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" }, activityBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, activitySource: { color: colors.warning, fontSize: 10, fontWeight: "800", letterSpacing: 1.3, marginTop: 14 },
  syncError: { color: "#A33A2B", backgroundColor: "#FCE9E5", borderRadius: 12, padding: 12, fontSize: 12, lineHeight: 18 }, alertCard: { backgroundColor: "#FFF1D8", borderRadius: 14, padding: 13, borderWidth: 1, borderColor: "#F0D19B" }, alertLabel: { color: colors.warning, fontSize: 10, fontWeight: "700", letterSpacing: 1.2 }, alertText: { color: colors.ink, fontSize: 13, marginTop: 4 }, switchBox: { marginTop: 8, gap: 6, backgroundColor: colors.background, borderRadius: 12, padding: 8 }, switchRow: { flexDirection: "row", justifyContent: "space-between", padding: 8 }, disabledChip: { opacity: 0.55 },
});

function Switches({ deviceId }: { deviceId: string }) {
  const { switches, toggleSwitch } = useDemoSwitches(deviceId);
  return <View style={styles.switchBox}>{switches.map((item) => <Pressable key={item.id} onPress={() => void toggleSwitch(item.id, item.status)} style={styles.switchRow}><Text style={styles.deviceName}>{item.name}</Text><Text style={styles.deviceState}>{item.status}</Text></Pressable>)}</View>;
}
