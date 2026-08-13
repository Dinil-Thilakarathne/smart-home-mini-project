import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppNav } from "@/components/app-nav";

export default function SettingsScreen() { return <SafeAreaView style={styles.safe}><View style={styles.content}><Text style={styles.eyebrow}>CONFIGURATION</Text><Text style={styles.title}>Settings</Text><View style={styles.card}><Text style={styles.label}>Household</Text><Text style={styles.value}>Colombo Demo Home</Text><Text style={styles.label}>Timezone</Text><Text style={styles.value}>Asia/Colombo</Text><Text style={styles.label}>Connection</Text><Text style={styles.value}>Local Firebase emulators</Text></View></View><AppNav /></SafeAreaView>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: "#F5F6F2" }, content: { flex: 1, padding: 22, gap: 16 }, eyebrow: { color: "#6E776F", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }, title: { color: "#17201B", fontSize: 30, fontWeight: "700", marginTop: 5 }, card: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 18, borderWidth: 1, borderColor: "#E1E7E0" }, label: { color: "#6E776F", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.2, marginTop: 14 }, value: { color: "#17201B", fontSize: 15, fontWeight: "600", marginTop: 5 } });
