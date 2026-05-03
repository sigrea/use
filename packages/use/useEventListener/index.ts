import { watch } from "@sigrea/core";
import { defaultWindow, listen, resolveValue } from "../../shared";
import type { UseEventListenerOptions, UseEventListenerReturn } from "../types";
import type {
	Arrayable,
	MaybeValue,
	TargetEventMap,
	WindowLike,
} from "../types";

type EventNameFor<TTarget extends EventTarget> = Extract<
	keyof TargetEventMap<TTarget>,
	string
>;

type WindowEventName = Extract<keyof WindowEventMap, string>;

type EventPayloadFor<
	TTarget extends EventTarget,
	K extends string,
> = K extends keyof TargetEventMap<TTarget>
	? TargetEventMap<TTarget>[K]
	: Event;

type MaybeArrayTarget<TTarget> = MaybeValue<
	Arrayable<TTarget | null | undefined> | null | undefined
>;
type MaybeArrayEventName<K extends string> = MaybeValue<
	Arrayable<K | null | undefined> | null | undefined
>;

type AnyEventListener = (event: Event) => void;

function toArray<T>(value: Arrayable<T> | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function isPresent<T>(value: T | null | undefined): value is T {
	return value !== undefined && value !== null;
}

function isStringArray(value: unknown): value is Arrayable<string> {
	return (
		typeof value === "string" ||
		(Array.isArray(value) && value.every((item) => typeof item === "string"))
	);
}

function shouldUseOmittedTargetForUnresolvedFirstParam(
	argumentCount: number,
	typeOrListener: unknown,
): boolean {
	if (argumentCount < 3) {
		return true;
	}

	return !isStringArray(typeOrListener);
}

function resolveEventNames(source: MaybeArrayEventName<string>): string[] {
	return toArray(resolveValue(source)).filter(
		(value): value is string => typeof value === "string",
	);
}

function cloneEventListenerOptions(
	options?: boolean | AddEventListenerOptions,
): boolean | AddEventListenerOptions | undefined {
	if (typeof options !== "object" || options === null) {
		return options;
	}

	return { ...options };
}

export function useEventListener<K extends WindowEventName>(
	type: MaybeArrayEventName<K>,
	listener: Arrayable<(event: WindowEventMap[K]) => void>,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<
	TTarget extends EventTarget,
	K extends EventNameFor<TTarget>,
>(
	target: MaybeArrayTarget<TTarget>,
	type: MaybeArrayEventName<K>,
	listener: Arrayable<(event: EventPayloadFor<TTarget, K>) => void>,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	targetOrType: MaybeArrayTarget<T> | MaybeArrayEventName<string>,
	typeOrListener: MaybeArrayEventName<string> | Arrayable<AnyEventListener>,
	listenerOrOptions?: Arrayable<AnyEventListener> | UseEventListenerOptions,
	maybeOptions?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	...args: [
		targetOrType: MaybeArrayTarget<T> | MaybeArrayEventName<string>,
		typeOrListener: MaybeArrayEventName<string> | Arrayable<AnyEventListener>,
		listenerOrOptions?: Arrayable<AnyEventListener> | UseEventListenerOptions,
		maybeOptions?: UseEventListenerOptions,
	]
): UseEventListenerReturn {
	const [targetOrType, typeOrListener, listenerOrOptions, maybeOptions] = args;
	const argumentCount = args.length;
	const stop = watch(
		() => {
			const firstRawValue = resolveValue(
				targetOrType as MaybeValue<
					Arrayable<EventTarget | string | null | undefined> | null | undefined
				>,
			);
			const firstValues = toArray(
				firstRawValue as
					| Arrayable<EventTarget | string | null | undefined>
					| null
					| undefined,
			).filter(isPresent);
			const firstParamTargets =
				firstValues.length > 0 &&
				firstValues.every((value) => typeof value !== "string")
					? (firstValues as EventTarget[])
					: undefined;
			const hasFirstParamTypes =
				firstValues.length > 0 &&
				firstValues.every((value) => typeof value === "string");
			const hasOmittedTarget =
				hasFirstParamTypes ||
				(firstValues.length === 0 &&
					shouldUseOmittedTargetForUnresolvedFirstParam(
						argumentCount,
						typeOrListener,
					));
			const hasExplicitTarget =
				firstParamTargets !== undefined || !hasOmittedTarget;
			const rawTargets = hasExplicitTarget
				? (firstParamTargets ?? [])
				: [defaultWindow].filter(
						(target): target is WindowLike => target !== undefined,
					);
			const rawTypes = hasExplicitTarget ? typeOrListener : targetOrType;
			const rawListeners = hasExplicitTarget
				? listenerOrOptions
				: typeOrListener;
			const rawOptions = hasExplicitTarget ? maybeOptions : listenerOrOptions;
			const listeners = toArray(
				rawListeners as Arrayable<AnyEventListener>,
			).filter((listener): listener is AnyEventListener => {
				return typeof listener === "function";
			});
			const types = resolveEventNames(rawTypes as MaybeArrayEventName<string>);

			return {
				listeners,
				options:
					rawTargets.length > 0 && types.length > 0 && listeners.length > 0
						? cloneEventListenerOptions(
								resolveValue(rawOptions as UseEventListenerOptions | undefined),
							)
						: undefined,
				targets: rawTargets,
				types,
			};
		},
		(nextValue, _previousTarget, onCleanup) => {
			if (
				nextValue.targets.length === 0 ||
				nextValue.types.length === 0 ||
				nextValue.listeners.length === 0
			) {
				return;
			}

			const cleanups: Array<() => void> = [];
			for (const nextTarget of nextValue.targets) {
				for (const nextType of nextValue.types) {
					for (const nextListener of nextValue.listeners) {
						cleanups.push(
							listen(nextTarget, nextType, nextListener, nextValue.options),
						);
					}
				}
			}

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return { stop };
}
