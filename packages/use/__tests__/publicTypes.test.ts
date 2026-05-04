import {
	type Computed,
	type ReadonlySignal,
	type Signal,
	computed,
	readonly,
	signal,
} from "@sigrea/core";
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
	ExtendSignalOptions,
	ExtendSignalReturn,
	ExtendSignalSource,
	ExtendSignalUnwrapped,
	FocusableElementLike,
	IsDefinedReturn,
	KeyFilter,
	KeyPredicate,
	KeyStrokeEventName,
	MatchMediaWindow,
	MaybeValue,
	MaybeValueArgs,
	OnClickOutsideOptions,
	OnElementRemovalDocumentLike,
	OnElementRemovalOptions,
	OnElementRemovalReturn,
	OnElementRemovalWindowLike,
	OnKeyStrokeHandler,
	OnKeyStrokeOptions,
	OnKeyStrokeReturn,
	OnLongPressDelay,
	OnLongPressHandler,
	OnLongPressModifiers,
	OnLongPressOptions,
	OnLongPressReturn,
	OnStartTypingDocumentLike,
	OnStartTypingHandler,
	OnStartTypingOptions,
	OnStartTypingReturn,
	OnlineNavigatorLike,
	ReactifyNested,
	ReactifyObjectOptions,
	ReactifyObjectReturn,
	ReactifyReturn,
	RemovableSignal,
	ResizeObserverWindowLike,
	ResolveValueFn,
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
	createResolveValueFn,
	createSignal,
	extendSignal,
	isDefined,
	makeDestructurable,
	onClickOutside,
	onElementRemoval,
	onKeyDown,
	onKeyPressed,
	onKeyStroke,
	onKeyUp,
	onLongPress,
	onStartTyping,
	reactify,
	reactifyObject,
	resolveValue,
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

interface MutationWindow extends OnElementRemovalWindowLike {
	readonly label: string;
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
			expectTypeOf(single.on(callback)).toEqualTypeOf<{ off: () => void }>();
			expectTypeOf(single.trigger(1)).toEqualTypeOf<Promise<unknown[]>>();
			expectTypeOf(single.trigger(1, "extra")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(tuple.trigger(1, "ready")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(empty.trigger()).toEqualTypeOf<Promise<unknown[]>>();
			// @ts-expect-error single payload hooks require the first argument
			single.trigger();
			// @ts-expect-error tuple payload hooks require all tuple arguments
			tuple.trigger(1);
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

	it("types extended signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const count = signal(1);
			const label = computed({
				get: () => "ready",
				set: (_next: string) => {},
			});
			const readonlyCount: ReadonlySignal<number> = readonly(count);
			const options: ExtendSignalOptions<true> = {
				enumerable: true,
				unwrap: true,
			};
			const noUnwrapOptions: ExtendSignalOptions<false> = {
				unwrap: false,
			};
			const extended = extendSignal(
				source,
				{
					count,
					label,
					plain: true,
					peek: () => "ignored",
					readonlyCount,
					value: "ignored",
				},
				options,
			);
			const preserved = extendSignal(
				source,
				{ count, label, readonlyCount },
				noUnwrapOptions,
			);
			const withEnumerable = extendSignal(
				source,
				{ count },
				{ enumerable: true },
			);
			const withEmptyOptions = extendSignal(source, { count }, {});

			expectTypeOf(source).toMatchTypeOf<ExtendSignalSource<number>>();
			expectTypeOf(extended).toMatchTypeOf<
				ExtendSignalReturn<
					typeof source,
					{
						count: typeof count;
						label: typeof label;
						plain: boolean;
						peek: () => string;
						readonlyCount: typeof readonlyCount;
						value: string;
					}
				>
			>();
			expectTypeOf(extended).toMatchTypeOf<Signal<number>>();
			expectTypeOf(extended.value).toEqualTypeOf<number>();
			expectTypeOf(extended.count).toEqualTypeOf<number>();
			expectTypeOf(extended.label).toEqualTypeOf<string>();
			expectTypeOf(extended.peek).toEqualTypeOf<() => number>();
			expectTypeOf(extended.plain).toEqualTypeOf<boolean>();
			expectTypeOf(extended.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(withEnumerable.count).toEqualTypeOf<number>();
			expectTypeOf(withEmptyOptions.count).toEqualTypeOf<number>();
			extended.count = 2;
			extended.label = "updated";
			expectTypeOf(extended.peek()).toEqualTypeOf<number>();
			// @ts-expect-error value extension does not replace the source value type
			extended.value = "ignored";
			// @ts-expect-error readonly signals expose a readonly unwrapped property
			extended.readonlyCount = 2;

			expectTypeOf(preserved.count).toEqualTypeOf<Signal<number>>();
			expectTypeOf(preserved.label).toEqualTypeOf<Computed<string>>();
			expectTypeOf(preserved.readonlyCount).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			preserved.count.value = 2;

			expectTypeOf<
				ExtendSignalUnwrapped<{
					count: Signal<number>;
					readonlyCount: ReadonlySignal<number>;
				}>
			>().toMatchTypeOf<{
				count: number;
				readonly readonlyCount: number;
			}>();
		});
	});

