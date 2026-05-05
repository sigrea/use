import { readonly, signal } from "@sigrea/core";
import type { Signal } from "@sigrea/core";

import { createEventHook } from "../createEventHook";
import type { UseConfirmDialogResult, UseConfirmDialogReturn } from "../types";

export function useConfirmDialog<
	OpenData = unknown,
	ConfirmData = unknown,
	CancelData = unknown,
>(
	isOpen: Signal<boolean> = signal(false),
): UseConfirmDialogReturn<OpenData, ConfirmData, CancelData> {
	const openHook = createEventHook<[OpenData | undefined]>();
	const confirmHook = createEventHook<[ConfirmData | undefined]>();
	const cancelHook = createEventHook<[CancelData | undefined]>();
	let resolvePromise:
		| ((result: UseConfirmDialogResult<ConfirmData, CancelData>) => void)
		| undefined;

	const open = (data?: OpenData) => {
		resolvePromise?.({
			isCanceled: true,
		});
		resolvePromise = undefined;
		openHook.trigger(data);
		isOpen.value = true;

		return new Promise<UseConfirmDialogResult<ConfirmData, CancelData>>(
			(resolve) => {
				resolvePromise = resolve;
			},
		);
	};

	const confirm = (data?: ConfirmData) => {
		isOpen.value = false;
		resolvePromise?.({
			data,
			isCanceled: false,
		});
		resolvePromise = undefined;
		confirmHook.trigger(data);
	};

	const cancel = (data?: CancelData) => {
		isOpen.value = false;
		resolvePromise?.({
			data,
			isCanceled: true,
		});
		resolvePromise = undefined;
		cancelHook.trigger(data);
	};

	return {
		isOpen: readonly(isOpen),
		open,
		confirm,
		cancel,
		onOpen: openHook.on,
		onConfirm: confirmHook.on,
		onCancel: cancelHook.on,
	};
}
