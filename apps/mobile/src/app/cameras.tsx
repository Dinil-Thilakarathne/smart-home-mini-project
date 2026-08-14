import { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { demoDevices } from "@smart-home/shared";
import { AppNav } from "@/components/app-nav";
import { FeedbackBanner } from "@/components/feedback-banner";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { useDemoDevices } from "@/lib/demo-data";

const colors = { background: "#EEF2EE", ink: "#132019", muted: "#68766C", card: "#FFFFFF", line: "#D8E2D9", accent: "#176B4D" };
const frontDoorSnapshot = require("../../assets/cameras/front-door..jpg");

export default function CamerasScreen() {
  const live = useDemoDevices();
  const devices = live.ready ? live.devices : demoDevices;
  const cameras = useMemo(() => devices.filter((device) => device.type === "camera"), [devices]);

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MONITORING</Text>
      <Text style={styles.title}>Cameras</Text>
      <Text style={styles.body}>Mock snapshots update with each camera device’s live Firestore status.</Text>
      {live.error && <FeedbackBanner tone="danger" title="Camera sync unavailable" message="Check the Firebase emulator connection, then reopen this screen." />}
      {cameras.length === 0 ? <FeedbackBanner tone="warning" title="No camera devices found" message="Run pnpm seed:demo after restarting Firebase to add the demo cameras." /> : cameras.map((camera, index) => {
        const available = camera.health === "CONNECTED" && camera.status !== "ERROR" && camera.status !== "DISCONNECTED";
        const floor = camera.floorId === "ground-floor" ? "Ground floor" : "Upper floor";
        return <View key={camera.id} style={styles.card}>
          <View style={[styles.preview, index % 2 === 1 && styles.previewGarden]}>
            {camera.id === "front-door-camera" && <Image source={frontDoorSnapshot} resizeMode="cover" style={styles.snapshotImage} accessibilityLabel="Front door camera snapshot" />}
            {camera.id === "front-door-camera" && <View style={styles.snapshotShade} />}
            <View style={styles.previewHorizon} />
            <View style={styles.lens}><Text style={styles.lensText}>◉</Text></View>
            <Text style={styles.previewText}>{camera.name.toUpperCase()}</Text>
            <Text style={styles.previewMeta}>MOCK SNAPSHOT · {available ? "SIGNAL RECEIVED" : "SIGNAL LOST"}</Text>
          </View>
          <View style={styles.cardTop}>
            <View><Text style={styles.cardTitle}>{camera.name}</Text><Text style={styles.meta}>{floor} · Grid {camera.position.column},{camera.position.row}</Text></View>
            <View style={[styles.statusPill, available ? styles.statusLive : styles.statusOffline]}><View style={[styles.statusDot, available ? styles.dotLive : styles.dotOffline]} /><Text style={[styles.statusText, available ? styles.textLive : styles.textOffline]}>{available ? "Snapshot" : "Offline"}</Text></View>
          </View>
          <Text style={styles.caption}>{available ? "Static preview ready. Live video is intentionally mocked for this demo." : "This camera needs attention in the hardware simulator."}</Text>
        </View>;
      })}
      <FeedbackBanner tone="info" title="Monitoring demo" message="Snapshots are mock previews. Use the simulator to set a camera online, offline, or error and watch this status update." />
    </ScrollView>
    <AppNav />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 20, gap: 14, paddingBottom: 32 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7 }, body: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 14 }, preview: { height: 190, overflow: "hidden", borderRadius: 15, backgroundColor: "#183126", alignItems: "center", justifyContent: "center" }, previewGarden: { backgroundColor: "#254733" }, snapshotImage: { ...StyleSheet.absoluteFillObject, width: undefined, height: undefined }, snapshotShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8, 25, 17, 0.26)" }, previewHorizon: { position: "absolute", left: 0, right: 0, bottom: 0, height: 56, backgroundColor: "#0E2118", opacity: 0.7 }, lens: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "#2D6A4F", borderWidth: 5, borderColor: "#CBE3D2" }, lensText: { color: "#FFFFFF", fontSize: 23, fontWeight: "800" }, previewText: { color: "#E7F3EA", fontSize: 11, fontWeight: "800", letterSpacing: 1.2, marginTop: 12 }, previewMeta: { color: "#B9D9C8", fontSize: 9, fontWeight: "800", letterSpacing: 0.8, marginTop: 6 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginTop: 15 }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 12, marginTop: 4 }, statusPill: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 }, statusLive: { backgroundColor: "#E1F3E8" }, statusOffline: { backgroundColor: "#FFF3DD" }, statusDot: { width: 7, height: 7, borderRadius: 4 }, dotLive: { backgroundColor: "#1E6240" }, dotOffline: { backgroundColor: "#A85A16" }, statusText: { fontSize: 10, fontWeight: "800" }, textLive: { color: "#1E6240" }, textOffline: { color: "#87530E" }, caption: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 14 },
});
