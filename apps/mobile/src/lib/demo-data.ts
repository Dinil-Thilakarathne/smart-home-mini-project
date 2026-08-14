import { useEffect, useState } from "react";
import { signInAnonymously } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, limit, updateDoc, doc } from "firebase/firestore";
import type { Device, DeviceLog, Schedule, UsageRecord } from "@smart-home/shared";
import { DEMO_HOUSEHOLD_ID, deviceCollectionPath, deviceLogCollectionPath, scheduleCollectionPath, switchCollectionPath } from "@smart-home/shared";
import { firebaseAuth, firestore } from "./firebase";

export function useDemoDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      const devicesQuery = query(collection(firestore, deviceCollectionPath(DEMO_HOUSEHOLD_ID)), orderBy("name"));
      unsubscribe = onSnapshot(devicesQuery, (snapshot) => {
        setDevices(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data(), updatedAt: doc.data().updatedAt?.toDate?.().toISOString?.() ?? new Date().toISOString() }) as Device));
        setReady(true);
      }, () => setError("Could not sync devices."));
    }).catch(() => setError("Could not connect to the demo household."));
    return () => unsubscribe();
  }, []);
  return { devices, ready, error };
}

function formatTimestamp(value: unknown) {
  const date = (value as { toDate?: () => Date } | undefined)?.toDate?.();
  return date ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Just now";
}

export function useDemoAlerts() {
  const [alerts, setAlerts] = useState<{ id: string; message: string; severity: string; time: string }[]>([]);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      unsubscribe = onSnapshot(query(collection(firestore, `households/${DEMO_HOUSEHOLD_ID}/alerts`), orderBy("createdAt", "desc"), limit(20)), (snapshot) => setAlerts(snapshot.docs.filter((item) => item.data().read !== true).map((item) => ({ id: item.id, message: String(item.data().message), severity: String(item.data().severity), time: formatTimestamp(item.data().createdAt) }))));
    });
    return () => unsubscribe();
  }, []);
  async function dismissAlert(alertId: string) {
    await updateDoc(doc(firestore, `households/${DEMO_HOUSEHOLD_ID}/alerts/${alertId}`), { read: true });
  }
  return { alerts, dismissAlert };
}

export function useDemoSwitches(deviceId: string) {
  const [switches, setSwitches] = useState<{ id: string; name: string; status: string }[]>([]);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      unsubscribe = onSnapshot(collection(firestore, switchCollectionPath(DEMO_HOUSEHOLD_ID, deviceId)), (snapshot) => setSwitches(snapshot.docs.map((item) => ({ id: item.id, name: String(item.data().name), status: String(item.data().status) }))));
    });
    return () => unsubscribe();
  }, [deviceId]);
  async function toggleSwitch(switchId: string, status: string) {
    await updateDoc(doc(firestore, `${switchCollectionPath(DEMO_HOUSEHOLD_ID, deviceId)}/${switchId}`), { status: status === "ON" ? "OFF" : "ON", updatedAt: new Date().toISOString() });
  }
  return { switches, toggleSwitch };
}

export function useDemoUsage() {
  const [usage, setUsage] = useState<(UsageRecord & { time: string })[]>([]);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      unsubscribe = onSnapshot(query(collection(firestore, `households/${DEMO_HOUSEHOLD_ID}/usage`), orderBy("endTime", "desc"), limit(50)), (snapshot) => setUsage(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), estimatedEnergyKwh: Number(item.data().estimatedEnergyKwh ?? 0), powerWatts: Number(item.data().powerWatts ?? 0), durationSeconds: Number(item.data().durationSeconds ?? 0), time: formatTimestamp(item.data().endTime ?? item.data().startTime) }) as UsageRecord & { time: string })));
    });
    return () => unsubscribe();
  }, []);
  return usage;
}

export function useDemoDeviceLogs() {
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      unsubscribe = onSnapshot(query(collection(firestore, deviceLogCollectionPath(DEMO_HOUSEHOLD_ID)), orderBy("createdAt", "desc"), limit(100)), (snapshot) => setLogs(snapshot.docs.map((item) => ({ id: item.id, ...item.data(), createdAt: formatTimestamp(item.data().createdAt) }) as DeviceLog)));
    });
    return () => unsubscribe();
  }, []);
  return logs;
}

export function useDemoSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  useEffect(() => {
    let unsubscribe = () => {};
    signInAnonymously(firebaseAuth).then(() => {
      unsubscribe = onSnapshot(collection(firestore, scheduleCollectionPath(DEMO_HOUSEHOLD_ID)), (snapshot) => setSchedules(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Schedule)));
    });
    return () => unsubscribe();
  }, []);
  return schedules;
}
