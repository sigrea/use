import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseFileDialogInputLike } from "../types";
import { useFileDialog } from "./index";

function createFileList(files: readonly File[]): FileList {
	const list = {
		item: (index: number) => files[index] ?? null,
		length: files.length,
		[Symbol.iterator]: function* () {
			yield* files;
		},
	} as FileList;

	files.forEach((file, index) => {
		Object.defineProperty(list, index, {
			configurable: true,
			value: file,
		});
	});

	return list;
}

class DataTransferMock {
	private readonly fileItems: File[] = [];

	readonly items = {
		add: (file: File) => {
			this.fileItems.push(file);
		},
	};

	get files(): FileList {
		return createFileList(this.fileItems);
	}
}

function fileInput(): UseFileDialogInputLike {
	const input = document.createElement("input") as UseFileDialogInputLike;
	input.click = vi.fn();
	return input;
}

function setFiles(input: HTMLInputElement, files: FileList | null): void {
	Object.defineProperty(input, "files", {
		configurable: true,
		value: files,
	});
}

describe("useFileDialog", () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("initializes files from an array when DataTransfer is available", () => {
		vi.stubGlobal("DataTransfer", DataTransferMock);
		const file = new File(["content"], "file.txt", { type: "text/plain" });
		const dialog = useFileDialog({ initialFiles: [file] });

		expect(dialog.files.value?.[0]).toBe(file);

		dialog.stop();
	});

	it("initializes files from a browser FileList value", () => {
		const input = fileInput();
		input.type = "file";
		const files = input.files;
		const dialog = useFileDialog({ initialFiles: files });

		expect(dialog.files.value).toBe(files);

		dialog.stop();
	});

	it("starts without files when no initial files are provided", () => {
		const dialog = useFileDialog();

		expect(dialog.files.value).toBeNull();

		dialog.stop();
	});

	it("opens a custom input with default options", () => {
		const input = fileInput();
		const dialog = useFileDialog({ input });

		dialog.open();

		expect(input.type).toBe("file");
		expect(input.multiple).toBe(true);
		expect(input.accept).toBe("");
		expect(input.webkitdirectory).toBe(false);
		expect(input.getAttribute("capture")).toBeNull();
		expect(input.click).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("opens an internally created input", () => {
		const input = fileInput();
		const createElement = vi
			.spyOn(document, "createElement")
			.mockReturnValue(input);
		const dialog = useFileDialog();

		dialog.open();

		expect(createElement).toHaveBeenCalledWith("input");
		expect(input.type).toBe("file");
		expect(input.multiple).toBe(true);
		expect(input.accept).toBe("");
		expect(input.webkitdirectory).toBe(false);
		expect(input.getAttribute("capture")).toBeNull();
		expect(input.click).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("applies reactive and local options", () => {
		const input = fileInput();
		const accept = signal("image/*");
		const multiple = signal(true);
		const directory = signal(false);
		const capture = signal<string | undefined>("user");
		const dialog = useFileDialog({
			accept,
			capture,
			directory,
			input,
			multiple,
		});

		expect(input.accept).toBe("image/*");
		expect(input.multiple).toBe(true);
		expect(input.webkitdirectory).toBe(false);
		expect(input.capture).toBe("user");

		accept.value = "video/*";
		multiple.value = false;
		directory.value = true;
		capture.value = "environment";

		expect(input.accept).toBe("video/*");
		expect(input.multiple).toBe(false);
		expect(input.webkitdirectory).toBe(true);
		expect(input.capture).toBe("environment");

		dialog.open({
			accept: "text/plain",
			capture: undefined,
			directory: false,
			multiple: true,
		});

		expect(input.accept).toBe("text/plain");
		expect(input.multiple).toBe(true);
		expect(input.webkitdirectory).toBe(false);
		expect(input.getAttribute("capture")).toBeNull();

		dialog.stop();
	});

	it("updates files and emits change on input change", () => {
		const input = fileInput();
		const file = new File(["content"], "file.txt", { type: "text/plain" });
		const files = createFileList([file]);
		const dialog = useFileDialog({ input });
		const listener = vi.fn();
		dialog.onChange(listener);
		setFiles(input, files);

		input.dispatchEvent(new Event("change"));

		expect(dialog.files.value).toBe(files);
		expect(dialog.files.value?.[0]).toBe(file);
		expect(listener).toHaveBeenCalledWith(files);

		dialog.stop();
	});

	it("emits cancel events", () => {
		const input = fileInput();
		const dialog = useFileDialog({ input });
		const listener = vi.fn();
		dialog.onCancel(listener);

		input.dispatchEvent(new Event("cancel"));

		expect(listener).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("resets files and emits null", () => {
		vi.stubGlobal("DataTransfer", DataTransferMock);
		const input = fileInput();
		const file = new File(["content"], "file.txt");
		const dialog = useFileDialog({ initialFiles: [file], input });
		const listener = vi.fn();
		dialog.onChange(listener);

		dialog.reset();

		expect(dialog.files.value).toBeNull();
		expect(input.value).toBe("");
		expect(listener).toHaveBeenCalledWith(null);

		dialog.stop();
	});

	it("resets before open when reset option is enabled", () => {
		vi.stubGlobal("DataTransfer", DataTransferMock);
		const input = fileInput();
		const file = new File(["content"], "file.txt");
		const dialog = useFileDialog({
			initialFiles: [file],
			input,
			reset: true,
		});
		const listener = vi.fn();
		dialog.onChange(listener);

		dialog.open();

		expect(dialog.files.value).toBeNull();
		expect(listener).toHaveBeenCalledWith(null);
		expect(input.click).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("keeps files before open by default", () => {
		vi.stubGlobal("DataTransfer", DataTransferMock);
		const input = fileInput();
		const file = new File(["content"], "file.txt");
		const dialog = useFileDialog({
			initialFiles: [file],
			input,
		});
		const listener = vi.fn();
		dialog.onChange(listener);

		dialog.open();

		expect(dialog.files.value?.[0]).toBe(file);
		expect(listener).not.toHaveBeenCalledWith(null);
		expect(input.click).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("retargets input listeners", () => {
		const first = fileInput();
		const second = fileInput();
		const input = signal<UseFileDialogInputLike | null>(first);
		const firstFiles = createFileList([new File(["first"], "first.txt")]);
		const secondFiles = createFileList([new File(["second"], "second.txt")]);
		const dialog = useFileDialog({ input });

		setFiles(first, firstFiles);
		first.dispatchEvent(new Event("change"));

		expect(dialog.files.value).toBe(firstFiles);

		input.value = second;
		setFiles(second, secondFiles);
		second.dispatchEvent(new Event("change"));
		setFiles(first, createFileList([new File(["stale"], "stale.txt")]));
		first.dispatchEvent(new Event("change"));

		expect(dialog.files.value).toBe(secondFiles);

		dialog.open();

		expect(second.click).toHaveBeenCalledOnce();

		dialog.stop();
	});

	it("waits for a nullable input target instead of creating an internal input", () => {
		const internal = fileInput();
		const input = fileInput();
		const createElement = vi
			.spyOn(document, "createElement")
			.mockReturnValue(internal);
		const inputTarget = signal<UseFileDialogInputLike | null>(null);
		const accept = signal("image/*");
		const multiple = signal(false);
		const directory = signal(true);
		const capture = signal<string | undefined>("user");
		const files = createFileList([new File(["content"], "file.txt")]);
		const dialog = useFileDialog({
			accept,
			capture,
			directory,
			input: inputTarget,
			multiple,
		});
		const listener = vi.fn();
		dialog.onChange(listener);

		accept.value = "video/*";
		dialog.open();
		dialog.reset();

		expect(createElement).not.toHaveBeenCalled();
		expect(internal.click).not.toHaveBeenCalled();
		expect(input.click).not.toHaveBeenCalled();
		expect(dialog.files.value).toBeNull();
		expect(listener).not.toHaveBeenCalled();

		inputTarget.value = input;

		expect(createElement).not.toHaveBeenCalled();
		expect(input.type).toBe("file");
		expect(input.accept).toBe("video/*");
		expect(input.multiple).toBe(false);
		expect(input.webkitdirectory).toBe(true);
		expect(input.capture).toBe("user");

		setFiles(input, files);
		input.dispatchEvent(new Event("change"));
		dialog.open({
			accept: "text/plain",
			capture: undefined,
			directory: false,
			multiple: true,
		});

		expect(input.accept).toBe("text/plain");
		expect(input.multiple).toBe(true);
		expect(input.webkitdirectory).toBe(false);
		expect(input.getAttribute("capture")).toBeNull();
		expect(dialog.files.value).toBe(files);
		expect(listener).toHaveBeenCalledWith(files);
		expect(input.click).toHaveBeenCalledOnce();
		expect(createElement).not.toHaveBeenCalled();

		dialog.stop();
	});

	it("treats an explicitly undefined input target as no input", () => {
		const createElement = vi.spyOn(document, "createElement");
		const dialog = useFileDialog({ input: undefined });

		dialog.open();

		expect(createElement).not.toHaveBeenCalled();
		expect(dialog.files.value).toBeNull();

		dialog.stop();
	});

	it("does not fall back to the global document when document is null", () => {
		const createElement = vi.spyOn(document, "createElement");
		const dialog = useFileDialog({ document: null });

		dialog.open();

		expect(createElement).not.toHaveBeenCalled();
		expect(dialog.files.value).toBeNull();

		dialog.stop();
	});

	it("stops opening and event handling", () => {
		const input = fileInput();
		const accept = signal("image/*");
		const files = createFileList([new File(["content"], "file.txt")]);
		const dialog = useFileDialog({ accept, input });
		const changeListener = vi.fn();
		const cancelListener = vi.fn();
		dialog.onChange(changeListener);
		dialog.onCancel(cancelListener);

		dialog.stop();
		accept.value = "video/*";
		dialog.open();
		setFiles(input, files);
		input.dispatchEvent(new Event("change"));
		input.dispatchEvent(new Event("cancel"));

		expect(input.accept).toBe("image/*");
		expect(input.click).not.toHaveBeenCalled();
		expect(dialog.files.value).toBeNull();
		expect(changeListener).not.toHaveBeenCalled();
		expect(cancelListener).not.toHaveBeenCalled();
	});
});
