import type { Computed, ReadonlySignal, Signal } from "@sigrea/core";

export type ValueGetter<T> = () => T;
export type Nullish = null | undefined;

export type MaybeValue<T> =
	| T
	| Signal<T>
	| ReadonlySignal<T>
	| Computed<T>
	| ValueGetter<T>;

export type ResolvedTarget<TTarget> = Exclude<TTarget, Nullish>;
export type MaybeTarget<TTarget> = MaybeValue<TTarget | Nullish>;

export interface NavigatorLike {
	readonly language?: string;
	readonly languages?: readonly string[];
	readonly userAgent?: string;
}

export interface WindowLike extends EventTarget {
	readonly document?: DocumentLike;
	readonly navigator?: NavigatorLike;
	matchMedia?(query: string): MediaQueryList;
}

export interface DocumentLike extends EventTarget {
	readonly defaultView?: WindowLike | null;
}

export interface ConfigurableWindow<TWindow = WindowLike> {
	window?: MaybeTarget<TWindow>;
}

export interface ConfigurableDocument<
	TDocument extends DocumentLike = DocumentLike,
> {
	document?: MaybeTarget<TDocument>;
}

export interface ConfigurableNavigator<
	TNavigator extends NavigatorLike = NavigatorLike,
> {
	navigator?: MaybeValue<TNavigator | undefined>;
}
