import { watch } from "@sigrea/core";
import { defaultWindow, listen, resolveTarget, resolveValue } from "../shared";
import type { UseEventListenerOptions, UseEventListenerReturn } from "./types";
import type {
	MaybeTarget,
	MaybeValue,
	TargetEventMap,
	WindowLike,
} from "./types";

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

function cloneEventListenerOptions(
	options?: boolean | AddEventListenerOptions,
): boolean | AddEventListenerOptions | undefined {
	if (typeof options !== "object" || options === null) {
		return options;
	}

	return { ...options };
}

export function useEventListener<K extends WindowEventName>(
	type: MaybeValue<K>,
	listener: (event: WindowEventMap[K]) => void,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;

export function useEventListener<
	TTarget extends EventTarget,
	K extends EventNameFor<TTarget>,
>(
	target: MaybeTarget<TTarget>,
	type: MaybeValue<K>,
	listener: (event: EventPayloadFor<TTarget, K>) => void,
	options?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	targetOrType: MaybeTarget<T> | MaybeValue<string>,
	typeOrListener: MaybeValue<string> | ((event: Event) => void),
	listenerOrOptions?: ((event: Event) => void) | UseEventListenerOptions,
	maybeOptions?: UseEventListenerOptions,
): UseEventListenerReturn;
export function useEventListener<T extends EventTarget>(
	targetOrType: MaybeTarget<T> | MaybeValue<string>,
	typeOrListener: MaybeValue<string> | ((event: Event) => void),
	listenerOrOptions?: ((event: Event) => void) | UseEventListenerOptions,
	maybeOptions?: UseEventListenerOptions,
): UseEventListenerReturn {
	const hasExplicitListener = typeof listenerOrOptions === "function";
	const hasOmittedTarget =
		typeof typeOrListener === "function" && !hasExplicitListener;
	const target = hasOmittedTarget
		? (defaultWindow as MaybeTarget<WindowLike> | undefined)
		: (targetOrType as MaybeTarget<T>);
	const type = hasOmittedTarget
		? (targetOrType as MaybeValue<string>)
		: (typeOrListener as MaybeValue<string>);
	const listener = hasOmittedTarget
		? typeOrListener
		: hasExplicitListener
			? listenerOrOptions
			: undefined;
	const options = hasOmittedTarget
		? (listenerOrOptions as UseEventListenerOptions | undefined)
		: hasExplicitListener
			? maybeOptions
			: undefined;

	if (listener === undefined) {
		throw new TypeError("useEventListener requires a listener function.");
	}
	const stop = watch(
		() => ({
			options: cloneEventListenerOptions(resolveValue(options)),
			target: resolveTarget<EventTarget>(target as MaybeTarget<EventTarget>),
			type: resolveValue(type),
		}),
		(nextValue, _previousTarget, onCleanup) => {
			const nextTarget = nextValue.target;
			if (nextTarget === undefined || nextTarget === null) {
				return;
			}

			const stopListening = listen(
				nextTarget,
				nextValue.type,
				listener as (event: Event) => void,
				nextValue.options,
			);
			onCleanup(stopListening);
		},
		{ immediate: true, flush: "sync" },
	);

	return { stop };
}
