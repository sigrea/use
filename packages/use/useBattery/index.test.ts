import { signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type { BatteryManagerLike, BatteryNavigatorLike } from "../types";
import { useBattery } from "./index";

class FakeBatteryManager extends EventTarget implements BatteryManagerLike {
	charging = false;
	chargingTime = 0;
	dischargingTime = 0;
	level = 1;

	setState(state: Partial<Omit<BatteryManagerLike, keyof EventTarget>>) {
		Object.assign(this, state);
	}
}

function createBatteryNavigator(
	battery: BatteryManagerLike,
): BatteryNavigatorLike {
	return {
		getBattery: vi.fn(() => Promise.resolve(battery)),
	};
}

describe("useBattery", () => {
	it("uses fallback values without a battery navigator", () => {
		const result = useBattery({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.charging.value).toBe(false);
		expect(result.chargingTime.value).toBe(0);
		expect(result.dischargingTime.value).toBe(0);
		expect(result.level.value).toBe(1);

		result.stop();
	});

	it("treats non-function getBattery as unsupported", () => {
		const result = useBattery({
			navigator: { getBattery: true } as unknown as BatteryNavigatorLike,
		});

		expect(result.isSupported.value).toBe(false);
		result.stop();
	});

	it("updates state after getBattery resolves", async () => {
		const battery = new FakeBatteryManager();
		battery.setState({
			charging: true,
			chargingTime: 60,
			dischargingTime: Number.POSITIVE_INFINITY,
			level: 0.75,
		});
		const navigator = createBatteryNavigator(battery);
		const result = useBattery({ navigator });

		expect(result.isSupported.value).toBe(true);
		expect(result.level.value).toBe(1);

		await vi.waitFor(() => {
			expect(result.level.value).toBe(0.75);
		});

		expect(result.charging.value).toBe(true);
		expect(result.chargingTime.value).toBe(60);
		expect(result.dischargingTime.value).toBe(Number.POSITIVE_INFINITY);
		expect(navigator.getBattery).toHaveBeenCalledOnce();
		result.stop();
	});

	it("updates state from battery events", async () => {
		const battery = new FakeBatteryManager();
		const result = useBattery({ navigator: createBatteryNavigator(battery) });
		await vi.waitFor(() => {
			expect(result.isSupported.value).toBe(true);
		});

		battery.setState({ charging: true });
		battery.dispatchEvent(new Event("chargingchange"));
		expect(result.charging.value).toBe(true);

		battery.setState({ chargingTime: 120 });
		battery.dispatchEvent(new Event("chargingtimechange"));
		expect(result.chargingTime.value).toBe(120);

		battery.setState({ dischargingTime: 300 });
		battery.dispatchEvent(new Event("dischargingtimechange"));
		expect(result.dischargingTime.value).toBe(300);

		battery.setState({ level: 0.4 });
		battery.dispatchEvent(new Event("levelchange"));
		expect(result.level.value).toBe(0.4);

		result.stop();
	});

	it("stops listening to battery events", async () => {
		const battery = new FakeBatteryManager();
		const result = useBattery({ navigator: createBatteryNavigator(battery) });
		await vi.waitFor(() => {
			expect(result.isSupported.value).toBe(true);
		});

		result.stop();

		battery.setState({ level: 0.2 });
		battery.dispatchEvent(new Event("levelchange"));
		expect(result.level.value).toBe(1);
	});

	it("switches listeners when the navigator changes", async () => {
		const firstBattery = new FakeBatteryManager();
		const secondBattery = new FakeBatteryManager();
		secondBattery.setState({ level: 0.6 });
		const navigator = signal<BatteryNavigatorLike | null>(
			createBatteryNavigator(firstBattery),
		);
		const result = useBattery({ navigator });

		await vi.waitFor(() => {
			expect(result.level.value).toBe(1);
		});

		navigator.value = createBatteryNavigator(secondBattery);
		await vi.waitFor(() => {
			expect(result.level.value).toBe(0.6);
		});

		firstBattery.setState({ level: 0.1 });
		firstBattery.dispatchEvent(new Event("levelchange"));
		expect(result.level.value).toBe(0.6);

		secondBattery.setState({ level: 0.7 });
		secondBattery.dispatchEvent(new Event("levelchange"));
		expect(result.level.value).toBe(0.7);
		result.stop();
	});

	it("resets values when the navigator becomes unsupported", async () => {
		const battery = new FakeBatteryManager();
		battery.setState({ charging: true, chargingTime: 10, level: 0.3 });
		const navigator = signal<BatteryNavigatorLike | null>(
			createBatteryNavigator(battery),
		);
		const result = useBattery({ navigator });

		await vi.waitFor(() => {
			expect(result.level.value).toBe(0.3);
		});

		navigator.value = null;

		expect(result.isSupported.value).toBe(false);
		expect(result.charging.value).toBe(false);
		expect(result.chargingTime.value).toBe(0);
		expect(result.dischargingTime.value).toBe(0);
		expect(result.level.value).toBe(1);

		battery.setState({ level: 0.1 });
		battery.dispatchEvent(new Event("levelchange"));
		expect(result.level.value).toBe(1);
		result.stop();
	});

	it("keeps the latest navigator when getBattery resolves out of order", async () => {
		const firstBattery = new FakeBatteryManager();
		firstBattery.setState({ level: 0.1 });
		const secondBattery = new FakeBatteryManager();
		secondBattery.setState({ level: 0.9 });
		let resolveFirst: (battery: BatteryManagerLike) => void = () => {};
		const firstNavigator: BatteryNavigatorLike = {
			getBattery: () =>
				new Promise((resolve) => {
					resolveFirst = resolve;
				}),
		};
		const secondNavigator = createBatteryNavigator(secondBattery);
		const navigator = signal<BatteryNavigatorLike | null>(firstNavigator);
		const result = useBattery({ navigator });

		navigator.value = secondNavigator;
		await vi.waitFor(() => {
			expect(result.level.value).toBe(0.9);
		});

		resolveFirst(firstBattery);
		await Promise.resolve();

		expect(result.level.value).toBe(0.9);
		result.stop();
	});

	it("handles getBattery rejection without unhandled rejections", async () => {
		const error = new Error("denied");
		const result = useBattery({
			navigator: {
				getBattery: vi.fn(() => Promise.reject(error)),
			} as BatteryNavigatorLike,
		});

		expect(result.isSupported.value).toBe(true);
		await Promise.resolve();
		expect(result.level.value).toBe(1);
		result.stop();
	});
});
