import { useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signInAnonymously } from "firebase/auth";
import { Text } from "@/components/ui/text";
import { useDemoProfile } from "@/lib/demo-profile";
import { firebaseAuth } from "@/lib/firebase";

const colors = { background: "#EEF2EE", ink: "#132019", muted: "#68766C", accent: "#176B4D", card: "#FFFFFF", line: "#D8E2D9" };
const credentials = { username: "admin", password: "123456" };

export default function WelcomeScreen() {
  const router = useRouter();
  const { saveName } = useDemoProfile();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formScrollRef = useRef<ScrollView>(null);
  const isValid = username.trim().length > 0 && password.length > 0;

  function revealForm() {
    requestAnimationFrame(() => formScrollRef.current?.scrollToEnd({ animated: true }));
  }

  useEffect(() => {
    const listener = Keyboard.addListener("keyboardDidShow", revealForm);
    return () => listener.remove();
  }, []);

  async function continueToHome() {
    if (!isValid || saving) return;
    if (username.trim().toLowerCase() !== credentials.username || password !== credentials.password) { setError("Incorrect username or password."); return; }
    setError(null);
    setSaving(true);
    try { await signInAnonymously(firebaseAuth); } catch { /* Data hooks retry anonymous authentication when they open. */ }
    await saveName("Admin");
    router.replace("/");
  }

  return <SafeAreaView style={styles.safe}><KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView ref={formScrollRef} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.hero}><View style={styles.mark}><Text style={styles.markText}>⌂</Text></View><Text style={styles.eyebrow}>SMART HOME</Text><Text style={styles.title}>Welcome home.</Text><Text style={styles.body}>Sign in to access your connected devices and safety controls.</Text></View>
    <View style={styles.card}><Text style={styles.label}>USERNAME</Text><TextInput value={username} onFocus={revealForm} onChangeText={(value) => { setUsername(value); setError(null); }} placeholder="Username" placeholderTextColor="#8B978E" autoCapitalize="none" autoCorrect={false} returnKeyType="next" style={styles.input} accessibilityLabel="Username" /><Text style={styles.labelPassword}>PASSWORD</Text><TextInput value={password} onFocus={revealForm} onChangeText={(value) => { setPassword(value); setError(null); }} placeholder="Password" placeholderTextColor="#8B978E" autoCapitalize="none" autoCorrect={false} secureTextEntry returnKeyType="done" onSubmitEditing={() => void continueToHome()} style={styles.input} accessibilityLabel="Password" />{error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}<Pressable onPress={() => void continueToHome()} disabled={!isValid || saving} style={[styles.button, (!isValid || saving) && styles.buttonDisabled]} accessibilityRole="button"><Text style={styles.buttonText}>{saving ? "Signing in…" : "Sign in"}</Text></Pressable></View>
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { flexGrow: 1, justifyContent: "space-between", padding: 24, paddingVertical: 38, gap: 36 }, hero: { paddingTop: 18 }, mark: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", shadowColor: "#0B3E2B", shadowOpacity: 0.18, shadowRadius: 15, shadowOffset: { width: 0, height: 8 }, elevation: 5 }, markText: { color: "#FFFFFF", fontSize: 34, fontWeight: "700", marginTop: -2 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 2, marginTop: 27 }, title: { color: colors.ink, fontSize: 34, fontWeight: "800", letterSpacing: -0.9, marginTop: 10 }, body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 13, maxWidth: 330 }, card: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.line, padding: 18, shadowColor: "#183126", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 3 }, label: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 }, labelPassword: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1.5, marginTop: 16 }, input: { color: colors.ink, fontSize: 18, fontWeight: "700", borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, marginTop: 9 }, error: { color: "#96382B", fontSize: 12, fontWeight: "700", marginTop: 11 }, button: { alignItems: "center", backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 15, marginTop: 16 }, buttonDisabled: { backgroundColor: "#AEBBB1" }, buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" } });
