// @vitest-environment node

import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseGamepadButtonLike,
	UseGamepadGamepadLike,
	UseGamepadNavigatorLike,
	UseGamepadWindowLike,
} from "../types";
import { useGamepad } from "./index";

function createButton(
	value: number,
	options: Partial<UseGamepadButtonLike> = {},
): UseGamepadButtonLike {
	return {
		pressed: value > 0.5,
		touched: value > 0,
		value,
		...options,
	};
}

function createGamepad(
	index: number,
	options: Partial<UseGamepadGamepadLike> = {},
): UseGamepadGamepadLike {
	return {
		axes: [0, 0],
		buttons: [createButton(0), createButton(0)],
		connected: true,
		id: `Gamepad ${index}`,
		index,
		mapping: "standard",
		timestamp: 0,
		vibrationActuator: null,
		...options,
	};
}

class FakeNavigator implements UseGamepadNavigatorLike {
	gamepads: Array<UseGamepadGamepadLike | null> = [];
	readonly getGamepads = vi.fn(() => this.gamepads);
}

class ThrowingNavigator implements UseGamepadNavigatorLike {
	readonly getGamepads = vi.fn(() => {
		throw new DOMException("blocked", "SecurityError");
	});
}

class FakeGamepadWindow extends EventTarget implements UseGamepadWindowLike {
	private frameId = 0;
	private readonly frames = new Map<number, FrameRequestCallback>();
	readonly cancelAnimationFrame = vi.fn((handle: number) => {
		this.frames.delete(handle);
	});
	readonly requestAnimationFrame = vi.fn(
		(callback: FrameRequestCallback): number => {
			const handle = ++this.frameId;
			this.frames.set(handle, callback);
			return handle;
		},
	);

	constructor(
		readonly navigator: UseGamepadNavigatorLike = new FakeNavigator(),
	) {
		super();
	}

	dispatchGamepad(
		type: "gamepadconnected" | "gamepaddisconnected",
		gamepad: UseGamepadGamepadLike,
	): void {
		this.dispatchEvent(Object.assign(new Event(type), { gamepad }));
	}

