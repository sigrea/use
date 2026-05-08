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
	AsyncStorageLike,
	AsyncStorageSerializer,
	MaybeTarget,
	MaybeValue,
	RemovableSignal,
	StorageLike,
	StorageSerializerType,
	StorageWindowLike,
	UseStorageAsyncOptions,
	UseStorageAsyncReturn,
} from "../types";
import { StorageSerializers, customStorageEventName } from "../useStorage";

interface StorageState<T> {
	value: T | null;
}

interface AsyncStorageEventLike {
	readonly storageArea: AsyncStorageLike | null;
	readonly key: string | null;
	readonly oldValue: string | null;
	readonly newValue: string | null;
}

interface StorageWindowConstructors {
	readonly CustomEvent?: typeof CustomEvent;
	readonly Event?: typeof Event;
	readonly Storage?: typeof Storage;
	readonly StorageEvent?: typeof StorageEvent;
}

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
	storage: AsyncStorageLike,
	windowTarget?: StorageWindowLike,
): storage is Storage {
	const StorageConstructor = resolveStorageConstructor(windowTarget);
	return (
		StorageConstructor !== undefined && storage instanceof StorageConstructor
	);
}

function isAsyncStorageLike(value: unknown): value is AsyncStorageLike {
	return (
		typeof value === "object" &&
		value !== null &&
		typeof (value as AsyncStorageLike).getItem === "function" &&
		typeof (value as AsyncStorageLike).setItem === "function" &&
		typeof (value as AsyncStorageLike).removeItem === "function"
	);
}

function createCustomStorageEvent(
	windowTarget: StorageWindowLike | undefined,
	detail: AsyncStorageEventLike,
): Event {
	const CustomEventConstructor = resolveCustomEventConstructor(windowTarget);
	if (CustomEventConstructor !== undefined) {
		return new CustomEventConstructor<AsyncStorageEventLike>(
			customStorageEventName,
			{
				detail,
			},
		);
	}

	const EventConstructor = resolveEventConstructor(windowTarget);
	const event = new EventConstructor(customStorageEventName) as Event & {
		readonly detail: AsyncStorageEventLike;
	};
	Object.defineProperty(event, "detail", {
		value: detail,
	});
	return event;
}

