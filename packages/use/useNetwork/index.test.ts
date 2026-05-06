import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
	UseNetworkConnectionLike,
	UseNetworkNavigatorLike,
	WindowLike,
} from "../types";
import { useNetwork } from "./index";

class FakeConnection extends EventTarget implements UseNetworkConnectionLike {
	downlink?: number;
	downlinkMax?: number;
	effectiveType?: UseNetworkConnectionLike["effectiveType"];
	rtt?: number;
	saveData?: boolean;
	type?: UseNetworkConnectionLike["type"];

	setState(state: Partial<Omit<UseNetworkConnectionLike, keyof EventTarget>>) {
		Object.assign(this, state);
	}

	dispatchChange() {
		this.dispatchEvent(new Event("change"));
	}
}

class FakeNavigator implements UseNetworkNavigatorLike {
	connection?: FakeConnection | null;
	onLine?: boolean;
	readonly userAgent = "fake";

	constructor({
		connection,
		onLine = true,
	}: {
		connection?: FakeConnection | null;
		onLine?: boolean;
	} = {}) {
		this.connection = connection;
		this.onLine = onLine;
	}
}

class FakeWindow extends EventTarget implements WindowLike {
	readonly navigator: FakeNavigator;

	constructor(navigator: FakeNavigator = new FakeNavigator()) {
		super();
		this.navigator = navigator;
	}

	dispatchOnline(onLine: boolean) {
		this.navigator.onLine = onLine;
		this.dispatchEvent(new Event(onLine ? "online" : "offline"));
	}
}

