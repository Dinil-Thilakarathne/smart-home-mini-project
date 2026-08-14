"use client";

import type { Device } from "@smart-home/shared";
import {
  DEMO_HOUSEHOLD_ID,
  demoFloors,
  deviceCollectionPath,
  devicePath,
  getLiveRuntime,
  switchCollectionPath,
  formatRuntime,
} from "@smart-home/shared";
import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { firebaseAuth, firestore } from "@/lib/firebase";

type ActivityItem = {
  id: string;
  message: string;
  source: string;
  time: string;
};
type UsageItem = {
  id: string;
  deviceId: string;
  estimatedEnergyKwh: number;
  durationSeconds: number;
  powerWatts: number;
};

export default function SimulatorPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [message, setMessage] = useState(
    "Connecting to the local hardware state...",
  );
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [floorId, setFloorId] = useState("ground-floor");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let unsubscribeDevices = () => {};
    let unsubscribeActivity = () => {};
    let unsubscribeUsage = () => {};
    signInAnonymously(firebaseAuth)
      .then(() => {
        unsubscribeDevices = onSnapshot(
          query(
            collection(firestore, deviceCollectionPath(DEMO_HOUSEHOLD_ID)),
            orderBy("name"),
          ),
          (snapshot) => {
            const nextDevices = snapshot.docs.map(
              (item) => ({ id: item.id, ...item.data() }) as Device,
            );
            setDevices(nextDevices);
            setMessage("Live Firestore connection");
          },
          () =>
            setMessage(
              "Unable to read Firestore. Start the emulators and seedDemo.",
            ),
        );
        unsubscribeActivity = onSnapshot(
          query(
            collection(firestore, `households/${DEMO_HOUSEHOLD_ID}/logs`),
            orderBy("createdAt", "desc"),
          ),
          (snapshot) =>
            setActivity(
              snapshot.docs.slice(0, 8).map((item) => {
                const data = item.data();
                const changes = Array.isArray(data.changes)
                  ? data.changes.join(" ")
                  : "Device state updated.";
                const createdAt = data.createdAt?.toDate?.();
                return {
                  id: item.id,
                  message: `${data.deviceName ?? data.deviceId ?? "Device"}: ${changes}`,
                  source: String(data.source ?? "SYSTEM"),
                  time:
                    createdAt instanceof Date
                      ? createdAt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Just now",
                };
              }),
            ),
        );
        unsubscribeUsage = onSnapshot(
          query(
            collection(firestore, `households/${DEMO_HOUSEHOLD_ID}/usage`),
            orderBy("endTime", "desc"),
          ),
          (snapshot) =>
            setUsage(
              snapshot.docs.map((item) => ({
                id: item.id,
                deviceId: String(item.data().deviceId),
                estimatedEnergyKwh: Number(item.data().estimatedEnergyKwh ?? 0),
                durationSeconds: Number(item.data().durationSeconds ?? 0),
                powerWatts: Number(item.data().powerWatts ?? 0),
              })),
            ),
        );
      })
      .catch(() => setMessage("Unable to authenticate with the emulator."));
    return () => {
      unsubscribeDevices();
      unsubscribeActivity();
      unsubscribeUsage();
    };
  }, []);

  const currentFloor =
    demoFloors.find((floor) => floor.id === floorId) ?? demoFloors[0];
  const floorDevices = devices.filter(
    (device) => device.floorId === currentFloor.id,
  );
  const selectedDevice =
    devices.find((device) => device.id === selectedDeviceId) ??
    floorDevices[0] ??
    null;
  const onlineCount = devices.filter(
    (device) => device.health === "CONNECTED",
  ).length;
  const activeCount = devices.filter((device) => device.status === "ON").length;
  const attentionCount = devices.filter(
    (device) => device.health !== "CONNECTED" || device.status === "ERROR",
  ).length;
  const totalEnergyKwh = usage.reduce(
    (total, item) => total + item.estimatedEnergyKwh,
    0,
  );
  const liveEnergyKwh = devices.reduce(
    (total, device) => total + getLiveRuntime(device, now).estimatedEnergyKwh,
    0,
  );

  async function setDeviceStatus(device: Device) {
    const status = device.status === "ON" ? "OFF" : "ON";
    try {
      await updateDoc(
        doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, device.id)),
        {
          status,
          lastChangedSource: "SIMULATOR",
          updatedAt: new Date().toISOString(),
        },
      );
      setMessage(`${device.name} changed to ${status}`);
    } catch {
      setMessage(
        `Could not update ${device.name}. Check the emulator connection.`,
      );
    }
  }

  async function setHealth(device: Device, health: Device["health"]) {
    try {
      await updateDoc(
        doc(firestore, devicePath(DEMO_HOUSEHOLD_ID, device.id)),
        { health, updatedAt: new Date().toISOString() },
      );
      setMessage(`${device.name} health set to ${health}`);
    } catch {
      setMessage(
        `Could not update ${device.name}. Check the emulator connection.`,
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f1] px-4 py-5 text-[#17201b] sm:px-7 sm:py-8 lg:px-10">
      <div className="mx-auto max-w-[1480px]">
        <header className="flex flex-col gap-5 border-b border-[#dde5dc] pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#6e776f]">
              HARDWARE SIMULATOR
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Home operations
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#6e776f]">
              Select a device on the floor plan to inspect and control its live
              physical state.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#b8dec6] bg-[#e1f3e8] px-3 py-2 text-xs font-bold text-[#1e6240] sm:self-auto">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#1e6240]" />
            {message}
          </div>
        </header>

        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          <Metric
            label="Online devices"
            value={`${onlineCount}/${devices.length}`}
            tone="success"
          />
          <Metric
            label="Active now"
            value={String(activeCount)}
            tone="neutral"
          />
          <Metric
            label="Energy estimate"
            value={`${(totalEnergyKwh + liveEnergyKwh).toFixed(3)} kWh`}
            tone="success"
          />
          <Metric
            label="Needs attention"
            value={String(attentionCount)}
            tone={attentionCount ? "danger" : "success"}
          />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="rounded-[28px] border border-[#dce5dc] bg-white p-4 shadow-[0_16px_45px_rgba(25,48,34,0.06)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#edf1ed] pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#6e776f]">
                  LIVE FLOOR PLAN
                </p>
                <h2 className="mt-1 text-xl font-bold tracking-tight">
                  {currentFloor.name}
                </h2>
              </div>
              <div className="flex rounded-xl bg-[#eef2ee] p-1">
                {demoFloors.map((floor) => (
                  <button
                    key={floor.id}
                    onClick={() => {
                      setFloorId(floor.id);
                      setSelectedDeviceId(
                        devices.find((device) => device.floorId === floor.id)
                          ?.id ?? null,
                      );
                    }}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${floor.id === currentFloor.id ? "bg-white text-[#176b4d] shadow-sm" : "text-[#68766c] hover:text-[#17201b]"}`}
                  >
                    {floor.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border border-[#d8e2d9] bg-[#f9fbf8] p-3 sm:p-5">
              <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.13em] text-[#788379]">
                <span>West</span>
                <span>
                  {currentFloor.gridColumns} × {currentFloor.gridRows} room grid
                </span>
                <span>East</span>
              </div>
              <div
                className="grid min-h-[430px] gap-1 rounded-xl bg-[#dce5dc] p-1 sm:min-h-[520px]"
                style={{
                  gridTemplateColumns: `repeat(${currentFloor.gridColumns}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${currentFloor.gridRows}, minmax(0, 1fr))`,
                }}
              >
                {floorDevices.map((device) => {
                  const state = simulatorState(device);
                  const selected = device.id === selectedDevice?.id;
                  return (
                    <button
                      key={device.id}
                      onClick={() => setSelectedDeviceId(device.id)}
                      style={{
                        gridColumn: `${device.position.column} / span ${device.position.width ?? 1}`,
                        gridRow: `${device.position.row} / span ${device.position.height ?? 1}`,
                      }}
                      className={`group relative flex min-h-0 flex-col items-center justify-center overflow-hidden rounded-xl border p-2 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#176b4d] focus:ring-offset-2 ${state.marker} ${selected ? "ring-2 ring-[#176b4d] ring-offset-2" : ""}`}
                    >
                      <span
                        className={`mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm transition-transform duration-200 group-hover:scale-110 ${state.icon}`}
                      >
                        {deviceGlyph(device.type)}
                      </span>
                      <span className="max-w-full truncate text-[10px] font-extrabold leading-4 sm:text-xs">
                        {device.name}
                      </span>
                      <span className="mt-1 text-[9px] font-bold uppercase tracking-wide opacity-75">
                        {state.shortLabel}
                      </span>
                      {device.status === "ON" && (
                        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-current" />
                      )}
                    </button>
                  );
                })}
                {floorDevices.length === 0 && (
                  <p className="col-span-full row-span-full flex items-center justify-center text-sm font-medium text-[#6e776f]">
                    No devices are assigned to this floor.
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#68766c]">
              <Legend color="bg-[#1e6240]" label="Online or powered" />
              <Legend color="bg-[#a85a16]" label="Offline" />
              <Legend color="bg-[#b74737]" label="Error or failed" />
              <span className="ml-auto">Click any marker to inspect</span>
            </div>
          </div>
          <aside className="rounded-[28px] border border-[#dce5dc] bg-white p-5 shadow-[0_16px_45px_rgba(25,48,34,0.06)]">
            <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#6e776f]">
              DEVICE INSPECTOR
            </p>
            {selectedDevice ? (
              <DeviceInspector
                device={selectedDevice}
                usage={usage.filter(
                  (item) => item.deviceId === selectedDevice.id,
                )}
                now={now}
                onSetHealth={setHealth}
                onToggle={setDeviceStatus}
              />
            ) : (
              <p className="mt-5 text-sm text-[#6e776f]">
                Select a device from the plan.
              </p>
            )}
          </aside>
        </section>

        <section className="mt-6 rounded-[28px] border border-[#dce5dc] bg-white p-5 shadow-[0_16px_45px_rgba(25,48,34,0.06)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.16em] text-[#6e776f]">
                LIVE ACTIVITY
              </p>
              <h2 className="mt-1 text-lg font-bold">System event stream</h2>
            </div>
            <span className="text-xs font-bold text-[#176b4d]">
              Firestore synced
            </span>
          </div>
          <div className="mt-4 grid gap-2">
            {activity.length ? (
              activity.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center rounded-xl border border-[#e7ece7] bg-[#fafcf9] p-3 text-sm leading-5 text-[#526057]"
                >
                  <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#176b4d] align-middle" />
                  <span className="mr-2 text-[10px] font-extrabold tracking-wide text-[#176b4d]">
                    {event.source}
                  </span>
                  {event.message}
                  <span className="mt-1 self-end ml-auto pl-3.5 text-[10px] font-bold text-[#8a958b]">
                    {event.time}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6e776f]">
                Waiting for device activity.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DeviceInspector({
  device,
  usage,
  now,
  onSetHealth,
  onToggle,
}: {
  device: Device;
  usage: UsageItem[];
  now: number;
  onSetHealth: (device: Device, health: Device["health"]) => Promise<void>;
  onToggle: (device: Device) => Promise<void>;
}) {
  const state = simulatorState(device);
  const energyKwh = usage.reduce(
    (total, item) => total + item.estimatedEnergyKwh,
    0,
  );
  const runtime = getLiveRuntime(device, now);
  const latestSession = usage[0];
  const unavailable =
    !device.capabilities.canToggle ||
    device.health !== "CONNECTED" ||
    device.status === "ERROR" ||
    device.status === "DISCONNECTED";
  return (
    <div className="mt-5">
      <div
        className={`flex min-h-36 items-center justify-center rounded-2xl border ${state.marker}`}
      >
        <span
          className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm ${state.icon}`}
        >
          {deviceGlyph(device.type)}
        </span>
      </div>
      <div className="mt-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#6e776f]">
            {device.type.replace("-", " ")}
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">
            {device.name}
          </h2>
        </div>
        <div className="flex flex-col items-end gap-1">
          <StateBadge value={state.power.label} className={state.power.badge} />
          <StateBadge
            value={state.health.label}
            className={state.health.badge}
          />
        </div>
      </div>
      <div className="mt-5 rounded-2xl bg-[#f6f8f5] p-4 text-sm">
        <div className="flex justify-between gap-4 border-b border-[#e1e8e1] pb-3">
          <span className="text-[#6e776f]">Room position</span>
          <span className="font-bold text-[#17201b]">
            C{device.position.column} · R{device.position.row}
          </span>
        </div>
        <div className="mt-3 flex justify-between gap-4">
          <span className="text-[#6e776f]">Last source</span>
          <span className="font-bold text-[#17201b]">
            {device.lastChangedSource}
          </span>
        </div>
        <div className="mt-3 flex justify-between gap-4 border-t border-[#e1e8e1] pt-3">
          <span className="text-[#6e776f]">Recorded energy</span>
          <span className="font-bold text-[#176b4d]">
            {energyKwh.toFixed(4)} kWh
          </span>
        </div>
        {runtime.isRunning ? (
          <>
            <div className="mt-3 flex justify-between gap-4 border-t border-[#e1e8e1] pt-3">
              <span className="text-[#6e776f]">
                {device.type === "camera" ? "Camera uptime" : "Running time"}
              </span>
              <span className="font-bold text-[#17201b]">
                {formatRuntime(runtime.elapsedSeconds)}
              </span>
            </div>
            <div className="mt-3 flex justify-between gap-4">
              <span className="text-[#6e776f]">Live energy</span>
              <span className="font-bold text-[#176b4d]">
                {device.powerWatts}W · {runtime.estimatedEnergyKwh.toFixed(4)} kWh
              </span>
            </div>
            {device.type === "iron" && runtime.remainingSafetySeconds !== null && (
              <div className={`mt-3 flex justify-between gap-4 border-t border-[#e1e8e1] pt-3 ${runtime.safetyCutoffDue ? "text-[#96382b]" : "text-[#a85a16]"}`}>
                <span>Iron auto-off</span>
                <span className="font-bold">
                  {runtime.safetyCutoffDue ? "Cutoff pending" : `in ${formatRuntime(runtime.remainingSafetySeconds)}`}
                </span>
              </div>
            )}
          </>
        ) : latestSession ? (
          <div className="mt-3 flex justify-between gap-4 border-t border-[#e1e8e1] pt-3">
            <span className="text-[#6e776f]">Last session</span>
            <span className="font-bold text-[#17201b]">
              {formatRuntime(latestSession.durationSeconds)} · {latestSession.estimatedEnergyKwh.toFixed(4)} kWh
            </span>
          </div>
        ) : null}
      </div>
      {device.type === "camera" && (
        <div className="mt-4 overflow-hidden rounded-2xl bg-[#183126] p-5 text-center text-white">
          <span className="text-3xl">◉</span>
          <p className="mt-2 text-xs font-extrabold tracking-[0.14em]">
            MOCK SNAPSHOT
          </p>
          <p className="mt-1 text-xs text-[#b9d9c8]">
            {device.health === "CONNECTED" ? "Signal received" : "Signal lost"}
          </p>
        </div>
      )}
      <div className="mt-5">
        <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#6e776f]">
          CONNECTION HEALTH
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <HealthButton
            label="Online"
            active={device.health === "CONNECTED"}
            className="border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]"
            onClick={() => void onSetHealth(device, "CONNECTED")}
          />
          <HealthButton
            label="Error"
            active={device.health === "ERROR"}
            className="border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]"
            onClick={() => void onSetHealth(device, "ERROR")}
          />
          <HealthButton
            label="Offline"
            active={device.health === "DISCONNECTED"}
            className="border-[#f2d49b] bg-[#fff3dd] text-[#87530e]"
            onClick={() => void onSetHealth(device, "DISCONNECTED")}
          />
        </div>
      </div>
      {device.type === "switch-unit" && <SwitchPanel deviceId={device.id} />}
      <button
        onClick={() => void onToggle(device)}
        disabled={unavailable}
        className="mt-5 w-full rounded-xl bg-[#176b4d] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#12563e] disabled:cursor-not-allowed disabled:bg-[#b7c0b8]"
      >
        {!device.capabilities.canToggle
          ? "Monitoring only"
          : unavailable
            ? "Control unavailable"
            : device.status === "ON"
              ? "Turn power off"
              : "Turn power on"}
      </button>
    </div>
  );
}

function SwitchPanel({ deviceId }: { deviceId: string }) {
  const [switches, setSwitches] = useState<
    { id: string; name: string; status: string }[]
  >([]);
  useEffect(
    () =>
      onSnapshot(
        collection(
          firestore,
          switchCollectionPath(DEMO_HOUSEHOLD_ID, deviceId),
        ),
        (snapshot) =>
          setSwitches(
            snapshot.docs.map((item) => ({
              id: item.id,
              name: String(item.data().name),
              status: String(item.data().status),
            })),
          ),
      ),
    [deviceId],
  );
  async function toggle(item: { id: string; name: string; status: string }) {
    const status = item.status === "ON" ? "OFF" : "ON";
    await updateDoc(
      doc(
        firestore,
        `${switchCollectionPath(DEMO_HOUSEHOLD_ID, deviceId)}/${item.id}`,
      ),
      { status, updatedAt: new Date().toISOString() },
    );
  }
  return (
    <div className="mt-5 border-t border-[#e8ede8] pt-5">
      <p className="text-[10px] font-extrabold tracking-[0.14em] text-[#6e776f]">
        INDIVIDUAL SWITCHES
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {switches.map((item) => (
          <button
            key={item.id}
            onClick={() => void toggle(item)}
            className={`rounded-xl border px-3 py-3 text-left text-xs font-bold transition ${item.status === "ON" ? "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]" : "border-[#dce4dd] bg-white text-[#526057]"}`}
          >
            <span className="block truncate">{item.name}</span>
            <span className="mt-1 block text-[10px] opacity-70">
              {item.status}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "success" | "neutral" | "danger";
}) {
  const styles = {
    success: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
    neutral: "border-[#dce4dd] bg-white text-[#17201b]",
    danger: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
  };
  return (
    <div className={`rounded-2xl border p-4 ${styles[tone]}`}>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] opacity-75">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
function StateBadge({
  value,
  className,
}: {
  value: string;
  className: string;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${className}`}
    >
      {value}
    </span>
  );
}
function HealthButton({
  label,
  active,
  className,
  onClick,
}: {
  label: string;
  active: boolean;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-2 py-2 text-[10px] font-extrabold transition ${className} ${active ? "ring-2 ring-[#17201b] ring-offset-1" : "opacity-65 hover:opacity-100"}`}
    >
      {label}
    </button>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function simulatorState(device: Device) {
  const health =
    device.health === "ERROR"
      ? {
          label: "ERROR",
          badge: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
        }
      : device.health === "DISCONNECTED"
        ? {
            label: "OFFLINE",
            badge: "border-[#f2d49b] bg-[#fff3dd] text-[#87530e]",
          }
        : {
            label: "ONLINE",
            badge: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
          };
  if (device.status === "ERROR")
    return {
      power: {
        label: "FAILED",
        badge: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
      },
      health,
      marker: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
      icon: "text-[#b74737]",
      shortLabel: "Failed",
    };
  if (device.status === "DISCONNECTED" || device.health === "DISCONNECTED")
    return {
      power: {
        label: "OFFLINE",
        badge: "border-[#f2d49b] bg-[#fff3dd] text-[#87530e]",
      },
      health,
      marker: "border-[#f2d49b] bg-[#fff3dd] text-[#87530e]",
      icon: "text-[#a85a16]",
      shortLabel: "Offline",
    };
  if (device.health === "ERROR")
    return {
      power: {
        label: device.status === "ON" ? "POWER ON" : "POWER OFF",
        badge:
          device.status === "ON"
            ? "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]"
            : "border-[#d9e0da] bg-[#eef1ee] text-[#526057]",
      },
      health,
      marker: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
      icon: "text-[#b74737]",
      shortLabel: "Error",
    };
  if (device.status === "ON")
    return {
      power: {
        label: "POWER ON",
        badge: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
      },
      health,
      marker: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
      icon: "text-[#176b4d]",
      shortLabel: "On",
    };
  return {
    power: {
      label: "POWER OFF",
      badge: "border-[#d9e0da] bg-[#eef1ee] text-[#526057]",
    },
    health,
    marker: "border-[#d9e0da] bg-[#f5f7f5] text-[#526057]",
    icon: "text-[#68766c]",
    shortLabel: "Off",
  };
}

function deviceGlyph(type: Device["type"]) {
  return type === "iron"
    ? "♨"
    : type === "outlet"
      ? "⌁"
      : type === "switch-unit"
        ? "≋"
        : type === "camera"
          ? "◉"
          : "✦";
}