	it("types value-resolving functions", () => {
		typeOnly(() => {
			function join(this: { prefix: string }, first: string, second: number) {
				return `${this.prefix}:${first}:${second}`;
			}
			function callFactory(factory: () => string) {
				return factory();
			}
			function formatUnion(value: string | ((input: string) => string)) {
				return typeof value === "function" ? value("ready") : value;
			}
			const first = signal("ready");
			const second = computedEager(() => 1);
			const factory = signal(() => "ready");
			const unionFactory = signal((input: string) => input.toUpperCase());
			const resolveJoin = createResolveValueFn(join);
			const resolveFactory = createResolveValueFn(callFactory);
			const resolveUnion = createResolveValueFn(formatUnion);

			expectTypeOf(resolveJoin).toEqualTypeOf<ResolveValueFn<typeof join>>();
			expectTypeOf(
				resolveJoin.call({ prefix: "item" }, first, second),
			).toEqualTypeOf<string>();
			expectTypeOf<[MaybeValue<string>, MaybeValue<number>]>().toEqualTypeOf<
				MaybeValueArgs<[string, number]>
			>();
			expectTypeOf(resolveFactory(factory)).toEqualTypeOf<string>();
			expectTypeOf(resolveUnion("ready")).toEqualTypeOf<string>();
			expectTypeOf(resolveUnion(unionFactory)).toEqualTypeOf<string>();
			resolveJoin.call({ prefix: "item" }, () => "ready", 1);
			// @ts-expect-error first argument must resolve to string
			resolveJoin.call({ prefix: "item" }, signal(1), second);
			// @ts-expect-error second argument must resolve to number
			resolveJoin.call({ prefix: "item" }, first, "1");
			// @ts-expect-error function values must be wrapped to avoid getter handling
			resolveFactory(() => "ready");
			// @ts-expect-error function values in unions must also be wrapped
			resolveUnion((input: string) => input.toUpperCase());
		});
	});

	it("types reactified functions", () => {
		typeOnly(() => {
			function join(this: { prefix: string }, first: string, second: number) {
				return `${this.prefix}:${first}:${second}`;
			}
			function callFactory(factory: () => string) {
				return factory();
			}
			function formatUnion(value: string | ((input: string) => string)) {
				return typeof value === "function" ? value("ready") : value;
			}
			const first = signal("ready");
			const second = computedEager(() => 1);
			const factory = signal(() => "ready");
			const unionFactory = signal((input: string) => input.toUpperCase());
			const reactiveJoin = reactify(join);
			const add = reactify((left: number, right: number) => left + right);
			const reactiveFactory = reactify(callFactory);
			const reactiveUnion = reactify(formatUnion);
			const total = add(
				readonly(signal(1)),
				computed(() => 2),
			);

			expectTypeOf(reactiveJoin).toEqualTypeOf<ReactifyReturn<typeof join>>();
			expectTypeOf(
				reactiveJoin.call({ prefix: "item" }, first, second),
			).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(add(1, () => 2)).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(total).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(reactiveFactory(factory)).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(reactiveUnion("ready")).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(reactiveUnion(unionFactory)).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			// @ts-expect-error returned values are readonly signals
			total.value = 3;
			// @ts-expect-error first argument must resolve to string
			reactiveJoin.call({ prefix: "item" }, signal(1), second);
			// @ts-expect-error function values must be wrapped to avoid getter handling
			reactiveFactory(() => "ready");
			// @ts-expect-error function values in unions must also be wrapped
			reactiveUnion((input: string) => input.toUpperCase());
		});
	});

