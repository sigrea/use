import type { Computed, ReadonlySignal, Signal } from "@sigrea/core";
import { resolveValue as resolveSharedValue } from "../../shared/resolveValue";
import type { MaybeValue } from "../types";

type ResolvedValue<T> = T extends Computed<infer Value>
	? Value
	: T extends Signal<infer Value>
		? Value
		: T extends ReadonlySignal<infer Value>
			? Value
			: T extends () => infer Value
				? Value
				: T;

type ResolveValueSource<T> = T extends (...args: infer Args) => unknown
	? Args extends []
		? T
		: never
	: T;

export function resolveValue<T>(
	source: ResolveValueSource<T>,
): ResolvedValue<T> {
	return resolveSharedValue(
		source as MaybeValue<ResolvedValue<T>>,
	) as ResolvedValue<T>;
}
