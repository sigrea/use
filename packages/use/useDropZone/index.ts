import { readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseDropZoneOptions,
	UseDropZoneReturn,
	UseDropZoneTarget,
} from "../types";
import { useEventListener } from "../useEventListener";

type DropZoneEventType = "enter" | "over" | "leave" | "drop";
type DataTypesResolver = (
	types: readonly string[],
) => boolean | readonly string[];

function resolveBoolean(
	value: MaybeValue<boolean> | undefined,
	fallback: boolean,
): boolean {
	return resolveValue(value ?? fallback);
}

function readFiles(
	event: DragEvent,
	multiple: boolean,
): readonly File[] | null {
	const list = Array.from(event.dataTransfer?.files ?? []);

	if (list.length === 0) {
		return null;
	}

	return multiple ? list : [list[0]];
}

function matchesDataTypes(
	types: readonly string[],
	dataTypes: readonly string[] | undefined,
): boolean {
	if (dataTypes === undefined || dataTypes.length === 0) {
		return true;
	}

	if (types.length === 0) {
		return false;
	}

	return types.every((type) =>
		dataTypes.some((allowedType) => type.includes(allowedType)),
	);
}

function checkDataTypes(
	dataTypes: UseDropZoneOptions["dataTypes"],
	types: readonly string[],
): boolean {
	if (dataTypes === undefined) {
		return true;
	}

	if (typeof dataTypes === "function") {
		const result = (dataTypes as DataTypesResolver)(types);

		return typeof result === "boolean"
			? result
			: matchesDataTypes(types, result);
	}

	return matchesDataTypes(types, resolveValue(dataTypes));
}

function countFileItems(items: DataTransferItemList): number {
	const fileCount = Array.from(items).filter(
		(item) => item.kind === "file",
	).length;

	return fileCount === 0 ? items.length : fileCount;
}

function isEventValid(event: DragEvent, options: UseDropZoneOptions): boolean {
	const items = event.dataTransfer?.items;

	if (items === undefined) {
		return false;
	}

	const types = Array.from(items, (item) => item.type);
	const multipleFilesValid =
		resolveBoolean(options.multiple, true) || countFileItems(items) <= 1;

	if (options.checkValidity !== undefined) {
		return options.checkValidity(items) && multipleFilesValid;
	}

	const dataTypesValid = checkDataTypes(options.dataTypes, types);

	return dataTypesValid && multipleFilesValid;
}

function setDropEffect(
	event: DragEvent,
	dropEffect: DataTransfer["dropEffect"],
): void {
	if (event.dataTransfer !== null && event.dataTransfer !== undefined) {
		event.dataTransfer.dropEffect = dropEffect;
	}
}

function isSafari(): boolean {
	const userAgent = defaultWindow?.navigator?.userAgent ?? "";

	return (
		/^(?:(?!chrome|android).)*safari/i.test(userAgent) &&
		!("chrome" in (defaultWindow ?? {}))
	);
}

export function useDropZone(
	target: MaybeTarget<UseDropZoneTarget>,
	options: UseDropZoneOptions | NonNullable<UseDropZoneOptions["onDrop"]> = {},
): UseDropZoneReturn {
	const resolvedOptions =
		typeof options === "function" ? { onDrop: options } : options;
	const files = signal<readonly File[] | null>(null);
	const isOverDropZone = signal(false);
	let counter = 0;

	const resetOverState = () => {
		counter = 0;
		isOverDropZone.value = false;
	};

	const resetState = () => {
		resetOverState();
		files.value = null;
	};

	const leave = (event: DragEvent) => {
		counter = Math.max(0, counter - 1);
		if (counter === 0) {
			isOverDropZone.value = false;
		}
		resolvedOptions.onLeave?.(null, event);
	};

	const handleDragEvent = (event: DragEvent, eventType: DropZoneEventType) => {
		const isValid = isEventValid(event, resolvedOptions);
		const canHandleDrag = isValid || (isSafari() && eventType !== "drop");

		if (!canHandleDrag) {
			if (
				resolveBoolean(resolvedOptions.preventDefaultForUnhandled, false) ||
				(isSafari() && eventType === "drop")
			) {
				event.preventDefault();
			}
			setDropEffect(event, "none");
			if (eventType === "leave" && counter > 0) {
				leave(event);
			}
			if (eventType === "drop") {
				resetOverState();
			}
			return;
		}

		event.preventDefault();
		setDropEffect(event, "copy");

		switch (eventType) {
			case "enter":
				counter += 1;
				isOverDropZone.value = true;
				resolvedOptions.onEnter?.(null, event);
				break;
			case "over":
				resolvedOptions.onOver?.(null, event);
				break;
			case "leave":
				leave(event);
				break;
			case "drop": {
				const currentFiles = readFiles(
					event,
					resolveBoolean(resolvedOptions.multiple, true),
				);
				resetOverState();
				files.value = currentFiles;
				resolvedOptions.onDrop?.(currentFiles, event);
				break;
			}
		}
	};

	const targetWatch = watch(
		() => resolveTarget(target),
		(nextTarget, previousTarget) => {
			if (previousTarget !== undefined && nextTarget !== previousTarget) {
				resetOverState();
			}
		},
		{ flush: "sync" },
	);

	const dragEnter = useEventListener(
		target,
		"dragenter",
		(event: DragEvent) => {
			handleDragEvent(event, "enter");
		},
		{ passive: false },
	);
	const dragOver = useEventListener(
		target,
		"dragover",
		(event: DragEvent) => {
			handleDragEvent(event, "over");
		},
		{ passive: false },
	);
	const dragLeave = useEventListener(
		target,
		"dragleave",
		(event: DragEvent) => {
			handleDragEvent(event, "leave");
		},
		{ passive: false },
	);
	const drop = useEventListener(
		target,
		"drop",
		(event: DragEvent) => {
			handleDragEvent(event, "drop");
		},
		{ passive: false },
	);

	return {
		files: readonly(files),
		isOverDropZone: readonly(isOverDropZone),
		stop: () => {
			dragEnter.stop();
			dragOver.stop();
			dragLeave.stop();
			drop.stop();
			targetWatch();
			resetState();
		},
	};
}
