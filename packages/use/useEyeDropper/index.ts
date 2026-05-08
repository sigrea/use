import { computed, readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	EyeDropperLike,
	EyeDropperOpenOptions,
	EyeDropperResult,
	MaybeTarget,
	UseEyeDropperOptions,
	UseEyeDropperReturn,
	UseEyeDropperWindowLike,
} from "../types";

function isEyeDropperSupported<TEyeDropper extends EyeDropperLike>(
	window: UseEyeDropperWindowLike<TEyeDropper> | null | undefined,
): window is UseEyeDropperWindowLike<TEyeDropper> & {
	EyeDropper: NonNullable<UseEyeDropperWindowLike<TEyeDropper>["EyeDropper"]>;
} {
	return typeof window?.EyeDropper === "function";
}

/**
 * Reactive EyeDropper API controls.
 */
export function useEyeDropper<
	TEyeDropper extends EyeDropperLike = EyeDropperLike,
	TWindow extends
		UseEyeDropperWindowLike<TEyeDropper> = UseEyeDropperWindowLike<TEyeDropper>,
>(
	options: UseEyeDropperOptions<TEyeDropper, TWindow> = {},
): UseEyeDropperReturn<TEyeDropper> {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const sRGBHex = signal(options.initialValue ?? "");
	const isOpen = signal(false);
	const error = signal<unknown | null>(null);
	let pendingOpen: Promise<EyeDropperResult | undefined> | undefined;
	let pendingWindow: TWindow | undefined;
	let activeAbort:
		| {
				cleanup: () => void;
				controller: AbortController;
		  }
		| undefined;
	let executionCount = 0;
	let disposed = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const isSupported = computed(() => isEyeDropperSupported(currentWindow()));
	const shouldApplyResult = (window: TWindow, executionId: number) =>
		!disposed && executionId === executionCount && currentWindow() === window;
	const createOpenOptions = (
		openOptions: EyeDropperOpenOptions | undefined,
	): EyeDropperOpenOptions => {
		const controller = new AbortController();
		let cleanup = () => {};
		const sourceSignal = openOptions?.signal;

		if (sourceSignal !== undefined) {
			if (sourceSignal.aborted) {
				controller.abort(sourceSignal.reason);
			} else {
				const abort = () => {
					controller.abort(sourceSignal.reason);
				};
				sourceSignal.addEventListener("abort", abort, { once: true });
				cleanup = () => {
					sourceSignal.removeEventListener("abort", abort);
				};
			}
		}

		activeAbort = {
			cleanup,
			controller,
		};

		return { signal: controller.signal };
	};
	const clearActiveAbort = () => {
		activeAbort?.cleanup();
		activeAbort = undefined;
	};
	const clearPendingOpen = () => {
		pendingOpen = undefined;
		pendingWindow = undefined;
		clearActiveAbort();
	};
	const abort = () => {
		executionCount += 1;
		activeAbort?.controller.abort();
		clearPendingOpen();
		isOpen.value = false;
	};

	const open = async (
		openOptions?: EyeDropperOpenOptions,
	): Promise<EyeDropperResult | undefined> => {
		if (disposed) {
			return undefined;
		}

		if (pendingOpen !== undefined) {
			return pendingOpen;
		}

		const window = currentWindow();
		error.value = null;

		if (!isEyeDropperSupported(window)) {
			return undefined;
		}

		isOpen.value = true;
		executionCount += 1;
		const executionId = executionCount;
		const nativeOpenOptions = createOpenOptions(openOptions);
		pendingWindow = window;

		const openPromise = (async () => {
			try {
				const result = await new window.EyeDropper().open(nativeOpenOptions);

				if (shouldApplyResult(window, executionId)) {
					error.value = null;
					sRGBHex.value = result.sRGBHex;
					return result;
				}

				return undefined;
			} catch (caughtError) {
				if (shouldApplyResult(window, executionId)) {
					error.value = caughtError;
				}

				return undefined;
			}
		})();

		pendingOpen = openPromise.finally(() => {
			if (executionId === executionCount) {
				isOpen.value = false;
				clearPendingOpen();
			}
		});

		return pendingOpen;
	};
	const stopWindowWatch = watch(
		currentWindow,
		(window) => {
			if (pendingWindow !== undefined && window !== pendingWindow) {
				abort();
			}
		},
		{ flush: "sync" },
	);
	const stop = () => {
		if (disposed) {
			return;
		}

		disposed = true;
		stopWindowWatch();
		abort();
	};

	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		isOpen: readonly(isOpen),
		sRGBHex: readonly(sRGBHex),
		error: readonly(error),
		open,
		abort,
		stop,
	};
}
