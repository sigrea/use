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
	AsyncStorageLike,
	AsyncStorageSerializer,
	StorageWindowLike,
} from "../types";
import { customStorageEventName } from "../useStorage";
import { useStorageAsync } from "./index";

const KEY = "storage-key";
const OTHER_KEY = "other-key";

class FakeAsyncStorage implements AsyncStorageLike {
	readonly data = new Map<string, string>();
	readonly getItemCalls: string[] = [];
	readonly setItemCalls: Array<[string, string]> = [];
	readonly removeItemCalls: string[] = [];

	async getItem(key: string): Promise<string | null> {
		this.getItemCalls.push(key);
		return this.data.get(key) ?? null;
	}

	async setItem(key: string, value: string): Promise<void> {
		this.setItemCalls.push([key, value]);
		this.data.set(key, value);
	}

	async removeItem(key: string): Promise<void> {
		this.removeItemCalls.push(key);
		this.data.delete(key);
	}

	clear(): void {
		this.data.clear();
	}
}

class DeferredStorage extends FakeAsyncStorage {
	readonly pendingReads = new Map<
		string,
		Array<(value: string | null) => void>
	>();

	override getItem(key: string): Promise<string | null> {
		this.getItemCalls.push(key);
		return new Promise((resolve) => {
			const pending = this.pendingReads.get(key) ?? [];
			pending.push(resolve);
			this.pendingReads.set(key, pending);
		});
	}

	resolveRead(key: string, value: string | null): void {
		const pending = this.pendingReads.get(key);
		const resolve = pending?.shift();
		if (resolve === undefined) {
			throw new Error(`No pending read for ${key}`);
		}
		resolve(value);
	}
}

class DeferredWriteStorage extends FakeAsyncStorage {
	readonly pendingWrites: Array<{
		readonly key: string;
		readonly resolve: () => void;
		readonly value: string;
	}> = [];

	override async setItem(key: string, value: string): Promise<void> {
		this.setItemCalls.push([key, value]);
		await new Promise<void>((resolve) => {
			this.pendingWrites.push({ key, resolve, value });
		});
		this.data.set(key, value);
	}

	resolveWrite(): void {
		const pending = this.pendingWrites.shift();
		if (pending === undefined) {
			throw new Error("No pending write");
		}
		pending.resolve();
	}
}

class FakeWindow extends EventTarget implements StorageWindowLike {}

function dispatchStorageSync(
	windowTarget: FakeWindow,
	detail: {
		readonly storageArea: AsyncStorageLike | null;
		readonly key: string | null;
		readonly oldValue: string | null;
		readonly newValue: string | null;
	},
): void {
	windowTarget.dispatchEvent(
		new CustomEvent<typeof detail>(customStorageEventName, {
			detail,
		}),
	);
}

