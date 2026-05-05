import type {
	Computed,
	DeepSignal,
	ReadonlyDeepSignal,
	ReadonlySignal,
	Signal,
	WatchOptions,
	WatchSource,
} from "@sigrea/core";
import type {
	DocumentLike as SharedDocumentLike,
	MaybeTarget as SharedMaybeTarget,
	MaybeValue as SharedMaybeValue,
	NavigatorLike as SharedNavigatorLike,
	TargetEventMap as SharedTargetEventMap,
	ValueGetter as SharedValueGetter,
	WindowLike as SharedWindowLike,
} from "../shared";
import type {
	MatchMediaWindow as SharedMatchMediaWindow,
	WatchMediaQueryCallback as SharedWatchMediaQueryCallback,
	WatchMediaQueryOptions as SharedWatchMediaQueryOptions,
} from "../shared/watchMediaQuery";
import type {
	WatchTargetCallback as SharedWatchTargetCallback,
	WatchTargetOptions as SharedWatchTargetOptions,
} from "../shared/watchTarget";

export type DocumentLike = SharedDocumentLike;
export type MatchMediaWindow = SharedMatchMediaWindow;
export type MaybeTarget<TTarget> = SharedMaybeTarget<TTarget>;
export type MaybeValue<T> = SharedMaybeValue<T>;
export type NavigatorLike = SharedNavigatorLike;
export type TargetEventMap<TTarget> = SharedTargetEventMap<TTarget>;
export type ValueGetter<T> = SharedValueGetter<T>;
export type WatchMediaQueryCallback = SharedWatchMediaQueryCallback;
export type WatchMediaQueryOptions<
	TWindow extends MatchMediaWindow = MatchMediaWindow,
> = SharedWatchMediaQueryOptions<TWindow>;
export type WatchTargetCallback<TTarget> = SharedWatchTargetCallback<TTarget>;
export type WatchTargetOptions = SharedWatchTargetOptions;
export type WindowLike = SharedWindowLike;
export type Arrayable<T> = T | readonly T[];
export type FunctionArgs<
	TArgs extends unknown[] = unknown[],
	TReturn = unknown,
	TThis = unknown,
> = (this: TThis, ...args: TArgs) => TReturn;
export type IsDefinedReturn = boolean;
export type PromisifyFn<T> = T extends (
	this: infer TThis,
	...args: infer TArgs
) => infer TReturn
	? TArgs extends unknown[]
		? (this: TThis, ...args: TArgs) => Promise<Awaited<TReturn> | undefined>
		: never
	: never;

type FunctionValue = (...args: never[]) => unknown;
type NonFunctionValue<T> = Exclude<T, FunctionValue>;
type WrappedValue<T> = Signal<T> | ReadonlySignal<T> | Computed<T>;
type MaybeValueArg<T> = [Extract<T, FunctionValue>] extends [never]
	? MaybeValue<T>
	:
			| WrappedValue<T>
			| ([NonFunctionValue<T>] extends [never]
					? never
					: NonFunctionValue<T> | WrappedValue<NonFunctionValue<T>>);

export type MaybeValueArgs<TArgs extends readonly unknown[]> = {
	[K in keyof TArgs]: MaybeValueArg<TArgs[K]>;
};

export type ResolveValueFn<T> = T extends (
	this: infer TThis,
	...args: infer TArgs
) => infer TReturn
	? TArgs extends unknown[]
		? (this: TThis, ...args: MaybeValueArgs<TArgs>) => TReturn
		: never
	: never;

export type ReactifyReturn<T> = T extends (
	this: infer TThis,
	...args: infer TArgs
) => infer TReturn
	? TArgs extends unknown[]
		? (this: TThis, ...args: MaybeValueArgs<TArgs>) => ReadonlySignal<TReturn>
		: never
	: never;

type ReactifyObjectValue<TValue> = TValue extends (
	this: infer _TThis,
	...args: infer TArgs
) => infer TReturn
	? TArgs extends unknown[]
		? (...args: MaybeValueArgs<TArgs>) => ReadonlySignal<TReturn>
		: never
	: TValue;

export type ReactifyNested<T, TKeys extends keyof T = keyof T> = {
	[TKey in TKeys]: ReactifyObjectValue<T[TKey]>;
};

export type ReactifyObjectReturn<
	T,
	TKeys extends keyof T = keyof T,
> = ReactifyNested<T, TKeys>;

export interface ReactifyObjectOptions {
	includeOwnProperties?: boolean;
}

export type ReactiveComputedGetter<T extends object> = (previousValue?: T) => T;

type ReactiveComputedObjectValue<TValue> = TValue extends Signal<infer Value>
	? Value
	: TValue extends ReadonlySignal<infer Value>
		? Value
		: TValue extends Computed<infer Value>
			? Value
			: TValue;

type ReactiveComputedObject<T extends object> = {
	[TKey in keyof T]: ReactiveComputedObjectValue<T[TKey]>;
};

export type ReactiveComputedReturn<T extends object> = DeepSignal<
	ReactiveComputedObject<T>
>;

type ReactiveOmitValue<TValue> = TValue extends Signal<infer Value>
	? Value
	: TValue extends ReadonlySignal<infer Value>
		? Value
		: TValue extends Computed<infer Value>
			? Value
			: TValue;

type ReactiveOmitEntry<TValue> = DeepSignal<ReactiveOmitValue<TValue>>;

type ReactiveOmitReadonlyKeys<T extends object> = {
	[TKey in keyof T]-?: IsReadonlyKey<T, TKey> extends true
		? TKey
		: IsReadonlySignalValue<T[TKey]> extends true
			? TKey
			: never;
}[keyof T];

type ReactiveOmitWritableKeys<T extends object> = Exclude<
	keyof T,
	ReactiveOmitReadonlyKeys<T>
>;

type ReactiveOmitOptionalKeys<T extends object> = {
	[TKey in keyof T]-?: object extends Pick<T, TKey> ? TKey : never;
}[keyof T];

type ReactiveOmitRequiredKeys<T extends object> = Exclude<
	keyof T,
	ReactiveOmitOptionalKeys<T>
>;

type ReactiveOmitReadonlyRequiredKeys<T extends object> = Extract<
	ReactiveOmitReadonlyKeys<T>,
	ReactiveOmitRequiredKeys<T>
>;

type ReactiveOmitReadonlyOptionalKeys<T extends object> = Extract<
	ReactiveOmitReadonlyKeys<T>,
	ReactiveOmitOptionalKeys<T>
>;

type ReactiveOmitWritableRequiredKeys<T extends object> = Extract<
	ReactiveOmitWritableKeys<T>,
	ReactiveOmitRequiredKeys<T>
>;

type ReactiveOmitWritableOptionalKeys<T extends object> = Extract<
	ReactiveOmitWritableKeys<T>,
	ReactiveOmitOptionalKeys<T>
>;

type ReactiveOmitObject<T extends object> = {
	[TKey in ReactiveOmitWritableRequiredKeys<T>]: ReactiveOmitEntry<T[TKey]>;
} & {
	[TKey in ReactiveOmitWritableOptionalKeys<T>]?: ReactiveOmitEntry<T[TKey]>;
} & {
	readonly [TKey in ReactiveOmitReadonlyRequiredKeys<T>]: ReactiveOmitEntry<
		T[TKey]
	>;
} & {
	readonly [TKey in ReactiveOmitReadonlyOptionalKeys<T>]?: ReactiveOmitEntry<
		T[TKey]
	>;
};

export type ReactiveOmitReturn<
	T extends object,
	K extends keyof T | undefined = undefined,
