import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/components/ui/text";
import { statusColors, type FeedbackTone } from "@/constants/status";

export function FeedbackBanner({ tone, title, message, trailing }: { tone: FeedbackTone; title: string; message: string; trailing?: ReactNode }) {
  const color = statusColors[tone];
  return <View accessibilityRole="alert" style={[styles.root, { backgroundColor: color.surface, borderColor: color.border }]}><View style={[styles.dot, { backgroundColor: color.strong }]} /><View style={styles.copy}><Text style={[styles.title, { color: color.text }]}>{title}</Text><Text style={[styles.message, { color: color.text }]}>{message}</Text></View>{trailing && <View style={styles.trailing}>{trailing}</View>}</View>;
}

const styles = StyleSheet.create({ root: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 16, padding: 13 }, dot: { width: 9, height: 9, borderRadius: 5, marginTop: 5 }, copy: { flex: 1 }, trailing: { marginLeft: 2 }, title: { fontSize: 13, fontWeight: "800" }, message: { fontSize: 12, lineHeight: 18, marginTop: 3 } });
