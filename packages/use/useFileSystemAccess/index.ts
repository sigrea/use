import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	FileSystemAccessDataType,
	FileSystemAccessFileHandleLike,
	FileSystemAccessPickerOptions,
	FileSystemAccessShowOpenFileOptions,
	FileSystemAccessShowSaveFileOptions,
	FileSystemAccessWindowLike,
	FileSystemAccessWriteData,
	MaybeTarget,
	MaybeValue,
	UseFileSystemAccessOpenOptions,
	UseFileSystemAccessOptions,
	UseFileSystemAccessPickerOptions,
	UseFileSystemAccessReturn,
	UseFileSystemAccessSaveOptions,
} from "../types";

type SupportedFileSystemAccessWindow<
	TFileHandle extends FileSystemAccessFileHandleLike,
	TWindow extends FileSystemAccessWindowLike<TFileHandle>,
> = TWindow & {
	showOpenFilePicker: NonNullable<TWindow["showOpenFilePicker"]>;
	showSaveFilePicker: NonNullable<TWindow["showSaveFilePicker"]>;
};

function hasOwn<TObject extends object>(
	object: TObject | undefined,
	key: PropertyKey,
): boolean {
	return (
		object !== undefined && Object.prototype.hasOwnProperty.call(object, key)
	);
}

function isFileSystemAccessSupported<
	TFileHandle extends FileSystemAccessFileHandleLike,
	TWindow extends FileSystemAccessWindowLike<TFileHandle>,
>(
	window: TWindow | null | undefined,
): window is SupportedFileSystemAccessWindow<TFileHandle, TWindow> {
	return (
		typeof window?.showOpenFilePicker === "function" &&
		typeof window.showSaveFilePicker === "function"
	);
}

function resolveOptional<T>(
	source: MaybeValue<T | undefined> | undefined,
): T | undefined {
	return source === undefined ? undefined : resolveValue(source);
}

function assignDefined<TOptions extends object, TKey extends keyof TOptions>(
	options: TOptions,
	key: TKey,
	value: TOptions[TKey] | undefined,
): void {
	if (value !== undefined) {
		options[key] = value;
	}
}

function resolvePickerOptions(
	baseOptions: UseFileSystemAccessOptions,
	callOptions?: UseFileSystemAccessPickerOptions,
): FileSystemAccessPickerOptions {
	const excludeAcceptAllOption = resolveOptional(
		hasOwn(callOptions, "excludeAcceptAllOption")
			? callOptions?.excludeAcceptAllOption
			: baseOptions.excludeAcceptAllOption,
	);
	const id = resolveOptional(
		hasOwn(callOptions, "id") ? callOptions?.id : baseOptions.id,
	);
	const startIn = resolveOptional(
		hasOwn(callOptions, "startIn") ? callOptions?.startIn : baseOptions.startIn,
	);
	const types = resolveOptional(
		hasOwn(callOptions, "types") ? callOptions?.types : baseOptions.types,
	);
	const options: FileSystemAccessPickerOptions = {};

	assignDefined(options, "excludeAcceptAllOption", excludeAcceptAllOption);
	assignDefined(options, "id", id);
	assignDefined(options, "startIn", startIn);
	assignDefined(options, "types", types);

	return options;
}

function resolveOpenOptions(
	baseOptions: UseFileSystemAccessOptions,
	openOptions?: UseFileSystemAccessOpenOptions,
): FileSystemAccessShowOpenFileOptions {
	return resolvePickerOptions(
		baseOptions,
		openOptions,
	) as FileSystemAccessShowOpenFileOptions;
}

function resolveSaveOptions(
	baseOptions: UseFileSystemAccessOptions,
	saveOptions?: UseFileSystemAccessSaveOptions,
): FileSystemAccessShowSaveFileOptions {
	const options: FileSystemAccessShowSaveFileOptions = resolvePickerOptions(
		baseOptions,
		saveOptions,
	);
	const suggestedName = resolveOptional(
		hasOwn(saveOptions, "suggestedName")
			? saveOptions?.suggestedName
			: undefined,
	);

	assignDefined(options, "suggestedName", suggestedName);

	return options;
}

async function readFileData(
	file: File,
	dataType: FileSystemAccessDataType,
): Promise<string | ArrayBuffer | Blob> {
	if (dataType === "ArrayBuffer") {
		return file.arrayBuffer();
	}

	if (dataType === "Blob") {
		return file;
	}

	return file.text();
}

/**
 * Reactive File System Access API controls.
 */
export function useFileSystemAccess<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
	TWindow extends
		FileSystemAccessWindowLike<TFileHandle> = FileSystemAccessWindowLike<TFileHandle>,
