import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	ClipboardItemLike,
	ClipboardItemPresentationStyleLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	UseClipboardItemsWindowLike,
} from "../types";
import { useClipboardItems } from "./index";

class FakeClipboardItem implements ClipboardItemLike {
	readonly types: readonly string[];

	constructor(
		readonly label: string,
		type = "text/plain",
		readonly presentationStyle: ClipboardItemPresentationStyleLike = "unspecified",
	) {
		this.types = [type];
	}

	async getType(type: string): Promise<Blob> {
		return new Blob([this.label], { type });
	}
}

class FakeItemsClipboard implements ClipboardLike {
	read = vi.fn(async () => this.items);
	write = vi.fn(async (items: ClipboardItemLike[]) => {
		this.items = items;
	});

	constructor(public items: ClipboardItemLike[] = []) {}
}

class FakeEventItemsClipboard extends EventTarget implements ClipboardLike {
	read = vi.fn(async () => this.items);
	write = vi.fn(async (items: ClipboardItemLike[]) => {
		this.items = items;
	});

	constructor(public items: ClipboardItemLike[] = []) {
		super();
	}
}

class FakeWindow extends EventTarget implements UseClipboardItemsWindowLike {}

function createNavigator(
	clipboard: ClipboardLike | null | undefined,
): ClipboardNavigatorLike {
	return { clipboard };
}

function createItem(label: string): ClipboardItemLike {
	return new FakeClipboardItem(label);
}

function deferred<T = void>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((nextResolve, nextReject) => {
		resolve = nextResolve;
		reject = nextReject;
	});

	return { promise, reject, resolve };
}

