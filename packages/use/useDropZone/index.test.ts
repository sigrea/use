import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDropZone } from "./index";

interface TestDataTransferItem {
	readonly kind: DataTransferItem["kind"];
	readonly type: string;
}

function createFile(name: string, type: string): File {
	return new File(["sigrea"], name, { type });
}

function createFileList(files: readonly File[]): FileList {
	const list = [...files] as unknown as FileList;

	Object.defineProperty(list, "item", {
		value: (index: number) => files[index] ?? null,
	});

	return list;
}

function createItemList(
	items: readonly TestDataTransferItem[],
): DataTransferItemList {
	return [...items] as unknown as DataTransferItemList;
}

function createTransfer(options: {
	files?: readonly File[];
	items?: readonly TestDataTransferItem[];
}): DataTransfer {
	const files = options.files ?? [];
	const items =
		options.items ??
		files.map((file) => ({
			kind: "file" as const,
			type: file.type,
		}));

	return {
		dropEffect: "move",
		files: createFileList(files),
		items: createItemList(items),
	} as DataTransfer;
}

function createDragEvent(type: string, transfer: DataTransfer): DragEvent {
	const event = new Event(type, {
		bubbles: true,
		cancelable: true,
	}) as DragEvent;

	Object.defineProperty(event, "dataTransfer", {
		configurable: true,
		value: transfer,
	});

	return event;
}

function dispatchDragEvent(
	target: EventTarget,
	type: string,
	transfer: DataTransfer,
): DragEvent {
	const event = createDragEvent(type, transfer);
	target.dispatchEvent(event);

	return event;
}

