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
		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.onClickOutside).toBe("function");
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
			useSessionStorage,
			useStorage,
			useWindowSize,
		} = await import("../../../index");

		const breakpoints = useBreakpoints({ md: 768 }, { ssrWidth: 800 });
		const visibility = useDocumentVisibility();
		const listener = useEventListener("resize", () => {});
		const localStorageValue = useLocalStorage("local", "fallback", {
			window: undefined,
		});
		const outside = onClickOutside(null, () => {});
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

		breakpoints.md.stop();
		visibility.stop();
		listener.stop();
		localStorageValue.stop();
		outside();
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
		const { createSignal } = await import("../../../index");
		const value = createSignal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
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
