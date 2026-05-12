import { readonly, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { createEventHook } from "../createEventHook";
import type {
	MaybeTarget,
	UseFileDialogDocumentLike,
	UseFileDialogInputLike,
	UseFileDialogOpenOptions,
	UseFileDialogOptions,
	UseFileDialogReturn,
} from "../types";

interface ResolvedFileDialogOptions {
	accept: string;
	capture?: string;
	directory: boolean;
	multiple: boolean;
	reset: boolean;
}

function hasOwn<TObject extends object>(
	object: TObject,
	key: PropertyKey,
): boolean {
	return Object.prototype.hasOwnProperty.call(object, key);
}

function isFileList(value: unknown): value is FileList {
	return typeof FileList !== "undefined" && value instanceof FileList;
}

function getDataTransferConstructor(
	document: UseFileDialogDocumentLike | undefined,
):
	| {
			new (): DataTransfer;
	  }
	| undefined {
	return document?.defaultView?.DataTransfer ?? globalThis.DataTransfer;
}

function prepareInitialFiles(
	files: UseFileDialogOptions["initialFiles"],
	document: UseFileDialogDocumentLike | undefined,
): FileList | null {
	if (files === null || files === undefined) {
		return null;
	}

	if (isFileList(files)) {
		return files;
	}

	const DataTransferConstructor = getDataTransferConstructor(document);
	if (DataTransferConstructor === undefined) {
		return null;
	}

	const dataTransfer = new DataTransferConstructor();
	for (const file of files) {
		dataTransfer.items.add(file);
	}

	return dataTransfer.files;
}

function resolveDialogOptions(
	baseOptions: UseFileDialogOptions,
	openOptions?: UseFileDialogOpenOptions,
): ResolvedFileDialogOptions {
	const capture =
		openOptions !== undefined && hasOwn(openOptions, "capture")
			? resolveValue(openOptions.capture)
			: resolveValue(baseOptions.capture);

	return {
		accept: resolveValue(openOptions?.accept ?? baseOptions.accept ?? ""),
		capture,
		directory: resolveValue(
			openOptions?.directory ?? baseOptions.directory ?? false,
		),
		multiple: resolveValue(
			openOptions?.multiple ?? baseOptions.multiple ?? true,
		),
		reset: resolveValue(openOptions?.reset ?? baseOptions.reset ?? false),
	};
}

function applyOptions(
	input: UseFileDialogInputLike,
	options: ResolvedFileDialogOptions,
): void {
	input.type = "file";
	input.multiple = options.multiple;
	input.accept = options.accept;
	input.webkitdirectory = options.directory;

	if (options.capture === undefined) {
		input.removeAttribute("capture");
		return;
	}

	input.capture = options.capture;
}

/**
 * Reactive file dialog controls.
 */
export function useFileDialog<
	TDocument extends UseFileDialogDocumentLike = UseFileDialogDocumentLike,
>(options: UseFileDialogOptions<TDocument> = {}): UseFileDialogReturn {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const hasInputTarget = "input" in options;
	const inputTarget = options.input;
	const currentDocument = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	let createdInput: UseFileDialogInputLike | undefined;
	let stopped = false;

	const currentInput = (): UseFileDialogInputLike | undefined => {
		if (hasInputTarget) {
			return inputTarget === undefined
				? undefined
				: resolveTarget<UseFileDialogInputLike>(inputTarget);
		}

		const document = currentDocument();
		if (document === undefined) {
			return undefined;
		}

		if (
			createdInput === undefined ||
			(createdInput.ownerDocument as UseFileDialogDocumentLike) !== document
		) {
			createdInput = document.createElement("input");
		}

		return createdInput;
	};
	const files = signal<FileList | null>(
		prepareInitialFiles(options.initialFiles, currentDocument()),
	);
	const changeEvent = createEventHook<FileList | null>();
	const cancelEvent = createEventHook<void>();

	const reset = () => {
		const input = currentInput();
		const shouldTrigger =
			files.value !== null || (input !== undefined && input.value !== "");

		files.value = null;
		if (input !== undefined) {
			input.value = "";
		}
		if (shouldTrigger) {
			void changeEvent.trigger(null);
		}
	};
	const stopInputWatch = watch(
		() => currentInput(),
		(input, _previousInput, onCleanup) => {
			if (input === undefined || stopped) {
				return;
			}

			const change = (event: Event) => {
				if (stopped) {
					return;
				}

				const target = event.target as HTMLInputElement;
				files.value = target.files;
				void changeEvent.trigger(files.value);
			};
			const cancel = () => {
				if (!stopped) {
					void cancelEvent.trigger();
				}
			};

			applyOptions(input, resolveDialogOptions(options));
			input.addEventListener("change", change);
			input.addEventListener("cancel", cancel);
			onCleanup(() => {
				input.removeEventListener("change", change);
				input.removeEventListener("cancel", cancel);
			});
		},
		{ immediate: true, flush: "sync" },
	);
	const stopOptionWatch = watch(
		() => ({
			accept: resolveValue(options.accept ?? ""),
			capture: resolveValue(options.capture),
			directory: resolveValue(options.directory ?? false),
			input: currentInput(),
			multiple: resolveValue(options.multiple ?? true),
		}),
		({ input }) => {
			if (input === undefined || stopped) {
				return;
			}

			applyOptions(input, resolveDialogOptions(options));
		},
		{ immediate: true, flush: "sync" },
	);
	const open = (openOptions?: UseFileDialogOpenOptions) => {
		if (stopped) {
			return;
		}

		const input = currentInput();
		if (input === undefined) {
			return;
		}

		const resolvedOptions = resolveDialogOptions(options, openOptions);

		applyOptions(input, resolvedOptions);
		if (resolvedOptions.reset) {
			reset();
		}
		input.click();
	};
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopInputWatch();
		stopOptionWatch();
	};

	return {
		files: readonly(files),
		open,
		reset,
		onChange: changeEvent.on,
		onCancel: cancelEvent.on,
		stop,
	};
}
