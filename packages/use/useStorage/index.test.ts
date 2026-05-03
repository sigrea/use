import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	nextTick,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	StorageEventLike,
	StorageLike,
	StorageWindowLike,
} from "../types";
import {
	StorageSerializers,
	customStorageEventName,
	useStorage,
} from "./index";

const KEY = "storage-key";
const OTHER_KEY = "other-key";

class FakeStorage implements StorageLike {
	readonly data = new Map<string, string>();
	readonly getItemCalls: string[] = [];
	readonly setItemCalls: Array<[string, string]> = [];
	readonly removeItemCalls: string[] = [];

	getItem(key: string): string | null {
		this.getItemCalls.push(key);
		return this.data.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.setItemCalls.push([key, value]);
		this.data.set(key, value);
	}

	removeItem(key: string): void {
		this.removeItemCalls.push(key);
		this.data.delete(key);
	}

	clear(): void {
		this.data.clear();
	}
}

class FakeWindow extends EventTarget implements StorageWindowLike {
	readonly localStorage = new FakeStorage();
	readonly sessionStorage = new FakeStorage();
}

class TargetCustomEvent<T = unknown> extends Event implements CustomEvent<T> {
	readonly detail: T;

	constructor(type: string, eventInitDict?: CustomEventInit<T>) {
		super(type, eventInitDict);
		this.detail = eventInitDict?.detail as T;
	}

	initCustomEvent(): void {}
}

class TargetStorageEvent extends Event implements StorageEvent {
	readonly key: string | null;
	readonly newValue: string | null;
	readonly oldValue: string | null;
	readonly storageArea: Storage | null;
	readonly url: string;

	constructor(type: string, eventInitDict?: StorageEventInit) {
		super(type, eventInitDict);
		this.key = eventInitDict?.key ?? null;
		this.newValue = eventInitDict?.newValue ?? null;
		this.oldValue = eventInitDict?.oldValue ?? null;
		this.storageArea = eventInitDict?.storageArea ?? null;
		this.url = eventInitDict?.url ?? "";
	}

	initStorageEvent(): void {}
}

class FakeBuiltInStorage extends FakeStorage {}

class FakeBuiltInWindow extends FakeWindow {
	override readonly localStorage = new FakeBuiltInStorage();
	readonly Storage = FakeBuiltInStorage as unknown as typeof Storage;
	readonly StorageEvent = TargetStorageEvent as unknown as typeof StorageEvent;
}

class FakeCustomEventWindow extends FakeWindow {
	readonly CustomEvent = TargetCustomEvent as unknown as typeof CustomEvent;
}

function dispatchStorageSync(
	windowTarget: FakeWindow,
	detail: StorageEventLike,
): void {
	windowTarget.dispatchEvent(
		new CustomEvent<StorageEventLike>(customStorageEventName, {
			detail,
		}),
	);
}

