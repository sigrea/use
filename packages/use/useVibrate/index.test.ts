import {
	createScope,
	disposeScope,
	readonly,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseIntervalFnReturn,
	UseVibrateNavigatorLike,
	UseVibrateOptions,
	UseVibratePattern,
} from "../types";
import { useVibrate } from "./index";

class ManualScheduler implements UseIntervalFnReturn {
	readonly active = signal(false);
	readonly isActive = readonly(this.active);

	constructor(readonly callback: () => void) {}

	pause(): void {
		this.active.value = false;
	}

	resume(): void {
		this.active.value = true;
	}

	trigger(): void {
		if (this.active.value) {
			this.callback();
		}
	}
}

function createNavigator(
	vibrate = vi.fn((_pattern: number | number[]) => true),
): UseVibrateNavigatorLike {
	return { vibrate };
}

function useFakeVibrate(
	options: UseVibrateOptions<UseVibrateNavigatorLike> = {},
) {
	return useVibrate<UseVibrateNavigatorLike>(options);
}

describe("useVibrate", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses fallback values without vibrate support", () => {
		const result = useVibrate({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.pattern.value).toEqual([]);
		expect(result.intervalControls).toBeUndefined();
		expect(() => result.vibrate()).not.toThrow();
		expect(() => result.stop()).not.toThrow();
	});

	it("uses an empty array as the default pattern", () => {
		const vibrate = vi.fn((_pattern: number | number[]) => true);
		const navigator = createNavigator(vibrate);
		const result = useFakeVibrate({ navigator });

		expect(result.pattern.value).toEqual([]);
		result.vibrate();
		const passedPattern = vibrate.mock.calls[0][0];
		expect(passedPattern).toEqual([]);
		expect(passedPattern).not.toBe(result.pattern.value);
	});

	it("uses the pattern signal when no argument is passed", () => {
		const navigator = createNavigator();
		const result = useFakeVibrate({ navigator });

		result.pattern.value = 120;

		result.vibrate();
		expect(navigator.vibrate).toHaveBeenCalledWith(120);
	});

	it("prefers the argument pattern and copies readonly arrays", () => {
		const vibrate = vi.fn((_pattern: number | number[]) => true);
		const navigator = createNavigator(vibrate);
		const result = useFakeVibrate({
			navigator,
			pattern: 500,
		});
		const readonlyPattern = [40, 80, 40] as const satisfies UseVibratePattern;

		result.vibrate(readonlyPattern);

		const passedPattern = vibrate.mock.calls[0][0];
		expect(passedPattern).toEqual([40, 80, 40]);
		expect(passedPattern).not.toBe(readonlyPattern);
	});

	it("stops vibration and pauses interval controls", () => {
		vi.useFakeTimers();
		const navigator = createNavigator();
		const result = useFakeVibrate({
			interval: 20,
			navigator,
			pattern: 100,
		});

		result.intervalControls?.resume();
		expect(result.intervalControls?.isActive.value).toBe(true);

		result.stop();

		expect(navigator.vibrate).toHaveBeenCalledWith(0);
		expect(result.intervalControls?.isActive.value).toBe(false);

		vi.advanceTimersByTime(40);
		expect(navigator.vibrate).toHaveBeenCalledOnce();
	});

	it("treats all-zero arrays as cancellation patterns", () => {
		const assertCancellationPattern = (cancelPattern: readonly number[]) => {
			const navigator = createNavigator();
			const target = signal<UseVibrateNavigatorLike | null>(navigator);
			const result = useFakeVibrate({
				navigator: target,
				pattern: 100,
			});

			result.vibrate();
			result.vibrate(cancelPattern);
			target.value = null;

			expect(navigator.vibrate).toHaveBeenNthCalledWith(1, 100);
			expect(navigator.vibrate).toHaveBeenNthCalledWith(2, 0);
			expect(navigator.vibrate).toHaveBeenCalledTimes(2);
		};

		assertCancellationPattern([0]);
		assertCancellationPattern([0, 0]);
	});

	it("repeats vibration when interval controls are resumed", () => {
		vi.useFakeTimers();
		const navigator = createNavigator();
		const result = useFakeVibrate({
			interval: 20,
			navigator,
			pattern: 100,
		});

		expect(result.intervalControls?.isActive.value).toBe(false);
		result.intervalControls?.resume();
		vi.advanceTimersByTime(60);

		expect(navigator.vibrate).toHaveBeenCalledTimes(3);
		expect(navigator.vibrate).toHaveBeenLastCalledWith(100);

		result.stop();
	});

	it("uses scheduler controls when a scheduler is provided", () => {
		const navigator = createNavigator();
		let controls!: ManualScheduler;
		const scheduler = vi.fn((callback: () => void) => {
			controls = new ManualScheduler(callback);
			return controls;
		});
		const result = useFakeVibrate({
			navigator,
			pattern: 75,
			scheduler,
		});

		expect(scheduler).toHaveBeenCalledOnce();
		expect(result.intervalControls).toBe(controls);

		controls.trigger();
		expect(navigator.vibrate).not.toHaveBeenCalled();

		controls.resume();
		controls.trigger();
		expect(navigator.vibrate).toHaveBeenCalledWith(75);

		result.stop();
		expect(controls.isActive.value).toBe(false);
		expect(navigator.vibrate).toHaveBeenLastCalledWith(0);
	});

	it("updates support and call target when the navigator changes", () => {
		const firstNavigator = createNavigator();
		const secondNavigator = createNavigator(vi.fn(() => false));
		const navigator = signal<UseVibrateNavigatorLike | null>(firstNavigator);
		const result = useFakeVibrate({ navigator, pattern: 10 });

		expect(result.isSupported.value).toBe(true);
		result.vibrate();
		expect(firstNavigator.vibrate).toHaveBeenCalledWith(10);

		navigator.value = null;
		expect(result.isSupported.value).toBe(false);
		expect(firstNavigator.vibrate).toHaveBeenLastCalledWith(0);
		expect(firstNavigator.vibrate).toHaveBeenCalledTimes(2);
		result.vibrate(20);
		expect(firstNavigator.vibrate).toHaveBeenCalledTimes(2);

		navigator.value = secondNavigator;
		expect(result.isSupported.value).toBe(true);
		result.vibrate(30);
		expect(secondNavigator.vibrate).toHaveBeenCalledWith(30);

		result.stop();
		expect(secondNavigator.vibrate).toHaveBeenLastCalledWith(0);
	});

	it("tracks an external pattern source", () => {
		const navigator = createNavigator();
		const pattern = signal<UseVibratePattern>(10);
		const result = useFakeVibrate({ navigator, pattern });

		pattern.value = [20, 30] as const;

		expect(result.pattern.value).toEqual([20, 30]);
		result.vibrate();
		expect(navigator.vibrate).toHaveBeenCalledWith([20, 30]);
	});

	it("stops when the scope is disposed", () => {
		vi.useFakeTimers();
		const navigator = createNavigator();
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useFakeVibrate({
				interval: 20,
				navigator,
				pattern: 100,
			}),
		);

		result.intervalControls?.resume();
		disposeScope(scope);

		expect(navigator.vibrate).toHaveBeenCalledWith(0);
		expect(result.intervalControls?.isActive.value).toBe(false);

		vi.advanceTimersByTime(40);
		expect(navigator.vibrate).toHaveBeenCalledOnce();
	});
});
