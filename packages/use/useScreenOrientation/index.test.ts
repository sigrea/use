import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	OrientationLockType,
	OrientationType,
	UseScreenOrientationScreenOrientationLike,
	UseScreenOrientationWindowLike,
} from "../types";
import { useScreenOrientation } from "./index";

class FakeScreenOrientation
	extends EventTarget
	implements UseScreenOrientationScreenOrientationLike
{
	type: OrientationType;
	angle: number;
	lock?: (type: OrientationLockType) => Promise<void>;
	unlock?: () => void;

	constructor(
		type: OrientationType = "portrait-primary",
		angle = 0,
		options: { lock?: boolean; unlock?: boolean } = {},
	) {
		super();
		this.type = type;
		this.angle = angle;

		if (options.lock !== false) {
			this.lock = vi.fn(async () => {});
		}
		if (options.unlock !== false) {
			this.unlock = vi.fn(() => {});
		}
	}

	setOrientation(type: OrientationType, angle: number) {
		this.type = type;
		this.angle = angle;
		this.dispatchEvent(new Event("change"));
	}

	setOrientationSilently(type: OrientationType, angle: number) {
		this.type = type;
		this.angle = angle;
	}
}

class FakeWindow extends EventTarget implements UseScreenOrientationWindowLike {
	readonly screen: {
		orientation?: UseScreenOrientationScreenOrientationLike;
	};

	constructor(orientation?: UseScreenOrientationScreenOrientationLike) {
		super();
		this.screen = { orientation };
	}

	dispatchOrientationChange() {
		this.dispatchEvent(new Event("orientationchange"));
	}
}

