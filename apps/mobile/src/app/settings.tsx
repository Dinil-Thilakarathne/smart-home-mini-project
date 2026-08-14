import { useEffect, useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { DEMO_HOUSEHOLD_ID, devicePath, scheduleCollectionPath } from "@smart-home/shared";
import { AppNav } from "@/components/app-nav";
import { FeedbackBanner } from "@/components/feedback-banner";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useDemoDevices, useDemoSchedules } from "@/lib/demo-data";
import { firestore } from "@/lib/firebase";

function timeToDate(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function formatTime(value: Date) {
  return `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`;
}

export default function SettingsScreen() {
  const live = useDemoDevices(); const schedules = useDemoSchedules();
  const iron = live.devices.find((device) => device.type === "iron"); const lightSchedule = schedules.find((schedule) => schedule.deviceId === "living-room-light");
  const [minutes, setMinutes] = useState(""); const [startTime, setStartTime] = useState(() => timeToDate("18:00")); const [endTime, setEndTime] = useState(() => timeToDate("23:00")); const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null); const [enabled, setEnabled] = useState(true); const [saving, setSaving] = useState(false);
  useEffect(() => { if (iron) setMinutes(String(iron.capabilities.safetyMaxDurationMinutes ?? 30)); }, [iron]);
  useEffect(() => { if (lightSchedule) { setStartTime(timeToDate(lightSchedule.startTime)); setEndTime(timeToDate(lightSchedule.endTime)); setEnabled(lightSchedule.enabled); } }, [lightSchedule]);

  async function saveAutomation() {
    const safeMinutes = Number(minutes);
    const startTimeText = formatTime(startTime); const endTimeText = formatTime(endTime);
    if (!iron || !lightSchedule || !Number.isInteger(safeMinutes) || safeMinutes < 1 || safeMinutes > 240 || endTime.getTime() <= startTime.getTime()) { Toast.show({ type: "error", text1: "Check automation values", text2: "Use a 1 to 240 minute duration and set an end time after the start time." }); return; }
    setSaving(true);
    try { await Promise.all([updateDoc(doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, iron.id)), { capabilities: { ...iron.capabilities, safetyMaxDurationMinutes: safeMinutes }, updatedAt: new Date().toISOString() }), updateDoc(doc(firestore, `${scheduleCollectionPath(DEMO_HOUSEHOLD_ID)}/${lightSchedule.id}`), { startTime: startTimeText, endTime: endTimeText, enabled, timezone: "Asia/Colombo" })]); Toast.show({ type: "success", text1: "Automation saved", text2: "Safety duration and light schedule are active." }); }
    catch { Toast.show({ type: "error", text1: "Save failed", text2: "Check Firebase rules and your local connection." }); }
    finally { setSaving(false); }
  }

  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.content}><Text style={styles.eyebrow}>CONFIGURATION</Text><Text style={styles.title}>Automation</Text><Text style={styles.body}>Configure the demo household’s safety cutoff and scheduled lighting.</Text><FeedbackBanner tone="info" title="Timezone: Asia/Colombo" message="Schedules use 24-hour local time and run every day in this demo." />
    <Card style={styles.card}><Text style={styles.cardEyebrow}>SAFETY DEVICE</Text><Text style={styles.cardTitle}>Kitchen iron</Text><Text style={styles.cardBody}>Automatically turns off after its maximum active duration and creates an alert.</Text><Text style={styles.label}>Maximum active duration, minutes</Text><TextInput value={minutes} onChangeText={setMinutes} keyboardType="number-pad" style={styles.input} /><Text style={styles.hint}>Allowed range: 1 to 240 minutes</Text></Card>
    <Card style={styles.card}><Text style={styles.cardEyebrow}>LIGHT SCHEDULE</Text><Text style={styles.cardTitle}>Living room light</Text><Text style={styles.cardBody}>Turns on at the start time and off at the end time, every day.</Text><View style={styles.inputRow}><View style={styles.inputGroup}><Text style={styles.label}>Start</Text><Pressable onPress={() => setActivePicker("start")} style={styles.timeField} accessibilityRole="button" accessibilityLabel={`Set start time, currently ${startTimeText(startTime)}`}><Text style={styles.timeValue}>{formatTime(startTime)}</Text><Text style={styles.timeIcon}>◷</Text></Pressable></View><View style={styles.inputGroup}><Text style={styles.label}>End</Text><Pressable onPress={() => setActivePicker("end")} style={styles.timeField} accessibilityRole="button" accessibilityLabel={`Set end time, currently ${formatTime(endTime)}`}><Text style={styles.timeValue}>{formatTime(endTime)}</Text><Text style={styles.timeIcon}>◷</Text></Pressable></View></View>{activePicker && <View style={styles.pickerArea}><Text style={styles.pickerTitle}>Select {activePicker} time</Text><DateTimePicker value={activePicker === "start" ? startTime : endTime} mode="time" display={Platform.OS === "ios" ? "spinner" : "default"} is24Hour onChange={(_event, selectedTime) => { if (selectedTime) { if (activePicker === "start") setStartTime(selectedTime); else setEndTime(selectedTime); } if (Platform.OS === "android") setActivePicker(null); }} />{Platform.OS === "ios" && <Pressable onPress={() => setActivePicker(null)} style={styles.doneButton}><Text style={styles.doneText}>Done</Text></Pressable>}</View>}<View style={styles.switchRow}><View><Text style={styles.switchTitle}>Schedule enabled</Text><Text style={styles.hint}>{enabled ? "The light will follow this schedule." : "The light will not be controlled by the schedule."}</Text></View><Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: "#D9E0DA", true: "#B8DEC6" }} thumbColor={enabled ? "#176B4D" : "#FFFFFF"} /></View></Card>
    <Pressable onPress={() => void saveAutomation()} disabled={saving || !live.ready} style={[styles.saveButton, (saving || !live.ready) && styles.saveDisabled]}><Text style={styles.saveText}>{saving ? "Saving…" : "Save automation"}</Text></Pressable>
  </ScrollView><AppNav /></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#EEF2EE" }, content: { padding: 20, gap: 14, paddingBottom: 34 }, eyebrow: { color: "#68766C", fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: "#132019", fontSize: 30, fontWeight: "800", letterSpacing: -0.7 }, body: { color: "#68766C", fontSize: 14, lineHeight: 20 }, card: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#D8E2D9", padding: 16 }, cardEyebrow: { color: "#176B4D", fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, cardTitle: { color: "#132019", fontSize: 18, fontWeight: "800", marginTop: 7 }, cardBody: { color: "#68766C", fontSize: 13, lineHeight: 19, marginTop: 5 }, label: { color: "#526057", fontSize: 11, fontWeight: "800", marginTop: 18, marginBottom: 6 }, input: { borderWidth: 1, borderColor: "#D8E2D9", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, color: "#132019", fontSize: 16, fontWeight: "700" }, hint: { color: "#68766C", fontSize: 11, lineHeight: 16, marginTop: 6 }, inputRow: { flexDirection: "row", gap: 10 }, inputGroup: { flex: 1 }, timeField: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", borderWidth: 1, borderColor: "#D8E2D9", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13, backgroundColor: "#F9FBF9" }, timeValue: { color: "#132019", fontSize: 16, fontWeight: "800" }, timeIcon: { color: "#176B4D", fontSize: 17 }, pickerArea: { marginTop: 14, borderRadius: 14, backgroundColor: "#F4F8F4", padding: 12, alignItems: "center" }, pickerTitle: { alignSelf: "flex-start", color: "#526057", fontSize: 11, fontWeight: "800" }, doneButton: { alignSelf: "stretch", alignItems: "center", backgroundColor: "#176B4D", borderRadius: 10, paddingVertical: 10, marginTop: 6 }, doneText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 15, marginTop: 19 }, switchTitle: { color: "#132019", fontSize: 14, fontWeight: "800" }, saveButton: { alignItems: "center", backgroundColor: "#176B4D", borderRadius: 15, paddingVertical: 15 }, saveDisabled: { backgroundColor: "#AAB8AE" }, saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" } });