> = [K] extends [never]
	? ReactiveOmitObject<T>
	: [K] extends [undefined]
		? Partial<ReactiveOmitObject<T>>
		: ReactiveOmitObject<Omit<T, Extract<K, keyof T>>>;

export type ReactiveOmitPredicate<T extends object> = (
	value: ReactiveOmitValue<T[keyof T]>,
	key: keyof T,
) => boolean;

type ReactivePickValue<TValue> = TValue extends Signal<infer Value>
	? Value
	: TValue extends ReadonlySignal<infer Value>
		? Value
		: TValue extends Computed<infer Value>
			? Value
			: TValue;

type ReactivePickEntry<TValue> = DeepSignal<ReactivePickValue<TValue>>;

type ReactivePickReadonlyKeys<T extends object> = {
	[TKey in keyof T]-?: IsReadonlyKey<T, TKey> extends true
		? TKey
		: IsReadonlySignalValue<T[TKey]> extends true
			? TKey
			: never;
}[keyof T];

type ReactivePickWritableKeys<T extends object> = Exclude<
	keyof T,
	ReactivePickReadonlyKeys<T>
>;

type ReactivePickOptionalKeys<T extends object> = {
	[TKey in keyof T]-?: object extends Pick<T, TKey> ? TKey : never;
}[keyof T];

type ReactivePickRequiredKeys<T extends object> = Exclude<
	keyof T,
	ReactivePickOptionalKeys<T>
>;

type ReactivePickReadonlyRequiredKeys<T extends object> = Extract<
	ReactivePickReadonlyKeys<T>,
	ReactivePickRequiredKeys<T>
>;

type ReactivePickReadonlyOptionalKeys<T extends object> = Extract<
	ReactivePickReadonlyKeys<T>,
	ReactivePickOptionalKeys<T>
>;

type ReactivePickWritableRequiredKeys<T extends object> = Extract<
	ReactivePickWritableKeys<T>,
	ReactivePickRequiredKeys<T>
>;

type ReactivePickWritableOptionalKeys<T extends object> = Extract<
	ReactivePickWritableKeys<T>,
	ReactivePickOptionalKeys<T>
>;

type ReactivePickObject<T extends object> = {
	[TKey in ReactivePickWritableRequiredKeys<T>]: ReactivePickEntry<T[TKey]>;
} & {
	[TKey in ReactivePickWritableOptionalKeys<T>]?: ReactivePickEntry<T[TKey]>;
} & {
	readonly [TKey in ReactivePickReadonlyRequiredKeys<T>]: ReactivePickEntry<
		T[TKey]
	>;
} & {
	readonly [TKey in ReactivePickReadonlyOptionalKeys<T>]?: ReactivePickEntry<
		T[TKey]
	>;
};

export type ReactivePickReturn<
	T extends object,
	K extends keyof T | undefined = undefined,
> = [K] extends [undefined]
	? Partial<ReactivePickObject<T>>
	: ReactivePickObject<Pick<T, Extract<K, keyof T>>>;

export type ReactivePickPredicate<T extends object> = (
	value: ReactivePickValue<T[keyof T]>,
	key: keyof T,
) => boolean;

type ToDeepSignalValue<TValue> = TValue extends Signal<infer Value>
	? Value
	: TValue extends ReadonlySignal<infer Value>
		? Value
		: TValue extends Computed<infer Value>
			? Value
			: TValue;

type ToDeepSignalEntry<TValue> = DeepSignal<ToDeepSignalValue<TValue>>;

type ToDeepSignalReadonlyKeys<T extends object> = {
	[TKey in keyof T]-?: IsReadonlyKey<T, TKey> extends true
		? TKey
		: IsReadonlySignalValue<T[TKey]> extends true
			? TKey
			: never;
}[keyof T];

type ToDeepSignalWritableKeys<T extends object> = Exclude<
	keyof T,
	ToDeepSignalReadonlyKeys<T>
>;

type ToDeepSignalOptionalKeys<T extends object> = {
	[TKey in keyof T]-?: object extends Pick<T, TKey> ? TKey : never;
}[keyof T];

type ToDeepSignalRequiredKeys<T extends object> = Exclude<
	keyof T,
	ToDeepSignalOptionalKeys<T>
>;

type ToDeepSignalReadonlyRequiredKeys<T extends object> = Extract<
	ToDeepSignalReadonlyKeys<T>,
	ToDeepSignalRequiredKeys<T>
>;

type ToDeepSignalReadonlyOptionalKeys<T extends object> = Extract<
	ToDeepSignalReadonlyKeys<T>,
	ToDeepSignalOptionalKeys<T>
>;

type ToDeepSignalWritableRequiredKeys<T extends object> = Extract<
	ToDeepSignalWritableKeys<T>,
	ToDeepSignalRequiredKeys<T>
>;

type ToDeepSignalWritableOptionalKeys<T extends object> = Extract<
	ToDeepSignalWritableKeys<T>,
	ToDeepSignalOptionalKeys<T>
>;

type ToDeepSignalObject<T extends object> = {
	[TKey in ToDeepSignalWritableRequiredKeys<T>]: ToDeepSignalEntry<T[TKey]>;
} & {
	[TKey in ToDeepSignalWritableOptionalKeys<T>]?: ToDeepSignalEntry<T[TKey]>;
} & {
	readonly [TKey in ToDeepSignalReadonlyRequiredKeys<T>]: ToDeepSignalEntry<
		T[TKey]
	>;
} & {
	readonly [TKey in ToDeepSignalReadonlyOptionalKeys<T>]?: ToDeepSignalEntry<
		T[TKey]
	>;
};

export type ToDeepSignalReturn<T extends object> = DeepSignal<
	ToDeepSignalObject<T>
>;

export type TryOnScopeDisposeReturn = boolean;

export interface UntilToMatchOptions {
	/**
	 * Milliseconds before the promise resolves or rejects.
	 *
	 * 0 times out on the next timer tick.
	 */
	timeout?: number;
	/**
	 * Reject with "Timeout" instead of resolving with the current value.
	 */
	throwOnTimeout?: boolean;
	/**
	 * Deep option passed to the internal Sigrea watch.
	 */
	deep?: WatchOptions["deep"];
	/**
	 * Flush option passed to the internal Sigrea watch.
	 */
	flush?: WatchOptions["flush"];
}

export interface UntilBaseInstance<T, Not extends boolean = false> {
	toMatch: (<U extends T = T>(
		condition: (value: T) => value is U,
		options?: UntilToMatchOptions,
	) => Not extends true ? Promise<Exclude<T, U>> : Promise<U>) &
		((
			condition: (value: T) => boolean,
			options?: UntilToMatchOptions,
		) => Promise<T>);
	changed(options?: UntilToMatchOptions): Promise<T>;
	changedTimes(count?: number, options?: UntilToMatchOptions): Promise<T>;
}

type Falsy = false | void | null | undefined | 0 | 0n | "";

export interface UntilValueInstance<T, Not extends boolean = false>
	extends UntilBaseInstance<T, Not> {
	readonly not: UntilValueInstance<T, Not extends true ? false : true>;

	toBe<P = T>(
		value: MaybeValue<P>,
		options?: UntilToMatchOptions,
	): Not extends true ? Promise<T> : Promise<P>;
	toBeTruthy(
		options?: UntilToMatchOptions,
	): Not extends true ? Promise<T & Falsy> : Promise<Exclude<T, Falsy>>;
	toBeNull(
		options?: UntilToMatchOptions,
	): Not extends true ? Promise<Exclude<T, null>> : Promise<null>;
	toBeUndefined(
		options?: UntilToMatchOptions,
	): Not extends true ? Promise<Exclude<T, undefined>> : Promise<undefined>;
	toBeNaN(options?: UntilToMatchOptions): Promise<T>;
}

