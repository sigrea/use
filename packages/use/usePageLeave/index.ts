import { readonly, signal, watch } from "@sigrea/core";
import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UsePageLeaveOptions,
	UsePageLeaveReturn,
	WindowLike,
} from "../types";

type MouseEventWithLegacyToElement = MouseEvent & {
	readonly toElement?: EventTarget | null;
};

function relatedTarget(event: MouseEvent): EventTarget | null {
	return (
		event.relatedTarget ??
		(event as MouseEventWithLegacyToElement).toElement ??
		null
	);
}

export function usePageLeave<TWindow extends WindowLike = WindowLike>(
	options: UsePageLeaveOptions<TWindow> = {},
): UsePageLeaveReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const isLeft = signal(false);
	const stop = watch(
		() =>
			windowTarget === undefined
				? undefined
				: resolveTarget<TWindow>(windowTarget),
		(windowValue, _previousValue, onCleanup) => {
			isLeft.value = false;

			if (windowValue === undefined || windowValue === null) {
				return;
			}

			const leave = (event: Event) => {
				isLeft.value = relatedTarget(event as MouseEvent) === null;
			};
			const enter = () => {
				isLeft.value = false;
			};
			const cleanups = [
				listen(windowValue, "mouseout", leave, { passive: true }),
			];

			if (windowValue.document) {
				cleanups.push(
					listen(windowValue.document, "mouseleave", leave, {
						passive: true,
					}),
					listen(windowValue.document, "mouseenter", enter, {
						passive: true,
					}),
				);
			}

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		isLeft: readonly(isLeft),
		stop,
	};
}