	it("types reactified objects", () => {
		typeOnly(() => {
			const source = {
				count: 1,
				format(this: { prefix: string }, value: string) {
					return `${this.prefix}:${value}`;
				},
				prefix: "item",
			};
			const symbolKey = Symbol("double");
			const withSymbol = {
				[symbolKey](value: number) {
					return value * 2;
				},
			};
			const optionalSource: {
				optional?: (value: number) => number;
				status: "ready" | ((value: number) => number);
			} = {
				optional(value: number) {
					return value * 2;
				},
				status(value: number) {
					return value * 3;
				},
			};
			const options: ReactifyObjectOptions = {
				includeOwnProperties: true,
			};
			const all = reactifyObject(source, options);
			const selected = reactifyObject(source, ["format"] as const);
			const symbolResult = reactifyObject(withSymbol);
			const optionalResult = reactifyObject(optionalSource);

			expectTypeOf(all).toEqualTypeOf<
				ReactifyObjectReturn<typeof source, keyof typeof source>
			>();
			expectTypeOf(all.format("ready")).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(all.count).toEqualTypeOf<number>();
			expectTypeOf(all.prefix).toEqualTypeOf<string>();
			expectTypeOf(selected).toEqualTypeOf<
				ReactifyObjectReturn<typeof source, "format">
			>();
			expectTypeOf(selected.format(signal("ready"))).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(symbolResult[symbolKey](signal(2))).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(optionalResult.optional).toEqualTypeOf<
				| ((value: MaybeValueArgs<[number]>[0]) => ReadonlySignal<number>)
				| undefined
			>();
			expectTypeOf(optionalResult.status).toEqualTypeOf<
				| "ready"
				| ((value: MaybeValueArgs<[number]>[0]) => ReadonlySignal<number>)
			>();
			expectTypeOf<
				ReactifyNested<{
					count: number;
					double(value: number): number;
				}>
			>().toMatchTypeOf<{
				count: number;
				double(value: number): ReadonlySignal<number>;
			}>();
			// @ts-expect-error selected keys do not include non-selected properties
			selected.count;
		});
	});

	it("types resolved values", () => {
		typeOnly(() => {
			const count = signal(1);
			const readonlyCount = readonly(count);
			const doubled = computed(() => count.value * 2);
			const factory = signal((): string => "ready");
			const getter = (): string => "ready";
			const functionValue = (_input: string): string => "ready";
			const getterReturningSignal = (): Signal<string> => signal("ready");

			expectTypeOf(resolveValue("ready")).toEqualTypeOf<string>();
			expectTypeOf(resolveValue(count)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(readonlyCount)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(doubled)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(getter)).toEqualTypeOf<string>();
			expectTypeOf(resolveValue(factory)).toEqualTypeOf<() => string>();
			expectTypeOf(resolveValue(getterReturningSignal)).toEqualTypeOf<
				Signal<string>
			>();
			// @ts-expect-error resolveValue does not provide VueUse get key access
			resolveValue({ count: 1 }, "count");
			// @ts-expect-error function values must be wrapped to avoid getter handling
			resolveValue(functionValue);
		});
	});

	it("narrows defined values", () => {
		typeOnly(() => {
			const raw = "ready" as string | null | undefined;
			const count = signal<number | undefined>(1);
			const readonlyCount = readonly(count);
			const doubled = computed((): number | null => count.value ?? null);
			const zeroArgFunction = (() => "ready") as
				| (() => string | undefined)
				| undefined;
			const functionValue = ((_input: string): string => "ready") as
				| ((input: string) => string)
				| undefined;
			const factory = signal((): string => "ready");

			expectTypeOf(isDefined(raw)).toEqualTypeOf<IsDefinedReturn>();
			expectTypeOf(isDefined(zeroArgFunction)).toEqualTypeOf<IsDefinedReturn>();

			if (isDefined(raw)) {
				expectTypeOf(raw).toEqualTypeOf<string>();
			}
			if (isDefined(count)) {
				expectTypeOf(count.value).toEqualTypeOf<number>();
				count.value = 2;
			}
			if (isDefined(readonlyCount)) {
				expectTypeOf(readonlyCount.value).toEqualTypeOf<number>();
			}
			if (isDefined(doubled)) {
				expectTypeOf(doubled.value).toEqualTypeOf<number>();
			}
			if (isDefined(zeroArgFunction)) {
				expectTypeOf(zeroArgFunction).toEqualTypeOf<() => string | undefined>();
			}
			// @ts-expect-error function values must be wrapped to avoid getter handling
			isDefined(functionValue);
			if (isDefined(factory)) {
				expectTypeOf(factory.value).toEqualTypeOf<() => string>();
			}
		});
	});

