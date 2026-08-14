import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { demoDevices } from "@smart-home/shared";
import { AppNav } from "@/components/app-nav";
import { FeedbackBanner } from "@/components/feedback-banner";
import { Text } from "@/components/ui/text";
import { exportDeviceLogPdf } from "@/lib/device-log-report";
import { useDemoDeviceLogs, useDemoDevices } from "@/lib/demo-data";

const sourceTone = { USER: "#176B4D", SIMULATOR: "#2E6FA6", SAFETY: "#A33A2B", SCHEDULE: "#87530E" } as const;

export default function ActivityScreen() {
  const live = useDemoDevices();
  const logs = useDemoDeviceLogs();
  const devices = live.ready ? live.devices : demoDevices;
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const visibleLogs = useMemo(() => selectedDeviceId ? logs.filter((log) => log.deviceId === selectedDeviceId) : logs, [logs, selectedDeviceId]);
  const selectedDeviceName = selectedDeviceId ? devices.find((device) => device.id === selectedDeviceId)?.name ?? "Selected device" : "All devices";

  async function exportLogs() {
    setExporting(true);
    try { await exportDeviceLogPdf(visibleLogs, selectedDeviceName); Toast.show({ type: "success", text1: "PDF ready", text2: "Choose where to save or share the audit log." }); }
    catch { Toast.show({ type: "error", text1: "PDF export failed", text2: "Try exporting again from a physical device." }); }
    finally { setExporting(false); }
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>ACTIVITY LOG</Text><Text style={styles.title}>Device history</Text><Text style={styles.body}>Every meaningful device change is recorded by the backend, including user, simulator, schedule, and safety actions.</Text>
    <View style={styles.summary}><View><Text style={styles.summaryValue}>{visibleLogs.length}</Text><Text style={styles.summaryLabel}>visible changes</Text></View><View style={styles.summaryRule} /><View><Text style={styles.summaryValue}>{devices.length}</Text><Text style={styles.summaryLabel}>tracked devices</Text></View></View>
    <Text style={styles.section}>Filter by device</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Pressable onPress={() => setSelectedDeviceId(null)} style={[styles.filter, selectedDeviceId === null && styles.filterActive]}><Text style={[styles.filterText, selectedDeviceId === null && styles.filterTextActive]}>All devices</Text></Pressable>{devices.map((device) => <Pressable key={device.id} onPress={() => setSelectedDeviceId(device.id)} style={[styles.filter, selectedDeviceId === device.id && styles.filterActive]}><Text numberOfLines={1} style={[styles.filterText, selectedDeviceId === device.id && styles.filterTextActive]}>{device.name}</Text></Pressable>)}</ScrollView>
    <Pressable onPress={() => void exportLogs()} disabled={exporting} style={[styles.exportButton, exporting && styles.exportDisabled]} accessibilityRole="button"><Text style={styles.exportText}>{exporting ? "Preparing PDF…" : `Export ${selectedDeviceName} log as PDF`}</Text></Pressable>
    <Text style={styles.section}>Change timeline</Text>
    {visibleLogs.length === 0 ? <FeedbackBanner tone="neutral" title="No device changes recorded" message="Change a device state, health, position, or configuration to create an audit record." /> : visibleLogs.map((log, index) => { const color = sourceTone[log.source] ?? "#526057"; return <View key={log.id} style={styles.timelineRow}><View style={[styles.timelineDot, { backgroundColor: color }]} />{index < visibleLogs.length - 1 && <View style={styles.timelineLine} />}<View style={styles.logCard}><View style={styles.logTop}><Text style={[styles.logSource, { color }]}>{log.source}</Text><Text style={styles.time}>{log.createdAt}</Text></View><Text style={styles.logTitle}>{log.deviceName}</Text>{log.changes.map((change) => <Text key={change} style={styles.logBody}>• {change}</Text>)}</View></View>; })}
  </ScrollView><AppNav /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EEF2EE" }, content: { padding: 20, gap: 13, paddingBottom: 34 }, eyebrow: { color: "#68766C", fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: "#132019", fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 }, body: { color: "#68766C", fontSize: 14, lineHeight: 20 }, summary: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#D8E2D9", padding: 17, marginTop: 5 }, summaryValue: { color: "#132019", fontSize: 24, fontWeight: "800" }, summaryLabel: { color: "#68766C", fontSize: 11, fontWeight: "700", marginTop: 2 }, summaryRule: { width: 1, height: 35, backgroundColor: "#D8E2D9", marginHorizontal: 22 }, section: { color: "#132019", fontSize: 18, fontWeight: "800", marginTop: 10 }, filters: { gap: 8, paddingRight: 4 }, filter: { maxWidth: 150, borderWidth: 1, borderColor: "#D8E2D9", backgroundColor: "#FFFFFF", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 }, filterActive: { backgroundColor: "#176B4D", borderColor: "#176B4D" }, filterText: { color: "#526057", fontSize: 11, fontWeight: "800" }, filterTextActive: { color: "#FFFFFF" }, exportButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#176B4D", borderRadius: 15, paddingVertical: 13 }, exportDisabled: { opacity: 0.6 }, exportText: { color: "#176B4D", fontSize: 13, fontWeight: "800" }, timelineRow: { position: "relative", paddingLeft: 23, paddingBottom: 2 }, timelineDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, top: 17, left: 0 }, timelineLine: { position: "absolute", width: 1, backgroundColor: "#D8E2D9", top: 27, bottom: -13, left: 4 }, logCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E2D9", borderRadius: 16, padding: 14 }, logTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, logSource: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, time: { color: "#68766C", fontSize: 10, fontWeight: "600", flexShrink: 1, textAlign: "right" }, logTitle: { color: "#132019", fontSize: 15, fontWeight: "800", marginTop: 7 }, logBody: { color: "#68766C", fontSize: 12, lineHeight: 18, marginTop: 4 },
});