	flushFrame(time = 0): void {
		for (const [handle, callback] of [...this.frames.entries()]) {
			if (!this.frames.delete(handle)) {
				continue;
			}
			callback(time);
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

describe("useGamepad", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("stays unsupported when navigator and window are null", () => {
		const requestAnimationFrame = vi.fn();
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
		const gamepad = useGamepad({ navigator: null, window: null });

		expect(gamepad.isSupported.value).toBe(false);
		expect(gamepad.isActive.value).toBe(false);
		expect(gamepad.gamepads.value).toEqual([]);
		expect(requestAnimationFrame).not.toHaveBeenCalled();

		gamepad.resume();
		expect(gamepad.isActive.value).toBe(false);

		gamepad.stop();
	});

	it("uses the configured window navigator when navigator is omitted", () => {
		const navigator = new FakeNavigator();
		const window = new FakeGamepadWindow(navigator);
		const first = createGamepad(0, {
			axes: [0.5],
			buttons: [createButton(1)],
		});
		navigator.gamepads = [first];
		const gamepad = useGamepad({ window });

		window.flushFrame();

		expect(gamepad.isSupported.value).toBe(true);
		expect(gamepad.isActive.value).toBe(true);
		expect(gamepad.gamepads.value).toEqual([
			expect.objectContaining({
				axes: [0.5],
				buttons: [{ pressed: true, touched: true, value: 1 }],
				id: "Gamepad 0",
				index: 0,
				mapping: "standard",
			}),
		]);

		gamepad.stop();
	});

	it("emits connect and disconnect events from window events", () => {
		const window = new FakeGamepadWindow();
		const connected = vi.fn();
		const disconnected = vi.fn();
		const gamepad = useGamepad({ window });
		gamepad.onConnected(connected);
		gamepad.onDisconnected(disconnected);
		const first = createGamepad(1);

		window.dispatchGamepad("gamepadconnected", first);
		window.dispatchGamepad("gamepadconnected", first);

		expect(connected).toHaveBeenCalledOnce();
		expect(connected).toHaveBeenCalledWith(1);
		expect(gamepad.gamepads.value.map((item) => item.index)).toEqual([1]);

		window.dispatchGamepad("gamepaddisconnected", first);
		window.dispatchGamepad("gamepaddisconnected", first);

		expect(disconnected).toHaveBeenCalledOnce();
		expect(disconnected).toHaveBeenCalledWith(1);
		expect(gamepad.gamepads.value).toEqual([]);

		gamepad.stop();
	});

	it("updates existing snapshots while polling", () => {
		const navigator = new FakeNavigator();
		const window = new FakeGamepadWindow(navigator);
		const first = createGamepad(0, {
			axes: [0],
			buttons: [createButton(0)],
			timestamp: 1,
		});
		navigator.gamepads = [first];
		const gamepad = useGamepad({ navigator, window });

		window.flushFrame();
		expect(gamepad.gamepads.value[0]?.buttons[0]?.value).toBe(0);

		navigator.gamepads = [
			createGamepad(0, {
				axes: [1],
				buttons: [createButton(0.75)],
				timestamp: 2,
			}),
		];
		window.flushFrame();

		expect(gamepad.gamepads.value[0]).toEqual(
			expect.objectContaining({
				axes: [1],
				buttons: [{ pressed: true, touched: true, value: 0.75 }],
				timestamp: 2,
			}),
		);

		gamepad.stop();
	});

	it("removes stale snapshots when polling returns null or missing indices", () => {
		const navigator = new FakeNavigator();
		const window = new FakeGamepadWindow(navigator);
		const disconnected = vi.fn();
		navigator.gamepads = [createGamepad(0), null, createGamepad(2)];
		const gamepad = useGamepad({ navigator, window });
		gamepad.onDisconnected(disconnected);

		window.flushFrame();
		expect(gamepad.gamepads.value.map((item) => item.index)).toEqual([0, 2]);

		navigator.gamepads = [null];
		window.flushFrame();

		expect(gamepad.gamepads.value).toEqual([]);
		expect(disconnected).toHaveBeenCalledTimes(2);
		expect(disconnected).toHaveBeenNthCalledWith(1, 0);
		expect(disconnected).toHaveBeenNthCalledWith(2, 2);

		gamepad.stop();
	});

	it("pauses, resumes, and cancels pending frames on stop", () => {
		const window = new FakeGamepadWindow();
		const gamepad = useGamepad({ window });

		expect(gamepad.isActive.value).toBe(true);
		expect(window.pendingFrameCount).toBe(1);

		gamepad.pause();

		expect(gamepad.isActive.value).toBe(false);
		expect(window.cancelAnimationFrame).toHaveBeenCalledOnce();
		expect(window.pendingFrameCount).toBe(0);

		gamepad.resume();
		expect(gamepad.isActive.value).toBe(true);
		expect(window.pendingFrameCount).toBe(1);

		gamepad.stop();
		expect(gamepad.isActive.value).toBe(false);
		expect(window.pendingFrameCount).toBe(0);

		gamepad.resume();
		expect(gamepad.isActive.value).toBe(false);
	});

	it("clears snapshots when the navigator target changes", () => {
		const firstWindow = new FakeGamepadWindow();
		const secondWindow = new FakeGamepadWindow();
		const target = signal<UseGamepadWindowLike | null>(firstWindow);
		const gamepad = useGamepad({ window: target });

		firstWindow.dispatchGamepad("gamepadconnected", createGamepad(0));
		expect(gamepad.gamepads.value).toHaveLength(1);

		target.value = secondWindow;

		expect(gamepad.gamepads.value).toEqual([]);
		firstWindow.dispatchGamepad("gamepadconnected", createGamepad(1));
		expect(gamepad.gamepads.value).toEqual([]);
		secondWindow.dispatchGamepad("gamepadconnected", createGamepad(2));
		expect(gamepad.gamepads.value.map((item) => item.index)).toEqual([2]);

		gamepad.stop();
	});

	it("pauses safely when getGamepads throws", () => {
		const navigator = new ThrowingNavigator();
		const window = new FakeGamepadWindow(navigator);
		const gamepad = useGamepad({ navigator, window });
		window.dispatchGamepad("gamepadconnected", createGamepad(0));

		expect(gamepad.gamepads.value).toHaveLength(1);
		window.flushFrame();

		expect(navigator.getGamepads).toHaveBeenCalled();
		expect(gamepad.isSupported.value).toBe(false);
		expect(gamepad.isActive.value).toBe(false);
		expect(gamepad.gamepads.value).toEqual([]);
	});

	it("starts polling on molecule mount and pauses on unmount", () => {
		const window = new FakeGamepadWindow();
		const GamepadMolecule = molecule(() => useGamepad({ window }));
		const instance = GamepadMolecule();
		trackMolecule(instance);

		expect(window.pendingFrameCount).toBe(0);

		mountMolecule(instance);
		expect(instance.isActive.value).toBe(true);
		expect(window.pendingFrameCount).toBe(1);

		unmountMolecule(instance);
		expect(instance.isActive.value).toBe(false);
		expect(window.pendingFrameCount).toBe(0);
	});
});
