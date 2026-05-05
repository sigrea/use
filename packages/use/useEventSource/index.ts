import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	EventSourceLike,
	EventSourceWindowLike,
	MaybeTarget,
	MaybeValue,
	UseEventSourceOptions,
	UseEventSourceReturn,
	UseEventSourceSerializer,
	UseEventSourceStatus,
} from "../types";

const OPEN = 1;
const CLOSED = 2;

const defaultSerializer = {
	read: (value?: string) => value,
} satisfies UseEventSourceSerializer<string>;

function isEventSourceSupported<TEventSource extends EventSourceLike>(
	window: EventSourceWindowLike<TEventSource> | null | undefined,
): window is EventSourceWindowLike<TEventSource> & {
	EventSource: NonNullable<EventSourceWindowLike<TEventSource>["EventSource"]>;
} {
	return typeof window?.EventSource === "function";
}

function toStatus(source: EventSourceLike): UseEventSourceStatus {
	if (source.readyState === OPEN) {
		return "OPEN";
	}
	if (source.readyState === CLOSED) {
		return "CLOSED";
	}

	return "CONNECTING";
}

/**
 * Reactive EventSource connection controls.
 */
export function useEventSource<
	Events extends readonly string[] = readonly string[],
	Data = string,
	TEventSource extends EventSourceLike = EventSourceLike,
	TWindow extends
		EventSourceWindowLike<TEventSource> = EventSourceWindowLike<TEventSource>,
>(
	url: MaybeValue<string | URL | null | undefined>,
	events: Events = [] as unknown as Events,
	options: UseEventSourceOptions<Data, TEventSource, TWindow> = {},
): UseEventSourceReturn<Events, Data, TEventSource> {
	const windowTarget: MaybeTarget<TWindow> | undefined =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const withCredentials = options.withCredentials ?? false;
	const immediate = options.immediate ?? true;
	const autoConnect = options.autoConnect ?? true;
	const serializer = (options.serializer ??
		defaultSerializer) as UseEventSourceSerializer<Data>;
	const isSupported = signal(false);
	const eventSource = signal<TEventSource | undefined>(undefined);
	const event = signal<Events[number] | undefined>(undefined);
	const data = signal<Data | undefined>(undefined);
	const status = signal<UseEventSourceStatus>("CLOSED");
	const error = signal<unknown | null>(null);
	const lastEventId = signal("");
	let eventCleanups: Array<() => void> = [];
	let explicitlyClosed = false;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow>(windowTarget);
	const syncSupport = (window: TWindow | null | undefined) => {
		isSupported.value = isEventSourceSupported(window);
	};
	const clearEventCleanups = () => {
		for (const cleanup of eventCleanups) {
			cleanup();
		}
		eventCleanups = [];
	};
	const closeCurrentSource = () => {
		const currentSource = eventSource.value;

		clearEventCleanups();
		eventSource.value = undefined;
		status.value = "CLOSED";
		currentSource?.close();
	};
	const readMessage = (messageEvent: MessageEvent) => {
		data.value = serializer.read(messageEvent.data);
		lastEventId.value = messageEvent.lastEventId;
	};
	const bindSourceEvents = (source: TEventSource) => {
		eventCleanups = [
			listen(
				source,
				"open",
				() => {
					if (eventSource.value !== source || stopped) {
						return;
					}

					status.value = "OPEN";
					error.value = null;
				},
				{ passive: true },
			),
			listen(
				source,
				"error",
				(sourceError) => {
					if (eventSource.value !== source || stopped) {
						return;
					}

					status.value = toStatus(source);
					error.value = sourceError;

					if (source.readyState === CLOSED) {
						closeCurrentSource();
					}
				},
				{ passive: true },
			),
			listen(
				source,
				"message",
				(sourceEvent) => {
					if (eventSource.value !== source || stopped) {
						return;
					}

					event.value = undefined;
					readMessage(sourceEvent as MessageEvent);
				},
				{ passive: true },
			),
		];

		for (const eventName of new Set(events)) {
			if (eventName === "message") {
				continue;
			}

			eventCleanups.push(
				listen(
					source,
					eventName,
					(sourceEvent) => {
						if (eventSource.value !== source || stopped) {
							return;
						}

						event.value = eventName;
						readMessage(sourceEvent as MessageEvent);
					},
					{ passive: true },
				),
			);
		}
	};
	function connect() {
		if (stopped || explicitlyClosed) {
			return;
		}

		const window = currentWindow();
		const nextUrl = resolveValue(url);
		syncSupport(window);

		if (
			nextUrl === null ||
			nextUrl === undefined ||
			!isEventSourceSupported(window)
		) {
			closeCurrentSource();
			return;
		}

		closeCurrentSource();

		try {
			const nextSource = new window.EventSource(nextUrl, {
				withCredentials,
			});
			eventSource.value = nextSource;
			error.value = null;
			status.value = toStatus(nextSource);
			bindSourceEvents(nextSource);
		} catch (caughtError) {
			error.value = caughtError;
			status.value = "CLOSED";
		}
	}

	const open = () => {
		if (stopped) {
			return;
		}

		closeCurrentSource();
		explicitlyClosed = false;
		connect();
	};
	const close = () => {
		explicitlyClosed = true;
		closeCurrentSource();
	};
	let isInitialWatchRun = true;
	const stopWatch = watch(
		() => ({
			url: resolveValue(url),
			window: currentWindow(),
		}),
		({ url: nextUrl, window }) => {
			const isInitial = isInitialWatchRun;
			isInitialWatchRun = false;
			syncSupport(window);

			if (
				nextUrl === null ||
				nextUrl === undefined ||
				!isEventSourceSupported(window)
			) {
				closeCurrentSource();
				return;
			}

			if (explicitlyClosed || (isInitial ? !immediate : !autoConnect)) {
				return;
			}

			connect();
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWatch();
		close();
	};

	tryOnScopeDispose(stop);

	return {
		data: readonly(data),
		status: readonly(status),
		event: readonly(event),
		error: readonly(error),
		eventSource: readonly(eventSource),
		lastEventId: readonly(lastEventId),
		isSupported: readonly(isSupported),
		open,
		close,
		stop,
	};
}
