import type {
	Cleanup,
	Computed,
	DeepSignal,
	ReadonlyDeepSignal,
	ReadonlySignal,
	Signal,
	WatchOptions,
	WatchSource,
	WatchStopHandle,
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

export type UrlParams = Record<string, string[] | string | undefined>;

export type UseUrlSearchParamsMode = "history" | "hash" | "hash-params";

export type UseUrlSearchParamsWriteMode = "replace" | "push";

export interface UseUrlSearchParamsHistoryLike {
	readonly state?: unknown;
	replaceState?(state: unknown, title: string, url?: string | URL | null): void;
	pushState?(state: unknown, title: string, url?: string | URL | null): void;
}

export interface UseUrlSearchParamsLocationLike {
	hash: string;
	pathname: string;
	search: string;
}

export interface UseUrlSearchParamsDocumentLike extends DocumentLike {
	readonly title?: string;
}

export interface UseUrlSearchParamsWindowLike extends WindowLike {
	readonly document?: UseUrlSearchParamsDocumentLike;
	readonly history?: UseUrlSearchParamsHistoryLike;
	readonly location?: UseUrlSearchParamsLocationLike;
}

export interface UseUrlSearchParamsOptions<
	T extends object,
	TWindow extends UseUrlSearchParamsWindowLike = UseUrlSearchParamsWindowLike,
> {
	/**
	 * @default true
	 */
	removeNullishValues?: boolean;

	/**
	 * @default false
	 */
	removeFalsyValues?: boolean;

	/**
	 * @default {}
	 */
	initialValue?: T;

	/**
	 * Write back to `window.history` automatically.
	 *
	 * @default true
	 */
	write?: boolean;

	/**
	 * Write mode for `window.history` when `write` is enabled.
	 *
	 * @default "replace"
	 */
	writeMode?: UseUrlSearchParamsWriteMode;

	/**
	 * Custom function to serialize URL parameters.
	 */
	stringify?: (params: URLSearchParams) => string;

	window?: MaybeTarget<TWindow>;
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

export type BasicColorMode = "light" | "dark";

export type UsePreferredColorScheme = "light" | "dark" | "no-preference";

export type UsePreferredColorSchemeReturn =
	Computed<UsePreferredColorScheme> & {
		stop(): void;
	};

export type UsePreferredContrast = "more" | "less" | "custom" | "no-preference";

export type UsePreferredContrastReturn = Computed<UsePreferredContrast> & {
	stop(): void;
};

export type UsePreferredReducedMotion = "reduce" | "no-preference";

export type UsePreferredReducedMotionReturn =
	Computed<UsePreferredReducedMotion> & {
		stop(): void;
	};

export type UsePreferredReducedTransparency = "reduce" | "no-preference";

export type UsePreferredReducedTransparencyReturn =
	Computed<UsePreferredReducedTransparency> & {
		stop(): void;
	};

export type ColorModeSelection<T extends string = BasicColorMode> =
	| T
	| BasicColorMode
	| "auto";

export interface UseColorModeWindowLike extends StorageWindowLike {
	getComputedStyle?(element: Element): CSSStyleDeclaration;
}

export interface UseColorModeDocumentLike extends DocumentLike {
	readonly documentElement?: Element;
	readonly head?: HTMLHeadElement;
	createElement?(tagName: "style"): HTMLStyleElement;
	querySelector?(selectors: string): Element | null;
}

export type UseColorModeDefaultHandler<T extends string = BasicColorMode> = (
	mode: T | BasicColorMode,
) => void;

export interface UseColorModeOptions<T extends string = BasicColorMode> {
	/**
	 * Target element used for class or attribute updates.
	 *
	 * @default document.documentElement
	 */
	target?: MaybeTarget<Element>;
	/**
	 * CSS selector used when target is omitted.
	 *
	 * @default "html"
	 */
	selector?: MaybeValue<string>;
	/**
	 * HTML attribute updated on the target element.
	 *
	 * @default "class"
	 */
	attribute?: MaybeValue<string>;
	/**
	 * Initial selected color mode.
	 *
	 * @default "auto"
	 */
	initialValue?: MaybeValue<ColorModeSelection<T>>;
	/**
	 * DOM values for each selected mode.
	 */
	modes?: MaybeValue<Partial<Record<ColorModeSelection<T>, string>>>;
	/**
	 * Called when the resolved color mode changes.
	 */
	onChanged?: (
		mode: T | BasicColorMode,
		defaultHandler: UseColorModeDefaultHandler<T>,
	) => void;
	/**
	 * Writable signal used instead of useStorage.
	 */
	storageSignal?: Signal<ColorModeSelection<T> | null>;
	/**
	 * Storage key for persisted selected mode. Pass null to disable persistence.
	 *
	 * @default "sigrea-color-scheme"
	 */
	storageKey?: string | null;
	/**
	 * Storage implementation. Defaults to window.localStorage.
	 */
	storage?: MaybeValue<StorageLike | null | undefined>;
	/**
	 * Listen to storage updates from other documents.
	 *
	 * @default true
	 */
	listenToStorageChanges?: boolean;
	/**
	 * Temporarily suppress CSS transitions while the mode is applied.
	 *
	 * @default true
	 */
	disableTransition?: boolean;
	window?: MaybeTarget<UseColorModeWindowLike>;
	document?: MaybeTarget<UseColorModeDocumentLike>;
}

export interface UseColorModeReturn<T extends string = BasicColorMode> {
	readonly mode: Computed<ColorModeSelection<T>>;
	readonly system: ReadonlySignal<BasicColorMode>;
	readonly resolvedMode: ReadonlySignal<T | BasicColorMode>;
	stop(): void;
}

export interface UseDarkOptions
	extends Omit<UseColorModeOptions, "modes" | "onChanged"> {
	/**
	 * Value applied when dark mode is active.
	 *
	 * @default "dark"
	 */
	valueDark?: MaybeValue<string>;
	/**
	 * Value applied when dark mode is inactive.
	 *
	 * @default ""
	 */
	valueLight?: MaybeValue<string>;
	/**
	 * Called when the resolved dark state changes.
	 */
	onChanged?: (
		isDark: boolean,
		defaultHandler: UseColorModeDefaultHandler,
		mode: BasicColorMode,
	) => void;
}

export type UseDarkReturn = Computed<boolean> & {
	stop(): void;
};

export type DateLike = Date | number | string | undefined;

export interface UseDateFormatOptions {
	/**
	 * Locale used for month, weekday, and timezone names.
	 */
	locales?: MaybeValue<Intl.LocalesArgument>;
	/**
	 * Custom meridiem formatter for A/AA/a/aa tokens.
	 */
	customMeridiem?: (
		hours: number,
		minutes: number,
		isLowercase?: boolean,
		hasPeriod?: boolean,
	) => string;
}

export type UseDateFormatReturn = ReadonlySignal<string>;

export type UseConfirmDialogResult<ConfirmData, CancelData> =
	| {
			readonly data?: ConfirmData;
			readonly isCanceled: false;
	  }
	| {
			readonly data?: CancelData;
			readonly isCanceled: true;
	  };

export interface UseConfirmDialogReturn<
	OpenData = unknown,
	ConfirmData = unknown,
	CancelData = unknown,
> {
	readonly isOpen: ReadonlySignal<boolean>;
	open(
		data?: OpenData,
	): Promise<UseConfirmDialogResult<ConfirmData, CancelData>>;
	confirm(data?: ConfirmData): void;
	cancel(data?: CancelData): void;
	onOpen: EventHookOn<[OpenData | undefined]>;
	onConfirm: EventHookOn<[ConfirmData | undefined]>;
	onCancel: EventHookOn<[CancelData | undefined]>;
}

export type UseCountdownScheduler = (
	callback: () => void,
) => UseIntervalFnReturn;

export interface UseCountdownOptions {
	/**
	 * Interval for the countdown in milliseconds.
	 *
	 * @default 1000
	 */
	interval?: MaybeValue<number>;
	/**
	 * Start the countdown immediately.
	 *
	 * @default false
	 */
	immediate?: boolean;
	/**
	 * Custom scheduler used to run countdown ticks.
	 */
	scheduler?: UseCountdownScheduler;
	/**
	 * Called after each countdown tick with the current remaining value.
	 */
	onTick?: (remaining: number) => void;
	/**
	 * Called when the countdown reaches 0.
	 */
	onComplete?: () => void;
}

export interface UseCountdownReturn extends UseIntervalFnReturn {
	readonly remaining: ReadonlySignal<number>;
	reset(countdown?: MaybeValue<number>): void;
	stop(): void;
	start(countdown?: MaybeValue<number>): void;
}

export interface CssSupportsLike {
	supports(property: string, value: string): boolean;
	supports(conditionText: string): boolean;
}

export interface UseCssSupportsWindowLike extends WindowLike {
	readonly CSS?: CssSupportsLike;
}

export interface UseCssSupportsOptions<
	TWindow extends UseCssSupportsWindowLike = UseCssSupportsWindowLike,
> {
	initialValue?: boolean;
	window?: MaybeTarget<TWindow>;
}

export type UseCssSupportsReturn = ReadonlySignal<boolean>;

export interface UseCssVarElementLike extends Element {
	readonly style?: CSSStyleDeclaration;
}

export interface UseCssVarDocumentLike extends DocumentLike {
	readonly documentElement?: UseCssVarElementLike;
}

export interface UseCssVarWindowLike extends WindowLike {
	readonly document?: UseCssVarDocumentLike;
	getComputedStyle?(element: Element): CSSStyleDeclaration;
	readonly MutationObserver?: typeof MutationObserver;
}

export interface UseCssVarOptions<
	TWindow extends UseCssVarWindowLike = UseCssVarWindowLike,
> {
	initialValue?: string;
	observe?: boolean;
	window?: MaybeTarget<TWindow>;
}

export type UseCssVarReturn = Computed<string | null | undefined> & {
	stop(): void;
};

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

export type UseSortedCompareFn<T = unknown> = (
	value: T,
	otherValue: T,
) => number;

export type UseSortedSortFn<T = unknown> = (
	list: T[],
	compareFn: UseSortedCompareFn<T>,
) => T[];

export interface UseSortedOptions<T = unknown> {
	compareFn?: UseSortedCompareFn<T>;
	sortFn?: UseSortedSortFn<T>;
}

export type UseSortedReturn<T = unknown> = ReadonlySignal<T[]>;

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

declare const eventBusKey: unique symbol;

export type EventBusKey<T = unknown> = symbol & {
	readonly [eventBusKey]: T;
};

export type EventBusIdentifier<T = unknown> = EventBusKey<T> | string | number;

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

export type EventBusListener<T = unknown> = EventHookCallback<T>;

export type EventBusEvents<T = unknown> = Set<EventBusListener<T>>;

export interface UseEventBusReturn<T = unknown> {
	on(listener: EventBusListener<T>): { off: () => void };
	once(listener: EventBusListener<T>): { off: () => void };
	off(listener: EventBusListener<T>): void;
	emit(...args: EventHookArgs<T>): Promise<unknown[]>;
	reset(): void;
}

export type UseEventSourceStatus = "CONNECTING" | "OPEN" | "CLOSED";
export type EventSourceStatus = UseEventSourceStatus;

export interface EventSourceLike extends EventTarget {
	readonly readyState: number;
	readonly CONNECTING?: 0;
	readonly OPEN?: 1;
	readonly CLOSED?: 2;
	close(): void;
}

export interface EventSourceConstructorLike<
	TEventSource extends EventSourceLike = EventSourceLike,
> {
	new (url: string | URL, eventSourceInitDict?: EventSourceInit): TEventSource;
	readonly CONNECTING?: 0;
	readonly OPEN?: 1;
	readonly CLOSED?: 2;
}

export interface EventSourceWindowLike<
	TEventSource extends EventSourceLike = EventSourceLike,
> extends WindowLike {
	readonly EventSource?: EventSourceConstructorLike<TEventSource>;
}

export interface UseEventSourceSerializer<Data> {
	read(value?: string): Data | undefined;
}

export interface UseEventSourceOptions<
	Data = string,
	TEventSource extends EventSourceLike = EventSourceLike,
	TWindow extends
		EventSourceWindowLike<TEventSource> = EventSourceWindowLike<TEventSource>,
> extends EventSourceInit {
	immediate?: boolean;
	autoConnect?: boolean;
	serializer?: UseEventSourceSerializer<Data>;
	window?: MaybeTarget<TWindow>;
}

export interface UseEventSourceReturn<
	Events extends readonly string[] = readonly string[],
	Data = string,
	TEventSource extends EventSourceLike = EventSourceLike,
> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly eventSource: ReadonlySignal<TEventSource | undefined>;
	readonly data: ReadonlySignal<Data | undefined>;
	readonly status: ReadonlySignal<UseEventSourceStatus>;
	readonly event: ReadonlySignal<Events[number] | undefined>;
	readonly error: ReadonlySignal<unknown | null>;
	readonly lastEventId: ReadonlySignal<string>;
	open(): void;
	close(): void;
	stop(): void;
}

export interface EyeDropperOpenOptions {
	signal?: AbortSignal;
}

export interface EyeDropperResult {
	readonly sRGBHex: string;
}

export interface EyeDropperLike {
	open(options?: EyeDropperOpenOptions): Promise<EyeDropperResult>;
}

export interface EyeDropperConstructorLike<
	TEyeDropper extends EyeDropperLike = EyeDropperLike,
> {
	new (): TEyeDropper;
}

export interface UseEyeDropperWindowLike<
	TEyeDropper extends EyeDropperLike = EyeDropperLike,
> extends WindowLike {
	readonly EyeDropper?: EyeDropperConstructorLike<TEyeDropper>;
}

export interface UseEyeDropperOptions<
	TEyeDropper extends EyeDropperLike = EyeDropperLike,
	TWindow extends
		UseEyeDropperWindowLike<TEyeDropper> = UseEyeDropperWindowLike<TEyeDropper>,
> {
	initialValue?: string;
	window?: MaybeTarget<TWindow>;
}

export interface UseEyeDropperReturn<
	TEyeDropper extends EyeDropperLike = EyeDropperLike,
> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isOpen: ReadonlySignal<boolean>;
	readonly sRGBHex: ReadonlySignal<string>;
	readonly error: ReadonlySignal<unknown | null>;
	open(
		openOptions?: EyeDropperOpenOptions,
	): Promise<EyeDropperResult | undefined>;
	abort(): void;
	stop(): void;
}

export interface UseFaviconDocumentLike extends DocumentLike {
	readonly head?: HTMLHeadElement;
	createElement(tagName: "link"): HTMLLinkElement;
}

export interface UseFaviconOptions<
	TDocument extends UseFaviconDocumentLike = UseFaviconDocumentLike,
> {
	baseUrl?: string;
	document?: MaybeTarget<TDocument>;
	media?: string;
	rel?: string;
	sizes?: string;
	type?: string;
}

export type UseFaviconReturn = Computed<string | null | undefined> & {
	stop(): void;
};

export interface UseTitleDocumentLike extends DocumentLike {
	readonly defaultView?: UseMutationObserverWindowLike | null;
	readonly head?: HTMLHeadElement;
	title: string;
}

export type UseTitleTemplate =
	| string
	| Signal<string>
	| ReadonlySignal<string>
	| Computed<string>
	| ((title: string) => string);

export type UseTitleRestore = (
	originalTitle: string,
	currentTitle: string,
) => string | null | undefined;

interface UseTitleOptionsBase<
	TDocument extends UseTitleDocumentLike = UseTitleDocumentLike,
> {
	document?: MaybeTarget<TDocument | null | undefined>;
	restoreOnUnmount?: false | UseTitleRestore;
}

export type UseTitleOptions<
	TDocument extends UseTitleDocumentLike = UseTitleDocumentLike,
> = UseTitleOptionsBase<TDocument> &
	(
		| {
				/**
				 * Observe external `document.title` changes.
				 *
				 * Cannot be used together with `titleTemplate`.
				 *
				 * @default false
				 */
				observe?: boolean;
				titleTemplate?: never;
		  }
		| {
				observe?: never;
				/**
				 * Template applied before writing to `document.title`.
				 *
				 * A string template replaces every `%s` with the current title.
				 * A callback receives the current title and returns the document title.
				 *
				 * @default "%s"
				 */
				titleTemplate?: UseTitleTemplate;
		  }
	);

export type UseTitleReturn = Computed<string | null | undefined> & {
	stop(): void;
};

export interface UseToNumberOptions {
	/**
	 * Method to use to convert the value to a number.
	 *
	 * Or a custom function for the conversion.
	 *
	 * @default "parseFloat"
	 */
	method?: "parseFloat" | "parseInt" | ((value: string | number) => number);

	/**
	 * The base in mathematical numeral systems passed to `parseInt`.
	 * Only works with `method: "parseInt"`.
	 */
	radix?: number;

	/**
	 * Replace NaN with zero.
	 *
	 * @default false
	 */
	nanToZero?: boolean;
}

export type UseToStringReturn = ReadonlySignal<string>;

export type CubicBezierPoints = readonly [number, number, number, number];

export type EasingFunction = (value: number) => number;

export type TransitionEasing = EasingFunction | CubicBezierPoints;

export type MaybeTransitionEasing =
	| TransitionEasing
	| Signal<TransitionEasing>
	| ReadonlySignal<TransitionEasing>
	| Computed<TransitionEasing>;

export type InterpolationFunction<T> = (from: T, to: T, alpha: number) => T;

export interface UseTransitionWindowLike extends WindowLike {
	requestAnimationFrame?(callback: FrameRequestCallback): number;
}

