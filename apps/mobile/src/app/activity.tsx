import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { demoDevices } from "@smart-home/shared";
import { AppNav } from "@/components/app-nav";
import { FeedbackBanner } from "@/components/feedback-banner";
import { Text } from "@/components/ui/text";
import { downloadDeviceLogPdf, shareDeviceLogPdf } from "@/lib/device-log-report";
import { useDemoDeviceLogs, useDemoDevices, useDemoUsage } from "@/lib/demo-data";

const sourceTone = { USER: "#176B4D", SIMULATOR: "#2E6FA6", SAFETY: "#A33A2B", SCHEDULE: "#87530E" } as const;

export default function ActivityScreen() {
  const live = useDemoDevices();
  const logs = useDemoDeviceLogs();
  const usage = useDemoUsage();
  const devices = live.ready ? live.devices : demoDevices;
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"download" | "share" | null>(null);
  const visibleLogs = useMemo(() => selectedDeviceId ? logs.filter((log) => log.deviceId === selectedDeviceId) : logs, [logs, selectedDeviceId]);
  const visibleUsage = useMemo(() => selectedDeviceId ? usage.filter((item) => item.deviceId === selectedDeviceId) : usage, [usage, selectedDeviceId]);
  const energyKwh = useMemo(() => visibleUsage.reduce((total, item) => total + (item.estimatedEnergyKwh ?? 0), 0), [visibleUsage]);
  const selectedDeviceName = selectedDeviceId ? devices.find((device) => device.id === selectedDeviceId)?.name ?? "Selected device" : "All devices";

  async function downloadLogs() {
    setExporting("download");
    try { await downloadDeviceLogPdf(visibleLogs, visibleUsage, selectedDeviceName); Toast.show({ type: "success", text1: "PDF downloaded", text2: "The audit log was saved to your selected folder." }); }
    catch (error) { if (error instanceof Error && error.message === "Download cancelled.") return; Toast.show({ type: "error", text1: "PDF download failed", text2: "Try downloading again from a physical device." }); }
    finally { setExporting(null); }
  }

  async function shareLogs() {
    setExporting("share");
    try { await shareDeviceLogPdf(visibleLogs, visibleUsage, selectedDeviceName); Toast.show({ type: "success", text1: "PDF ready to share", text2: "Choose an app or contact to send the audit log." }); }
    catch { Toast.show({ type: "error", text1: "PDF sharing failed", text2: "Try sharing again from a physical device." }); }
    finally { setExporting(null); }
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>ACTIVITY LOG</Text><Text style={styles.title}>Device history</Text><Text style={styles.body}>Every meaningful device change is recorded by the backend, including user, simulator, schedule, and safety actions.</Text>
    <View style={styles.summary}><View><Text style={styles.summaryValue}>{visibleLogs.length}</Text><Text style={styles.summaryLabel}>visible changes</Text></View><View style={styles.summaryRule} /><View><Text style={styles.summaryValue}>{energyKwh.toFixed(3)}</Text><Text style={styles.summaryLabel}>estimated kWh</Text></View></View>
    <View style={styles.energyCard}><Text style={styles.energyLabel}>POWER USAGE</Text><Text style={styles.energyValue}>{energyKwh.toFixed(4)} kWh</Text><Text style={styles.energyBody}>{visibleUsage.length} completed session{visibleUsage.length === 1 ? "" : "s"} · Estimated from each device’s rated wattage and active duration.</Text></View>
    <Text style={styles.section}>Filter by device</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}><Pressable onPress={() => setSelectedDeviceId(null)} style={[styles.filter, selectedDeviceId === null && styles.filterActive]}><Text style={[styles.filterText, selectedDeviceId === null && styles.filterTextActive]}>All devices</Text></Pressable>{devices.map((device) => <Pressable key={device.id} onPress={() => setSelectedDeviceId(device.id)} style={[styles.filter, selectedDeviceId === device.id && styles.filterActive]}><Text numberOfLines={1} style={[styles.filterText, selectedDeviceId === device.id && styles.filterTextActive]}>{device.name}</Text></Pressable>)}</ScrollView>
    <View style={styles.exportRow}><Pressable onPress={() => void downloadLogs()} disabled={exporting !== null} style={[styles.downloadButton, exporting !== null && styles.exportDisabled]} accessibilityRole="button"><Text style={styles.downloadText}>{exporting === "download" ? "Preparing…" : "Download PDF"}</Text></Pressable><Pressable onPress={() => void shareLogs()} disabled={exporting !== null} style={[styles.shareButton, exporting !== null && styles.exportDisabled]} accessibilityRole="button"><Text style={styles.shareText}>{exporting === "share" ? "Preparing…" : "Share PDF"}</Text></Pressable></View>
    <Text style={styles.section}>Change timeline</Text>
    {visibleLogs.length === 0 ? <FeedbackBanner tone="neutral" title="No device changes recorded" message="Change a device state, health, position, or configuration to create an audit record." /> : visibleLogs.map((log, index) => { const color = sourceTone[log.source] ?? "#526057"; return <View key={log.id} style={styles.timelineRow}><View style={[styles.timelineDot, { backgroundColor: color }]} />{index < visibleLogs.length - 1 && <View style={styles.timelineLine} />}<View style={styles.logCard}><View style={styles.logTop}><Text style={[styles.logSource, { color }]}>{log.source}</Text><Text style={styles.time}>{log.createdAt}</Text></View><Text style={styles.logTitle}>{log.deviceName}</Text>{log.changes.map((change) => <Text key={change} style={styles.logBody}>• {change}</Text>)}</View></View>; })}
  </ScrollView><AppNav /></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EEF2EE" }, content: { padding: 20, gap: 13, paddingBottom: 34 }, eyebrow: { color: "#68766C", fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: "#132019", fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 }, body: { color: "#68766C", fontSize: 14, lineHeight: 20 }, summary: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#D8E2D9", padding: 17, marginTop: 5 }, summaryValue: { color: "#132019", fontSize: 24, fontWeight: "800" }, summaryLabel: { color: "#68766C", fontSize: 11, fontWeight: "700", marginTop: 2 }, summaryRule: { width: 1, height: 35, backgroundColor: "#D8E2D9", marginHorizontal: 22 }, energyCard: { backgroundColor: "#E1F3E8", borderWidth: 1, borderColor: "#B8DEC6", borderRadius: 18, padding: 15 }, energyLabel: { color: "#176B4D", fontSize: 10, fontWeight: "800", letterSpacing: 1.4 }, energyValue: { color: "#132019", fontSize: 24, fontWeight: "800", marginTop: 5 }, energyBody: { color: "#1E6240", fontSize: 12, lineHeight: 18, marginTop: 4 }, section: { color: "#132019", fontSize: 18, fontWeight: "800", marginTop: 10 }, filters: { gap: 8, paddingRight: 4 }, filter: { maxWidth: 150, borderWidth: 1, borderColor: "#D8E2D9", backgroundColor: "#FFFFFF", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 9 }, filterActive: { backgroundColor: "#176B4D", borderColor: "#176B4D" }, filterText: { color: "#526057", fontSize: 11, fontWeight: "800" }, filterTextActive: { color: "#FFFFFF" }, exportRow: { flexDirection: "row", gap: 10 }, downloadButton: { flex: 1, alignItems: "center", backgroundColor: "#176B4D", borderRadius: 15, paddingVertical: 13 }, downloadText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, shareButton: { flex: 1, alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#176B4D", borderRadius: 15, paddingVertical: 13 }, shareText: { color: "#176B4D", fontSize: 13, fontWeight: "800" }, exportDisabled: { opacity: 0.6 }, timelineRow: { position: "relative", paddingLeft: 23, paddingBottom: 2 }, timelineDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, top: 17, left: 0 }, timelineLine: { position: "absolute", width: 1, backgroundColor: "#D8E2D9", top: 27, bottom: -13, left: 4 }, logCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E2D9", borderRadius: 16, padding: 14 }, logTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, logSource: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, time: { color: "#68766C", fontSize: 10, fontWeight: "600", flexShrink: 1, textAlign: "right" }, logTitle: { color: "#132019", fontSize: 15, fontWeight: "800", marginTop: 7 }, logBody: { color: "#68766C", fontSize: 12, lineHeight: 18, marginTop: 4 },
});
