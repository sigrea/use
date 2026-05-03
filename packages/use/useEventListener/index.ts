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

type AnyEventListener = (event: Event) => void;

function toArray<T>(value: Arrayable<T> | null | undefined): T[] {
	if (value === undefined || value === null) {
		return [];
	}

	return Array.isArray(value) ? [...value] : [value as T];
}

function isStringArray(value: unknown): value is Arrayable<string> {
	return (
		typeof value === "string" ||
		(Array.isArray(value) && value.every((item) => typeof item === "string"))
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
	type: MaybeValue<Arrayable<K>>,
	listener: Arrayable<(event: WindowEventMap[K]) => void>,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<
	TTarget extends EventTarget,
	K extends EventNameFor<TTarget>,
>(
	target: MaybeArrayTarget<TTarget>,
	type: MaybeValue<Arrayable<K>>,
	listener: Arrayable<(event: EventPayloadFor<TTarget, K>) => void>,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	targetOrType: MaybeArrayTarget<T> | MaybeValue<Arrayable<string>>,
	typeOrListener: MaybeValue<Arrayable<string>> | Arrayable<AnyEventListener>,
	listenerOrOptions?: Arrayable<AnyEventListener> | UseEventListenerOptions,
	maybeOptions?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	targetOrType: MaybeArrayTarget<T> | MaybeValue<Arrayable<string>>,
	typeOrListener: MaybeValue<Arrayable<string>> | Arrayable<AnyEventListener>,
	listenerOrOptions?: Arrayable<AnyEventListener> | UseEventListenerOptions,
	maybeOptions?: UseEventListenerOptions,
): UseEventListenerReturn {
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
			).filter((value) => value !== undefined && value !== null);
			const firstParamTargets =
				firstValues.length > 0 &&
				firstValues.every((value) => typeof value !== "string")
					? (firstValues as EventTarget[])
					: undefined;
			const hasOmittedTarget = isStringArray(firstRawValue);
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
			const types = toArray(
				resolveValue(rawTypes as MaybeValue<Arrayable<string>>),
			);

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