export interface TransitionOptions<
	T,
	TWindow extends UseTransitionWindowLike = UseTransitionWindowLike,
> {
	/**
	 * Manually abort a transition.
	 */
	abort?: () => unknown;

	/**
	 * Transition duration in milliseconds.
	 */
	duration?: MaybeValue<number>;

	/**
	 * Easing function or cubic bezier points to calculate transition progress.
	 */
	easing?: MaybeTransitionEasing;

	/**
	 * Custom interpolation function.
	 */
	interpolation?: InterpolationFunction<T>;

	window?: MaybeTarget<TWindow>;
}

export interface UseTransitionOptions<
	T,
	TWindow extends UseTransitionWindowLike = UseTransitionWindowLike,
> extends TransitionOptions<T, TWindow> {
	/**
	 * Milliseconds to wait before starting transition.
	 */
	delay?: MaybeValue<number>;

	/**
	 * Disables the transition.
	 */
	disabled?: MaybeValue<boolean>;

	/**
	 * Callback to execute after transition finishes.
	 */
	onFinished?: () => void;

	/**
	 * Callback to execute after transition starts.
	 */
	onStarted?: () => void;
}

export type UseTransitionVector<T extends readonly unknown[]> = {
	[K in keyof T]: number;
};

export type UseTransitionReturn<T = unknown> = ReadonlySignal<T>;

export type UseFetchDataType =
	| "text"
	| "json"
	| "blob"
	| "arrayBuffer"
	| "formData";

export type UseFetchMethod =
	| "GET"
	| "POST"
	| "PUT"
	| "DELETE"
	| "PATCH"
	| "HEAD"
	| "OPTIONS";

export type UseFetchUrl = string | URL;

export type UseFetchFetch = (
	input: RequestInfo | URL,
	init?: RequestInit,
) => Promise<Response>;

export interface UseFetchWindowLike extends WindowLike {
	readonly fetch?: UseFetchFetch;
}

export interface BeforeFetchContext {
	url: UseFetchUrl;
	options: RequestInit;
	cancel(): void;
}

export interface AfterFetchContext<Data = unknown> {
	response: Response;
	data: Data | null;
	context: BeforeFetchContext;
	execute(throwOnFailed?: boolean): Promise<Response | null>;
}

export interface OnFetchErrorContext<Data = unknown, Error = unknown> {
	error: Error;
	data: Data | null;
	response: Response | null;
	context: BeforeFetchContext;
	execute(throwOnFailed?: boolean): Promise<Response | null>;
}

export interface UseFetchOptions<
	Data = unknown,
	TWindow extends UseFetchWindowLike = UseFetchWindowLike,
> {
	fetch?: UseFetchFetch;
	window?: MaybeTarget<TWindow>;
	/**
	 * Execute the request after creation.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Re-run the request when reactive URL or payload values change.
	 *
	 * @default false
	 */
	refetch?: MaybeValue<boolean>;
	/**
	 * Initial data before the first request finishes.
	 *
	 * @default null
	 */
	initialData?: MaybeValue<Data | null>;
	/**
	 * Abort the request after this many milliseconds. Zero disables the timeout.
	 *
	 * @default 0
	 */
	timeout?: MaybeValue<number>;
	/**
	 * Update data from onFetchError context.
	 *
	 * @default false
	 */
	updateDataOnError?: boolean;
	beforeFetch?:
		| ((
				context: BeforeFetchContext,
		  ) =>
				| Promise<Partial<BeforeFetchContext> | void>
				| Partial<BeforeFetchContext>
				| void)
		| undefined;
	afterFetch?:
		| ((
				context: AfterFetchContext<Data>,
		  ) =>
				| Promise<Partial<AfterFetchContext<Data>> | void>
				| Partial<AfterFetchContext<Data>>
				| void)
		| undefined;
	onFetchError?:
		| ((
				context: OnFetchErrorContext<Data>,
		  ) =>
				| Promise<Partial<OnFetchErrorContext<Data>> | void>
				| Partial<OnFetchErrorContext<Data>>
				| void)
		| undefined;
}

