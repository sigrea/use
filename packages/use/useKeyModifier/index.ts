import { readonly, signal } from "@sigrea/core";

import { defaultDocument, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseKeyModifier,
	UseKeyModifierDocumentLike,
	UseKeyModifierOptions,
	UseKeyModifierReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

const defaultEvents = ["mousedown", "mouseup", "keydown", "keyup"] as const;

interface ModifierStateEvent extends Event {
	getModifierState(keyArg: string): boolean;
}

function hasModifierState(event: Event): event is ModifierStateEvent {
	return typeof (event as ModifierStateEvent).getModifierState === "function";
}

export function useKeyModifier<
	Initial extends boolean | null = null,
	TDocument extends UseKeyModifierDocumentLike = UseKeyModifierDocumentLike,
>(
	modifier: UseKeyModifier,
	options: UseKeyModifierOptions<Initial, TDocument> = {},
): UseKeyModifierReturn<Initial> {
	const { events = defaultEvents, initial = null } = options;
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const state = signal<boolean | null>(initial);
	const listener = (event: Event) => {
		if (hasModifierState(event)) {
			state.value = event.getModifierState(modifier);
		}
	};
	const reset = () => {
		state.value = false;
	};
	const subscription = useEventListener(
		documentTarget as MaybeTarget<TDocument | null | undefined>,
		events,
		listener,
		{ passive: true },
	);
	const resetSubscription = useEventListener(
		() =>
			resolveTarget(documentTarget as MaybeTarget<TDocument | null | undefined>)
				?.defaultView,
		"blur",
		reset,
		{ passive: true },
	);
	const returned = readonly(state);
	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		subscription.stop();
		resetSubscription.stop();
	};

	tryOnScopeDispose(stop);

	Object.defineProperty(returned, "stop", {
		configurable: true,
		enumerable: false,
		value: stop,
	});

	return returned as UseKeyModifierReturn<Initial>;
}
