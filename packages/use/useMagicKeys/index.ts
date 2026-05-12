import { computed, readonly, signal, watch } from "@sigrea/core";
import type { ReadonlySignal, Signal } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseMagicKeysOptions,
	UseMagicKeysReturn,
	UseMagicKeysWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";
import { DefaultMagicKeysAliasMap } from "./aliasMap";

type KeyEntry = ReadonlySignal<boolean>;

function isKeyboardEvent(event: Event): event is KeyboardEvent {
	return "key" in event;
}

function lower(value: string | undefined): string | undefined {
	return value?.toLowerCase();
}

function hasKey(value: string | undefined): value is string {
	return typeof value === "string" && value.length > 0;
}

function hasModifierState(event: KeyboardEvent): boolean {
	return typeof event.getModifierState === "function";
}

function cloneCurrent(current: Set<string>): ReadonlySet<string> {
	return new Set(current);
}

export function useMagicKeys<
	Reactive extends boolean = false,
	TTarget extends EventTarget = EventTarget,
	TWindow extends UseMagicKeysWindowLike = UseMagicKeysWindowLike,
>(
	options: UseMagicKeysOptions<Reactive, TTarget, TWindow> = {},
): UseMagicKeysReturn<Reactive> {
	const {
		aliasMap = DefaultMagicKeysAliasMap,
		onEventFired = () => {},
		passive = true,
		reactive: useReactive = false,
	} = options;
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const target =
		"target" in options && options.target !== undefined
			? options.target
			: windowTarget;
	const currentKeys = new Set<string>();
	const pressedValues = new Set<string>();
	const current = signal<ReadonlySet<string>>(cloneCurrent(currentKeys));
	const keyStates = new Map<string, Signal<boolean>>();
	const entries = new Map<string, KeyEntry>();
	const metaDeps = new Set<string>();
	const depsMap = new Map<string, Set<string>>([
		["Meta", metaDeps],
		["Shift", new Set<string>()],
		["Alt", new Set<string>()],
	]);
	const usedKeys = new Set<string>();

	function publishCurrent(): void {
		current.value = cloneCurrent(currentKeys);
	}

	function normalizeKey(key: string): string {
		const normalized = key.toLowerCase();
		return (aliasMap[normalized] ?? normalized).toLowerCase();
	}

	function ensureKeyState(key: string): KeyEntry {
		const existing = entries.get(key);
		if (existing !== undefined) {
			return existing;
		}

		const state = signal(pressedValues.has(key));
		const entry = readonly(state);
		keyStates.set(key, state);
		entries.set(key, entry);
		return entry;
	}

	function getKeyValue(key: string): boolean {
		return ensureEntry(key).value;
	}

	function ensureEntry(rawKey: string): KeyEntry {
		const key = normalizeKey(rawKey);
		const existing = entries.get(key);
		if (existing !== undefined) {
			return existing;
		}

		if (/[+_-]/.test(key)) {
			const keys = key.split(/[+_-]/g).map((part) => part.trim());
			const entry = computed(() => {
				let pressed = true;
				for (const key of keys) {
					if (key.length === 0 || !getKeyValue(key)) {
						pressed = false;
					}
				}
				return pressed;
			});
			entries.set(key, entry);
			return entry;
		}

		return ensureKeyState(key);
	}

	function setKeyState(key: string, value: boolean): void {
		const state = keyStates.get(key);
		if (state !== undefined) {
			state.value = value;
		}
	}

	function reset(): void {
		currentKeys.clear();
		pressedValues.clear();
		publishCurrent();
		for (const key of usedKeys) {
			setKeyState(key, false);
		}
	}

	function updateDeps(
		value: boolean,
		event: KeyboardEvent,
		keys: string[],
	): void {
		if (!value || !hasModifierState(event)) {
			return;
		}

		for (const [modifier, deps] of depsMap) {
			if (event.getModifierState(modifier)) {
				for (const key of keys) {
					deps.add(key);
				}
				break;
			}
		}
	}

	function clearDeps(value: boolean, key: string): void {
		if (value || (key !== "shift" && key !== "alt")) {
			return;
		}

		const depsMapKey = `${key[0]?.toUpperCase() ?? ""}${key.slice(1)}`;
		const deps = depsMap.get(depsMapKey);
		if (deps === undefined) {
			return;
		}

		const depsArray = [...deps];
		const depsIndex = depsArray.indexOf(key);
		for (const [index, depKey] of depsArray.entries()) {
			if (index >= depsIndex) {
				currentKeys.delete(depKey);
				pressedValues.delete(depKey);
				setKeyState(depKey, false);
			}
		}
		publishCurrent();
		deps.clear();
	}

	function updateEntries(event: KeyboardEvent, value: boolean): void {
		const key = lower(event.key);
		if (!hasKey(key)) {
			return;
		}

		const code = lower(event.code);
		const values = [code, key].filter(hasKey);
		if (value) {
			currentKeys.add(key);
		} else {
			currentKeys.delete(key);
		}
		publishCurrent();

		for (const nextKey of values) {
			usedKeys.add(nextKey);
			if (value) {
				pressedValues.add(nextKey);
			} else {
				pressedValues.delete(nextKey);
			}
			setKeyState(nextKey, value);
		}

		updateDeps(value, event, [...currentKeys, ...values]);
		clearDeps(value, key);

		if (key === "meta" && !value) {
			for (const depKey of metaDeps) {
				currentKeys.delete(depKey);
				pressedValues.delete(depKey);
				setKeyState(depKey, false);
			}
			publishCurrent();
			metaDeps.clear();
		}
	}

	function handleKeyboardEvent(event: Event, value: boolean): void {
		if (!isKeyboardEvent(event)) {
			return;
		}

		updateEntries(event, value);
		onEventFired(event);
	}

	const keydown = useEventListener(
		target as MaybeTarget<EventTarget | null | undefined>,
		"keydown",
		(event) => handleKeyboardEvent(event, true),
		{ passive },
	);
	const keyup = useEventListener(
		target as MaybeTarget<EventTarget | null | undefined>,
		"keyup",
		(event) => handleKeyboardEvent(event, false),
		{ passive },
	);
	const resetListener = useEventListener(
		windowTarget as MaybeTarget<TWindow | null | undefined>,
		["blur", "focus"],
		reset,
		{ passive },
	);
	const stopTargetWatch = watch(
		() => resolveTarget(target as MaybeTarget<EventTarget | null | undefined>),
		(nextTarget, previousTarget) => {
			if (previousTarget !== undefined && nextTarget !== previousTarget) {
				reset();
			}
		},
		{ flush: "sync" },
	);

	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		keydown.stop();
		keyup.stop();
		resetListener.stop();
		stopTargetWatch();
	};

	tryOnScopeDispose(stop);

	const currentEntry = readonly(current);
	const targetObject = {
		toJSON() {
			return {};
		},
	};
	Object.defineProperty(targetObject, "current", {
		configurable: true,
		enumerable: true,
		get() {
			return useReactive ? currentEntry.value : currentEntry;
		},
	});
	Object.defineProperty(targetObject, "stop", {
		configurable: true,
		enumerable: false,
		value: stop,
	});

	return new Proxy(targetObject as Record<string, unknown>, {
		get(target, prop, receiver) {
			if (typeof prop !== "string") {
				return Reflect.get(target, prop, receiver);
			}

			if (prop in target) {
				return Reflect.get(target, prop, receiver);
			}

			const entry = ensureEntry(prop);
			return useReactive ? entry.value : entry;
		},
	}) as UseMagicKeysReturn<Reactive>;
}

export { DefaultMagicKeysAliasMap };
