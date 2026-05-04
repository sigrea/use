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

export interface ComputedEagerOptions {
	flush?: WatchOptions["flush"];
	onTrack?: WatchOptions["onTrack"];
	onTrigger?: WatchOptions["onTrigger"];
}

export type ComputedEagerReturn<T> = ReadonlySignal<T>;

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

export type EventHookArgs<T = unknown> = IsAny<T> extends true
	? unknown[]
	: IsUnknown<T> extends true
		? unknown[]
		: [T] extends [void]
			? unknown[]
			: [T] extends [readonly unknown[]]
				? [...T]
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
