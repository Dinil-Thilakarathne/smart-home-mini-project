"use client";

import type { Device } from "@smart-home/shared";
import {
	DEMO_HOUSEHOLD_ID,
	deviceCollectionPath,
	devicePath,
	switchCollectionPath,
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
import { useEffect, useMemo, useState } from "react";
import { firebaseAuth, firestore } from "@/lib/firebase";

export default function SimulatorPage() {
	const [devices, setDevices] = useState<Device[]>([]);
	const [message, setMessage] = useState(
		"Connecting to the local hardware state...",
	);
	const [filter, setFilter] = useState("all");
	const [events, setEvents] = useState<string[]>([]);

	useEffect(() => {
		let unsubscribe = () => {};
		signInAnonymously(firebaseAuth)
			.then(() => {
				const devicesQuery = query(
					collection(firestore, deviceCollectionPath(DEMO_HOUSEHOLD_ID)),
					orderBy("name"),
				);
				unsubscribe = onSnapshot(
					devicesQuery,
					(snapshot) => {
						setDevices(
							snapshot.docs.map(
								(item) => ({ id: item.id, ...item.data() }) as Device,
							),
						);
						setEvents((current) =>
							[
								`Device state synchronized at ${new Date().toLocaleTimeString()}`,
								...current,
							].slice(0, 8),
						);
						setMessage("Live Firestore connection");
					},
					() =>
						setMessage(
							"Unable to read Firestore. Start the emulators and seedDemo.",
						),
				);
				const eventsQuery = query(
					collection(firestore, `households/${DEMO_HOUSEHOLD_ID}/events`),
					orderBy("createdAt", "desc"),
				);
				onSnapshot(eventsQuery, (snapshot) => {
					setEvents(
						snapshot.docs
							.slice(0, 8)
							.map((item) => String(item.data().message)),
					);
				});
			})
			.catch(() => setMessage("Unable to authenticate with the emulator."));
		return () => unsubscribe();
	}, []);

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
			setEvents((current) =>
				[`SIMULATOR changed ${device.name} to ${status}`, ...current].slice(
					0,
					8,
				),
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
			setEvents((current) =>
				[`SIMULATOR set ${device.name} health to ${health}`, ...current].slice(
					0,
					8,
				),
			);
			setMessage(`${device.name} health set to ${health}`);
		} catch {
			setMessage(
				`Could not update ${device.name}. Check the emulator connection.`,
			);
		}
	}

	const visibleDevices = useMemo(
		() =>
			devices.filter(
				(device) =>
					filter === "all" ||
					device.type === filter ||
					device.floorId === filter ||
					device.health === filter,
			),
		[devices, filter],
	);

	return (
		<main className="mx-auto min-h-screen w-full  bg-[#f5f6f2] px-6 py-10 text-[#17201b]">
			<header className="mb-8 flex items-end justify-between gap-4">
				<div>
					<p className="text-xs font-bold tracking-[0.2em] text-[#6e776f]">
						HARDWARE SIMULATOR
					</p>
					<h1 className="mt-2 text-4xl font-bold tracking-tight">
						Physical device state
					</h1>
				</div>
				<p className="rounded-full bg-white px-4 py-2 text-sm text-[#2d6a4f]">
					{message}
				</p>
			</header>
			<div className="mb-5 flex flex-wrap gap-2">
				{[
					"all",
					"outlet",
					"light",
					"iron",
					"camera",
					"switch-unit",
					"ground-floor",
					"upper-floor",
					"DISCONNECTED",
				].map((item) => (
					<button
						key={item}
						onClick={() => setFilter(item)}
						className={`rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-[#2d6a4f] text-white" : "bg-white text-[#6e776f]"}`}
					>
						{item}
					</button>
				))}
			</div>
			<section className="grid gap-4 md:grid-cols-2">
				{visibleDevices.map((device) =>
					(() => {
						const state = simulatorState(device);
						return (
							<article
								key={device.id}
								className="rounded-2xl border border-[#e1e7e0] bg-white p-5 shadow-sm"
							>
								<div className="flex items-start justify-between gap-4">
									<div>
										<p className="text-xs font-bold uppercase tracking-wider text-[#6e776f]">
											{device.type}
										</p>
										<h2 className="mt-1 text-xl font-bold">{device.name}</h2>
									</div>
									<span
										className={`rounded-full border px-3 py-1 text-xs font-bold ${state.badge}`}
									>
										{state.label}
									</span>
								</div>
								<div className="mt-5 flex flex-wrap items-center justify-between gap-3">
									<div className="space-y-2 text-sm text-[#6e776f]">
										<p
											className={`inline-flex rounded-lg border px-2 py-1 text-xs font-bold ${state.health}`}
										>
											{device.health} · {device.floorId}
										</p>
										<p className="font-medium text-[#2d6a4f]">
											Layout: column {device.position.column}, row{" "}
											{device.position.row} · {device.position.width ?? 2} ×{" "}
											{device.position.height ?? 2}
										</p>
									</div>
									<div className="flex flex-wrap gap-2">
										<button
											onClick={() => void setHealth(device, "CONNECTED")}
											className="rounded-lg border border-[#d5ded6] px-2 py-1 text-xs"
										>
											Online
										</button>
										<button
											onClick={() => void setHealth(device, "ERROR")}
											className="rounded-lg border border-[#edc9b9] px-2 py-1 text-xs text-[#a33a2b]"
										>
											Error
										</button>
										<button
											onClick={() => void setHealth(device, "DISCONNECTED")}
											className="rounded-lg border border-[#edc9b9] px-2 py-1 text-xs text-[#a33a2b]"
										>
											Offline
										</button>
										<button
											onClick={() => void setDeviceStatus(device)}
											disabled={
												!device.capabilities.canToggle ||
												device.health !== "CONNECTED" ||
												device.status === "ERROR" ||
												device.status === "DISCONNECTED"
											}
											className="rounded-xl bg-[#2d6a4f] px-4 py-2 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#b7c0b8]"
										>
											{!device.capabilities.canToggle
												? "Monitoring only"
												: device.health === "CONNECTED"
													? "Toggle power"
													: "Control unavailable"}
										</button>
									</div>
								</div>
								{device.type === "switch-unit" && (
									<SwitchPanel
										deviceId={device.id}
										onEvent={(event) =>
											setEvents((current) => [event, ...current].slice(0, 8))
										}
									/>
								)}
							</article>
						);
					})(),
				)}
			</section>
			<section className="mt-8 rounded-2xl border border-[#e1e7e0] bg-white p-5">
				<h2 className="text-lg font-bold">Event log</h2>
				<div className="mt-3 space-y-2">
					{events.length === 0 ? (
						<p className="text-sm text-[#6e776f]">No events yet.</p>
					) : (
						events.map((event, index) => (
							<p
								key={`${event}-${index}`}
								className="border-b border-[#f0f2ed] pb-2 text-sm text-[#6e776f]"
							>
								{event}
							</p>
						))
					)}
				</div>
			</section>
			{devices.length === 0 && (
				<p className="rounded-2xl border border-dashed border-[#b8c4ba] p-8 text-center text-[#6e776f]">
					No seeded devices yet. Start Firebase and call the local seedDemo
					function.
				</p>
			)}
		</main>
	);
}

