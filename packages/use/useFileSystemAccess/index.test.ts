import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	FileSystemAccessFileHandleLike,
	FileSystemAccessShowOpenFileOptions,
	FileSystemAccessShowSaveFileOptions,
	FileSystemAccessWindowLike,
	FileSystemAccessWritableFileStreamLike,
	FileSystemAccessWriteData,
} from "../types";
import { useFileSystemAccess } from "./index";

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

function createReadableFile(
	content: string,
	name: string,
	options: FilePropertyBag = {},
): File {
	const file = new File([content], name, options);
	const encodedContent = new TextEncoder().encode(content);

	Object.defineProperty(file, "text", {
		configurable: true,
		value: async () => content,
	});
	Object.defineProperty(file, "arrayBuffer", {
		configurable: true,
		value: async () => encodedContent.buffer.slice(0),
	});

	return file;
}

class FakeWritableStream implements FileSystemAccessWritableFileStreamLike {
	readonly writes: FileSystemAccessWriteData[] = [];
	readonly write = vi.fn(async (data: FileSystemAccessWriteData) => {
		this.writes.push(data);
	});
	readonly close = vi.fn(async () => {});
}

class FakeFileHandle implements FileSystemAccessFileHandleLike {
	readonly writable = new FakeWritableStream();
	readonly getFile = vi.fn(async () => this.file);
	readonly createWritable = vi.fn(async () => this.writable);

	constructor(public file: File) {}
}

class FakeWindow
	extends EventTarget
	implements FileSystemAccessWindowLike<FakeFileHandle>
{
	openHandles: readonly FakeFileHandle[] = [];
	saveHandle = new FakeFileHandle(new File([""], "created.txt"));
	readonly showOpenFilePicker = vi.fn(
		async (_options?: FileSystemAccessShowOpenFileOptions) => this.openHandles,
	);
	readonly showSaveFilePicker = vi.fn(
		async (_options?: FileSystemAccessShowSaveFileOptions) => this.saveHandle,
	);
}

class UnsupportedWindow extends EventTarget {}

