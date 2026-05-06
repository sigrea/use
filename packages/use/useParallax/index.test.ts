import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseParallaxScreenOrientationLike,
	UseParallaxWindowLike,
} from "../types";
import { useParallax } from "./index";

interface RectValues {
	height: number;
	left: number;
	top: number;
	width: number;
}

class FakeDeviceOrientationEvent
	extends Event
	implements DeviceOrientationEvent
{
	readonly absolute: boolean;
	readonly alpha: number | null;
	readonly beta: number | null;
	readonly gamma: number | null;

	constructor(
		type: string,
		init: Partial<
			Pick<DeviceOrientationEvent, "absolute" | "alpha" | "beta" | "gamma">
		> = {},
	) {
		super(type);
		this.absolute = init.absolute ?? false;
		this.alpha = init.alpha ?? null;
		this.beta = init.beta ?? null;
		this.gamma = init.gamma ?? null;
	}

	initDeviceOrientationEvent(): void {}
}

class FakeScreenOrientation
	extends EventTarget
	implements UseParallaxScreenOrientationLike
{
	type: OrientationType = "landscape-primary";

	setType(type: OrientationType) {
		this.type = type;
		this.dispatchEvent(new Event("change"));
	}
}

class FakeWindow extends EventTarget implements UseParallaxWindowLike {
	readonly document = document;
	readonly navigator = navigator;
	readonly screen = {
		orientation: new FakeScreenOrientation(),
	};
	readonly DeviceOrientationEvent =
		FakeDeviceOrientationEvent as unknown as typeof DeviceOrientationEvent;
	scrollX = 0;
	scrollY = 0;
}

function mouseEvent(type: string, pageX: number, pageY: number): MouseEvent {
	const event = new MouseEvent(type, { clientX: pageX, clientY: pageY });
	Object.defineProperties(event, {
		pageX: { value: pageX },
		pageY: { value: pageY },
	});

	return event;
}

function rect(values: RectValues): DOMRect {
	return {
		bottom: values.top + values.height,
		height: values.height,
		left: values.left,
		right: values.left + values.width,
		top: values.top,
		width: values.width,
		x: values.left,
		y: values.top,
		toJSON: () => values,
	} as DOMRect;
}

function setClientRects(element: Element, values: RectValues[]) {
	Object.defineProperty(element, "getClientRects", {
		configurable: true,
		value: () => values.map(rect) as unknown as DOMRectList,
	});
}

function dispatchOrientation(
	window: FakeWindow,
	init: Partial<
		Pick<DeviceOrientationEvent, "absolute" | "alpha" | "beta" | "gamma">
	>,
) {
	window.dispatchEvent(
		new FakeDeviceOrientationEvent("deviceorientation", init),
	);
}

