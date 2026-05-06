import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseObjectUrlObject,
	UseObjectUrlOptions,
	UseObjectUrlReturn,
	UseObjectUrlWindowLike,
} from "../types";

export function useObjectUrl(
	object: MaybeValue<UseObjectUrlObject | null | undefined>,
	options: UseObjectUrlOptions = {},
): UseObjectUrlReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<UseObjectUrlWindowLike> | undefined);
	const objectUrl = signal<string | undefined>(undefined);

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<UseObjectUrlWindowLike | null | undefined>(windowTarget);
	const release = (
		windowValue: UseObjectUrlWindowLike | null | undefined,
	): void => {
		const currentUrl = objectUrl.value;
		if (currentUrl === undefined) {
			return;
		}

		windowValue?.URL?.revokeObjectURL(currentUrl);
		objectUrl.value = undefined;
	};
	const stop = watch(
		() => ({
			object: resolveValue(object),
			window: currentWindow(),
		}),
		({ object: nextObject, window }, _previousValue, onCleanup) => {
			release(window);

			const urlApi = window?.URL;
			if (nextObject === null || nextObject === undefined || !urlApi) {
				return;
			}

			const nextUrl = urlApi.createObjectURL(nextObject);
			objectUrl.value = nextUrl;
			onCleanup(() => {
				urlApi.revokeObjectURL(nextUrl);
				if (objectUrl.value === nextUrl) {
					objectUrl.value = undefined;
				}
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const dispose = (): void => {
		const windowValue = currentWindow();
		stop();
		release(windowValue);
	};
	tryOnScopeDispose(dispose);

	return {
		url: readonly(objectUrl),
		stop: dispose,
	};
}
