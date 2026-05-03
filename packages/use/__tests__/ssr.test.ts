// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

describe("SSR safety", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.onClickOutside).toBe("function");
		expect(typeof mod.useBreakpoints).toBe("function");
		expect(typeof mod.useDocumentVisibility).toBe("function");
		expect(typeof mod.useElementSize).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useFocus).toBe("function");
		expect(typeof mod.useInterval).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useManualRefHistory).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useMouse).toBe("function");
		expect(typeof mod.useOnline).toBe("function");
		expect(typeof mod.usePreferredDark).toBe("function");
		expect(typeof mod.usePrevious).toBe("function");
		expect(typeof mod.useRefHistory).toBe("function");
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
			useMediaQuery,
			useMouse,
			useOnline,
			usePreferredDark,
			useWindowSize,
		} = await import("../../../index");

		const breakpoints = useBreakpoints({ md: 768 }, { ssrWidth: 800 });
		const visibility = useDocumentVisibility();
		const listener = useEventListener("resize", () => {});
		const outside = onClickOutside(null, () => {});
		const focus = useFocus(null);
		const mouse = useMouse();
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const online = useOnline();
		const preferredDark = usePreferredDark();
		const ssrMediaQuery = useMediaQuery("(min-width: 640px)", {
			ssrWidth: 800,
		});
		const elementSize = useElementSize(null, { width: 10, height: 20 });
		const size = useWindowSize();

		expect(breakpoints.md.matches.value).toBe(true);
		expect(visibility.visibility.value).toBe("visible");
		expect(focus.focused.value).toBe(false);
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);
		expect(mediaQuery.matches.value).toBe(false);
		expect(online.isOnline.value).toBe(true);
		expect(preferredDark.matches.value).toBe(false);
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(elementSize.width.value).toBe(10);
		expect(elementSize.height.value).toBe(20);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		breakpoints.md.stop();
		visibility.stop();
		listener.stop();
		outside();
		focus.stop();
		mouse.stop();
		mediaQuery.stop();
		online.stop();
		preferredDark.stop();
		ssrMediaQuery.stop();
		elementSize.stop();
		size.stop();
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
