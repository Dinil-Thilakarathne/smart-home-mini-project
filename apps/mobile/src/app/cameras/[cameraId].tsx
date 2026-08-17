import { demoDevices } from "@smart-home/shared";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceHealthBadge } from "@/components/device-state";
import { FeedbackBanner } from "@/components/feedback-banner";
import { Pressable } from "@/components/ui/pressable";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { cameraSnapshots } from "@/lib/camera-snapshots";
import { useDemoDevices } from "@/lib/demo-data";

const colors = {
	background: "#EEF2EE",
	ink: "#132019",
	muted: "#68766C",
	card: "#FFFFFF",
	line: "#D8E2D9",
	accent: "#176B4D",
};

export default function CameraDetailsScreen() {
	const router = useRouter();
	const { cameraId } = useLocalSearchParams<{ cameraId: string }>();
	const live = useDemoDevices();
	const devices = live.ready ? live.devices : demoDevices;
	const camera = devices.find(
		(device) => device.id === cameraId && device.type === "camera",
	);

	if (!camera) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.notFound}>
					<Text style={styles.eyebrow}>MONITORING</Text>
					<Text style={styles.title}>Camera unavailable</Text>
					<Text style={styles.body}>This camera could not be found.</Text>
					<Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button">
						<Text style={styles.backButtonText}>Back to cameras</Text>
					</Pressable>
				</View>
			</SafeAreaView>
		);
	}

	const available =
		camera.health === "CONNECTED" &&
		camera.status !== "ERROR" &&
		camera.status !== "DISCONNECTED";
	const floor = camera.floorId === "ground-floor" ? "Ground floor" : "Upper floor";
	const snapshot = cameraSnapshots[camera.id as keyof typeof cameraSnapshots];

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.content}>
				<Pressable onPress={() => router.back()} style={styles.backLink} accessibilityRole="button">
					<Text style={styles.backLinkText}>‹  Cameras</Text>
				</Pressable>
				<Text style={styles.eyebrow}>CAMERA DETAIL</Text>
				<View style={styles.headingRow}>
					<View style={styles.headingCopy}>
						<Text style={styles.title}>{camera.name}</Text>
						<Text style={styles.body}>{floor} · Grid {camera.position.column},{camera.position.row}</Text>
					</View>
					<DeviceHealthBadge health={camera.health} />
				</View>
				<View style={styles.hero}>
					{snapshot && <Image source={snapshot} resizeMode="cover" style={styles.snapshotImage} accessibilityLabel={`${camera.name} snapshot`} />}
					<View style={styles.snapshotShade} />
					<View style={styles.heroFooter}>
						<Text style={styles.heroLabel}>{available ? "SIGNAL RECEIVED" : "SIGNAL LOST"}</Text>
						<Text style={styles.heroMeta}>MOCK SNAPSHOT · LIVE VIDEO NOT CONFIGURED</Text>
					</View>
				</View>
				<View style={styles.infoCard}>
					<Text style={styles.cardTitle}>Camera status</Text>
					<View style={styles.infoRow}><Text style={styles.infoLabel}>Connection</Text><Text style={styles.infoValue}>{available ? "Connected" : "Needs attention"}</Text></View>
					<View style={styles.infoRow}><Text style={styles.infoLabel}>Device state</Text><Text style={styles.infoValue}>{camera.status}</Text></View>
					<View style={styles.infoRow}><Text style={styles.infoLabel}>Power draw</Text><Text style={styles.infoValue}>{camera.powerWatts}W</Text></View>
					<View style={styles.infoRow}><Text style={styles.infoLabel}>Last updated</Text><Text style={styles.infoValue}>Demo snapshot</Text></View>
				</View>
				<FeedbackBanner tone={available ? "info" : "warning"} title="Monitoring demo" message={available ? "This is a static camera snapshot. Live streaming is intentionally mocked for this demo." : "This camera is offline or reporting an error. Use the hardware simulator to restore its connection."} />
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1, backgroundColor: colors.background },
	content: { padding: 20, gap: 16, paddingBottom: 32 },
	backLink: { alignSelf: "flex-start", paddingVertical: 4 },
	backLinkText: { color: colors.accent, fontSize: 15, fontWeight: "800" },
	eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
	headingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
	headingCopy: { flex: 1 },
	title: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7 },
	body: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 5 },
	hero: { height: 280, overflow: "hidden", borderRadius: 20, backgroundColor: "#183126", justifyContent: "flex-end" },
	snapshotImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined },
	snapshotShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 25, 17, 0.2)" },
	heroFooter: { padding: 16, backgroundColor: "rgba(14, 33, 24, 0.75)" },
	heroLabel: { color: "#E7F3EA", fontSize: 12, fontWeight: "800", letterSpacing: 1 },
	heroMeta: { color: "#B9D9C8", fontSize: 9, fontWeight: "800", letterSpacing: 0.7, marginTop: 5 },
	infoCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 20, padding: 16, gap: 14 },
	cardTitle: { color: colors.ink, fontSize: 17, fontWeight: "800", marginBottom: 2 },
	infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
	infoLabel: { color: colors.muted, fontSize: 13 },
	infoValue: { color: colors.ink, fontSize: 13, fontWeight: "700" },
	notFound: { flex: 1, justifyContent: "center", padding: 20, gap: 12 },
	backButton: { alignSelf: "flex-start", backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 8 },
	backButtonText: { color: "#FFFFFF", fontWeight: "800" },
});
