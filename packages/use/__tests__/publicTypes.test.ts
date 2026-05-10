import { type ReadonlySignal, type Signal, signal } from "@sigrea/core";
import { describe, expectTypeOf, it } from "vitest";

import type {
	Arrayable,
	AsyncComputedOptions,
	Breakpoints,
	ComputedEagerOptions,
	ComputedEagerReturn,
	ComputedWithControlOptions,
	ComputedWithControlReturn,
	CreateSignalReturn,
	DocumentVisibilityDocumentLike,
	EventHook,
	EventHookArgs,
	EventHookCallback,
	EventHookReturn,
	FocusableElementLike,
	MatchMediaWindow,
	OnClickOutsideOptions,
	OnlineNavigatorLike,
	RemovableSignal,
	ResizeObserverWindowLike,
	StorageSerializer,
	StorageWindowLike,
	UseBreakpointsOptions,
	UseDocumentVisibilityOptions,
	UseElementSizeOptions,
	UseFocusOptions,
	UseMediaQueryOptions,
	UseMouseOptions,
	UseOnlineOptions,
	UseRefHistoryRecord,
	UseStorageOptions,
	UseToggleOptions,
	UseWindowSizeOptions,
	WritableComputedWithControlReturn,
} from "../../../index";
import {
	StorageSerializers,
	computedAsync,
	computedEager,
	computedWithControl,
	createEventHook,
	createSignal,
	onClickOutside,
	useBreakpoints,
	useDebounceFn,
	useDocumentVisibility,
	useElementSize,
	useEventListener,
	useFocus,
	useInterval,
	useIntervalFn,
	useLocalStorage,
	useManualRefHistory,
	useMediaQuery,
	useMouse,
	useOnline,
	usePreferredDark,
	usePrevious,
	useRefHistory,
	useSessionStorage,
	useStorage,
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

interface StorageOnlyWindow extends StorageWindowLike {
	readonly label: string;
}

function typeOnly(_callback: () => void): void {}

describe("public types", () => {
	it("types async computed values and options", () => {
		typeOnly(() => {
			const evaluating = signal(false);
			const options: AsyncComputedOptions = {
				evaluating,
				flush: "sync",
				lazy: true,
				onError: (_error) => {},
				shallow: false,
			};
			const value = computedAsync(
				async (onCancel) => {
					onCancel(() => {});
					return 1;
				},
				0,
				options,
			);
			const optional = computedAsync(async () => "ready");
			const withEvaluatingSignal = computedAsync(
				async () => true,
				false,
				evaluating,
			);

			expectTypeOf(value).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(optional).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(withEvaluatingSignal).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			// @ts-expect-error returned values are readonly signals
			value.value = 2;
		});
	});

	it("types eager computed values and options", () => {
		typeOnly(() => {
			const options: ComputedEagerOptions = {
				flush: "sync",
				onTrack: (_event) => {},
				onTrigger: (_event) => {},
			};
			const value = computedEager(() => 1, options);

			expectTypeOf(value).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(value).toEqualTypeOf<ComputedEagerReturn<number>>();
			// @ts-expect-error returned values are readonly signals
			value.value = 2;
		});
	});

	it("types controlled computed values and options", () => {
		typeOnly(() => {
			const trigger = signal(0);
			const options: ComputedWithControlOptions = {
				deep: true,
				flush: "sync",
				onTrack: (_event) => {},
				onTrigger: (_event) => {},
			};
			const value = computedWithControl<number>(
				trigger,
				(oldValue) => {
					expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
					return oldValue === undefined ? 1 : oldValue + 1;
				},
				options,
			);
			const writable = computedWithControl(trigger, {
				get: () => 1,
				set: (_next) => {},
			});

			expectTypeOf(value).toEqualTypeOf<ComputedWithControlReturn<number>>();
			expectTypeOf(value).toMatchTypeOf<ReadonlySignal<number>>();
			expectTypeOf(value.trigger).toEqualTypeOf<() => void>();
			expectTypeOf(writable).toEqualTypeOf<
				WritableComputedWithControlReturn<number>
			>();
			expectTypeOf(writable).toMatchTypeOf<Signal<number>>();
			writable.value = 2;
			// @ts-expect-error returned getter values are readonly signals
			value.value = 2;
		});
	});

	it("types event hooks", () => {
		typeOnly(() => {
			const single = createEventHook<number>();
			const tuple = createEventHook<[number, string]>();
			const array = createEventHook<string[]>();
			const readonlyTuple = createEventHook<readonly [number, string]>();
			const readonlyArray = createEventHook<readonly string[]>();
			const empty = createEventHook<void>();
			const loose = createEventHook();
			const callback: EventHookCallback<number> = (value) => {
				expectTypeOf(value).toEqualTypeOf<number>();
			};

			single.on(callback);
			single.on((value) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				return value.toString();
			});
			single.on((value, extra) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(extra).toEqualTypeOf<unknown>();
			});
			tuple.on((count, label) => {
				expectTypeOf(count).toEqualTypeOf<number>();
				expectTypeOf(label).toEqualTypeOf<string>();
			});
			array.on((value) => {
				expectTypeOf(value).toEqualTypeOf<string[]>();
			});
			readonlyTuple.on((count, label) => {
				expectTypeOf(count).toEqualTypeOf<number>();
				expectTypeOf(label).toEqualTypeOf<string>();
			});
			readonlyArray.on((value) => {
				expectTypeOf(value).toEqualTypeOf<readonly string[]>();
			});
			empty.on((...args) => {
				expectTypeOf(args).toEqualTypeOf<unknown[]>();
			});
			loose.on((...args) => {
				expectTypeOf(args).toEqualTypeOf<unknown[]>();
			});

			expectTypeOf(single).toEqualTypeOf<EventHookReturn<number>>();
			expectTypeOf(single).toEqualTypeOf<EventHook<number>>();
			expectTypeOf<[number, ...unknown[]]>().toEqualTypeOf<
				EventHookArgs<number>
			>();
			expectTypeOf<[string[], ...unknown[]]>().toEqualTypeOf<
				EventHookArgs<string[]>
			>();
			expectTypeOf(single.on(callback)).toEqualTypeOf<{ off: () => void }>();
			expectTypeOf(single.trigger(1)).toEqualTypeOf<Promise<unknown[]>>();
			expectTypeOf(single.trigger(1, "extra")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(tuple.trigger(1, "ready")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(array.trigger(["ready"])).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(readonlyTuple.trigger(1, "ready")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(readonlyArray.trigger(["ready"])).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(empty.trigger()).toEqualTypeOf<Promise<unknown[]>>();
			// @ts-expect-error single payload hooks require the first argument
			single.trigger();
			// @ts-expect-error tuple payload hooks require all tuple arguments
			tuple.trigger(1);
			// @ts-expect-error array payload hooks receive the array as one payload
			array.trigger("ready", "done");
			// @ts-expect-error readonly array payload hooks receive the array as one payload
			readonlyArray.trigger("ready", "done");
			// @ts-expect-error payload type must match
			single.trigger("ready");
		});
	});

	it("types created signals", () => {
		typeOnly(() => {
			const shallow = createSignal({ nested: { count: 0 } });
			const shallowExplicit = createSignal({ nested: { count: 0 } }, false);
			const deep = createSignal({ nested: { count: 0 } }, true);
			const primitive = createSignal(0, true);
			const dynamic = createSignal("ready", Math.random() > 0.5);

			expectTypeOf(shallow).toEqualTypeOf<
				Signal<{ nested: { count: number } }>
			>();
			expectTypeOf(shallowExplicit).toEqualTypeOf<
				Signal<{ nested: { count: number } }>
			>();
			expectTypeOf(deep).toEqualTypeOf<
				CreateSignalReturn<{ nested: { count: number } }, true>
			>();
			expectTypeOf(deep).toEqualTypeOf<Signal<{ nested: { count: number } }>>();
			expectTypeOf(deep.value.nested.count).toEqualTypeOf<number>();
			expectTypeOf(primitive.value).toEqualTypeOf<number>();
			expectTypeOf(dynamic).toEqualTypeOf<Signal<string>>();

			shallow.value = { nested: { count: 1 } };
			deep.value.nested.count = 1;
			primitive.value = 1;
		});
	});

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

	it("preserves browser composable public types", () => {
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
		const mediaOptions: UseBreakpointsOptions<MatchMediaOnlyWindow> = {
			ssrWidth: 1024,
			window: signal(customWindow),
		};
		const points = {
			md: signal("48rem"),
			sm: 640,
		} satisfies Breakpoints<"sm" | "md">;
		const breakpoints = useBreakpoints(points, mediaOptions);
		const preferredDark = usePreferredDark(mediaOptions);

		expectTypeOf(breakpoints.md.matches.value).toEqualTypeOf<boolean>();
		expectTypeOf(breakpoints.active().value).toEqualTypeOf<"sm" | "md" | "">();
		expectTypeOf(breakpoints.stop).toEqualTypeOf<() => void>();
		expectTypeOf(preferredDark.matches.value).toEqualTypeOf<boolean>();

		const visibilityDocument =
			new EventTarget() as DocumentVisibilityDocumentLike;
		Object.defineProperty(visibilityDocument, "visibilityState", {
			value: "visible",
		});
		const visibilityOptions: UseDocumentVisibilityOptions = {
			document: signal(visibilityDocument),
		};
		const visibility = useDocumentVisibility(visibilityOptions);

		expectTypeOf(
			visibility.visibility.value,
		).toEqualTypeOf<DocumentVisibilityState>();

		const onlineNavigator: OnlineNavigatorLike = {
			onLine: true,
		};
		const onlineWindow = new EventTarget() as Window & {
			readonly navigator: OnlineNavigatorLike;
		};
		Object.defineProperty(onlineWindow, "navigator", {
			value: onlineNavigator,
		});
		const onlineOptions: UseOnlineOptions<typeof onlineWindow> = {
			window: signal(onlineWindow),
		};
		const online = useOnline(onlineOptions);

		expectTypeOf(online.isOnline.value).toEqualTypeOf<boolean>();

		breakpoints.stop();
		preferredDark.stop();
		visibility.stop();
		online.stop();
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

	it("infers manual ref history snapshots", () => {
		const source = signal(0);
		const history = useManualRefHistory(source);

		expectTypeOf(history.source).toEqualTypeOf(source);
		expectTypeOf(history.history.value).toEqualTypeOf<
			UseRefHistoryRecord<number>[]
		>();

		const serialized = useManualRefHistory(signal({ count: 0 }), {
			dump: JSON.stringify,
			parse: (value: string) => JSON.parse(value) as { count: number },
		});

		expectTypeOf(serialized.history.value[0].snapshot).toEqualTypeOf<string>();
	});

	it("infers ref history shouldCommit values", () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			shouldCommit: (oldValue, newValue) => {
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				expectTypeOf(newValue).toEqualTypeOf<number>();
				return true;
			},
		});

		expectTypeOf(history.isTracking.value).toEqualTypeOf<boolean>();
		history.dispose();
	});

	it("types previous values with and without an initial value", () => {
		const source = signal(0);

		typeOnly(() => {
			const previous = usePrevious(source);
			const previousWithInitial = usePrevious(source, 0);

			expectTypeOf(previous.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(previousWithInitial.value).toEqualTypeOf<number>();
			expectTypeOf(previous).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(previousWithInitial).toEqualTypeOf<ReadonlySignal<number>>();
		});
	});

	it("returns removable writable storage signals", () => {
		typeOnly(() => {
			const storage = useStorage("key", 1);

			storage.value = 2;
			storage.value = null;
			storage.remove();

			expectTypeOf(storage).toEqualTypeOf<RemovableSignal<number | null>>();
		});
	});

	it("keeps default value inference with built-in storage serializers", () => {
		typeOnly(() => {
			const map = useStorage("map", new Map<string, number>(), undefined, {
				serializer: StorageSerializers.map,
			});
			const set = useStorage("set", new Set<string>(), undefined, {
				serializer: StorageSerializers.set,
			});

			expectTypeOf(map).toEqualTypeOf<
				RemovableSignal<Map<string, number> | null>
			>();
			expectTypeOf(set).toEqualTypeOf<RemovableSignal<Set<string> | null>>();

			StorageSerializers.map.write(new Map<string, number>());
			StorageSerializers.set.write(new Set<string>());
			StorageSerializers.array.write([1, 2]);
			StorageSerializers.object.write({ count: 1 });

			expectTypeOf(
				StorageSerializers.map.read<string, number>("[]"),
			).toEqualTypeOf<Map<string, number>>();
			expectTypeOf(StorageSerializers.set.read<string>("[]")).toEqualTypeOf<
				Set<string>
			>();
		});
	});

	it("supports null defaults with explicit storage value types", () => {
		typeOnly(() => {
			const objectSerializer: StorageSerializer<{ count: number }> = {
				read(raw) {
					return JSON.parse(raw) as { count: number };
				},
				write(value) {
					return JSON.stringify(value);
				},
			};
			const stored = useStorage<{ count: number }>("key", null, undefined, {
				serializer: objectSerializer,
			});

			stored.value = { count: 1 };
			stored.value = null;

			expectTypeOf(stored).toEqualTypeOf<
				RemovableSignal<{ count: number } | null>
			>();
		});
	});

	it("accepts storage window overrides", () => {
		typeOnly(() => {
			const localStorage = {
				getItem: (_key: string) => null,
				removeItem: (_key: string) => {},
				setItem: (_key: string, _value: string) => {},
			};
			const customWindow = new EventTarget() as StorageOnlyWindow;
			Object.defineProperties(customWindow, {
				label: { value: "storage" },
				localStorage: { value: localStorage },
				sessionStorage: { value: localStorage },
			});
			const options: UseStorageOptions<string, StorageOnlyWindow> = {
				window: signal(customWindow),
			};

			useLocalStorage("local", "value", options);
			useSessionStorage("session", "value", options);
		});
	});
});