type ArrayElement<T> = T extends readonly (infer Value)[] ? Value : unknown;

export interface UntilArrayInstance<T extends readonly unknown[]>
	extends UntilBaseInstance<T> {
	readonly not: UntilArrayInstance<T>;

	toContains(
		value: MaybeValue<ArrayElement<T>>,
		options?: UntilToMatchOptions,
	): Promise<T>;
}

export type AsyncComputedCancelCallback = () => void;

export type AsyncComputedOnCancel = (
	cancelCallback: AsyncComputedCancelCallback,
) => void;

export type AsyncComputedEvaluationCallback<T> = (
	onCancel: AsyncComputedOnCancel,
) => T | Promise<T>;

export interface AsyncComputedOptions {
	evaluating?: Signal<boolean>;
	flush?: WatchOptions["flush"];
	lazy?: boolean;
	onError?: (error: unknown) => void;
	shallow?: boolean;
}

export type AsyncComputedOptionsOrSignal =
	| Signal<boolean>
	| AsyncComputedOptions;

export type UseAsyncQueueResultState =
	| "aborted"
	| "fulfilled"
	| "pending"
	| "rejected";

export type UseAsyncQueueTask<T = unknown> = (
	...args: never[]
) => T | Promise<T>;

export type UseAsyncQueueResult<T = unknown> =
	| {
			readonly state: "pending";
			readonly data: null;
	  }
	| {
			readonly state: "fulfilled";
			readonly data: T;
	  }
	| {
			readonly state: "rejected";
			readonly data: unknown;
	  }
	| {
			readonly state: "aborted";
			readonly data: unknown;
	  };

type UseAsyncQueueTaskResult<TTask> = TTask extends (
	...args: never[]
) => infer TReturn
	? Awaited<TReturn>
	: never;

export type UseAsyncQueueResultList<
	TTasks extends readonly UseAsyncQueueTask[],
> = {
	readonly [TKey in keyof TTasks]: UseAsyncQueueResult<
		UseAsyncQueueTaskResult<TTasks[TKey]>
	>;
};

export interface UseAsyncQueueReturn<
	TTasks extends readonly UseAsyncQueueTask[],
> {
	activeIndex: ReadonlySignal<number>;
	result: ReadonlySignal<UseAsyncQueueResultList<TTasks>>;
}

export interface UseAsyncQueueOptions {
	/**
	 * Interrupt tasks when the current task fails.
	 *
	 * @default true
	 */
	interrupt?: boolean;
	onError?: () => void;
	onFinished?: () => void;
	signal?: AbortSignal;
}

export type UseAsyncStateSource<Data, Params extends unknown[]> =
	| Promise<Data>
	| ((...args: Params) => Promise<Data>);

export interface UseAsyncStateOptions<Data = unknown> {
	/**
	 * Delay for the first execution when `immediate` is true.
	 *
	 * @default 0
	 */
	delay?: number;
	/**
	 * Execute immediately after creation.
	 *
	 * @default true
	 */
	immediate?: boolean;
	onError?: (error: unknown) => void;
	onSuccess?: (data: Data) => void;
	/**
	 * Reset state to the initial value before each execution.
	 *
	 * @default true
	 */
	resetOnExecute?: boolean;
	/**
	 * Keep the state value shallow.
	 *
	 * @default true
	 */
	shallow?: boolean;
	/**
	 * Re-throw errors from execute.
	 *
	 * @default false
	 */
	throwError?: boolean;
}

export interface UseAsyncStateReturnBase<Data, Params extends unknown[] = []> {
	state: ReadonlySignal<Data>;
	isReady: ReadonlySignal<boolean>;
	isLoading: ReadonlySignal<boolean>;
	error: ReadonlySignal<unknown | undefined>;
	execute(delay?: number, ...args: Params): Promise<Data | undefined>;
	executeImmediate(...args: Params): Promise<Data | undefined>;
}

export type UseAsyncStateReturn<
	Data,
	Params extends unknown[] = [],
> = UseAsyncStateReturnBase<Data, Params> &
	PromiseLike<UseAsyncStateReturnBase<Data, Params>>;

export interface UseBase64DocumentLike extends DocumentLike {
	createElement(tagName: "canvas"): HTMLCanvasElement;
}

export interface UseBase64WindowLike extends WindowLike {
	readonly document?: UseBase64DocumentLike;
	readonly Blob?: typeof Blob;
	readonly FileReader?: { new (): FileReader };
	readonly HTMLCanvasElement?: { new (): HTMLCanvasElement };
	readonly HTMLImageElement?: { new (): HTMLImageElement };
	btoa?(data: string): string;
}

export type UseBase64Source =
	| string
	| Blob
	| ArrayBuffer
	| HTMLCanvasElement
	| HTMLImageElement
	| Record<string, unknown>
	| Map<string, unknown>
	| Set<unknown>
	| readonly unknown[]
	| null
	| undefined;

export interface UseBase64Options<
	TWindow extends UseBase64WindowLike = UseBase64WindowLike,
> {
	/**
	 * Output as Data URL format.
	 *
	 * @default true
	 */
	dataUrl?: boolean;
	window?: MaybeTarget<TWindow>;
}

export interface UseBase64ImageOptions<
	TWindow extends UseBase64WindowLike = UseBase64WindowLike,
> extends UseBase64Options<TWindow> {
	/**
	 * MIME type used by canvas and image conversion.
	 */
	type?: string;
	/**
	 * Image quality for jpeg and webp conversion.
	 */
	quality?: number;
}

export interface UseBase64ObjectOptions<
	T,
	TWindow extends UseBase64WindowLike = UseBase64WindowLike,
> extends UseBase64Options<TWindow> {
	serializer?: (value: T) => string;
}

export interface UseBase64Return {
	readonly base64: ReadonlySignal<string>;
	readonly promise: ReadonlySignal<Promise<string> | undefined>;
	execute(): Promise<string>;
}

export interface BatteryManagerLike extends EventTarget {
	readonly charging: boolean;
	readonly chargingTime: number;
	readonly dischargingTime: number;
	readonly level: number;
}

export interface BatteryNavigatorLike extends NavigatorLike {
	getBattery(): Promise<BatteryManagerLike>;
}

export interface UseBatteryOptions<
	TNavigator extends NavigatorLike = BatteryNavigatorLike,
> {
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseBatteryReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly charging: ReadonlySignal<boolean>;
	readonly chargingTime: ReadonlySignal<number>;
	readonly dischargingTime: ReadonlySignal<number>;
	readonly level: ReadonlySignal<number>;
	stop(): void;
}

export type BluetoothServiceUUIDLike = number | string;

export interface BluetoothDataFilterLike {
	dataPrefix?: BufferSource;
	mask?: BufferSource;
}

export interface BluetoothManufacturerDataFilterLike
	extends BluetoothDataFilterLike {
	companyIdentifier: number;
}

export interface BluetoothServiceDataFilterLike
	extends BluetoothDataFilterLike {
	service: BluetoothServiceUUIDLike;
}

export interface BluetoothLEScanFilterLike {
	services?: readonly BluetoothServiceUUIDLike[];
	name?: string;
	namePrefix?: string;
	manufacturerData?: readonly BluetoothManufacturerDataFilterLike[];
	serviceData?: readonly BluetoothServiceDataFilterLike[];
}

