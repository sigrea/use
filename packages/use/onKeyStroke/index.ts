import { resolveValue } from "../../shared";
import type {
	KeyFilter,
	KeyPredicate,
	KeyStrokeEventName,
	OnKeyStrokeHandler,
	OnKeyStrokeOptions,
	OnKeyStrokeReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

function createKeyPredicate(keyFilter: KeyFilter): KeyPredicate {
	if (typeof keyFilter === "function") {
		return keyFilter;
	}

	if (typeof keyFilter === "string") {
		return (event) => event.key === keyFilter;
	}

	if (Array.isArray(keyFilter)) {
		return (event) => keyFilter.includes(event.key);
	}

	return () => true;
}

function resolveListenerOptions(
	options: OnKeyStrokeOptions,
): AddEventListenerOptions | undefined {
	return options.passive === true ? { passive: true } : undefined;
}

function hasExplicitTarget(options: OnKeyStrokeOptions): boolean {
	return "target" in options && options.target !== undefined;
}

export function onKeyStroke(
	key: KeyFilter,
	handler: OnKeyStrokeHandler,
	options?: OnKeyStrokeOptions,
): OnKeyStrokeReturn;

export function onKeyStroke(
	handler: OnKeyStrokeHandler,
	options?: OnKeyStrokeOptions,
): OnKeyStrokeReturn;

export function onKeyStroke(
	keyOrHandler: KeyFilter | OnKeyStrokeHandler,
	handlerOrOptions?: OnKeyStrokeHandler | OnKeyStrokeOptions,
	maybeOptions: OnKeyStrokeOptions = {},
): OnKeyStrokeReturn {
	let key: KeyFilter;
	let handler: OnKeyStrokeHandler;
	let options: OnKeyStrokeOptions;

	if (typeof handlerOrOptions === "function") {
		key = keyOrHandler as KeyFilter;
		handler = handlerOrOptions;
		options = maybeOptions;
	} else {
		key = true;
		handler = keyOrHandler as OnKeyStrokeHandler;
		options = handlerOrOptions ?? {};
	}

	const eventName = options.eventName ?? "keydown";
	const predicate = createKeyPredicate(key);
	const listener = (event: KeyboardEvent) => {
		if (event.repeat && resolveValue(options.dedupe ?? false)) {
			return;
		}

		if (predicate(event)) {
			handler(event);
		}
	};
	const listenerOptions = resolveListenerOptions(options);
	const subscription = hasExplicitTarget(options)
		? useEventListener(
				options.target,
				eventName,
				listener as (event: Event) => void,
				listenerOptions,
			)
		: useEventListener(eventName, listener, listenerOptions);

	return subscription.stop;
}

export function onKeyDown(
	key: KeyFilter,
	handler: OnKeyStrokeHandler,
	options: Omit<OnKeyStrokeOptions, "eventName"> = {},
): OnKeyStrokeReturn {
	return onKeyStroke(key, handler, { ...options, eventName: "keydown" });
}

export function onKeyPressed(
	key: KeyFilter,
	handler: OnKeyStrokeHandler,
	options: Omit<OnKeyStrokeOptions, "eventName"> = {},
): OnKeyStrokeReturn {
	return onKeyStroke(key, handler, { ...options, eventName: "keypress" });
}

export function onKeyUp(
	key: KeyFilter,
	handler: OnKeyStrokeHandler,
	options: Omit<OnKeyStrokeOptions, "eventName"> = {},
): OnKeyStrokeReturn {
	return onKeyStroke(key, handler, { ...options, eventName: "keyup" });
}
