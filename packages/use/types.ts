import type { ReadonlySignal } from "@sigrea/core";
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

export interface UseIntervalFnOptions {
	immediate?: boolean;
	immediateCallback?: boolean;
}

export interface UseIntervalFnReturn {
	readonly isActive: ReadonlySignal<boolean>;
	pause(): void;
	resume(): void;
}

export type UseEventListenerOptions = MaybeValue<
	boolean | AddEventListenerOptions
>;

export interface UseEventListenerReturn {
	stop(): void;
}

export interface UseMediaQueryOptions<
	TWindow extends MatchMediaWindow = WindowLike & MatchMediaWindow,
> {
	initialValue?: boolean;
	window?: MaybeTarget<TWindow>;
}

export interface UseMediaQueryReturn {
	readonly matches: ReadonlySignal<boolean>;
	stop(): void;
}

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
