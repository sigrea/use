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

import type { UseFpsPerformanceLike, UseFpsWindowLike } from "../types";
import { useFps } from "./index";

class FakePerformance implements UseFpsPerformanceLike {
	private currentTime = 0;
	readonly now = vi.fn(() => this.currentTime);

	advance(ms: number): void {
		this.currentTime += ms;
	}
}

class FakeFrameWindow extends EventTarget implements UseFpsWindowLike {
	constructor(
		readonly performance = new FakePerformance(),
		private readonly retainCanceledFrames = false,
	) {
		super();
	}

	private frameId = 0;
	private readonly frames = new Map<number, FrameRequestCallback>();
	readonly cancelAnimationFrame = vi.fn((handle: number) => {
		if (!this.retainCanceledFrames) {
			this.frames.delete(handle);
		}
	});
	readonly requestAnimationFrame = vi.fn(
		(callback: FrameRequestCallback): number => {
			const handle = ++this.frameId;
			this.frames.set(handle, callback);
			return handle;
		},
	);

	flushFrame(ms: number): void {
		this.performance.advance(ms);
		for (const [handle, callback] of [...this.frames.entries()]) {
			if (!this.frames.delete(handle)) {
				continue;
			}
			callback(this.performance.now());
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

describe("useFps", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("updates FPS every ten frames by default", () => {
		const frameWindow = new FakeFrameWindow();
		const fps = useFps({ window: frameWindow });

		expect(fps.value).toBe(0);
		expect(frameWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);

		for (let frame = 0; frame < 9; frame += 1) {
			frameWindow.flushFrame(100);
		}
		expect(fps.value).toBe(0);

		frameWindow.flushFrame(100);
		expect(fps.value).toBe(10);
		expect(frameWindow.pendingFrameCount).toBe(1);
	});

	it("accepts MaybeValue every and falls back to the default for unsafe values", () => {
		const frameWindow = new FakeFrameWindow();
		const every = signal(2);
		const fps = useFps({ every, window: frameWindow });

		frameWindow.flushFrame(10);
		expect(fps.value).toBe(0);

		frameWindow.flushFrame(10);
		expect(fps.value).toBe(100);

		every.value = 0;
		for (let frame = 0; frame < 9; frame += 1) {
			frameWindow.flushFrame(20);
		}
		expect(fps.value).toBe(100);
		frameWindow.flushFrame(20);
		expect(fps.value).toBe(50);

		every.value = Number.POSITIVE_INFINITY;
		for (let frame = 0; frame < 9; frame += 1) {
			frameWindow.flushFrame(25);
		}
		expect(fps.value).toBe(50);
		frameWindow.flushFrame(25);
		expect(fps.value).toBe(40);
	});

	it("uses the window performance target", () => {
		const performance = new FakePerformance();
		const frameWindow = new FakeFrameWindow(performance);
		const fps = useFps({
			every: 1,
			window: frameWindow,
		});

		performance.advance(50);
		frameWindow.flushFrame(0);

		expect(fps.value).toBe(20);
	});

	it("does not use global RAF when window is null", () => {
		const requestAnimationFrame = vi.fn();
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

		const fps = useFps({
			every: 1,
			window: null,
		});

		expect(fps.value).toBe(0);
		expect(requestAnimationFrame).not.toHaveBeenCalled();
	});

	it("starts tracking when reactive window becomes available", () => {
		const frameWindow = new FakeFrameWindow();
		const windowTarget = signal<UseFpsWindowLike | null>(null);
		const fps = useFps({ every: 1, window: windowTarget });

		expect(fps.value).toBe(0);
		expect(frameWindow.requestAnimationFrame).not.toHaveBeenCalled();

		windowTarget.value = frameWindow;

		expect(frameWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);

		frameWindow.flushFrame(100);

		expect(fps.value).toBe(10);
		expect(frameWindow.pendingFrameCount).toBe(1);
	});

	it("cancels the pending frame when reactive window changes", () => {
		const firstWindow = new FakeFrameWindow();
		const secondWindow = new FakeFrameWindow();
		const windowTarget = signal<UseFpsWindowLike | null>(firstWindow);
		const fps = useFps({ every: 1, window: windowTarget });

		expect(firstWindow.pendingFrameCount).toBe(1);

		windowTarget.value = secondWindow;

		expect(firstWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(firstWindow.pendingFrameCount).toBe(0);
		expect(secondWindow.pendingFrameCount).toBe(1);

		firstWindow.flushFrame(100);

		expect(fps.value).toBe(0);
		expect(firstWindow.pendingFrameCount).toBe(0);

		secondWindow.flushFrame(100);

		expect(fps.value).toBe(10);
	});

	it("ignores stale frame callbacks after reactive window changes", () => {
		const firstWindow = new FakeFrameWindow(new FakePerformance(), true);
		const secondWindow = new FakeFrameWindow();
		const windowTarget = signal<UseFpsWindowLike | null>(firstWindow);
		const fps = useFps({ every: 1, window: windowTarget });

		expect(firstWindow.pendingFrameCount).toBe(1);

		windowTarget.value = secondWindow;

		expect(firstWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(secondWindow.pendingFrameCount).toBe(1);

		firstWindow.flushFrame(100);

		expect(fps.value).toBe(0);
		expect(secondWindow.pendingFrameCount).toBe(1);

		windowTarget.value = null;

		expect(secondWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(secondWindow.pendingFrameCount).toBe(0);
	});

	it("stays at zero when RAF or performance is unavailable", () => {
		const noRafWindow = Object.assign(new EventTarget(), {
			performance: new FakePerformance(),
		}) as UseFpsWindowLike;
		const withoutRaf = useFps({ window: noRafWindow });
		const frameWindow = new FakeFrameWindow();
		Object.defineProperty(frameWindow, "performance", {
			value: undefined,
		});
		const withoutPerformance = useFps({ window: frameWindow });

		expect(withoutRaf.value).toBe(0);
		expect(withoutPerformance.value).toBe(0);
		expect(frameWindow.requestAnimationFrame).not.toHaveBeenCalled();
	});

	it("starts on molecule mount and cancels the pending frame on unmount", () => {
		const frameWindow = new FakeFrameWindow();
		const FpsMolecule = molecule(() =>
			useFps({ every: 1, window: frameWindow }),
		);
		const instance = FpsMolecule();
		trackMolecule(instance);

		expect(frameWindow.pendingFrameCount).toBe(0);

		mountMolecule(instance);
		expect(frameWindow.pendingFrameCount).toBe(1);

		unmountMolecule(instance);
		expect(frameWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(frameWindow.pendingFrameCount).toBe(0);
	});
});
