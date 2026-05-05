import { getCurrentScope, onDispose } from "@sigrea/core";

import type {
	EventBusEvents,
	EventBusIdentifier,
	EventBusListener,
	EventHookArgs,
	UseEventBusReturn,
} from "../types";
import { events } from "./internal";

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

export function useEventBus<T = unknown>(
	key: EventBusIdentifier<T>,
): UseEventBusReturn<T> {
	const reset = () => {
		events.delete(key);
	};

	const off = (listener: EventBusListener<T>) => {
		const listeners = getListeners<T>(key);
		if (listeners === undefined) {
			return;
		}

		listeners.delete(listener);
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
			off(onceListener);
			return listener(...args);
		};

		return on(onceListener);
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
