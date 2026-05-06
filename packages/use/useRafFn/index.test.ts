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

import type { UseRafFnWindowLike } from "../types";
import { useRafFn } from "./index";

class FakeFrameWindow extends EventTarget implements UseRafFnWindowLike {
	private currentTime = 0;
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

	flushFrame(ms: number): void {
		this.currentTime += ms;
		for (const [handle, callback] of [...this.frames.entries()]) {
			if (!this.frames.delete(handle)) {
				continue;
			}
			callback(this.currentTime);
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

describe("useRafFn", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("runs the callback on animation frames with timestamp and delta", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const controls = useRafFn(callback, { window: frameWindow });

		expect(controls.isActive.value).toBe(true);
		expect(frameWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);

		frameWindow.flushFrame(10);
		expect(callback).toHaveBeenLastCalledWith({ delta: 0, timestamp: 10 });
		expect(frameWindow.pendingFrameCount).toBe(1);

		frameWindow.flushFrame(16);
		expect(callback).toHaveBeenLastCalledWith({ delta: 16, timestamp: 26 });

		controls.pause();
	});

	it("pauses and resumes the frame loop", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const controls = useRafFn(callback, {
			immediate: false,
			window: frameWindow,
		});

		expect(controls.isActive.value).toBe(false);
		expect(frameWindow.pendingFrameCount).toBe(0);

		controls.resume();
		controls.resume();
		expect(controls.isActive.value).toBe(true);
		expect(frameWindow.pendingFrameCount).toBe(1);

		controls.pause();
		expect(controls.isActive.value).toBe(false);
		expect(frameWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(frameWindow.pendingFrameCount).toBe(0);

		frameWindow.flushFrame(20);
		expect(callback).not.toHaveBeenCalled();

		controls.resume();
		frameWindow.flushFrame(30);
		expect(callback).toHaveBeenLastCalledWith({ delta: 0, timestamp: 50 });

		controls.pause();
	});

	it("stops after the first callback when once is true", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const controls = useRafFn(callback, {
			once: true,
			window: frameWindow,
		});

		frameWindow.flushFrame(16);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(controls.isActive.value).toBe(false);
		expect(frameWindow.pendingFrameCount).toBe(0);
	});

	it("limits callback frequency while fpsLimit is positive", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const fpsLimit = signal<number | null>(50);
		const controls = useRafFn(callback, {
			fpsLimit,
			window: frameWindow,
		});

		frameWindow.flushFrame(5);
		frameWindow.flushFrame(10);
		expect(callback).not.toHaveBeenCalled();

		frameWindow.flushFrame(10);
		expect(callback).toHaveBeenLastCalledWith({ delta: 20, timestamp: 25 });

		fpsLimit.value = null;
		frameWindow.flushFrame(1);
		expect(callback).toHaveBeenLastCalledWith({ delta: 1, timestamp: 26 });

		controls.pause();
	});

	it("treats unsafe fps limits as unlimited", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const controls = useRafFn(callback, {
			fpsLimit: 0,
			window: frameWindow,
		});

		frameWindow.flushFrame(1);

		expect(callback).toHaveBeenCalledTimes(1);

		controls.pause();
	});

	it("does not reschedule when the callback pauses the loop", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn(() => {
			controls.pause();
		});
		const controls = useRafFn(callback, { window: frameWindow });

		frameWindow.flushFrame(16);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(controls.isActive.value).toBe(false);
		expect(frameWindow.pendingFrameCount).toBe(0);
	});

	it("does not use global requestAnimationFrame when window is null", () => {
		const requestAnimationFrame = vi.fn();
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
		const callback = vi.fn();
		const controls = useRafFn(callback, { window: null });

		expect(controls.isActive.value).toBe(false);
		expect(requestAnimationFrame).not.toHaveBeenCalled();

		controls.resume();
		expect(requestAnimationFrame).not.toHaveBeenCalled();
		expect(callback).not.toHaveBeenCalled();
	});

	it("does not start when requestAnimationFrame is unavailable", () => {
		const callback = vi.fn();
		const controls = useRafFn(callback, {
			window: new EventTarget() as UseRafFnWindowLike,
		});

		expect(controls.isActive.value).toBe(false);
		expect(callback).not.toHaveBeenCalled();
	});

	it("starts on molecule mount and cancels the pending frame on unmount", () => {
		const frameWindow = new FakeFrameWindow();
		const callback = vi.fn();
		const RafMolecule = molecule(() =>
			useRafFn(callback, { window: frameWindow }),
		);
		const instance = RafMolecule();
		trackMolecule(instance);

		expect(frameWindow.pendingFrameCount).toBe(0);
		expect(instance.isActive.value).toBe(false);

		mountMolecule(instance);
		expect(instance.isActive.value).toBe(true);
		expect(frameWindow.pendingFrameCount).toBe(1);

		unmountMolecule(instance);
		expect(instance.isActive.value).toBe(false);
		expect(frameWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(frameWindow.pendingFrameCount).toBe(0);
	});
});
