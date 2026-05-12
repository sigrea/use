import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import type {
	BroadcastChannelLike,
	BroadcastChannelWindowLike,
	MaybeTarget,
	UseBroadcastChannelOptions,
	UseBroadcastChannelReturn,
} from "../types";

function isBroadcastChannelSupported(
	windowTarget: BroadcastChannelWindowLike | null | undefined,
): windowTarget is BroadcastChannelWindowLike & {
	BroadcastChannel: { new (name: string): BroadcastChannelLike };
} {
	return typeof windowTarget?.BroadcastChannel === "function";
}

/**
 * Reactive BroadcastChannel.
 */
export function useBroadcastChannel<Data = unknown, Payload = Data>(
	options: UseBroadcastChannelOptions,
): UseBroadcastChannelReturn<Data, Payload> {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<BroadcastChannelWindowLike> | undefined);
	const isSupported = signal(false);
	const isClosed = signal(true);
	const channel = signal<BroadcastChannelLike | undefined>(undefined);
	const data = signal<Data | undefined>(undefined);
	const error = signal<unknown | null>(null);
	let eventCleanups: Array<() => void> = [];
	let manuallyClosed = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<BroadcastChannelWindowLike>(windowTarget);
	const clearEventCleanups = () => {
		for (const cleanup of eventCleanups) {
			cleanup();
		}
		eventCleanups = [];
	};
	const closeCurrentChannel = () => {
		clearEventCleanups();
		channel.value?.close();
		channel.value = undefined;
		isClosed.value = true;
	};
	const openChannel = (
		window: BroadcastChannelWindowLike | null | undefined,
		name: string,
	) => {
		closeCurrentChannel();
		isSupported.value = isBroadcastChannelSupported(window);
		if (manuallyClosed) {
			return;
		}

		error.value = null;
		if (!isBroadcastChannelSupported(window)) {
			return;
		}

		let nextChannel: BroadcastChannelLike;
		try {
			nextChannel = new window.BroadcastChannel(name);
		} catch (caughtError) {
			error.value = caughtError;
			isSupported.value = false;
			return;
		}
		channel.value = nextChannel;
		isClosed.value = false;
		eventCleanups = [
			listen(
				nextChannel,
				"message",
				(event) => {
					data.value = (event as MessageEvent<Data>).data;
				},
				{ passive: true },
			),
			listen(
				nextChannel,
				"messageerror",
				(event) => {
					error.value = event;
				},
				{ passive: true },
			),
		];
	};

	const close = () => {
		manuallyClosed = true;
		closeCurrentChannel();
	};
	const postMessage = (payload: Payload) => {
		channel.value?.postMessage(payload);
	};
	const stopWatch = watch(
		() => ({
			name: resolveValue(options.name),
			window: currentWindow(),
		}),
		({ name, window }) => {
			openChannel(window, name);
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		stopWatch();
		close();
	};

	return {
		isSupported: readonly(isSupported),
		isClosed: readonly(isClosed),
		channel: readonly(channel),
		data: readonly(data),
		error: readonly(error),
		postMessage,
		close,
		stop,
	};
}
