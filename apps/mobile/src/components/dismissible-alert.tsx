import { useCallback, useMemo, useRef } from "react";
import { Animated, PanResponder, Pressable, StyleSheet, View } from "react-native";
import { FeedbackBanner } from "@/components/feedback-banner";
import type { FeedbackTone } from "@/constants/status";
import { Text } from "@/components/ui/text";

const DISMISS_DISTANCE = 96;

export function DismissibleAlert({ tone, title, message, onDismiss }: { tone: FeedbackTone; title: string; message: string; onDismiss: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const dismiss = useCallback(() => {
    Animated.timing(translateX, { toValue: -420, duration: 180, useNativeDriver: true }).start(({ finished }) => { if (finished) onDismiss(); });
  }, [onDismiss, translateX]);
  const reset = useCallback(() => Animated.spring(translateX, { toValue: 0, useNativeDriver: true, damping: 22, stiffness: 240, mass: 0.8 }).start(), [translateX]);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => gesture.dx < -10 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_event, gesture) => translateX.setValue(Math.min(0, gesture.dx)),
    onPanResponderRelease: (_event, gesture) => gesture.dx < -DISMISS_DISTANCE || gesture.vx < -0.7 ? dismiss() : reset(),
    onPanResponderTerminate: reset,
  }), [dismiss, reset, translateX]);

  return <View style={styles.wrapper}><View style={styles.dismissBackground}><Text style={styles.dismissLabel}>Dismiss</Text></View><Animated.View {...panResponder.panHandlers} style={{ transform: [{ translateX }] }}><FeedbackBanner tone={tone} title={title} message={message} trailing={<Pressable onPress={dismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Dismiss ${title}`} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable>} /></Animated.View></View>;
}

const styles = StyleSheet.create({ wrapper: { overflow: "hidden", borderRadius: 16 }, dismissBackground: { ...StyleSheet.absoluteFillObject, alignItems: "flex-end", justifyContent: "center", backgroundColor: "#A33A2B", paddingRight: 19 }, dismissLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, close: { alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.72)" }, closeText: { color: "#526057", fontSize: 20, lineHeight: 21, fontWeight: "500" } });
