import {
	type Computed,
	type DeepSignal,
	type ReadonlySignal,
	type Signal,
	computed,
	deepSignal,
	readonly,
	signal,
} from "@sigrea/core";
import { describe, expectTypeOf, it } from "vitest";

import type {
	Arrayable,
	AsyncComputedOptions,
	BasicColorMode,
	BatteryManagerLike,
	BatteryNavigatorLike,
	BluetoothDeviceLike,
	BluetoothLEScanFilterLike,
	BluetoothLike,
	BluetoothNavigatorLike,
	BluetoothRemoteGATTCharacteristicLike,
	BluetoothRemoteGATTServerLike,
	BluetoothRemoteGATTServiceLike,
	BluetoothRequestDeviceOptionsLike,
	BluetoothServiceUUIDLike,
	Breakpoints,
	BroadcastChannelLike,
	BroadcastChannelWindowLike,
	BrowserLocationHistoryLike,
	BrowserLocationLike,
	BrowserLocationTrigger,
	BrowserLocationWindowLike,
	BrowserLocationWritableProperty,
	ClipboardDocumentBodyLike,
	ClipboardDocumentLike,
	ClipboardItemLike,
	ClipboardItemPresentationStyleLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	ClipboardTextareaLike,
	CloneFn,
	ColorModeSelection,
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
	ReactiveComputedGetter,
	ReactiveComputedReturn,
	ReactiveOmitPredicate,
	ReactiveOmitReturn,
	ReactivePickPredicate,
	ReactivePickReturn,
	RemovableSignal,
	ResizeObserverWindowLike,
	ResolveValueFn,
	SignalAutoResetReturn,
	SignalDebouncedOptions,
	SignalDebouncedReturn,
	SignalDefaultReturn,
	SignalManualResetReturn,
	SignalThrottledReturn,
	StorageSerializer,
	StorageWindowLike,
	SyncSignalDirection,
	SyncSignalOptions,
	SyncSignalReturn,
	SyncSignalTransform,
	SyncSignalsOptions,
	SyncSignalsReturn,
	ToDeepSignalReturn,
	TryOnScopeDisposeReturn,
	UntilArrayInstance,
	UntilBaseInstance,
	UntilToMatchOptions,
	UntilValueInstance,
	UseActiveElementDocumentLike,
	UseActiveElementOptions,
	UseActiveElementReturn,
	UseActiveElementWindowLike,
	UseAnimateKeyframes,
	UseAnimateOptions,
	UseAnimateReturn,
	UseAnimateWindowLike,
	UseArrayDifferenceCompareFn,
	UseArrayDifferenceOptions,
	UseArrayDifferenceReturn,
	UseArrayEveryPredicate,
	UseArrayEveryReturn,
	UseArrayFilterPredicate,
	UseArrayFilterReturn,
	UseArrayFindIndexPredicate,
	UseArrayFindIndexReturn,
	UseArrayFindLastPredicate,
	UseArrayFindLastReturn,
	UseArrayFindPredicate,
	UseArrayFindReturn,
	UseArrayIncludesComparatorFn,
	UseArrayIncludesOptions,
	UseArrayIncludesReturn,
	UseArrayJoinReturn,
	UseArrayMapCallback,
	UseArrayMapReturn,
	UseArrayReduceReducer,
	UseArrayReduceReturn,
	UseArraySomePredicate,
	UseArraySomeReturn,
	UseArrayUniqueCompareFn,
	UseArrayUniqueReturn,
	UseAsyncQueueOptions,
	UseAsyncQueueResult,
	UseAsyncQueueResultList,
	UseAsyncQueueResultState,
	UseAsyncQueueReturn,
	UseAsyncQueueTask,
	UseAsyncStateOptions,
	UseAsyncStateReturn,
	UseAsyncStateReturnBase,
	UseAsyncStateSource,
	UseBase64ImageOptions,
	UseBase64ObjectOptions,
	UseBase64Options,
	UseBase64Return,
	UseBase64Source,
	UseBase64WindowLike,
	UseBatteryOptions,
	UseBatteryReturn,
	UseBluetoothOptions,
	UseBluetoothReturn,
	UseBreakpointsOptions,
	UseBroadcastChannelOptions,
	UseBroadcastChannelReturn,
	UseBrowserLocationOptions,
	UseBrowserLocationReturn,
	UseCachedComparator,
	UseCachedOptions,
	UseCachedReturn,
	UseClipboardCopyFn,
	UseClipboardItemsCopyFn,
	UseClipboardItemsOptions,
	UseClipboardItemsReturn,
	UseClipboardItemsSource,
	UseClipboardItemsWindowLike,
	UseClipboardOptions,
	UseClipboardReturn,
	UseClipboardTextSource,
	UseClipboardWindowLike,
	UseClonedCloneFn,
	UseClonedOptions,
	UseClonedReturn,
	UseColorModeDefaultHandler,
	UseColorModeDocumentLike,
	UseColorModeOptions,
	UseColorModeReturn,
	UseColorModeWindowLike,
	UseConfirmDialogResult,
	UseConfirmDialogReturn,
	UseCountdownOptions,
	UseCountdownReturn,
	UseCountdownScheduler,
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
	cloneStructured,
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
	reactiveComputed,
	reactiveOmit,
	reactivePick,
	resolveValue,
	signalAutoReset,
	signalDebounced,
	signalDefault,
	signalManualReset,
	signalThrottled,
	syncSignal,
	syncSignals,
	toDeepSignal,
	tryOnScopeDispose,
	until,
	useActiveElement,
	useAnimate,
	useArrayDifference,
	useArrayEvery,
	useArrayFilter,
	useArrayFind,
	useArrayFindIndex,
	useArrayFindLast,
	useArrayIncludes,
	useArrayJoin,
	useArrayMap,
	useArrayReduce,
	useArraySome,
	useArrayUnique,
	useAsyncQueue,
	useAsyncState,
	useBase64,
	useBattery,
	useBluetooth,
	useBreakpoints,
	useBroadcastChannel,
	useBrowserLocation,
	useCached,
	useClipboard,
	useClipboardItems,
	useCloned,
	useColorMode,
	useConfirmDialog,
	useCountdown,
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

interface ColorModeOnlyWindow extends UseColorModeWindowLike {
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

	it("types async queue values and options", () => {
		typeOnly(() => {
			const firstTask = () => Promise.resolve(1);
			const secondTask = (value: number) => Promise.resolve(`${value}`);
			const syncTask = (value: string) => value.length;
			const options: UseAsyncQueueOptions = {
				interrupt: false,
				onError() {},
				onFinished() {},
				signal: new AbortController().signal,
			};
			const task: UseAsyncQueueTask<number> = () => 1;
			const resultEntry: UseAsyncQueueResult<number> = {
				state: "fulfilled",
				data: 1,
			};
			const state: UseAsyncQueueResultState = "pending";
			const queue = useAsyncQueue([firstTask, secondTask, syncTask], options);
			const emptyQueue = useAsyncQueue([]);

			expectTypeOf(task).toEqualTypeOf<UseAsyncQueueTask<number>>();
			expectTypeOf(queue).toEqualTypeOf<
				UseAsyncQueueReturn<
					[typeof firstTask, typeof secondTask, typeof syncTask]
				>
			>();
			expectTypeOf(queue.activeIndex).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(queue.result).toEqualTypeOf<
				ReadonlySignal<
					UseAsyncQueueResultList<
						[typeof firstTask, typeof secondTask, typeof syncTask]
					>
				>
			>();
			expectTypeOf(queue.result.value[0]).toEqualTypeOf<
				UseAsyncQueueResult<number>
			>();
			expectTypeOf(queue.result.value[1]).toEqualTypeOf<
				UseAsyncQueueResult<string>
			>();
			expectTypeOf(queue.result.value[2]).toEqualTypeOf<
				UseAsyncQueueResult<number>
			>();
			if (queue.result.value[0].state === "fulfilled") {
				expectTypeOf(queue.result.value[0].data).toEqualTypeOf<number>();
			}
			if (queue.result.value[1].state === "fulfilled") {
				expectTypeOf(queue.result.value[1].data).toEqualTypeOf<string>();
			}
			if (queue.result.value[2].state === "fulfilled") {
				expectTypeOf(queue.result.value[2].data).toEqualTypeOf<number>();
			}
			expectTypeOf(emptyQueue.activeIndex).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			// @ts-expect-error activeIndex is readonly
			queue.activeIndex.value = 1;
			// @ts-expect-error result is readonly
			queue.result.value = [];
			// @ts-expect-error result entries are readonly
			queue.result.value[0] = resultEntry;
			// @ts-expect-error result state is readonly
			queue.result.value[0].state = "fulfilled";
			// @ts-expect-error invalid result state
			resultEntry.state = "ready";
			// @ts-expect-error interrupt must be boolean
			useAsyncQueue([], { interrupt: "no" });
			// @ts-expect-error tasks must be functions
			useAsyncQueue([1]);
		});
	});

	it("types async state values and options", () => {
		typeOnly(() => {
			interface Item {
				id: string;
				count: number;
			}
			const initial = signal<Item>({ id: "initial", count: 0 });
			const action = async (id: string, count: number) => ({ id, count });
			const source: UseAsyncStateSource<Item, [string, number]> = action;
			const options: UseAsyncStateOptions<Item> = {
				delay: 10,
				immediate: false,
				onError(_error) {},
				onSuccess(value) {
					expectTypeOf(value).toEqualTypeOf<Item>();
				},
				resetOnExecute: false,
				shallow: false,
				throwError: true,
			};
			const asyncState = useAsyncState(action, initial, options);
			const promiseState = useAsyncState(Promise.resolve("ready"), "initial");
			const base: UseAsyncStateReturnBase<Item, [string, number]> = asyncState;

			expectTypeOf(source).toMatchTypeOf<
				UseAsyncStateSource<Item, [string, number]>
			>();
			expectTypeOf(asyncState).toEqualTypeOf<
				UseAsyncStateReturn<Item, [string, number]>
			>();
			expectTypeOf(base.state).toEqualTypeOf<ReadonlySignal<Item>>();
			expectTypeOf(asyncState.state).toEqualTypeOf<ReadonlySignal<Item>>();
			expectTypeOf(asyncState.isReady).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(asyncState.isLoading).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(asyncState.error).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(asyncState.execute(0, "ready", 1)).toEqualTypeOf<
				Promise<Item | undefined>
			>();
			expectTypeOf(asyncState.executeImmediate("ready", 1)).toEqualTypeOf<
				Promise<Item | undefined>
			>();
			expectTypeOf(promiseState).toEqualTypeOf<
				UseAsyncStateReturn<string, []>
			>();
			// @ts-expect-error state is readonly
			asyncState.state.value = { id: "next", count: 1 };
			// @ts-expect-error isReady is readonly
			asyncState.isReady.value = true;
			// @ts-expect-error Promise source does not accept execute params
			promiseState.execute(0, "unused");
			// @ts-expect-error action params must match
			asyncState.execute(0, 1, "ready");
			// @ts-expect-error delay must be a number
			useAsyncState(action, initial, { delay: "slow" });
		});
	});

	it("types base64 values and options", () => {
		typeOnly(() => {
			const text = signal("hello");
			const windowTarget = signal<UseBase64WindowLike | undefined>(undefined);
			const options: UseBase64Options = {
				dataUrl: false,
				window: windowTarget,
			};
			const imageOptions: UseBase64ImageOptions = {
				type: "image/jpeg",
				quality: 0.8,
			};
			const objectOptions: UseBase64ObjectOptions<{ id: number }> = {
				serializer(value) {
					expectTypeOf(value).toEqualTypeOf<{ id: number }>();
					return JSON.stringify(value);
				},
			};
			const source: UseBase64Source = new Set([1]);
			const result = useBase64(text, options);
			const getterResult = useBase64(() => new Map<string, unknown>(), {
				serializer(value) {
					expectTypeOf(value).toEqualTypeOf<Map<string, unknown>>();
					return JSON.stringify(Object.fromEntries(value));
				},
			});
			const blobResult = useBase64(new Blob(["hello"]));
			const bufferResult = useBase64(new Uint8Array([1]).buffer);
			const canvasResult = useBase64(
				document.createElement("canvas"),
				imageOptions,
			);
			const objectResult = useBase64({ id: 1 }, objectOptions);
			const returnValue: UseBase64Return = result;

			expectTypeOf(source).toMatchTypeOf<UseBase64Source>();
			expectTypeOf(result).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(returnValue.base64).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.base64).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.promise).toEqualTypeOf<
				ReadonlySignal<Promise<string> | undefined>
			>();
			expectTypeOf(result.execute()).toEqualTypeOf<Promise<string>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(blobResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(bufferResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(canvasResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(objectResult).toEqualTypeOf<UseBase64Return>();
			// @ts-expect-error base64 is readonly
			result.base64.value = "next";
			// @ts-expect-error promise is readonly
			result.promise.value = Promise.resolve("next");
			// @ts-expect-error dataUrl must be boolean
			useBase64("hello", { dataUrl: "false" });
			// @ts-expect-error string sources do not accept image options
			useBase64("hello", { type: "image/png" });
			// @ts-expect-error quality must be a number
			useBase64(document.createElement("canvas"), { quality: "high" });
			// @ts-expect-error serializers must return strings
			useBase64({ id: 1 }, { serializer: () => 1 });
		});
	});

	it("types battery values and options", () => {
		typeOnly(() => {
			class TypedBattery extends EventTarget implements BatteryManagerLike {
				charging = true;
				chargingTime = 0;
				dischargingTime = Number.POSITIVE_INFINITY;
				level = 1;
			}
			const manager = new TypedBattery();
			const navigator: BatteryNavigatorLike = {
				getBattery: () => Promise.resolve(manager),
			};
			const options: UseBatteryOptions<BatteryNavigatorLike> = {
				navigator: signal(navigator),
			};
			const result = useBattery(options);
			const fallback = useBattery({ navigator: null });
			const returnValue: UseBatteryReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseBatteryReturn>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.charging).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.chargingTime).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(result.dischargingTime).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(result.level).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseBatteryReturn>();
			// @ts-expect-error returned values are readonly signals
			result.level.value = 0.5;
			const invalidOptions: UseBatteryOptions<BatteryNavigatorLike> = {
				// @ts-expect-error getBattery must return a promise
				navigator: { getBattery: () => manager },
			};
			useBattery(invalidOptions);
		});
	});

	it("types bluetooth values and options", () => {
		typeOnly(() => {
			class TypedCharacteristic
				extends EventTarget
				implements BluetoothRemoteGATTCharacteristicLike
			{
				readValue = () => Promise.resolve(new DataView(new ArrayBuffer(1)));
			}
			class TypedService implements BluetoothRemoteGATTServiceLike {
				getCharacteristic = (_characteristic: BluetoothServiceUUIDLike) =>
					Promise.resolve(new TypedCharacteristic());
			}
			class TypedServer implements BluetoothRemoteGATTServerLike {
				connected = true;
				connect = () => Promise.resolve(this);
				disconnect() {}
				getPrimaryService = (_service: BluetoothServiceUUIDLike) =>
					Promise.resolve(new TypedService());
			}
			class TypedDevice extends EventTarget implements BluetoothDeviceLike {
				id = "device";
				name = "Device";
				gatt = new TypedServer();
			}
			class TypedBluetooth extends EventTarget implements BluetoothLike {
				getAvailability = () => Promise.resolve(true);
				getDevices = () => Promise.resolve([new TypedDevice()]);
				requestDevice = (_options?: BluetoothRequestDeviceOptionsLike) =>
					Promise.resolve(new TypedDevice());
			}
			const filter: BluetoothLEScanFilterLike = {
				namePrefix: "Sigrea",
				services: ["battery_service", 0x180f],
			};
			const navigator: BluetoothNavigatorLike = {
				bluetooth: new TypedBluetooth(),
			};
			const options: UseBluetoothOptions<BluetoothNavigatorLike> = {
				acceptAllDevices: signal(false),
				filters: signal([filter]),
				navigator: signal(navigator),
				optionalServices: ["battery_service"],
			};
			const result = useBluetooth(options);
			const fallback = useBluetooth({ navigator: null });
			const returnValue: UseBluetoothReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseBluetoothReturn>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isConnected).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.device).toEqualTypeOf<
				ReadonlySignal<BluetoothDeviceLike | undefined>
			>();
			expectTypeOf(result.server).toEqualTypeOf<
				ReadonlySignal<BluetoothRemoteGATTServerLike | undefined>
			>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.requestDevice()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.connect()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.disconnect()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseBluetoothReturn>();
			// @ts-expect-error returned values are readonly signals
			result.device.value = new TypedDevice();
			// @ts-expect-error acceptAllDevices must be boolean
			useBluetooth({ acceptAllDevices: "true" });
			// @ts-expect-error optional services must be service UUID values
			useBluetooth({ optionalServices: [false] });
			// @ts-expect-error filters must use Bluetooth scan filter fields
			useBluetooth({ filters: [{ unknown: true }] });
			const invalidOptions: UseBluetoothOptions<BluetoothNavigatorLike> = {
				// @ts-expect-error requestDevice must return a promise
				navigator: { bluetooth: { requestDevice: () => new TypedDevice() } },
			};
			useBluetooth(invalidOptions);
		});
	});

	it("types broadcast channel values and options", () => {
		typeOnly(() => {
			class TypedBroadcastChannel
				extends EventTarget
				implements BroadcastChannelLike
			{
				constructor(readonly name: string) {
					super();
				}

				close() {}
				postMessage(_message: unknown) {}
			}

			const name = signal("sigrea");
			const windowTarget: BroadcastChannelWindowLike = {
				BroadcastChannel: TypedBroadcastChannel,
			} as BroadcastChannelWindowLike;
			const options: UseBroadcastChannelOptions<BroadcastChannelWindowLike> = {
				name,
				window: signal(windowTarget),
			};
			const result = useBroadcastChannel<string, string>(options);
			const fallback = useBroadcastChannel({ name: "fallback", window: null });
			const returnValue: UseBroadcastChannelReturn<string, string> = result;

			expectTypeOf(result).toEqualTypeOf<
				UseBroadcastChannelReturn<string, string>
			>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isClosed).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.channel).toEqualTypeOf<
				ReadonlySignal<BroadcastChannelLike | undefined>
			>();
			expectTypeOf(result.data).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.postMessage("ready")).toEqualTypeOf<void>();
			expectTypeOf(result.close()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<
				UseBroadcastChannelReturn<unknown, unknown>
			>();
			// @ts-expect-error returned values are readonly signals
			result.data.value = "next";
			// @ts-expect-error name must be a string
			useBroadcastChannel({ name: 1 });
			// @ts-expect-error payload must match the configured type
			result.postMessage(1);
			const invalidOptions: UseBroadcastChannelOptions<BroadcastChannelWindowLike> =
				{
					name: "invalid",
					// @ts-expect-error BroadcastChannel must be a constructor
					window: { BroadcastChannel: () => new TypedBroadcastChannel("x") },
				};
			useBroadcastChannel(invalidOptions);
		});
	});

	it("types browser location values and options", () => {
		typeOnly(() => {
			const location: BrowserLocationLike = {
				hash: "#start",
				host: "example.com",
				hostname: "example.com",
				href: "https://example.com/start#start",
				origin: "https://example.com",
				pathname: "/start",
				port: "",
				protocol: "https:",
				search: "",
			};
			const history: BrowserLocationHistoryLike = {
				state: { page: "start" },
				length: 2,
			};
			const property: BrowserLocationWritableProperty = "href";
			const trigger: BrowserLocationTrigger = "load";
			const windowTarget: BrowserLocationWindowLike = {
				location,
				history,
			} as BrowserLocationWindowLike;
			const options: UseBrowserLocationOptions<BrowserLocationWindowLike> = {
				window: signal(windowTarget),
			};
			const result = useBrowserLocation(options);
			const fallback = useBrowserLocation({ window: null });
			const returnValue: UseBrowserLocationReturn = result;

			expectTypeOf(property).toMatchTypeOf<BrowserLocationWritableProperty>();
			expectTypeOf(trigger).toMatchTypeOf<BrowserLocationTrigger>();
			expectTypeOf(result).toEqualTypeOf<UseBrowserLocationReturn>();
			expectTypeOf(fallback).toEqualTypeOf<UseBrowserLocationReturn>();
			expectTypeOf(returnValue.trigger).toEqualTypeOf<
				ReadonlySignal<BrowserLocationTrigger>
			>();
			expectTypeOf(result.state).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(result.length).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(result.origin).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(result.hash).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.host).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.hostname).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.href).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.pathname).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.port).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.protocol).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.search).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			result.hash.value = "#next";
			result.href.value = "https://example.com/next";
			// @ts-expect-error returned trigger is a readonly signal
			result.trigger.value = "popstate";
			// @ts-expect-error origin is a readonly signal
			result.origin.value = "https://example.org";
			// @ts-expect-error origin is not a writable location property
			const invalidProperty: BrowserLocationWritableProperty = "origin";
			expectTypeOf(
				invalidProperty,
			).toEqualTypeOf<BrowserLocationWritableProperty>();
			const invalidLocation: BrowserLocationLike = {
				...location,
				// @ts-expect-error writable location fields must be strings
				hash: 1,
			};
			expectTypeOf(invalidLocation).toEqualTypeOf<BrowserLocationLike>();
		});
	});

	it("types cached values and options", () => {
		typeOnly(() => {
			const source = signal({ value: 1, extra: "initial" });
			const readonlySource = readonly(source);
			const comparator: UseCachedComparator<{
				value: number;
				extra: string;
			}> = (newSourceValue, cachedValue) =>
				newSourceValue.value === cachedValue.value;
			const options: UseCachedOptions = {
				deep: true,
				flush: "sync",
			};
			const invalidOptions: UseCachedOptions = {
				// @ts-expect-error Vue deepRefs option is not part of the Sigrea API
				deepRefs: true,
			};
			const result = useCached(source, comparator, options);
			const readonlyResult = useCached(readonlySource, comparator);
			const getterResult = useCached(() => source.value.value);
			const returnValue: UseCachedReturn<{ value: number; extra: string }> =
				result;

			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<{ value: number; extra: string }>
			>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				ReadonlySignal<{ value: number; extra: string }>
			>();
			expectTypeOf(getterResult).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(returnValue).toEqualTypeOf<
				UseCachedReturn<{ value: number; extra: string }>
			>();
			expectTypeOf(comparator).toEqualTypeOf<
				UseCachedComparator<{ value: number; extra: string }>
			>();
			expectTypeOf(invalidOptions).toEqualTypeOf<UseCachedOptions>();

			// @ts-expect-error cached value is readonly
			result.value = { value: 2, extra: "manual" };
			// @ts-expect-error cached value must match the source value type
			result.value = { value: "2", extra: "manual" };
			// @ts-expect-error comparator receives the source value type
			useCached(source, (newSourceValue: string) => newSourceValue.length > 0);
			// @ts-expect-error source must be reactive or a getter
			useCached(1);
		});
	});

	it("types clipboard values and options", () => {
		typeOnly(() => {
			class TypedWindow extends EventTarget implements UseClipboardWindowLike {}
			const textarea: ClipboardTextareaLike = {
				value: "",
				style: {},
				remove() {},
				select() {},
				setAttribute(_name, _value) {},
			};
			const body: ClipboardDocumentBodyLike = {
				appendChild(_node) {},
			};
			const document: ClipboardDocumentLike = {
				body,
				createElement: (_tagName) => textarea,
				execCommand: (_command) => true,
			} as ClipboardDocumentLike;
			const nativeDocument: Document = globalThis.document;
			const nativeDocumentOptions: UseClipboardOptions<
				undefined,
				ClipboardNavigatorLike,
				Document,
				TypedWindow
			> = {
				document: nativeDocument,
				legacy: true,
			};
			const clipboard: ClipboardLike = {
				readText: async () => "current",
				writeText: async (_data) => {},
			};
			const navigator: ClipboardNavigatorLike = {
				clipboard,
			};
			const source = signal("copy me");
			const textSource: UseClipboardTextSource = source;
			const options: UseClipboardOptions<
				UseClipboardTextSource,
				ClipboardNavigatorLike,
				ClipboardDocumentLike,
				TypedWindow
			> = {
				copiedDuring: signal(100),
				document,
				legacy: true,
				navigator: signal(navigator),
				read: true,
				source: textSource,
				window: new TypedWindow(),
			};
			const result = useClipboard(options);
			const nativeDocumentResult = useClipboard(nativeDocumentOptions);
			const nativeDocumentDirectResult = useClipboard({
				document: nativeDocument,
				legacy: true,
			});
			const requiredCopy = useClipboard({ navigator: null });
			const returnValue: UseClipboardReturn<true> = result;
			const optionalCopy: UseClipboardCopyFn<true> = result.copy;
			const requiredCopyFn: UseClipboardCopyFn<false> = requiredCopy.copy;

			expectTypeOf(result).toEqualTypeOf<UseClipboardReturn<true>>();
			expectTypeOf(nativeDocumentResult).toEqualTypeOf<
				UseClipboardReturn<false>
			>();
			expectTypeOf(nativeDocumentDirectResult).toEqualTypeOf<
				UseClipboardReturn<false>
			>();
			expectTypeOf(requiredCopy).toEqualTypeOf<UseClipboardReturn<false>>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.text).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.copied).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.isCopying).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.copy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(optionalCopy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopy.copy("value")).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopyFn("value")).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.read()).toEqualTypeOf<Promise<string | undefined>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			// @ts-expect-error copied state is readonly
			result.copied.value = true;
			// @ts-expect-error copy value must be text-like
			result.copy(1);
			// @ts-expect-error async providers are left to useClipboardItems
			result.copy(async () => "async");
			// @ts-expect-error source-less clipboard copy needs a value
			requiredCopy.copy();
			// @ts-expect-error Vue copyPending name is not part of the Sigrea API
			result.copyPending;
			// @ts-expect-error navigator.clipboard.writeText must return a promise
			const invalidClipboard: ClipboardLike = { writeText: (_data) => {} };
			expectTypeOf(invalidClipboard).toEqualTypeOf<ClipboardLike>();
		});
	});

	it("types clipboard item values and options", () => {
		typeOnly(() => {
			class TypedWindow
				extends EventTarget
				implements UseClipboardItemsWindowLike {}
			const presentationStyle: ClipboardItemPresentationStyleLike = "inline";
			const item: ClipboardItemLike = {
				presentationStyle,
				types: ["text/plain"] as const,
				getType: async (type) => new Blob(["copy me"], { type }),
			};
			const clipboard: ClipboardLike = {
				read: async () => [item],
				write: async (_items) => {},
			};
			const navigator: ClipboardNavigatorLike = {
				clipboard,
			};
			const source = signal([item] as const);
			const itemSource: UseClipboardItemsSource = source;
			const options: UseClipboardItemsOptions<
				UseClipboardItemsSource,
				ClipboardNavigatorLike,
				TypedWindow
			> = {
				copiedDuring: signal(100),
				navigator: signal(navigator),
				read: true,
				source: itemSource,
				window: new TypedWindow(),
			};
			const result = useClipboardItems(options);
			const requiredCopy = useClipboardItems({ navigator: null });
			const returnValue: UseClipboardItemsReturn<true> = result;
			const optionalCopy: UseClipboardItemsCopyFn<true> = result.copy;
			const requiredCopyFn: UseClipboardItemsCopyFn<false> = requiredCopy.copy;

			expectTypeOf(result).toEqualTypeOf<UseClipboardItemsReturn<true>>();
			expectTypeOf(requiredCopy).toEqualTypeOf<
				UseClipboardItemsReturn<false>
			>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.items).toEqualTypeOf<
				ReadonlySignal<readonly ClipboardItemLike[]>
			>();
			expectTypeOf(result.copied).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.isCopying).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.copy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(optionalCopy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopy.copy([item])).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopyFn([item])).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.read()).toEqualTypeOf<
				Promise<readonly ClipboardItemLike[] | undefined>
			>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			// @ts-expect-error copied state is readonly
			result.copied.value = true;
			// @ts-expect-error VueUse content name is not part of the Sigrea API
			result.content;
			// @ts-expect-error Vue copyPending name is not part of the Sigrea API
			result.copyPending;
			// @ts-expect-error source-less clipboard item copy needs items
			requiredCopy.copy();
			// @ts-expect-error text values are handled by useClipboard
			result.copy("text");
			// @ts-expect-error legacy fallback is not available for ClipboardItem data
			useClipboardItems({ legacy: true, navigator });
			// @ts-expect-error document fallback is not available for ClipboardItem data
			useClipboardItems({ document: {}, navigator });
			const invalidItem: ClipboardItemLike = {
				types: ["text/plain"],
				// @ts-expect-error getType must return a promise
				getType: (_type) => new Blob(),
			};
			expectTypeOf(invalidItem).toEqualTypeOf<ClipboardItemLike>();
			// @ts-expect-error navigator.clipboard.write must return a promise
			const invalidClipboard: ClipboardLike = { write: (_items) => {} };
			expectTypeOf(invalidClipboard).toEqualTypeOf<ClipboardLike>();
		});
	});

	it("types cloned values and options", () => {
		typeOnly(() => {
			const source = signal({ count: 1 });
			const historyClone: CloneFn<PromiseLike<number>> = (value) => value;
			const clonedClone: UseClonedCloneFn<{ count: number }> = (value) => value;
			const options: UseClonedOptions<
				{ count: number },
				{ count: number; copied: boolean }
			> = {
				clone: (value) => ({ ...value, copied: true }),
				deep: true,
				flush: "sync",
				manual: true,
			};
			const result = useCloned(source, options);
			const rawResult = useCloned({ count: 1 });
			const getterResult = useCloned(() => source.value);
			const structured = cloneStructured({ count: 1 });
			const returnValue: UseClonedReturn<{
				count: number;
				copied: boolean;
			}> = result;

			expectTypeOf(result).toEqualTypeOf<
				UseClonedReturn<{ count: number; copied: boolean }>
			>();
			expectTypeOf(rawResult.cloned).toEqualTypeOf<Signal<{ count: number }>>();
			expectTypeOf(getterResult.cloned).toEqualTypeOf<
				Signal<{ count: number }>
			>();
			expectTypeOf(returnValue.isModified).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.cloned).toEqualTypeOf<
				Signal<{ count: number; copied: boolean }>
			>();
			expectTypeOf(result.cloned.value.copied).toEqualTypeOf<boolean>();
			expectTypeOf(result.sync()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(structured).toEqualTypeOf<{ count: number }>();
			expectTypeOf(historyClone).toEqualTypeOf<CloneFn<PromiseLike<number>>>();
			expectTypeOf(clonedClone).toEqualTypeOf<
				UseClonedCloneFn<{ count: number }>
			>();

			result.cloned.value = { count: 2, copied: false };
			// @ts-expect-error isModified is readonly
			result.isModified.value = true;
			// @ts-expect-error clone must be synchronous
			useCloned(source, { clone: async (value) => value });
			const invalidOptions: UseClonedOptions<{ count: number }> = {
				// @ts-expect-error immediate is intentionally not part of the Sigrea API
				immediate: false,
			};
			expectTypeOf(invalidOptions).toEqualTypeOf<
				UseClonedOptions<{ count: number }>
			>();
			// @ts-expect-error Vue ref name is not part of the Sigrea API
			result.ref;
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

	it("types array difference values", () => {
		typeOnly(() => {
			const list = signal([1, 2, 3]);
			const readonlyList = readonly(signal([1, 2, 3]));
			const values = computed(() => [2]);
			const getter = () => [1];
			const options: UseArrayDifferenceOptions = {
				symmetric: true,
			};
			const compare: UseArrayDifferenceCompareFn<number> = (
				value,
				otherValue,
			) => value === otherValue;
			const result = useArrayDifference(list, values);
			const readonlyResult = useArrayDifference(readonlyList, getter);
			const compared = useArrayDifference(list, values, compare, options);
			const keyed = useArrayDifference(
				signal([{ id: 1 }, { id: 2 }]),
				signal([{ id: 2 }]),
				"id",
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayDifferenceReturn<number>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number[]>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayDifferenceReturn<number>
			>();
			expectTypeOf(compared.value).toEqualTypeOf<number[]>();
			expectTypeOf(keyed.value).toEqualTypeOf<{ id: number }[]>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error primitive values do not have this comparison key
			useArrayDifference(signal([1]), signal([1]), "id");
			// @ts-expect-error object comparison key must exist
			useArrayDifference(signal([{ id: 1 }]), signal([{ id: 1 }]), "name");
			// @ts-expect-error comparison function must return boolean
			useArrayDifference(signal([1]), signal([1]), () => "matched");
		});
	});

	it("types array every values", () => {
		typeOnly(() => {
			const first = signal(2);
			const second = computed(() => 4);
			const third = signal(6);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayEveryPredicate<number> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<readonly MaybeValue<number>[]>();
				return element % 2 === 0;
			};
			const result = useArrayEvery(list, predicate);
			const getterResult = useArrayEvery(
				() => [1, 2, 3],
				(value) => {
					expectTypeOf(value).toEqualTypeOf<number>();
					return value > 0;
				},
			);
			const rawResult = useArrayEvery(rawList, (value) => value > 0);
			const readonlyResult = useArrayEvery(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayEveryReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error predicate element type must match the array item type
			useArrayEvery(signal([1]), (value: string) => value.length > 0);
			useArrayEvery(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayEvery(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array some values", () => {
		typeOnly(() => {
			const first = signal(2);
			const second = computed(() => 4);
			const third = signal(6);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArraySomePredicate<number> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<readonly MaybeValue<number>[]>();
				return element > 3;
			};
			const result = useArraySome(list, predicate);
			const getterResult = useArraySome(
				() => [1, 2, 3],
				(value) => {
					expectTypeOf(value).toEqualTypeOf<number>();
					return value > 2;
				},
			);
			const rawResult = useArraySome(rawList, (value) => value > 2);
			const readonlyResult = useArraySome(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArraySomeReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error predicate element type must match the array item type
			useArraySome(signal([1]), (value: string) => value.length > 0);
			useArraySome(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArraySome(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array unique values", () => {
		typeOnly(() => {
			interface Item {
				id: number;
				name: string;
			}
			const first = signal<Item>({ id: 1, name: "foo" });
			const second = computed<Item>(() => ({ id: 2, name: "bar" }));
			const third = signal<Item>({ id: 1, name: "baz" });
			const list = signal([first, second, () => third.value]);
			const rawList: Item[] = [
				{ id: 1, name: "foo" },
				{ id: 1, name: "bar" },
			];
			const compare: UseArrayUniqueCompareFn<Item> = (
				value,
				otherValue,
				array,
			) => {
				expectTypeOf(value).toEqualTypeOf<Item>();
				expectTypeOf(otherValue).toEqualTypeOf<Item>();
				expectTypeOf(array).toEqualTypeOf<Item[]>();
				return value.id === otherValue.id;
			};
			const result = useArrayUnique(list, compare);
			const getterResult = useArrayUnique(() => rawList, compare);
			const rawResult = useArrayUnique(rawList);
			const readonlyResult = useArrayUnique(readonly(list), compare);

			expectTypeOf(result).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<Item[]>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error comparison function must return boolean
			useArrayUnique(signal([1]), () => "matched");
			useArrayUnique(
				signal([1]),
				// @ts-expect-error comparison is a raw function, not a signal
				signal((value: number, otherValue: number) => value === otherValue),
			);
			useArrayUnique(
				signal([1]),
				// @ts-expect-error comparison is a raw function, not a computed value
				computed(() => (value: number, otherValue: number) => {
					return value === otherValue;
				}),
			);
		});
	});

	it("types array filter values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList: Array<number | string> = [1, "ready"];
			const predicate: UseArrayFilterPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<Array<number | null>>();
				return element != null;
			};
			const result = useArrayFilter(list, predicate);
			const narrowed = useArrayFilter(rawList, (value): value is number => {
				return typeof value === "number";
			});
			const getterResult = useArrayFilter(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFilter(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFilterReturn<number | null>>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<Array<number | null>>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFilterReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number[]>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFilterReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFilterReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error predicate element type must match the array item type
			useArrayFilter(signal([1]), (value: string) => value.length > 0);
			useArrayFilter(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFilter(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList: Array<number | string> = [1, "ready"];
			const predicate: UseArrayFindPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFind(list, predicate);
			const narrowed = useArrayFind(rawList, (value): value is number => {
				return typeof value === "number";
			});
			const getterResult = useArrayFind(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFind(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFindReturn<number | null>>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<number | null | undefined>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFindReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFindReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFindReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFind(signal([1]), (value: string) => value.length > 0);
			useArrayFind(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFind(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find index values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayFindIndexPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFindIndex(list, predicate);
			const rawResult = useArrayFindIndex(rawList, (value) => value > 1);
			const getterResult = useArrayFindIndex(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFindIndex(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFindIndex(signal([1]), (value: string) => value.length > 0);
			useArrayFindIndex(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFindIndex(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find last values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayFindLastPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFindLast(list, predicate);
			const narrowed = useArrayFindLast(
				list,
				(element): element is number => element != null,
			);
			const rawResult = useArrayFindLast(rawList, (value) => value > 1);
			const getterResult = useArrayFindLast(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFindLast(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<
				UseArrayFindLastReturn<number | null>
			>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<number | null | undefined>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFindLastReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayFindLastReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<
				UseArrayFindLastReturn<number>
			>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFindLastReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFindLast(signal([1]), (value: string) => value.length > 0);
			useArrayFindLast(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFindLast(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array includes values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const search = signal<number | null>(3);
			const comparator: UseArrayIncludesComparatorFn<number | null> = (
				element,
				value,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(value).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element === value;
			};
			const keyedOptions: UseArrayIncludesOptions<{ id: number }, number> = {
				fromIndex: signal(1),
				comparator: "id",
			};
			const functionOptions: UseArrayIncludesOptions<
				{ id: number },
				{ id: number }
			> = {
				comparator: (element, value) => element.id === value.id,
			};
			const result = useArrayIncludes(list, search, comparator);
			const rawResult = useArrayIncludes(rawList, 2);
			const getterResult = useArrayIncludes(
				() => [1, 2, 3],
				() => 2,
			);
			const readonlyResult = useArrayIncludes(readonly(list), search);
			const keyed = useArrayIncludes([{ id: 1 }], 1, "id");
			const keyedWithOptions = useArrayIncludes(
				[{ id: 1 }, { id: 2 }],
				signal(2),
				keyedOptions,
			);
			const compared = useArrayIncludes(
				[{ id: 1 }],
				{ id: 1 },
				functionOptions,
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(keyed).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(keyedWithOptions).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(compared).toEqualTypeOf<UseArrayIncludesReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error comparator must return boolean
			useArrayIncludes(signal([1]), signal(1), () => "matched");
			// @ts-expect-error key comparator must exist on the array item type
			useArrayIncludes(signal([{ id: 1 }]), signal(1), "name");
			useArrayIncludes(
				signal([{ id: 1 }]),
				signal(1),
				// @ts-expect-error options key comparator must exist on the array item type
				{ comparator: "name" },
			);
			useArrayIncludes(signal([1]), signal(1), {
				// @ts-expect-error options comparator must be raw, not a signal
				comparator: signal(
					(element: number, value: number) => element === value,
				),
			});
			useArrayIncludes(signal([1]), signal(1), {
				// @ts-expect-error options comparator must be raw, not a computed value
				comparator: computed(
					() => (element: number, value: number) => element === value,
				),
			});
		});
	});

	it("types array join values", () => {
		typeOnly(() => {
			const first = signal<string | null>("foo");
			const second = computed<number | undefined>(() => 1);
			const third = signal("bar");
			const list = signal([first, second, () => third.value]);
			const separator = signal<string | undefined>("-");
			const result = useArrayJoin(list, separator);
			const rawResult = useArrayJoin(["foo", 1, null]);
			const getterResult = useArrayJoin(
				() => ["foo", "bar"],
				() => separator.value,
			);
			const readonlyResult = useArrayJoin(readonly(list), separator);

			expectTypeOf(result).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayJoinReturn>();
			// @ts-expect-error returned value is readonly
			result.value = "next";
			// @ts-expect-error separator must resolve to string or undefined
			useArrayJoin(signal([1]), signal(1));
			// @ts-expect-error separator must resolve to string or undefined
			useArrayJoin(signal([1]), () => 1);
		});
	});

	it("types array map values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const callback: UseArrayMapCallback<number | null, string> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<(number | null)[]>();
				return `${index}:${element}`;
			};
			const result = useArrayMap(list, callback);
			const rawResult = useArrayMap(rawList, (value) => value * 2);
			const getterResult = useArrayMap(
				() => [1, 2, 3],
				(value) => value.toString(),
			);
			const readonlyResult = useArrayMap(readonly(list), callback);
			const objectResult = useArrayMap(rawList, (value) => ({ value }));

			expectTypeOf(result).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string[]>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayMapReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(objectResult).toEqualTypeOf<
				UseArrayMapReturn<{ value: number }>
			>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error callback element type must match the array item type
			useArrayMap(signal([1]), (value: string) => value.length);
			useArrayMap(
				signal([1]),
				// @ts-expect-error callback is a raw function, not a signal
				signal((value: number) => value * 2),
			);
			useArrayMap(
				signal([1]),
				// @ts-expect-error callback is a raw function, not a computed value
				computed(() => (value: number) => value * 2),
			);
		});
	});

	it("types array reduce values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const reducer: UseArrayReduceReducer<number, number | null, number> = (
				sum,
				element,
				index,
			) => {
				expectTypeOf(sum).toEqualTypeOf<number>();
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				return sum + (element ?? 0);
			};
			const result = useArrayReduce(list, reducer, signal(0));
			const rawResult = useArrayReduce(rawList, (sum, value) => sum + value);
			const getterResult = useArrayReduce(
				() => [1, 2, 3],
				(sum, value) => sum + value,
				() => 0,
			);
			const readonlyResult = useArrayReduce(readonly(list), reducer, 0);
			const stringResult = useArrayReduce(
				rawList,
				(text, value) => `${text}:${value}`,
				"start",
			);
			const undefinedInitial = useArrayReduce<number, number | undefined>(
				rawList,
				(sum, value) => (sum ?? 0) + value,
				undefined,
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayReduceReturn<number>
			>();
			expectTypeOf(stringResult).toEqualTypeOf<UseArrayReduceReturn<string>>();
			expectTypeOf(undefinedInitial).toEqualTypeOf<
				UseArrayReduceReturn<number | undefined>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error reducer element type must match the array item type
			useArrayReduce(signal([1]), (sum: string, value: string) => sum + value);
			useArrayReduce(
				signal([1]),
				// @ts-expect-error reducer is a raw function, not a signal
				signal((sum: number, value: number) => sum + value),
			);
			useArrayReduce(
				signal([1]),
				// @ts-expect-error reducer is a raw function, not a computed value
				computed(() => (sum: number, value: number) => sum + value),
			);
			useArrayReduce(
				signal([1]),
				(sum: string, value) => `${sum}:${value}`,
				// @ts-expect-error reducer return type must match the initial value type
				0,
			);
			useArrayReduce(
				signal([1]),
				(sum: number, value) => sum + value,
				// @ts-expect-error reducer accumulator type must match the initial value type
				"start",
			);
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

	it("types confirm dialogs", () => {
		typeOnly(() => {
			interface OpenData {
				id: string;
			}
			interface ConfirmData {
				accepted: true;
			}
			interface CancelData {
				reason: string;
			}

			const isOpen = signal(false);
			const dialog = useConfirmDialog<OpenData, ConfirmData, CancelData>(
				isOpen,
			);
			const internalDialog = useConfirmDialog();
			const result = {} as UseConfirmDialogResult<ConfirmData, CancelData>;

			dialog.onOpen((data) => {
				expectTypeOf(data).toEqualTypeOf<OpenData | undefined>();
			});
			dialog.onConfirm((data) => {
				expectTypeOf(data).toEqualTypeOf<ConfirmData | undefined>();
			});
			dialog.onCancel((data) => {
				expectTypeOf(data).toEqualTypeOf<CancelData | undefined>();
			});

			expectTypeOf(dialog).toEqualTypeOf<
				UseConfirmDialogReturn<OpenData, ConfirmData, CancelData>
			>();
			expectTypeOf(dialog.isOpen).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(dialog.open({ id: "item" })).toEqualTypeOf<
				Promise<UseConfirmDialogResult<ConfirmData, CancelData>>
			>();
			expectTypeOf(internalDialog).toEqualTypeOf<UseConfirmDialogReturn>();

			dialog.open();
			dialog.confirm({ accepted: true });
			dialog.cancel({ reason: "dismissed" });

			if (result.isCanceled) {
				expectTypeOf(result.data).toEqualTypeOf<CancelData | undefined>();
			} else {
				expectTypeOf(result.data).toEqualTypeOf<ConfirmData | undefined>();
			}

			// @ts-expect-error isOpen is readonly
			dialog.isOpen.value = true;
			// @ts-expect-error open data must match
			dialog.open({ id: 1 });
			// @ts-expect-error confirm data must match
			dialog.confirm({ accepted: false });
			// @ts-expect-error cancel data must match
			dialog.cancel({ reason: 1 });
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

	it("types reactive computed objects", () => {
		typeOnly(() => {
			const count = signal(1);
			const nestedSignal = signal({ inner: signal(1) });
			const getter: ReactiveComputedGetter<{
				count: Signal<number>;
				label: string;
				nested: { ready: boolean };
				nestedSignal: Signal<{ inner: Signal<number> }>;
			}> = (previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					| {
							count: Signal<number>;
							label: string;
							nested: { ready: boolean };
							nestedSignal: Signal<{ inner: Signal<number> }>;
					  }
					| undefined
				>();
				return {
					count,
					label: String(count.value),
					nested: { ready: true },
					nestedSignal,
				};
			};
			const state = reactiveComputed(getter);
			const inlineState = reactiveComputed<{
				count: Signal<number>;
				label: string;
				nested: { ready: boolean };
				nestedSignal: Signal<{ inner: Signal<number> }>;
			}>((previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					| {
							count: Signal<number>;
							label: string;
							nested: { ready: boolean };
							nestedSignal: Signal<{ inner: Signal<number> }>;
					  }
					| undefined
				>();
				return {
					count,
					label: String(count.value),
					nested: { ready: true },
					nestedSignal,
				};
			});
			const inferredPreviousState = reactiveComputed((previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					Record<PropertyKey, unknown> | undefined
				>();
				return {
					count: typeof previous?.count === "number" ? previous.count + 1 : 1,
					nestedSignal,
				};
			});

			expectTypeOf(state).toEqualTypeOf<
				ReactiveComputedReturn<{
					count: Signal<number>;
					label: string;
					nested: { ready: boolean };
					nestedSignal: Signal<{ inner: Signal<number> }>;
				}>
			>();
			expectTypeOf(state).toMatchTypeOf<DeepSignal<object>>();
			expectTypeOf(state.count).toEqualTypeOf<number>();
			expectTypeOf(state.label).toEqualTypeOf<string>();
			expectTypeOf(state.nested.ready).toEqualTypeOf<boolean>();
			expectTypeOf(state.nestedSignal.inner).toEqualTypeOf<number>();
			expectTypeOf(inlineState.count).toEqualTypeOf<number>();
			expectTypeOf(inlineState.nestedSignal.inner).toEqualTypeOf<number>();
			expectTypeOf(inferredPreviousState.count).toEqualTypeOf<number>();
			expectTypeOf(
				inferredPreviousState.nestedSignal.inner,
			).toEqualTypeOf<number>();

			state.count = 2;
			state.nestedSignal.inner = 2;
			// @ts-expect-error signal property unwrap keeps the source value type
			state.count = "2";
			// @ts-expect-error nested signal object unwrap keeps the nested source value type
			state.nestedSignal.inner = "2";
			// @ts-expect-error reactiveComputed only accepts object returns
			reactiveComputed(() => 1);
		});
	});

	it("types reactive omitted objects", () => {
		typeOnly(() => {
			const source = {
				count: signal(1),
				label: "ready",
				hidden: true,
			};
			const readonlySource = {
				readonlyCount: readonly(signal(1)),
				hidden: true,
			};
			const readonlyObjectSource = readonly(
				deepSignal({
					label: "ready",
					hidden: true,
				}),
			);
			const readonlyNestedSource = readonly(
				deepSignal({
					nested: { count: 1 },
					hidden: true,
				}),
			);
			const optionalSource: {
				foo?: string;
				hidden: boolean;
			} = {
				hidden: true,
			};
			const all = reactiveOmit(source);
			const omitted = reactiveOmit(source, "hidden");
			const omittedFromArray = reactiveOmit(source, ["hidden"] as const);
			const readonlyOmitted = reactiveOmit(readonlySource, "hidden");
			const readonlyObjectOmitted = reactiveOmit(
				readonlyObjectSource,
				"hidden",
			);
			const readonlyNestedOmitted = reactiveOmit(
				readonlyNestedSource,
				"hidden",
			);
			const optionalOmitted = reactiveOmit(optionalSource, "hidden");
			const predicate: ReactiveOmitPredicate<typeof source> = (value, key) => {
				expectTypeOf(value).toEqualTypeOf<string | number | boolean>();
				expectTypeOf(key).toEqualTypeOf<"count" | "label" | "hidden">();
				return key === "hidden" || value === "ready";
			};
			const predicateResult = reactiveOmit(source, predicate);

			expectTypeOf(omitted).toEqualTypeOf<
				ReactiveOmitReturn<typeof source, "hidden">
			>();
			expectTypeOf(all).toEqualTypeOf<
				ReactiveOmitReturn<typeof source, never>
			>();
			expectTypeOf(all.count).toEqualTypeOf<number>();
			expectTypeOf(all.hidden).toEqualTypeOf<boolean>();
			expectTypeOf(omitted.count).toEqualTypeOf<number>();
			expectTypeOf(omitted.label).toEqualTypeOf<string>();
			expectTypeOf(omittedFromArray.count).toEqualTypeOf<number>();
			expectTypeOf(readonlyOmitted.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(readonlyObjectOmitted.label).toEqualTypeOf<string>();
			expectTypeOf(readonlyNestedOmitted.nested.count).toEqualTypeOf<number>();
			expectTypeOf(optionalOmitted.foo).toEqualTypeOf<string | undefined>();
			expectTypeOf(predicateResult).toEqualTypeOf<
				ReactiveOmitReturn<typeof source>
			>();
			expectTypeOf(predicateResult.count).toEqualTypeOf<number | undefined>();
			expectTypeOf(predicateResult.label).toEqualTypeOf<string | undefined>();

			omitted.count = 2;
			omitted.label = "next";
			// @ts-expect-error omitted keys are not exposed
			omitted.hidden;
			// @ts-expect-error omitted keys are not exposed from array keys
			omittedFromArray.hidden;
			// @ts-expect-error signal property unwrap keeps the source value type
			omitted.count = "2";
			// @ts-expect-error readonly signal source stays readonly
			readonlyOmitted.readonlyCount = 2;
			// @ts-expect-error readonly object source stays readonly
			readonlyObjectOmitted.label = "next";
			// @ts-expect-error readonly deep signal source stays readonly
			readonlyNestedOmitted.nested.count = 2;
			const optionalTarget: { foo?: string } = optionalOmitted;
			optionalTarget.foo = "next";
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { foo: string | undefined } = optionalOmitted;
		});
	});

	it("types reactive picked objects", () => {
		typeOnly(() => {
			const source = {
				count: signal(1),
				label: "ready",
				hidden: true,
			};
			const readonlySource = {
				readonlyCount: readonly(signal(1)),
				hidden: true,
			};
			const readonlyObjectSource = readonly(
				deepSignal({
					label: "ready",
					hidden: true,
				}),
			);
			const readonlyNestedSource = readonly(
				deepSignal({
					nested: { count: 1 },
					hidden: true,
				}),
			);
			const optionalSource: {
				foo?: string;
				hidden: boolean;
			} = {
				hidden: true,
			};
			const none = reactivePick(source);
			const picked = reactivePick(source, "count", "label");
			const pickedFromArray = reactivePick(source, ["count"] as const);
			const readonlyPicked = reactivePick(readonlySource, "readonlyCount");
			const readonlyObjectPicked = reactivePick(readonlyObjectSource, "label");
			const readonlyNestedPicked = reactivePick(readonlyNestedSource, "nested");
			const optionalPicked = reactivePick(optionalSource, "foo");
			const predicate: ReactivePickPredicate<typeof source> = (value, key) => {
				expectTypeOf(value).toEqualTypeOf<string | number | boolean>();
				expectTypeOf(key).toEqualTypeOf<"count" | "label" | "hidden">();
				return key !== "hidden" && value !== true;
			};
			const predicateResult = reactivePick(source, predicate);

			expectTypeOf(picked).toEqualTypeOf<
				ReactivePickReturn<typeof source, "count" | "label">
			>();
			expectTypeOf(none).toEqualTypeOf<
				ReactivePickReturn<typeof source, never>
			>();
			expectTypeOf(picked.count).toEqualTypeOf<number>();
			expectTypeOf(picked.label).toEqualTypeOf<string>();
			expectTypeOf(pickedFromArray.count).toEqualTypeOf<number>();
			expectTypeOf(readonlyPicked.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(readonlyObjectPicked.label).toEqualTypeOf<string>();
			expectTypeOf(readonlyNestedPicked.nested.count).toEqualTypeOf<number>();
			expectTypeOf(optionalPicked.foo).toEqualTypeOf<string | undefined>();
			expectTypeOf(predicateResult).toEqualTypeOf<
				ReactivePickReturn<typeof source>
			>();
			expectTypeOf(predicateResult.count).toEqualTypeOf<number | undefined>();
			expectTypeOf(predicateResult.label).toEqualTypeOf<string | undefined>();

			picked.count = 2;
			picked.label = "next";
			optionalPicked.foo = "next";
			// @ts-expect-error unpicked keys are not exposed
			picked.hidden;
			// @ts-expect-error unpicked keys are not exposed from array keys
			pickedFromArray.label;
			// @ts-expect-error signal property unwrap keeps the source value type
			picked.count = "2";
			// @ts-expect-error readonly signal source stays readonly
			readonlyPicked.readonlyCount = 2;
			// @ts-expect-error readonly object source stays readonly
			readonlyObjectPicked.label = "next";
			// @ts-expect-error readonly deep signal source stays readonly
			readonlyNestedPicked.nested.count = 2;
			const optionalTarget: { foo?: string } = optionalPicked;
			optionalTarget.foo = "next";
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { foo: string | undefined } = optionalPicked;
		});
	});

	it("types deep signal conversion", () => {
		typeOnly(() => {
			const count = signal(1);
			const readonlyCount = readonly(signal(1));
			const nested = signal({ inner: signal(1) });
			const source = {
				count,
				label: "ready",
				nested,
				readonlyCount,
			};
			const optionalSource: {
				count: Signal<number>;
				optional?: string;
			} = {
				count,
			};
			const state = toDeepSignal(source);
			const signalState = toDeepSignal(signal(source));
			const readonlySignalState = toDeepSignal(readonly(signal(source)));
			const computedState = toDeepSignal(computed(() => source));
			const optionalState = toDeepSignal(optionalSource);

			expectTypeOf(state).toEqualTypeOf<ToDeepSignalReturn<typeof source>>();
			expectTypeOf(signalState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(readonlySignalState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(computedState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(state).toMatchTypeOf<DeepSignal<object>>();
			expectTypeOf(state.count).toEqualTypeOf<number>();
			expectTypeOf(state.label).toEqualTypeOf<string>();
			expectTypeOf(state.nested.inner).toEqualTypeOf<number>();
			expectTypeOf(state.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(optionalState.optional).toEqualTypeOf<string | undefined>();

			state.count = 2;
			state.label = "next";
			state.nested.inner = 2;
			optionalState.optional = "next";
			// @ts-expect-error signal property unwrap keeps the source value type
			state.count = "2";
			// @ts-expect-error nested signal object unwrap keeps the nested source value type
			state.nested.inner = "2";
			// @ts-expect-error readonly signal source stays readonly
			state.readonlyCount = 2;
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { optional: string | undefined } = optionalState;
			expectTypeOf(requiredTarget).toEqualTypeOf<{
				optional: string | undefined;
			}>();
			// @ts-expect-error toDeepSignal only accepts object values
			toDeepSignal(1);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal([1]);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(signal(new Map<string, number>()));
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new Map<string, number>() as ReadonlyMap<string, number>);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new Set<number>() as ReadonlySet<number>);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new ArrayBuffer(8));
		});
	});

	it("types scoped cleanup registration", () => {
		typeOnly(() => {
			const result = tryOnScopeDispose(() => {});

			expectTypeOf(result).toEqualTypeOf<TryOnScopeDisposeReturn>();
			expectTypeOf(result).toEqualTypeOf<boolean>();
			// @ts-expect-error cleanup must be callable
			tryOnScopeDispose("cleanup");
		});
	});

	it("types promised watch conditions", () => {
		typeOnly(() => {
			const count = signal<0 | 1 | 2>(0);
			const values = signal([1, 2] as number[]);
			const options: UntilToMatchOptions = {
				deep: true,
				flush: "sync",
				throwOnTimeout: true,
				timeout: 100,
			};
			const sourceList = until([signal(1), computed(() => 2)]);
			const value = until(count);
			const array = until(values);
			const isOne = (input: 0 | 1 | 2): input is 1 => input === 1;

			expectTypeOf(value).toEqualTypeOf<UntilValueInstance<0 | 1 | 2>>();
			expectTypeOf(value).toMatchTypeOf<UntilBaseInstance<0 | 1 | 2>>();
			expectTypeOf(value.toBe(1 as const, options)).toEqualTypeOf<Promise<1>>();
			expectTypeOf(value.not.toBe(1)).toEqualTypeOf<Promise<0 | 1 | 2>>();
			expectTypeOf(value.toBeTruthy()).toEqualTypeOf<Promise<1 | 2>>();
			expectTypeOf(value.toBeUndefined()).toEqualTypeOf<Promise<undefined>>();
			expectTypeOf(value.not.toBeUndefined()).toEqualTypeOf<
				Promise<0 | 1 | 2>
			>();
			expectTypeOf(value.toMatch(isOne)).toEqualTypeOf<Promise<1>>();
			expectTypeOf(value.not.toMatch(isOne)).toEqualTypeOf<Promise<0 | 2>>();
			expectTypeOf(array).toEqualTypeOf<UntilArrayInstance<number[]>>();
			expectTypeOf(array.toContains(signal(2))).toEqualTypeOf<
				Promise<number[]>
			>();
			expectTypeOf(sourceList.toContains(1)).toEqualTypeOf<
				Promise<[number, number]>
			>();

			// @ts-expect-error condition must be callable
			value.toMatch(1);
			// @ts-expect-error timeout must be numeric
			value.toBe(1, { timeout: "100" });
			// @ts-expect-error contained value must match the array element type
			array.toContains("2");
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

	it("types auto-reset signals", () => {
		typeOnly(() => {
			const defaultText: MaybeValue<string> = () => "idle";
			const delay: MaybeValue<number> = computed(() => 100);
			const text = signalAutoReset(defaultText, delay);
			const count = signalAutoReset(signal(0), signal(100));
			const literal = signalAutoReset<"idle" | "done">("idle", 100);

			expectTypeOf(text).toEqualTypeOf<SignalAutoResetReturn<string>>();
			expectTypeOf(text).toEqualTypeOf<Signal<string>>();
			expectTypeOf(count).toEqualTypeOf<Signal<number>>();
			expectTypeOf(literal).toEqualTypeOf<Signal<"idle" | "done">>();

			text.value = "ready";
			count.value = 1;
			literal.value = "done";
			// @ts-expect-error value type is preserved
			literal.value = "other";
			// @ts-expect-error afterMs must resolve to a number
			signalAutoReset("idle", "100");
		});
	});

	it("types defaulted signals", () => {
		typeOnly(() => {
			const source = signal<string | null | undefined>();
			const createdSource = createSignal<string | undefined, true>(
				undefined,
				true,
			);
			const value = signalDefault(source, "default");
			const createdValue = signalDefault(createdSource, "default");
			const nullValue = signalDefault(source, null);
			const undefinedValue = signalDefault(source, undefined);
			const fallbackFn: () => string = () => "default";
			const functionValue = signalDefault(
				signal<(() => string) | undefined>(),
				fallbackFn,
			);

			expectTypeOf(value).toEqualTypeOf<SignalDefaultReturn<string>>();
			expectTypeOf(value).toEqualTypeOf<Signal<string>>();
			expectTypeOf(createdValue).toEqualTypeOf<SignalDefaultReturn<string>>();
			expectTypeOf(nullValue).toEqualTypeOf<Signal<string | null>>();
			expectTypeOf(undefinedValue).toEqualTypeOf<Signal<string | undefined>>();
			expectTypeOf(functionValue).toMatchTypeOf<Signal<() => string>>();

			value.value = "updated";
			createdValue.value = "updated";
			nullValue.value = null;
			undefinedValue.value = undefined;
			functionValue.value = () => "updated";
			// @ts-expect-error value type is preserved
			value.value = 1;
			// @ts-expect-error default value must match the source value
			signalDefault(source, 1);
			// @ts-expect-error default is a raw value, not a MaybeValue getter
			signalDefault(source, () => "default");
			// @ts-expect-error default is a raw value, not a signal wrapper
			signalDefault(source, signal("default"));
			// @ts-expect-error source must be a writable signal
			signalDefault("source", "default");
			// @ts-expect-error getter sources do not expose a writable target
			signalDefault(() => source.value, "default");
			// @ts-expect-error computed sources do not expose a safe writable target
			signalDefault(
				computed(() => source.value),
				"default",
			);
		});
	});

	it("types synced signals", () => {
		typeOnly(() => {
			const left = signal(1);
			const right = signal(2);
			const countOrText = signal<number | string>(0);
			const text = signal("1");
			const source = signal("source");
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value);
			const options: SyncSignalOptions<number, string> = {
				deep: true,
				direction: "both",
				flush: "sync",
				immediate: true,
				transform: {
					ltr: (value) => value.toString(),
					rtl: (value) => Number(value),
				},
			};
			const leftToRightOptions: SyncSignalOptions<
				number,
				number | string,
				"ltr"
			> = {
				direction: "ltr",
			};
			// @ts-expect-error one-way option types must include their runtime direction
			const missingDirectionOptions: SyncSignalOptions<number, string, "ltr"> =
				{
					transform: {
						ltr: (value) => value.toString(),
					},
				};
			const transform: SyncSignalTransform<number, string> = {
				ltr: (value) => value.toString(),
				rtl: (value) => Number(value),
			};

			expectTypeOf(syncSignal(left, right)).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(
				syncSignal(left, text, options),
			).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(
				syncSignal(left, countOrText, leftToRightOptions),
			).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(missingDirectionOptions).toEqualTypeOf<
				SyncSignalOptions<number, string, "ltr">
			>();
			expectTypeOf(transform.ltr(1)).toEqualTypeOf<string>();
			expectTypeOf(transform.rtl("1")).toEqualTypeOf<number>();
			expectTypeOf<SyncSignalDirection>().toEqualTypeOf<
				"ltr" | "rtl" | "both"
			>();

			syncSignal(left, countOrText, {
				direction: "both",
				transform: {
					rtl: (value) => Number(value),
				},
			});
			syncSignal(left, text, {
				direction: "ltr",
				transform: {
					ltr: (value) => value.toString(),
				},
			});
			// @ts-expect-error different signal value types need a safe transform
			syncSignal(left, text);
			// @ts-expect-error both directions need a right-to-left transform here
			syncSignal(left, countOrText, { direction: "both" });
			// @ts-expect-error right-to-left cannot assign number|string to number
			syncSignal(left, countOrText, { direction: "rtl" });
			syncSignal(left, text, {
				direction: "ltr",
				transform: {
					// @ts-expect-error direction-specific transform keys are enforced
					rtl: (value: string) => Number(value),
				},
			});
			// @ts-expect-error source must be a writable signal
			syncSignal("source", right);
			// @ts-expect-error readonly signals do not expose a writable target
			syncSignal(readonlySource, right);
			// @ts-expect-error computed sources do not expose a safe writable target
			syncSignal(computedSource, right);
		});
	});

	it("types one-way synced signals", () => {
		typeOnly(() => {
			const source = signal(1);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value);
			const getterSource = () => source.value;
			const target = signal(0);
			const otherTarget = signal(2);
			const widerTarget = signal<number | string>(0);
			const textTarget = signal("target");
			const computedTarget = computed(() => target.value);
			const deepSource = deepSignal({ count: 0 });
			const deepTarget = signal(deepSignal({ count: 1 }));
			const options: SyncSignalsOptions = {
				deep: true,
				flush: "sync",
				immediate: true,
			};

			expectTypeOf(
				syncSignals(source, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(source, [target, otherTarget] as const, options),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(source, widerTarget),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(readonlySource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(computedSource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(getterSource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(deepSource, deepTarget),
			).toEqualTypeOf<SyncSignalsReturn>();

			// @ts-expect-error raw values are not watch sources
			syncSignals(1, target);
			// @ts-expect-error target must accept the source value
			syncSignals(source, textTarget);
			// @ts-expect-error computed targets do not expose a safe writable target
			syncSignals(source, computedTarget);
		});
	});

	it("types manual-reset signals", () => {
		typeOnly(() => {
			const defaultText: MaybeValue<string> = () => "idle";
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const text = signalManualReset(defaultText);
			const count = signalManualReset(source);
			const fromReadonly = signalManualReset(readonlySource);
			const fromComputed = signalManualReset(computedSource);
			const literal = signalManualReset<"idle" | "done">("idle");
			const fallbackFn = signal((): string => "default");
			const functionValue = signalManualReset(fallbackFn);
			const getterFunctionValue = signalManualReset(() => fallbackFn.value);
			const rawFunction = (_input: string): string => "default";

			expectTypeOf(text).toEqualTypeOf<SignalManualResetReturn<string>>();
			expectTypeOf(text).toMatchTypeOf<Signal<string>>();
			expectTypeOf(count).toEqualTypeOf<SignalManualResetReturn<number>>();
			expectTypeOf(fromReadonly.value).toEqualTypeOf<number>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(functionValue).toEqualTypeOf<
				SignalManualResetReturn<() => string>
			>();
			expectTypeOf(getterFunctionValue).toEqualTypeOf<
				SignalManualResetReturn<() => string>
			>();
			expectTypeOf(text.reset()).toEqualTypeOf<void>();

			text.value = "ready";
			count.value = 1;
			literal.value = "done";
			functionValue.value = () => "updated";
			getterFunctionValue.value = () => "updated";
			// @ts-expect-error value type is preserved
			literal.value = "other";
			// @ts-expect-error raw function values must be wrapped to avoid getter handling
			signalManualReset(rawFunction);
		});
	});

	it("types debounced signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const delay: MaybeValue<number> = computed(() => 100);
			const maxWait: MaybeValue<number> = signal(200);
			const options: SignalDebouncedOptions = { maxWait };
			const fromRaw = signalDebounced(0, delay, options);
			const fromWritable = signalDebounced(source, delay, options);
			const fromReadonly = signalDebounced(readonlySource, signal(100));
			const fromComputed = signalDebounced(computedSource, () => 50);
			const fromGetter = signalDebounced(() => source.value, 100);

			expectTypeOf(options.maxWait).toEqualTypeOf<
				MaybeValue<number> | undefined
			>();
			expectTypeOf(fromRaw).toEqualTypeOf<SignalDebouncedReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<SignalDebouncedReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromReadonly).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(fromGetter.value).toEqualTypeOf<number>();

			// @ts-expect-error returned value is readonly
			fromWritable.value = 1;
			// @ts-expect-error ms must resolve to a number
			signalDebounced(source, "100");
			// @ts-expect-error maxWait must resolve to a number
			signalDebounced(source, 100, { maxWait: "100" });
			// @ts-expect-error rejectOnCancel is not exposed because no promise is returned
			signalDebounced(source, 100, { rejectOnCancel: true });
		});
	});

	it("types throttled signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const delay: MaybeValue<number> = computed(() => 100);
			const fromRaw = signalThrottled(0, delay);
			const fromWritable = signalThrottled(source, delay, true, true);
			const fromReadonly = signalThrottled(readonlySource, signal(100));
			const fromComputed = signalThrottled(computedSource, () => 50);
			const fromGetter = signalThrottled(() => source.value, 100);

			expectTypeOf(fromRaw).toEqualTypeOf<SignalThrottledReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<SignalThrottledReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromReadonly).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(fromGetter.value).toEqualTypeOf<number>();

			// @ts-expect-error returned value is readonly
			fromWritable.value = 1;
			// @ts-expect-error ms must resolve to a number
			signalThrottled(source, "100");
			// @ts-expect-error trailing must be boolean
			signalThrottled(source, 100, "true");
			// @ts-expect-error leading must be boolean
			signalThrottled(source, 100, true, "true");
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

	it("types start typing handlers and options", () => {
		typeOnly(() => {
			const documentTarget = signal<Document | null>(document);
			const options: OnStartTypingOptions<Document> = {
				document: documentTarget,
			};
			const handler: OnStartTypingHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
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
		expectTypeOf(document).toMatchTypeOf<UseActiveElementDocumentLike>();
		expectTypeOf(window).toMatchTypeOf<UseActiveElementWindowLike>();
		const activeOptions: UseActiveElementOptions<
			UseActiveElementWindowLike,
			UseActiveElementDocumentLike
		> = {
			deep: true,
			document: signal(document),
			triggerOnRemoval: true,
			window: signal(window),
		};
		const active = useActiveElement<HTMLInputElement>(activeOptions);
		const defaultActive = useActiveElement();

		expectTypeOf(active).toEqualTypeOf<
			UseActiveElementReturn<HTMLInputElement>
		>();
		expectTypeOf(defaultActive).toEqualTypeOf<UseActiveElementReturn>();
		expectTypeOf(active.activeElement.value).toEqualTypeOf<
			HTMLInputElement | null | undefined
		>();
		expectTypeOf(defaultActive.activeElement.value).toEqualTypeOf<
			Element | null | undefined
		>();
		typeOnly(() => {
			// @ts-expect-error activeElement is readonly
			active.activeElement.value = document.createElement("input");
		});
		expectTypeOf(window).toMatchTypeOf<UseAnimateWindowLike>();
		const animateKeyframes: UseAnimateKeyframes = signal({
			opacity: [0, 1],
		});
		const animateOptions: UseAnimateOptions<UseAnimateWindowLike> = {
			commitStyles: true,
			duration: 100,
			immediate: false,
			persist: true,
			playbackRate: 2,
			window: signal(window),
		};
		const animated = useAnimate(
			document.body,
			animateKeyframes,
			animateOptions,
		);

		expectTypeOf(animated).toEqualTypeOf<UseAnimateReturn>();
		expectTypeOf(animated.isSupported.value).toEqualTypeOf<boolean>();
		expectTypeOf(animated.animate.value).toEqualTypeOf<Animation | undefined>();
		expectTypeOf(animated.pending.value).toEqualTypeOf<boolean>();
		expectTypeOf(animated.playState.value).toEqualTypeOf<AnimationPlayState>();
		expectTypeOf(
			animated.replaceState.value,
		).toEqualTypeOf<AnimationReplaceState>();
		expectTypeOf(animated.startTime).toEqualTypeOf<
			Computed<CSSNumberish | null>
		>();
		expectTypeOf(animated.currentTime).toEqualTypeOf<
			Computed<CSSNumberish | null>
		>();
		expectTypeOf(animated.timeline).toEqualTypeOf<
			Computed<AnimationTimeline | null>
		>();
		expectTypeOf(animated.playbackRate).toEqualTypeOf<Computed<number>>();
		typeOnly(() => {
			// @ts-expect-error playState is readonly
			animated.playState.value = "running";
		});

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
		const colorStorage = {
			getItem: (_key: string) => null,
			removeItem: (_key: string) => {},
			setItem: (_key: string, _value: string) => {},
		};
		const colorWindow = new EventTarget() as ColorModeOnlyWindow;
		Object.defineProperties(colorWindow, {
			document: { value: document },
			getComputedStyle: {
				value: (_element: Element) => ({ opacity: "1" }) as CSSStyleDeclaration,
			},
			label: { value: "color-mode" },
			localStorage: { value: colorStorage },
		});
		const colorStorageSignal = signal<ColorModeSelection<"sepia"> | null>(
			"auto",
		);
		const colorOptions: UseColorModeOptions<"sepia"> = {
			attribute: "data-theme",
			document: signal(document as UseColorModeDocumentLike),
			initialValue: "auto",
			modes: {
				sepia: "theme-sepia",
			},
			onChanged: (mode, defaultHandler) => {
				expectTypeOf(mode).toEqualTypeOf<BasicColorMode | "sepia">();
				expectTypeOf(defaultHandler).toEqualTypeOf<
					UseColorModeDefaultHandler<"sepia">
				>();
				defaultHandler(mode);
			},
			selector: "html",
			storage: colorStorage,
			storageKey: "theme",
			storageSignal: colorStorageSignal,
			target: signal<Element | null>(document.documentElement),
			window: signal(colorWindow),
		};
		const colorMode = useColorMode<"sepia">(colorOptions);

		expectTypeOf(breakpoints.md.matches.value).toEqualTypeOf<boolean>();
		expectTypeOf(breakpoints.active().value).toEqualTypeOf<"sm" | "md" | "">();
		expectTypeOf(breakpoints.stop).toEqualTypeOf<() => void>();
		expectTypeOf(preferredDark.matches.value).toEqualTypeOf<boolean>();
		expectTypeOf(colorMode).toEqualTypeOf<UseColorModeReturn<"sepia">>();
		expectTypeOf(colorMode.mode).toEqualTypeOf<
			Computed<ColorModeSelection<"sepia">>
		>();
		expectTypeOf(colorMode.mode.value).toEqualTypeOf<
			ColorModeSelection<"sepia">
		>();
		expectTypeOf(colorMode.system.value).toEqualTypeOf<BasicColorMode>();
		expectTypeOf(colorMode.resolvedMode.value).toEqualTypeOf<
			BasicColorMode | "sepia"
		>();
		colorMode.mode.value = "sepia";
		colorMode.mode.value = "auto";
		typeOnly(() => {
			// @ts-expect-error custom modes must be declared in the generic
			colorMode.mode.value = "dim";
			// @ts-expect-error system is readonly
			colorMode.system.value = "dark";
			// @ts-expect-error resolvedMode is readonly
			colorMode.resolvedMode.value = "dark";
		});

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
		active.stop();
		defaultActive.stop();
		animated.stop();
		colorMode.stop();
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

	it("types countdown controls and options", () => {
		typeOnly(() => {
			const initial = signal(3);
			const interval = signal(100);
			const scheduler: UseCountdownScheduler = (callback) =>
				useIntervalFn(callback, 100, { immediate: false });
			const options: UseCountdownOptions = {
				immediate: false,
				interval,
				onComplete: () => {},
				onTick: (remaining) => {
					expectTypeOf(remaining).toEqualTypeOf<number>();
				},
				scheduler,
			};
			const countdown = useCountdown(initial, options);

			expectTypeOf(countdown).toEqualTypeOf<UseCountdownReturn>();
			expectTypeOf(countdown.remaining).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(countdown.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();

			countdown.pause();
			countdown.resume();
			countdown.start();
			countdown.start(signal(2));
			countdown.stop();
			countdown.reset();
			countdown.reset(() => 4);

			// @ts-expect-error remaining is readonly
			countdown.remaining.value = 1;
			// @ts-expect-error countdown values must be numeric
			countdown.start("1");
			// @ts-expect-error countdown values must be numeric
			countdown.reset("1");
			// @ts-expect-error custom schedulers must return pausable controls
			const invalidScheduler: UseCountdownScheduler = (_callback) => ({
				pause() {},
				resume() {},
			});
			invalidScheduler;
		});
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
