import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTimeout } from "./index";

describe("useTimeout", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a ready signal that flips after the timeout", () => {
		vi.useFakeTimers();
		const ready = useTimeout(10);

		expect(ready.value).toBe(false);

		vi.advanceTimersByTime(9);
		expect(ready.value).toBe(false);

		vi.advanceTimersByTime(1);
		expect(ready.value).toBe(true);
	});

	it("uses a 1000ms timeout by default", () => {
		vi.useFakeTimers();
		const ready = useTimeout();

		expect(ready.value).toBe(false);

		vi.advanceTimersByTime(999);
		expect(ready.value).toBe(false);

		vi.advanceTimersByTime(1);
		expect(ready.value).toBe(true);
	});

	it("exposes controls when requested", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const timeout = useTimeout(20, {
			callback,
			controls: true,
			immediate: false,
		});

		expect(timeout.ready.value).toBe(true);
		expect(timeout.isPending.value).toBe(false);

		timeout.start();
		expect(timeout.ready.value).toBe(false);
		expect(timeout.isPending.value).toBe(true);

		timeout.stop();
		expect(timeout.ready.value).toBe(true);
		expect(timeout.isPending.value).toBe(false);

		vi.advanceTimersByTime(20);
		expect(callback).not.toHaveBeenCalled();

		timeout.start();
		vi.advanceTimersByTime(20);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(timeout.ready.value).toBe(true);
		expect(timeout.isPending.value).toBe(false);
	});

	it("reads reactive durations when starting", () => {
		vi.useFakeTimers();
		const duration = signal(20);
		const timeout = useTimeout(duration, {
			controls: true,
			immediate: false,
		});

		duration.value = 5;
		timeout.start();

		vi.advanceTimersByTime(4);
		expect(timeout.ready.value).toBe(false);

		vi.advanceTimersByTime(1);
		expect(timeout.ready.value).toBe(true);
	});
});
