import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	UseFullscreenDocumentLike,
	UseFullscreenElementLike,
	UseFullscreenEnterOptions,
	UseFullscreenOptions,
	UseFullscreenReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

const fullscreenEvents = [
	"fullscreenchange",
	"webkitfullscreenchange",
	"webkitendfullscreen",
] as const;

const requestMethodNames = [
	"requestFullscreen",
	"webkitRequestFullscreen",
	"webkitRequestFullScreen",
	"webkitEnterFullscreen",
	"webkitEnterFullScreen",
] as const;

const documentExitMethodNames = [
	"exitFullscreen",
	"webkitExitFullscreen",
	"webkitExitFullScreen",
	"webkitCancelFullScreen",
] as const;

const targetExitMethodNames = [
	"webkitExitFullscreen",
	"webkitExitFullScreen",
] as const;

const fullscreenElementPropertyNames = [
	"fullscreenElement",
	"webkitFullscreenElement",
] as const;

const fullscreenEnabledPropertyNames = [
	"fullscreenEnabled",
	"webkitFullscreenEnabled",
] as const;

const fullscreenBooleanPropertyNames = [
	"fullscreen",
	"webkitIsFullScreen",
] as const;

function isFunction(value: unknown): value is (...args: never[]) => unknown {
	return typeof value === "function";
}

function findMethodName<TName extends string>(
	source: object | null | undefined,
	methodNames: readonly TName[],
): TName | undefined {
	if (source === undefined || source === null) {
		return undefined;
	}

	const sourceRecord = source as Record<string, unknown>;
	return methodNames.find((methodName) => isFunction(sourceRecord[methodName]));
}

function readBooleanProperty<TName extends string>(
	source: object | null | undefined,
	propertyNames: readonly TName[],
): boolean | undefined {
	if (source === undefined || source === null) {
		return undefined;
	}

	const sourceRecord = source as Record<string, unknown>;
	for (const propertyName of propertyNames) {
		if (propertyName in source) {
			return Boolean(sourceRecord[propertyName]);
		}
	}

	return undefined;
}

function readFullscreenElement(
	document: UseFullscreenDocumentLike | null | undefined,
	target?: UseFullscreenElementLike | null,
): UseFullscreenElementLike | null | undefined {
	if (document === undefined || document === null) {
		return undefined;
	}

	let hasKnownFullscreenElementProperty = false;

	const root = target?.getRootNode?.();
	if (root !== undefined) {
		for (const propertyName of fullscreenElementPropertyNames) {
			if (propertyName in root) {
				hasKnownFullscreenElementProperty = true;
				const fullscreenElement = root[propertyName];
				if (fullscreenElement !== undefined && fullscreenElement !== null) {
					return fullscreenElement;
				}
			}
		}
	}

	for (const propertyName of fullscreenElementPropertyNames) {
		if (propertyName in document) {
			hasKnownFullscreenElementProperty = true;
			const fullscreenElement = document[propertyName];
			if (fullscreenElement !== undefined && fullscreenElement !== null) {
				return fullscreenElement;
			}
		}
	}

	return hasKnownFullscreenElementProperty ? null : undefined;
}

function readIsFullscreen(
	document: UseFullscreenDocumentLike | null | undefined,
	target: UseFullscreenElementLike | null | undefined,
): boolean {
	if (document === undefined || document === null || target === undefined) {
		return false;
	}

	const fullscreenElement = readFullscreenElement(document, target);
	if (fullscreenElement !== undefined && fullscreenElement !== null) {
		return fullscreenElement === target;
	}

	const targetFullscreen = readBooleanProperty(target, [
		"webkitDisplayingFullscreen",
	]);
	if (targetFullscreen !== undefined) {
		return targetFullscreen;
	}

	return readBooleanProperty(document, fullscreenBooleanPropertyNames) ?? false;
}

function readHasFullscreenElement(
	document: UseFullscreenDocumentLike | null | undefined,
	target: UseFullscreenElementLike | null | undefined,
): boolean {
	if (document === undefined || document === null) {
		return false;
	}

	const fullscreenElement = readFullscreenElement(document, target);
	if (fullscreenElement !== undefined && fullscreenElement !== null) {
		return true;
	}

	const targetFullscreen = readBooleanProperty(target, [
		"webkitDisplayingFullscreen",
	]);
	if (targetFullscreen !== undefined) {
		return targetFullscreen;
	}

	return readBooleanProperty(document, fullscreenBooleanPropertyNames) ?? false;
}

function readIsSupported(
	document: UseFullscreenDocumentLike | null | undefined,
	target: UseFullscreenElementLike | null | undefined,
): boolean {
	if (document === undefined || document === null || target === undefined) {
		return false;
	}

	const requestMethodName = findMethodName(target, requestMethodNames);
	const documentExitMethodName = findMethodName(
		document,
		documentExitMethodNames,
	);
	const targetExitMethodName = findMethodName(target, targetExitMethodNames);
	const fullscreenEnabled = readBooleanProperty(
		document,
		fullscreenEnabledPropertyNames,
	);

	return (
		requestMethodName !== undefined &&
		(documentExitMethodName !== undefined ||
			targetExitMethodName !== undefined) &&
		fullscreenEnabled !== false
	);
}