export interface BluetoothRequestDeviceOptionsLike {
	acceptAllDevices?: boolean;
	filters?: readonly BluetoothLEScanFilterLike[];
	optionalServices?: readonly BluetoothServiceUUIDLike[];
}

export interface BluetoothRemoteGATTCharacteristicLike extends EventTarget {
	readValue?(): Promise<DataView>;
	startNotifications?(): Promise<BluetoothRemoteGATTCharacteristicLike>;
	stopNotifications?(): Promise<BluetoothRemoteGATTCharacteristicLike>;
	writeValue?(value: BufferSource): Promise<void>;
}

export interface BluetoothRemoteGATTServiceLike {
	getCharacteristic?(
		characteristic: BluetoothServiceUUIDLike,
	): Promise<BluetoothRemoteGATTCharacteristicLike>;
}

export interface BluetoothRemoteGATTServerLike {
	readonly connected: boolean;
	connect(): Promise<BluetoothRemoteGATTServerLike>;
	disconnect(): void;
	getPrimaryService?(
		service: BluetoothServiceUUIDLike,
	): Promise<BluetoothRemoteGATTServiceLike>;
}

export interface BluetoothDeviceLike extends EventTarget {
	readonly id?: string;
	readonly name?: string;
	readonly gatt?: BluetoothRemoteGATTServerLike | null;
}

export interface BluetoothLike extends EventTarget {
	getAvailability?(): Promise<boolean>;
	getDevices?(): Promise<BluetoothDeviceLike[]>;
	requestDevice(
		options?: BluetoothRequestDeviceOptionsLike,
	): Promise<BluetoothDeviceLike>;
}

export interface BluetoothNavigatorLike extends NavigatorLike {
	readonly bluetooth?: BluetoothLike | null;
}

export interface UseBluetoothRequestDeviceOptions {
	filters?: MaybeValue<readonly BluetoothLEScanFilterLike[] | undefined>;
	optionalServices?: MaybeValue<
		readonly BluetoothServiceUUIDLike[] | undefined
	>;
}

export interface UseBluetoothOptions<
	TNavigator extends NavigatorLike = BluetoothNavigatorLike,
> extends UseBluetoothRequestDeviceOptions {
	/**
	 * Show all nearby Bluetooth devices in the chooser.
	 *
	 * @default false
	 */
	acceptAllDevices?: MaybeValue<boolean>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseBluetoothReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isConnected: ReadonlySignal<boolean>;
	readonly device: ReadonlySignal<BluetoothDeviceLike | undefined>;
	readonly server: ReadonlySignal<BluetoothRemoteGATTServerLike | undefined>;
	readonly error: ReadonlySignal<unknown | null>;
	requestDevice(): Promise<void>;
	connect(): Promise<void>;
	disconnect(): void;
	stop(): void;
}

export interface BroadcastChannelLike extends EventTarget {
	readonly name?: string;
	close(): void;
	postMessage(message: unknown): void;
}

export interface BroadcastChannelWindowLike extends WindowLike {
	readonly BroadcastChannel?: { new (name: string): BroadcastChannelLike };
}

export interface UseBroadcastChannelOptions<
	TWindow extends BroadcastChannelWindowLike = BroadcastChannelWindowLike,
> {
	name: MaybeValue<string>;
	window?: MaybeTarget<TWindow>;
}

export interface UseBroadcastChannelReturn<Data = unknown, Payload = Data> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isClosed: ReadonlySignal<boolean>;
	readonly channel: ReadonlySignal<BroadcastChannelLike | undefined>;
	readonly data: ReadonlySignal<Data | undefined>;
	readonly error: ReadonlySignal<unknown | null>;
	postMessage(data: Payload): void;
	close(): void;
	stop(): void;
}

export type BrowserLocationWritableProperty =
	| "hash"
	| "host"
	| "hostname"
	| "href"
	| "pathname"
	| "port"
	| "protocol"
	| "search";

export type BrowserLocationTrigger = "load" | "popstate" | "hashchange";

export interface BrowserLocationLike
	extends Record<BrowserLocationWritableProperty, string> {
	readonly origin?: string;
}

export interface BrowserLocationHistoryLike {
	readonly state?: unknown;
	readonly length?: number;
}

export interface BrowserLocationWindowLike extends WindowLike {
	readonly history?: BrowserLocationHistoryLike;
	readonly location?: BrowserLocationLike;
}

export interface UseBrowserLocationOptions<
	TWindow extends BrowserLocationWindowLike = BrowserLocationWindowLike,
> {
	window?: MaybeTarget<TWindow>;
}

export interface UseBrowserLocationReturn {
	readonly trigger: ReadonlySignal<BrowserLocationTrigger>;
	readonly state: ReadonlySignal<unknown | undefined>;
	readonly length: ReadonlySignal<number | undefined>;
	readonly origin: ReadonlySignal<string | undefined>;
	readonly hash: Computed<string | undefined>;
	readonly host: Computed<string | undefined>;
	readonly hostname: Computed<string | undefined>;
	readonly href: Computed<string | undefined>;
	readonly pathname: Computed<string | undefined>;
	readonly port: Computed<string | undefined>;
	readonly protocol: Computed<string | undefined>;
	readonly search: Computed<string | undefined>;
	stop(): void;
}

export type UseCachedComparator<T> = (
	newSourceValue: T,
	cachedValue: T,
) => boolean;

export interface UseCachedOptions {
	deep?: WatchOptions["deep"];
	flush?: WatchOptions["flush"];
}

export type UseCachedReturn<T = unknown> = ReadonlySignal<T>;

export interface ClipboardLike {
	addEventListener?(
		type: "clipboardchange",
		listener: (event: Event) => void,
		options?: boolean | AddEventListenerOptions,
	): void;
	read?(): Promise<ClipboardItemLike[]>;
	readText?(): Promise<string>;
	removeEventListener?(
		type: "clipboardchange",
		listener: (event: Event) => void,
		options?: boolean | EventListenerOptions,
	): void;
	write?(data: ClipboardItemLike[]): Promise<void>;
	writeText?(data: string): Promise<void>;
}

export interface ClipboardNavigatorLike extends NavigatorLike {
	readonly clipboard?: ClipboardLike | null;
}

export type ClipboardItemPresentationStyleLike =
	| "unspecified"
	| "inline"
	| "attachment";

export interface ClipboardItemLike {
	readonly presentationStyle?: ClipboardItemPresentationStyleLike;
	readonly types: readonly string[];
	getType(type: string): Promise<Blob>;
}

export interface ClipboardTextareaLike {
	value: string;
	readonly style: {
		opacity?: string;
		position?: string;
	};
	remove(): void;
	select(): void;
	setAttribute(name: string, value: string): void;
}

export interface ClipboardDocumentBodyLike {
	appendChild(node: ClipboardTextareaLike & Node): void;
}

export interface ClipboardDocumentLike extends DocumentLike {
	readonly body?: ClipboardDocumentBodyLike;
	createElement(tagName: "textarea"): ClipboardTextareaLike;
	execCommand?(command: "copy"): boolean;
}

export interface UseClipboardWindowLike extends WindowLike {}

export type UseClipboardTextSource = MaybeValue<string | null | undefined>;

export interface UseClipboardOptions<
	Source extends UseClipboardTextSource | undefined = undefined,
	TNavigator extends ClipboardNavigatorLike = ClipboardNavigatorLike,
	TDocument extends ClipboardDocumentLike = ClipboardDocumentLike,
	TWindow extends UseClipboardWindowLike = UseClipboardWindowLike,