describe("useFileSystemAccess", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		disposeTrackedMolecules();
	});

	it("uses fallback values without picker support", async () => {
		const result = useFileSystemAccess({
			window: new UnsupportedWindow(),
		});

		expect(result.isSupported.value).toBe(false);
		expect(result.data.value).toBeUndefined();
		expect(result.file.value).toBeUndefined();
		expect(result.fileName.value).toBe("");
		expect(result.fileMIME.value).toBe("");
		expect(result.fileSize.value).toBe(0);
		expect(result.fileLastModified.value).toBe(0);
		expect(result.error.value).toBeNull();
		await expect(result.open()).resolves.toBeUndefined();

		result.stop();
	});

	it("does not fall back to the global window when window is null", async () => {
		const globalWindow = window as unknown as FakeWindow;
		const originalOpenDescriptor = Object.getOwnPropertyDescriptor(
			globalWindow,
			"showOpenFilePicker",
		);
		const originalSaveDescriptor = Object.getOwnPropertyDescriptor(
			globalWindow,
			"showSaveFilePicker",
		);
		const open = vi.fn();
		const save = vi.fn();

		try {
			Object.defineProperty(globalWindow, "showOpenFilePicker", {
				configurable: true,
				value: open,
			});
			Object.defineProperty(globalWindow, "showSaveFilePicker", {
				configurable: true,
				value: save,
			});
			const result = useFileSystemAccess({ window: null });

			await result.open();
			await result.create();
			await result.save();
			await result.saveAs();

			expect(result.isSupported.value).toBe(false);
			expect(open).not.toHaveBeenCalled();
			expect(save).not.toHaveBeenCalled();

			result.stop();
		} finally {
			if (originalOpenDescriptor === undefined) {
				Object.defineProperty(globalWindow, "showOpenFilePicker", {
					configurable: true,
					value: undefined,
				});
			} else {
				Object.defineProperty(
					globalWindow,
					"showOpenFilePicker",
					originalOpenDescriptor,
				);
			}

			if (originalSaveDescriptor === undefined) {
				Object.defineProperty(globalWindow, "showSaveFilePicker", {
					configurable: true,
					value: undefined,
				});
			} else {
				Object.defineProperty(
					globalWindow,
					"showSaveFilePicker",
					originalSaveDescriptor,
				);
			}
		}
	});

	it("opens a file and reads text data", async () => {
		const file = createReadableFile("hello", "note.txt", {
			lastModified: 123,
			type: "text/plain",
		});
		const handle = new FakeFileHandle(file);
		const window = new FakeWindow();
		window.openHandles = [handle];
		const types = [
			{
				accept: { "text/plain": [".txt"] },
				description: "Text",
			},
		];
		const result = useFileSystemAccess({
			excludeAcceptAllOption: true,
			id: "notes",
			startIn: "documents",
			types,
			window,
		});

		await result.open({ id: "override" });

		expect(result.isSupported.value).toBe(true);
		expect(window.showOpenFilePicker).toHaveBeenCalledWith({
			excludeAcceptAllOption: true,
			id: "override",
			startIn: "documents",
			types,
		});
		expect(result.data.value).toBe("hello");
		expect(result.file.value).toBe(file);
		expect(result.fileName.value).toBe("note.txt");
		expect(result.fileMIME.value).toBe("text/plain");
		expect(result.fileSize.value).toBe(5);
		expect(result.fileLastModified.value).toBe(123);
		expect(result.error.value).toBeNull();

		result.stop();
	});

	it("updates data when the data type changes", async () => {
		const file = createReadableFile("hello", "note.txt");
		const window = new FakeWindow();
		window.openHandles = [new FakeFileHandle(file)];
		const dataType = signal<"ArrayBuffer" | "Blob" | "Text">("Text");
		const result = useFileSystemAccess({ dataType, window });

		await result.open();
		expect(result.data.value).toBe("hello");

		dataType.value = "ArrayBuffer";
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect((result.data.value as ArrayBuffer).byteLength).toBe(5);
		expect(new TextDecoder().decode(result.data.value as ArrayBuffer)).toBe(
			"hello",
		);

		dataType.value = "Blob";
		await result.updateData();

		expect(result.data.value).toBe(file);

		result.stop();
	});

	it("keeps a pending open result when the data type changes", async () => {
		const request = createDeferred<readonly FakeFileHandle[]>();
		const file = createReadableFile("late", "late.txt");
		const handle = new FakeFileHandle(file);
		const window = new FakeWindow();
		window.showOpenFilePicker.mockReturnValue(request.promise);
		const dataType = signal<"Blob" | "Text">("Text");
		const result = useFileSystemAccess({ dataType, window });
		const opened = result.open();

		dataType.value = "Blob";
		request.resolve([handle]);
		await opened;

		expect(result.file.value).toBe(file);
		expect(result.fileName.value).toBe("late.txt");
		expect(result.data.value).toBe(file);

		result.stop();
	});

	it("creates a file handle and reads the selected file", async () => {
		const file = createReadableFile("created", "created.txt", {
			type: "text/plain",
		});
		const handle = new FakeFileHandle(file);
		const window = new FakeWindow();
		window.saveHandle = handle;
		const result = useFileSystemAccess({ window });

		await result.create({ suggestedName: "created.txt" });

		expect(window.showSaveFilePicker).toHaveBeenCalledWith({
			suggestedName: "created.txt",
		});
		expect(result.file.value).toBe(file);
		expect(result.data.value).toBe("created");
		expect(handle.createWritable).not.toHaveBeenCalled();

		result.stop();
	});

	it("saves edited data to the current file handle", async () => {
		const handle = new FakeFileHandle(createReadableFile("old", "note.txt"));
		const window = new FakeWindow();
		window.openHandles = [handle];
		const result = useFileSystemAccess({ window });

		await result.open();
		result.data.value = "";
		await result.save();

		expect(handle.createWritable).toHaveBeenCalledOnce();
		expect(handle.writable.write).toHaveBeenCalledWith("");
		expect(handle.writable.close).toHaveBeenCalledOnce();
		expect(window.showSaveFilePicker).not.toHaveBeenCalled();

		result.stop();
	});

	it("uses saveAs when saving without a current file handle", async () => {
		const handle = new FakeFileHandle(createReadableFile("", "new.txt"));
		const window = new FakeWindow();
		window.saveHandle = handle;
		const result = useFileSystemAccess({ window });
		result.data.value = "new content";

		await result.save({ suggestedName: "new.txt" });

		expect(window.showSaveFilePicker).toHaveBeenCalledWith({
			suggestedName: "new.txt",
		});
		expect(handle.writable.write).toHaveBeenCalledWith("new content");
		expect(handle.writable.close).toHaveBeenCalledOnce();
		expect(result.file.value?.name).toBe("new.txt");

		result.stop();
	});

	it("writes the data captured before opening the save picker", async () => {
		const request = createDeferred<FakeFileHandle>();
		const handle = new FakeFileHandle(createReadableFile("", "captured.txt"));
		const window = new FakeWindow();
		window.showSaveFilePicker.mockReturnValue(request.promise);
		const result = useFileSystemAccess({ window });
		result.data.value = "captured";

		const saved = result.saveAs();
		result.data.value = undefined;
		request.resolve(handle);
		await saved;

		expect(handle.writable.write).toHaveBeenCalledWith("captured");
		expect(handle.writable.close).toHaveBeenCalledOnce();
		expect(result.file.value?.name).toBe("captured.txt");

		result.stop();
	});

	it("keeps the current handle when a newly opened file cannot be read", async () => {
		const oldHandle = new FakeFileHandle(createReadableFile("old", "old.txt"));
		const unreadableFile = createReadableFile("new", "new.txt");
		const readError = new Error("read failed");
		Object.defineProperty(unreadableFile, "text", {
			configurable: true,
			value: vi.fn(async () => {
				throw readError;
			}),
		});
		const failedHandle = new FakeFileHandle(unreadableFile);
		const window = new FakeWindow();
		window.openHandles = [oldHandle];
		const result = useFileSystemAccess({ window });

		await result.open();
		window.openHandles = [failedHandle];
		await result.open();

		expect(result.error.value).toBe(readError);
		expect(result.file.value?.name).toBe("old.txt");
		expect(result.data.value).toBe("old");

		result.data.value = "edited old";
		await result.save();

		expect(oldHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.writable.write).toHaveBeenCalledWith("edited old");
		expect(failedHandle.createWritable).not.toHaveBeenCalled();

		result.stop();
	});

	it("keeps the current handle when saveAs cannot write the new file", async () => {
		const oldHandle = new FakeFileHandle(createReadableFile("old", "old.txt"));
		const newHandle = new FakeFileHandle(createReadableFile("new", "new.txt"));
		const writeError = new Error("write failed");
		newHandle.writable.write.mockRejectedValueOnce(writeError);
		const window = new FakeWindow();
		window.openHandles = [oldHandle];
		window.saveHandle = newHandle;
		const result = useFileSystemAccess({ window });

		await result.open();
		result.data.value = "edited";
		await result.saveAs({ suggestedName: "new.txt" });

		expect(result.error.value).toBe(writeError);
		expect(result.file.value?.name).toBe("old.txt");
		expect(result.data.value).toBe("edited");

		await result.save();

		expect(newHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.writable.write).toHaveBeenCalledWith("edited");

		result.stop();
	});

	it("keeps the current handle when saveAs cannot close the new file", async () => {
		const oldHandle = new FakeFileHandle(createReadableFile("old", "old.txt"));
		const newHandle = new FakeFileHandle(createReadableFile("new", "new.txt"));
		const closeError = new Error("close failed");
		newHandle.writable.close.mockRejectedValueOnce(closeError);
		const window = new FakeWindow();
		window.openHandles = [oldHandle];
		window.saveHandle = newHandle;
		const result = useFileSystemAccess({ window });

		await result.open();
		result.data.value = "edited";
		await result.saveAs({ suggestedName: "new.txt" });

		expect(result.error.value).toBe(closeError);
		expect(result.file.value?.name).toBe("old.txt");
		expect(result.data.value).toBe("edited");

		await result.save();

		expect(newHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.writable.write).toHaveBeenCalledWith("edited");

		result.stop();
	});

	it("keeps the current handle when saveAs cannot refresh the new file", async () => {
		const oldHandle = new FakeFileHandle(createReadableFile("old", "old.txt"));
		const newHandle = new FakeFileHandle(createReadableFile("new", "new.txt"));
		const refreshError = new Error("refresh failed");
		newHandle.getFile.mockRejectedValueOnce(refreshError);
		const window = new FakeWindow();
		window.openHandles = [oldHandle];
		window.saveHandle = newHandle;
		const result = useFileSystemAccess({ window });

		await result.open();
		result.data.value = "edited";
		await result.saveAs({ suggestedName: "new.txt" });

		expect(result.error.value).toBe(refreshError);
		expect(result.file.value?.name).toBe("old.txt");
		expect(result.data.value).toBe("edited");

		await result.save();

		expect(newHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.createWritable).toHaveBeenCalledOnce();
		expect(oldHandle.writable.write).toHaveBeenCalledWith("edited");

		result.stop();
	});

	it("does not open the save picker without data to write", async () => {
		const window = new FakeWindow();
		const result = useFileSystemAccess({ window });

		await result.save();
		await result.saveAs();

		expect(window.showSaveFilePicker).not.toHaveBeenCalled();

		result.stop();
	});

	it("stores picker errors without throwing", async () => {
		const error = new DOMException("User cancelled", "AbortError");
		const window = new FakeWindow();
		window.showOpenFilePicker.mockRejectedValue(error);
		const result = useFileSystemAccess({ window });

		await expect(result.open()).resolves.toBeUndefined();

		expect(result.error.value).toBe(error);
		expect(result.file.value).toBeUndefined();
		expect(result.data.value).toBeUndefined();

		result.stop();
	});

	it("ignores stale picker results after stop", async () => {
		const request = createDeferred<readonly FakeFileHandle[]>();
		const handle = new FakeFileHandle(new File(["late"], "late.txt"));
		const window = new FakeWindow();
		window.showOpenFilePicker.mockReturnValue(request.promise);
		const result = useFileSystemAccess({ window });
		const opened = result.open();

		result.stop();
		request.resolve([handle]);
		await opened;

		expect(result.file.value).toBeUndefined();
		expect(result.data.value).toBeUndefined();
		await result.open();
		await result.saveAs();
		expect(window.showOpenFilePicker).toHaveBeenCalledOnce();
		expect(window.showSaveFilePicker).not.toHaveBeenCalled();
	});
});