function readCanExit(
	document: UseFullscreenDocumentLike | null | undefined,
	target: UseFullscreenElementLike | null | undefined,
): boolean {
	if (document === undefined || document === null) {
		return false;
	}

	return (
		findMethodName(document, documentExitMethodNames) !== undefined ||
		findMethodName(target, targetExitMethodNames) !== undefined
	);
}

function isTargetWebkitFullscreen(
	target: UseFullscreenElementLike | null | undefined,
): boolean {
	return readBooleanProperty(target, ["webkitDisplayingFullscreen"]) === true;
}

/**
 * Reactive Fullscreen API controls.
 *
 * @param target Element to present fullscreen. Defaults to document.documentElement.
 * @param options Fullscreen options.
 */
export function useFullscreen<
	TElement extends UseFullscreenElementLike = UseFullscreenElementLike,
	TDocument extends UseFullscreenDocumentLike = UseFullscreenDocumentLike,
>(
	target?: MaybeTarget<TElement | null | undefined>,
	options: UseFullscreenOptions<TDocument> = {},
): UseFullscreenReturn {
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const autoExit = options.autoExit ?? false;
	const isFullscreen = signal(false);

	const currentDocument = (): TDocument | undefined =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument>(documentTarget);
	const currentTarget = (
		document: TDocument | undefined = currentDocument(),
	): TElement | UseFullscreenElementLike | undefined => {
		if (target === undefined) {
			return document?.documentElement ?? undefined;
		}

		return resolveTarget<TElement>(target);
	};
	const syncFullscreen = () => {
		isFullscreen.value = readIsFullscreen(currentDocument(), currentTarget());
	};
	const isSupported = computed(() =>
		readIsSupported(currentDocument(), currentTarget()),
	);
	const listenerOptions = {
		passive: true,
	};
	const documentListener = useEventListener(
		() => currentDocument() as EventTarget | undefined,
		fullscreenEvents,
		syncFullscreen,
		listenerOptions,
	);
	const targetListener = useEventListener(
		() => currentTarget() as EventTarget | undefined,
		fullscreenEvents,
		syncFullscreen,
		listenerOptions,
	);
	const stopSync = watch(
		() => ({
			document: currentDocument(),
			target: currentTarget(),
		}),
		syncFullscreen,
		{ immediate: true, flush: "sync" },
	);

	const exit = async (): Promise<void> => {
		const document = currentDocument();
		const target = currentTarget(document);
		if (
			!readCanExit(document, target) ||
			!readHasFullscreenElement(document, target)
		) {
			syncFullscreen();
			return;
		}

		if (isTargetWebkitFullscreen(target)) {
			const targetExitMethodName = findMethodName(
				target,
				targetExitMethodNames,
			);
			if (targetExitMethodName !== undefined) {
				const exitFullscreen = target?.[targetExitMethodName] as
					| (() => Promise<void> | void)
					| undefined;
				await exitFullscreen?.call(target);
				syncFullscreen();
				return;
			}
		}

		const documentExitMethodName = findMethodName(
			document,
			documentExitMethodNames,
		);
		if (documentExitMethodName !== undefined) {
			const exitFullscreen = document?.[documentExitMethodName] as
				| (() => Promise<void> | void)
				| undefined;
			await exitFullscreen?.call(document);
			syncFullscreen();
			return;
		}

		const targetExitMethodName = findMethodName(target, targetExitMethodNames);
		if (targetExitMethodName !== undefined) {
			const exitFullscreen = target?.[targetExitMethodName] as
				| (() => Promise<void> | void)
				| undefined;
			await exitFullscreen?.call(target);
			syncFullscreen();
		}
	};

	const enter = async (
		enterOptions?: UseFullscreenEnterOptions,
	): Promise<void> => {
		const document = currentDocument();
		const target = currentTarget(document);
		if (!readIsSupported(document, target) || target === undefined) {
			syncFullscreen();
			return;
		}

		if (readIsFullscreen(document, target)) {
			syncFullscreen();
			return;
		}

		if (readHasFullscreenElement(document, target)) {
			await exit();
		}

		const requestMethodName = findMethodName(target, requestMethodNames);
		if (requestMethodName === undefined) {
			syncFullscreen();
			return;
		}

		const requestFullscreen = target[requestMethodName] as
			| ((options?: UseFullscreenEnterOptions) => Promise<void> | void)
			| undefined;
		await requestFullscreen?.call(target, enterOptions);
		syncFullscreen();
	};

	const toggle = async (
		enterOptions?: UseFullscreenEnterOptions,
	): Promise<void> => {
		if (isFullscreen.value) {
			await exit();
			return;
		}

		await enter(enterOptions);
	};

	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopSync();
		documentListener.stop();
		targetListener.stop();

		if (autoExit) {
			void exit().catch(() => {});
		}
	};

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		isFullscreen: readonly(isFullscreen),
		enter,
		exit,
		toggle,
		stop,
	};
}
