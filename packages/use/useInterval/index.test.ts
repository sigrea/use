import { afterEach, describe, expect, it, vi } from "vitest";

import { useInterval } from "./index";

describe("useInterval", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns a counter signal that increments on the default interval", () => {
		vi.useFakeTimers();
		const counter = useInterval();

		expect(counter.value).toBe(0);

		vi.advanceTimersByTime(999);
		expect(counter.value).toBe(0);

		vi.advanceTimersByTime(1);
		expect(counter.value).toBe(1);
	});

	it("exposes controls when requested", () => {
		vi.useFakeTimers();
		const interval = useInterval(10, {
			controls: true,
			immediate: false,
		});

		expect(interval.counter.value).toBe(0);
		expect(interval.isActive.value).toBe(false);

		interval.resume();
		expect(interval.isActive.value).toBe(true);

		vi.advanceTimersByTime(30);
		expect(interval.counter.value).toBe(3);

		interval.pause();
		vi.advanceTimersByTime(30);
		expect(interval.counter.value).toBe(3);

		interval.reset();
		expect(interval.counter.value).toBe(0);
	});

	it("passes the incremented count to the callback", () => {
		vi.useFakeTimers();
		const callback = vi.fn();
		const interval = useInterval(10, {
			callback,
			controls: true,
			immediate: true,
		});

		vi.advanceTimersByTime(30);

		expect(callback).toHaveBeenNthCalledWith(1, 1);
		expect(callback).toHaveBeenNthCalledWith(2, 2);
		expect(callback).toHaveBeenNthCalledWith(3, 3);
		expect(interval.counter.value).toBe(3);
	});
});
