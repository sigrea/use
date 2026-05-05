import {
	computed,
	getCurrentScope,
	onDispose,
	readonly,
	signal,
	watch,
} from "@sigrea/core";

import {
	defaultDocument,
	defaultWindow,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	BasicColorMode,
	ColorModeSelection,
	MaybeTarget,
	RemovableSignal,
	UseColorModeDocumentLike,
	UseColorModeOptions,
	UseColorModeReturn,
	UseColorModeWindowLike,
} from "../types";
import { usePreferredDark } from "../usePreferredDark";
import { useStorage } from "../useStorage";

const defaultStorageKey = "sigrea-color-scheme";
const cssDisableTransitions =
	"*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}";

type ResolvedModes<T extends string> = Record<ColorModeSelection<T>, string>;

interface ApplyColorModeOptions<T extends string> {
	attribute: string;
	disableTransition: boolean;
	document: UseColorModeDocumentLike;
	mode: T | BasicColorMode;
	modes: ResolvedModes<T>;
	target: Element;
	window: UseColorModeWindowLike | undefined;
}

function splitClassNames(value: string): string[] {
	return value.split(/\s+/).filter(Boolean);
}

function resolveModes<T extends string>(
	modes?: UseColorModeOptions<T>["modes"],
): ResolvedModes<T> {
	return {
		auto: "",
		light: "light",
		dark: "dark",
		...(resolveValue(modes) ?? {}),
	} as ResolvedModes<T>;
}

function resolveModeValue<T extends string>(
	mode: T | BasicColorMode,
	modes: ResolvedModes<T>,
): string {
	return modes[mode] ?? mode;
}

function startTransitionSuppression(
	documentTarget: UseColorModeDocumentLike,
	windowTarget: UseColorModeWindowLike | undefined,
): () => void {
	if (
		documentTarget.head === undefined ||
		typeof documentTarget.createElement !== "function"
	) {
		return () => {};
	}

	const style = documentTarget.createElement("style");
	style.textContent = cssDisableTransitions;
	documentTarget.head.appendChild(style);

	return () => {
		try {
			windowTarget?.getComputedStyle?.(style).opacity;
		} catch {}

		try {
			style.remove();
		} catch {
			try {
				documentTarget.head?.removeChild(style);
			} catch {}
		}
	};
}

function applyClassMode(
	target: Element,
	value: string,
	modes: Record<string, string>,
): (() => void)[] {
	const nextClassNames = new Set(splitClassNames(value));
	const managedClassNames = new Set(
		Object.values(modes).flatMap((modeValue) => splitClassNames(modeValue)),
	);
	const operations: (() => void)[] = [];

	for (const className of managedClassNames) {
		if (nextClassNames.has(className)) {
			if (!target.classList.contains(className)) {
				operations.push(() => {
					target.classList.add(className);
				});
			}
			continue;
		}

		if (target.classList.contains(className)) {
			operations.push(() => {
				target.classList.remove(className);
			});
		}
	}

	return operations;
}

function applyAttributeMode(
	target: Element,
	attribute: string,
	value: string,
): (() => void)[] {
	if (target.getAttribute(attribute) === value) {
		return [];
	}

	return [
		() => {
			target.setAttribute(attribute, value);
		},
	];
}

function applyColorMode<T extends string>({
	attribute,
	disableTransition,
	document,
	mode,
	modes,
	target,
	window,
}: ApplyColorModeOptions<T>): void {
	const value = resolveModeValue(mode, modes);
	const operations =
		attribute === "class"
			? applyClassMode(target, value, modes)
			: applyAttributeMode(target, attribute, value);

	if (operations.length === 0) {
		return;
	}

	const restoreTransitions = disableTransition
		? startTransitionSuppression(document, window)
		: () => {};
	try {
		for (const operation of operations) {
			operation();
		}
	} finally {
		restoreTransitions();
	}
}

