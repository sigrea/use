import { getCurrentScope, onDispose } from "@sigrea/core";

import type {
	CreateEventsReturn,
	EventHookCallback,
	EventsOn,
	EventsRecord,
	EventsSend,
} from "../types";

interface EventsEntry {
	listeners: Map<EventHookCallback, EventsListenerEntry>;
}

interface EventsListenerEntry {
	count: number;
}

export function createEvents<TEvents extends object = never>(
	..._args: [EventsRecord<TEvents>] extends [never] ? [never] : []
): CreateEventsReturn<TEvents> {
	const hooks = new Map<keyof TEvents, EventsEntry>();

	const getEntry = (type: keyof TEvents): EventsEntry => {
		let entry = hooks.get(type);
		if (entry === undefined) {
			entry = {
				listeners: new Map<EventHookCallback, EventsListenerEntry>(),
			};
			hooks.set(type, entry);
		}

		return entry;
	};

	const send = (async (
		...args: [type: keyof TEvents, ...payload: unknown[]]
	) => {
		const [type, ...payload] = args;
		const entry = hooks.get(type);
		if (entry === undefined) {
			return;
		}

		const listeners = Array.from(entry.listeners.keys());
		await Promise.all(
			listeners.map(async (listener) => {
				await listener(...payload);
			}),
		);
	}) as unknown as EventsSend<TEvents>;

	const on = ((...args: [type: keyof TEvents, listener: EventHookCallback]) => {
		const [type, listener] = args;
		const entry = getEntry(type);
		const callback = listener as EventHookCallback;
		let listenerEntry = entry.listeners.get(callback);
		if (listenerEntry === undefined) {
			listenerEntry = {
				count: 0,
			};
			entry.listeners.set(callback, listenerEntry);
		}
		listenerEntry.count += 1;
		let stopped = false;
		let removeScopeCleanup: (() => void) | undefined;
		const stop = () => {
			if (stopped) {
				return;
			}
			stopped = true;
			removeScopeCleanup?.();
			removeScopeCleanup = undefined;
			const current = entry.listeners.get(callback);
			if (current === undefined) {
				return;
			}
			current.count -= 1;
			if (current.count > 0) {
				return;
			}
			entry.listeners.delete(callback);
			if (entry.listeners.size === 0 && hooks.get(type) === entry) {
				hooks.delete(type);
			}
		};
		const scope = getCurrentScope();
		if (scope !== undefined) {
			removeScopeCleanup = onDispose(stop, scope);
		}

		return stop;
	}) as EventsOn<TEvents>;

	return {
		send,
		on,
	} as CreateEventsReturn<TEvents>;
}
