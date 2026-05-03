import { type ReadonlySignal, signal } from "@sigrea/core";
import { describe, expectTypeOf, it } from "vitest";

import type {
	Arrayable,
	FocusableElementLike,
	MatchMediaWindow,
	OnClickOutsideOptions,
	ResizeObserverWindowLike,
	UseElementSizeOptions,
	UseFocusOptions,
	UseMediaQueryOptions,
	UseMouseOptions,
	UseToggleOptions,
	UseWindowSizeOptions,
} from "../../../index";
import {
	onClickOutside,
	useDebounceFn,
	useElementSize,
	useEventListener,
	useFocus,
	useInterval,
	useIntervalFn,
	useMediaQuery,
	useMouse,
	useThrottleFn,
	useTimeout,
	useTimeoutFn,
	useToggle,
	useWindowSize,
} from "../../../index";

interface MatchMediaOnlyWindow extends MatchMediaWindow {
	readonly label: string;
}

interface SizedWindow extends EventTarget {
	readonly innerWidth: number;
	readonly innerHeight: number;
}

interface MouseWindow extends EventTarget {
	readonly scrollX: number;
	readonly scrollY: number;
}

interface ResizeWindow extends EventTarget {
	readonly ResizeObserver?: typeof ResizeObserver;
}

function typeOnly(_callback: () => void): void {}