describe("useScreenOrientation", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.restoreAllMocks();
	});

	it("reads the current screen orientation", () => {
		const screenOrientation = new FakeScreenOrientation(
			"landscape-primary",
			90,
		);
		const orientation = useScreenOrientation({
			window: new FakeWindow(screenOrientation),
		});

		expect(orientation.isSupported.value).toBe(true);
		expect(orientation.orientation.value).toBe("landscape-primary");
		expect(orientation.angle.value).toBe(90);

		orientation.stop();
	});

	it("updates from ScreenOrientation change events", () => {
		const screenOrientation = new FakeScreenOrientation("portrait-primary", 0);
		const orientation = useScreenOrientation({
			window: new FakeWindow(screenOrientation),
		});

		screenOrientation.setOrientation("portrait-secondary", 180);

		expect(orientation.orientation.value).toBe("portrait-secondary");
		expect(orientation.angle.value).toBe(180);

		orientation.stop();
	});

	it("also updates from window orientationchange events", () => {
		const screenOrientation = new FakeScreenOrientation("portrait-primary", 0);
		const fakeWindow = new FakeWindow(screenOrientation);
		const orientation = useScreenOrientation({ window: fakeWindow });

		screenOrientation.setOrientationSilently("landscape-secondary", 270);
		fakeWindow.dispatchOrientationChange();

		expect(orientation.orientation.value).toBe("landscape-secondary");
		expect(orientation.angle.value).toBe(270);

		orientation.stop();
	});

	it("uses fallback values when screen.orientation is unavailable", async () => {
		const orientation = useScreenOrientation({
			window: new FakeWindow(),
		});

		expect(orientation.isSupported.value).toBe(false);
		expect(orientation.orientation.value).toBeUndefined();
		expect(orientation.angle.value).toBe(0);
		await expect(
			orientation.lockOrientation("portrait-primary"),
		).rejects.toThrow("Screen Orientation API is not supported");

		expect(() => {
			orientation.unlockOrientation();
		}).not.toThrow();

		orientation.stop();
	});

	it("rejects lockOrientation when lock is unavailable", async () => {
		const screenOrientation = new FakeScreenOrientation("portrait-primary", 0, {
			lock: false,
		});
		const orientation = useScreenOrientation({
			window: new FakeWindow(screenOrientation),
		});

		await expect(orientation.lockOrientation("landscape")).rejects.toThrow(
			"Screen Orientation API is not supported",
		);

		orientation.stop();
	});

	it("ignores unlockOrientation when unlock is unavailable", () => {
		const screenOrientation = new FakeScreenOrientation("portrait-primary", 0, {
			unlock: false,
		});
		const orientation = useScreenOrientation({
			window: new FakeWindow(screenOrientation),
		});

		expect(() => {
			orientation.unlockOrientation();
		}).not.toThrow();

		orientation.stop();
	});

	it("delegates lock and unlock to screen.orientation", async () => {
		const screenOrientation = new FakeScreenOrientation();
		const orientation = useScreenOrientation({
			window: new FakeWindow(screenOrientation),
		});

		await orientation.lockOrientation("landscape");
		orientation.unlockOrientation();

		expect(screenOrientation.lock).toHaveBeenCalledWith("landscape");
		expect(screenOrientation.unlock).toHaveBeenCalledOnce();

		orientation.stop();
	});

	it("retargets listeners when the window changes", () => {
		const firstScreenOrientation = new FakeScreenOrientation(
			"portrait-primary",
			0,
		);
		const secondScreenOrientation = new FakeScreenOrientation(
			"landscape-primary",
			90,
		);
		const firstWindow = new FakeWindow(firstScreenOrientation);
		const secondWindow = new FakeWindow(secondScreenOrientation);
		const windowTarget = signal<UseScreenOrientationWindowLike | null>(
			firstWindow,
		);
		const orientation = useScreenOrientation({ window: windowTarget });

		expect(orientation.orientation.value).toBe("portrait-primary");

		windowTarget.value = secondWindow;

		expect(orientation.orientation.value).toBe("landscape-primary");
		expect(orientation.angle.value).toBe(90);

		firstScreenOrientation.setOrientation("portrait-secondary", 180);
		expect(orientation.orientation.value).toBe("landscape-primary");

		secondScreenOrientation.setOrientation("landscape-secondary", 270);
		expect(orientation.orientation.value).toBe("landscape-secondary");
		expect(orientation.angle.value).toBe(270);

		windowTarget.value = null;
		expect(orientation.isSupported.value).toBe(false);
		expect(orientation.orientation.value).toBeUndefined();
		expect(orientation.angle.value).toBe(0);

		secondScreenOrientation.setOrientation("portrait-primary", 0);
		expect(orientation.orientation.value).toBeUndefined();

		orientation.stop();
	});

	it("stops listening for orientation changes", () => {
		const screenOrientation = new FakeScreenOrientation("portrait-primary", 0);
		const fakeWindow = new FakeWindow(screenOrientation);
		const orientation = useScreenOrientation({ window: fakeWindow });

		orientation.stop();
		screenOrientation.setOrientation("landscape-primary", 90);
		fakeWindow.dispatchOrientationChange();

		expect(orientation.orientation.value).toBe("portrait-primary");
		expect(orientation.angle.value).toBe(0);
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const orientation = useScreenOrientation({ window: null });

		expect(addSpy).not.toHaveBeenCalled();
		expect(orientation.isSupported.value).toBe(false);
		expect(orientation.orientation.value).toBeUndefined();
		expect(orientation.angle.value).toBe(0);

		orientation.stop();
	});

	it("uses the default window when window is undefined", () => {
		const screenOrientation = new FakeScreenOrientation(
			"landscape-primary",
			90,
		);
		Object.defineProperty(window, "screen", {
			configurable: true,
			value: {
				orientation: screenOrientation,
			},
		});
		const orientation = useScreenOrientation({ window: undefined });

		expect(orientation.isSupported.value).toBe(true);
		expect(orientation.orientation.value).toBe("landscape-primary");
		expect(orientation.angle.value).toBe(90);

		orientation.stop();
	});
});