describe("useStorage", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("reads existing storage and writes defaults when missing", () => {
		const storage = new FakeStorage();
		storage.setItem(KEY, "1");

		const existing = useStorage(KEY, 0, storage);
		const missing = useStorage("missing", "fallback", storage);

		expect(existing.value).toBe(1);
		expect(missing.value).toBe("fallback");
		expect(storage.data.get("missing")).toBe("fallback");

		existing.stop();
		missing.stop();
	});

	it("writes assigned values and removes values with null or remove()", () => {
		const storage = new FakeStorage();
		const stored = useStorage(KEY, "initial", storage);

		stored.value = "next";
		expect(storage.data.get(KEY)).toBe("next");

		stored.value = null;
		expect(storage.data.has(KEY)).toBe(false);
		expect(stored.value).toBe(null);

		stored.value = "again";
		stored.remove();
		expect(storage.data.has(KEY)).toBe(false);

		stored.stop();
	});

	it("serializes primitive and collection values like VueUse", () => {
		const storage = new FakeStorage();
		storage.setItem("string", "stored");
		storage.setItem("number", "2.5");
		storage.setItem("boolean", "false");
		storage.setItem("object", '{"name":"stored"}');
		storage.setItem("array", "[1,2]");
		storage.setItem("date", "2000-01-02T00:00:00.000Z");
		storage.setItem("map", '[[1,"one"]]');
		storage.setItem("set", '[1,"two"]');
		storage.setItem("any", "raw");

		const stringValue = useStorage("string", "default", storage);
		const numberValue = useStorage("number", 0, storage);
		const booleanValue = useStorage("boolean", true, storage);
		const objectValue = useStorage("object", { name: "default" }, storage);
		const arrayValue = useStorage("array", [0], storage);
		const dateValue = useStorage(
			"date",
			new Date("2000-01-01T00:00:00.000Z"),
			storage,
		);
		const mapValue = useStorage("map", new Map<number, string>(), storage);
		const setValue = useStorage("set", new Set<number | string>(), storage);
		const anyValue = useStorage("any", null, storage);

		expect(stringValue.value).toBe("stored");
		expect(numberValue.value).toBe(2.5);
		expect(booleanValue.value).toBe(false);
		expect(objectValue.value).toEqual({ name: "stored" });
		expect(arrayValue.value).toEqual([1, 2]);
		expect(dateValue.value).toEqual(new Date("2000-01-02T00:00:00.000Z"));
		expect(mapValue.value).toEqual(new Map([[1, "one"]]));
		expect(setValue.value).toEqual(new Set([1, "two"]));
		expect(anyValue.value).toBe("raw");

		mapValue.value = new Map([[2, "two"]]);
		setValue.value = new Set(["next"]);
		dateValue.value = new Date("2000-01-03T00:00:00.000Z");

		expect(storage.data.get("map")).toBe('[[2,"two"]]');
		expect(storage.data.get("set")).toBe('["next"]');
		expect(storage.data.get("date")).toBe("2000-01-03T00:00:00.000Z");

		stringValue.stop();
		numberValue.stop();
		booleanValue.stop();
		objectValue.stop();
		arrayValue.stop();
		dateValue.stop();
		mapValue.stop();
		setValue.stop();
		anyValue.stop();
	});

	it("uses a custom serializer", () => {
		const storage = new FakeStorage();
		const stored = useStorage(KEY, 0, storage, {
			serializer: {
				read(raw) {
					return Number.parseInt(raw.replace("n:", ""), 10);
				},
				write(value) {
					return `n:${String(value)}`;
				},
			},
		});

		expect(storage.data.get(KEY)).toBe("n:0");

		stored.value = 3;
		expect(storage.data.get(KEY)).toBe("n:3");

		stored.stop();
	});

	it("merges defaults shallowly or with a custom function", () => {
		const storage = new FakeStorage();
		storage.setItem(KEY, '{"name":"stored"}');
		storage.setItem(OTHER_KEY, "[2]");

		const objectValue = useStorage(
			KEY,
			{ enabled: true, name: "default" },
			storage,
			{ mergeDefaults: true },
		);
		const arrayValue = useStorage(OTHER_KEY, [1], storage, {
			mergeDefaults(storageValue, defaults) {
				return [...defaults, ...storageValue];
			},
		});

		expect(objectValue.value).toEqual({ enabled: true, name: "stored" });
		expect(arrayValue.value).toEqual([1, 2]);

		objectValue.stop();
		arrayValue.stop();
	});

	it("updates storage when a nested object changes", async () => {
		const storage = new FakeStorage();
		const stored = useStorage(KEY, { count: 0 }, storage);

		expect(storage.data.get(KEY)).toBe('{"count":0}');

		if (stored.value !== null) {
			stored.value.count = 1;
		}
		await nextTick();

		expect(storage.data.get(KEY)).toBe('{"count":1}');

		stored.stop();
	});

	it("writes nested changes after object assignments and clear events", async () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const stored = useStorage(KEY, { count: 0 }, storage, {
			window: windowTarget,
		});

		stored.value = { count: 2 };
		await nextTick();
		expect(storage.data.get(KEY)).toBe('{"count":2}');

		if (stored.value !== null) {
			stored.value.count = 3;
		}
		await nextTick();
		expect(storage.data.get(KEY)).toBe('{"count":3}');

		storage.clear();
		dispatchStorageSync(windowTarget, {
			key: null,
			newValue: null,
			oldValue: null,
			storageArea: storage,
		});
		await nextTick();

		if (stored.value !== null) {
			stored.value.count = 1;
		}
		await nextTick();
		expect(storage.data.get(KEY)).toBe('{"count":1}');

		stored.stop();
	});

	it("tracks MaybeValue keys and defaults", async () => {
		const storage = new FakeStorage();
		const key = signal(KEY);
		const defaultValue = signal(1);
		storage.setItem(OTHER_KEY, "3");

		const stored = useStorage(key, defaultValue, storage);

		expect(stored.value).toBe(1);
		expect(storage.data.get(KEY)).toBe("1");

		key.value = OTHER_KEY;
		await nextTick();
		expect(stored.value).toBe(3);

		stored.value = 4;
		expect(storage.data.get(KEY)).toBe("1");
		expect(storage.data.get(OTHER_KEY)).toBe("4");

		key.value = "third-key";
		defaultValue.value = 5;
		await nextTick();
		expect(stored.value).toBe(5);
		expect(storage.data.get("third-key")).toBe("5");

		stored.stop();
	});

	it("retargets storage when the storage source changes", async () => {
		const firstStorage = new FakeStorage();
		const secondStorage = new FakeStorage();
		const storageTarget = signal<StorageLike>(firstStorage);
		secondStorage.setItem(KEY, "2");
		const stored = useStorage(KEY, 0, storageTarget);

		expect(stored.value).toBe(0);
		expect(firstStorage.data.get(KEY)).toBe("0");

		storageTarget.value = secondStorage;
		await nextTick();

		expect(stored.value).toBe(2);

		stored.value = 3;

		expect(firstStorage.data.get(KEY)).toBe("0");
		expect(secondStorage.data.get(KEY)).toBe("3");

		stored.stop();
	});

	it("syncs same-document storage changes through custom events", () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const first = useStorage(KEY, 0, storage, { window: windowTarget });
		const second = useStorage(KEY, 0, storage, { window: windowTarget });

		first.value = 2;
		expect(second.value).toBe(2);

		storage.setItem(KEY, "3");
		dispatchStorageSync(windowTarget, {
			key: KEY,
			newValue: "3",
			oldValue: "2",
			storageArea: storage,
		});

		expect(first.value).toBe(3);
		expect(second.value).toBe(3);

		dispatchStorageSync(windowTarget, {
			key: OTHER_KEY,
			newValue: "4",
			oldValue: null,
			storageArea: storage,
		});

		expect(first.value).toBe(3);
		expect(second.value).toBe(3);

		first.stop();
		second.stop();
	});

	it("keeps the removed instance null and returns other same-document instances to defaults", () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const first = useStorage(KEY, "fallback", storage, {
			window: windowTarget,
			writeDefaults: false,
		});
		const second = useStorage(KEY, "fallback", storage, {
			window: windowTarget,
			writeDefaults: false,
		});

		first.value = null;

		expect(storage.removeItemCalls).toEqual([KEY]);
		expect(first.value).toBe(null);
		expect(second.value).toBe("fallback");
		expect(storage.data.has(KEY)).toBe(false);

		first.stop();
		second.stop();
	});

	it("writes defaults back when a storage event removes the key", () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		storage.setItem(KEY, '"stored"');
		const stored = useStorage(KEY, "fallback", storage, {
			window: windowTarget,
		});

		storage.removeItem(KEY);
		dispatchStorageSync(windowTarget, {
			key: KEY,
			newValue: null,
			oldValue: '"stored"',
			storageArea: storage,
		});

		expect(stored.value).toBe("fallback");
		expect(storage.data.get(KEY)).toBe("fallback");

		stored.stop();
	});

	it("uses the target window CustomEvent constructor for custom storage sync", () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeCustomEventWindow();
		let receivedEvent: Event | undefined;
		windowTarget.addEventListener(customStorageEventName, (event) => {
			receivedEvent = event;
		});
		const stored = useStorage(KEY, 0, storage, { window: windowTarget });

		stored.value = 1;

		expect(receivedEvent).toBeInstanceOf(TargetCustomEvent);

		stored.stop();
	});

	it("uses the target window StorageEvent constructor for built-in storage sync", () => {
		const windowTarget = new FakeBuiltInWindow();
		const storage = windowTarget.localStorage;
		let receivedEvent: Event | undefined;
		windowTarget.addEventListener("storage", (event) => {
			receivedEvent = event;
		});
		const stored = useStorage(KEY, 0, storage, { window: windowTarget });

		stored.value = 1;

		expect(receivedEvent).toBeInstanceOf(TargetStorageEvent);

		stored.stop();
	});

	it("retargets storage event listeners and stops event syncing", async () => {
		const storage = new FakeStorage();
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const windowTarget = signal<StorageWindowLike>(firstWindow);
		const stored = useStorage(KEY, 0, storage, { window: windowTarget });

		storage.setItem(KEY, "1");
		dispatchStorageSync(firstWindow, {
			key: KEY,
			newValue: "1",
			oldValue: "0",
			storageArea: storage,
		});

		expect(stored.value).toBe(1);

		windowTarget.value = secondWindow;
		await nextTick();

		storage.setItem(KEY, "2");
		dispatchStorageSync(firstWindow, {
			key: KEY,
			newValue: "2",
			oldValue: "1",
			storageArea: storage,
		});
		expect(stored.value).toBe(1);

		dispatchStorageSync(secondWindow, {
			key: KEY,
			newValue: "2",
			oldValue: "1",
			storageArea: storage,
		});
		expect(stored.value).toBe(2);

		stored.stop();
		storage.setItem(KEY, "3");
		dispatchStorageSync(secondWindow, {
			key: KEY,
			newValue: "3",
			oldValue: "2",
			storageArea: storage,
		});

		expect(stored.value).toBe(2);
	});

	it("does not write defaults back after storage clear events", async () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const stored = useStorage(KEY, 0, storage, { window: windowTarget });

		stored.value = 2;
		expect(storage.data.get(KEY)).toBe("2");

		storage.clear();
		dispatchStorageSync(windowTarget, {
			key: null,
			newValue: null,
			oldValue: null,
			storageArea: storage,
		});

		expect(stored.value).toBe(0);

		await nextTick();

		expect(storage.data.has(KEY)).toBe(false);

		stored.stop();
	});

	it("returns to defaults on storage clear events when the current value is null", async () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const stored = useStorage(KEY, "fallback", storage, {
			window: windowTarget,
			writeDefaults: false,
		});

		stored.value = null;
		expect(stored.value).toBe(null);

		storage.clear();
		dispatchStorageSync(windowTarget, {
			key: null,
			newValue: null,
			oldValue: null,
			storageArea: storage,
		});

		expect(stored.value).toBe("fallback");

		await nextTick();

		expect(storage.data.has(KEY)).toBe(false);

		stored.stop();
	});

	it("can disable storage event syncing", () => {
		const storage = new FakeStorage();
		const windowTarget = new FakeWindow();
		const stored = useStorage(KEY, 0, storage, {
			listenToStorageChanges: false,
			window: windowTarget,
		});

		storage.setItem(KEY, "2");
		dispatchStorageSync(windowTarget, {
			key: KEY,
			newValue: "2",
			oldValue: "0",
			storageArea: storage,
		});

		expect(stored.value).toBe(0);

		stored.stop();
	});

	it("keeps the default value until molecule mount with initOnMounted", () => {
		const storage = new FakeStorage();
		storage.setItem(KEY, "stored");
		const windowTarget = new FakeWindow();
		const StorageMolecule = molecule(() =>
			useStorage(KEY, "default", storage, {
				initOnMounted: true,
				window: windowTarget,
			}),
		);
		const instance = StorageMolecule();
		trackMolecule(instance);

		expect(instance.value).toBe("default");

		mountMolecule(instance);
		expect(instance.value).toBe("stored");
	});

	it("works without browser storage", () => {
		const onError = vi.fn();
		const stored = useStorage(KEY, "fallback", undefined, {
			onError,
			window: undefined,
		});

		expect(stored.value).toBe("fallback");

		stored.value = "local-only";
		expect(stored.value).toBe("local-only");
		expect(onError).not.toHaveBeenCalled();

		stored.stop();
	});

	it("reports storage and serializer errors through onError", () => {
		const errors: unknown[] = [];
		const storage: StorageLike = {
			getItem: () => null,
			removeItem: () => {},
			setItem: () => {
				throw new Error("write failed");
			},
		};
		const stored = useStorage(KEY, "fallback", storage, {
			onError(error) {
				errors.push(error);
			},
		});

		stored.value = "next";

		expect(errors).toHaveLength(2);
		expect(errors[0]).toEqual(new Error("write failed"));
		expect(errors[1]).toEqual(new Error("write failed"));

		stored.stop();
	});

	it("exports built-in serializers", () => {
		expect(StorageSerializers.boolean.read("true")).toBe(true);
		expect(StorageSerializers.number.read("1.5")).toBe(1.5);
		expect(StorageSerializers.string.read("value")).toBe("value");
	});
});
