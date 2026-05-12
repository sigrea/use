import { getCurrentScope, onDispose } from "@sigrea/core";

import type {
	EventBusEvents,
	EventBusIdentifier,
	EventBusListener,
	EventHookArgs,
	UseEventBusReturn,
} from "../types";
import { events } from "./internal";

const onceListeners = new Map<
	EventBusIdentifier,
	WeakMap<EventBusListener, Set<EventBusListener>>
>();

function getListeners<T>(
	key: EventBusIdentifier<T>,
): EventBusEvents<T> | undefined {
	return events.get(key) as EventBusEvents<T> | undefined;
}

function setListeners<T>(
	key: EventBusIdentifier<T>,
	listeners: EventBusEvents<T>,
): void {
	events.set(key, listeners as EventBusEvents);
}

function getOnceListeners<T>(
	key: EventBusIdentifier<T>,
): WeakMap<EventBusListener<T>, Set<EventBusListener<T>>> | undefined {
	return onceListeners.get(key) as
		| WeakMap<EventBusListener<T>, Set<EventBusListener<T>>>
		| undefined;
}

function ensureOnceListeners<T>(
	key: EventBusIdentifier<T>,
): WeakMap<EventBusListener<T>, Set<EventBusListener<T>>> {
	const listeners =
		getOnceListeners<T>(key) ??
		new WeakMap<EventBusListener<T>, Set<EventBusListener<T>>>();
	onceListeners.set(
		key,
		listeners as WeakMap<EventBusListener, Set<EventBusListener>>,
	);
	return listeners;
}

function removeOnceWrapper<T>(
	key: EventBusIdentifier<T>,
	listener: EventBusListener<T>,
	wrapper: EventBusListener<T>,
): void {
	const listeners = getOnceListeners<T>(key);
	const wrappers = listeners?.get(listener);
	if (wrappers === undefined) {
		return;
	}

	wrappers.delete(wrapper);
	if (wrappers.size === 0) {
		listeners?.delete(listener);
	}
}

export function useEventBus<T = unknown>(
	key: EventBusIdentifier<T>,
): UseEventBusReturn<T> {
	const reset = () => {
		events.delete(key);
		onceListeners.delete(key);
	};

	const off = (listener: EventBusListener<T>) => {
		const listeners = getListeners<T>(key);
		if (listeners === undefined) {
			return;
		}

		listeners.delete(listener);
		const onceListenersForKey = getOnceListeners<T>(key);
		const wrappers = onceListenersForKey?.get(listener);
		if (wrappers !== undefined) {
			for (const wrapper of wrappers) {
				listeners.delete(wrapper);
			}
			onceListenersForKey?.delete(listener);
		}

		if (listeners.size === 0) {
			reset();
		}
	};

	const on = (listener: EventBusListener<T>) => {
		const listeners = getListeners<T>(key) ?? new Set<EventBusListener<T>>();
		listeners.add(listener);
		setListeners(key, listeners);

		const offListener = () => {
			off(listener);
		};
		const scope = getCurrentScope();
		if (scope !== undefined) {
			onDispose(offListener, scope);
		}

		return {
			off: offListener,
		};
	};

	const once = (listener: EventBusListener<T>) => {
		const onceListener: EventBusListener<T> = (...args) => {
			removeOnceWrapper(key, listener, onceListener);
			off(onceListener);
			return listener(...args);
		};
		const listeners = ensureOnceListeners<T>(key);
		const wrappers = listeners.get(listener) ?? new Set<EventBusListener<T>>();
		wrappers.add(onceListener);
		listeners.set(listener, wrappers);

		const handle = on(onceListener);

		return {
			off: () => {
				removeOnceWrapper(key, listener, onceListener);
				handle.off();
			},
		};
	};

	const emit = (...args: EventHookArgs<T>) => {
		const listeners = getListeners<T>(key);
		if (listeners === undefined) {
			return Promise.resolve([]);
		}

		const snapshot = Array.from(listeners);
		return Promise.all(snapshot.map((listener) => listener(...args)));
	};

	return {
		on,
		once,
		off,
		emit,
		reset,
	};
}