function simulatorState(device: Device) {
	if (device.health === "ERROR" || device.status === "ERROR")
		return {
			label: "ERROR",
			badge: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
			health: "border-[#f2c1b8] bg-[#fde8e5] text-[#96382b]",
		};
	if (device.health === "DISCONNECTED" || device.status === "DISCONNECTED")
		return {
			label: "OFFLINE",
			badge: "border-[#f2d49b] bg-[#fff3dd] text-[#87530e]",
			health: "border-[#f2d49b] bg-[#fff3dd] text-[#87530e]",
		};
	if (device.status === "ON")
		return {
			label: "ON",
			badge: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
			health: "border-[#b8dec6] bg-[#e1f3e8] text-[#1e6240]",
		};
	return {
		label: "OFF",
		badge: "border-[#d9e0da] bg-[#eef1ee] text-[#526057]",
		health: "border-[#d9e0da] bg-[#eef1ee] text-[#526057]",
	};
}

function SwitchPanel({
	deviceId,
	onEvent,
}: {
	deviceId: string;
	onEvent: (event: string) => void;
}) {
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
		onEvent(`SIMULATOR changed ${item.name} to ${status}`);
	}
	return (
		<div className="mt-4 rounded-xl bg-[#f5f6f2] p-3">
			<p className="text-xs font-bold uppercase tracking-wider text-[#6e776f]">
				Individual switches
			</p>
			<div className="mt-2 flex flex-wrap gap-2">
				{switches.map((item) => (
					<button
						key={item.id}
						onClick={() => void toggle(item)}
						className="rounded-lg bg-white px-3 py-2 text-xs font-bold"
					>
						{item.name}: {item.status}
					</button>
				))}
			</div>
		</div>
	);
}
