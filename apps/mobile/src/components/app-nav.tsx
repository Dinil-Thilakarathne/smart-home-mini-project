import { StyleSheet } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Pressable } from "@/components/ui/pressable";

const items = [{ label: "Home", path: "/" }, { label: "Floors", path: "/floors" }, { label: "Cameras", path: "/cameras" }, { label: "Activity", path: "/activity" }, { label: "Settings", path: "/settings" }];

export function AppNav() {
  const router = useRouter();
  const pathname = usePathname();
  return <Box style={styles.bar}>{items.map((item) => <Pressable key={item.path} onPress={() => router.push(item.path as never)} style={styles.item} accessibilityRole="button"><Text style={[styles.label, pathname === item.path && styles.active]}>{item.label}</Text></Pressable>)}</Box>;
}

const styles = StyleSheet.create({ bar: { flexDirection: "row", justifyContent: "space-around", borderTopWidth: 1, borderTopColor: "#E1E7E0", backgroundColor: "#FFFFFF", paddingVertical: 14, paddingBottom: 18 }, item: { flex: 1, alignItems: "center", paddingHorizontal: 2 }, label: { color: "#6E776F", fontSize: 10, fontWeight: "700" }, active: { color: "#2D6A4F" } });
