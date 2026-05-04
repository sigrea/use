import { getCurrentScope, onDispose } from "@sigrea/core";

import type {
	EventHookCallback,
	EventHookOff,
	EventHookOn,
	EventHookReturn,
	EventHookTrigger,
} from "../types";

export function createEventHook<T = unknown>(): EventHookReturn<T> {
	const fns = new Set<EventHookCallback<T>>();

	const off: EventHookOff<T> = (fn) => {
		fns.delete(fn);
	};

	const clear = () => {
		fns.clear();
	};

	const on: EventHookOn<T> = (fn) => {
		fns.add(fn);
		const offFn = () => off(fn);
		const scope = getCurrentScope();
		if (scope !== undefined) {
			onDispose(offFn, scope);
		}

		return {
			off: offFn,
		};
	};

	const trigger: EventHookTrigger<T> = (...args) => {
		return Promise.all(Array.from(fns).map((fn) => fn(...args)));
	};

	return {
		on,
		off,
		trigger,
		clear,
	};
}