describe("useParallax", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("uses mouse position when device orientation is unavailable", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 200, left: 10, top: 20, width: 100 }]);
		const parallax = useParallax(element, { window: fakeWindow });

		expect(parallax.source.value).toBe("mouse");
		fakeWindow.dispatchEvent(mouseEvent("mousemove", 60, 120));
		expect(parallax.roll.value).toBeCloseTo(0);
		expect(parallax.tilt.value).toBeCloseTo(0);

		fakeWindow.dispatchEvent(mouseEvent("mousemove", 110, 20));

		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0.5);
		expect(parallax.tilt.value).toBe(0.5);

		parallax.stop();
	});

	it("applies mouse adjusters", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 100, left: 0, top: 0, width: 100 }]);
		const parallax = useParallax(element, {
			mouseRollAdjust: (value) => value * 2,
			mouseTiltAdjust: (value) => value * 3,
			window: fakeWindow,
		});

		fakeWindow.dispatchEvent(mouseEvent("mousemove", 100, 0));

		expect(parallax.roll.value).toBe(1);
		expect(parallax.tilt.value).toBe(1.5);

		parallax.stop();
	});

	it("uses device orientation when non-zero orientation data is available", () => {
		const fakeWindow = new FakeWindow();
		const parallax = useParallax(null, { window: fakeWindow });

		dispatchOrientation(fakeWindow, {
			alpha: 1,
			beta: 45,
			gamma: 30,
		});

		expect(parallax.source.value).toBe("deviceOrientation");
		expect(parallax.roll.value).toBeCloseTo(30 / 90);
		expect(parallax.tilt.value).toBeCloseTo(45 / 90);

		fakeWindow.screen.orientation.setType("portrait-primary");

		expect(parallax.roll.value).toBeCloseTo(-45 / 90);
		expect(parallax.tilt.value).toBeCloseTo(30 / 90);

		parallax.stop();
	});

	it("falls back to mouse when orientation data is zero", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 100, left: 0, top: 0, width: 100 }]);
		const parallax = useParallax(element, { window: fakeWindow });

		dispatchOrientation(fakeWindow, {
			alpha: 0,
			beta: 45,
			gamma: 0,
		});
		fakeWindow.dispatchEvent(mouseEvent("mousemove", 100, 0));

		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0.5);
		expect(parallax.tilt.value).toBe(0.5);

		parallax.stop();
	});

	it("applies device orientation adjusters", () => {
		const fakeWindow = new FakeWindow();
		const parallax = useParallax(null, {
			deviceOrientationRollAdjust: (value) => value * 2,
			deviceOrientationTiltAdjust: (value) => value * 3,
			window: fakeWindow,
		});

		dispatchOrientation(fakeWindow, {
			alpha: 1,
			beta: 45,
			gamma: 30,
		});

		expect(parallax.roll.value).toBeCloseTo((30 / 90) * 2);
		expect(parallax.tilt.value).toBeCloseTo((45 / 90) * 3);

		parallax.stop();
	});

	it("retargets reactive windows", () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const windowTarget = signal<UseParallaxWindowLike | null>(firstWindow);
		const parallax = useParallax(null, { window: windowTarget });

		dispatchOrientation(firstWindow, {
			alpha: 1,
			beta: 45,
			gamma: 30,
		});
		expect(parallax.source.value).toBe("deviceOrientation");
		expect(parallax.roll.value).toBeCloseTo(30 / 90);

		windowTarget.value = secondWindow;
		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0);

		dispatchOrientation(firstWindow, {
			alpha: 1,
			beta: 45,
			gamma: 60,
		});
		expect(parallax.source.value).toBe("mouse");

		dispatchOrientation(secondWindow, {
			alpha: 1,
			beta: 45,
			gamma: 60,
		});
		expect(parallax.source.value).toBe("deviceOrientation");
		expect(parallax.roll.value).toBeCloseTo(60 / 90);

		parallax.stop();
	});

	it("forwards device orientation permission requests", async () => {
		const requestPermission = vi.fn(async () => "granted" as PermissionState);
		const fakeWindow = new FakeWindow();
		Object.defineProperty(
			fakeWindow.DeviceOrientationEvent,
			"requestPermission",
			{
				configurable: true,
				value: requestPermission,
			},
		);
		const parallax = useParallax(null, {
			absolute: true,
			requestPermissions: false,
			window: fakeWindow,
		});

		expect(parallax.source.value).toBe("mouse");

		await parallax.ensurePermissions(false);
		dispatchOrientation(fakeWindow, {
			alpha: 1,
			beta: 45,
			gamma: 30,
		});

		expect(requestPermission).toHaveBeenCalledWith(false);
		expect(parallax.source.value).toBe("deviceOrientation");

		parallax.stop();
	});

	it("stops mouse, device orientation, and screen orientation updates", () => {
		const fakeWindow = new FakeWindow();
		const element = document.createElement("div");
		setClientRects(element, [{ height: 100, left: 0, top: 0, width: 100 }]);
		const parallax = useParallax(element, { window: fakeWindow });

		fakeWindow.dispatchEvent(mouseEvent("mousemove", 100, 0));
		expect(parallax.roll.value).toBe(0.5);

		parallax.stop();
		fakeWindow.dispatchEvent(mouseEvent("mousemove", 0, 100));
		dispatchOrientation(fakeWindow, {
			alpha: 1,
			beta: 45,
			gamma: 30,
		});
		fakeWindow.screen.orientation.setType("portrait-primary");

		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0.5);
		expect(parallax.tilt.value).toBe(0.5);
	});

	it("uses safe values without a window or target size", () => {
		const parallax = useParallax(null, { window: null });

		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0);
		expect(parallax.tilt.value).toBe(0);

		parallax.stop();
	});
});