describe("useStorageAsync", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("keeps defaults until the first async read completes", async () => {
		const storage = new FakeAsyncStorage();
		const onReady = vi.fn();
		storage.data.set(KEY, "2");

		const stored = useStorageAsync(KEY, 0, storage, { onReady });

		expect(stored.value).toBe(0);

		const ready = await stored;

		expect(ready.value).toBe(2);
		expect(stored.value).toBe(2);
		expect(onReady).toHaveBeenCalledWith(2);

		stored.stop();
	});

	it("writes defaults when missing and removes values with null or remove()", async () => {
		const storage = new FakeAsyncStorage();
		const stored = useStorageAsync(KEY, "fallback", storage);

		await stored;

		expect(storage.data.get(KEY)).toBe("fallback");

		stored.value = "next";
		await vi.waitFor(() => {
			expect(storage.data.get(KEY)).toBe("next");
		});

		stored.value = null;
		await vi.waitFor(() => {
			expect(storage.data.has(KEY)).toBe(false);
		});

		stored.value = "again";
		await vi.waitFor(() => {
			expect(storage.data.get(KEY)).toBe("again");
		});
		stored.remove();
		await vi.waitFor(() => {
			expect(storage.data.has(KEY)).toBe(false);
		});

		stored.stop();
	});

	it("serializes async writes in assignment order", async () => {
		const storage = new DeferredWriteStorage();
		storage.data.set(KEY, "initial");
		const stored = useStorageAsync(KEY, "fallback", storage);

		await stored;

		stored.value = "first";
		await vi.waitFor(() => {
			expect(storage.pendingWrites).toHaveLength(1);
			expect(storage.pendingWrites[0]?.value).toBe("first");
		});

		stored.value = "second";
		await nextTick();

		expect(storage.pendingWrites).toHaveLength(1);

		storage.resolveWrite();
		await vi.waitFor(() => {
			expect(storage.pendingWrites).toHaveLength(1);
			expect(storage.pendingWrites[0]?.value).toBe("second");
		});

		storage.resolveWrite();
		await vi.waitFor(() => {
			expect(storage.data.get(KEY)).toBe("second");
		});

		stored.stop();
	});

	it("merges defaults and accepts async serializers", async () => {
		const storage = new FakeAsyncStorage();
		storage.data.set(KEY, '{"name":"stored"}');
		const stored = useStorageAsync<{ enabled: boolean; name: string }>(
			KEY,
			{ enabled: true, name: "default" },
			storage,
			{
				mergeDefaults: true,
				serializer: {
					async read(raw) {
						return JSON.parse(raw) as { enabled: boolean; name: string };
					},
					async write(value) {
						return JSON.stringify(value);
					},
				},
			},
		);

		await stored;

		expect(stored.value).toEqual({ enabled: true, name: "stored" });

		stored.stop();
	});

	it("does not let stale async reads overwrite the current key", async () => {
		const storage = new DeferredStorage();
		const key = signal(KEY);
		const stored = useStorageAsync(key, 0, storage);

		key.value = OTHER_KEY;
		await nextTick();

		storage.resolveRead(OTHER_KEY, "2");
		await vi.waitFor(() => {
			expect(stored.value).toBe(2);
		});

		storage.resolveRead(KEY, "1");
		await stored;
		await nextTick();

		expect(stored.value).toBe(2);

		stored.stop();
	});

	it("does not let stale async reads overwrite the current storage", async () => {
		const firstStorage = new DeferredStorage();
		const secondStorage = new DeferredStorage();
		const storageTarget = signal<AsyncStorageLike>(firstStorage);
		const stored = useStorageAsync(KEY, 0, storageTarget);

		storageTarget.value = secondStorage;
		await nextTick();

		secondStorage.resolveRead(KEY, "2");
		await vi.waitFor(() => {
			expect(stored.value).toBe(2);
		});

		firstStorage.resolveRead(KEY, "1");
		await stored;
		await nextTick();

		expect(stored.value).toBe(2);

		stored.stop();
	});

	it("syncs same-document storage changes through custom events", async () => {
		const storage = new FakeAsyncStorage();
		const windowTarget = new FakeWindow();
		const first = useStorageAsync(KEY, 0, storage, { window: windowTarget });
		const second = useStorageAsync(KEY, 0, storage, { window: windowTarget });

		await Promise.all([first, second]);

		first.value = 2;

		await vi.waitFor(() => {
			expect(second.value).toBe(2);
		});

		storage.data.set(KEY, "3");
		dispatchStorageSync(windowTarget, {
			key: KEY,
			newValue: "3",
			oldValue: "2",
			storageArea: storage,
		});

		await vi.waitFor(() => {
			expect(first.value).toBe(3);
			expect(second.value).toBe(3);
		});

		first.stop();
		second.stop();
	});

	it("stops watchers and event listeners", async () => {
		const storage = new FakeAsyncStorage();
		const windowTarget = new FakeWindow();
		const stored = useStorageAsync(KEY, { count: 0 }, storage, {
			window: windowTarget,
		});

		await stored;
		stored.stop();

		if (stored.value !== null) {
			stored.value.count = 2;
		}
		await nextTick();
		expect(storage.data.get(KEY)).toBe('{"count":0}');

		storage.data.set(KEY, '{"count":3}');
		dispatchStorageSync(windowTarget, {
			key: KEY,
			newValue: '{"count":3}',
			oldValue: '{"count":0}',
			storageArea: storage,
		});
		await nextTick();

		expect(stored.value).toEqual({ count: 2 });
	});

	it("keeps the default value until molecule mount with initOnMounted", async () => {
		const storage = new FakeAsyncStorage();
		storage.data.set(KEY, "stored");
		const windowTarget = new FakeWindow();
		const StorageMolecule = molecule(() => ({
			stored: useStorageAsync(KEY, "default", storage, {
				initOnMounted: true,
				window: windowTarget,
			}),
		}));
		const instance = StorageMolecule();
		trackMolecule(instance);

		expect(instance.stored.value).toBe("default");

		mountMolecule(instance);
		await instance.stored;

		expect(instance.stored.value).toBe("stored");

		instance.stored.stop();
	});

	it("resolves await when stopped before an initOnMounted read", async () => {
		const storage = new FakeAsyncStorage();
		const onReady = vi.fn();
		const StoredMolecule = molecule(() => ({
			stored: useStorageAsync(KEY, "default", storage, {
				initOnMounted: true,
				onReady,
			}),
		}));
		const instance = StoredMolecule();
		trackMolecule(instance);

		instance.stored.stop();

		await expect(instance.stored).resolves.toMatchObject({ value: "default" });
		expect(storage.getItemCalls).toEqual([]);
		expect(onReady).not.toHaveBeenCalled();
	});

	it("does not write defaults when an in-flight read finishes after stop", async () => {
		const storage = new DeferredStorage();
		const stored = useStorageAsync(KEY, "fallback", storage);

		expect(stored.value).toBe("fallback");
		expect(storage.getItemCalls).toEqual([KEY]);

		stored.stop();
		await expect(stored).resolves.toMatchObject({ value: "fallback" });

		storage.resolveRead(KEY, null);
		await nextTick();

		expect(storage.setItemCalls).toEqual([]);
		expect(storage.data.has(KEY)).toBe(false);
	});

	it("does not write defaults when default serialization finishes after stop", async () => {
		const storage = new DeferredStorage();
		let markSerializationStarted = () => {};
		let resolveSerialization = () => {};
		const serializationStarted = new Promise<void>((resolve) => {
			markSerializationStarted = resolve;
		});
		const serialization = new Promise<void>((resolve) => {
			resolveSerialization = resolve;
		});
		const serializer: AsyncStorageSerializer<string> = {
			read: (value) => value,
			write: async (value) => {
				markSerializationStarted();
				await serialization;
				return value;
			},
		};
		const stored = useStorageAsync(KEY, "fallback", storage, {
			serializer,
		});

		storage.resolveRead(KEY, null);
		await serializationStarted;

		stored.stop();
		resolveSerialization();
		await expect(stored).resolves.toMatchObject({ value: "fallback" });
		await nextTick();

		expect(storage.setItemCalls).toEqual([]);
		expect(storage.data.has(KEY)).toBe(false);
	});

	it("works without browser storage", async () => {
		const onError = vi.fn();
		const stored = useStorageAsync(KEY, "fallback", undefined, {
			onError,
			window: undefined,
		});

		await stored;

		expect(stored.value).toBe("fallback");

		stored.value = "local-only";
		expect(stored.value).toBe("local-only");
		expect(onError).not.toHaveBeenCalled();

		stored.stop();
	});
});
