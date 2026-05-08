import {
	getCurrentScope,
	isDeepSignal,
	isSignal,
	onDispose,
	readonly,
	toRawDeepSignal,
	watch,
} from "@sigrea/core";
import type {
	Computed,
	ReadonlySignal,
	Signal,
	WatchSource,
} from "@sigrea/core";

import { resolveValue } from "../../shared";
import { createSignal } from "../createSignal";
import type { MaybeValue, UseClonedOptions, UseClonedReturn } from "../types";

type StructuredCloneValue<T> = T extends Signal<infer SignalValue>
	? StructuredCloneValue<SignalValue>
	: T extends ReadonlySignal<infer ReadonlyValue>
		? StructuredCloneValue<ReadonlyValue>
		: T extends Computed<infer ComputedValue>
			? StructuredCloneValue<ComputedValue>
			: T;

function cloneJson<T>(value: T): T {
	const serialized = JSON.stringify(value);
	return serialized === undefined
		? (undefined as T)
		: (JSON.parse(serialized) as T);
}

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

function isPlainObject(value: object): boolean {
	return Object.prototype.toString.call(value) === "[object Object]";
}

function createCloneContainer(value: object): unknown {
	if (Array.isArray(value)) {
		return new Array(value.length);
	}
	if (value instanceof Map) {
		return new Map<unknown, unknown>();
	}
	if (value instanceof Set) {
		return new Set<unknown>();
	}
	if (isDeepSignal(value) || isPlainObject(value)) {
		return {};
	}

	return undefined;
}

function fillCloneContainer(
	value: object,
	output: unknown,
	seen: WeakMap<object, unknown>,
): void {
	if (Array.isArray(value) && Array.isArray(output)) {
		for (let index = 0; index < value.length; index += 1) {
			if (Object.prototype.hasOwnProperty.call(value, index)) {
				output[index] = toCloneSource(value[index], seen);
			}
		}
		return;
	}

	if (value instanceof Map && output instanceof Map) {
		for (const [key, entry] of value) {
			output.set(toCloneSource(key, seen), toCloneSource(entry, seen));
		}
		return;
	}

	if (value instanceof Set && output instanceof Set) {
		for (const entry of value) {
			output.add(toCloneSource(entry, seen));
		}
		return;
	}

	if (typeof output === "object" && output !== null) {
		const objectValue = value as Record<PropertyKey, unknown>;
		const outputValue = output as Record<PropertyKey, unknown>;
		for (const key of Object.keys(objectValue)) {
			outputValue[key] = toCloneSource(objectValue[key], seen);
		}
		for (const key of Object.getOwnPropertySymbols(objectValue)) {
			if (Object.prototype.propertyIsEnumerable.call(objectValue, key)) {
				outputValue[key] = toCloneSource(objectValue[key], seen);
			}
		}
	}
}

function toCloneSource<T>(value: T, seen?: WeakMap<object, unknown>): T {
	if (!isObject(value)) {
		return value;
	}

	const nextSeen = seen ?? new WeakMap<object, unknown>();
	if (isSignal(value)) {
		const signalValue = value.value;
		if (isObject(signalValue)) {
			if (nextSeen.has(signalValue)) {
				const output = nextSeen.get(signalValue);
				nextSeen.set(value, output);
				return output as T;
			}
			const rawSignalValue = toRawDeepSignal(signalValue);
			if (isObject(rawSignalValue) && nextSeen.has(rawSignalValue)) {
				const output = nextSeen.get(rawSignalValue);
				nextSeen.set(value, output);
				return output as T;
			}
		}
	}
	if (nextSeen.has(value)) {
		return nextSeen.get(value) as T;
	}
	const rawValue = toRawDeepSignal(value);
	if (isObject(rawValue) && nextSeen.has(rawValue)) {
		const output = nextSeen.get(rawValue);
		nextSeen.set(value, output);
		return output as T;
	}

	if (isSignal(value)) {
		const signalValue = value.value;
		if (!isObject(signalValue)) {
			return signalValue as T;
		}
		if (isSignal(signalValue)) {
			const output = {};
			nextSeen.set(value, output);
			const clonedValue = toCloneSource(signalValue, nextSeen);
			if (clonedValue !== output) {
				nextSeen.set(value, clonedValue);
			}
			return clonedValue as T;
		}
		if (nextSeen.has(signalValue)) {
			const output = nextSeen.get(signalValue);
			nextSeen.set(value, output);
			return output as T;
		}
		const output = createCloneContainer(signalValue);
		if (output === undefined) {
			nextSeen.set(value, signalValue);
			return signalValue as T;
		}
		nextSeen.set(value, output);
		nextSeen.set(signalValue, output);
		fillCloneContainer(signalValue, output, nextSeen);
		return output as T;
	}

	const output = createCloneContainer(value);
	if (output !== undefined) {
		nextSeen.set(value, output);
		if (isObject(rawValue)) {
			nextSeen.set(rawValue, output);
		}
		fillCloneContainer(value, output, nextSeen);
		return output as T;
	}

	return value;
}

export function cloneStructured<T>(value: T): StructuredCloneValue<T> {
	const rawValue = toCloneSource(value);
	if (typeof globalThis.structuredClone === "function") {
		return globalThis.structuredClone(rawValue) as StructuredCloneValue<T>;
	}

	return cloneJson(rawValue) as StructuredCloneValue<T>;
}

function readSource<T>(source: MaybeValue<T>): T {
	return resolveValue(source);
}

/**
 * Creates an editable cloned signal from a source value.
 */
export function useCloned<Source, Cloned = Source>(
	source: MaybeValue<Source>,
	options: UseClonedOptions<Source, Cloned> = {},
): UseClonedReturn<Cloned> {
	const {
		clone = cloneStructured as (value: Source) => Cloned,
		deep = true,
		flush = "sync",
		manual = false,
		onTrack,
		onTrigger,
	} = options;
	const cloned = createSignal(clone(readSource(source)), true);
	const isModified = createSignal(false);
	let syncing = false;
	let stopped = false;

	function sync(): void {
		const nextValue = clone(readSource(source));
		syncing = true;
		try {
			cloned.value = nextValue;
			isModified.value = false;
		} finally {
			syncing = false;
		}
	}

	const stopClonedWatch = watch(
		cloned,
		() => {
			if (!syncing && !stopped) {
				isModified.value = true;
			}
		},
		{ deep: true, flush: "sync" },
	);

	const stopSourceWatch =
		!manual &&
		(isSignal(source) || isDeepSignal(source) || typeof source === "function")
			? watch(source as WatchSource<Source>, sync, {
					deep,
					flush,
					onTrack,
					onTrigger,
				})
			: undefined;

	function stop(): void {
		if (stopped) {
			return;
		}

		stopped = true;
		stopSourceWatch?.();
		stopClonedWatch();
	}

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return {
		cloned,
		isModified: readonly(isModified),
		sync,
		stop,
	};
}