export function useColorMode<T extends string = BasicColorMode>(
	options: UseColorModeOptions<T> = {},
): UseColorModeReturn<T> {
	const {
		attribute = "class",
		disableTransition = true,
		initialValue = "auto",
		listenToStorageChanges = true,
		onChanged,
		selector = "html",
		storage,
		storageKey = defaultStorageKey,
		storageSignal,
		target,
	} = options;
	const hasWindowOption = options.window !== undefined;
	const hasDocumentOption = options.document !== undefined;
	const windowTarget =
		options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<UseColorModeWindowLike> | undefined);
	const resolveDocument = (): UseColorModeDocumentLike | undefined => {
		if (hasDocumentOption) {
			return resolveTarget(options.document);
		}

		const windowDocument = resolveTarget(windowTarget)?.document;
		if (windowDocument !== undefined) {
			return windowDocument as UseColorModeDocumentLike;
		}

		return hasWindowOption
			? undefined
			: (defaultDocument as UseColorModeDocumentLike | undefined);
	};
	const resolveInitialValue = () =>
		resolveValue(initialValue) as ColorModeSelection<T>;
	const preferredDark = usePreferredDark({
		window: windowTarget as
			| MaybeTarget<
					UseColorModeWindowLike & { matchMedia(query: string): MediaQueryList }
			  >
			| undefined,
	});
	const systemMode = computed<BasicColorMode>(() =>
		preferredDark.matches.value ? "dark" : "light",
	);
	const internalStorage =
		storageSignal === undefined && storageKey !== null
			? useStorage<ColorModeSelection<T>>(storageKey, initialValue, storage, {
					listenToStorageChanges,
					window: windowTarget,
				})
			: undefined;
	const storageMode =
		storageSignal ??
		internalStorage ??
		signal<ColorModeSelection<T> | null>(resolveInitialValue());
	const mode = computed<ColorModeSelection<T>>({
		get: () => storageMode.value ?? resolveInitialValue(),
		set: (nextMode) => {
			storageMode.value = nextMode;
		},
	});
	const resolvedMode = computed<T | BasicColorMode>(() => {
		const currentMode = mode.value;
		return currentMode === "auto" ? systemMode.value : currentMode;
	});
	const resolveWindow = () => resolveTarget(windowTarget);
	const resolveElement = () => {
		if (target !== undefined) {
			return resolveTarget(target);
		}

		const currentDocument = resolveDocument();
		const currentSelector = resolveValue(selector);
		if (
			typeof currentSelector === "string" &&
			typeof currentDocument?.querySelector === "function"
		) {
			try {
				return currentDocument.querySelector(currentSelector) ?? undefined;
			} catch {
				return undefined;
			}
		}

		return currentDocument?.documentElement;
	};
	const stopDomWatch = watch(
		() => ({
			attribute: resolveValue(attribute),
			document: resolveDocument(),
			mode: resolvedMode.value,
			modes: resolveModes(options.modes),
			target: resolveElement(),
			window: resolveWindow(),
		}),
		(nextValue) => {
			if (nextValue.document === undefined || nextValue.target === undefined) {
				return;
			}

			const defaultHandler = (modeValue: T | BasicColorMode) => {
				applyColorMode({
					attribute: nextValue.attribute,
					disableTransition,
					document: nextValue.document as UseColorModeDocumentLike,
					mode: modeValue,
					modes: nextValue.modes,
					target: nextValue.target as Element,
					window: nextValue.window,
				});
			};

			if (onChanged !== undefined) {
				onChanged(nextValue.mode, defaultHandler);
				return;
			}

			defaultHandler(nextValue.mode);
		},
		{ immediate: true, flush: "sync" },
	);
	let stopped = false;
	const stop = () => {
		if (stopped) {
			return;
		}
		stopped = true;
		stopDomWatch();
		preferredDark.stop();
		(
			internalStorage as Partial<RemovableSignal<ColorModeSelection<T> | null>>
		)?.stop?.();
	};
	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return {
		mode,
		system: readonly(systemMode),
		resolvedMode: readonly(resolvedMode),
		stop,
	};
}
