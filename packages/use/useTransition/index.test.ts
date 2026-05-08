// @vitest-environment node

import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { UseTransitionWindowLike } from "../types";
import { transition, useTransition } from "./index";

class FakeFrameWindow extends EventTarget implements UseTransitionWindowLike {
	private frameId = 0;
	private readonly frames = new Map<number, FrameRequestCallback>();

	requestAnimationFrame(callback: FrameRequestCallback): number {
		this.frameId += 1;
		this.frames.set(this.frameId, callback);
		return this.frameId;
	}

	flushNextFrame(): void {
		const next = this.frames.entries().next().value as
			| [number, FrameRequestCallback]
			| undefined;
		if (next === undefined) {
			return;
		}

		const [handle, callback] = next;
		this.frames.delete(handle);
		callback(Date.now());
	}
}

function expectBetween(value: number, floor: number, ceiling: number): void {
	expect(value).toBeGreaterThan(floor);
	expect(value).toBeLessThan(ceiling);
}

async function flushMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
}

describe("transition", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("transitions between numbers and vectors", async () => {
		const frameWindow = new FakeFrameWindow();
		const number = signal(0);
		const numberTransition = transition(number, 0, 1, {
			duration: 100,
			window: frameWindow,
		});

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(number.value, 0, 1);

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await numberTransition;
		expect(number.value).toBe(1);

		const vector = signal([0, 0]);
		const vectorTransition = transition(vector, [0, 1], [1, 2], {
			duration: 100,
			window: frameWindow,
		});

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(vector.value[0], 0, 1);
		expectBetween(vector.value[1], 1, 2);

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await vectorTransition;
		expect(vector.value).toEqual([1, 2]);
	});

	it("can be aborted and does not stay pending without requestAnimationFrame", async () => {
		const frameWindow = new FakeFrameWindow();
		const aborted = signal(0);
		let shouldAbort = false;
		const abortedTransition = transition(aborted, 0, 1, {
			abort: () => shouldAbort,
			duration: 100,
			window: frameWindow,
		});

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		shouldAbort = true;
		frameWindow.flushNextFrame();
		await abortedTransition;
		expectBetween(aborted.value, 0, 1);

		const withoutFrame = signal(0);
		await transition(withoutFrame, 0, 1, { duration: 100, window: null });
		expect(withoutFrame.value).toBe(1);
	});
});

describe("useTransition", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(0);
	});

	afterEach(() => {
		disposeTrackedMolecules();
		vi.useRealTimers();
	});

	it("transitions numbers, arrays, and tuple sources", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal(0);
		const number = useTransition(source, {
			duration: 100,
			window: frameWindow,
		});

		source.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(number.value, 0, 1);

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await flushMicrotasks();
		expect(number.value).toBe(1);

		const vectorSource = signal([0, 0]);
		const vector = useTransition(vectorSource, {
			duration: 100,
			window: frameWindow,
		});
		vectorSource.value = [1, 1];
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(vector.value[0], 0, 1);
		expectBetween(vector.value[1], 0, 1);

		const first = signal(0);
		const second = signal(0);
		const tuple = useTransition([first, second], {
			duration: 100,
			window: frameWindow,
		});
		first.value = 1;
		second.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		frameWindow.flushNextFrame();
		expectBetween(tuple.value[0], 0, 1);
		expectBetween(tuple.value[1], 0, 1);
	});

	it("supports cubic bezier and custom easing", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal(0);
		const cubic = useTransition(source, {
			duration: 100,
			easing: [0, 2, 0, 1],
			window: frameWindow,
		});
		const easing = vi.fn((value: number) => value * value);
		const custom = useTransition(source, {
			duration: 100,
			easing,
			window: frameWindow,
		});
		const wrappedEasing = vi.fn((value: number) => value);
		const wrapped = useTransition(source, {
			duration: 100,
			easing: signal(wrappedEasing),
			window: frameWindow,
		});

		source.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		frameWindow.flushNextFrame();
		frameWindow.flushNextFrame();

		expectBetween(cubic.value, 1, 2);
		expect(easing).toHaveBeenCalled();
		expectBetween(custom.value, 0, 1);
		expect(wrappedEasing).toHaveBeenCalled();
		expectBetween(wrapped.value, 0, 1);
	});

	it("supports delay, disabled, and callbacks", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal(0);
		const disabled = signal(false);
		const onStarted = vi.fn();
		const onFinished = vi.fn();
		const value = useTransition(source, {
			delay: 100,
			disabled,
			duration: 100,
			onFinished,
			onStarted,
			window: frameWindow,
		});

		source.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		await flushMicrotasks();
		expect(value.value).toBe(0);
		expect(onStarted).not.toHaveBeenCalled();

		vi.advanceTimersByTime(50);
		await flushMicrotasks();
		expect(onStarted).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(value.value, 0, 1);

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await flushMicrotasks();
		expect(value.value).toBe(1);
		expect(onFinished).toHaveBeenCalledTimes(1);

		onStarted.mockClear();
		disabled.value = true;
		source.value = 2;
		await flushMicrotasks();
		expect(value.value).toBe(2);
		disabled.value = false;
		await flushMicrotasks();
		expect(value.value).toBe(2);
		vi.advanceTimersByTime(150);
		expect(onStarted).not.toHaveBeenCalled();
	});

	it("does not call onFinished after a manual abort", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal(0);
		const onFinished = vi.fn();
		let shouldAbort = false;
		const value = useTransition(source, {
			abort: () => shouldAbort,
			duration: 100,
			onFinished,
			window: frameWindow,
		});

		source.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		expectBetween(value.value, 0, 1);

		shouldAbort = true;
		frameWindow.flushNextFrame();
		await flushMicrotasks();

		expectBetween(value.value, 0, 1);
		expect(onFinished).not.toHaveBeenCalled();

		shouldAbort = false;
		source.value = 2;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await flushMicrotasks();

		expect(value.value).toBe(2);
		expect(onFinished).toHaveBeenCalledOnce();
	});

	it("starts a new transition from the interrupted value", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal(0);
		const onFinished = vi.fn();
		const value = useTransition(source, {
			duration: 100,
			onFinished,
			window: frameWindow,
		});

		source.value = 1;
		await flushMicrotasks();
		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();

		source.value = 0;
		await flushMicrotasks();
		vi.advanceTimersByTime(25);
		frameWindow.flushNextFrame();
		frameWindow.flushNextFrame();

		expectBetween(value.value, 0, 0.5);

		vi.advanceTimersByTime(75);
		frameWindow.flushNextFrame();
		await flushMicrotasks();

		expect(value.value).toBe(0);
		expect(onFinished).toHaveBeenCalledOnce();
	});

	it("supports custom interpolation functions", async () => {
		const frameWindow = new FakeFrameWindow();
		const source = signal("");
		const interpolation = vi.fn((_from: string, _to: string, alpha: number) =>
			alpha < 0.5 ? "foo" : "bar",
		);
		const value = useTransition(source, {
			duration: 100,
			interpolation,
			window: frameWindow,
		});

		source.value = "test";
		await flushMicrotasks();
		vi.advanceTimersByTime(25);
		frameWindow.flushNextFrame();
		expect(interpolation).toHaveBeenCalled();
		expect(value.value).toBe("foo");

		vi.advanceTimersByTime(25);
		frameWindow.flushNextFrame();
		expect(value.value).toBe("bar");

		vi.advanceTimersByTime(50);
		frameWindow.flushNextFrame();
		await flushMicrotasks();
		expect(value.value).toBe("test");
	});
});
