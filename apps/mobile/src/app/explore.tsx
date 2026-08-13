import { StyleSheet, Text, View } from "react-native";

export default function ActivityScreen() {
  return <View style={styles.container}><Text style={styles.eyebrow}>ACTIVITY</Text><Text style={styles.title}>Recent events</Text><Text style={styles.body}>Usage history and safety cutoffs will appear here.</Text></View>;
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#F5F6F2" }, eyebrow: { color: "#6E776F", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 }, title: { color: "#17201B", fontSize: 28, fontWeight: "700", marginTop: 6 }, body: { color: "#6E776F", fontSize: 15, lineHeight: 22, marginTop: 10, maxWidth: 300 } });
