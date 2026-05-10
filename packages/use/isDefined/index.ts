import type { Computed, ReadonlySignal, Signal } from "@sigrea/core";
import { resolveValue } from "../../shared/resolveValue";

import type { IsDefinedReturn } from "../types";

type Defined<T> = Exclude<T, null | undefined>;

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

type IsReadonlySignalSource<T> = T extends { readonly value: unknown }
	? IsReadonlyKey<T, "value">
	: false;

type DefinedSource<T> = T extends Computed<infer Value>
	? Computed<Defined<Value>>
	: T extends Signal<infer Value>
		? IsReadonlySignalSource<T> extends true
			? ReadonlySignal<Defined<Value>>
			: Signal<Defined<Value>>
		: T extends ReadonlySignal<infer Value>
			? ReadonlySignal<Defined<Value>>
			: Defined<T>;

type IsDefinedSource<T> = T extends (...args: infer Args) => unknown
	? Args extends []
		? T
		: never
	: T;

export function isDefined<T>(
	value: IsDefinedSource<T>,
): value is IsDefinedSource<T> & DefinedSource<IsDefinedSource<T>>;
export function isDefined(value: unknown): IsDefinedReturn {
	return resolveValue(value as never) != null;
}