function dispatchStorageEvent(
	windowTarget: StorageWindowLike | undefined,
	storage: AsyncStorageLike,
	key: string,
	oldValue: string | null,
	newValue: string | null,
): void {
	if (windowTarget === undefined) {
		return;
	}

	const detail: AsyncStorageEventLike = {
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

function resolveStorageEventLike(event: Event): AsyncStorageEventLike {
	if (event.type === customStorageEventName) {
		return (event as CustomEvent<AsyncStorageEventLike>).detail;
	}

	const storageEvent = event as StorageEvent;
	return {
		key: storageEvent.key,
		newValue: storageEvent.newValue,
		oldValue: storageEvent.oldValue,
		storageArea: storageEvent.storageArea as StorageLike | null,
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

export function useStorageAsync(
	key: MaybeValue<string>,
	defaults: MaybeValue<string>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options?: UseStorageAsyncOptions<string>,
): UseStorageAsyncReturn<string>;
export function useStorageAsync(
	key: MaybeValue<string>,
	defaults: MaybeValue<boolean>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options?: UseStorageAsyncOptions<boolean>,
): UseStorageAsyncReturn<boolean>;
export function useStorageAsync(
	key: MaybeValue<string>,
	defaults: MaybeValue<number>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options?: UseStorageAsyncOptions<number>,
): UseStorageAsyncReturn<number>;
export function useStorageAsync<T>(
	key: MaybeValue<string>,
	defaults: MaybeValue<T>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options?: UseStorageAsyncOptions<T>,
): UseStorageAsyncReturn<T>;
export function useStorageAsync<T = unknown>(
	key: MaybeValue<string>,
	defaults: MaybeValue<null>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options?: UseStorageAsyncOptions<T>,
): UseStorageAsyncReturn<T>;
export function useStorageAsync<T>(
	key: MaybeValue<string>,
	defaults: MaybeValue<T>,
	storage?: MaybeValue<AsyncStorageLike | null | undefined>,
	options: UseStorageAsyncOptions<T> = {},
): UseStorageAsyncReturn<T> {
	const {
		deep = true,
		flush = "pre",
		initOnMounted = false,
		listenToStorageChanges = true,
		mergeDefaults = false,
		onError = defaultOnError,
		onReady,
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
		StorageSerializers[serializerType]) as unknown as AsyncStorageSerializer<T>;
	const defaultStorage = () => resolveTarget(windowTarget)?.localStorage;
	const storageTarget = storage ?? defaultStorage;
	const state = (
		shallow
			? shallowDeepSignal({ value: initialDefault as T | null })
			: deepSignal({ value: initialDefault as T | null })
	) as StorageState<T>;
	let pendingLocalRemoveEvent: AsyncStorageEventLike | undefined;
	let readOperationId = 0;
	let ready = false;
	let stopped = false;
	let storageReady = !initOnMounted;
	let suppressStorageWrite = 0;
	let writeQueue = Promise.resolve();

	let resolveReady!: () => void;
	const readyPromise = new Promise<void>((resolve) => {
		resolveReady = resolve;
	});

	const resolveKey = () => resolveValue(key);
	const resolveCurrentWindow = () => resolveTarget(windowTarget);
	const resolveCurrentStorage = () => {
		try {
			const currentStorage = resolveValue(storageTarget);
			return isAsyncStorageLike(currentStorage) ? currentStorage : undefined;
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
	function completeReady(callOnReady = true) {
		if (ready) {
			return;
		}

		ready = true;
		if (callOnReady) {
			try {
				onReady?.(getState());
			} catch (error) {
				onError(error);
			}
		}
		resolveReady();
	}
	const read = async (
		currentStorage: AsyncStorageLike,
		currentKey: string,
		event?: AsyncStorageEventLike,
		shouldWriteDefault?: () => boolean,
	): Promise<T | null> => {
		const rawValue =
			event === undefined || event.newValue === null
				? await currentStorage.getItem(currentKey)
				: event.newValue;
		const defaultValue = resolveDefault() as T;

		if (rawValue === null) {
			if (
				writeDefaults &&
				defaultValue != null &&
				shouldWriteDefault?.() !== false
			) {
				const serializedDefault = await serializer.write(
					toSerializableValue(defaultValue) as T,
				);
				if (shouldWriteDefault?.() !== false) {
					await currentStorage.setItem(currentKey, serializedDefault);
				}
			}

			return defaultValue;
		}

		const value = (await serializer.read(rawValue)) as T;
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
	const write = (value: T | null): Promise<void> => {
		const currentStorage = resolveCurrentStorage();
		if (currentStorage === undefined) {
			return Promise.resolve();
		}

		const operationId = ++readOperationId;
		const currentKey = resolveKey();
		const currentWindow = resolveCurrentWindow();
		const run = async (): Promise<void> => {
			if (stopped) {
				return;
			}

			try {
				const oldValue = await currentStorage.getItem(currentKey);
				if (stopped) {
					return;
				}

				if (value == null) {
					await currentStorage.removeItem(currentKey);
					if (stopped || operationId !== readOperationId) {
						return;
					}

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

				const serialized = await serializer.write(
					toSerializableValue(value) as T,
				);
				if (stopped || oldValue === serialized) {
					return;
				}

				await currentStorage.setItem(currentKey, serialized);
				if (stopped || operationId !== readOperationId) {
					return;
				}

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
		const nextWrite = writeQueue.then(run, run);
		writeQueue = nextWrite.catch(() => {});
		return nextWrite;
	};
	const serializeState = async (value: T | null): Promise<string | null> => {
		return value == null
			? null
			: await serializer.write(toSerializableValue(value) as T);
	};
	const isPendingLocalRemoveEvent = (
		event: AsyncStorageEventLike,
		currentStorage: AsyncStorageLike,
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
	const syncFromStorage = async (
		event?: AsyncStorageEventLike,
		suppressWrite = true,
		notifyReady = false,
	): Promise<void> => {
		if (!storageReady || stopped) {
			if (notifyReady) {
				completeReady();
			}
			return;
		}

		const currentStorage = resolveCurrentStorage();
		if (currentStorage === undefined) {
			if (notifyReady) {
				completeReady();
			}
			return;
		}

		const currentKey = resolveKey();
		if (event !== undefined) {
			if (event.storageArea !== null && event.storageArea !== currentStorage) {
				return;
			}

			if (event.key !== null && event.key !== currentKey) {
				return;
			}
		}

		const operationId = ++readOperationId;

		try {
			if (event !== undefined && event.key === null) {
				const nextValue = resolveDefault() as T;
				if (operationId === readOperationId && !stopped) {
					if (suppressWrite && !Object.is(getState(), nextValue)) {
						suppressNextStorageWrite();
					}
					setState(nextValue);
				}
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
				event.newValue === (await serializeState(getState()))
			) {
				return;
			}

			const nextValue = await read(currentStorage, currentKey, event, () => {
				return (
					operationId === readOperationId &&
					!stopped &&
					currentStorage === resolveCurrentStorage() &&
					currentKey === resolveKey()
				);
			});
			if (
				operationId !== readOperationId ||
				stopped ||
				currentStorage !== resolveCurrentStorage() ||
				currentKey !== resolveKey()
			) {
				return;
			}

			if (suppressWrite && !Object.is(getState(), nextValue)) {
				suppressNextStorageWrite();
			}
			setState(nextValue);
		} catch (error) {
			onError(error);
		} finally {
			if (notifyReady) {
				completeReady();
			}
		}
	};
	const initializeFromStorage = () => {
		storageReady = true;
		void syncFromStorage(undefined, false, true);
	};

	const stopValueWatch = watch(
		() => getState(),
		(value) => {
			if (suppressStorageWrite > 0) {
				suppressStorageWrite -= 1;
				return;
			}

			void write(value);
		},
		{ deep, flush },
	);
	const stopStorageWatch = watch(
		() => ({
			key: resolveKey(),
			storage: resolveCurrentStorage(),
		}),
		() => {
			void syncFromStorage();
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
						void syncFromStorage(resolveStorageEventLike(event));
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
			void write(value);
		},
	}) as unknown as UseStorageAsyncReturn<T>;
	Object.defineProperty(stored, "stop", {
		configurable: true,
		enumerable: false,
		value: () => {
			stopped = true;
			readOperationId += 1;
			stopValueWatch();
			stopStorageWatch();
			stopEventWatch?.();
			completeReady(false);
		},
	});
	const awaitResult = Object.create(stored) as RemovableSignal<T | null>;
	// biome-ignore lint/suspicious/noThenProperty: await should resolve to a non-thenable signal wrapper.
	Object.defineProperty(awaitResult, "then", {
		configurable: true,
		enumerable: false,
		value: undefined,
	});
	// biome-ignore lint/suspicious/noThenProperty: VueUse-compatible await support.
	Object.defineProperty(stored, "then", {
		configurable: true,
		enumerable: false,
		value: <TResult1 = RemovableSignal<T | null>, TResult2 = never>(
			onFulfilled?:
				| ((
						value: RemovableSignal<T | null>,
				  ) => TResult1 | PromiseLike<TResult1>)
				| null,
			onRejected?:
				| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
				| null,
		): PromiseLike<TResult1 | TResult2> => {
			return readyPromise.then(() => {
				if (onFulfilled !== undefined && onFulfilled !== null) {
					return onFulfilled(awaitResult);
				}

				return awaitResult as TResult1;
			}, onRejected);
		},
	});

	if (initOnMounted) {
		try {
			onMount(initializeFromStorage);
		} catch {
			initializeFromStorage();
		}
	} else {
		initializeFromStorage();
	}

	return assignRemove(stored) as UseStorageAsyncReturn<T>;
}