describe("useClipboardItems", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses fallback values without clipboard item support", async () => {
		const item = createItem("hello");
		const result = useClipboardItems({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
		expect(result.error.value).toBeNull();

		await result.copy([item]);
		await expect(result.read()).resolves.toBeUndefined();

		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("writes clipboard items with the async Clipboard API", async () => {
		vi.useFakeTimers();
		const item = createItem("hello");
		const clipboard = new FakeItemsClipboard();
		const result = useClipboardItems({
			copiedDuring: 10,
			navigator: createNavigator(clipboard),
		});

		expect(result.isSupported.value).toBe(true);

		await result.copy([item]);

		expect(clipboard.write).toHaveBeenCalledWith([item]);
		expect(result.items.value).toEqual([item]);
		expect(result.copied.value).toBe(true);
		expect(result.error.value).toBeNull();

		vi.advanceTimersByTime(10);

		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("copies from a reactive source when no value is provided", async () => {
		const item = createItem("from-source");
		const source = signal([item] as const);
		const clipboard = new FakeItemsClipboard();
		const result = useClipboardItems({
			source,
			navigator: createNavigator(clipboard),
		});

		await result.copy();

		expect(clipboard.write).toHaveBeenCalledWith([item]);
		expect(result.items.value).toEqual([item]);
		result.stop();
	});

	it("uses explicit undefined as an empty copy value instead of falling back to source", async () => {
		const item = createItem("from-source");
		const clipboard = new FakeItemsClipboard();
		const result = useClipboardItems({
			source: [item],
			navigator: createNavigator(clipboard),
		});

		await result.copy(undefined);

		expect(clipboard.write).not.toHaveBeenCalled();
		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("tracks pending state while writing clipboard items", async () => {
		const item = createItem("async");
		const clipboard = new FakeItemsClipboard();
		const write = deferred<void>();
		clipboard.write.mockImplementationOnce(async (items) => {
			await write.promise;
			clipboard.items = items;
		});
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const promise = result.copy([item]);

		expect(result.isCopying.value).toBe(true);

		write.resolve();
		await promise;

		expect(result.isCopying.value).toBe(false);
		expect(result.items.value).toEqual([item]);
		expect(clipboard.write).toHaveBeenCalledWith([item]);
		result.stop();
	});

	it("keeps pending state when an undefined copy does not start", async () => {
		const item = createItem("async");
		const clipboard = new FakeItemsClipboard();
		const write = deferred<void>();
		clipboard.write.mockImplementationOnce(async (items) => {
			await write.promise;
			clipboard.items = items;
		});
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const promise = result.copy([item]);

		expect(result.isCopying.value).toBe(true);

		await result.copy(undefined);

		expect(result.isCopying.value).toBe(true);

		write.resolve();
		await promise;

		expect(result.isCopying.value).toBe(false);
		expect(result.items.value).toEqual([item]);
		result.stop();
	});

	it("keeps the latest async copy result", async () => {
		const firstItem = createItem("first");
		const secondItem = createItem("second");
		const clipboard = new FakeItemsClipboard();
		const first = deferred<void>();
		const second = deferred<void>();
		clipboard.write
			.mockImplementationOnce(async (items) => {
				await first.promise;
				clipboard.items = items;
			})
			.mockImplementationOnce(async (items) => {
				await second.promise;
				clipboard.items = items;
			});
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const firstCopy = result.copy([firstItem]);
		const secondCopy = result.copy([secondItem]);

		first.resolve();
		second.resolve();
		await Promise.all([firstCopy, secondCopy]);

		expect(result.items.value).toEqual([secondItem]);
		expect(clipboard.items).toEqual([secondItem]);
		result.stop();
	});

	it("keeps the newer item state when an older write resolves last", async () => {
		const firstItem = createItem("first");
		const secondItem = createItem("second");
		const clipboard = new FakeItemsClipboard();
		const first = deferred<void>();
		const second = deferred<void>();
		clipboard.write
			.mockImplementationOnce(async (items) => {
				await first.promise;
				clipboard.items = items;
			})
			.mockImplementationOnce(async (items) => {
				await second.promise;
				clipboard.items = items;
			});
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const firstCopy = result.copy([firstItem]);
		const secondCopy = result.copy([secondItem]);

		second.resolve();
		await secondCopy;
		first.resolve();
		await firstCopy;

		expect(result.items.value).toEqual([secondItem]);
		result.stop();
	});

	it("reads clipboard items manually", async () => {
		const item = createItem("current");
		const clipboard = new FakeItemsClipboard([item]);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });

		await expect(result.read()).resolves.toEqual([item]);

		expect(result.items.value).toEqual([item]);
		expect(clipboard.read).toHaveBeenCalledOnce();
		result.stop();
	});

	it("keeps copied items when an older read resolves last", async () => {
		const oldItem = createItem("old");
		const newItem = createItem("new");
		const read = deferred<ClipboardItemLike[]>();
		const clipboard = new FakeItemsClipboard();
		clipboard.read.mockImplementationOnce(async () => read.promise);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const readPromise = result.read();

		await result.copy([newItem]);
		read.resolve([oldItem]);
		await expect(readPromise).resolves.toEqual([oldItem]);

		expect(result.items.value).toEqual([newItem]);
		result.stop();
	});

	it("clears read errors when a pending copy succeeds", async () => {
		const item = createItem("new");
		const write = deferred<void>();
		const clipboard = new FakeItemsClipboard();
		const readError = new Error("read denied");
		clipboard.write.mockImplementationOnce(async (items) => {
			await write.promise;
			clipboard.items = items;
		});
		clipboard.read.mockRejectedValueOnce(readError);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const copyPromise = result.copy([item]);

		await result.read();

		expect(result.error.value).toBe(readError);

		write.resolve();
		await copyPromise;

		expect(result.items.value).toEqual([item]);
		expect(result.error.value).toBeNull();
		result.stop();
	});

	it("reads clipboard items on copy and cut events", async () => {
		const selectedItem = createItem("selected");
		const cutItem = createItem("cut");
		const clipboard = new FakeItemsClipboard([selectedItem]);
		const windowTarget = new FakeWindow();
		const result = useClipboardItems({
			read: true,
			navigator: createNavigator(clipboard),
			window: windowTarget,
		});

		windowTarget.dispatchEvent(new Event("copy"));
		await Promise.resolve();

		expect(result.items.value).toEqual([selectedItem]);

		clipboard.items = [cutItem];
		windowTarget.dispatchEvent(new Event("cut"));
		await Promise.resolve();

		expect(result.items.value).toEqual([cutItem]);
		result.stop();
	});

	it("reads clipboard items on clipboardchange events", async () => {
		const item = createItem("changed");
		const clipboard = new FakeEventItemsClipboard([item]);
		const result = useClipboardItems({
			read: true,
			navigator: createNavigator(clipboard),
		});

		clipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.items.value).toEqual([item]);
		result.stop();
	});

	it("moves clipboardchange listener when navigator changes", async () => {
		const firstItem = createItem("first");
		const secondItem = createItem("second");
		const staleItem = createItem("stale");
		const firstClipboard = new FakeEventItemsClipboard([firstItem]);
		const secondClipboard = new FakeEventItemsClipboard([secondItem]);
		const navigator = signal<ClipboardNavigatorLike>(
			createNavigator(firstClipboard),
		);
		const result = useClipboardItems({
			read: true,
			navigator,
		});

		firstClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.items.value).toEqual([firstItem]);

		navigator.value = createNavigator(secondClipboard);
		firstClipboard.items = [staleItem];
		firstClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.items.value).toEqual([firstItem]);

		secondClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.items.value).toEqual([secondItem]);
		result.stop();
	});

	it("stores errors when native read fails", async () => {
		const clipboard = new FakeItemsClipboard();
		const error = new Error("denied");
		clipboard.read.mockRejectedValueOnce(error);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });

		await expect(result.read()).resolves.toBeUndefined();

		expect(result.error.value).toBe(error);
		expect(result.items.value).toEqual([]);
		result.stop();
	});

	it("ignores pending read results after stop", async () => {
		const lateItem = createItem("late");
		const read = deferred<ClipboardItemLike[]>();
		const clipboard = new FakeItemsClipboard();
		clipboard.read.mockImplementationOnce(async () => read.promise);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const promise = result.read();

		result.stop();
		read.resolve([lateItem]);
		await expect(promise).resolves.toEqual([lateItem]);

		expect(result.items.value).toEqual([]);
	});

	it("stores errors when copy fails", async () => {
		const item = createItem("blocked");
		const clipboard = new FakeItemsClipboard();
		const error = new Error("denied");
		clipboard.write.mockRejectedValueOnce(error);
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });

		await result.copy([item]);

		expect(result.error.value).toBe(error);
		expect(result.copied.value).toBe(false);
		expect(result.items.value).toEqual([]);
		result.stop();
	});

	it("does not provide a legacy fallback for clipboard items", async () => {
		const item = createItem("item");
		const clipboard: ClipboardLike = {
			read: async () => [item],
		};
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });

		expect(result.isSupported.value).toBe(true);

		await result.copy([item]);

		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		expect(result.error.value).toBeNull();
		result.stop();
	});

	it("reacts to navigator support changes", () => {
		const navigator = signal<ClipboardNavigatorLike | null>(
			createNavigator(null),
		);
		const result = useClipboardItems({ navigator });

		expect(result.isSupported.value).toBe(false);

		navigator.value = createNavigator(new FakeItemsClipboard());
		expect(result.isSupported.value).toBe(true);

		navigator.value = null;
		expect(result.isSupported.value).toBe(false);
		result.stop();
	});

	it("ignores pending copy results after stop", async () => {
		const item = createItem("late");
		const write = deferred<void>();
		const clipboard = new FakeItemsClipboard();
		clipboard.write.mockImplementationOnce(async (items) => {
			await write.promise;
			clipboard.items = items;
		});
		const result = useClipboardItems({ navigator: createNavigator(clipboard) });
		const promise = result.copy([item]);

		result.stop();
		write.resolve();
		await promise;

		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
	});

	it("stops reading clipboard events and pending copied reset", async () => {
		vi.useFakeTimers();
		const copiedItem = createItem("copied");
		const eventItem = createItem("event");
		const clipboard = new FakeEventItemsClipboard([eventItem]);
		const windowTarget = new FakeWindow();
		const result = useClipboardItems({
			copiedDuring: 10,
			read: true,
			navigator: createNavigator(clipboard),
			window: windowTarget,
		});

		await result.copy([copiedItem]);
		result.stop();
		windowTarget.dispatchEvent(new Event("copy"));
		clipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();
		vi.advanceTimersByTime(10);

		expect(result.items.value).toEqual([copiedItem]);
		expect(result.copied.value).toBe(true);
	});
});
