import {
	computed,
	deepSignal,
	onMount,
	shallowDeepSignal,
	toRawDeepSignal,
	watch,
} from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	RemovableSignal,
	StorageEventLike,
	StorageLike,
	StorageSerializer,
	StorageSerializerType,
	StorageWindowLike,
	UseStorageOptions,
} from "../types";

export const customStorageEventName = "sigrea-storage";

interface StorageState<T> {
	value: T | null;
}

interface ArrayStorageSerializer {
	read<T = unknown>(raw: string): T[];
	write(value: readonly unknown[]): string;
}

interface MapStorageSerializer {
	read<K = unknown, V = unknown>(raw: string): Map<K, V>;
	write(value: Map<unknown, unknown>): string;
}

interface ObjectStorageSerializer {
	read<T extends object = Record<string, unknown>>(raw: string): T;
	write(value: object): string;
}

interface SetStorageSerializer {
	read<T = unknown>(raw: string): Set<T>;
	write(value: Set<unknown>): string;
}

interface StorageSerializersMap {
	readonly any: StorageSerializer<string>;
	readonly array: ArrayStorageSerializer;
	readonly boolean: StorageSerializer<boolean>;
	readonly date: StorageSerializer<Date>;
	readonly map: MapStorageSerializer;
	readonly number: StorageSerializer<number>;
	readonly object: ObjectStorageSerializer;
	readonly set: SetStorageSerializer;
	readonly string: StorageSerializer<string>;
}

export const StorageSerializers = {
	any: {
		read: (value: string) => value,
		write: (value: unknown) => String(value),
	},
	array: {
		read: <T = unknown>(value: string) => JSON.parse(value) as T[],
		write: (value: readonly unknown[]) => JSON.stringify(value),
	},
	boolean: {
		read: (value: string) => value === "true",
		write: (value: boolean) => String(value),
	},
	date: {
		read: (value: string) => new Date(value),
		write: (value: Date) => {
			return value.toISOString();
		},
	},
	map: {
		read: <K = unknown, V = unknown>(value: string) =>
			new Map(JSON.parse(value) as Iterable<readonly [K, V]>) as Map<K, V>,
		write: (value: Map<unknown, unknown>) => {
			return JSON.stringify(Array.from(value.entries()));
		},
	},
	number: {
		read: (value: string) => Number.parseFloat(value),
		write: (value: number) => String(value),
	},
	object: {
		read: <T extends object = Record<string, unknown>>(value: string) =>
			JSON.parse(value) as T,
		write: (value: object) => JSON.stringify(value),
	},
	set: {
		read: <T = unknown>(value: string) =>
			new Set(JSON.parse(value) as Iterable<T>),
		write: (value: Set<unknown>) => {
			return JSON.stringify(Array.from(value));
		},
	},
	string: {
		read: (value: string) => value,
		write: (value: string) => String(value),
	},
} satisfies StorageSerializersMap;

function defaultOnError(error: unknown): void {
	console.error(error);
}

function guessSerializerType(value: unknown): StorageSerializerType {
	if (value === null || value === undefined) {
		return "any";
	}
	if (value instanceof Set) {
		return "set";
	}
	if (value instanceof Map) {
		return "map";
	}
	if (value instanceof Date) {
		return "date";
	}
	if (Array.isArray(value)) {
		return "array";
	}
	if (typeof value === "boolean") {
		return "boolean";
	}
	if (typeof value === "string") {
		return "string";
	}
	if (typeof value === "number" && !Number.isNaN(value)) {
		return "number";
	}
	if (typeof value === "object") {
		return "object";
	}

	return "any";
}

function isObjectRecord(value: unknown): value is Record<PropertyKey, unknown> {
	return (
		typeof value === "object" &&
		value !== null &&
		!Array.isArray(value) &&
		!(value instanceof Date) &&
		!(value instanceof Map) &&
		!(value instanceof Set)
	);
}

function toSerializableValue(value: unknown): unknown {
	if (typeof value === "object" && value !== null) {
		return toRawDeepSignal(value);
	}

	return value;
}

interface StorageWindowConstructors {
	readonly CustomEvent?: typeof CustomEvent;
	readonly Event?: typeof Event;
	readonly Storage?: typeof Storage;
	readonly StorageEvent?: typeof StorageEvent;
}

