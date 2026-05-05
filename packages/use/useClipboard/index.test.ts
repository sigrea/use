import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	ClipboardDocumentLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	ClipboardTextareaLike,
	UseClipboardWindowLike,
} from "../types";
import { useClipboard } from "./index";

class FakeClipboard implements ClipboardLike {
	readText = vi.fn(async () => this.text);
	writeText = vi.fn(async (value: string) => {
		this.text = value;
	});

	constructor(public text = "") {}
}

class FakeEventClipboard extends EventTarget implements ClipboardLike {
	readText = vi.fn(async () => this.text);
	writeText = vi.fn(async (value: string) => {
		this.text = value;
	});

	constructor(public text = "") {
		super();
	}
}

class FakeWindow extends EventTarget implements UseClipboardWindowLike {}

class FakeTextarea implements ClipboardTextareaLike {
	value = "";
	readonly style: { opacity?: string; position?: string } = {};
	readonly attributes = new Map<string, string>();
	removed = false;
	selected = false;

	remove(): void {
		this.removed = true;
	}

	select(): void {
		this.selected = true;
	}

	setAttribute(name: string, value: string): void {
		this.attributes.set(name, value);
	}
}

class FakeDocument extends EventTarget implements ClipboardDocumentLike {
	readonly appended: FakeTextarea[] = [];
	readonly body = {
		appendChild: (node: ClipboardTextareaLike) => {
			this.appended.push(node as FakeTextarea);
		},
	};
	execCommand = vi.fn(() => true);

	createElement(tagName: "textarea"): ClipboardTextareaLike {
		if (tagName !== "textarea") {
			throw new Error("unsupported element");
		}

		return new FakeTextarea();
	}
}