	it("types destructurable objects and tuples", () => {
		typeOnly(() => {
			const foo = { name: "foo" };
			const bar: number = 1024;
			const result = makeDestructurable(
				{ bar, foo } as const,
				[foo, bar] as const,
			);
			const { bar: objectBar, foo: objectFoo } = result;
			const [arrayFoo, arrayBar] = result;

			expectTypeOf(objectFoo).toEqualTypeOf<{ name: string }>();
			expectTypeOf(objectBar).toEqualTypeOf<number>();
			expectTypeOf(arrayFoo).toEqualTypeOf<{ name: string }>();
			expectTypeOf(arrayBar).toEqualTypeOf<number>();
			expectTypeOf(result.length).toEqualTypeOf<2>();
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

	it("types onElementRemoval targets and options", () => {
		const host = document.createElement("div");
		const shadowRoot = host.attachShadow({ mode: "open" });
		const mutationWindow = new EventTarget() as MutationWindow;
		Object.defineProperties(mutationWindow, {
			document: { value: document },
			label: { value: "test" },
			MutationObserver: { value: MutationObserver },
		});
		const documentTarget = shadowRoot;
		expectTypeOf(documentTarget).toMatchTypeOf<OnElementRemovalDocumentLike>();
		const options: OnElementRemovalOptions<MutationWindow, ShadowRoot> = {
			document: signal(documentTarget),
			flush: "sync",
			window: signal(mutationWindow),
		};
		const target = signal<Element | null>(document.createElement("div"));
		const stop = onElementRemoval(
			target,
			(mutationRecords) => {
				expectTypeOf(mutationRecords).toEqualTypeOf<MutationRecord[]>();
			},
			options,
		);

		expectTypeOf(stop).toEqualTypeOf<OnElementRemovalReturn>();
		stop();
	});

	it("types keyboard stroke handlers and options", () => {
		typeOnly(() => {
			const target = signal<EventTarget | null>(new EventTarget());
			const dedupe = signal(true);
			const eventName: KeyStrokeEventName = "keyup";
			const filter: KeyFilter = ["Enter", "Escape"];
			const predicate: KeyPredicate = (event) => event.key === "Enter";
			const handler: OnKeyStrokeHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
			};
			const options: OnKeyStrokeOptions<EventTarget> = {
				dedupe,
				eventName,
				passive: true,
				target,
			};

			const stopByFilter = onKeyStroke(filter, handler, options);
			const stopByPredicate = onKeyStroke(predicate, handler, options);
			const stopByHandler = onKeyStroke(handler, options);
			const stopDown = onKeyDown("Enter", handler, options);
			const stopPressed = onKeyPressed("Enter", handler, options);
			const stopUp = onKeyUp("Enter", handler, options);

			expectTypeOf(stopByFilter).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopByPredicate).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopByHandler).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopDown).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopPressed).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopUp).toEqualTypeOf<OnKeyStrokeReturn>();
			// @ts-expect-error keyboard stroke event names are limited
			onKeyStroke("Enter", handler, { eventName: "click" });
		});
	});

	it("types long press targets and options", () => {
		typeOnly(() => {
			const target = signal<Element | null>(document.createElement("button"));
			const modifiers: OnLongPressModifiers = {
				capture: true,
				once: true,
				prevent: true,
				self: true,
				stop: true,
			};
			const delay: OnLongPressDelay = (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				return 500;
			};
			const handler: OnLongPressHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
			};
			const options: OnLongPressOptions = {
				delay,
				distanceThreshold: false,
				modifiers,
				onMouseUp(duration, distance, isLongPress, event) {
					expectTypeOf(duration).toEqualTypeOf<number>();
					expectTypeOf(distance).toEqualTypeOf<number>();
					expectTypeOf(isLongPress).toEqualTypeOf<boolean>();
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
			};
			const stop = onLongPress(target, handler, options);

			expectTypeOf(stop).toEqualTypeOf<OnLongPressReturn>();
			stop();
			// @ts-expect-error onLongPress targets must be elements
			onLongPress(new EventTarget(), handler);
		});
	});

	it("types start typing document options", () => {
		typeOnly(() => {
			const documentTarget = signal<OnStartTypingDocumentLike | null>(document);
			const handler: OnStartTypingHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
			};
			const options: OnStartTypingOptions<OnStartTypingDocumentLike> = {
				document: documentTarget,
			};
			const stop = onStartTyping(handler, options);

			expectTypeOf(document).toMatchTypeOf<OnStartTypingDocumentLike>();
			expectTypeOf(stop).toEqualTypeOf<OnStartTypingReturn>();
			stop();
		});
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
