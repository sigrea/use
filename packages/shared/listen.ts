import type { WatchStopHandle } from "@sigrea/core";

import type {
	DocumentLike,
	MaybeTarget,
	ResolvedTarget,
	WindowLike,
} from "./types";
import { watchTarget } from "./watchTarget";

export type TargetEventMap<TTarget> = TTarget extends WindowLike
	? WindowEventMap
	: TTarget extends DocumentLike
		? DocumentEventMap
		: TTarget extends MediaQueryList
			? MediaQueryListEventMap
			: TTarget extends ShadowRoot
				? ShadowRootEventMap
				: TTarget extends SVGElement
					? SVGElementEventMap
					: TTarget extends HTMLElement
						? HTMLElementEventMap
						: TTarget extends Element
							? ElementEventMap
							: Record<string, Event>;

type EventNameFor<TTarget> = Extract<
	keyof TargetEventMap<ResolvedTarget<TTarget>>,
	string
>;

type EventPayloadFor<
	TTarget,
	K extends string,
> = K extends keyof TargetEventMap<ResolvedTarget<TTarget>>
	? TargetEventMap<ResolvedTarget<TTarget>>[K]
	: Event;

export function listen<
	TTarget extends EventTarget | null | undefined,
	K extends EventNameFor<TTarget>,
>(
	target: MaybeTarget<TTarget>,
	type: K,
	listener: (event: EventPayloadFor<TTarget, K>) => void,
	options?: boolean | AddEventListenerOptions,
): WatchStopHandle;
export function listen<TTarget extends EventTarget | null | undefined>(
	target: MaybeTarget<TTarget>,
	type: string,
	listener: (event: Event) => void,
	options?: boolean | AddEventListenerOptions,
): WatchStopHandle;
export function listen<TTarget extends EventTarget | null | undefined>(
	target: MaybeTarget<TTarget>,
	type: string,
	listener: (event: Event) => void,
	options?: boolean | AddEventListenerOptions,
): WatchStopHandle {
	return watchTarget(target, (eventTarget) => {
		const eventListener = listener as EventListener;
		eventTarget.addEventListener(type, eventListener, options);

		return () => {
			eventTarget.removeEventListener(type, eventListener, options);
		};
	});
}