>(
	options: UseFileSystemAccessOptions<TWindow> & {
		dataType: MaybeValue<"Text">;
	},
): UseFileSystemAccessReturn<string>;
export function useFileSystemAccess<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
	TWindow extends
		FileSystemAccessWindowLike<TFileHandle> = FileSystemAccessWindowLike<TFileHandle>,
>(
	options: UseFileSystemAccessOptions<TWindow> & {
		dataType: MaybeValue<"ArrayBuffer">;
	},
): UseFileSystemAccessReturn<ArrayBuffer>;
export function useFileSystemAccess<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
	TWindow extends
		FileSystemAccessWindowLike<TFileHandle> = FileSystemAccessWindowLike<TFileHandle>,
>(
	options: UseFileSystemAccessOptions<TWindow> & {
		dataType: MaybeValue<"Blob">;
	},
): UseFileSystemAccessReturn<Blob>;
export function useFileSystemAccess<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
	TWindow extends
		FileSystemAccessWindowLike<TFileHandle> = FileSystemAccessWindowLike<TFileHandle>,
>(
	options?: UseFileSystemAccessOptions<TWindow>,
): UseFileSystemAccessReturn<string | ArrayBuffer | Blob>;
export function useFileSystemAccess<
	TFileHandle extends
		FileSystemAccessFileHandleLike = FileSystemAccessFileHandleLike,
	TWindow extends
		FileSystemAccessWindowLike<TFileHandle> = FileSystemAccessWindowLike<TFileHandle>,
