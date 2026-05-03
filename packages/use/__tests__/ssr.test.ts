// @vitest-environment node

import { describe, expect, it } from "vitest";

describe("SSR safety", () => {
	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.onClickOutside).toBe("function");
		expect(typeof mod.useElementSize).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useFocus).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useMouse).toBe("function");
		expect(typeof mod.useTimeoutFn).toBe("function");
		expect(typeof mod.useToggle).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
	});

	it("creates browser composables without a window", async () => {
		const {
			onClickOutside,
			useElementSize,
			useEventListener,
			useFocus,
			useMediaQuery,
			useMouse,
			useWindowSize,
		} = await import("../../../index");

		const listener = useEventListener("resize", () => {});
		const outside = onClickOutside(null, () => {});
		const focus = useFocus(null);
		const mouse = useMouse();
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const ssrMediaQuery = useMediaQuery("(min-width: 640px)", {
			ssrWidth: 800,
		});
		const elementSize = useElementSize(null, { width: 10, height: 20 });
		const size = useWindowSize();

		expect(focus.focused.value).toBe(false);
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);
		expect(mediaQuery.matches.value).toBe(false);
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(elementSize.width.value).toBe(10);
		expect(elementSize.height.value).toBe(20);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		listener.stop();
		outside();
		focus.stop();
		mouse.stop();
		mediaQuery.stop();
		ssrMediaQuery.stop();
		elementSize.stop();
		size.stop();
	});
});
