// @vitest-environment node

import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseMemoryInfo,
	UseMemoryPerformanceLike,
	UseMemoryWindowLike,
} from "../types";
import { useMemory } from "./index";

class FakeMemoryWindow extends EventTarget implements UseMemoryWindowLike {
	constructor(readonly performance?: UseMemoryPerformanceLike) {
		super();
	}
}

function createMemory(
	usedJSHeapSize: number,
	totalJSHeapSize = 200,
	jsHeapSizeLimit = 1000,
): UseMemoryInfo {
	return {
		jsHeapSizeLimit,
		totalJSHeapSize,
		usedJSHeapSize,
	};
}

describe("useMemory", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("reports unsupported when performance memory is unavailable", () => {
		const result = useMemory({ window: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.memory.value).toBeUndefined();
		expect(result.isActive.value).toBe(false);

		result.resume();

		expect(result.isActive.value).toBe(false);
	});

	it("starts polling immediately and refreshes memory on an interval", () => {
		vi.useFakeTimers();
		const performance: UseMemoryPerformanceLike = {
			memory: createMemory(100),
		};
		const result = useMemory({
			interval: 500,
			window: new FakeMemoryWindow(performance),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.isActive.value).toBe(true);
		expect(result.memory.value).toBeUndefined();

		vi.advanceTimersByTime(500);

		expect(result.memory.value).toEqual({
			jsHeapSizeLimit: 1000,
			totalJSHeapSize: 200,
			usedJSHeapSize: 100,
		});

		performance.memory = createMemory(150, 300, 1200);
		vi.advanceTimersByTime(500);

		expect(result.memory.value).toEqual({
			jsHeapSizeLimit: 1200,
			totalJSHeapSize: 300,
			usedJSHeapSize: 150,
		});
	});

	it("does not start until resumed when immediate is false", () => {
		vi.useFakeTimers();
		const performance: UseMemoryPerformanceLike = {
			memory: createMemory(100),
		};
		const result = useMemory({
			immediate: false,
			immediateCallback: true,
			window: new FakeMemoryWindow(performance),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.isActive.value).toBe(false);
		expect(result.memory.value).toBeUndefined();

		result.resume();

		expect(result.isActive.value).toBe(true);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);

		result.pause();
		performance.memory = createMemory(200);
		vi.advanceTimersByTime(1000);

		expect(result.isActive.value).toBe(false);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);
	});

	it("clears memory and pauses when the target becomes unsupported", () => {
		vi.useFakeTimers();
		const supported = new FakeMemoryWindow({
			memory: createMemory(100),
		});
		const unsupported = new FakeMemoryWindow();
		const target = signal<UseMemoryWindowLike | null>(supported);
		const result = useMemory({ window: target });

		expect(result.isSupported.value).toBe(true);
		vi.advanceTimersByTime(1000);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);
		expect(result.isActive.value).toBe(true);

		target.value = unsupported;

		expect(result.isSupported.value).toBe(false);
		expect(result.memory.value).toBeUndefined();
		expect(result.isActive.value).toBe(false);
	});

	it("keeps a manual pause when the target changes", () => {
		vi.useFakeTimers();
		const first = new FakeMemoryWindow({
			memory: createMemory(100),
		});
		const second = new FakeMemoryWindow({
			memory: createMemory(200),
		});
		const target = signal<UseMemoryWindowLike | null>(first);
		const result = useMemory({ window: target });

		result.pause();
		target.value = second;
		vi.advanceTimersByTime(1000);

		expect(result.isSupported.value).toBe(true);
		expect(result.isActive.value).toBe(false);
		expect(result.memory.value).toBeUndefined();
	});

	it("clears stale memory when switching between supported targets", () => {
		vi.useFakeTimers();
		const first = new FakeMemoryWindow({
			memory: createMemory(100),
		});
		const second = new FakeMemoryWindow({
			memory: createMemory(200),
		});
		const target = signal<UseMemoryWindowLike | null>(first);
		const result = useMemory({ interval: 1000, window: target });

		vi.advanceTimersByTime(1000);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);

		target.value = second;

		expect(result.isSupported.value).toBe(true);
		expect(result.isActive.value).toBe(true);
		expect(result.memory.value).toBeUndefined();

		vi.advanceTimersByTime(1000);

		expect(result.memory.value?.usedJSHeapSize).toBe(200);
	});

	it("stops the interval permanently", () => {
		vi.useFakeTimers();
		const performance: UseMemoryPerformanceLike = {
			memory: createMemory(100),
		};
		const result = useMemory({
			interval: 100,
			window: new FakeMemoryWindow(performance),
		});

		vi.advanceTimersByTime(100);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);

		result.stop();
		performance.memory = createMemory(200);
		vi.advanceTimersByTime(100);
		result.resume();

		expect(result.isActive.value).toBe(false);
		expect(result.memory.value?.usedJSHeapSize).toBe(100);
	});
});