function getStorageWindowConstructors(
	windowTarget: StorageWindowLike | undefined,
): StorageWindowConstructors {
	return (windowTarget ?? {}) as StorageWindowConstructors;
}

function resolveCustomEventConstructor(
	windowTarget: StorageWindowLike | undefined,
): typeof CustomEvent | undefined {
	return (
		getStorageWindowConstructors(windowTarget).CustomEvent ??
		(typeof CustomEvent !== "undefined" ? CustomEvent : undefined)
	);
}

function resolveEventConstructor(
	windowTarget: StorageWindowLike | undefined,
): typeof Event {
	const EventConstructor = getStorageWindowConstructors(windowTarget).Event;
	if (EventConstructor !== undefined) {
		return EventConstructor;
	}

	return Event;
}

function resolveStorageConstructor(
	windowTarget: StorageWindowLike | undefined,
): typeof Storage | undefined {
	return (
		getStorageWindowConstructors(windowTarget).Storage ??
		(typeof Storage !== "undefined" ? Storage : undefined)
	);
}

function resolveStorageEventConstructor(
	windowTarget: StorageWindowLike | undefined,
): typeof StorageEvent | undefined {
	return (
		getStorageWindowConstructors(windowTarget).StorageEvent ??
		(typeof StorageEvent !== "undefined" ? StorageEvent : undefined)
	);
}

function isBuiltInStorage(
	storage: StorageLike,
	windowTarget?: StorageWindowLike,
): storage is Storage {
	const StorageConstructor = resolveStorageConstructor(windowTarget);
	return (
		StorageConstructor !== undefined && storage instanceof StorageConstructor
	);
}

function isStorageLike(value: unknown): value is StorageLike {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as StorageLike).getItem === "function" &&
		typeof (value as StorageLike).setItem === "function" &&
		typeof (value as StorageLike).removeItem === "function"
	);
}

function createCustomStorageEvent(
	windowTarget: StorageWindowLike | undefined,
	detail: StorageEventLike,
): Event {
	const CustomEventConstructor = resolveCustomEventConstructor(windowTarget);
	if (CustomEventConstructor !== undefined) {
		return new CustomEventConstructor<StorageEventLike>(
			customStorageEventName,
			{
				detail,
			},
		);
	}

	const EventConstructor = resolveEventConstructor(windowTarget);
	const event = new EventConstructor(customStorageEventName) as Event & {
		readonly detail: StorageEventLike;
	};
	Object.defineProperty(event, "detail", {
		value: detail,
	});
	return event;
}

function dispatchStorageEvent(
	windowTarget: StorageWindowLike | undefined,
	storage: StorageLike,
	key: string,
	oldValue: string | null,
	newValue: string | null,
): void {
	if (windowTarget === undefined) {
		return;
	}

	const detail: StorageEventLike = {
		key,
		newValue,
		oldValue,
		storageArea: storage,
	};

	const StorageEventConstructor = resolveStorageEventConstructor(windowTarget);
	if (
		isBuiltInStorage(storage, windowTarget) &&
		StorageEventConstructor !== undefined
	) {
		windowTarget.dispatchEvent(
			new StorageEventConstructor("storage", {
				key,
				newValue,
				oldValue,
				storageArea: storage,
			}),
		);
		return;
	}

	windowTarget.dispatchEvent(createCustomStorageEvent(windowTarget, detail));
}

function resolveStorageEventLike(event: Event): StorageEventLike {
	if (event.type === customStorageEventName) {
		return (event as CustomEvent<StorageEventLike>).detail;
	}

	const storageEvent = event as StorageEvent;
	return {
		key: storageEvent.key,
		newValue: storageEvent.newValue,
		oldValue: storageEvent.oldValue,
		storageArea: storageEvent.storageArea,
	};
}

function assignRemove<T>(
	source: RemovableSignal<T | null>,
): RemovableSignal<T | null> {
	Object.defineProperty(source, "remove", {
		configurable: true,
		enumerable: false,
		value: () => {
			source.value = null;
		},
	});

	return source;
}

