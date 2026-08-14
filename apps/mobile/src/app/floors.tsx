import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View, type DimensionValue } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, updateDoc } from "firebase/firestore";
import { canPlace, DEMO_HOUSEHOLD_ID, demoDevices, demoFloors, devicePath } from "@smart-home/shared";
import { AppNav } from "@/components/app-nav";
import { useDemoDevices } from "@/lib/demo-data";
import { firestore } from "@/lib/firebase";
import { deviceTone } from "@/components/device-state";
import { statusColors } from "@/constants/status";

const colors = { background: "#EEF2EE", ink: "#132019", muted: "#68766C", card: "#FFFFFF", line: "#D8E2D9", accent: "#176B4D", warning: "#A85A16" };

export default function FloorsScreen() {
  const live = useDemoDevices();
  const devices = live.ready ? live.devices : demoDevices;
  const [selectedFloorId, setSelectedFloorId] = useState(demoFloors[0].id);
  const [positions, setPositions] = useState<Record<string, { column: number; row: number; width: number; height: number }>>({});
  const [positionEditor, setPositionEditor] = useState<{ id: string; column: string; row: string; width: string; height: string } | null>(null);
  const [planSize, setPlanSize] = useState({ width: 0, height: 320 });
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const floor = demoFloors.find((item) => item.id === selectedFloorId) ?? demoFloors[0];
  const floorDevices = useMemo(() => devices.filter((device) => device.floorId === floor.id), [devices, floor.id]);

  function getPosition(device: typeof floorDevices[number]) { const position = positions[device.id] ?? device.position; return { column: position.column, row: position.row, width: position.width ?? 2, height: position.height ?? 2 }; }
  function getMarkerCoordinates(position: { column: number; row: number; width: number; height: number }): { x: DimensionValue; y: DimensionValue; width: DimensionValue; height: DimensionValue } {
    const cellWidth = planSize.width / floor.gridColumns;
    const cellHeight = planSize.height / floor.gridRows;
    return { x: cellWidth * (position.column - 1), y: cellHeight * (position.row - 1), width: cellWidth * position.width, height: cellHeight * position.height };
  }
  function openPositionEditor(deviceId: string) { const device = floorDevices.find((item) => item.id === deviceId); if (!device) return; const position = getPosition(device); setPositionEditor({ id: deviceId, column: String(position.column), row: String(position.row), width: String(position.width), height: String(position.height) }); }
  async function savePosition() {
    if (!positionEditor) return;
    const column = Number(positionEditor.column); const row = Number(positionEditor.row); const width = Number(positionEditor.width); const height = Number(positionEditor.height);
    if (![column, row, width, height].every(Number.isInteger) || column < 1 || row < 1 || width < 1 || height < 1 || column + width - 1 > floor.gridColumns || row + height - 1 > floor.gridRows) { setLayoutError(`Use a top-left position inside the ${floor.gridColumns} × ${floor.gridRows} plan. Size must fit within the grid.`); return; }
    const position = { column, row, width, height }; const occupied = floorDevices.filter((device) => device.id !== positionEditor.id).map(getPosition);
    if (!canPlace(position, occupied, floor.gridColumns, floor.gridRows)) { setLayoutError("That rectangle overlaps another device. Choose a different position or size."); return; }
    setPositions((current) => ({ ...current, [positionEditor.id]: position })); setPositionEditor(null); setLayoutError(null);
    if (!live.ready) return;
    try { await updateDoc(doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, positionEditor.id)), { position, updatedAt: new Date().toISOString() }); } catch { setLayoutError("The new position could not be saved. Check Firebase and try again."); }
  }

  return <SafeAreaView style={styles.safe}>
    <View style={styles.content}>
      <Text style={styles.eyebrow}>LAYOUT</Text>
      <Text style={styles.title}>Floor plan</Text>
      <Text style={styles.body}>Select any device marker to edit its top-left coordinate and grid size.</Text>
      {layoutError && <Text style={styles.error}>{layoutError}</Text>}
      <View style={styles.floorPicker} accessibilityRole="tablist">
        {demoFloors.map((item) => <Pressable key={item.id} onPress={() => setSelectedFloorId(item.id)} style={[styles.floorTab, item.id === floor.id && styles.floorTabActive]} accessibilityRole="tab" accessibilityState={{ selected: item.id === floor.id }}>
          <Text style={[styles.floorTabText, item.id === floor.id && styles.floorTabTextActive]}>{item.name}</Text>
        </Pressable>)}
      </View>
      <View style={styles.planCard}>
        <View style={styles.planHeader}><View><Text style={styles.cardTitle}>{floor.name}</Text><Text style={styles.meta}>{floor.gridColumns} × {floor.gridRows} room grid · {floorDevices.length} devices</Text></View><View style={styles.legend}><View style={styles.legendDot} /><Text style={styles.legendText}>Live</Text></View></View>
        <View style={styles.plan} onLayout={(event) => setPlanSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })} accessibilityLabel={`${floor.name} floor plan`}>
          {Array.from({ length: floor.gridColumns * floor.gridRows }, (_, index) => { const column = index % floor.gridColumns; const row = Math.floor(index / floor.gridColumns); return <View key={index} style={[styles.cell, { left: `${(column / floor.gridColumns) * 100}%`, top: `${(row / floor.gridRows) * 100}%`, width: `${100 / floor.gridColumns}%`, height: `${100 / floor.gridRows}%` }]} />; })}
          {floorDevices.map((device) => { const position = getPosition(device); const coordinates = getMarkerCoordinates(position); const palette = statusColors[deviceTone(device.status, device.health)]; return <Pressable key={device.id} onPress={() => openPositionEditor(device.id)} style={[styles.marker, { left: coordinates.x, top: coordinates.y, width: coordinates.width, height: coordinates.height, marginLeft: 0, marginTop: 0, backgroundColor: palette.surface, borderColor: palette.border }, device.status === "ON" && styles.markerOn]} accessibilityRole="button" accessibilityLabel={`${device.name}, ${device.status}, ${device.health}. Open layout editor.`}>
            <View style={[styles.markerCore, device.status === "ON" && styles.markerCoreOn]}><Text style={styles.markerGlyph}>{device.type === "iron" ? "♨" : device.type === "outlet" ? "⌁" : device.type === "switch-unit" ? "≋" : "✦"}</Text></View>
            <Text numberOfLines={1} style={styles.markerLabel}>{device.name}</Text><Text style={[styles.markerStatus, { color: palette.strong }]}>EDIT LAYOUT</Text>
          </Pressable>; })}
        </View>
        <View style={styles.axis}><Text style={styles.axisText}>← west</Text><Text style={styles.axisText}>north ↑</Text><Text style={styles.axisText}>east →</Text></View>
      </View>
      <Text style={styles.helper}>Coordinates use the device’s top-left cell. Device rectangles cannot overlap or extend beyond the grid.</Text>
    </View>
    <AppNav />
    <Modal visible={positionEditor !== null} transparent animationType="fade" onRequestClose={() => setPositionEditor(null)}>
      <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalEyebrow}>LAYOUT EDITOR</Text><Text style={styles.modalTitle}>Adjust device layout</Text><Text style={styles.modalBody}>Column and row are the top-left cell. Default device size is 2 × 2.</Text><View style={styles.inputRow}><View style={styles.inputGroup}><Text style={styles.inputLabel}>Column</Text><TextInput value={positionEditor?.column ?? ""} onChangeText={(column) => setPositionEditor((current) => current ? { ...current, column } : current)} keyboardType="number-pad" style={styles.input} /></View><View style={styles.inputGroup}><Text style={styles.inputLabel}>Row</Text><TextInput value={positionEditor?.row ?? ""} onChangeText={(row) => setPositionEditor((current) => current ? { ...current, row } : current)} keyboardType="number-pad" style={styles.input} /></View></View><View style={styles.inputRow}><View style={styles.inputGroup}><Text style={styles.inputLabel}>Width</Text><TextInput value={positionEditor?.width ?? ""} onChangeText={(width) => setPositionEditor((current) => current ? { ...current, width } : current)} keyboardType="number-pad" style={styles.input} /></View><View style={styles.inputGroup}><Text style={styles.inputLabel}>Height</Text><TextInput value={positionEditor?.height ?? ""} onChangeText={(height) => setPositionEditor((current) => current ? { ...current, height } : current)} keyboardType="number-pad" style={styles.input} /></View></View><View style={styles.modalActions}><Pressable onPress={() => setPositionEditor(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable onPress={() => void savePosition()} style={styles.saveButton}><Text style={styles.saveText}>Save layout</Text></Pressable></View></View></View>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, content: { flex: 1, padding: 20, gap: 14, paddingBottom: 26 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2 }, title: { color: colors.ink, fontSize: 30, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 }, body: { color: colors.muted, fontSize: 14, lineHeight: 20 }, error: { color: "#A33A2B", backgroundColor: "#FCE9E5", borderRadius: 12, padding: 11, fontSize: 12, lineHeight: 17 }, floorPicker: { flexDirection: "row", gap: 8, backgroundColor: "#E2EAE3", borderRadius: 14, padding: 4 }, floorTab: { flex: 1, alignItems: "center", borderRadius: 10, paddingVertical: 11 }, floorTabActive: { backgroundColor: colors.card, shadowColor: "#183126", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, floorTabText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, floorTabTextActive: { color: colors.accent }, planCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 22, padding: 16 }, planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }, cardTitle: { color: colors.ink, fontSize: 18, fontWeight: "800" }, meta: { color: colors.muted, fontSize: 11, marginTop: 5 }, legend: { flexDirection: "row", alignItems: "center", gap: 5 }, legendDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: colors.accent }, legendText: { color: colors.muted, fontSize: 10, fontWeight: "700" }, plan: { height: 320, marginTop: 16, borderRadius: 14, overflow: "hidden", position: "relative", backgroundColor: "#F7FAF7", borderWidth: 1, borderColor: colors.line }, cell: { position: "absolute", borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#DDE7DE" }, marker: { position: "absolute", width: 92, minHeight: 62, marginLeft: -46, marginTop: -31, alignItems: "center", justifyContent: "center", padding: 5, borderRadius: 14, backgroundColor: "#E8F0EA", borderWidth: 1, borderColor: "#C3D6C7" }, markerOn: { backgroundColor: "#D8E9DF", borderColor: colors.accent }, markerDisabled: { opacity: 0.55 }, markerDragging: { transform: [{ scale: 1.05 }], shadowColor: colors.accent, shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }, markerCore: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" }, markerCoreOn: { backgroundColor: colors.accent }, markerGlyph: { color: colors.accent, fontSize: 17, fontWeight: "800" }, markerLabel: { color: colors.ink, fontSize: 10, fontWeight: "800", marginTop: 3, maxWidth: 82 }, markerStatus: { color: colors.accent, fontSize: 9, fontWeight: "800", marginTop: 2 }, axis: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 }, axisText: { color: colors.muted, fontSize: 10, fontWeight: "600" }, helper: { color: colors.muted, fontSize: 12, lineHeight: 18, paddingHorizontal: 2 }, modalBackdrop: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: "rgba(19,32,25,0.42)" }, modalCard: { backgroundColor: colors.card, borderRadius: 24, padding: 22 }, modalEyebrow: { color: colors.accent, fontSize: 10, fontWeight: "800", letterSpacing: 1.6 }, modalTitle: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 8 }, modalBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 6 }, inputRow: { flexDirection: "row", gap: 12, marginTop: 20 }, inputGroup: { flex: 1 }, inputLabel: { color: colors.muted, fontSize: 11, fontWeight: "700", marginBottom: 6 }, input: { borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 12, color: colors.ink, fontSize: 18, fontWeight: "700" }, modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 22 }, cancelButton: { paddingHorizontal: 14, paddingVertical: 12 }, cancelText: { color: colors.muted, fontSize: 13, fontWeight: "700" }, saveButton: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 15, paddingVertical: 12 }, saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