> {
	/**
	 * Milliseconds before copied resets to false.
	 *
	 * @default 1500
	 */
	copiedDuring?: MaybeValue<number>;
	/**
	 * Fallback to document.execCommand("copy") when async Clipboard API is unavailable or rejected.
	 *
	 * @default false
	 */
	legacy?: boolean;
	/**
	 * Read clipboard text when copy or cut events are observed on the configured window.
	 *
	 * @default false
	 */
	read?: boolean;
	source?: Source;
	document?: MaybeTarget<TDocument>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
	window?: MaybeTarget<TWindow>;
}

export type UseClipboardCopyFn<Optional extends boolean> = Optional extends true
	? (text?: UseClipboardTextSource) => Promise<void>
	: (text: UseClipboardTextSource) => Promise<void>;

export interface UseClipboardReturn<Optional extends boolean = false> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly text: ReadonlySignal<string>;
	readonly copied: ReadonlySignal<boolean>;
	readonly isCopying: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	copy: UseClipboardCopyFn<Optional>;
	read(): Promise<string | undefined>;
	stop(): void;
}

export interface UseClipboardItemsWindowLike extends WindowLike {}

export type UseClipboardItemsSource = MaybeValue<
	readonly ClipboardItemLike[] | null | undefined
>;

export interface UseClipboardItemsOptions<
	Source extends UseClipboardItemsSource | undefined = undefined,
	TNavigator extends ClipboardNavigatorLike = ClipboardNavigatorLike,
	TWindow extends UseClipboardItemsWindowLike = UseClipboardItemsWindowLike,
> {
	/**
	 * Milliseconds before copied resets to false.
	 *
	 * @default 1500
	 */
	copiedDuring?: MaybeValue<number>;
	/**
	 * Read clipboard items when copy or cut events are observed on the configured window.
	 *
	 * @default false
	 */
	read?: boolean;
	source?: Source;
	navigator?: MaybeValue<TNavigator | null | undefined>;
	window?: MaybeTarget<TWindow>;
}

export type UseClipboardItemsCopyFn<Optional extends boolean> =
	Optional extends true
		? (items?: UseClipboardItemsSource) => Promise<void>
		: (items: UseClipboardItemsSource) => Promise<void>;

export interface UseClipboardItemsReturn<Optional extends boolean = false> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly items: ReadonlySignal<readonly ClipboardItemLike[]>;
	readonly copied: ReadonlySignal<boolean>;
	readonly isCopying: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	copy: UseClipboardItemsCopyFn<Optional>;
	read(): Promise<readonly ClipboardItemLike[] | undefined>;
	stop(): void;
}

export interface ComputedEagerOptions {
	flush?: WatchOptions["flush"];
	onTrack?: WatchOptions["onTrack"];
	onTrigger?: WatchOptions["onTrigger"];
}

export type ComputedEagerReturn<T> = ReadonlySignal<T>;

export interface UseArrayDifferenceOptions {
	/**
	 * Include values that only exist in the second array.
	 *
	 * @default false
	 */
	symmetric?: boolean;
}

export type UseArrayDifferenceCompareFn<T> = (
	value: T,
	otherValue: T,
) => boolean;

export type UseArrayDifferenceReturn<T = unknown> = ReadonlySignal<T[]>;

export type UseArrayEveryPredicate<T> = (
	element: T,
	index: number,
	array: readonly MaybeValue<T>[],
) => unknown;

export type UseArrayEveryReturn = ReadonlySignal<boolean>;

export type UseArraySomePredicate<T> = (
	element: T,
	index: number,
	array: readonly MaybeValue<T>[],
) => unknown;

export type UseArraySomeReturn = ReadonlySignal<boolean>;

export type UseArrayUniqueCompareFn<T> = (
	value: T,
	otherValue: T,
	array: T[],
) => boolean;

export type UseArrayUniqueReturn<T = unknown> = ReadonlySignal<T[]>;

export type UseArrayFilterPredicate<T> = (
	element: T,
	index: number,
	array: T[],
) => unknown;

export type UseArrayFilterReturn<T = unknown> = ReadonlySignal<T[]>;

export type UseArrayFindPredicate<T> = (
	element: T,
	index: number,
	array: readonly MaybeValue<T>[],
) => unknown;

export type UseArrayFindReturn<T = unknown> = ReadonlySignal<T | undefined>;

export type UseArrayFindIndexPredicate<T> = (
	element: T,
	index: number,
	array: readonly MaybeValue<T>[],
) => unknown;

export type UseArrayFindIndexReturn = ReadonlySignal<number>;

export type UseArrayFindLastPredicate<T> = (
	element: T,
	index: number,
	array: readonly MaybeValue<T>[],
) => unknown;

export type UseArrayFindLastReturn<T = unknown> = ReadonlySignal<T | undefined>;

export type UseArrayIncludesComparatorFn<T, V = T> = (
	element: T,
	value: V,
	index: number,
	array: readonly MaybeValue<T>[],
) => boolean;

export interface UseArrayIncludesOptions<T, V = T> {
	fromIndex?: MaybeValue<number>;
	comparator?: UseArrayIncludesComparatorFn<T, V> | keyof T;
}

export type UseArrayIncludesReturn = ReadonlySignal<boolean>;

export type UseArrayJoinReturn = ReadonlySignal<string>;

export type UseArrayMapCallback<T, U = T> = (
	element: T,
	index: number,
	array: T[],
) => U;

export type UseArrayMapReturn<T = unknown> = ReadonlySignal<T[]>;

export type UseArrayReduceReducer<PV, CV, R> = (
	previousValue: PV,
	currentValue: CV,
	currentIndex: number,
) => R;

export type UseArrayReduceReturn<T = unknown> = ReadonlySignal<T>;

export type ComputedWithControlSource<T = unknown> =
	| WatchSource<T>
	| DeepSignal<object>
	| ReadonlyDeepSignal<object>;

export type ComputedWithControlSourceList =
	readonly ComputedWithControlSource[];

export type ComputedWithControlGetter<T> = (oldValue?: T) => T;

export type ComputedWithControlSetter<T> = (value: T) => void;

export interface WritableComputedWithControlOptions<T> {
	get: ComputedWithControlGetter<T>;
	set: ComputedWithControlSetter<T>;
}

export type ComputedWithControlOptions = WatchOptions;

export interface ComputedWithControlExtra {
	trigger(): void;
}

export type ComputedWithControlReturn<T> = ReadonlySignal<T> &
	ComputedWithControlExtra;

export type WritableComputedWithControlReturn<T> = Signal<T> &
	ComputedWithControlExtra;

export type ComputedWithControlRef<T> =
	| ComputedWithControlReturn<T>
	| WritableComputedWithControlReturn<T>;

export type ExtendSignalSource<T = unknown> =
	| Signal<T>
	| ReadonlySignal<T>
	| Computed<T>;

export type ExtendSignalOptions<Unwrap extends boolean = boolean> = {
	enumerable?: boolean;
} & ([Unwrap] extends [false] ? { unwrap: false } : { unwrap?: Unwrap });

type IfEquals<X, Y, Then, Else> = (<T>() => T extends X ? 1 : 2) extends <
	T,
>() => T extends Y ? 1 : 2
	? Then
	: Else;

type IsReadonlyKey<T, K extends keyof T> = IfEquals<
	{ [P in K]: T[P] },
	{ -readonly [P in K]: T[P] },
	false,
	true
>;

type IsReadonlySignalValue<T> = T extends { readonly value: unknown }
	? IsReadonlyKey<T, "value">
	: false;

type ExtendSignalProtectedKey = "value" | "peek";

type ExtendSignalValue<T> = T extends Computed<infer Value>
	? Value
	: T extends Signal<infer Value>
		? Value
		: T extends ReadonlySignal<infer Value>
			? Value
			: T;