export interface UseFetchReturnBase<Data = unknown> {
	readonly isFinished: ReadonlySignal<boolean>;
	readonly isFetching: ReadonlySignal<boolean>;
	readonly canAbort: ReadonlySignal<boolean>;
	readonly aborted: ReadonlySignal<boolean>;
	readonly statusCode: ReadonlySignal<number | null>;
	readonly response: ReadonlySignal<Response | null>;
	readonly error: ReadonlySignal<unknown | null>;
	readonly data: ReadonlySignal<Data | null>;
	execute(throwOnFailed?: boolean): Promise<Response | null>;
	abort(reason?: unknown): void;
	stop(): void;
	onFetchResponse: EventHookOn<Response>;
	onFetchError: EventHookOn<unknown>;
	onFetchFinally: EventHookOn<void>;
	get(): UseFetchReturn<Data>;
	post(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	put(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	delete(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	patch(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	head(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	options(payload?: MaybeValue<unknown>, type?: string): UseFetchReturn<Data>;
	json<Json = unknown>(): UseFetchReturn<Json>;
	text(): UseFetchReturn<string>;
	blob(): UseFetchReturn<Blob>;
	arrayBuffer(): UseFetchReturn<ArrayBuffer>;
	formData(): UseFetchReturn<FormData>;
}

export type UseFetchReturn<Data = unknown> = UseFetchReturnBase<Data> &
	PromiseLike<UseFetchReturnBase<Data>>;

export interface UseFileDialogInputLike extends HTMLInputElement {
	webkitdirectory: boolean;
}

export interface UseFileDialogDocumentLike extends DocumentLike {
	readonly defaultView?:
		| (WindowLike & {
				readonly DataTransfer?: { new (): DataTransfer };
		  })
		| null;
	createElement(tagName: "input"): UseFileDialogInputLike;
}

export interface UseFileDialogOptions<
	TDocument extends UseFileDialogDocumentLike = UseFileDialogDocumentLike,
> {
	/**
	 * Allow multiple files to be selected.
	 *
	 * @default true
	 */
	multiple?: MaybeValue<boolean>;
	/**
	 * Accepted file types.
	 *
	 * @default ""
	 */
	accept?: MaybeValue<string>;
	/**
	 * Preferred capture source for file inputs that accept media.
	 */
	capture?: MaybeValue<string | undefined>;
	/**
	 * Reset current files when opening the dialog.
	 *
	 * @default false
	 */
	reset?: MaybeValue<boolean>;
	/**
	 * Select directories instead of files where the browser supports it.
	 *
	 * @default false
	 */
	directory?: MaybeValue<boolean>;
	initialFiles?: FileList | readonly File[] | null;
	document?: MaybeTarget<TDocument>;
	input?: MaybeTarget<UseFileDialogInputLike>;
}

export type UseFileDialogOpenOptions = Partial<
	Pick<
		UseFileDialogOptions,
		"accept" | "capture" | "directory" | "multiple" | "reset"
	>
>;

export interface UseFileDialogReturn {
	readonly files: ReadonlySignal<FileList | null>;
	open(options?: UseFileDialogOpenOptions): void;
	reset(): void;
	onChange: EventHookOn<FileList | null>;
	onCancel: EventHookOn<void>;
	stop(): void;
}

export type FileSystemAccessDataType = "ArrayBuffer" | "Blob" | "Text";

export interface FileSystemAccessAcceptType {
	description?: string;
	accept: Record<string, readonly string[]>;
}

export type FileSystemAccessWellKnownDirectory =
	| "desktop"
	| "documents"
	| "downloads"
	| "music"
	| "pictures"
	| "videos";

export type FileSystemAccessStartInDirectory =
	| FileSystemHandle
	| FileSystemAccessWellKnownDirectory;

export interface FileSystemAccessPickerOptions {
	excludeAcceptAllOption?: boolean;
	id?: string;
	startIn?: FileSystemAccessStartInDirectory;
	types?: readonly FileSystemAccessAcceptType[];
}

export interface FileSystemAccessShowOpenFileOptions
	extends FileSystemAccessPickerOptions {
	multiple?: boolean;
}

export interface FileSystemAccessShowSaveFileOptions
	extends FileSystemAccessPickerOptions {
	suggestedName?: string;
}

export type FileSystemAccessWriteData = string | BufferSource | Blob;

export interface FileSystemAccessWritableFileStreamLike {
	write(data: FileSystemAccessWriteData): Promise<void>;
	close(): Promise<void>;
}

export interface FileSystemAccessCreateWritableOptions {
	keepExistingData?: boolean;
}

export interface FileSystemAccessFileHandleLike {
	getFile(): Promise<File>;
	createWritable(
		options?: FileSystemAccessCreateWritableOptions,
	): Promise<FileSystemAccessWritableFileStreamLike>;
}

export interface FileSystemAccessWindowLike<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
> extends WindowLike {
	showOpenFilePicker?: (
		options?: FileSystemAccessShowOpenFileOptions,
	) => Promise<readonly TFileHandle[]>;
	showSaveFilePicker?: (
		options?: FileSystemAccessShowSaveFileOptions,
	) => Promise<TFileHandle>;
}

export interface UseFileSystemAccessPickerOptions {
	excludeAcceptAllOption?: MaybeValue<boolean | undefined>;
	id?: MaybeValue<string | undefined>;
	startIn?: MaybeValue<FileSystemAccessStartInDirectory | undefined>;
	types?: MaybeValue<readonly FileSystemAccessAcceptType[] | undefined>;
}

export type UseFileSystemAccessOpenOptions = UseFileSystemAccessPickerOptions;

export interface UseFileSystemAccessSaveOptions
	extends UseFileSystemAccessPickerOptions {
	suggestedName?: MaybeValue<string | undefined>;
}

export interface UseFileSystemAccessOptions<
	TWindow extends FileSystemAccessWindowLike = FileSystemAccessWindowLike,
> extends UseFileSystemAccessPickerOptions {
	dataType?: MaybeValue<FileSystemAccessDataType>;
	window?: MaybeTarget<TWindow>;
}

export interface UseFileSystemAccessReturn<Data = string | ArrayBuffer | Blob> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly data: Signal<Data | undefined>;
	readonly file: ReadonlySignal<File | undefined>;
	readonly fileName: ReadonlySignal<string>;
	readonly fileMIME: ReadonlySignal<string>;
	readonly fileSize: ReadonlySignal<number>;
	readonly fileLastModified: ReadonlySignal<number>;
	readonly error: ReadonlySignal<unknown | null>;
	open(options?: UseFileSystemAccessOpenOptions): Promise<void>;
	create(options?: UseFileSystemAccessSaveOptions): Promise<void>;
	save(options?: UseFileSystemAccessSaveOptions): Promise<void>;
	saveAs(options?: UseFileSystemAccessSaveOptions): Promise<void>;
	updateData(): Promise<void>;
	stop(): void;
}

export interface Position {
	x: number;
	y: number;
}

export interface StorageLike {
	getItem(key: string): string | null;
	setItem(key: string, value: string): void;
	removeItem(key: string): void;
}

export type Awaitable<T> = T | PromiseLike<T>;

export interface AsyncStorageLike {
	getItem(key: string): Awaitable<string | null>;
	setItem(key: string, value: string): Awaitable<void>;
	removeItem(key: string): Awaitable<void>;
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

export interface AsyncStorageSerializer<T = unknown> {
	read(raw: string): Awaitable<T>;
	write(value: T): Awaitable<string>;
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

export interface UseStorageAsyncOptions<
	T = unknown,
	TWindow extends StorageWindowLike = StorageWindowLike,
> extends Omit<UseStorageOptions<T, TWindow>, "serializer"> {
	onReady?: (value: T | null) => void;
	serializer?: AsyncStorageSerializer<NoInfer<T>>;
}

export type UseStorageAsyncReturn<T> = RemovableSignal<T | null> &
	PromiseLike<RemovableSignal<T | null>>;

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

export type DeviceMotionPermissionState = "granted" | "denied";

export interface DeviceMotionEventConstructorLike {
	new (type: string, eventInitDict?: DeviceMotionEventInit): DeviceMotionEvent;
	requestPermission?(): Promise<DeviceMotionPermissionState>;
}

export interface UseDeviceMotionWindowLike extends WindowLike {
	readonly DeviceMotionEvent?: DeviceMotionEventConstructorLike;
}

export type DeviceOrientationPermissionState = "granted" | "denied";

export interface DeviceOrientationEventConstructorLike {
	new (
		type: string,
		eventInitDict?: DeviceOrientationEventInit,
	): DeviceOrientationEvent;
	requestPermission?(
		absolute?: boolean,
	): Promise<DeviceOrientationPermissionState>;
}

export interface UseDeviceOrientationWindowLike extends WindowLike {
	readonly DeviceOrientationEvent?: DeviceOrientationEventConstructorLike;
}

export type OrientationType =
	| "portrait-primary"
	| "portrait-secondary"
	| "landscape-primary"
	| "landscape-secondary";

export type OrientationLockType =
	| "any"
	| "natural"
	| "landscape"
	| "portrait"
	| "portrait-primary"
	| "portrait-secondary"
	| "landscape-primary"
	| "landscape-secondary";

export interface UseScreenOrientationScreenOrientationLike extends EventTarget {
	readonly type?: OrientationType;
	readonly angle?: number;
	lock?(type: OrientationLockType): Promise<void>;
	unlock?(): void;
}

export interface UseScreenOrientationWindowLike extends WindowLike {
	readonly screen?: {
		readonly orientation?: UseScreenOrientationScreenOrientationLike | null;
	};
}

export interface UseScreenOrientationOptions<
	TWindow extends
		UseScreenOrientationWindowLike = UseScreenOrientationWindowLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseScreenOrientationReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly orientation: ReadonlySignal<OrientationType | undefined>;
	readonly angle: ReadonlySignal<number>;
	lockOrientation(type: OrientationLockType): Promise<void>;
	unlockOrientation(): void;
	stop(): void;
}

export interface UseScreenSafeAreaElementLike extends Element {
	readonly style?: CSSStyleDeclaration;
}

export interface UseScreenSafeAreaDocumentLike extends DocumentLike {
	readonly documentElement?: UseScreenSafeAreaElementLike | null;
}

export interface UseScreenSafeAreaVisualViewportLike extends EventTarget {}

export interface UseScreenSafeAreaWindowLike extends WindowLike {
	readonly document?: UseScreenSafeAreaDocumentLike;
	readonly visualViewport?: UseScreenSafeAreaVisualViewportLike | null;
	getComputedStyle?(element: Element): CSSStyleDeclaration;
}

export interface UseScreenSafeAreaOptions<
	TWindow extends UseScreenSafeAreaWindowLike = UseScreenSafeAreaWindowLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseScreenSafeAreaReturn {
	readonly top: ReadonlySignal<string>;
	readonly right: ReadonlySignal<string>;
	readonly bottom: ReadonlySignal<string>;
	readonly left: ReadonlySignal<string>;
	update(): void;
	stop(): void;
}

export interface UseScriptTagDocumentLike extends DocumentLike {
	readonly head?: HTMLHeadElement | null;
	createElement(tagName: "script"): HTMLScriptElement;
	querySelectorAll<TElement extends Element = Element>(
		selectors: string,
	): NodeListOf<TElement>;
}

export interface UseScriptTagOptions<
	TDocument extends UseScriptTagDocumentLike = UseScriptTagDocumentLike,
> {
	immediate?: boolean;
	manual?: boolean;
	async?: boolean;
	type?: string;
	defer?: boolean;
	crossOrigin?: "anonymous" | "use-credentials" | "";
	referrerPolicy?: ReferrerPolicy;
	noModule?: boolean;
	nonce?: string;
	attrs?: Record<string, string>;
	document?: MaybeTarget<TDocument | null | undefined>;
}

export interface UseScriptTagReturn {
	readonly scriptTag: ReadonlySignal<HTMLScriptElement | null>;
	load(waitForScriptLoad?: boolean): Promise<HTMLScriptElement | false>;
	unload(): void;
}

export interface UseStyleTagDocumentLike extends DocumentLike {
	readonly head?: HTMLHeadElement | null;
	createElement(tagName: "style"): HTMLStyleElement;
	getElementById(elementId: string): HTMLElement | null;
}

export interface UseStyleTagOptions<
	TDocument extends UseStyleTagDocumentLike = UseStyleTagDocumentLike,
> {
	document?: MaybeTarget<TDocument | null | undefined>;
	media?: string;
	immediate?: boolean;
	manual?: boolean;
	id?: string;
	nonce?: string;
}

export interface UseStyleTagReturn {
	readonly id: string;
	readonly css: Signal<string>;
	load(): void;
	unload(): void;
	readonly isLoaded: ReadonlySignal<boolean>;
}

export interface OnlineNavigatorLike extends NavigatorLike {
	readonly onLine?: boolean;
}

export type UseNetworkType =
	| "bluetooth"
	| "cellular"
	| "ethernet"
	| "mixed"
	| "none"
	| "wifi"
	| "wimax"
	| "other"
	| "unknown";

export type UseNetworkEffectiveType = "slow-2g" | "2g" | "3g" | "4g";

export interface UseNetworkConnectionLike extends EventTarget {
	readonly downlink?: number;
	readonly downlinkMax?: number;
	readonly effectiveType?: UseNetworkEffectiveType;
	readonly rtt?: number;
	readonly saveData?: boolean;
	readonly type?: UseNetworkType;
}

export interface UseNetworkNavigatorLike extends OnlineNavigatorLike {
	readonly connection?: UseNetworkConnectionLike | null;
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

export interface UseCycleListOptions<T> {
	initialValue?: MaybeValue<T>;
	fallbackIndex?: MaybeValue<number>;
	getIndexOf?: (value: T | undefined, list: T[]) => number;
}

export interface UseCycleListReturn<T> {
	readonly state: Signal<T | undefined>;
	readonly index: Signal<number>;
	next(delta?: number): T | undefined;
	prev(delta?: number): T | undefined;
	go(index: number): T | undefined;
}

export type UseStepperArrayStep = string | number;

export type UseStepperObjectSteps = Record<string, MaybeValue<unknown>>;

export type UseStepperResolvedStep<T> = T extends Signal<infer Value>
	? Value
	: T extends ReadonlySignal<infer Value>
		? Value
		: T extends Computed<infer Value>
			? Value
			: T extends () => infer Value
				? Value
				: T;

export type UseStepperObjectStepName<T extends UseStepperObjectSteps> =
	| Extract<keyof T, string>
	| `${Extract<keyof T, number>}`;

export type UseStepperObjectStepValue<
	T extends UseStepperObjectSteps,
	TStepName extends UseStepperObjectStepName<T>,
> = TStepName extends keyof T
	? UseStepperResolvedStep<T[TStepName]>
	: TStepName extends `${infer TNumberKey extends number}`
		? TNumberKey extends keyof T
			? UseStepperResolvedStep<T[TNumberKey]>
			: never
		: never;

export type UseStepperResolvedObject<T extends UseStepperObjectSteps> = {
	[TKey in UseStepperObjectStepName<T>]: UseStepperObjectStepValue<T, TKey>;
};

export interface UseStepperReturn<
	StepName extends UseStepperArrayStep,
	Steps,
	Step,
> {
	readonly steps: ReadonlySignal<Steps>;
	readonly stepNames: ReadonlySignal<StepName[]>;
	readonly index: Computed<number>;
	readonly current: ReadonlySignal<Step | undefined>;
	readonly next: ReadonlySignal<StepName | undefined>;
	readonly previous: ReadonlySignal<StepName | undefined>;
	readonly isFirst: ReadonlySignal<boolean>;
	readonly isLast: ReadonlySignal<boolean>;
	at(index: number): Step | undefined;
	get(step: StepName): Step | undefined;
	goTo(step: StepName): void;
	goToNext(): void;
	goToPrevious(): void;
	goBackTo(step: StepName): void;
	isNext(step: StepName): boolean;
	isPrevious(step: StepName): boolean;
	isCurrent(step: StepName): boolean;
	isBefore(step: StepName): boolean;
	isAfter(step: StepName): boolean;
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

export type UseTimeoutPollCallback = () => Awaitable<void>;

export interface UseTimeoutPollOptions {
	immediate?: boolean;
	immediateCallback?: boolean;
}

export type UseTimeoutPollReturn = UseIntervalFnReturn;

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

export type UseTimeAgoFormatter<T = number> = (
	value: T,
	isPast: boolean,
) => string;

export type UseTimeAgoUnitNamesDefault =
	| "second"
	| "minute"
	| "hour"
	| "day"
	| "week"
	| "month"
	| "year";

export interface UseTimeAgoMessagesBuiltIn {
	justNow: string;
	past: string | UseTimeAgoFormatter<string>;
	future: string | UseTimeAgoFormatter<string>;
	invalid: string;
}

export type UseTimeAgoMessages<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
> = UseTimeAgoMessagesBuiltIn &
	Record<
		Exclude<UnitNames, keyof UseTimeAgoMessagesBuiltIn>,
		string | UseTimeAgoFormatter<number>
	>;

export interface UseTimeAgoUnit<
	UnitName extends string = UseTimeAgoUnitNamesDefault,
> {
	max: number;
	value: number;
	name: UnitName;
}

export interface UseTimeAgoFormatOptions<
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
> {
	/**
	 * Maximum unit or milliseconds before formatting as a full date.
	 */
	max?: UnitNames | number;
	/**
	 * Formatter used when the date is beyond max.
	 */
	fullDateFormatter?: (date: Date) => string;
	/**
	 * Messages used for relative time text.
	 */
	messages?: UseTimeAgoMessages<UnitNames>;
	/**
	 * Show seconds for differences under one minute.
	 *
	 * @default false
	 */
	showSecond?: boolean;
	/**
	 * Rounding method or decimal precision.
	 *
	 * @default "round"
	 */
	rounding?: "round" | "ceil" | "floor" | number;
	/**
	 * Units used to choose the display granularity.
	 */
	units?: UseTimeAgoUnit<UnitNames>[];
}

export interface UseTimeAgoOptions<
	Controls extends boolean = false,
	UnitNames extends string = UseTimeAgoUnitNamesDefault,
> extends UseTimeAgoFormatOptions<UnitNames> {
	/**
	 * Expose pause and resume controls.
	 *
	 * @default false
	 */
	controls?: Controls;
	/**
	 * Intervals to update in milliseconds. Set 0 to disable auto update.
	 *
	 * @default 30000
	 */
	updateInterval?: MaybeValue<number>;
	/**
	 * Custom scheduler. When provided, it owns the update timing.
	 */
	scheduler?: UseNowScheduler;
}

export interface UseTimeAgoControlsReturn extends UseIntervalFnReturn {
	readonly timeAgo: ReadonlySignal<string>;
}

export type UseTimeAgoReturn<Controls extends boolean = false> =
	Controls extends true ? UseTimeAgoControlsReturn : ReadonlySignal<string>;

export interface UseTimeAgoIntlUnit {
	name: Intl.RelativeTimeFormatUnit;
	ms: number;
}

export type UseTimeAgoIntlJoinParts = (
	parts: Intl.RelativeTimeFormatPart[],
	locale?: Intl.LocalesArgument,
) => string;

export interface UseTimeAgoIntlFormatOptions {
	/**
	 * Locale used by Intl.RelativeTimeFormat.
	 */
	locale?: MaybeValue<Intl.LocalesArgument>;
	/**
	 * Options passed to Intl.RelativeTimeFormat.
	 *
	 * @default { numeric: "auto" }
	 */
	relativeTimeFormatOptions?: Intl.RelativeTimeFormatOptions;
	/**
	 * Insert spaces between formatted parts.
	 *
	 * @default true
	 */
	insertSpace?: boolean;
	/**
	 * Custom formatter for Intl.RelativeTimeFormat.formatToParts output.
	 */
	joinParts?: UseTimeAgoIntlJoinParts;
	/**
	 * Units used to choose the display granularity.
	 */
	units?: UseTimeAgoIntlUnit[];
}

export interface UseTimeAgoIntlOptions<Controls extends boolean = false>
	extends UseTimeAgoIntlFormatOptions {
	/**
	 * Expose pause and resume controls and Intl parts.
	 *
	 * @default false
	 */
	controls?: Controls;
	/**
	 * Intervals to update in milliseconds. Set 0 to disable auto update.
	 *
	 * @default 30000
	 */
	updateInterval?: MaybeValue<number>;
	/**
	 * Custom scheduler. When provided, it owns the update timing.
	 */
	scheduler?: UseNowScheduler;
}

export interface UseTimeAgoIntlControlsReturn extends UseIntervalFnReturn {
	readonly timeAgoIntl: ReadonlySignal<string>;
	readonly parts: ReadonlySignal<Intl.RelativeTimeFormatPart[]>;
}

export type UseTimeAgoIntlReturn<Controls extends boolean = false> =
	Controls extends true ? UseTimeAgoIntlControlsReturn : ReadonlySignal<string>;

export interface UseNowWindowLike extends WindowLike {
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export type UseNowInterval = MaybeValue<number> | "requestAnimationFrame";

export type UseNowScheduler = (callback: () => void) => UseIntervalFnReturn;

export interface UseNowOptions<Controls extends boolean = false> {
	controls?: Controls;
	/**
	 * Start updating immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Update interval in milliseconds, or animation frame scheduling.
	 *
	 * @default "requestAnimationFrame"
	 */
	interval?: UseNowInterval;
	/**
	 * Custom scheduler. When provided, it owns the update timing.
	 */
	scheduler?: UseNowScheduler;
	window?: MaybeTarget<UseNowWindowLike | null | undefined>;
}

export interface UseNowControlsReturn extends UseIntervalFnReturn {
	readonly now: ReadonlySignal<Date>;
}

export type UseNowReturn<Controls extends boolean = false> =
	Controls extends true ? UseNowControlsReturn : ReadonlySignal<Date>;

export type UseTimestampInterval = UseNowInterval;

export type UseTimestampScheduler = UseNowScheduler;

export interface UseTimestampOptions<Controls extends boolean = false> {
	controls?: Controls;
	/**
	 * Offset added to the timestamp.
	 *
	 * @default 0
	 */
	offset?: MaybeValue<number>;
	/**
	 * Start updating immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Update interval in milliseconds, or animation frame scheduling.
	 *
	 * @default "requestAnimationFrame"
	 */
	interval?: UseTimestampInterval;
	/**
	 * Custom scheduler. When provided, it owns the update timing.
	 */
	scheduler?: UseTimestampScheduler;
	/**
	 * Called after each timestamp update.
	 */
	callback?: (timestamp: number) => void;
}

export interface UseTimestampControlsReturn extends UseIntervalFnReturn {
	readonly timestamp: ReadonlySignal<number>;
}

export type UseTimestampReturn<Controls extends boolean = false> =
	Controls extends true ? UseTimestampControlsReturn : ReadonlySignal<number>;

export interface UseRafFnCallbackArguments {
	readonly delta: number;
	readonly timestamp: DOMHighResTimeStamp;
}

export type UseRafFnCallback = (args: UseRafFnCallbackArguments) => void;

export interface UseRafFnWindowLike extends WindowLike {
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseRafFnOptions<
	TWindow extends UseRafFnWindowLike = UseRafFnWindowLike,
> {
	/**
	 * Start the loop immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Maximum callback frequency. `null` disables the limit.
	 *
	 * @default null
	 */
	fpsLimit?: MaybeValue<number | null>;
	/**
	 * Stop after the first callback.
	 *
	 * @default false
	 */
	once?: boolean;
	window?: MaybeTarget<TWindow>;
}

export type UseRafFnReturn = UseIntervalFnReturn;

export type UseObjectUrlObject = Blob | MediaSource;

export interface UseObjectUrlUrlLike {
	createObjectURL(object: UseObjectUrlObject): string;
	revokeObjectURL(objectURL: string): void;
}

export interface UseObjectUrlWindowLike extends WindowLike {
	readonly URL?: UseObjectUrlUrlLike;
}

export interface UseObjectUrlOptions {
	window?: MaybeTarget<UseObjectUrlWindowLike | null | undefined>;
}

export interface UseObjectUrlReturn {
	readonly url: ReadonlySignal<string | undefined>;
	stop(): void;
}

export interface UseOffsetPaginationChangePayload {
	readonly currentPage: number;
	readonly currentPageSize: number;
	readonly pageCount: number;
	readonly isFirstPage: boolean;
	readonly isLastPage: boolean;
	prev(): void;
	next(): void;
}

export interface UseOffsetPaginationOptions {
	/**
	 * Total number of items.
	 *
	 * @default Number.POSITIVE_INFINITY
	 */
	total?: MaybeValue<number>;
	/**
	 * Number of items per page.
	 *
	 * @default 10
	 */
	pageSize?: MaybeValue<number>;
	/**
	 * Current page number.
	 *
	 * @default 1
	 */
	page?: MaybeValue<number>;
	onPageChange?: (value: UseOffsetPaginationChangePayload) => unknown;
	onPageSizeChange?: (value: UseOffsetPaginationChangePayload) => unknown;
	onPageCountChange?: (value: UseOffsetPaginationChangePayload) => unknown;
}

export interface UseOffsetPaginationReturn {
	readonly currentPage: Computed<number>;
	readonly currentPageSize: Computed<number>;
	readonly pageCount: ReadonlySignal<number>;
	readonly isFirstPage: ReadonlySignal<boolean>;
	readonly isLastPage: ReadonlySignal<boolean>;
	prev(): void;
	next(): void;
	stop(): void;
}

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

export interface UseDeviceMotionOptions<
	TWindow extends UseDeviceMotionWindowLike = UseDeviceMotionWindowLike,
> {
	/**
	 * Request motion permission immediately when the browser exposes
	 * DeviceMotionEvent.requestPermission().
	 *
	 * @default false
	 */
	requestPermissions?: MaybeValue<boolean>;
	window?: MaybeTarget<TWindow>;
}

export interface UseDeviceMotionReturn {
	readonly acceleration: ReadonlySignal<DeviceMotionEventAcceleration | null>;
	readonly accelerationIncludingGravity: ReadonlySignal<DeviceMotionEventAcceleration | null>;
	readonly rotationRate: ReadonlySignal<DeviceMotionEventRotationRate | null>;
	readonly interval: ReadonlySignal<number>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly requirePermissions: ReadonlySignal<boolean>;
	readonly permissionGranted: ReadonlySignal<boolean>;
	ensurePermissions(): Promise<void>;
	stop(): void;
}

export interface UseDeviceOrientationOptions<
	TWindow extends
		UseDeviceOrientationWindowLike = UseDeviceOrientationWindowLike,
> {
	/**
	 * Pass true to DeviceOrientationEvent.requestPermission(true) when requesting
	 * absolute orientation permission.
	 *
	 * @default false
	 */
	absolute?: MaybeValue<boolean>;
	/**
	 * Request orientation permission immediately when the browser exposes
	 * DeviceOrientationEvent.requestPermission().
	 *
	 * @default false
	 */
	requestPermissions?: MaybeValue<boolean>;
	window?: MaybeTarget<TWindow>;
}

export interface UseDeviceOrientationReturn {
	readonly isAbsolute: ReadonlySignal<boolean>;
	readonly alpha: ReadonlySignal<number | null>;
	readonly beta: ReadonlySignal<number | null>;
	readonly gamma: ReadonlySignal<number | null>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly requirePermissions: ReadonlySignal<boolean>;
	readonly permissionGranted: ReadonlySignal<boolean>;
	ensurePermissions(absolute?: boolean): Promise<void>;
	stop(): void;
}

export interface UseDevicePixelRatioWindowLike extends WindowLike {
	readonly devicePixelRatio?: number;
}

export interface UseDevicePixelRatioOptions<
	TWindow extends UseDevicePixelRatioWindowLike = UseDevicePixelRatioWindowLike,
> {
	initialValue?: number;
	window?: MaybeTarget<TWindow>;
}

export interface UseDevicePixelRatioReturn {
	readonly pixelRatio: ReadonlySignal<number>;
	stop(): void;
}

export interface UseDevicesListMediaStreamTrackLike {
	stop(): void;
}

export interface UseDevicesListMediaStreamLike {
	getTracks(): UseDevicesListMediaStreamTrackLike[];
}

export type UseDevicesListPermissionName = "camera" | "microphone";

export interface UseDevicesListPermissionStatusLike extends EventTarget {
	readonly state: PermissionState;
}

export interface UseDevicesListMediaDevicesLike extends EventTarget {
	enumerateDevices(): Promise<readonly MediaDeviceInfo[]>;
	getUserMedia?(
		constraints?: MediaStreamConstraints,
	): Promise<UseDevicesListMediaStreamLike>;
}

export interface UseDevicesListPermissionsLike {
	query(permissionDescriptor: {
		readonly name: UseDevicesListPermissionName;
	}): Promise<UseDevicesListPermissionStatusLike>;
}

export interface UseDevicesListNavigatorLike extends NavigatorLike {
	readonly mediaDevices?: UseDevicesListMediaDevicesLike | null;
	readonly permissions?: UseDevicesListPermissionsLike | null;
}

export interface UseDevicesListOptions<
	TNavigator extends UseDevicesListNavigatorLike = UseDevicesListNavigatorLike,
> {
	/**
	 * Media constraints passed to getUserMedia() when permission is requested.
	 *
	 * @default { audio: true, video: true }
	 */
	constraints?: MaybeValue<MediaStreamConstraints>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
	onUpdated?: (devices: readonly MediaDeviceInfo[]) => void;
	/**
	 * Request camera or microphone permission during setup.
	 *
	 * @default false
	 */
	requestPermissions?: MaybeValue<boolean>;
}

export interface UseDevicesListReturn {
	readonly devices: ReadonlySignal<readonly MediaDeviceInfo[]>;
	readonly videoInputs: ReadonlySignal<readonly MediaDeviceInfo[]>;
	readonly audioInputs: ReadonlySignal<readonly MediaDeviceInfo[]>;
	readonly audioOutputs: ReadonlySignal<readonly MediaDeviceInfo[]>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly permissionGranted: ReadonlySignal<boolean>;
	ensurePermissions(): Promise<boolean>;
	stop(): void;
}

export interface UseDisplayMediaMediaStreamTrackLike extends EventTarget {
	stop(): void;
}

export interface UseDisplayMediaMediaStreamLike {
	getTracks(): UseDisplayMediaMediaStreamTrackLike[];
}

export interface UseDisplayMediaMediaDevicesLike<
	TStream extends UseDisplayMediaMediaStreamLike = MediaStream,
> {
	getDisplayMedia(options?: DisplayMediaStreamOptions): Promise<TStream>;
}

export interface UseDisplayMediaNavigatorLike<
	TStream extends UseDisplayMediaMediaStreamLike = MediaStream,
> extends NavigatorLike {
	readonly mediaDevices?: UseDisplayMediaMediaDevicesLike<TStream> | null;
}

export interface UseDisplayMediaOptions<
	TStream extends UseDisplayMediaMediaStreamLike = MediaStream,
	TNavigator extends
		UseDisplayMediaNavigatorLike<TStream> = UseDisplayMediaNavigatorLike<TStream>,
> {
	/**
	 * Display media constraints passed to getDisplayMedia().
	 *
	 * @default { video: true }
	 */
	constraints?: MaybeValue<DisplayMediaStreamOptions>;
	/**
	 * Start or stop capture when this value changes.
	 *
	 * @default false
	 */
	enabled?: MaybeValue<boolean>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseDisplayMediaReturn<
	TStream extends UseDisplayMediaMediaStreamLike = MediaStream,
> {
	readonly stream: ReadonlySignal<TStream | undefined>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isStarting: ReadonlySignal<boolean>;
	readonly isStreaming: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	start(): Promise<TStream | undefined>;
	stop(): void;
}

export interface UseUserMediaMediaStreamTrackLike extends EventTarget {
	stop(): void;
}

export interface UseUserMediaMediaStreamLike {
	getTracks(): UseUserMediaMediaStreamTrackLike[];
}

export interface UseUserMediaMediaDevicesLike<
	TStream extends UseUserMediaMediaStreamLike = MediaStream,
> {
	getUserMedia(constraints?: MediaStreamConstraints): Promise<TStream>;
}

export interface UseUserMediaNavigatorLike<
	TStream extends UseUserMediaMediaStreamLike = MediaStream,
> extends NavigatorLike {
	readonly mediaDevices?: UseUserMediaMediaDevicesLike<TStream> | null;
}

export interface UseUserMediaOptions<
	TStream extends UseUserMediaMediaStreamLike = MediaStream,
	TNavigator extends
		UseUserMediaNavigatorLike<TStream> = UseUserMediaNavigatorLike<TStream>,
> {
	/**
	 * Recreate the stream when constraints change.
	 *
	 * @default true
	 */
	autoSwitch?: MaybeValue<boolean>;
	/**
	 * Media constraints passed to getUserMedia().
	 *
	 * @default { audio: true, video: true }
	 */
	constraints?: MaybeValue<MediaStreamConstraints | undefined>;
	/**
	 * Start or stop capture when this value changes.
	 *
	 * @default false
	 */
	enabled?: MaybeValue<boolean>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseUserMediaReturn<
	TStream extends UseUserMediaMediaStreamLike = MediaStream,
> {
	readonly stream: ReadonlySignal<TStream | undefined>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isStarting: ReadonlySignal<boolean>;
	readonly isStreaming: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	readonly enabled: Signal<boolean>;
	readonly autoSwitch: Signal<boolean>;
	readonly constraints: Signal<MediaStreamConstraints>;
	start(): Promise<TStream | undefined>;
	stop(): void;
	restart(): Promise<TStream | undefined>;
}

export type UseVibratePattern = number | readonly number[];

export type UseVibrateScheduler = (callback: () => void) => UseIntervalFnReturn;

export interface UseVibrateNavigatorLike extends NavigatorLike {
	vibrate?(pattern: number | number[]): boolean;
}

export interface UseVibrateOptions<
	TNavigator extends UseVibrateNavigatorLike = UseVibrateNavigatorLike,
> {
	/**
	 * Pattern used by vibrate() when no argument is passed.
	 *
	 * @default []
	 */
	pattern?: MaybeValue<UseVibratePattern>;
	/**
	 * Interval for repeated vibration. Set 0 to keep controls paused.
	 */
	interval?: MaybeValue<number>;
	/**
	 * Custom scheduler used for repeated vibration.
	 */
	scheduler?: UseVibrateScheduler;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseVibrateReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly pattern: Signal<UseVibratePattern>;
	readonly intervalControls?: UseIntervalFnReturn;
	vibrate(pattern?: UseVibratePattern): void;
	stop(): void;
}

export type WakeLockType = "screen";

export interface UseWakeLockSentinelLike extends EventTarget {
	readonly type: WakeLockType;
	readonly released: boolean;
	release(): Promise<void>;
}

export interface UseWakeLockWakeLockLike<
	TSentinel extends UseWakeLockSentinelLike = WakeLockSentinel,
> {
	request(type: WakeLockType): Promise<TSentinel>;
}

export interface UseWakeLockNavigatorLike<
	TSentinel extends UseWakeLockSentinelLike = WakeLockSentinel,
> extends NavigatorLike {
	readonly wakeLock?: UseWakeLockWakeLockLike<TSentinel> | null;
}

export type UseWakeLockDocumentLike = DocumentVisibilityDocumentLike;

export interface UseWakeLockOptions<
	TSentinel extends UseWakeLockSentinelLike = WakeLockSentinel,
	TNavigator extends
		UseWakeLockNavigatorLike<TSentinel> = UseWakeLockNavigatorLike<TSentinel>,
	TDocument extends UseWakeLockDocumentLike = UseWakeLockDocumentLike,
> {
	navigator?: MaybeValue<TNavigator | null | undefined>;
	document?: MaybeTarget<TDocument | null | undefined>;
}

export interface UseWakeLockReturn<
	TSentinel extends UseWakeLockSentinelLike = WakeLockSentinel,
> {
	readonly sentinel: ReadonlySignal<TSentinel | null>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isActive: Computed<boolean>;
	request(type?: WakeLockType): Promise<void>;
	forceRequest(type?: WakeLockType): Promise<void>;
	release(): Promise<void>;
	stop(): void;
}

export interface UseWebNotificationNotificationLike extends EventTarget {
	close(): void;
}

export interface UseWebNotificationConstructorLike<
	TNotification extends
		UseWebNotificationNotificationLike = UseWebNotificationNotificationLike,
> {
	readonly permission: NotificationPermission;
	requestPermission(): Promise<NotificationPermission>;
	new (
		title: string,
		options?: UseWebNotificationConstructorOptions,
	): TNotification;
}

export interface UseWebNotificationWindowLike<
	TNotification extends
		UseWebNotificationNotificationLike = UseWebNotificationNotificationLike,
> extends WindowLike {
	readonly document?: DocumentVisibilityDocumentLike;
	readonly Notification?: UseWebNotificationConstructorLike<TNotification> | null;
}

export interface UseWebNotificationConstructorOptions {
	badge?: string;
	body?: string;
	data?: unknown;
	dir?: NotificationDirection;
	icon?: string;
	image?: string;
	lang?: string;
	renotify?: boolean;
	requireInteraction?: boolean;
	silent?: boolean;
	tag?: string;
	timestamp?: number;
	vibrate?: number | readonly number[];
}

export interface UseWebNotificationOptionsBase
	extends UseWebNotificationConstructorOptions {
	/**
	 * Title passed as the first Notification constructor argument.
	 *
	 * @default ""
	 */
	title?: string;
}

export interface UseWebNotificationOptions<
	TNotification extends
		UseWebNotificationNotificationLike = UseWebNotificationNotificationLike,
	TWindow extends
		UseWebNotificationWindowLike<TNotification> = UseWebNotificationWindowLike<TNotification>,
> extends UseWebNotificationOptionsBase {
	/**
	 * Request permission when this value becomes true.
	 *
	 * @default false
	 */
	requestPermissions?: MaybeValue<boolean>;
	window?: MaybeValue<TWindow | null | undefined>;
}

export interface UseWebNotificationReturn<
	TNotification extends
		UseWebNotificationNotificationLike = UseWebNotificationNotificationLike,
> {
	readonly notification: ReadonlySignal<TNotification | null>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly permissionGranted: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	ensurePermissions(): Promise<boolean>;
	show(
		overrides?: UseWebNotificationOptionsBase,
	): Promise<TNotification | undefined>;
	close(): void;
	onClick: EventHookOn<Event>;
	onShow: EventHookOn<Event>;
	onError: EventHookOn<Event>;
	onClose: EventHookOn<Event>;
	stop(): void;
}

export type UseWebSocketStatus = "CONNECTING" | "OPEN" | "CLOSED";

export type UseWebSocketSendData =
	| string
	| Blob
	| ArrayBufferLike
	| ArrayBufferView;

export type UseWebSocketHeartbeatMessage = UseWebSocketSendData;

export interface WebSocketLike extends EventTarget {
	binaryType: BinaryType;
	readonly readyState: number;
	close(code?: number, reason?: string): void;
	send(data: UseWebSocketSendData): void;
}

export interface WebSocketConstructorLike<
	TWebSocket extends WebSocketLike = WebSocketLike,
> {
	new (url: string | URL, protocols?: string | readonly string[]): TWebSocket;
	readonly CONNECTING?: 0;
	readonly OPEN?: 1;
	readonly CLOSING?: 2;
	readonly CLOSED?: 3;
}

export interface UseWebSocketWindowLike<
	TWebSocket extends WebSocketLike = WebSocketLike,
> extends WindowLike {
	readonly WebSocket?: WebSocketConstructorLike<TWebSocket> | null;
}

export type UseWebSocketHeartbeatScheduler = (
	callback: () => void,
) => UseIntervalFnReturn;

export interface UseWebSocketHeartbeatOptions {
	/**
	 * Message sent on each heartbeat tick.
	 *
	 * @default "ping"
	 */
	message?: MaybeValue<UseWebSocketHeartbeatMessage>;
	/**
	 * Message treated as the heartbeat response. Defaults to message.
	 */
	responseMessage?: MaybeValue<UseWebSocketHeartbeatMessage>;
	/**
	 * Heartbeat interval in milliseconds.
	 *
	 * @default 1000
	 */
	interval?: MaybeValue<number>;
	/**
	 * Custom scheduler. When provided, it owns the heartbeat interval.
	 */
	scheduler?: UseWebSocketHeartbeatScheduler;
	/**
	 * Milliseconds to wait for a heartbeat response before closing the socket.
	 *
	 * @default 1000
	 */
	pongTimeout?: MaybeValue<number>;
}

export interface UseWebSocketAutoReconnectOptions {
	/**
	 * Maximum retry count. -1 retries forever.
	 *
	 * @default -1
	 */
	retries?: number | ((retried: number) => boolean);
	/**
	 * Reconnect delay in milliseconds.
	 *
	 * @default 1000
	 */
	delay?: number | ((retried: number) => number);
	onFailed?: () => void;
}

export interface UseWebSocketOptions<
	TWebSocket extends WebSocketLike = WebSocketLike,
	TWindow extends
		UseWebSocketWindowLike<TWebSocket> = UseWebSocketWindowLike<TWebSocket>,
> {
	onConnected?: (socket: TWebSocket) => void;
	onDisconnected?: (socket: TWebSocket, event: CloseEvent) => void;
	onError?: (socket: TWebSocket, event: Event) => void;
	onMessage?: (socket: TWebSocket, event: MessageEvent) => void;
	heartbeat?: boolean | UseWebSocketHeartbeatOptions;
	autoReconnect?: boolean | UseWebSocketAutoReconnectOptions;
	/**
	 * Open the socket during setup.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Reconnect when the URL changes.
	 *
	 * @default true
	 */
	autoConnect?: boolean;
	/**
	 * Close on beforeunload and scope disposal.
	 *
	 * @default true
	 */
	autoClose?: boolean;
	protocols?: MaybeValue<string | readonly string[] | undefined>;
	binaryType?: MaybeValue<BinaryType | undefined>;
	window?: MaybeTarget<TWindow | null | undefined>;
	webSocket?: MaybeValue<
		WebSocketConstructorLike<TWebSocket> | null | undefined
	>;
}

export interface UseWebSocketReturn<
	Data = unknown,
	TWebSocket extends WebSocketLike = WebSocketLike,
> {
	readonly data: ReadonlySignal<Data | null>;
	readonly status: ReadonlySignal<UseWebSocketStatus>;
	readonly ws: ReadonlySignal<TWebSocket | undefined>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	open(): void;
	close(code?: number, reason?: string): void;
	send(data: UseWebSocketSendData, useBuffer?: boolean): boolean;
	stop(): void;
}

export interface WorkerLike extends EventTarget {
	postMessage(message: unknown, transfer: Transferable[]): void;
	postMessage(message: unknown, options?: StructuredSerializeOptions): void;
	terminate(): void;
}

export interface WorkerConstructorLike<
	TWorker extends WorkerLike = WorkerLike,
> {
	new (scriptURL: string | URL, options?: WorkerOptions): TWorker;
}

export interface UseWebWorkerWindowLike<TWorker extends WorkerLike = WorkerLike>
	extends WindowLike {
	readonly Worker?: WorkerConstructorLike<TWorker> | null;
}

export type UseWebWorkerConstructorSource<
	TWorker extends WorkerLike = WorkerLike,
> =
	| WorkerConstructorLike<TWorker>
	| Signal<WorkerConstructorLike<TWorker> | null | undefined>
	| ReadonlySignal<WorkerConstructorLike<TWorker> | null | undefined>
	| Computed<WorkerConstructorLike<TWorker> | null | undefined>
	| null
	| undefined;

export type UseWebWorkerSource<TWorker extends WorkerLike = WorkerLike> =
	| string
	| URL
	| TWorker
	| null
	| undefined;

export interface UseWebWorkerOptions<
	TWorker extends WorkerLike = WorkerLike,
	TWindow extends
		UseWebWorkerWindowLike<TWorker> = UseWebWorkerWindowLike<TWorker>,
	Data = unknown,
> {
	/**
	 * Create the worker during setup.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Recreate the worker when the source or options change.
	 *
	 * @default true
	 */
	autoConnect?: boolean;
	/**
	 * Terminate the worker when the current scope is disposed.
	 *
	 * @default true
	 */
	autoTerminate?: boolean;
	workerOptions?: MaybeValue<WorkerOptions | undefined>;
	window?: MaybeTarget<TWindow | null | undefined>;
	worker?: UseWebWorkerConstructorSource<TWorker>;
	onMessage?: (worker: TWorker, event: MessageEvent<Data>) => void;
	onError?: (worker: TWorker, event: Event) => void;
	onMessageError?: (worker: TWorker, event: MessageEvent) => void;
}

export interface UseWebWorkerReturn<
	Data = unknown,
	Payload = unknown,
	TWorker extends WorkerLike = WorkerLike,
> {
	readonly data: ReadonlySignal<Data | null>;
	readonly worker: ReadonlySignal<TWorker | undefined>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	open(): void;
	post(message: Payload, transfer: Transferable[]): boolean;
	post(message: Payload, options?: StructuredSerializeOptions): boolean;
	terminate(): void;
	stop(): void;
}

export type UseWebWorkerFnStatus =
	| "PENDING"
	| "SUCCESS"
	| "RUNNING"
	| "ERROR"
	| "TIMEOUT_EXPIRED";

export type UseWebWorkerFnTerminateStatus = Exclude<
	UseWebWorkerFnStatus,
	"SUCCESS" | "RUNNING"
>;

export type UseWebWorkerFnCallable = (...fnArgs: never[]) => unknown;

export type UseWebWorkerFnResult<T extends UseWebWorkerFnCallable> = Awaited<
	ReturnType<T>
>;

export type UseWebWorkerFnLocalDependency = (...args: never[]) => unknown;

export interface UseWebWorkerFnUrlLike {
	createObjectURL(object: Blob): string;
	revokeObjectURL(url: string): void;
}

export interface UseWebWorkerFnBlobConstructorLike {
	new (blobParts?: BlobPart[], options?: BlobPropertyBag): Blob;
}

export interface UseWebWorkerFnWindowLike<
	TWorker extends WorkerLike = WorkerLike,
> extends UseWebWorkerWindowLike<TWorker> {
	readonly URL?: UseWebWorkerFnUrlLike | null;
	readonly Blob?: UseWebWorkerFnBlobConstructorLike | null;
}

export interface UseWebWorkerFnOptions<
	TWorker extends WorkerLike = WorkerLike,
	TWindow extends
		UseWebWorkerFnWindowLike<TWorker> = UseWebWorkerFnWindowLike<TWorker>,
> {
	/**
	 * Milliseconds before terminating the active worker.
	 */
	timeout?: MaybeValue<number | undefined>;
	/**
	 * Classic worker script URLs loaded with importScripts().
	 */
	dependencies?: MaybeValue<readonly string[] | undefined>;
	/**
	 * Named local functions serialized into the worker script.
	 */
	localDependencies?: MaybeValue<
		readonly UseWebWorkerFnLocalDependency[] | undefined
	>;
	window?: MaybeTarget<TWindow | null | undefined>;
	worker?: UseWebWorkerConstructorSource<TWorker>;
}

export interface UseWebWorkerFnReturn<T extends UseWebWorkerFnCallable> {
	workerFn(...fnArgs: Parameters<T>): Promise<UseWebWorkerFnResult<T>>;
	readonly workerStatus: ReadonlySignal<UseWebWorkerFnStatus>;
	readonly isSupported: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | null>;
	workerTerminate(status?: UseWebWorkerFnTerminateStatus): void;
	stop(): void;
}

export type UseVirtualListItemSize = number | ((index: number) => number);

export interface UseVirtualListOptionsBase<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> {
	/**
	 * Extra buffer items outside of the visible area.
	 *
	 * @default 5
	 */
	overscan?: number;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseVirtualListVerticalOptions<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> extends UseVirtualListOptionsBase<TWindow> {
	itemHeight: UseVirtualListItemSize;
	itemWidth?: never;
}

export interface UseVirtualListHorizontalOptions<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> extends UseVirtualListOptionsBase<TWindow> {
	itemWidth: UseVirtualListItemSize;
	itemHeight?: never;
}

export type UseVirtualListOptions<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> =
	| UseVirtualListVerticalOptions<TWindow>
	| UseVirtualListHorizontalOptions<TWindow>;

export interface UseVirtualListItem<T> {
	readonly data: T;
	readonly index: number;
}

export interface UseVirtualListReturn<T> {
	readonly list: ReadonlySignal<readonly UseVirtualListItem<T>[]>;
	readonly containerRef: Signal<HTMLElement | null>;
	readonly containerStyle: string;
	readonly wrapperStyle: Computed<string>;
	onScroll(event?: Event): void;
	scrollTo(index: number): void;
	measure(): void;
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

export interface UsePageLeaveOptions<TWindow extends WindowLike = WindowLike> {
	window?: MaybeTarget<TWindow>;
}

export interface UsePageLeaveReturn {
	readonly isLeft: ReadonlySignal<boolean>;
	stop(): void;
}

export interface UseWindowFocusDocumentLike extends DocumentLike {
	hasFocus?(): boolean;
}

export interface UseWindowFocusWindowLike extends WindowLike {
	readonly document?: UseWindowFocusDocumentLike;
}

export interface UseWindowFocusOptions<
	TWindow extends UseWindowFocusWindowLike = UseWindowFocusWindowLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseWindowFocusReturn {
	readonly focused: ReadonlySignal<boolean>;
	stop(): void;
}

export interface UseNetworkOptions<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends UseNetworkNavigatorLike = UseNetworkNavigatorLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseNetworkReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isOnline: ReadonlySignal<boolean>;
	readonly offlineAt: ReadonlySignal<number | undefined>;
	readonly onlineAt: ReadonlySignal<number | undefined>;
	readonly downlink: ReadonlySignal<number | undefined>;
	readonly downlinkMax: ReadonlySignal<number | undefined>;
	readonly effectiveType: ReadonlySignal<UseNetworkEffectiveType | undefined>;
	readonly rtt: ReadonlySignal<number | undefined>;
	readonly saveData: ReadonlySignal<boolean | undefined>;
	readonly type: ReadonlySignal<UseNetworkType>;
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

export type WatchArraySource<T = unknown> =
	| WatchSource<readonly T[]>
	| readonly T[];

export type WatchArrayOnCleanup = (cleanupFn: Cleanup) => void;

export type WatchArrayCallback<T = unknown> = (
	value: readonly T[],
	oldValue: readonly T[],
	added: T[],
	removed: T[],
	onCleanup: WatchArrayOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export type WatchArrayOptions<Immediate extends boolean = false> =
	WatchOptions<Immediate>;

export type WatchArrayReturn = WatchStopHandle;

type WatchAtMostDeepSource<T> = T extends object
	? DeepSignal<T> | ReadonlyDeepSignal<T>
	: never;

export type WatchAtMostSource<T = unknown> =
	| WatchSource<T>
	| WatchAtMostDeepSource<T>;

export type WatchAtMostSourceValue<TSource> = TSource extends Signal<
	infer Value
>
	? Value
	: TSource extends ReadonlySignal<infer Value>
		? Value
		: TSource extends Computed<infer Value>
			? Value
			: TSource extends () => infer Value
				? Value
				: TSource extends DeepSignal<infer Value>
					? Value
					: TSource extends ReadonlyDeepSignal<infer Value>
						? Value
						: TSource;

export type WatchAtMostSourceValues<TSources extends readonly unknown[]> = {
	[K in keyof TSources]: WatchAtMostSourceValue<TSources[K]>;
};

export type WatchAtMostOnCleanup = (cleanupFn: Cleanup) => void;

export type WatchAtMostCallback<
	Value = unknown,
	Immediate extends boolean = false,
> = (
	value: Value,
	oldValue: Immediate extends true ? Value | undefined : Value,
	onCleanup: WatchAtMostOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export type WatchAtMostSourceListCallback<
	Value = unknown,
	Immediate extends boolean = false,
> = (
	value: Value,
	oldValue: Immediate extends true ? Value | [] : Value,
	onCleanup: WatchAtMostOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export interface WatchAtMostOptions<Immediate extends boolean = false>
	extends WatchOptions<Immediate> {
	count: MaybeValue<number>;
}

export interface WatchAtMostReturn {
	readonly count: ReadonlySignal<number>;
	stop(): void;
}

type WatchDebouncedDeepSource<T> = T extends object
	? DeepSignal<T> | ReadonlyDeepSignal<T>
	: never;

export type WatchDebouncedSource<T = unknown> =
	| WatchSource<T>
	| WatchDebouncedDeepSource<T>;

export type WatchDebouncedSourceValue<TSource> = TSource extends Signal<
	infer Value
>
	? Value
	: TSource extends ReadonlySignal<infer Value>
		? Value
		: TSource extends Computed<infer Value>
			? Value
			: TSource extends () => infer Value
				? Value
				: TSource extends DeepSignal<infer Value>
					? Value
					: TSource extends ReadonlyDeepSignal<infer Value>
						? Value
						: TSource;

export type WatchDebouncedSourceValues<TSources extends readonly unknown[]> = {
	[K in keyof TSources]: WatchDebouncedSourceValue<TSources[K]>;
};

export type WatchDebouncedOnCleanup = (cleanupFn: Cleanup) => void;

export type WatchDebouncedCallback<
	Value = unknown,
	Immediate extends boolean = false,
> = (
	value: Value,
	oldValue: Immediate extends true ? Value | undefined : Value,
	onCleanup: WatchDebouncedOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export interface WatchDebouncedOptions<Immediate extends boolean = false>
	extends WatchOptions<Immediate> {
	debounce?: MaybeValue<number>;
	maxWait?: MaybeValue<number>;
}

export type WatchDebouncedReturn = WatchStopHandle;

type WatchDeepDeepSource<T> = T extends object
	? DeepSignal<T> | ReadonlyDeepSignal<T>
	: never;

export type WatchDeepSource<T = unknown> =
	| WatchSource<T>
	| WatchDeepDeepSource<T>;

export type WatchDeepSourceValue<TSource> = TSource extends Signal<infer Value>
	? Value
	: TSource extends ReadonlySignal<infer Value>
		? Value
		: TSource extends Computed<infer Value>
			? Value
			: TSource extends () => infer Value
				? Value
				: TSource extends DeepSignal<infer Value>
					? Value
					: TSource extends ReadonlyDeepSignal<infer Value>
						? Value
						: TSource;

export type WatchDeepSourceValues<TSources extends readonly unknown[]> = {
	[K in keyof TSources]: WatchDeepSourceValue<TSources[K]>;
};

export type WatchDeepOnCleanup = (cleanupFn: Cleanup) => void;

export type WatchDeepCallback<
	Value = unknown,
	Immediate extends boolean = false,
> = (
	value: Value,
	oldValue: Immediate extends true ? Value | undefined : Value,
	onCleanup: WatchDeepOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export type WatchDeepOptions<Immediate extends boolean = false> = Omit<
	WatchOptions<Immediate>,
	"deep"
>;

export type WatchDeepReturn = WatchStopHandle;

type WatchIgnorableDeepSource<T> = T extends object
	? DeepSignal<T> | ReadonlyDeepSignal<T>
	: never;

export type WatchIgnorableSource<T = unknown> =
	| WatchSource<T>
	| WatchIgnorableDeepSource<T>;

export type WatchIgnorableSourceValue<TSource> = TSource extends Signal<
	infer Value
>
	? Value
	: TSource extends ReadonlySignal<infer Value>
		? Value
		: TSource extends Computed<infer Value>
			? Value
			: TSource extends () => infer Value
				? Value
				: TSource extends DeepSignal<infer Value>
					? Value
					: TSource extends ReadonlyDeepSignal<infer Value>
						? Value
						: TSource;

export type WatchIgnorableSourceValues<TSources extends readonly unknown[]> = {
	[K in keyof TSources]: WatchIgnorableSourceValue<TSources[K]>;
};

export type WatchIgnorableOnCleanup = (cleanupFn: Cleanup) => void;

export type WatchIgnorableCallback<
	Value = unknown,
	Immediate extends boolean = false,
> = (
	value: Value,
	oldValue: Immediate extends true ? Value | undefined : Value,
	onCleanup: WatchIgnorableOnCleanup,
) => void | Cleanup | Promise<void | Cleanup>;

export type WatchIgnorableOptions<Immediate extends boolean = false> =
	WatchOptions<Immediate>;

export type WatchIgnorableIgnoreUpdates = (updater: () => void) => void;

export type WatchIgnorableIgnorePrevAsyncUpdates = () => void;

export interface WatchIgnorableReturn {
	ignoreUpdates: WatchIgnorableIgnoreUpdates;
	ignorePrevAsyncUpdates: WatchIgnorableIgnorePrevAsyncUpdates;
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

export type UseKeyModifier =
	| "Alt"
	| "AltGraph"
	| "CapsLock"
	| "Control"
	| "Fn"
	| "FnLock"
	| "Meta"
	| "NumLock"
	| "ScrollLock"
	| "Shift"
	| "Symbol"
	| "SymbolLock";

export type UseKeyModifierEventName = Extract<keyof DocumentEventMap, string>;

export interface UseKeyModifierDocumentLike extends DocumentLike {}

export interface UseKeyModifierOptions<
	Initial extends boolean | null = null,
	TDocument extends UseKeyModifierDocumentLike = UseKeyModifierDocumentLike,
> {
	/**
	 * Event names that update the modifier state.
	 *
	 * @default ["mousedown", "mouseup", "keydown", "keyup"]
	 */
	events?: MaybeValue<readonly UseKeyModifierEventName[]>;
	/**
	 * Initial value before the first modifier-aware event.
	 *
	 * @default null
	 */
	initial?: Initial;
	document?: MaybeTarget<TDocument | null | undefined>;
}

export type UseKeyModifierReturn<Initial extends boolean | null = null> =
	ReadonlySignal<Initial extends boolean ? boolean : boolean | null> & {
		stop(): void;
	};

export interface UseLastChangedOptions<
	Immediate extends boolean = false,
	InitialValue extends number | null | undefined = undefined,
> extends WatchOptions<Immediate> {
	initialValue?: InitialValue;
}

export type UseLastChangedReturn<
	Immediate extends boolean = false,
	InitialValue extends number | null | undefined = undefined,
> = ReadonlySignal<
	Immediate extends true
		? number
		: InitialValue extends number
			? number
			: number | null
>;

export interface UseMagicKeysWindowLike extends WindowLike {}

export interface UseMagicKeysOptions<
	Reactive extends boolean = false,
	TTarget extends EventTarget = EventTarget,
	TWindow extends UseMagicKeysWindowLike = UseMagicKeysWindowLike,
> {
	/**
	 * Return booleans from the proxy instead of readonly signals.
	 *
	 * @default false
	 */
	reactive?: Reactive;
	/**
	 * Target for keydown and keyup listeners.
	 *
	 * @default window
	 */
	target?: MaybeTarget<TTarget | null | undefined>;
	/**
	 * Window target for focus and blur reset listeners.
	 *
	 * @default window
	 */
	window?: MaybeTarget<TWindow | null | undefined>;
	/**
	 * Alias map for key names. Alias names should be lowercase.
	 */
	aliasMap?: Record<string, string>;
	/**
	 * Register passive key and reset listeners.
	 *
	 * @default true
	 */
	passive?: boolean;
	/**
	 * Custom handler called after key state is updated.
	 */
	onEventFired?: (event: KeyboardEvent) => void | boolean;
}

export interface MagicKeysInternal<Reactive extends boolean = false> {
	readonly current: Reactive extends true
		? ReadonlySet<string>
		: ReadonlySignal<ReadonlySet<string>>;
	stop(): void;
}

export type UseMagicKeysReturn<Reactive extends boolean = false> = Readonly<
	Record<string, Reactive extends true ? boolean : ReadonlySignal<boolean>> &
		MagicKeysInternal<Reactive>
>;

export interface UseMediaControlsSource {
	src: string;
	type?: string;
	media?: string;
}

export interface UseMediaControlsTextTrackSource {
	default?: boolean;
	kind: TextTrackKind;
	label: string;
	src: string;
	srcLang: string;
}

export interface UseMediaControlsTextTrack {
	readonly id: number;
	readonly label: string;
	readonly language: string;
	readonly mode: TextTrackMode;
	readonly kind: TextTrackKind;
	readonly inBandMetadataTrackDispatchType: string;
	readonly cues: TextTrackCueList | null;
	readonly activeCues: TextTrackCueList | null;
}

export interface UseMediaControlsDocumentLike extends DocumentLike {
	readonly pictureInPictureEnabled?: boolean;
	createElement(tagName: "source"): HTMLSourceElement;
	createElement(tagName: "track"): HTMLTrackElement;
	createElement(tagName: string): HTMLElement;
	exitPictureInPicture?(): Promise<void>;
}

export interface UseMediaControlsOptions<
	TDocument extends UseMediaControlsDocumentLike = UseMediaControlsDocumentLike,
> {
	src?: MaybeValue<
		string | UseMediaControlsSource | UseMediaControlsSource[] | undefined
	>;
	tracks?: MaybeValue<UseMediaControlsTextTrackSource[] | undefined>;
	document?: MaybeTarget<TDocument | null | undefined>;
}

export interface UseMediaControlsReturn {
	readonly currentTime: Computed<number>;
	readonly duration: ReadonlySignal<number>;
	readonly waiting: ReadonlySignal<boolean>;
	readonly seeking: ReadonlySignal<boolean>;
	readonly ended: ReadonlySignal<boolean>;
	readonly stalled: ReadonlySignal<boolean>;
	readonly buffered: ReadonlySignal<[number, number][]>;
	readonly playing: Computed<boolean>;
	readonly rate: Computed<number>;
	readonly volume: Computed<number>;
	readonly muted: Computed<boolean>;
	readonly tracks: ReadonlySignal<UseMediaControlsTextTrack[]>;
	readonly selectedTrack: ReadonlySignal<number>;
	enableTrack(
		track: number | UseMediaControlsTextTrack,
		disableTracks?: boolean,
	): void;
	disableTrack(track?: number | UseMediaControlsTextTrack): void;
	readonly supportsPictureInPicture: ReadonlySignal<boolean>;
	togglePictureInPicture(): Promise<PictureInPictureWindow | void>;
	readonly isPictureInPicture: ReadonlySignal<boolean>;
	readonly onSourceError: EventHookOn<Event>;
	readonly onPlaybackError: EventHookOn<unknown>;
	stop(): void;
}

export type UseMemoizeCacheKey = string | number;

export interface UseMemoizeCache<Key extends UseMemoizeCacheKey, Value> {
	get(key: Key): Value | undefined;
	set(key: Key, value: Value): void;
	has(key: Key): boolean;
	delete(key: Key): void;
	clear(): void;
}

export interface UseMemoizeReturn<
	Result,
	Args extends unknown[],
	Key extends UseMemoizeCacheKey = string,
> {
	(...args: Args): Result;
	load(...args: Args): Result;
	delete(...args: Args): void;
	clear(): void;
	generateKey(...args: Args): Key;
	cache: UseMemoizeCache<Key, Result>;
}

export type UseMemoizeOptions<
	Result,
	Args extends unknown[],
	Key extends UseMemoizeCacheKey = string,
> = {
	cache?: UseMemoizeCache<Key, Result>;
} & ([Key] extends [string]
	? string extends Key
		? { getKey?: (...args: Args) => Key }
		: { getKey: (...args: Args) => Key }
	: { getKey: (...args: Args) => Key });

export interface UseMemoryInfo {
	readonly jsHeapSizeLimit: number;
	readonly totalJSHeapSize: number;
	readonly usedJSHeapSize: number;
	readonly [Symbol.toStringTag]?: "MemoryInfo";
}

export interface UseMemoryPerformanceLike {
	memory?: UseMemoryInfo;
}

export interface UseMemoryWindowLike extends WindowLike {
	readonly performance?: UseMemoryPerformanceLike;
}

export interface UseMemoryOptions<
	TWindow extends UseMemoryWindowLike = UseMemoryWindowLike,
> extends UseIntervalFnOptions {
	interval?: MaybeValue<number>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseMemoryReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly memory: ReadonlySignal<UseMemoryInfo | undefined>;
	readonly isActive: ReadonlySignal<boolean>;
	pause(): void;
	resume(): void;
	stop(): void;
}

export type UseMountedReturn = ReadonlySignal<boolean>;

export type UseSupportedReturn = ReadonlySignal<boolean>;

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

export interface UseMouseInElementDocumentLike extends DocumentLike {
	readonly body?: HTMLElement | null;
}

export interface UseMouseInElementWindowLike extends MouseWindowLike {
	readonly document?: UseMouseInElementDocumentLike;
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly MutationObserver?: typeof MutationObserver;
}

export interface UseMouseInElementOptions<
	TWindow extends UseMouseInElementWindowLike = UseMouseInElementWindowLike,
	TMouseTarget extends EventTarget = EventTarget,
> extends Omit<UseMouseOptions<TWindow, TMouseTarget>, "type"> {
	type?: Exclude<UseMouseCoordType, "movement"> | UseMouseEventExtractor;
	/**
	 * Keep updating relative coordinates while the pointer is outside the element.
	 *
	 * @default true
	 */
	handleOutside?: boolean;
	/**
	 * Recalculate element bounds when the window scrolls.
	 *
	 * @default true
	 */
	windowScroll?: boolean;
	/**
	 * Recalculate element bounds when the window resizes.
	 *
	 * @default true
	 */
	windowResize?: boolean;
}

export interface UseMouseInElementReturn extends UseMouseReturn {
	readonly elementX: ReadonlySignal<number>;
	readonly elementY: ReadonlySignal<number>;
	readonly elementPositionX: ReadonlySignal<number>;
	readonly elementPositionY: ReadonlySignal<number>;
	readonly elementHeight: ReadonlySignal<number>;
	readonly elementWidth: ReadonlySignal<number>;
	readonly isOutside: ReadonlySignal<boolean>;
}

export interface UseParallaxScreenOrientationLike extends EventTarget {
	readonly type?: OrientationType;
}

export interface UseParallaxWindowLike extends WindowLike {
	readonly document?: UseMouseInElementWindowLike["document"];
	readonly navigator?: UseMouseInElementWindowLike["navigator"];
	readonly scrollX: number;
	readonly scrollY: number;
	readonly ResizeObserver?: typeof ResizeObserver;
	readonly MutationObserver?: typeof MutationObserver;
	readonly DeviceOrientationEvent?: DeviceOrientationEventConstructorLike;
	readonly screen?: {
		readonly orientation?: UseParallaxScreenOrientationLike;
	};
}

export type UseParallaxSource = "deviceOrientation" | "mouse";
export type UseParallaxAdjust = (value: number) => number;

export interface UseParallaxOptions<
	TWindow extends UseParallaxWindowLike = UseParallaxWindowLike,
> {
	deviceOrientationTiltAdjust?: UseParallaxAdjust;
	deviceOrientationRollAdjust?: UseParallaxAdjust;
	absolute?: MaybeValue<boolean>;
	requestPermissions?: MaybeValue<boolean>;
	mouseTiltAdjust?: UseParallaxAdjust;
	mouseRollAdjust?: UseParallaxAdjust;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseParallaxReturn {
	readonly roll: ReadonlySignal<number>;
	readonly tilt: ReadonlySignal<number>;
	readonly source: ReadonlySignal<UseParallaxSource>;
	ensurePermissions(absolute?: boolean): Promise<void>;
	stop(): void;
}

export interface UsePerformanceObserverWindowLike extends WindowLike {
	readonly PerformanceObserver?: typeof PerformanceObserver;
}

export type UsePerformanceObserverObserveOptions =
	| {
			entryTypes: readonly string[];
			type?: never;
			buffered?: never;
			durationThreshold?: never;
	  }
	| {
			type: string;
			buffered?: boolean;
			durationThreshold?: DOMHighResTimeStamp;
			entryTypes?: never;
	  };

export type UsePerformanceObserverOptions<
	TWindow extends
		UsePerformanceObserverWindowLike = UsePerformanceObserverWindowLike,
> = UsePerformanceObserverObserveOptions & {
	/**
	 * Start the observer immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	window?: MaybeTarget<TWindow | null | undefined>;
};

export interface UsePerformanceObserverReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	start(): void;
	stop(): void;
}

export type UsePermissionName =
	| PermissionName
	| "accelerometer"
	| "accessibility-events"
	| "ambient-light-sensor"
	| "background-sync"
	| "bluetooth"
	| "clipboard-read"
	| "clipboard-write"
	| "gyroscope"
	| "local-fonts"
	| "magnetometer"
	| "payment-handler"
	| "speaker"
	| "top-level-storage-access"
	| "window-management"
	| (string & {});

export interface UsePermissionDescriptor {
	readonly name: UsePermissionName;
	readonly [key: string]: unknown;
}

export type UsePermissionSource = UsePermissionDescriptor | UsePermissionName;

export interface UsePermissionStatusLike extends EventTarget {
	readonly state: PermissionState;
}

export interface UsePermissionPermissionsLike<
	TStatus extends UsePermissionStatusLike = PermissionStatus,
> {
	query(permissionDescriptor: PermissionDescriptor): Promise<TStatus>;
}

export interface UsePermissionNavigatorLike<
	TStatus extends UsePermissionStatusLike = PermissionStatus,
> extends NavigatorLike {
	readonly permissions?: UsePermissionPermissionsLike<TStatus> | null;
}

export interface UsePermissionOptions<
	TNavigator extends
		UsePermissionNavigatorLike<UsePermissionStatusLike> = UsePermissionNavigatorLike,
> {
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UsePermissionReturn<
	TStatus extends UsePermissionStatusLike = PermissionStatus,
> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly state: ReadonlySignal<PermissionState | undefined>;
	query(): Promise<TStatus | undefined>;
	stop(): void;
}

export type UsePointerType = "mouse" | "pen" | "touch" | (string & {});

export interface UsePointerState extends Position {
	height: number;
	pointerId: number;
	pointerType: UsePointerType | null;
	pressure: number;
	tiltX: number;
	tiltY: number;
	twist: number;
	width: number;
}

export interface UsePointerOptions<
	TWindow extends WindowLike = WindowLike,
	TTarget extends EventTarget = EventTarget,
> {
	initialValue?: MaybeValue<Partial<UsePointerState>>;
	pointerTypes?: MaybeValue<readonly UsePointerType[]>;
	target?: MaybeTarget<TTarget | null | undefined>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UsePointerReturn {
	readonly x: ReadonlySignal<number>;
	readonly y: ReadonlySignal<number>;
	readonly height: ReadonlySignal<number>;
	readonly isInside: ReadonlySignal<boolean>;
	readonly pointerId: ReadonlySignal<number>;
	readonly pointerType: ReadonlySignal<UsePointerType | null>;
	readonly pressure: ReadonlySignal<number>;
	readonly tiltX: ReadonlySignal<number>;
	readonly tiltY: ReadonlySignal<number>;
	readonly twist: ReadonlySignal<number>;
	readonly width: ReadonlySignal<number>;
	stop(): void;
}

export type UsePointerSwipeDirection =
	| "none"
	| "left"
	| "right"
	| "up"
	| "down";
export type UsePointerSwipePointerType = UsePointerType;
export type UsePointerSwipeElement = HTMLElement | SVGElement;

export interface UsePointerSwipeOptions {
	/**
	 * Minimum absolute pointer distance before the gesture is treated as a swipe.
	 *
	 * @default 50
	 */
	threshold?: MaybeValue<number>;
	pointerTypes?: MaybeValue<readonly UsePointerSwipePointerType[]>;
	onSwipeStart?: (event: PointerEvent) => void;
	onSwipe?: (event: PointerEvent) => void;
	onSwipeEnd?: (
		event: PointerEvent,
		direction: UsePointerSwipeDirection,
	) => void;
	/**
	 * Disable text selection while swipe listeners are active.
	 *
	 * @default false
	 */
	disableTextSelect?: MaybeValue<boolean>;
	/**
	 * CSS touch-action value applied while swipe listeners are active.
	 *
	 * @default "none"
	 */
	touchAction?: MaybeValue<string>;
	preventDefault?: MaybeValue<boolean>;
	stopPropagation?: MaybeValue<boolean>;
	/**
	 * Event listener capture option.
	 *
	 * @default false
	 */
	capture?: MaybeValue<boolean>;
	disabled?: MaybeValue<boolean>;
}

export interface UsePointerSwipeReturn {
	readonly isSwiping: ReadonlySignal<boolean>;
	readonly direction: Computed<UsePointerSwipeDirection>;
	readonly posStart: Computed<Position>;
	readonly posEnd: Computed<Position>;
	readonly distanceX: Computed<number>;
	readonly distanceY: Computed<number>;
	stop(): void;
}

export type UseSwipeDirection = "none" | "left" | "right" | "up" | "down";

export interface UseSwipeWindowLike extends WindowLike {}

export interface UseSwipeOptions<
	TWindow extends UseSwipeWindowLike = UseSwipeWindowLike,
> {
	/**
	 * Register events as passive.
	 *
	 * @default true
	 */
	passive?: boolean;
	/**
	 * Minimum absolute touch distance before the gesture is treated as a swipe.
	 *
	 * @default 50
	 */
	threshold?: MaybeValue<number>;
	window?: MaybeTarget<TWindow | null | undefined>;
	onSwipeStart?: (event: TouchEvent) => void;
	onSwipe?: (event: TouchEvent) => void;
	onSwipeEnd?: (event: TouchEvent, direction: UseSwipeDirection) => void;
}

export interface UseSwipeReturn {
	readonly isSwiping: ReadonlySignal<boolean>;
	readonly direction: Computed<UseSwipeDirection>;
	readonly coordsStart: Computed<Position>;
	readonly coordsEnd: Computed<Position>;
	readonly lengthX: Computed<number>;
	readonly lengthY: Computed<number>;
	stop(): void;
}

export type UseTextDirectionValue = "ltr" | "rtl" | "auto";

export interface UseTextDirectionDocumentLike extends DocumentLike {
	readonly defaultView?: UseMutationObserverWindowLike | null;
	querySelector?(selectors: string): Element | null;
}

export interface UseTextDirectionOptions<
	TDocument extends UseTextDirectionDocumentLike = UseTextDirectionDocumentLike,
> {
	document?: MaybeTarget<TDocument | null | undefined>;
	/**
	 * CSS selector for the target element.
	 *
	 * @default "html"
	 */
	selector?: MaybeValue<string>;
	/**
	 * Observe target element attribute changes.
	 *
	 * @default false
	 */
	observe?: MaybeValue<boolean>;
	/**
	 * Direction returned when the target element has no dir attribute.
	 *
	 * @default "ltr"
	 */
	initialValue?: MaybeValue<UseTextDirectionValue>;
}

export type UseTextDirectionReturn = Computed<UseTextDirectionValue> & {
	stop(): void;
};

export interface UseTextSelectionDocumentLike extends DocumentLike {}

export interface UseTextSelectionWindowLike extends WindowLike {
	readonly document?: UseTextSelectionDocumentLike;
	getSelection?(): Selection | null;
}

export interface UseTextSelectionOptions<
	TWindow extends UseTextSelectionWindowLike = UseTextSelectionWindowLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseTextSelectionReturn {
	readonly text: Computed<string>;
	readonly rects: Computed<DOMRect[]>;
	readonly ranges: Computed<Range[]>;
	readonly selection: ReadonlySignal<Selection | null>;
	stop(): void;
}

export type UseTextareaAutosizeStyleProp = "height" | "minHeight";

export type UseTextareaAutosizeWatchSource =
	| WatchSource
	| readonly WatchSource[];

export interface UseTextareaAutosizeWindowLike
	extends ResizeObserverWindowLike {
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseTextareaAutosizeOptions<
	TTextarea extends HTMLTextAreaElement = HTMLTextAreaElement,
	TStyleTarget extends HTMLElement = HTMLElement,
	TWindow extends UseTextareaAutosizeWindowLike = UseTextareaAutosizeWindowLike,
> {
	/** Textarea element to autosize. */
	element?: MaybeTarget<TTextarea | null | undefined>;
	/** Textarea content source. */
	input?: MaybeValue<string>;
	/** Maximum autosized height in pixels. */
	maxHeight?: number;
	/** Watch sources that should trigger a textarea resize. */
	watch?: UseTextareaAutosizeWatchSource;
	/** Function called when the textarea scroll height changes. */
	onResize?: () => void;
	/**
	 * Style target to apply the height based on textarea content.
	 * Defaults to the textarea element.
	 */
	styleTarget?: MaybeTarget<TStyleTarget | null | undefined>;
	/**
	 * Style property used to manipulate height.
	 *
	 * @default "height"
	 */
	styleProp?: UseTextareaAutosizeStyleProp;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseTextareaAutosizeReturn<
	TTextarea extends HTMLTextAreaElement = HTMLTextAreaElement,
> {
	readonly textarea: Signal<TTextarea | null | undefined>;
	readonly input: Signal<string>;
	triggerResize(): void;
	stop(): void;
}

export interface UsePointerLockElementLike extends EventTarget {
	getRootNode?(): UsePointerLockRootLike | Node;
	requestPointerLock?(options?: PointerLockOptions): Promise<void> | void;
}

export interface UsePointerLockRootLike {
	readonly pointerLockElement?: UsePointerLockElementLike | null;
}

export interface UsePointerLockDocumentLike extends DocumentLike {
	readonly documentElement?: UsePointerLockElementLike | null;
	readonly pointerLockElement?: UsePointerLockElementLike | null;
	exitPointerLock?(): Promise<void> | void;
}

export interface UsePointerLockOptions<
	TDocument extends UsePointerLockDocumentLike = UsePointerLockDocumentLike,
> {
	/**
	 * Automatically unlock pointer lock when the current Sigrea scope is disposed.
	 *
	 * @default false
	 */
	autoUnlock?: boolean;
	document?: MaybeTarget<TDocument | null | undefined>;
}

export interface UsePointerLockReturn<
	TElement extends UsePointerLockElementLike = UsePointerLockElementLike,
> {
	readonly element: ReadonlySignal<TElement | UsePointerLockElementLike | null>;
	readonly isLocked: ReadonlySignal<boolean>;
	readonly isSupported: ReadonlySignal<boolean>;
	lock(options?: PointerLockOptions): Promise<void>;
	unlock(): Promise<void>;
	toggle(options?: PointerLockOptions): Promise<void>;
	stop(): void;
}

export type UseMousePressedSourceEvent = MouseEvent | TouchEvent | DragEvent;

export interface UseMousePressedWindowLike extends WindowLike {}

export interface UseMousePressedOptions<
	TWindow extends UseMousePressedWindowLike = UseMousePressedWindowLike,
	TTarget extends EventTarget = EventTarget,
> {
	/**
	 * Listen to touchstart, touchend, and touchcancel.
	 *
	 * @default true
	 */
	touch?: boolean;
	/**
	 * Listen to dragstart, drop, and dragend.
	 *
	 * @default true
	 */
	drag?: boolean;
	/**
	 * Register event listeners in the capture phase.
	 *
	 * @default false
	 */
	capture?: boolean;
	/**
	 * Initial pressed state.
	 *
	 * @default false
	 */
	initialValue?: boolean;
	target?: MaybeTarget<TTarget | null | undefined>;
	window?: MaybeTarget<TWindow | null | undefined>;
	onPressed?: (event: UseMousePressedSourceEvent) => void;
	onReleased?: (event: UseMousePressedSourceEvent) => void;
}

export interface UseMousePressedReturn {
	readonly pressed: ReadonlySignal<boolean>;
	readonly sourceType: ReadonlySignal<UseMouseSourceType>;
	stop(): void;
}

export type UseMutationObserverTarget<TNode extends Node = Node> =
	| MaybeTarget<TNode | null | undefined>
	| readonly MaybeTarget<TNode | null | undefined>[]
	| null
	| undefined;

export interface UseMutationObserverWindowLike extends WindowLike {
	readonly MutationObserver?: typeof MutationObserver;
}

export interface UseMutationObserverOptions<
	TWindow extends UseMutationObserverWindowLike = UseMutationObserverWindowLike,
> extends MutationObserverInit {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseMutationObserverReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	stop(): void;
	takeRecords(): MutationRecord[] | undefined;
}

export interface UseNavigatorLanguageNavigatorLike extends NavigatorLike {
	readonly language?: string;
}

export interface UseNavigatorLanguageOptions<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends
		UseNavigatorLanguageNavigatorLike = UseNavigatorLanguageNavigatorLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseNavigatorLanguageReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly language: ReadonlySignal<string | undefined>;
	stop(): void;
}

export interface UsePreferredLanguagesNavigatorLike extends NavigatorLike {
	readonly languages?: readonly string[];
}

export interface UsePreferredLanguagesOptions<
	TWindow extends WindowLike = WindowLike,
	TNavigator extends
		UsePreferredLanguagesNavigatorLike = UsePreferredLanguagesNavigatorLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UsePreferredLanguagesReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly languages: ReadonlySignal<readonly string[]>;
	stop(): void;
}

export type UseDraggableAxis = "x" | "y" | "both";
export type UseDraggablePointerType = "mouse" | "pen" | "touch" | (string & {});
export type UseDraggableElement = HTMLElement | SVGElement;
export type UseDraggableDraggingElement =
	| HTMLElement
	| SVGElement
	| Window
	| Document;

export interface UseDraggableOptions {
	/**
	 * Start dragging only when the pointerdown target is the draggable element itself.
	 */
	exact?: MaybeValue<boolean>;
	preventDefault?: MaybeValue<boolean>;
	stopPropagation?: MaybeValue<boolean>;
	/**
	 * Event listener capture option.
	 *
	 * @default true
	 */
	capture?: MaybeValue<boolean>;
	draggingElement?: MaybeTarget<UseDraggableDraggingElement>;
	containerElement?: MaybeTarget<UseDraggableElement>;
	handle?: MaybeTarget<UseDraggableElement>;
	pointerTypes?: MaybeValue<readonly UseDraggablePointerType[]>;
	initialValue?: MaybeValue<Position>;
	onStart?: (position: Position, event: PointerEvent) => void | false;
	onMove?: (position: Position, event: PointerEvent) => void;
	onEnd?: (position: Position, event: PointerEvent) => void;
	axis?: MaybeValue<UseDraggableAxis>;
	disabled?: MaybeValue<boolean>;
	/**
	 * PointerEvent.button values allowed to start dragging.
	 *
	 * @default [0]
	 */
	buttons?: MaybeValue<readonly number[]>;
}

export interface UseDraggableReturn {
	readonly x: ReadonlySignal<number>;
	readonly y: ReadonlySignal<number>;
	readonly position: Computed<Position>;
	readonly isDragging: Computed<boolean>;
	readonly style: Computed<string>;
	stop(): void;
}

export type UseDropZoneTarget = HTMLElement | SVGElement | Document | Window;
export type UseDropZoneFiles = readonly File[] | null;
export type UseDropZoneDataTypesValidator = (
	types: readonly string[],
) => boolean;

export type UseDropZoneDataTypes =
	| MaybeValue<readonly string[]>
	| UseDropZoneDataTypesValidator;

export type UseDropZoneEventCallback = (
	files: UseDropZoneFiles,
	event: DragEvent,
) => void;

export interface UseDropZoneOptions {
	/**
	 * Allowed drag data types. If omitted or empty, all data types are allowed.
	 */
	dataTypes?: UseDropZoneDataTypes;
	/**
	 * Custom validation for DataTransferItemList. This takes precedence over dataTypes.
	 * The multiple-file limit is still applied when this is provided.
	 */
	checkValidity?: (items: DataTransferItemList) => boolean;
	onDrop?: UseDropZoneEventCallback;
	onEnter?: UseDropZoneEventCallback;
	onLeave?: UseDropZoneEventCallback;
	onOver?: UseDropZoneEventCallback;
	/**
	 * Allow multiple files to be dropped.
	 *
	 * @default true
	 */
	multiple?: MaybeValue<boolean>;
	/**
	 * Prevent default behavior for unhandled events.
	 *
	 * @default false
	 */
	preventDefaultForUnhandled?: MaybeValue<boolean>;
}

export interface UseDropZoneReturn {
	readonly files: ReadonlySignal<UseDropZoneFiles>;
	readonly isOverDropZone: ReadonlySignal<boolean>;
	stop(): void;
}

export type FocusMethodOptions = FocusOptions;

export interface FocusableElementLike extends EventTarget {
	focus(options?: FocusMethodOptions): void;
	blur(): void;
	matches?(selectors: string): boolean;
}

export interface FocusWithinElementLike extends EventTarget {
	contains?(other: Node | null): boolean;
	matches?(selectors: string): boolean;
	ownerDocument?: Document;
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

export interface UseFocusWithinReturn {
	readonly focused: ReadonlySignal<boolean>;
	stop(): void;
}

export interface UseFpsPerformanceLike {
	now(): number;
}

export interface UseFpsWindowLike extends WindowLike {
	readonly performance?: UseFpsPerformanceLike;
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseFpsOptions<
	TWindow extends UseFpsWindowLike = UseFpsWindowLike,
> {
	/**
	 * Calculate the FPS on every x frames.
	 *
	 * @default 10
	 */
	every?: MaybeValue<number>;
	window?: MaybeTarget<TWindow>;
}

export type UseFpsReturn = ReadonlySignal<number>;

export interface UseFullscreenEnterOptions {
	navigationUI?: FullscreenNavigationUI;
}

export interface UseFullscreenElementLike extends EventTarget {
	readonly webkitDisplayingFullscreen?: boolean;
	getRootNode?(): UseFullscreenRootLike;
	requestFullscreen?(options?: UseFullscreenEnterOptions): Promise<void>;
	webkitEnterFullscreen?(): Promise<void> | void;
	webkitEnterFullScreen?(): Promise<void> | void;
	webkitExitFullscreen?(): Promise<void> | void;
	webkitExitFullScreen?(): Promise<void> | void;
	webkitRequestFullscreen?(
		options?: UseFullscreenEnterOptions,
	): Promise<void> | void;
	webkitRequestFullScreen?(
		options?: UseFullscreenEnterOptions,
	): Promise<void> | void;
}

export interface UseFullscreenRootLike {
	readonly fullscreenElement?: UseFullscreenElementLike | null;
	readonly webkitFullscreenElement?: UseFullscreenElementLike | null;
}

export interface UseFullscreenDocumentLike extends DocumentLike {
	readonly documentElement?: UseFullscreenElementLike | null;
	readonly fullscreen?: boolean;
	readonly fullscreenElement?: UseFullscreenElementLike | null;
	readonly fullscreenEnabled?: boolean;
	readonly webkitFullscreenElement?: UseFullscreenElementLike | null;
	readonly webkitFullscreenEnabled?: boolean;
	readonly webkitIsFullScreen?: boolean;
	exitFullscreen?(): Promise<void>;
	webkitCancelFullScreen?(): Promise<void> | void;
	webkitExitFullScreen?(): Promise<void> | void;
	webkitExitFullscreen?(): Promise<void> | void;
}

export interface UseFullscreenOptions<
	TDocument extends UseFullscreenDocumentLike = UseFullscreenDocumentLike,
> {
	/**
	 * Automatically exit fullscreen when the current Sigrea scope is disposed.
	 *
	 * @default false
	 */
	autoExit?: boolean;
	document?: MaybeTarget<TDocument>;
}

export interface UseFullscreenReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isFullscreen: ReadonlySignal<boolean>;
	enter(options?: UseFullscreenEnterOptions): Promise<void>;
	exit(): Promise<void>;
	toggle(options?: UseFullscreenEnterOptions): Promise<void>;
	stop(): void;
}

export interface UseGamepadButtonLike {
	readonly pressed: boolean;
	readonly touched: boolean;
	readonly value: number;
}

export interface UseGamepadHapticActuatorLike {
	playEffect?(type: string, params?: Record<string, unknown>): Promise<unknown>;
	reset?(): Promise<unknown>;
}

export interface UseGamepadGamepadLike {
	readonly axes: ArrayLike<number>;
	readonly buttons: ArrayLike<UseGamepadButtonLike>;
	readonly connected: boolean;
	readonly hapticActuators?: ArrayLike<UseGamepadHapticActuatorLike> | null;
	readonly id: string;
	readonly index: number;
	readonly mapping: string;
	readonly timestamp: number;
	readonly vibrationActuator?: UseGamepadHapticActuatorLike | null;
}

export interface UseGamepadGamepadSnapshot {
	readonly axes: readonly number[];
	readonly buttons: readonly UseGamepadButtonLike[];
	readonly connected: boolean;
	readonly hapticActuators: readonly UseGamepadHapticActuatorLike[];
	readonly id: string;
	readonly index: number;
	readonly mapping: string;
	readonly timestamp: number;
	readonly vibrationActuator: UseGamepadHapticActuatorLike | null;
}

export interface UseGamepadNavigatorLike extends NavigatorLike {
	getGamepads(): readonly (UseGamepadGamepadLike | null | undefined)[];
}

export interface UseGamepadWindowLike extends WindowLike {
	readonly navigator?: UseGamepadNavigatorLike;
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseGamepadOptions<
	TNavigator extends UseGamepadNavigatorLike = UseGamepadNavigatorLike,
	TWindow extends UseGamepadWindowLike = UseGamepadWindowLike,
> {
	immediate?: boolean;
	navigator?: MaybeTarget<TNavigator | null | undefined>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseGamepadReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly gamepads: ReadonlySignal<readonly UseGamepadGamepadSnapshot[]>;
	onConnected: EventHookOn<number>;
	onDisconnected: EventHookOn<number>;
	readonly isActive: ReadonlySignal<boolean>;
	pause(): void;
	resume(): void;
	stop(): void;
}

export interface UseGeolocationCoordinates {
	readonly accuracy: number;
	readonly altitude: number | null;
	readonly altitudeAccuracy: number | null;
	readonly heading: number | null;
	readonly latitude: number;
	readonly longitude: number;
	readonly speed: number | null;
}

export interface UseGeolocationPositionLike {
	readonly coords: UseGeolocationCoordinates;
	readonly timestamp: number;
}

export interface UseGeolocationGeolocationLike {
	watchPosition(
		successCallback: PositionCallback,
		errorCallback?: PositionErrorCallback | null,
		options?: PositionOptions,
	): number;
	clearWatch(watchId: number): void;
}

export interface UseGeolocationNavigatorLike extends NavigatorLike {
	readonly geolocation?: UseGeolocationGeolocationLike | null;
}

export interface UseGeolocationOptions<
	TNavigator extends UseGeolocationNavigatorLike = UseGeolocationNavigatorLike,
> extends PositionOptions {
	immediate?: boolean;
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseGeolocationReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isActive: ReadonlySignal<boolean>;
	readonly coords: ReadonlySignal<UseGeolocationCoordinates | null>;
	readonly locatedAt: ReadonlySignal<number | null>;
	readonly error: ReadonlySignal<GeolocationPositionError | null>;
	resume(): void;
	pause(): void;
	stop(): void;
}

export type UseIdleEventName = Extract<keyof WindowEventMap, string>;

export interface UseIdleDocumentLike extends DocumentLike {
	readonly hidden?: boolean;
}

export interface UseIdleWindowLike extends WindowLike {
	readonly document?: UseIdleDocumentLike;
}

export interface UseIdleOptions<
	TWindow extends UseIdleWindowLike = UseIdleWindowLike,
> {
	events?: readonly UseIdleEventName[];
	immediate?: boolean;
	initialState?: boolean;
	listenForVisibilityChange?: boolean;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseIdleReturn {
	readonly idle: ReadonlySignal<boolean>;
	readonly lastActive: ReadonlySignal<number>;
	readonly isPending: ReadonlySignal<boolean>;
	reset(): void;
	start(): void;
	stop(): void;
}

export interface UseImageWindowLike extends WindowLike {
	readonly Image: { new (width?: number, height?: number): HTMLImageElement };
}

export interface UseImageOptions {
	src: string;
	srcset?: string;
	sizes?: string;
	alt?: string;
	class?: string;
	loading?: HTMLImageElement["loading"];
	crossorigin?: HTMLImageElement["crossOrigin"];
	referrerPolicy?: HTMLImageElement["referrerPolicy"];
	width?: HTMLImageElement["width"];
	height?: HTMLImageElement["height"];
	decoding?: HTMLImageElement["decoding"];
	fetchPriority?: HTMLImageElement["fetchPriority"];
	ismap?: HTMLImageElement["isMap"];
	usemap?: HTMLImageElement["useMap"];
}

export interface UseImageAsyncStateOptions<
	TWindow extends UseImageWindowLike = UseImageWindowLike,
> extends UseAsyncStateOptions<HTMLImageElement | undefined> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export type UseImageReturn = UseAsyncStateReturn<
	HTMLImageElement | undefined,
	[]
>;

export type UseScrollDirection = "top" | "bottom" | "left" | "right";

export interface UseScrollArrivedState {
	readonly left: boolean;
	readonly right: boolean;
	readonly top: boolean;
	readonly bottom: boolean;
}

export interface UseScrollDirections {
	readonly left: boolean;
	readonly right: boolean;
	readonly top: boolean;
	readonly bottom: boolean;
}

export interface UseScrollDocumentLike extends DocumentLike {
	readonly documentElement?: HTMLElement | null;
	readonly body?: HTMLElement | null;
	readonly scrollingElement?: Element | null;
}

export interface UseScrollWindowLike extends UseMutationObserverWindowLike {
	readonly document?: UseScrollDocumentLike;
	readonly pageXOffset?: number;
	readonly pageYOffset?: number;
	readonly scrollX?: number;
	readonly scrollY?: number;
	getComputedStyle?(
		element: Element,
		pseudoElt?: string | null,
	): CSSStyleDeclaration;
	scrollTo?(options?: ScrollToOptions): void;
}

export type UseScrollElement =
	| HTMLElement
	| SVGElement
	| UseScrollWindowLike
	| UseScrollDocumentLike
	| null
	| undefined;

export interface UseScrollOptions<
	TElement extends UseScrollElement = UseScrollElement,
	TWindow extends UseScrollWindowLike = UseScrollWindowLike,
> {
	/**
	 * Throttle time for scroll events.
	 *
	 * @default 0
	 */
	throttle?: number;
	/**
	 * Time to wait after scroll events before reporting scrolling as stopped.
	 *
	 * @default 200
	 */
	idle?: number;
	/**
	 * Offset arrived states by pixels.
	 */
	offset?: Partial<Record<UseScrollDirection, number>>;
	/**
	 * Observe DOM mutations and recalculate the scroll state.
	 *
	 * @default { mutation: false }
	 */
	observe?:
		| boolean
		| {
				mutation?: boolean;
		  };
	onScroll?: (event: Event) => void;
	onStop?: (event: Event) => void;
	onError?: (error: unknown) => void;
	eventListenerOptions?: boolean | AddEventListenerOptions;
	behavior?: MaybeValue<ScrollBehavior>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseScrollReturn {
	readonly x: Computed<number>;
	readonly y: Computed<number>;
	readonly isScrolling: ReadonlySignal<boolean>;
	readonly arrivedState: ReadonlySignal<UseScrollArrivedState>;
	readonly directions: ReadonlySignal<UseScrollDirections>;
	measure(): void;
	scrollTo(options?: ScrollToOptions): void;
	stop(): void;
}

export interface UseWindowScrollOptions<
	TWindow extends UseScrollWindowLike = UseScrollWindowLike,
> extends Omit<
		UseScrollOptions<TWindow | null | undefined, TWindow>,
		"window"
	> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export type UseWindowScrollReturn = UseScrollReturn;

export interface UseScrollLockElementLike extends Element {
	readonly style: CSSStyleDeclaration;
}

export interface UseScrollLockDocumentLike extends DocumentLike {
	readonly documentElement?: UseScrollLockElementLike | null;
}

export interface UseScrollLockWindowLike extends WindowLike {
	readonly document?: UseScrollLockDocumentLike;
	readonly navigator?: WindowLike["navigator"] & {
		readonly maxTouchPoints?: number;
		readonly platform?: string;
	};
	getComputedStyle?(element: Element): CSSStyleDeclaration;
}

export type UseScrollLockElement =
	| HTMLElement
	| SVGElement
	| UseScrollLockWindowLike
	| UseScrollLockDocumentLike
	| null
	| undefined;

export interface UseScrollLockOptions<
	TWindow extends UseScrollLockWindowLike = UseScrollLockWindowLike,
> {
	window?: MaybeTarget<TWindow | null | undefined>;
}

export type UseScrollLockReturn = Computed<boolean> & {
	stop(): void;
};

export interface UseShareData {
	files?: readonly File[];
	title?: string;
	text?: string;
	url?: string;
}

export interface UseShareNavigatorLike extends NavigatorLike {
	canShare?(data?: UseShareData): boolean;
	share?(data?: UseShareData): Promise<void>;
}

export interface UseShareOptions<
	TNavigator extends UseShareNavigatorLike = UseShareNavigatorLike,
> {
	navigator?: MaybeValue<TNavigator | null | undefined>;
}

export interface UseShareReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	canShare(
		overrideOptions?: MaybeValue<UseShareData | null | undefined>,
	): boolean;
	share(
		overrideOptions?: MaybeValue<UseShareData | null | undefined>,
	): Promise<void>;
	stop(): void;
}

export type SpeechRecognitionErrorCode =
	| "no-speech"
	| "aborted"
	| "audio-capture"
	| "network"
	| "not-allowed"
	| "service-not-allowed"
	| "language-not-supported"
	| "phrases-not-supported";

export interface SpeechRecognitionAlternativeLike {
	readonly transcript: string;
	readonly confidence: number;
}

export interface SpeechRecognitionResultLike {
	readonly length: number;
	readonly isFinal: boolean;
	readonly [index: number]: SpeechRecognitionAlternativeLike | undefined;
	item(index: number): SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
	readonly length: number;
	readonly [index: number]: SpeechRecognitionResultLike | undefined;
	item(index: number): SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike extends Event {
	readonly resultIndex: number;
	readonly results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike extends Event {
	readonly error: SpeechRecognitionErrorCode;
	readonly message: string;
}

export interface SpeechRecognitionLike extends EventTarget {
	continuous: boolean;
	interimResults: boolean;
	lang: string;
	maxAlternatives: number;
	start(): void;
	stop(): void;
	abort(): void;
}

export interface SpeechRecognitionConstructorLike<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
> {
	new (): TSpeechRecognition;
}

export interface UseSpeechRecognitionWindowLike<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
> extends WindowLike {
	readonly SpeechRecognition?: SpeechRecognitionConstructorLike<TSpeechRecognition>;
	readonly webkitSpeechRecognition?: SpeechRecognitionConstructorLike<TSpeechRecognition>;
}

export type SpeechRecognitionForWindow<TWindow> =
	TWindow extends UseSpeechRecognitionWindowLike<infer TSpeechRecognition>
		? TSpeechRecognition
		: SpeechRecognitionLike;

export interface UseSpeechRecognitionOptions<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
	TWindow extends
		UseSpeechRecognitionWindowLike<TSpeechRecognition> = UseSpeechRecognitionWindowLike<TSpeechRecognition>,
> {
	/**
	 * Controls whether continuous results are returned for each recognition.
	 *
	 * @default true
	 */
	continuous?: boolean;
	/**
	 * Controls whether interim results are returned.
	 *
	 * @default true
	 */
	interimResults?: boolean;
	/**
	 * Language for SpeechRecognition.
	 *
	 * @default "en-US"
	 */
	lang?: MaybeValue<string>;
	/**
	 * Maximum returned alternatives for each result.
	 *
	 * @default 1
	 */
	maxAlternatives?: number;
	window?: MaybeTarget<TWindow>;
}

export type UseSpeechRecognitionWindowOptions<
	TWindow extends UseSpeechRecognitionWindowLike<SpeechRecognitionLike>,
> = {
	/**
	 * Controls whether continuous results are returned for each recognition.
	 *
	 * @default true
	 */
	continuous?: boolean;
	/**
	 * Controls whether interim results are returned.
	 *
	 * @default true
	 */
	interimResults?: boolean;
	/**
	 * Language for SpeechRecognition.
	 *
	 * @default "en-US"
	 */
	lang?: MaybeValue<string>;
	/**
	 * Maximum returned alternatives for each result.
	 *
	 * @default 1
	 */
	maxAlternatives?: number;
	window: MaybeTarget<TWindow>;
};

export interface UseSpeechRecognitionReturn<
	TSpeechRecognition extends SpeechRecognitionLike = SpeechRecognitionLike,
> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isListening: ReadonlySignal<boolean>;
	readonly isFinal: ReadonlySignal<boolean>;
	readonly recognition: ReadonlySignal<TSpeechRecognition | undefined>;
	readonly result: ReadonlySignal<string>;
	readonly error: ReadonlySignal<unknown | null>;
	start(): void;
	stop(): void;
	abort(): void;
	toggle(value?: boolean): void;
}

export type SpeechSynthesisStatus = "init" | "play" | "pause" | "end";

export type SpeechSynthesisErrorCode =
	| "canceled"
	| "interrupted"
	| "audio-busy"
	| "audio-hardware"
	| "network"
	| "synthesis-unavailable"
	| "synthesis-failed"
	| "language-unavailable"
	| "voice-unavailable"
	| "text-too-long"
	| "invalid-argument"
	| "not-allowed";

export interface SpeechSynthesisVoiceLike {
	readonly default: boolean;
	readonly lang: string;
	readonly localService: boolean;
	readonly name: string;
	readonly voiceURI: string;
}

export interface SpeechSynthesisUtteranceLike<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
> extends EventTarget {
	lang: string;
	pitch: number;
	rate: number;
	text: string;
	voice: TVoice | null;
	volume: number;
}

export interface SpeechSynthesisUtteranceConstructorLike<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
> {
	new (text?: string): TUtterance;
}

export interface SpeechSynthesisLike<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
> extends EventTarget {
	readonly paused: boolean;
	readonly pending: boolean;
	readonly speaking: boolean;
	cancel(): void;
	getVoices(): ArrayLike<TVoice>;
	pause(): void;
	resume(): void;
	speak(utterance: TUtterance): void;
}

export interface SpeechSynthesisEventLike<
	TUtterance extends
		SpeechSynthesisUtteranceLike = SpeechSynthesisUtteranceLike,
> extends Event {
	readonly charIndex: number;
	readonly charLength: number;
	readonly elapsedTime: number;
	readonly name: string;
	readonly utterance: TUtterance;
}

export interface SpeechSynthesisErrorEventLike<
	TUtterance extends
		SpeechSynthesisUtteranceLike = SpeechSynthesisUtteranceLike,
> extends SpeechSynthesisEventLike<TUtterance> {
	readonly error: SpeechSynthesisErrorCode;
}

export interface UseSpeechSynthesisWindowLike<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
	TSynthesis extends SpeechSynthesisLike<
		TVoice,
		TUtterance
	> = SpeechSynthesisLike<TVoice, TUtterance>,
> extends WindowLike {
	readonly speechSynthesis?: TSynthesis;
	readonly SpeechSynthesisUtterance?: SpeechSynthesisUtteranceConstructorLike<
		TVoice,
		TUtterance
	>;
}

export type SpeechSynthesisForWindow<TWindow> =
	TWindow extends UseSpeechSynthesisWindowLike<
		infer _TVoice,
		infer _TUtterance,
		infer TSynthesis
	>
		? TSynthesis
		: SpeechSynthesisLike;

export type SpeechSynthesisUtteranceForWindow<TWindow> =
	TWindow extends UseSpeechSynthesisWindowLike<
		infer _TVoice,
		infer TUtterance,
		infer _TSynthesis
	>
		? TUtterance
		: SpeechSynthesisUtteranceLike;

export type SpeechSynthesisVoiceForWindow<TWindow> =
	TWindow extends UseSpeechSynthesisWindowLike<
		infer TVoice,
		infer _TUtterance,
		infer _TSynthesis
	>
		? TVoice
		: SpeechSynthesisVoiceLike;

export interface UseSpeechSynthesisOptions<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
	TWindow extends UseSpeechSynthesisWindowLike<
		TVoice,
		TUtterance
	> = UseSpeechSynthesisWindowLike<TVoice, TUtterance>,
> {
	/**
	 * Language for SpeechSynthesis.
	 *
	 * @default "en-US"
	 */
	lang?: MaybeValue<string>;
	/**
	 * Pitch for the utterance.
	 *
	 * @default 1
	 */
	pitch?: MaybeValue<number>;
	/**
	 * Speaking rate for the utterance.
	 *
	 * @default 1
	 */
	rate?: MaybeValue<number>;
	/**
	 * Voice for the utterance.
	 */
	voice?: MaybeValue<TVoice | null | undefined>;
	/**
	 * Volume for the utterance.
	 *
	 * @default 1
	 */
	volume?: MaybeValue<number>;
	/**
	 * Called when the browser reports a word, sentence, or SSML mark boundary.
	 */
	onBoundary?: (event: SpeechSynthesisEventLike<TUtterance>) => void;
	window?: MaybeTarget<TWindow>;
}

export type UseSpeechSynthesisWindowOptions<
	TWindow extends UseSpeechSynthesisWindowLike,
> = {
	/**
	 * Language for SpeechSynthesis.
	 *
	 * @default "en-US"
	 */
	lang?: MaybeValue<string>;
	/**
	 * Pitch for the utterance.
	 *
	 * @default 1
	 */
	pitch?: MaybeValue<number>;
	/**
	 * Speaking rate for the utterance.
	 *
	 * @default 1
	 */
	rate?: MaybeValue<number>;
	/**
	 * Voice for the utterance.
	 */
	voice?: MaybeValue<SpeechSynthesisVoiceForWindow<TWindow> | null | undefined>;
	/**
	 * Volume for the utterance.
	 *
	 * @default 1
	 */
	volume?: MaybeValue<number>;
	/**
	 * Called when the browser reports a word, sentence, or SSML mark boundary.
	 */
	onBoundary?: (
		event: SpeechSynthesisEventLike<SpeechSynthesisUtteranceForWindow<TWindow>>,
	) => void;
	window: MaybeTarget<TWindow>;
};

export interface UseSpeechSynthesisReturn<
	TVoice extends SpeechSynthesisVoiceLike = SpeechSynthesisVoiceLike,
	TUtterance extends
		SpeechSynthesisUtteranceLike<TVoice> = SpeechSynthesisUtteranceLike<TVoice>,
> {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isPlaying: ReadonlySignal<boolean>;
	readonly status: ReadonlySignal<SpeechSynthesisStatus>;
	readonly utterance: ReadonlySignal<TUtterance | undefined>;
	readonly error: ReadonlySignal<unknown | null>;
	readonly voices: ReadonlySignal<readonly TVoice[]>;
	speak(): void;
	cancel(): void;
	stop(): void;
	toggle(value?: boolean): void;
	pause(): void;
	resume(): void;
}

export type UseInfiniteScrollDirection = "top" | "bottom" | "left" | "right";

export type UseInfiniteScrollElement =
	| HTMLElement
	| SVGElement
	| Window
	| Document
	| null
	| undefined;

export interface UseInfiniteScrollArrivedState {
	readonly left: boolean;
	readonly right: boolean;
	readonly top: boolean;
	readonly bottom: boolean;
}

export interface UseInfiniteScrollDirections {
	readonly left: boolean;
	readonly right: boolean;
	readonly top: boolean;
	readonly bottom: boolean;
}

export interface UseInfiniteScrollWindowLike
	extends UseElementVisibilityWindowLike {
	getComputedStyle?(
		element: Element,
		pseudoElt?: string | null,
	): CSSStyleDeclaration;
}

export interface UseInfiniteScrollState {
	readonly x: ReadonlySignal<number>;
	readonly y: ReadonlySignal<number>;
	readonly isScrolling: ReadonlySignal<boolean>;
	readonly arrivedState: ReadonlySignal<UseInfiniteScrollArrivedState>;
	readonly directions: ReadonlySignal<UseInfiniteScrollDirections>;
	measure(): void;
}

export interface UseInfiniteScrollOptions<
	TElement extends UseInfiniteScrollElement = UseInfiniteScrollElement,
	TWindow extends UseInfiniteScrollWindowLike = UseInfiniteScrollWindowLike,
> {
	/**
	 * The minimum distance between the configured edge and the viewport edge.
	 *
	 * @default 0
	 */
	distance?: number;
	/**
	 * The direction in which to listen the scroll.
	 *
	 * @default "bottom"
	 */
	direction?: UseInfiniteScrollDirection;
	/**
	 * The minimum time between load calls.
	 *
	 * @default 100
	 */
	interval?: number;
	/**
	 * Return false when all content has been loaded.
	 */
	canLoadMore?: (element: HTMLElement | SVGElement) => boolean;
	/**
	 * Offset arrived states by pixels.
	 */
	offset?: Partial<Record<UseInfiniteScrollDirection, number>>;
	/**
	 * Throttle time for scroll events.
	 *
	 * @default 0
	 */
	throttle?: number;
	/**
	 * Time to wait after scroll events before reporting scrolling as stopped.
	 *
	 * @default 200
	 */
	idle?: number;
	onScroll?: (event: Event) => void;
	onStop?: (event: Event) => void;
	onError?: (error: unknown) => void;
	eventListenerOptions?: boolean | AddEventListenerOptions;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseInfiniteScrollReturn {
	readonly isLoading: ReadonlySignal<boolean>;
	readonly error: ReadonlySignal<unknown | undefined>;
	reset(): void;
	stop(): void;
}

export type UseIntersectionObserverTarget<TElement extends Element = Element> =
	| TElement
	| readonly (TElement | null | undefined)[]
	| null
	| undefined;

export interface UseIntersectionObserverWindowLike extends WindowLike {
	readonly IntersectionObserver?: typeof IntersectionObserver;
}

export interface UseIntersectionObserverOptions<
	TWindow extends
		UseIntersectionObserverWindowLike = UseIntersectionObserverWindowLike,
> {
	/**
	 * Start observing immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * The element or document used as the viewport for checking intersections.
	 */
	root?: MaybeTarget<Element | Document | null | undefined>;
	rootMargin?: MaybeValue<IntersectionObserverInit["rootMargin"]>;
	threshold?: MaybeValue<IntersectionObserverInit["threshold"]>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseIntersectionObserverReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	readonly isActive: ReadonlySignal<boolean>;
	pause(): void;
	resume(): void;
	stop(): void;
}

export interface ElementSize {
	width: number;
	height: number;
}

export interface ResizeObserverWindowLike extends WindowLike {
	readonly ResizeObserver?: typeof ResizeObserver;
}

export type UseResizeObserverTarget<TElement extends Element = Element> =
	| MaybeTarget<TElement | null | undefined>
	| readonly MaybeTarget<TElement | null | undefined>[]
	| null
	| undefined;

export interface UseResizeObserverOptions<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
> {
	box?: MaybeValue<ResizeObserverOptions["box"]>;
	window?: MaybeTarget<TWindow | null | undefined>;
}

export interface UseResizeObserverReturn {
	readonly isSupported: ReadonlySignal<boolean>;
	stop(): void;
}

export type UseElementBoundingUpdateTiming = "sync" | "next-frame";

export interface UseElementBoundingWindowLike extends ResizeObserverWindowLike {
	readonly MutationObserver?: typeof MutationObserver;
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export interface UseElementBoundingOptions<
	TWindow extends UseElementBoundingWindowLike = UseElementBoundingWindowLike,
> {
	/**
	 * Reset values to 0 when the target cannot be resolved.
	 *
	 * @default true
	 */
	reset?: boolean;
	/**
	 * Listen to window resize.
	 *
	 * @default true
	 */
	windowResize?: boolean;
	/**
	 * Listen to window scroll.
	 *
	 * @default true
	 */
	windowScroll?: boolean;
	/**
	 * Read the current bounding box immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
	/**
	 * Delay recalculation to the next animation frame.
	 *
	 * @default "sync"
	 */
	updateTiming?: UseElementBoundingUpdateTiming;
	window?: MaybeTarget<TWindow>;
}

export interface UseElementBoundingReturn {
	readonly height: ReadonlySignal<number>;
	readonly bottom: ReadonlySignal<number>;
	readonly left: ReadonlySignal<number>;
	readonly right: ReadonlySignal<number>;
	readonly top: ReadonlySignal<number>;
	readonly width: ReadonlySignal<number>;
	readonly x: ReadonlySignal<number>;
	readonly y: ReadonlySignal<number>;
	update(): void;
	stop(): void;
}

export type UseElementHoverDocumentLike = OnElementRemovalDocumentLike;

export interface UseElementHoverWindowLike extends OnElementRemovalWindowLike {}

export interface UseElementHoverOptions<
	TWindow extends UseElementHoverWindowLike = UseElementHoverWindowLike,
	TDocument extends UseElementHoverDocumentLike = UseElementHoverDocumentLike,
> {
	delayEnter?: MaybeValue<number>;
	delayLeave?: MaybeValue<number>;
	triggerOnRemoval?: boolean;
	document?: MaybeTarget<TDocument>;
	window?: MaybeTarget<TWindow>;
}

export interface UseElementHoverReturn {
	readonly isHovered: ReadonlySignal<boolean>;
	stop(): void;
}

export interface UseElementByPointDocumentLike extends DocumentLike {
	readonly defaultView?: UseElementByPointWindowLike | null;
	elementFromPoint?(x: number, y: number): Element | null;
	elementsFromPoint?(x: number, y: number): Element[];
}

export interface UseElementByPointWindowLike extends WindowLike {
	readonly document?: UseElementByPointDocumentLike;
	requestAnimationFrame?(callback: FrameRequestCallback): number;
	cancelAnimationFrame?(handle: number): void;
}

export type UseElementByPointElement<
	Multiple extends boolean = false,
	TElement extends Element = Element,
> = Multiple extends true ? readonly TElement[] : TElement | null;

export type UseElementByPointInterval =
	| MaybeValue<number>
	| "requestAnimationFrame";

export type UseElementByPointScheduler = (
	callback: () => void,
) => UseIntervalFnReturn;

export interface UseElementByPointOptions<
	Multiple extends boolean = false,
	TDocument extends
		UseElementByPointDocumentLike = UseElementByPointDocumentLike,
	TWindow extends UseElementByPointWindowLike = UseElementByPointWindowLike,
> {
	x: MaybeValue<number>;
	y: MaybeValue<number>;
	multiple?: MaybeValue<Multiple>;
	document?: MaybeTarget<TDocument>;
	window?: MaybeTarget<TWindow>;
	scheduler?: UseElementByPointScheduler;
	/**
	 * Polling interval or animation frame scheduler.
	 *
	 * @default "requestAnimationFrame"
	 */
	interval?: UseElementByPointInterval;
	/**
	 * Start point tracking immediately.
	 *
	 * @default true
	 */
	immediate?: boolean;
}

export interface UseElementByPointReturn<
	Multiple extends boolean = false,
	TElement extends Element = Element,
> extends UseIntervalFnReturn {
	readonly element: ReadonlySignal<
		UseElementByPointElement<Multiple, TElement>
	>;
	readonly isSupported: ReadonlySignal<boolean>;
	update(): void;
	stop(): void;
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

export interface UseElementVisibilityWindowLike extends WindowLike {
	readonly IntersectionObserver?: typeof IntersectionObserver;
}

export interface UseElementVisibilityOptions<
	TWindow extends
		UseElementVisibilityWindowLike = UseElementVisibilityWindowLike,
> {
	/**
	 * Initial visibility value until IntersectionObserver reports the first state.
	 *
	 * @default false
	 */
	initialValue?: boolean;
	/**
	 * The element or document used as the viewport for checking visibility.
	 */
	root?: MaybeTarget<Element | Document>;
	/**
	 * Stop tracking when visibility changes for the first time.
	 *
	 * @default false
	 */
	once?: boolean;
	rootMargin?: MaybeValue<IntersectionObserverInit["rootMargin"]>;
	threshold?: MaybeValue<IntersectionObserverInit["threshold"]>;
	window?: MaybeTarget<TWindow>;
}

export interface UseElementVisibilityReturn {
	readonly isVisible: ReadonlySignal<boolean>;
	readonly isSupported: ReadonlySignal<boolean>;
	stop(): void;
}

export type CloneFn<T> = (value: T) => T;

export type UseClonedCloneFn<T, Cloned = T> = (
	value: T,
) => Cloned extends PromiseLike<unknown> ? never : Cloned;

export interface UseClonedOptions<T, Cloned = T>
	extends Omit<WatchOptions, "immediate"> {
	/**
	 * Custom clone function.
	 *
	 * @default structuredClone
	 */
	clone?: UseClonedCloneFn<T, Cloned>;
	/**
	 * Do not sync the cloned value when the source changes.
	 *
	 * @default false
	 */
	manual?: boolean;
}

export interface UseClonedReturn<T> {
	cloned: Signal<T>;
	readonly isModified: ReadonlySignal<boolean>;
	sync(): void;
	stop(): void;
}

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

export interface UseDebouncedRefHistoryOptions<Raw, Serialized = Raw>
	extends UseRefHistoryOptions<Raw, Serialized> {
	debounce?: MaybeValue<number>;
}

export type UseDebouncedRefHistoryReturn<
	Raw,
	Serialized = Raw,
> = UseRefHistoryReturn<Raw, Serialized>;

export interface UseThrottledRefHistoryOptions<Raw, Serialized = Raw>
	extends UseRefHistoryOptions<Raw, Serialized> {
	/**
	 * Milliseconds before another automatic history commit can run.
	 *
	 * @default 200
	 */
	throttle?: MaybeValue<number>;
	/**
	 * Commit the latest pending source value at the end of the throttle window.
	 *
	 * @default true
	 */
	trailing?: boolean;
}

export type UseThrottledRefHistoryReturn<
	Raw,
	Serialized = Raw,
> = UseRefHistoryReturn<Raw, Serialized>;