function createNavigator(
	clipboard: ClipboardLike | null | undefined,
): ClipboardNavigatorLike {
	return { clipboard };
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

describe("useClipboard", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses fallback values without clipboard support", async () => {
		const result = useClipboard({ navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
		expect(result.error.value).toBeNull();

		await result.copy("hello");

		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("copies text with the async Clipboard API", async () => {
		vi.useFakeTimers();
		const clipboard = new FakeClipboard();
		const result = useClipboard({
			copiedDuring: 10,
			navigator: createNavigator(clipboard),
		});

		expect(result.isSupported.value).toBe(true);

		await result.copy("hello");

		expect(clipboard.writeText).toHaveBeenCalledWith("hello");
		expect(result.text.value).toBe("hello");
		expect(result.copied.value).toBe(true);
		expect(result.error.value).toBeNull();

		vi.advanceTimersByTime(10);

		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("copies from a reactive source when no value is provided", async () => {
		const source = signal("from-source");
		const clipboard = new FakeClipboard();
		const result = useClipboard({
			source,
			navigator: createNavigator(clipboard),
		});

		await result.copy();

		expect(clipboard.writeText).toHaveBeenCalledWith("from-source");
		expect(result.text.value).toBe("from-source");
		result.stop();
	});

	it("uses explicit null as an empty copy value instead of falling back to source", async () => {
		const clipboard = new FakeClipboard();
		const result = useClipboard({
			source: "from-source",
			navigator: createNavigator(clipboard),
		});

		await result.copy(null);

		expect(clipboard.writeText).not.toHaveBeenCalled();
		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("does not accept async text providers at runtime", async () => {
		const clipboard = new FakeClipboard();
		const result = useClipboard({ navigator: createNavigator(clipboard) });

		await result.copy((async () => "async text") as never);

		expect(clipboard.writeText).not.toHaveBeenCalled();
		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("tracks pending state while writing clipboard text", async () => {
		const clipboard = new FakeClipboard();
		const write = deferred<void>();
		clipboard.writeText.mockImplementationOnce(async (value) => {
			clipboard.text = value;
			await write.promise;
		});
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const promise = result.copy("async text");

		expect(result.isCopying.value).toBe(true);

		write.resolve();
		await promise;

		expect(result.isCopying.value).toBe(false);
		expect(result.text.value).toBe("async text");
		expect(clipboard.writeText).toHaveBeenCalledWith("async text");
		result.stop();
	});

	it("keeps pending state when an undefined copy does not start", async () => {
		const clipboard = new FakeClipboard();
		const write = deferred<void>();
		clipboard.writeText.mockImplementationOnce(async (value) => {
			clipboard.text = value;
			await write.promise;
		});
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const promise = result.copy("async text");

		expect(result.isCopying.value).toBe(true);

		await result.copy(undefined);

		expect(result.isCopying.value).toBe(true);

		write.resolve();
		await promise;

		expect(result.isCopying.value).toBe(false);
		expect(result.text.value).toBe("async text");
		result.stop();
	});

	it("keeps the latest async copy result", async () => {
		const clipboard = new FakeClipboard();
		const first = deferred<void>();
		const second = deferred<void>();
		clipboard.writeText
			.mockImplementationOnce(async (value) => {
				await first.promise;
				clipboard.text = value;
			})
			.mockImplementationOnce(async (value) => {
				await second.promise;
				clipboard.text = value;
			});
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const firstCopy = result.copy("first");
		const secondCopy = result.copy("second");

		first.resolve();
		second.resolve();
		await Promise.all([firstCopy, secondCopy]);

		expect(result.text.value).toBe("second");
		expect(clipboard.text).toBe("second");
		result.stop();
	});

	it("keeps the newer copy result when an older write resolves last", async () => {
		const clipboard = new FakeClipboard();
		const first = deferred<void>();
		const second = deferred<void>();
		clipboard.writeText
			.mockImplementationOnce(async (value) => {
				clipboard.text = value;
				await first.promise;
			})
			.mockImplementationOnce(async (value) => {
				clipboard.text = value;
				await second.promise;
			});
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const firstCopy = result.copy("first");
		const secondCopy = result.copy("second");

		second.resolve();
		await secondCopy;
		first.resolve();
		await firstCopy;

		expect(result.text.value).toBe("second");
		result.stop();
	});

	it("reads clipboard text manually", async () => {
		const clipboard = new FakeClipboard("current");
		const result = useClipboard({ navigator: createNavigator(clipboard) });

		await expect(result.read()).resolves.toBe("current");

		expect(result.text.value).toBe("current");
		expect(clipboard.readText).toHaveBeenCalledOnce();
		result.stop();
	});

	it("keeps copied text when an older read resolves last", async () => {
		const read = deferred<string>();
		const clipboard = new FakeClipboard();
		clipboard.readText.mockImplementationOnce(async () => read.promise);
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const readPromise = result.read();

		await result.copy("new");
		read.resolve("old");
		await expect(readPromise).resolves.toBe("old");

		expect(result.text.value).toBe("new");
		result.stop();
	});

	it("clears read errors when a pending copy succeeds", async () => {
		const write = deferred<void>();
		const clipboard = new FakeClipboard();
		const readError = new Error("read denied");
		clipboard.writeText.mockImplementationOnce(async (value) => {
			clipboard.text = value;
			await write.promise;
		});
		clipboard.readText.mockRejectedValueOnce(readError);
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const copyPromise = result.copy("new");

		await result.read();

		expect(result.error.value).toBe(readError);

		write.resolve();
		await copyPromise;

		expect(result.text.value).toBe("new");
		expect(result.error.value).toBeNull();
		result.stop();
	});

	it("reads clipboard text on copy and cut events", async () => {
		const clipboard = new FakeClipboard("selected");
		const windowTarget = new FakeWindow();
		const result = useClipboard({
			read: true,
			navigator: createNavigator(clipboard),
			window: windowTarget,
		});

		windowTarget.dispatchEvent(new Event("copy"));
		await Promise.resolve();

		expect(result.text.value).toBe("selected");

		clipboard.text = "cut";
		windowTarget.dispatchEvent(new Event("cut"));
		await Promise.resolve();

		expect(result.text.value).toBe("cut");
		result.stop();
	});

	it("reads clipboard text on clipboardchange events", async () => {
		const clipboard = new FakeEventClipboard("changed");
		const result = useClipboard({
			read: true,
			navigator: createNavigator(clipboard),
		});

		clipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.text.value).toBe("changed");
		result.stop();
	});

	it("moves clipboardchange listener when navigator changes", async () => {
		const firstClipboard = new FakeEventClipboard("first");
		const secondClipboard = new FakeEventClipboard("second");
		const navigator = signal<ClipboardNavigatorLike>(
			createNavigator(firstClipboard),
		);
		const result = useClipboard({
			read: true,
			navigator,
		});

		firstClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.text.value).toBe("first");

		navigator.value = createNavigator(secondClipboard);
		firstClipboard.text = "stale";
		firstClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.text.value).toBe("first");

		secondClipboard.dispatchEvent(new Event("clipboardchange"));
		await Promise.resolve();

		expect(result.text.value).toBe("second");
		result.stop();
	});

	it("falls back to legacy copy when requested", async () => {
		const document = new FakeDocument();
		const result = useClipboard({
			document,
			legacy: true,
			navigator: createNavigator(null),
		});

		expect(result.isSupported.value).toBe(true);

		await result.copy("legacy");

		expect(document.execCommand).toHaveBeenCalledWith("copy");
		expect(document.appended[0]?.value).toBe("legacy");
		expect(document.appended[0]?.selected).toBe(true);
		expect(document.appended[0]?.removed).toBe(true);
		expect(result.text.value).toBe("legacy");
		expect(result.copied.value).toBe(true);
		result.stop();
	});

	it("falls back to legacy copy when native write fails", async () => {
		const clipboard = new FakeClipboard();
		clipboard.writeText.mockRejectedValueOnce(new Error("denied"));
		const document = new FakeDocument();
		const result = useClipboard({
			document,
			legacy: true,
			navigator: createNavigator(clipboard),
		});

		await result.copy("legacy");

		expect(document.execCommand).toHaveBeenCalledWith("copy");
		expect(document.appended[0]?.value).toBe("legacy");
		expect(result.text.value).toBe("legacy");
		expect(result.copied.value).toBe(true);
		expect(result.error.value).toBeNull();
		result.stop();
	});

	it("does not run stale legacy fallback after a newer copy starts", async () => {
		const clipboard = new FakeClipboard();
		const first = deferred<void>();
		clipboard.writeText
			.mockImplementationOnce(async () => {
				await first.promise;
				throw new Error("denied");
			})
			.mockImplementationOnce(async (value) => {
				clipboard.text = value;
			});
		const document = new FakeDocument();
		const result = useClipboard({
			document,
			legacy: true,
			navigator: createNavigator(clipboard),
		});
		const firstCopy = result.copy("old");

		await result.copy("new");
		first.resolve();
		await firstCopy;

		expect(document.execCommand).not.toHaveBeenCalled();
		expect(result.text.value).toBe("new");
		expect(result.error.value).toBeNull();
		result.stop();
	});

	it("stores errors when native read fails", async () => {
		const clipboard = new FakeClipboard();
		const error = new Error("denied");
		clipboard.readText.mockRejectedValueOnce(error);
		const document = new FakeDocument();
		const result = useClipboard({
			document,
			legacy: true,
			navigator: createNavigator(clipboard),
		});

		await expect(result.read()).resolves.toBeUndefined();

		expect(result.error.value).toBe(error);
		expect(result.text.value).toBe("");
		result.stop();
	});

	it("ignores pending read results after stop", async () => {
		const read = deferred<string>();
		const clipboard = new FakeClipboard();
		clipboard.readText.mockImplementationOnce(async () => read.promise);
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const promise = result.read();

		result.stop();
		read.resolve("late");
		await expect(promise).resolves.toBe("late");

		expect(result.text.value).toBe("");
	});

	it("ignores pending copy results after stop", async () => {
		const write = deferred<void>();
		const clipboard = new FakeClipboard();
		clipboard.writeText.mockImplementationOnce(async (value) => {
			clipboard.text = value;
			await write.promise;
		});
		const result = useClipboard({ navigator: createNavigator(clipboard) });
		const promise = result.copy("late");

		result.stop();
		write.resolve();
		await promise;

		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
	});

	it("stores errors when copy fails without fallback", async () => {
		const clipboard = new FakeClipboard();
		const error = new Error("denied");
		clipboard.writeText.mockRejectedValueOnce(error);
		const result = useClipboard({ navigator: createNavigator(clipboard) });

		await result.copy("blocked");

		expect(result.error.value).toBe(error);
		expect(result.copied.value).toBe(false);
		expect(result.text.value).toBe("");
		result.stop();
	});

	it("reacts to navigator support changes", () => {
		const navigator = signal<ClipboardNavigatorLike | null>(
			createNavigator(null),
		);
		const result = useClipboard({ navigator });

		expect(result.isSupported.value).toBe(false);

		navigator.value = createNavigator(new FakeClipboard());
		expect(result.isSupported.value).toBe(true);

		navigator.value = null;
		expect(result.isSupported.value).toBe(false);
		result.stop();
	});

	it("stops reading clipboard events and pending copied reset", async () => {
		vi.useFakeTimers();
		const clipboard = new FakeClipboard("event");
		const windowTarget = new FakeWindow();
		const result = useClipboard({
			copiedDuring: 10,
			read: true,
			navigator: createNavigator(clipboard),
			window: windowTarget,
		});

		await result.copy("copied");
		result.stop();
		windowTarget.dispatchEvent(new Event("copy"));
		await Promise.resolve();
		vi.advanceTimersByTime(10);

		expect(result.text.value).toBe("copied");
		expect(result.copied.value).toBe(true);
	});
});