type ExtendSignalReadonlyKeys<Extend extends object> = {
	[K in keyof Extend]-?: K extends ExtendSignalProtectedKey
		? never
		: IsReadonlySignalValue<Extend[K]> extends true
			? K
			: never;
}[keyof Extend];

type ExtendSignalWritableKeys<Extend extends object> = Exclude<
	keyof Extend,
	ExtendSignalProtectedKey | ExtendSignalReadonlyKeys<Extend>
>;

export type ExtendSignalUnwrapped<Extend extends object> = {
	[K in ExtendSignalWritableKeys<Extend>]: ExtendSignalValue<Extend[K]>;
} & {
	readonly [K in ExtendSignalReadonlyKeys<Extend>]: ExtendSignalValue<
		Extend[K]
	>;
};

export type ExtendSignalReturn<
	R extends ExtendSignalSource,
	Extend extends object,
	Unwrap extends boolean = true,
> = R &
	(Unwrap extends false
		? Omit<Extend, ExtendSignalProtectedKey>
		: ExtendSignalUnwrapped<Extend>);

export type CreateSignalReturn<
	T = unknown,
	D extends boolean = false,
> = D extends true ? Signal<T> : Signal<T>;

type IsAny<T> = 0 extends 1 & T ? true : false;
type IsUnknown<T> = IsAny<T> extends true
	? false
	: unknown extends T
		? [T] extends [unknown]
			? true
			: false
		: false;
type IsTuple<T> = T extends readonly unknown[]
	? number extends T["length"]
		? false
		: true
	: false;

export type EventHookArgs<T = unknown> = IsAny<T> extends true
	? unknown[]
	: IsUnknown<T> extends true
		? unknown[]
		: [T] extends [void]
			? unknown[]
			: [T] extends [readonly unknown[]]
				? IsTuple<T> extends true
					? [...T]
					: [T, ...unknown[]]
				: [T, ...unknown[]];

export type EventHookCallback<T = unknown> = (
	...args: EventHookArgs<T>
) => unknown;

export type EventHookOn<T = unknown> = (fn: EventHookCallback<T>) => {
	off: () => void;
};

export type EventHookOff<T = unknown> = (fn: EventHookCallback<T>) => void;

export type EventHookTrigger<T = unknown> = (
	...args: EventHookArgs<T>
) => Promise<unknown[]>;

export interface EventHook<T = unknown> {
	on: EventHookOn<T>;
	off: EventHookOff<T>;
	trigger: EventHookTrigger<T>;
	clear: () => void;
}

export type EventHookReturn<T = unknown> = EventHook<T>;