>(
	options: UseFileSystemAccessOptions<TWindow> = {},
): UseFileSystemAccessReturn<string | ArrayBuffer | Blob> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const dataType = options.dataType ?? "Text";
	const data = signal<string | ArrayBuffer | Blob | undefined>(undefined);
	const file = signal<File | undefined>(undefined);
	const fileName = computed(() => file.value?.name ?? "");
	const fileMIME = computed(() => file.value?.type ?? "");
	const fileSize = computed(() => file.value?.size ?? 0);
	const fileLastModified = computed(() => file.value?.lastModified ?? 0);
	const error = signal<unknown | null>(null);
	let fileHandle: TFileHandle | undefined;
	let pickerExecutionCount = 0;
	let readExecutionCount = 0;
	let stopped = false;
	let resolvedDataType = resolveValue(dataType);

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const isSupported = computed(() =>
		isFileSystemAccessSupported<TFileHandle, TWindow>(currentWindow()),
	);
	const nextPickerExecution = () => {
		pickerExecutionCount += 1;
		readExecutionCount += 1;

		return pickerExecutionCount;
	};
	const nextReadExecution = () => {
		readExecutionCount += 1;

		return readExecutionCount;
	};
	const shouldApplyReadResult = (executionId: number) =>
		!stopped && executionId === readExecutionCount;
	const shouldApplyPickerResult = (executionId: number) =>
		!stopped && executionId === pickerExecutionCount;
	const shouldApplyWindowResult = (
		window: SupportedFileSystemAccessWindow<TFileHandle, TWindow>,
		executionId: number,
	) => shouldApplyPickerResult(executionId) && currentWindow() === window;
	const applyCurrentFileData = async (executionId: number) => {
		const handle = fileHandle;

		if (handle === undefined) {
			if (shouldApplyReadResult(executionId)) {
				file.value = undefined;
				data.value = undefined;
			}
			return;
		}

		const nextFile = await handle.getFile();
		const nextData = await readFileData(nextFile, resolvedDataType);

		if (!shouldApplyReadResult(executionId)) {
			return;
		}

		file.value = nextFile;
		data.value = nextData;
		error.value = null;
	};
	const applyCurrentFile = async (executionId: number) => {
		const handle = fileHandle;
		const nextFile = await handle?.getFile();

		if (!shouldApplyReadResult(executionId)) {
			return;
		}

		file.value = nextFile;
		error.value = null;
	};
	const writeData = async (
		handle: TFileHandle,
		currentData: string | ArrayBuffer | Blob,
	) => {
		const writableStream = await handle.createWritable();
		await writableStream.write(currentData as FileSystemAccessWriteData);
		await writableStream.close();
	};
	const storeError = (caughtError: unknown, executionId: number) => {
		if (shouldApplyReadResult(executionId)) {
			error.value = caughtError;
		}
	};
	const storePickerError = (
		caughtError: unknown,
		window: SupportedFileSystemAccessWindow<TFileHandle, TWindow>,
		executionId: number,
	) => {
		if (shouldApplyWindowResult(window, executionId)) {
			error.value = caughtError;
		}
	};

	const updateData = async (): Promise<void> => {
		if (stopped) {
			return;
		}

		const executionId = nextReadExecution();
		error.value = null;

		try {
			await applyCurrentFileData(executionId);
		} catch (caughtError) {
			storeError(caughtError, executionId);
		}
	};
	const open = async (
		openOptions?: UseFileSystemAccessOpenOptions,
	): Promise<void> => {
		if (stopped) {
			return;
		}

		const window = currentWindow();
		if (!isFileSystemAccessSupported<TFileHandle, TWindow>(window)) {
			return;
		}

		const pickerExecutionId = nextPickerExecution();
		error.value = null;

		let handle: TFileHandle | undefined;
		try {
			[handle] = await window.showOpenFilePicker(
				resolveOpenOptions(options, openOptions),
			);
		} catch (caughtError) {
			storePickerError(caughtError, window, pickerExecutionId);
			return;
		}

		if (
			handle === undefined ||
			!shouldApplyWindowResult(window, pickerExecutionId)
		) {
			return;
		}

		fileHandle = handle;
		const readExecutionId = nextReadExecution();
		try {
			await applyCurrentFileData(readExecutionId);
		} catch (caughtError) {
			storeError(caughtError, readExecutionId);
		}
	};
	const create = async (
		saveOptions?: UseFileSystemAccessSaveOptions,
	): Promise<void> => {
		if (stopped) {
			return;
		}

		const window = currentWindow();
		if (!isFileSystemAccessSupported<TFileHandle, TWindow>(window)) {
			return;
		}

		const pickerExecutionId = nextPickerExecution();
		error.value = null;

		let handle: TFileHandle;
		try {
			handle = await window.showSaveFilePicker(
				resolveSaveOptions(options, saveOptions),
			);
		} catch (caughtError) {
			storePickerError(caughtError, window, pickerExecutionId);
			return;
		}

		if (!shouldApplyWindowResult(window, pickerExecutionId)) {
			return;
		}

		fileHandle = handle;
		data.value = undefined;
		const readExecutionId = nextReadExecution();
		try {
			await applyCurrentFileData(readExecutionId);
		} catch (caughtError) {
			storeError(caughtError, readExecutionId);
		}
	};
	const saveAsData = async (
		currentData: string | ArrayBuffer | Blob,
		saveOptions?: UseFileSystemAccessSaveOptions,
	): Promise<void> => {
		const window = currentWindow();
		if (!isFileSystemAccessSupported<TFileHandle, TWindow>(window)) {
			return;
		}

		const pickerExecutionId = nextPickerExecution();
		error.value = null;

		let handle: TFileHandle;
		try {
			handle = await window.showSaveFilePicker(
				resolveSaveOptions(options, saveOptions),
			);
		} catch (caughtError) {
			storePickerError(caughtError, window, pickerExecutionId);
			return;
		}

		if (!shouldApplyWindowResult(window, pickerExecutionId)) {
			return;
		}

		fileHandle = handle;
		const readExecutionId = nextReadExecution();
		try {
			await writeData(handle, currentData);
			await applyCurrentFile(readExecutionId);
		} catch (caughtError) {
			storeError(caughtError, readExecutionId);
		}
	};
	const saveAs = async (
		saveOptions?: UseFileSystemAccessSaveOptions,
	): Promise<void> => {
		if (stopped) {
			return;
		}

		const currentData = data.value;

		if (currentData === undefined) {
			return;
		}

		await saveAsData(currentData, saveOptions);
	};
	const save = async (
		saveOptions?: UseFileSystemAccessSaveOptions,
	): Promise<void> => {
		if (stopped) {
			return;
		}

		const currentData = data.value;

		if (currentData === undefined) {
			return;
		}

		if (fileHandle === undefined) {
			await saveAsData(currentData, saveOptions);
			return;
		}

		const executionId = nextReadExecution();
		error.value = null;

		try {
			await writeData(fileHandle, currentData);
			await applyCurrentFile(executionId);
		} catch (caughtError) {
			storeError(caughtError, executionId);
		}
	};
	const stopDataTypeWatch = watch(
		() => resolveValue(dataType),
		(nextDataType) => {
			if (nextDataType === resolvedDataType) {
				return;
			}

			resolvedDataType = nextDataType;
			void updateData();
		},
		{ flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		pickerExecutionCount += 1;
		readExecutionCount += 1;
		stopDataTypeWatch();
	};

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		data,
		file: readonly(file),
		fileName: readonly(fileName),
		fileMIME: readonly(fileMIME),
		fileSize: readonly(fileSize),
		fileLastModified: readonly(fileLastModified),
		error: readonly(error),
		open,
		create,
		save,
		saveAs,
		updateData,
		stop,
	};
}