describe("public types", () => {
	it("infers window event payloads when the target is omitted", () => {
		const listener = useEventListener("resize", (event) => {
			expectTypeOf(event).toEqualTypeOf<UIEvent>();
		});

		listener.stop();
	});

	it("accepts multiple window event names", () => {
		const events: Arrayable<"resize" | "scroll"> = ["resize", "scroll"];

		const listener = useEventListener(events, (event) => {
			expectTypeOf(event).toEqualTypeOf<UIEvent | Event>();
		});

		listener.stop();
	});

	it("preserves DOM event payload types", () => {
		const button = document.createElement("button");

		const listener = useEventListener(button, "click", (event) => {
			expectTypeOf(event).toEqualTypeOf<PointerEvent>();
		});

		listener.stop();
	});

	it("preserves DOM event payload types with array inputs", () => {
		const button = document.createElement("button");

		const listener = useEventListener(
			[button],
			["click"],
			[
				(event) => {
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
			],
		);

		listener.stop();
	});

	it("narrows onClickOutside controls return", () => {
		const target = document.createElement("div");
		const controlsOptions: OnClickOutsideOptions<true> = {
			controls: true,
			ignore: [() => document.body, ".ignored"],
		};
		const controls = onClickOutside(
			target,
			(event) => {
				expectTypeOf(event).toMatchTypeOf<Event>();
			},
			controlsOptions,
		);
		const stop = onClickOutside(target, () => {});

		controls.cancel();
		controls.trigger(new Event("click"));
		controls.stop();
		stop();
	});

	it("accepts lightweight matchMedia windows", () => {
		const queryList = new EventTarget() as MediaQueryList;
		Object.defineProperties(queryList, {
			matches: { value: true, writable: true },
			media: { value: "(min-width: 1px)" },
			onchange: { value: null, writable: true },
		});

		const customWindow = {
			label: "test",
			matchMedia: (_query: string) => queryList,
		} satisfies MatchMediaOnlyWindow;

		const options: UseMediaQueryOptions<MatchMediaOnlyWindow> = {
			ssrWidth: 1024,
			window: signal(customWindow),
		};

		const mediaQuery = useMediaQuery("(min-width: 768px)", options);

		mediaQuery.stop();
	});

	it("forwards timeout start arguments", () => {
		const timeout = useTimeoutFn((label: string) => label.length, 100, {
			immediate: false,
		});
		const optionalTimeout = useTimeoutFn(
			(label?: string) => label?.length,
			100,
		);
		const restTimeout = useTimeoutFn(
			(...labels: string[]) => labels.length,
			100,
		);

		typeOnly(() => {
			timeout.start("ready");
			optionalTimeout.start();
			optionalTimeout.start("ready");
			restTimeout.start("ready", "set");
			// @ts-expect-error required callback arguments must be passed to start
			timeout.start();
			// @ts-expect-error start arguments must match the callback
			timeout.start(1);
			// @ts-expect-error callbacks with required arguments must opt out of auto start
			useTimeoutFn((label: string) => label.length, 100);
		});
	});

	it("types timeout ready signals and controls", () => {
		const ready = useTimeout(100, { immediate: false });
		const timeout = useTimeout(100, {
			controls: true,
			immediate: false,
		});

		expectTypeOf(ready).toEqualTypeOf<ReadonlySignal<boolean>>();
		expectTypeOf(timeout.ready).toEqualTypeOf<ReadonlySignal<boolean>>();
		expectTypeOf(timeout.isPending).toEqualTypeOf<ReadonlySignal<boolean>>();
		timeout.start();
		timeout.stop();
	});

	it("allows the default interval duration", () => {
		const interval = useIntervalFn(() => {}, 1000, { immediate: false });

		interval.pause();
	});

	it("types interval counters and callback counts", () => {
		const counter = useInterval(100, { immediate: false });
		const interval = useInterval(100, {
			callback: (count) => {
				expectTypeOf(count).toEqualTypeOf<number>();
			},
			controls: true,
			immediate: false,
		});

		expectTypeOf(counter).toEqualTypeOf<ReadonlySignal<number>>();
		expectTypeOf(interval.counter).toEqualTypeOf<ReadonlySignal<number>>();
		expectTypeOf(interval.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
		interval.pause();
		interval.resume();
		interval.pause();
		interval.reset();
	});

	it("preserves debounce arguments, this, and return value", () => {
		function label(this: { prefix: string }, value: number) {
			return `${this.prefix}${value}`;
		}
		const debounced = useDebounceFn(label, 100);

		typeOnly(() => {
			expectTypeOf(debounced.call({ prefix: "id:" }, 1)).toEqualTypeOf<
				Promise<string | undefined>
			>();
			// @ts-expect-error arguments must match the original function
			debounced.call({ prefix: "id:" }, "1");
		});
	});

	it("preserves throttle arguments, this, and return value", () => {
		function label(this: { prefix: string }, value: number) {
			return `${this.prefix}${value}`;
		}
		const throttled = useThrottleFn(label, 100);

		typeOnly(() => {
			expectTypeOf(throttled.call({ prefix: "id:" }, 1)).toEqualTypeOf<
				Promise<string | undefined>
			>();
			// @ts-expect-error arguments must match the original function
			throttled.call({ prefix: "id:" }, "1");
		});
	});

	it("accepts reactive window-like targets for window size", () => {
		const sizedWindow = new EventTarget() as SizedWindow;
		Object.defineProperties(sizedWindow, {
			innerHeight: { value: 600, writable: true },
			innerWidth: { value: 800, writable: true },
		});

		const options: UseWindowSizeOptions<SizedWindow> = {
			window: signal(sizedWindow),
		};

		const size = useWindowSize(options);

		size.stop();
	});

	it("accepts mouse options with custom targets", () => {
		const mouseWindow = new EventTarget() as MouseWindow;
		Object.defineProperties(mouseWindow, {
			scrollX: { value: 0 },
			scrollY: { value: 0 },
		});
		const target = new EventTarget();
		const options: UseMouseOptions<MouseWindow> = {
			target: signal(target),
			type: "client",
			window: signal(mouseWindow),
		};
		const mouse = useMouse(options);

		expectTypeOf(mouse.x.value).toEqualTypeOf<number>();
		expectTypeOf(mouse.sourceType.value).toEqualTypeOf<
			"mouse" | "touch" | null
		>();
		mouse.stop();
	});

	it("returns writable focused state for focus", () => {
		const target = document.createElement("button") as FocusableElementLike;
		const options: UseFocusOptions = {
			focusVisible: true,
			preventScroll: true,
		};
		const focus = useFocus(target, options);

		focus.focused.value = true;
		expectTypeOf(focus.focused.value).toEqualTypeOf<boolean>();
		focus.stop();
	});

	it("accepts ResizeObserver windows for element size", () => {
		const resizeWindow = new EventTarget() as ResizeWindow;
		const options: UseElementSizeOptions<ResizeWindow> = {
			box: "border-box",
			window: signal(resizeWindow),
		};
		const size = useElementSize(
			document.createElement("div"),
			undefined,
			options,
		);

		expectTypeOf(size.width.value).toEqualTypeOf<number>();
		size.stop();
	});

	it("infers custom toggle values", () => {
		const options: UseToggleOptions<"on", "off"> = {
			falsyValue: "off",
			truthyValue: "on",
		};
		const toggle = useToggle("off", options);

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("infers custom toggle values when the initial value is omitted", () => {
		const toggle = useToggle(undefined, {
			falsyValue: "off",
			truthyValue: "on",
		});

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("requires options for custom toggle values", () => {
		// @ts-expect-error custom values require truthy/falsy options
		useToggle("off");
	});
});