export interface Position {
	x: number;
	y: number;
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export interface StorageWindowLike extends WindowLike {
	readonly localStorage?: StorageLike;
	readonly sessionStorage?: StorageLike;
}

export type StorageSerializerType =
	| "any"
	| "array"
	| "boolean"
	| "date"
	| "map"
	| "number"
	| "object"
	| "set"
	| "string";

export type StorageWatchFlushType = "pre" | "post" | "sync";

export interface StorageSerializer<T = unknown> {
	read(raw: string): T;
	write(value: T): string;
}

export interface StorageEventLike {
	readonly storageArea: StorageLike | null;
	readonly key: string | null;
	readonly oldValue: string | null;
	readonly newValue: string | null;
}

export interface RemovableSignal<T> extends Signal<T> {
	remove(): void;
	stop(): void;
}

export interface UseActiveElementDocumentLike extends Node {
	readonly activeElement?: Element | null;
}

export interface UseActiveElementWindowLike extends OnElementRemovalWindowLike {
	readonly document?: UseActiveElementDocumentLike;
}

export interface UseActiveElementOptions<
	TWindow extends UseActiveElementWindowLike = UseActiveElementWindowLike,
	TDocument extends UseActiveElementDocumentLike = UseActiveElementDocumentLike,
> {
	window?: MaybeTarget<TWindow>;
	document?: MaybeTarget<TDocument>;
	deep?: boolean;
	triggerOnRemoval?: boolean;
}

export interface UseActiveElementReturn<TElement extends Element = Element> {
	readonly activeElement: ReadonlySignal<TElement | null | undefined>;
	stop(): void;
}

export interface UseAnimateWindowLike extends WindowLike {
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseAnimateOptions<
	TWindow extends UseAnimateWindowLike = UseAnimateWindowLike,
> extends KeyframeAnimationOptions {
	window?: MaybeTarget<TWindow>;
	immediate?: boolean;
	commitStyles?: boolean;
	persist?: boolean;
	onReady?: (animate: Animation) => void;
	onError?: (error: unknown) => void;
}

export type UseAnimateKeyframes = MaybeValue<
	Keyframe[] | PropertyIndexedKeyframes | null
>;

export interface UseAnimateReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly animate: ReadonlySignal<Animation | undefined>;
	play(): void;
	pause(): void;
	reverse(): void;
	finish(): void;
	cancel(): void;
	readonly pending: ReadonlySignal<boolean>;
	readonly playState: ReadonlySignal<AnimationPlayState>;
	readonly replaceState: ReadonlySignal<AnimationReplaceState>;
	readonly startTime: Computed<CSSNumberish | null>;
	readonly currentTime: Computed<CSSNumberish | null>;
	readonly timeline: Computed<AnimationTimeline | null>;
	readonly playbackRate: Computed<number>;
	stop(): void;
}

export interface UseStorageOptions<
	T = unknown,
	TWindow extends StorageWindowLike = StorageWindowLike,
> {
	deep?: boolean;
	flush?: StorageWatchFlushType;
	initOnMounted?: boolean;
	listenToStorageChanges?: boolean;
	mergeDefaults?: boolean | ((storageValue: T, defaults: T) => T);
	onError?: (error: unknown) => void;
	serializer?: StorageSerializer<NoInfer<T>>;
	shallow?: boolean;
	window?: MaybeTarget<TWindow>;
	writeDefaults?: boolean;
}

export interface WindowSizeDocumentLike extends DocumentLike {
	readonly documentElement?: {
		readonly clientHeight: number;
		readonly clientWidth: number;
	};
}

export interface VisualViewportLike extends EventTarget {
	readonly height: number;
	readonly scale: number;
	readonly width: number;
}

export interface DocumentVisibilityDocumentLike extends DocumentLike {
	readonly visibilityState?: DocumentVisibilityState;
}

export interface OnlineNavigatorLike extends NavigatorLike {
	readonly onLine?: boolean;
}

export interface WindowSizeLike extends WindowLike {
	readonly document?: WindowSizeDocumentLike;
	readonly innerWidth: number;
	readonly innerHeight: number;
	readonly outerWidth?: number;
	readonly outerHeight?: number;
	readonly visualViewport?: VisualViewportLike | null;
}

export interface UseCounterOptions {
	min?: number;
	max?: number;
	step?: number;
}

export interface UseCounterReturn {
	readonly count: ReadonlySignal<number>;
	dec(delta?: number): void;
	get(): number;
	inc(delta?: number): void;
	reset(value?: number): number;
	set(value: number): void;
}

export interface UseToggleOptions<Truthy = true, Falsy = false> {
	truthyValue?: MaybeValue<Truthy>;
	falsyValue?: MaybeValue<Falsy>;
}

export interface UseToggleReturn<T = boolean> {
	readonly value: ReadonlySignal<T>;
	set(nextValue: T): void;
	toggle(nextValue?: T): T;
}

export type SignalAutoResetReturn<T = unknown> = Signal<T>;

export type SignalDefaultReturn<T = unknown> = Signal<T>;

export interface SignalManualResetReturn<T = unknown> extends Signal<T> {
	reset(): void;
}

export type SignalDebouncedOptions = Omit<
	UseDebounceFnOptions,
	"rejectOnCancel"
>;

export type SignalDebouncedReturn<T = unknown> = ReadonlySignal<T>;

export type SignalThrottledReturn<T = unknown> = ReadonlySignal<T>;

export type SyncSignalDirection = "ltr" | "rtl" | "both";

export interface SyncSignalTransform<L, R> {
	ltr: (left: L) => R;
	rtl: (right: R) => L;
}

type SyncSignalTransformKey = keyof SyncSignalTransform<unknown, unknown>;

type SyncSignalRelevantTransformKey<D extends SyncSignalDirection> =
	D extends "both"
		? SyncSignalTransformKey
		: Extract<D, SyncSignalTransformKey>;

type IsAssignable<From, To> = [From] extends [To] ? true : false;

type SyncSignalRequiredTransformKey<
	L,
	R,
	D extends SyncSignalDirection,
> = D extends "both"
	?
			| (IsAssignable<L, R> extends true ? never : "ltr")
			| (IsAssignable<R, L> extends true ? never : "rtl")
	: D extends "ltr"
		? IsAssignable<L, R> extends true
			? never
			: "ltr"
		: D extends "rtl"
			? IsAssignable<R, L> extends true
				? never
				: "rtl"
			: never;

type SyncSignalOptionalTransformKey<
	L,
	R,
	D extends SyncSignalDirection,
> = Exclude<
	SyncSignalRelevantTransformKey<D>,
	SyncSignalRequiredTransformKey<L, R, D>
>;

type SyncSignalTransformOptions<L, R, D extends SyncSignalDirection> = [
	SyncSignalRequiredTransformKey<L, R, D>,
] extends [never]
	? {
			transform?: Partial<
				Pick<SyncSignalTransform<L, R>, SyncSignalRelevantTransformKey<D>>
			>;
		}
	: {
			transform: Pick<
				SyncSignalTransform<L, R>,
				SyncSignalRequiredTransformKey<L, R, D>
			> &
				Partial<
					Pick<
						SyncSignalTransform<L, R>,
						SyncSignalOptionalTransformKey<L, R, D>
					>
				>;
		};

type SyncSignalDirectionOptions<D extends SyncSignalDirection> =
	D extends "both" ? { direction?: D } : { direction: D };

export type SyncSignalOptions<L, R, D extends SyncSignalDirection = "both"> = {
	deep?: WatchOptions["deep"];
	flush?: WatchOptions["flush"];
	immediate?: boolean;
} & SyncSignalDirectionOptions<D> &
	SyncSignalTransformOptions<L, R, D>;

export type SyncSignalReturn = () => void;

export interface SyncSignalsOptions {
	deep?: WatchOptions["deep"];
	flush?: WatchOptions["flush"];
	immediate?: boolean;
}

export type SyncSignalsReturn = () => void;

export interface UseTimeoutFnOptions {
	immediate?: boolean;
	immediateCallback?: boolean;
}

export interface UseTimeoutFnReturn<TArgs extends unknown[] = []> {
	readonly isPending: ReadonlySignal<boolean>;
	start(...args: TArgs): void;
	stop(): void;
}

export interface UseTimeoutOptions<Controls extends boolean = false>
	extends UseTimeoutFnOptions {
	controls?: Controls;
	callback?: () => void;
}

export type UseTimeoutControlsReturn = {
	readonly ready: ReadonlySignal<boolean>;
} & UseTimeoutFnReturn;

export type UseTimeoutReturn =
	| ReadonlySignal<boolean>
	| UseTimeoutControlsReturn;

export interface UseIntervalFnOptions {
	immediate?: boolean;
	immediateCallback?: boolean;
}

export interface UseIntervalFnReturn {
	readonly isActive: ReadonlySignal<boolean>;
	pause(): void;
	resume(): void;
}

export interface UseIntervalOptions<Controls extends boolean = false> {
	controls?: Controls;
	immediate?: boolean;
	callback?: (count: number) => void;
}

export interface UseIntervalControlsReturn extends UseIntervalFnReturn {
	readonly counter: ReadonlySignal<number>;
	reset(): void;
}

export type UseIntervalReturn =
	| ReadonlySignal<number>
	| UseIntervalControlsReturn;

export interface UseDebounceFnOptions {
	maxWait?: MaybeValue<number>;
	rejectOnCancel?: boolean;
}

export type UseDebounceFnReturn<T> = PromisifyFn<T>;

export type UseThrottleFnReturn<T> = PromisifyFn<T>;

export type UseEventListenerOptions = MaybeValue<
	boolean | AddEventListenerOptions
>;

export interface UseEventListenerReturn {
	stop(): void;
}

export interface UseDocumentVisibilityOptions<
	TDocument extends
		DocumentVisibilityDocumentLike = DocumentVisibilityDocumentLike,
> {
	document?: MaybeTarget<TDocument>;
}

export interface UseDocumentVisibilityReturn {
	readonly visibility: ReadonlySignal<DocumentVisibilityState>;
	stop(): void;
}

export interface UseOnlineOptions<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends OnlineNavigatorLike = OnlineNavigatorLike,
> {
	window?: MaybeTarget<TWindow>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseOnlineReturn {
	readonly isOnline: ReadonlySignal<boolean>;
	stop(): void;
}

export interface UseMediaQueryOptions<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
> {
	initialValue?: boolean;
	ssrWidth?: number;
	window?: MaybeTarget<TWindow>;
}

export interface UseMediaQueryReturn {
	readonly matches: ReadonlySignal<boolean>;
	stop(): void;
}

export type Breakpoints<K extends string = string> = Record<
	K,
	MaybeValue<number | string>
>;

export interface UseBreakpointsOptions<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
> extends UseMediaQueryOptions<TWindow> {
	strategy?: "min-width" | "max-width";
}

export type UseBreakpointsReturn<K extends string = string> = Record<
	K,
	UseMediaQueryReturn
> & {
	active(): ReadonlySignal<K | "">;
	between(first: MaybeValue<K>, second: MaybeValue<K>): UseMediaQueryReturn;
	current(): ReadonlySignal<K[]>;
	greater(key: MaybeValue<K>): UseMediaQueryReturn;
	greaterOrEqual(key: MaybeValue<K>): UseMediaQueryReturn;
	isGreater(key: MaybeValue<K>): boolean;
	isGreaterOrEqual(key: MaybeValue<K>): boolean;
	isInBetween(first: MaybeValue<K>, second: MaybeValue<K>): boolean;
	isSmaller(key: MaybeValue<K>): boolean;
	isSmallerOrEqual(key: MaybeValue<K>): boolean;
	smaller(key: MaybeValue<K>): UseMediaQueryReturn;
	smallerOrEqual(key: MaybeValue<K>): UseMediaQueryReturn;
	stop(): void;
};

export interface UseWindowSizeOptions<
	TWindow extends WindowSizeLike = WindowSizeLike,
> {
	initialWidth?: number;
	initialHeight?: number;
	includeScrollbar?: boolean;
	listenOrientation?: boolean;
	type?: "inner" | "outer" | "visual";
	window?: MaybeTarget<TWindow>;
}

export interface UseWindowSizeReturn {
	readonly width: ReadonlySignal<number>;
	readonly height: ReadonlySignal<number>;
	stop(): void;
}

export interface OnClickOutsideDocumentLike extends DocumentLike {
	readonly activeElement?: Element | null;
	querySelectorAll?(selector: string): Iterable<Element> | ArrayLike<Element>;
}

export interface OnClickOutsideWindowLike extends WindowLike {
	readonly document: OnClickOutsideDocumentLike;
	setTimeout?(
		handler: () => void,
		timeout?: number,
	): ReturnType<typeof globalThis.setTimeout>;
	clearTimeout?(handle: ReturnType<typeof globalThis.setTimeout>): void;
}

export type OnClickOutsideIgnoreTarget = MaybeTarget<Element> | string;

export interface OnClickOutsideOptions<
	Controls extends boolean = false,
	TWindow extends OnClickOutsideWindowLike = OnClickOutsideWindowLike,
> {
	ignore?: MaybeValue<Arrayable<OnClickOutsideIgnoreTarget> | null | undefined>;
	capture?: boolean;
	detectIframe?: boolean;
	controls?: Controls;
	window?: MaybeTarget<TWindow>;
}

export type OnClickOutsideHandler = (
	event: PointerEvent | FocusEvent | Event,
) => void;

export interface OnClickOutsideControlsReturn {
	stop(): void;
	cancel(): void;
	trigger(event: Event): void;
}

export type OnClickOutsideReturn<Controls extends boolean = false> =
	Controls extends true ? OnClickOutsideControlsReturn : () => void;

export type OnElementRemovalDocumentLike = Node;

export interface OnElementRemovalWindowLike extends WindowLike {
	readonly document?: OnElementRemovalDocumentLike;
	readonly MutationObserver?: typeof MutationObserver;
}

export interface OnElementRemovalOptions<
	TWindow extends OnElementRemovalWindowLike = OnElementRemovalWindowLike,
	TDocument extends OnElementRemovalDocumentLike = OnElementRemovalDocumentLike,
> {
	window?: MaybeTarget<TWindow>;
	document?: MaybeTarget<TDocument>;
	flush?: WatchOptions["flush"];
}

export type OnElementRemovalCallback = (
	mutationRecords: MutationRecord[],
) => void;

export type OnElementRemovalReturn = () => void;

export type KeyPredicate = (event: KeyboardEvent) => boolean;
export type KeyFilter = true | Arrayable<string> | KeyPredicate;
export type KeyStrokeEventName = "keydown" | "keypress" | "keyup";

export interface OnKeyStrokeOptions<TTarget extends EventTarget = EventTarget> {
	eventName?: KeyStrokeEventName;
	target?: MaybeTarget<TTarget>;
	passive?: boolean;
	dedupe?: MaybeValue<boolean>;
}

export type OnKeyStrokeHandler = (event: KeyboardEvent) => void;
export type OnKeyStrokeReturn = () => void;

export interface OnLongPressModifiers {
	stop?: boolean;
	once?: boolean;
	prevent?: boolean;
	capture?: boolean;
	self?: boolean;
}

export type OnLongPressDelay = number | ((event: PointerEvent) => number);

export interface OnLongPressOptions {
	delay?: OnLongPressDelay;
	modifiers?: OnLongPressModifiers;
	distanceThreshold?: number | false;
	onMouseUp?: (
		duration: number,
		distance: number,
		isLongPress: boolean,
		event: PointerEvent,
	) => void;
}

export type OnLongPressHandler = (event: PointerEvent) => void;
export type OnLongPressReturn = () => void;

export interface OnStartTypingDocumentLike extends DocumentLike {
	readonly activeElement?: Element | null;
}

export interface OnStartTypingOptions<
	TDocument extends OnStartTypingDocumentLike = OnStartTypingDocumentLike,
> {
	document?: MaybeTarget<TDocument>;
}

export type OnStartTypingHandler = (event: KeyboardEvent) => void;
export type OnStartTypingReturn = () => void;

export type UseMouseCoordType = "page" | "client" | "screen" | "movement";
export type UseMouseSourceType = "mouse" | "touch" | null;
export type UseMouseEventExtractor = (
	event: MouseEvent | Touch,
) => [x: number, y: number] | null | undefined;

export interface MouseWindowLike extends WindowLike {
	readonly scrollX: number;
	readonly scrollY: number;
}

export interface UseMouseOptions<
	TWindow extends MouseWindowLike = MouseWindowLike,
	TTarget extends EventTarget = EventTarget,
> {
	type?: UseMouseCoordType | UseMouseEventExtractor;
	target?: MaybeTarget<TTarget | TWindow>;
	touch?: boolean;
	scroll?: boolean;
	resetOnTouchEnds?: boolean;
	initialValue?: Position;
	window?: MaybeTarget<TWindow>;
}

export interface UseMouseReturn {
	readonly x: ReadonlySignal<number>;
	readonly y: ReadonlySignal<number>;
	readonly sourceType: ReadonlySignal<UseMouseSourceType>;
	stop(): void;
}

export type FocusMethodOptions = FocusOptions;

export interface FocusableElementLike extends EventTarget {
	focus(options?: FocusMethodOptions): void;
	blur(): void;
	matches?(selectors: string): boolean;
}

export interface UseFocusOptions {
	initialValue?: boolean;
	focusVisible?: boolean;
	preventScroll?: boolean;
}

export interface UseFocusReturn {
	readonly focused: Computed<boolean>;
	focus(): void;
	blur(): void;
	stop(): void;
}

export interface ElementSize {
	width: number;
	height: number;
}

export interface ResizeObserverWindowLike extends WindowLike {
	readonly ResizeObserver?: typeof ResizeObserver;
}

export interface UseElementSizeOptions<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> extends ResizeObserverOptions {
	window?: MaybeTarget<TWindow>;
}

export interface UseElementSizeReturn {
	readonly width: ReadonlySignal<number>;
	readonly height: ReadonlySignal<number>;
	stop(): void;
}

export type CloneFn<T> = (value: T) => T;

export interface UseRefHistoryRecord<T> {
	snapshot: T;
	timestamp: number;
}

export interface UseManualRefHistoryOptions<Raw, Serialized = Raw> {
	capacity?: number;
	clone?: boolean | CloneFn<Raw>;
	dump?: (value: Raw) => Serialized;
	parse?: (value: Serialized) => Raw;
	setSource?: (source: Signal<Raw>, value: Raw) => void;
}

export interface UseManualRefHistoryReturn<Raw, Serialized = Raw> {
	readonly source: Signal<Raw>;
	readonly history: ReadonlySignal<UseRefHistoryRecord<Serialized>[]>;
	readonly last: Signal<UseRefHistoryRecord<Serialized>>;
	readonly undoStack: Signal<UseRefHistoryRecord<Serialized>[]>;
	readonly redoStack: Signal<UseRefHistoryRecord<Serialized>[]>;
	readonly canUndo: ReadonlySignal<boolean>;
	readonly canRedo: ReadonlySignal<boolean>;
	clear(): void;
	commit(): void;
	reset(): void;
	undo(): void;
	redo(): void;
}

export interface UseRefHistoryOptions<Raw, Serialized = Raw>
	extends Omit<UseManualRefHistoryOptions<Raw, Serialized>, "setSource"> {
	deep?: boolean;
	flush?: WatchOptions["flush"];
	shouldCommit?: (oldValue: Raw | undefined, newValue: Raw) => boolean;
}

export interface UseRefHistoryReturn<Raw, Serialized = Raw>
	extends UseManualRefHistoryReturn<Raw, Serialized> {
	readonly isTracking: ReadonlySignal<boolean>;
	pause(): void;
	resume(commit?: boolean): void;
	batch(fn: (cancel: () => void) => void): void;
	dispose(): void;
}
