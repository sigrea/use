import { watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseImageAsyncStateOptions,
	UseImageOptions,
	UseImageReturn,
	UseImageWindowLike,
} from "../types";
import { useAsyncState } from "../useAsyncState";

type ImageConstructorLike = { new (): HTMLImageElement };

function watchImageOptions(target: MaybeValue<UseImageOptions>): object {
	try {
		return resolveValue(target);
	} catch (error) {
		return { error };
	}
}

function getImageConstructor(
	windowTarget: UseImageWindowLike | null | undefined,
	allowGlobalFallback: boolean,
): ImageConstructorLike | undefined {
	return (
		windowTarget?.Image ??
		(allowGlobalFallback && typeof Image !== "undefined" ? Image : undefined)
	);
}

function applyImageOptions(
	image: HTMLImageElement,
	options: UseImageOptions,
): void {
	const {
		alt,
		class: className,
		crossorigin,
		decoding,
		fetchPriority,
		height,
		ismap,
		loading,
		referrerPolicy,
		sizes,
		src,
		srcset,
		usemap,
		width,
	} = options;

	if (sizes != null) {
		image.sizes = sizes;
	}
	if (alt != null) {
		image.alt = alt;
	}
	if (className != null) {
		image.className = className;
	}
	if (loading != null) {
		image.loading = loading;
	}
	if (crossorigin != null) {
		image.crossOrigin = crossorigin;
	}
	if (referrerPolicy != null) {
		image.referrerPolicy = referrerPolicy;
	}
	if (width != null) {
		image.width = width;
	}
	if (height != null) {
		image.height = height;
	}
	if (decoding != null) {
		image.decoding = decoding;
	}
	if (fetchPriority != null) {
		image.fetchPriority = fetchPriority;
	}
	if (ismap != null) {
		image.isMap = ismap;
	}
	if (usemap != null) {
		image.useMap = usemap;
	}

	if (srcset != null) {
		image.srcset = srcset;
	}
	image.src = src;
}

async function loadImage(
	options: UseImageOptions,
	windowTarget: UseImageWindowLike | null | undefined,
	allowGlobalFallback: boolean,
): Promise<HTMLImageElement> {
	const ImageConstructor = getImageConstructor(
		windowTarget,
		allowGlobalFallback,
	);

	if (ImageConstructor === undefined) {
		throw new Error("Image constructor is not available");
	}

	return new Promise((resolve, reject) => {
		const image = new ImageConstructor();
		const cleanup = () => {
			image.onload = null;
			image.onerror = null;
		};

		image.onload = () => {
			cleanup();
			resolve(image);
		};
		image.onerror = (event) => {
			cleanup();
			reject(event);
		};

		applyImageOptions(image, options);
	});
}

export function useImage<
	TWindow extends UseImageWindowLike = UseImageWindowLike,
>(
	options: MaybeValue<UseImageOptions>,
	asyncStateOptions: UseImageAsyncStateOptions<TWindow> = {},
): UseImageReturn {
	const hasWindowOption =
		"window" in asyncStateOptions && asyncStateOptions.window !== undefined;
	const windowTarget = hasWindowOption
		? asyncStateOptions.window
		: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const allowGlobalFallback = !hasWindowOption;
	const { window: _window, ...stateOptions } = asyncStateOptions;
	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const state = useAsyncState<HTMLImageElement | undefined>(
		async () =>
			loadImage(resolveValue(options), currentWindow(), allowGlobalFallback),
		undefined,
		{
			resetOnExecute: true,
			...stateOptions,
		},
	);
	const stopOptionsWatch = watch(
		() => ({
			options: watchImageOptions(options),
			window: currentWindow(),
		}),
		() => {
			void state.execute(stateOptions.delay).catch(() => {});
		},
		{ deep: true, flush: "sync" },
	);

	tryOnScopeDispose(stopOptionsWatch);

	return state;
}