describe("useDropZone", () => {
	const originalUserAgent = window.navigator.userAgent;
	const browserWindow = window as Window & { chrome?: unknown };
	const originalChrome = browserWindow.chrome;

	afterEach(() => {
		Object.defineProperty(window.navigator, "userAgent", {
			configurable: true,
			value: originalUserAgent,
		});

		if (originalChrome === undefined) {
			Reflect.deleteProperty(browserWindow, "chrome");
		} else {
			Object.defineProperty(browserWindow, "chrome", {
				configurable: true,
				value: originalChrome,
			});
		}
	});

	function setSafariUserAgent(): void {
		Object.defineProperty(window.navigator, "userAgent", {
			configurable: true,
			value:
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
		});
		Reflect.deleteProperty(browserWindow, "chrome");
	}

	it("uses initial values", () => {
		const element = document.createElement("div");
		const dropZone = useDropZone(element);

		expect(dropZone.files.value).toBeNull();
		expect(dropZone.isOverDropZone.value).toBe(false);

		dropZone.stop();
	});

	it("accepts valid drags and dropped files", () => {
		const element = document.createElement("div");
		const file = createFile("photo.jpg", "image/jpeg");
		const onEnter = vi.fn();
		const onOver = vi.fn();
		const onDrop = vi.fn();
		const dropZone = useDropZone(element, {
			dataTypes: ["image/"],
			onDrop,
			onEnter,
			onOver,
		});

		const enterTransfer = createTransfer({
			items: [{ kind: "file", type: "image/jpeg" }],
		});
		const enterEvent = dispatchDragEvent(element, "dragenter", enterTransfer);

		expect(enterEvent.defaultPrevented).toBe(true);
		expect(enterTransfer.dropEffect).toBe("copy");
		expect(dropZone.isOverDropZone.value).toBe(true);
		expect(onEnter).toHaveBeenCalledWith(null, enterEvent);

		const overTransfer = createTransfer({
			items: [{ kind: "file", type: "image/jpeg" }],
		});
		const overEvent = dispatchDragEvent(element, "dragover", overTransfer);

		expect(overEvent.defaultPrevented).toBe(true);
		expect(overTransfer.dropEffect).toBe("copy");
		expect(onOver).toHaveBeenCalledWith(null, overEvent);

		const dropTransfer = createTransfer({ files: [file] });
		const dropEvent = dispatchDragEvent(element, "drop", dropTransfer);

		expect(dropEvent.defaultPrevented).toBe(true);
		expect(dropTransfer.dropEffect).toBe("copy");
		expect(dropZone.isOverDropZone.value).toBe(false);
		expect(dropZone.files.value).toEqual([file]);
		expect(onDrop).toHaveBeenCalledWith([file], dropEvent);

		dropZone.stop();
	});

	it("keeps hover state while moving across child elements", () => {
		const element = document.createElement("div");
		const dropZone = useDropZone(element);
		const transfer = createTransfer({
			items: [{ kind: "file", type: "image/png" }],
		});

		dispatchDragEvent(element, "dragenter", transfer);
		dispatchDragEvent(element, "dragenter", transfer);
		expect(dropZone.isOverDropZone.value).toBe(true);

		dispatchDragEvent(element, "dragleave", transfer);
		expect(dropZone.isOverDropZone.value).toBe(true);

		dispatchDragEvent(element, "dragleave", transfer);
		expect(dropZone.isOverDropZone.value).toBe(false);

		dropZone.stop();
	});

	it("filters data types from a signal or predicate", () => {
		const element = document.createElement("div");
		const dataTypes = signal<readonly string[]>(["image/"]);
		const signalDropZone = useDropZone(element, { dataTypes });
		const textTransfer = createTransfer({
			items: [{ kind: "file", type: "text/plain" }],
		});
		const invalidEnter = dispatchDragEvent(element, "dragenter", textTransfer);

		expect(invalidEnter.defaultPrevented).toBe(false);
		expect(textTransfer.dropEffect).toBe("none");
		expect(signalDropZone.isOverDropZone.value).toBe(false);

		dataTypes.value = ["text/"];
		const validEnter = dispatchDragEvent(element, "dragenter", textTransfer);

		expect(validEnter.defaultPrevented).toBe(true);
		expect(signalDropZone.isOverDropZone.value).toBe(true);
		signalDropZone.stop();

		const predicateDropZone = useDropZone(element, {
			dataTypes: (types) => types.includes("text/plain"),
		});
		const predicateEnter = dispatchDragEvent(
			element,
			"dragenter",
			textTransfer,
		);

		expect(predicateEnter.defaultPrevented).toBe(true);
		expect(predicateDropZone.isOverDropZone.value).toBe(true);

		predicateDropZone.stop();
	});

	it("uses checkValidity before dataTypes and still applies multiple", () => {
		const element = document.createElement("div");
		const first = createFile("first.txt", "text/plain");
		const second = createFile("second.txt", "text/plain");
		const checkValidity = vi.fn(() => true);
		const onDrop = vi.fn();
		const dropZone = useDropZone(element, {
			checkValidity,
			dataTypes: ["image/"],
			multiple: false,
			onDrop,
		});

		const singleTransfer = createTransfer({ files: [first] });
		dispatchDragEvent(element, "drop", singleTransfer);

		expect(dropZone.files.value).toEqual([first]);
		expect(onDrop).toHaveBeenCalledWith([first], expect.any(Event));
		expect(checkValidity).toHaveBeenCalled();

		const multiTransfer = createTransfer({ files: [first, second] });
		const multiDrop = dispatchDragEvent(element, "drop", multiTransfer);

		expect(multiDrop.defaultPrevented).toBe(false);
		expect(multiTransfer.dropEffect).toBe("none");
		expect(dropZone.files.value).toEqual([first]);
		expect(onDrop).toHaveBeenCalledTimes(1);

		dropZone.stop();
	});

	it("can prevent default handling for rejected drags", () => {
		const element = document.createElement("div");
		const imageOnly = useDropZone(element, { dataTypes: ["image/"] });
		const rejectedTransfer = createTransfer({
			items: [{ kind: "file", type: "text/plain" }],
		});
		const rejectedEnter = dispatchDragEvent(
			element,
			"dragenter",
			rejectedTransfer,
		);

		expect(rejectedEnter.defaultPrevented).toBe(false);
		expect(rejectedTransfer.dropEffect).toBe("none");
		imageOnly.stop();

		const handled = useDropZone(element, {
			dataTypes: ["image/"],
			preventDefaultForUnhandled: true,
		});
		const handledTransfer = createTransfer({
			items: [{ kind: "file", type: "text/plain" }],
		});
		const handledEnter = dispatchDragEvent(
			element,
			"dragenter",
			handledTransfer,
		);

		expect(handledEnter.defaultPrevented).toBe(true);
		expect(handledTransfer.dropEffect).toBe("none");

		handled.stop();
	});

	it("stops listeners and resets state", () => {
		const element = document.createElement("div");
		const file = createFile("photo.jpg", "image/jpeg");
		const onDrop = vi.fn();
		const dropZone = useDropZone(element, onDrop);

		dispatchDragEvent(
			element,
			"dragenter",
			createTransfer({ items: [{ kind: "file", type: "image/jpeg" }] }),
		);
		dispatchDragEvent(element, "drop", createTransfer({ files: [file] }));
		expect(dropZone.files.value).toEqual([file]);

		dropZone.stop();
		expect(dropZone.files.value).toBeNull();
		expect(dropZone.isOverDropZone.value).toBe(false);

		dispatchDragEvent(element, "drop", createTransfer({ files: [file] }));
		expect(onDrop).toHaveBeenCalledTimes(1);
	});

	it("moves listeners when the target changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<HTMLElement | null>(first);
		const dropZone = useDropZone(target);
		const transfer = createTransfer({
			items: [{ kind: "file", type: "image/png" }],
		});

		dispatchDragEvent(first, "dragenter", transfer);
		expect(dropZone.isOverDropZone.value).toBe(true);

		target.value = second;
		expect(dropZone.isOverDropZone.value).toBe(false);

		dispatchDragEvent(first, "dragenter", transfer);
		expect(dropZone.isOverDropZone.value).toBe(false);

		dispatchDragEvent(second, "dragenter", transfer);
		expect(dropZone.isOverDropZone.value).toBe(true);

		dropZone.stop();
	});

	it("passes null when a valid drop has no files", () => {
		const element = document.createElement("div");
		const onDrop = vi.fn();
		const dropZone = useDropZone(element, onDrop);
		const dropEvent = dispatchDragEvent(
			element,
			"drop",
			createTransfer({
				items: [{ kind: "file", type: "image/png" }],
			}),
		);

		expect(dropZone.files.value).toBeNull();
		expect(onDrop).toHaveBeenCalledWith(null, dropEvent);

		dropZone.stop();
	});

	it("defers Safari data type rejection until drop", () => {
		setSafariUserAgent();

		const element = document.createElement("div");
		const onDrop = vi.fn();
		const dropZone = useDropZone(element, {
			dataTypes: ["image/"],
			onDrop,
		});
		const invalidTransfer = createTransfer({
			items: [{ kind: "file", type: "text/plain" }],
		});
		const enterEvent = dispatchDragEvent(element, "dragenter", invalidTransfer);

		expect(enterEvent.defaultPrevented).toBe(true);
		expect(invalidTransfer.dropEffect).toBe("copy");
		expect(dropZone.isOverDropZone.value).toBe(true);

		const dropTransfer = createTransfer({
			files: [createFile("notes.txt", "text/plain")],
		});
		const dropEvent = dispatchDragEvent(element, "drop", dropTransfer);

		expect(dropEvent.defaultPrevented).toBe(true);
		expect(dropTransfer.dropEffect).toBe("none");
		expect(dropZone.isOverDropZone.value).toBe(false);
		expect(dropZone.files.value).toBeNull();
		expect(onDrop).not.toHaveBeenCalled();

		dropZone.stop();
	});
});