describe("useNetwork", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(1_000);
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("reads navigator.onLine and connection values as the initial state", () => {
		const connection = new FakeConnection();
		connection.setState({
			downlink: 10,
			downlinkMax: 20,
			effectiveType: "4g",
			rtt: 50,
			saveData: true,
			type: "mixed",
		});
		const network = useNetwork({
			window: new FakeWindow(new FakeNavigator({ connection, onLine: true })),
		});

		expect(network.isSupported.value).toBe(true);
		expect(network.isOnline.value).toBe(true);
		expect(network.onlineAt.value).toBe(1_000);
		expect(network.offlineAt.value).toBeUndefined();
		expect(network.downlink.value).toBe(10);
		expect(network.downlinkMax.value).toBe(20);
		expect(network.effectiveType.value).toBe("4g");
		expect(network.rtt.value).toBe(50);
		expect(network.saveData.value).toBe(true);
		expect(network.type.value).toBe("mixed");

		network.stop();
	});

	it("tracks online and offline window events", () => {
		const fakeWindow = new FakeWindow(new FakeNavigator({ onLine: true }));
		const network = useNetwork({ window: fakeWindow });

		vi.setSystemTime(2_000);
		fakeWindow.dispatchOnline(false);
		expect(network.isOnline.value).toBe(false);
		expect(network.offlineAt.value).toBe(2_000);
		expect(network.onlineAt.value).toBeUndefined();

		vi.setSystemTime(3_000);
		fakeWindow.dispatchOnline(true);
		expect(network.isOnline.value).toBe(true);
		expect(network.offlineAt.value).toBeUndefined();
		expect(network.onlineAt.value).toBe(3_000);

		network.stop();
	});

	it("tracks connection change events", () => {
		const connection = new FakeConnection();
		connection.setState({ downlink: 1, effectiveType: "3g", type: "cellular" });
		const network = useNetwork({
			window: new FakeWindow(new FakeNavigator({ connection })),
		});

		connection.setState({
			downlink: 8,
			effectiveType: "4g",
			rtt: 25,
			saveData: false,
			type: "wifi",
		});
		connection.dispatchChange();

		expect(network.downlink.value).toBe(8);
		expect(network.effectiveType.value).toBe("4g");
		expect(network.rtt.value).toBe(25);
		expect(network.saveData.value).toBe(false);
		expect(network.type.value).toBe("wifi");

		network.stop();
		connection.setState({ downlink: 12 });
		connection.dispatchChange();
		expect(network.downlink.value).toBe(8);
	});

	it("reports unsupported when navigator is unavailable", () => {
		const network = useNetwork({
			navigator: null,
			window: null,
		});

		expect(network.isSupported.value).toBe(false);
		expect(network.isOnline.value).toBe(true);
		expect(network.onlineAt.value).toBeUndefined();
		expect(network.downlink.value).toBeUndefined();
		expect(network.saveData.value).toBe(false);
		expect(network.type.value).toBe("unknown");

		network.stop();
	});

	it("reports support when the connection property exists without an object", () => {
		const network = useNetwork({
			navigator: { connection: undefined },
			window: null,
		});

		expect(network.isSupported.value).toBe(true);
		expect(network.downlink.value).toBeUndefined();
		expect(network.type.value).toBe("unknown");

		network.stop();
	});

	it("does not fall back to window.navigator when navigator is null", () => {
		const connection = new FakeConnection();
		connection.setState({ downlink: 5, type: "wifi" });
		const fakeWindow = new FakeWindow(
			new FakeNavigator({ connection, onLine: false }),
		);
		const network = useNetwork({
			navigator: null,
			window: fakeWindow,
		});

		expect(network.isSupported.value).toBe(false);
		expect(network.isOnline.value).toBe(true);
		expect(network.downlink.value).toBeUndefined();

		fakeWindow.dispatchOnline(false);
		connection.setState({ downlink: 8 });
		connection.dispatchChange();
		expect(network.isOnline.value).toBe(true);
		expect(network.downlink.value).toBeUndefined();

		network.stop();
	});

	it("falls back to window.navigator while reactive navigator is undefined", () => {
		const fakeWindow = new FakeWindow(new FakeNavigator({ onLine: false }));
		const navigator = signal<UseNetworkNavigatorLike | null | undefined>(
			undefined,
		);
		const network = useNetwork({
			navigator,
			window: fakeWindow,
		});

		expect(network.isOnline.value).toBe(false);

		navigator.value = new FakeNavigator({ onLine: true });
		expect(network.isOnline.value).toBe(true);

		navigator.value = undefined;
		expect(network.isOnline.value).toBe(false);

		network.stop();
	});

	it("accepts a navigator separate from the event window", () => {
		const fakeWindow = new FakeWindow(new FakeNavigator({ onLine: true }));
		const navigator = new FakeNavigator({ onLine: false });
		const network = useNetwork({
			navigator,
			window: fakeWindow,
		});

		expect(network.isOnline.value).toBe(false);

		navigator.onLine = true;
		fakeWindow.dispatchEvent(new Event("online"));
		expect(network.isOnline.value).toBe(true);

		network.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstConnection = new FakeConnection();
		firstConnection.setState({ downlink: 1 });
		const secondConnection = new FakeConnection();
		secondConnection.setState({ downlink: 2 });
		const firstWindow = new FakeWindow(
			new FakeNavigator({ connection: firstConnection, onLine: false }),
		);
		const secondWindow = new FakeWindow(
			new FakeNavigator({ connection: secondConnection, onLine: true }),
		);
		const windowTarget = signal<WindowLike | null>(firstWindow);
		const network = useNetwork({ window: windowTarget });

		expect(network.isOnline.value).toBe(false);
		expect(network.downlink.value).toBe(1);

		windowTarget.value = secondWindow;
		expect(network.isOnline.value).toBe(true);
		expect(network.downlink.value).toBe(2);

		firstWindow.dispatchOnline(false);
		firstConnection.setState({ downlink: 10 });
		firstConnection.dispatchChange();
		expect(network.downlink.value).toBe(2);

		secondConnection.setState({ downlink: 4 });
		secondConnection.dispatchChange();
		expect(network.downlink.value).toBe(4);

		windowTarget.value = null;
		expect(network.isSupported.value).toBe(false);
		expect(network.isOnline.value).toBe(true);
		expect(network.downlink.value).toBeUndefined();

		secondConnection.setState({ downlink: 6 });
		secondConnection.dispatchChange();
		expect(network.downlink.value).toBeUndefined();

		network.stop();
	});
});