export function useStorage(
	key: MaybeValue<string>,
	defaults: MaybeValue<string>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options?: UseStorageOptions<string>,
): RemovableSignal<string | null>;
export function useStorage(
	key: MaybeValue<string>,
	defaults: MaybeValue<boolean>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options?: UseStorageOptions<boolean>,
): RemovableSignal<boolean | null>;
export function useStorage(
	key: MaybeValue<string>,
	defaults: MaybeValue<number>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options?: UseStorageOptions<number>,
): RemovableSignal<number | null>;
export function useStorage<T>(
	key: MaybeValue<string>,
	defaults: MaybeValue<T>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options?: UseStorageOptions<T>,
): RemovableSignal<T | null>;
export function useStorage<T = unknown>(
	key: MaybeValue<string>,
	defaults: MaybeValue<null>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options?: UseStorageOptions<T>,
): RemovableSignal<T | null>;
export function useStorage<T>(
	key: MaybeValue<string>,
	defaults: MaybeValue<T>,
	storage?: MaybeValue<StorageLike | null | undefined>,
	options: UseStorageOptions<T> = {},
): RemovableSignal<T | null> {
	const {
		deep = true,
		flush = "pre",
		initOnMounted = false,
		listenToStorageChanges = true,
		mergeDefaults = false,
		onError = defaultOnError,
		shallow = false,
		writeDefaults = true,
	} = options;
	const windowTarget =
		options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<StorageWindowLike> | undefined);
	const initialDefault = resolveValue(defaults);
	const serializerType = guessSerializerType(initialDefault);
	const serializer = (options.serializer ??
		StorageSerializers[serializerType]) as unknown as StorageSerializer<T>;
	const defaultStorage = () => resolveTarget(windowTarget)?.localStorage;
	const storageTarget = storage ?? defaultStorage;
	const state = (
		shallow
			? shallowDeepSignal({ value: initialDefault as T | null })
			: deepSignal({ value: initialDefault as T | null })
	) as StorageState<T>;
	let pendingLocalRemoveEvent: StorageEventLike | undefined;
	let suppressStorageWrite = 0;
	let storageReady = !initOnMounted;

	const resolveKey = () => resolveValue(key);
	const resolveCurrentWindow = () => resolveTarget(windowTarget);
	const resolveCurrentStorage = () => {
		try {
			const currentStorage = resolveValue(storageTarget);
			return isStorageLike(currentStorage) ? currentStorage : undefined;
		} catch (error) {
			onError(error);
			return undefined;
		}
	};
	const resolveDefault = () => resolveValue(defaults);
	const suppressNextStorageWrite = () => {
		suppressStorageWrite += 1;
	};
	const getState = () => state.value;
	const setState = (value: T | null) => {
		state.value = value;
	};
	const read = (
		currentStorage: StorageLike,
		currentKey: string,
		event?: StorageEventLike,
	): T | null => {
		const rawValue =
			event === undefined || event.newValue === null
				? currentStorage.getItem(currentKey)
				: event.newValue;
		const defaultValue = resolveDefault() as T;

		if (rawValue === null) {
			if (writeDefaults && defaultValue != null) {
				currentStorage.setItem(
					currentKey,
					serializer.write(toSerializableValue(defaultValue) as T),
				);
			}

			return defaultValue;
		}

		const value = serializer.read(rawValue) as T;
		if (event !== undefined || !mergeDefaults) {
			return value;
		}

		if (typeof mergeDefaults === "function") {
			return mergeDefaults(value, defaultValue);
		}
		if (
			serializerType === "object" &&
			isObjectRecord(defaultValue) &&
			isObjectRecord(value)
		) {
			return {
				...defaultValue,
				...value,
			} as T;
		}

		return value;
	};
	const write = (value: T | null): void => {
		const currentStorage = resolveCurrentStorage();
		if (currentStorage === undefined) {
			return;
		}

		try {
			const currentKey = resolveKey();
			const currentWindow = resolveCurrentWindow();
			const oldValue = currentStorage.getItem(currentKey);

			if (value == null) {
				currentStorage.removeItem(currentKey);
				pendingLocalRemoveEvent = {
					key: currentKey,
					newValue: null,
					oldValue,
					storageArea: currentStorage,
				};
				try {
					dispatchStorageEvent(
						currentWindow,
						currentStorage,
						currentKey,
						oldValue,
						null,
					);
				} finally {
					pendingLocalRemoveEvent = undefined;
				}
				return;
			}

			const serialized = serializer.write(toSerializableValue(value) as T);
			if (oldValue === serialized) {
				return;
			}

			currentStorage.setItem(currentKey, serialized);
			dispatchStorageEvent(
				currentWindow,
				currentStorage,
				currentKey,
				oldValue,
				serialized,
			);
		} catch (error) {
			onError(error);
		}
	};
	const serializeState = (value: T | null): string | null => {
		return value == null
			? null
			: serializer.write(toSerializableValue(value) as T);
	};
	const isPendingLocalRemoveEvent = (
		event: StorageEventLike,
		currentStorage: StorageLike,
	): boolean => {
		if (
			pendingLocalRemoveEvent === undefined ||
			event.key !== pendingLocalRemoveEvent.key ||
			event.newValue !== null ||
			event.oldValue !== pendingLocalRemoveEvent.oldValue ||
			currentStorage !== pendingLocalRemoveEvent.storageArea
		) {
			return false;
		}

		pendingLocalRemoveEvent = undefined;
		return true;
	};
	const syncFromStorage = (
		event?: StorageEventLike,
		suppressWrite = true,
	): void => {
		if (!storageReady) {
			return;
		}

		const currentStorage = resolveCurrentStorage();
		if (currentStorage === undefined) {
			return;
		}

		if (event !== undefined) {
			if (event.storageArea !== null && event.storageArea !== currentStorage) {
				return;
			}

			if (event.key !== null && event.key !== resolveKey()) {
				return;
			}
		}

		try {
			if (event !== undefined && event.key === null) {
				const nextValue = resolveDefault() as T;
				if (suppressWrite && !Object.is(getState(), nextValue)) {
					suppressNextStorageWrite();
				}
				setState(nextValue);
				return;
			}

			if (
				event !== undefined &&
				isPendingLocalRemoveEvent(event, currentStorage)
			) {
				return;
			}

			if (
				event !== undefined &&
				event.key !== null &&
				event.newValue !== null &&
				event.newValue === serializeState(getState())
			) {
				return;
			}

			const nextValue = read(currentStorage, resolveKey(), event);
			if (suppressWrite && !Object.is(getState(), nextValue)) {
				suppressNextStorageWrite();
			}
			setState(nextValue);
		} catch (error) {
			onError(error);
		}
	};
	const initializeFromStorage = () => {
		storageReady = true;
		syncFromStorage(undefined, false);
	};

	if (initOnMounted) {
		try {
			onMount(initializeFromStorage);
		} catch {
			initializeFromStorage();
		}
	} else {
		initializeFromStorage();
	}

	const stopValueWatch = watch(
		() => getState(),
		(value) => {
			if (suppressStorageWrite > 0) {
				suppressStorageWrite -= 1;
				return;
			}

			write(value);
		},
		{ deep, flush },
	);
	const stopStorageWatch = watch(
		() => ({
			key: resolveKey(),
			storage: resolveCurrentStorage(),
		}),
		() => {
			syncFromStorage();
		},
		{ flush },
	);
	const stopEventWatch = listenToStorageChanges
		? watch(
				() => ({
					storage: resolveCurrentStorage(),
					window: resolveCurrentWindow(),
				}),
				(target, _previousTarget, onCleanup) => {
					if (
						target.storage === undefined ||
						target.window === undefined ||
						!listenToStorageChanges
					) {
						return;
					}

					const eventName = isBuiltInStorage(target.storage, target.window)
						? "storage"
						: customStorageEventName;
					const listener = (event: Event) => {
						syncFromStorage(resolveStorageEventLike(event));
					};

					target.window.addEventListener(eventName, listener);
					onCleanup(() => {
						target.window?.removeEventListener(eventName, listener);
					});
				},
				{ flush: "sync", immediate: true },
			)
		: undefined;
	const stored = computed<T | null>({
		get: getState,
		set: (value) => {
			if (!Object.is(getState(), value)) {
				suppressNextStorageWrite();
			}
			setState(value);
			write(value);
		},
	}) as unknown as RemovableSignal<T | null>;
	Object.defineProperty(stored, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			stopValueWatch();
			stopStorageWatch();
			stopEventWatch?.();
		},
	});

	return assignRemove(stored);
}
