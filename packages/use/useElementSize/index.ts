import { readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, resolveTarget } from "../../shared";
import type {
	ElementSize,
	MaybeTarget,
	ResizeObserverWindowLike,
	UseElementSizeOptions,
	UseElementSizeReturn,
} from "../types";

type MaybeBoxSize =
	| ResizeObserverSize
	| readonly ResizeObserverSize[]
	| undefined;

interface OffsetSizeElement extends Element {
	readonly offsetWidth: number;
	readonly offsetHeight: number;
}

function toBoxSizeArray(value: MaybeBoxSize): readonly ResizeObserverSize[] {
	if (value === undefined) {
		return [];
	}

	return "inlineSize" in value ? [value] : value;
}

function readEntrySize(
	entry: ResizeObserverEntry,
	box: ResizeObserverBoxOptions,
): ElementSize {
	const boxSize =
		box === "border-box"
			? entry.borderBoxSize
			: box === "device-pixel-content-box"
				? entry.devicePixelContentBoxSize
				: entry.contentBoxSize;
	const sizes = toBoxSizeArray(boxSize);

	if (sizes.length === 0) {
		return {
			width: entry.contentRect.width,
			height: entry.contentRect.height,
		};
	}

	return {
		width: sizes.reduce((total, size) => total + size.inlineSize, 0),
		height: sizes.reduce((total, size) => total + size.blockSize, 0),
	};
}

function isSvgElement(element: Element): boolean {
	return element.namespaceURI?.includes("svg") ?? false;
}

function readSvgSize(element: Element): ElementSize {
	const rect = element.getBoundingClientRect();

	return {
		width: rect.width,
		height: rect.height,
	};
}

function hasOffsetSize(element: Element): element is OffsetSizeElement {
	return "offsetWidth" in element && "offsetHeight" in element;
}

function readInitialSize(
	element: Element,
	initialSize: ElementSize,
): ElementSize {
	if (isSvgElement(element)) {
		return readSvgSize(element);
	}

	if (!hasOffsetSize(element)) {
		return initialSize;
	}

	return {
		width: element.offsetWidth,
		height: element.offsetHeight,
	};
}

function getResizeObserver(
	windowTarget: ResizeObserverWindowLike | undefined,
	allowGlobalFallback: boolean,
): typeof ResizeObserver | undefined {
	return (
		windowTarget?.ResizeObserver ??
		(allowGlobalFallback ? globalThis.ResizeObserver : undefined)
	);
}

export function useElementSize<
	TWindow extends ResizeObserverWindowLike = ResizeObserverWindowLike,
>(
	target: MaybeTarget<Element>,
	initialSize: ElementSize = { width: 0, height: 0 },
	options: UseElementSizeOptions<TWindow> = {},
): UseElementSizeReturn {
	const { box = "content-box" } = options;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget = useDefaultWindow
		? (defaultWindow as MaybeTarget<TWindow> | undefined)
		: options.window;
	const width = signal(initialSize.width);
	const height = signal(initialSize.height);
	let hasSeenElement = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);

	const setSize = (size: ElementSize) => {
		width.value = size.width;
		height.value = size.height;
	};

	const stopWatch = watch(
		() => ({
			element: resolveTarget(target),
			window: currentWindow(),
		}),
		({ element, window }, _previousValue, onCleanup) => {
			if (!element) {
				if (hasSeenElement) {
					setSize({ width: 0, height: 0 });
				}
				return;
			}

			hasSeenElement = true;
			setSize(readInitialSize(element, initialSize));

			const ResizeObserverCtor = getResizeObserver(window, useDefaultWindow);
			if (typeof ResizeObserverCtor !== "function") {
				return;
			}

			const observer = new ResizeObserverCtor((entries) => {
				const entry = entries[0];
				if (entry === undefined) {
					return;
				}

				if (isSvgElement(element) && window) {
					setSize(readSvgSize(element));
					return;
				}

				setSize(readEntrySize(entry, box));
			});

			observer.observe(element, { box });

			onCleanup(() => {
				observer.disconnect();
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		width: readonly(width),
		height: readonly(height),
		stop: () => {
			stopWatch();
		},
	};
}
