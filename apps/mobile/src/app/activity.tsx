import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppNav } from "@/components/app-nav";
import { Text } from "@/components/ui/text";
import { FeedbackBanner } from "@/components/feedback-banner";
import { statusColors, toneForAlert } from "@/constants/status";
import { useDemoAlerts, useDemoUsage } from "@/lib/demo-data";

export default function ActivityScreen() {
  const alerts = useDemoAlerts();
  const usage = useDemoUsage();
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.eyebrow}>ACTIVITY LOG</Text><Text style={styles.title}>Home history</Text><Text style={styles.body}>Safety notices, control results, and usage sessions from your connected household.</Text>
    <View style={styles.summary}><View><Text style={styles.summaryValue}>{alerts.length}</Text><Text style={styles.summaryLabel}>open alerts</Text></View><View style={styles.summaryRule} /><View><Text style={styles.summaryValue}>{usage.length}</Text><Text style={styles.summaryLabel}>recent sessions</Text></View></View>
    <Text style={styles.section}>Safety alerts</Text>
    {alerts.length === 0 ? <FeedbackBanner tone="success" title="No active safety alerts" message="Your household has not reported a new safety event." /> : alerts.map((item) => <View key={item.id} style={styles.event}><FeedbackBanner tone={toneForAlert(item.severity)} title={item.severity} message={item.message} /><Text style={styles.time}>{item.time}</Text></View>)}
    <Text style={styles.section}>Device log</Text>
    {usage.length === 0 ? <FeedbackBanner tone="neutral" title="No recorded usage yet" message="Turn a connected device on and off to create a usage session." /> : usage.map((item) => { const tone = item.eventType === "SAFETY_CUTOFF" ? "danger" : "info"; const color = statusColors[tone]; return <View key={item.id} style={styles.timelineRow}><View style={[styles.timelineDot, { backgroundColor: color.strong }]} /><View style={styles.timelineLine} /><View style={[styles.logCard, { borderColor: color.border }]}><View style={styles.logTop}><Text style={[styles.logType, { color: color.strong }]}>{item.eventType.replace("_", " ")}</Text><Text style={styles.time}>{item.time}</Text></View><Text style={styles.logTitle}>{item.deviceId.replaceAll("-", " ")}</Text><Text style={styles.logBody}>{item.cutoffReason ?? "A normal device session was recorded."}</Text></View></View>; })}
  </ScrollView><AppNav /></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#EEF2EE" }, content: { padding: 20, gap: 13, paddingBottom: 34 }, eyebrow: { color: "#68766C", fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: "#132019", fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 }, body: { color: "#68766C", fontSize: 14, lineHeight: 20 }, summary: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#D8E2D9", padding: 17, marginTop: 5 }, summaryValue: { color: "#132019", fontSize: 24, fontWeight: "800" }, summaryLabel: { color: "#68766C", fontSize: 11, fontWeight: "700", marginTop: 2 }, summaryRule: { width: 1, height: 35, backgroundColor: "#D8E2D9", marginHorizontal: 22 }, section: { color: "#132019", fontSize: 18, fontWeight: "800", marginTop: 10 }, event: { gap: 6 }, time: { color: "#68766C", fontSize: 11, fontWeight: "600" }, timelineRow: { position: "relative", paddingLeft: 23, paddingBottom: 2 }, timelineDot: { position: "absolute", width: 10, height: 10, borderRadius: 5, top: 17, left: 0 }, timelineLine: { position: "absolute", width: 1, backgroundColor: "#D8E2D9", top: 27, bottom: -13, left: 4 }, logCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderRadius: 16, padding: 14 }, logTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 }, logType: { fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, logTitle: { color: "#132019", fontSize: 15, fontWeight: "800", textTransform: "capitalize", marginTop: 7 }, logBody: { color: "#68766C", fontSize: 12, lineHeight: 18, marginTop: 4 } });
