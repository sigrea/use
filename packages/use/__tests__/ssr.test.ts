// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

describe("SSR safety", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.computedAsync).toBe("function");
		expect(typeof mod.computedEager).toBe("function");
		expect(typeof mod.computedWithControl).toBe("function");
		expect(typeof mod.createEventHook).toBe("function");
		expect(typeof mod.createSignal).toBe("function");
		expect(typeof mod.createResolveValueFn).toBe("function");
		expect(typeof mod.extendSignal).toBe("function");
		expect(typeof mod.isDefined).toBe("function");
		expect(typeof mod.makeDestructurable).toBe("function");
		expect(typeof mod.resolveValue).toBe("function");
		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.onClickOutside).toBe("function");
		expect(typeof mod.onElementRemoval).toBe("function");
		expect(typeof mod.onKeyDown).toBe("function");
		expect(typeof mod.onKeyPressed).toBe("function");
		expect(typeof mod.onKeyStroke).toBe("function");
		expect(typeof mod.onKeyUp).toBe("function");
		expect(typeof mod.onLongPress).toBe("function");
		expect(typeof mod.onStartTyping).toBe("function");
		expect(typeof mod.reactify).toBe("function");
		expect(typeof mod.reactifyObject).toBe("function");
		expect(typeof mod.reactiveComputed).toBe("function");
		expect(typeof mod.reactiveOmit).toBe("function");
		expect(typeof mod.reactivePick).toBe("function");
		expect(typeof mod.signalAutoReset).toBe("function");
		expect(typeof mod.signalDefault).toBe("function");
		expect(typeof mod.signalDebounced).toBe("function");
		expect(typeof mod.signalManualReset).toBe("function");
		expect(typeof mod.signalThrottled).toBe("function");
		expect(typeof mod.syncSignal).toBe("function");
		expect(typeof mod.syncSignals).toBe("function");
		expect(typeof mod.toDeepSignal).toBe("function");
		expect(typeof mod.tryOnScopeDispose).toBe("function");
		expect(typeof mod.until).toBe("function");
		expect(typeof mod.useActiveElement).toBe("function");
		expect(typeof mod.useAnimate).toBe("function");
		expect(typeof mod.useArrayDifference).toBe("function");
		expect(typeof mod.useArrayEvery).toBe("function");
		expect(typeof mod.useArrayFilter).toBe("function");
		expect(typeof mod.useArrayFind).toBe("function");
		expect(typeof mod.useArrayFindIndex).toBe("function");
		expect(typeof mod.useBreakpoints).toBe("function");
		expect(typeof mod.useDocumentVisibility).toBe("function");
		expect(typeof mod.useElementSize).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useFocus).toBe("function");
		expect(typeof mod.useInterval).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useLocalStorage).toBe("function");
		expect(typeof mod.useManualRefHistory).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useMouse).toBe("function");
		expect(typeof mod.useOnline).toBe("function");
		expect(typeof mod.usePreferredDark).toBe("function");
		expect(typeof mod.usePrevious).toBe("function");
		expect(typeof mod.useRefHistory).toBe("function");
		expect(typeof mod.useSessionStorage).toBe("function");
		expect(typeof mod.useStorage).toBe("function");
		expect(typeof mod.useTimeout).toBe("function");
		expect(typeof mod.useTimeoutFn).toBe("function");
		expect(typeof mod.useToggle).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
	});

	it("creates browser composables without a window", async () => {
		const {
			onClickOutside,
			useBreakpoints,
			useDocumentVisibility,
			useElementSize,
			useEventListener,
			useFocus,
			useLocalStorage,
			useMediaQuery,
			useMouse,
			useOnline,
			usePreferredDark,
			onElementRemoval,
			onKeyDown,
			onKeyPressed,
			onKeyStroke,
			onKeyUp,
			onLongPress,
			onStartTyping,
			useSessionStorage,
			useStorage,
			useWindowSize,
			useActiveElement,
			useAnimate,
		} = await import("../../../index");

		const active = useActiveElement();
		const animation = useAnimate(null, null);
		const breakpoints = useBreakpoints({ md: 768 }, { ssrWidth: 800 });
		const visibility = useDocumentVisibility();
		const listener = useEventListener("resize", () => {});
		const localStorageValue = useLocalStorage("local", "fallback", {
			window: undefined,
		});
		const outside = onClickOutside(null, () => {});
		const removal = onElementRemoval(null, () => {});
		const keyStroke = onKeyStroke("Escape", () => {});
		const keyDown = onKeyDown("Escape", () => {});
		const keyPressed = onKeyPressed("Enter", () => {});
		const keyUp = onKeyUp("Shift", () => {});
		const longPress = onLongPress(null, () => {});
		const startTyping = onStartTyping(() => {});
		const focus = useFocus(null);
		const mouse = useMouse();
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const online = useOnline();
		const preferredDark = usePreferredDark();
		const sessionStorageValue = useSessionStorage("session", "fallback", {
			window: undefined,
		});
		const ssrMediaQuery = useMediaQuery("(min-width: 640px)", {
			ssrWidth: 800,
		});
		const storageValue = useStorage("storage", "fallback", undefined, {
			window: undefined,
		});
		const elementSize = useElementSize(null, { width: 10, height: 20 });
		const size = useWindowSize();

		expect(active.activeElement.value).toBeUndefined();
		expect(animation.isSupported.value).toBe(false);
		expect(animation.animate.value).toBeUndefined();
		expect(breakpoints.md.matches.value).toBe(true);
		expect(visibility.visibility.value).toBe("visible");
		expect(localStorageValue.value).toBe("fallback");
		expect(focus.focused.value).toBe(false);
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);
		expect(mediaQuery.matches.value).toBe(false);
		expect(online.isOnline.value).toBe(true);
		expect(preferredDark.matches.value).toBe(false);
		expect(sessionStorageValue.value).toBe("fallback");
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(storageValue.value).toBe("fallback");
		expect(elementSize.width.value).toBe(10);
		expect(elementSize.height.value).toBe(20);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		active.stop();
		animation.play();
		animation.pause();
		animation.reverse();
		animation.finish();
		animation.cancel();
		animation.stop();
		breakpoints.md.stop();
		visibility.stop();
		listener.stop();
		localStorageValue.stop();
		outside();
		removal();
		keyStroke();
		keyDown();
		keyPressed();
		keyUp();
		longPress();
		startTyping();
		focus.stop();
		mouse.stop();
		mediaQuery.stop();
		online.stop();
		preferredDark.stop();
		sessionStorageValue.stop();
		ssrMediaQuery.stop();
		storageValue.stop();
		elementSize.stop();
		size.stop();
	});

	it("creates computedAsync without a window", async () => {
		const { computedAsync } = await import("../../../index");
		const value = computedAsync(async () => "ready", "initial");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	});

	it("creates computedEager without a window", async () => {
		const { computedEager } = await import("../../../index");
		const value = computedEager(() => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});

	it("creates computedWithControl without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { computedWithControl } = await import("../../../index");
		const source = signal(0);
		const value = computedWithControl(source, () => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});

	it("creates useArrayDifference without a window", async () => {
		const { useArrayDifference } = await import("../../../index");
		const result = useArrayDifference([1, 2, 3], [2]);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([1, 3]);
	});

	it("creates useArrayEvery without a window", async () => {
		const { useArrayEvery } = await import("../../../index");
		const result = useArrayEvery([1, 2, 3], (value) => value > 0);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(true);
	});

	it("creates useArrayFilter without a window", async () => {
		const { useArrayFilter } = await import("../../../index");
		const result = useArrayFilter([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([2, 3]);
	});

	it("creates useArrayFind without a window", async () => {
		const { useArrayFind } = await import("../../../index");
		const result = useArrayFind([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(2);
	});

	it("creates useArrayFindIndex without a window", async () => {
		const { useArrayFindIndex } = await import("../../../index");
		const result = useArrayFindIndex([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(1);
	});

	it("creates event hooks without a window", async () => {
		const { createEventHook } = await import("../../../index");
		const hook = createEventHook<string>();
		const calls: string[] = [];

		hook.on((value) => calls.push(value));
		await hook.trigger("ready");

		expect(globalThis.window).toBeUndefined();
		expect(calls).toEqual(["ready"]);
	});

	it("creates signals without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const {
			createSignal,
			signalAutoReset,
			signalDefault,
			signalDebounced,
			signalManualReset,
			signalThrottled,
			syncSignal,
			syncSignals,
		} = await import("../../../index");
		const value = createSignal("ready");
		const autoResetValue = signalAutoReset("default", 100);
		const defaultValue = signalDefault(signal<string | undefined>(), "default");
		const debouncedValue = signalDebounced(signal("source"), 100);
		const manualResetValue = signalManualReset("manual");
		const throttledValue = signalThrottled(signal("source"), 100);
		const left = signal("left");
		const right = signal("right");
		const stopSync = syncSignal(left, right);
		const source = signal("source");
		const target = signal("target");
		const stopSyncSignals = syncSignals(source, target);

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
		expect(autoResetValue.value).toBe("default");
		expect(defaultValue.value).toBe("default");
		expect(debouncedValue.value).toBe("source");
		expect(manualResetValue.value).toBe("manual");
		expect(throttledValue.value).toBe("source");
		expect(right.value).toBe("left");
		expect(target.value).toBe("source");

		stopSync();
		stopSyncSignals();
	});

	it("extends signals without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { extendSignal } = await import("../../../index");
		const source = signal("ready");
		const extra = signal("extra");
		const extended = extendSignal(source, { extra });

		expect(globalThis.window).toBeUndefined();
		expect(extended.value).toBe("ready");
		expect(extended.extra).toBe("extra");
	});

	it("creates value-resolving functions without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { createResolveValueFn } = await import("../../../index");
		const value = signal("ready");
		const resolveValueFn = createResolveValueFn((input: string) => input);

		expect(globalThis.window).toBeUndefined();
		expect(resolveValueFn(value)).toBe("ready");
	});

	it("creates reactified functions without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { reactify } = await import("../../../index");
		const value = signal("ready");
		const result = reactify((input: string) => input)(value);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe("ready");
	});

	it("creates reactified objects without a window", async () => {
		const { reactifyObject } = await import("../../../index");
		const result = reactifyObject({
			double(value: number) {
				return value * 2;
			},
		});

		expect(globalThis.window).toBeUndefined();
		expect(result.double(2).value).toBe(4);
	});

	it("creates reactive computed objects without a window", async () => {
		const { reactiveComputed } = await import("../../../index");
		const state = reactiveComputed(() => ({ ready: true }));

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates reactive omitted objects without a window", async () => {
		const { reactiveOmit } = await import("../../../index");
		const state = reactiveOmit({ ready: true, hidden: false }, "hidden");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates reactive picked objects without a window", async () => {
		const { reactivePick } = await import("../../../index");
		const state = reactivePick({ ready: true, hidden: false }, "ready");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates deep signal objects without a window", async () => {
		const { toDeepSignal } = await import("../../../index");
		const state = toDeepSignal({ ready: true });

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("tries scoped cleanup without a window", async () => {
		const { tryOnScopeDispose } = await import("../../../index");

		expect(globalThis.window).toBeUndefined();
		expect(tryOnScopeDispose(() => {})).toBe(false);
	});

	it("waits for values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { until } = await import("../../../index");
		const source = signal("ready");

		expect(globalThis.window).toBeUndefined();
		await expect(until(source).toBe("ready")).resolves.toBe("ready");
	});

	it("resolves values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { resolveValue } = await import("../../../index");
		const value = signal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(resolveValue(value)).toBe("ready");
	});

	it("checks defined values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { isDefined } = await import("../../../index");
		const value = signal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(isDefined(value)).toBe(true);
		expect(isDefined(undefined)).toBe(false);
	});

	it("creates destructurable values without a window", async () => {
		const { makeDestructurable } = await import("../../../index");
		const result = makeDestructurable({ count: 1 }, [1]);
		const { count } = result;
		const [first] = result;

		expect(globalThis.window).toBeUndefined();
		expect(count).toBe(1);
		expect(first).toBe(1);
	});

	it("auto-starts timers when timer APIs are available without a browser window", async () => {
		vi.useFakeTimers();
		const { useInterval, useTimeout } = await import("../../../index");
		const interval = useInterval(1, { controls: true });
		const timeout = useTimeout(1, { controls: true });

		expect(globalThis.window).toBeUndefined();
		expect(interval.isActive.value).toBe(true);
		expect(interval.counter.value).toBe(0);
		expect(timeout.isPending.value).toBe(true);
		expect(timeout.ready.value).toBe(false);

		vi.advanceTimersByTime(1);

		expect(interval.counter.value).toBe(1);
		expect(timeout.ready.value).toBe(true);
		expect(timeout.isPending.value).toBe(false);

		interval.pause();
		timeout.stop();
	});
});
