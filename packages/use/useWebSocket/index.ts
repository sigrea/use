import { readonly, signal, watch } from "@sigrea/core";

import {
	defaultWindow,
	listen,
	resolveTarget,
	resolveValue,
} from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseWebSocketAutoReconnectOptions,
	UseWebSocketHeartbeatMessage,
	UseWebSocketHeartbeatOptions,
	UseWebSocketOptions,
	UseWebSocketReturn,
	UseWebSocketSendData,
	UseWebSocketStatus,
	UseWebSocketWindowLike,
	WebSocketConstructorLike,
	WebSocketLike,
} from "../types";
import { useIntervalFn } from "../useIntervalFn";

const DEFAULT_CLOSE_CODE = 1000;
const DEFAULT_HEARTBEAT_MESSAGE = "ping";
const CONNECTING = 0;
const OPEN = 1;

type SupportedWebSocketWindow<TWebSocket extends WebSocketLike> =
	UseWebSocketWindowLike<TWebSocket> & {
		readonly WebSocket: WebSocketConstructorLike<TWebSocket>;
	};

function isWebSocketConstructor<TWebSocket extends WebSocketLike>(
	value: unknown,
): value is WebSocketConstructorLike<TWebSocket> {
	return typeof value === "function";
}

function isWebSocketWindow<TWebSocket extends WebSocketLike>(
	window: UseWebSocketWindowLike<TWebSocket> | null | undefined,
): window is SupportedWebSocketWindow<TWebSocket> {
	return isWebSocketConstructor<TWebSocket>(window?.WebSocket);
}

function toStatus(socket: WebSocketLike | undefined): UseWebSocketStatus {
	if (socket?.readyState === OPEN) {
		return "OPEN";
	}
	if (socket?.readyState === CONNECTING) {
		return "CONNECTING";
	}

	return "CLOSED";
}

function isSocketOpen(
	socket: WebSocketLike | undefined,
): socket is WebSocketLike {
	return socket?.readyState === OPEN;
}

function resolveHeartbeatOptions(
	heartbeat: UseWebSocketOptions["heartbeat"],
): UseWebSocketHeartbeatOptions | undefined {
	if (heartbeat === undefined || heartbeat === false) {
		return undefined;
	}

	return heartbeat === true ? {} : heartbeat;
}

function resolveReconnectOptions(
	autoReconnect: UseWebSocketOptions["autoReconnect"],
): UseWebSocketAutoReconnectOptions | undefined {
	if (autoReconnect === undefined || autoReconnect === false) {
		return undefined;
	}

	return autoReconnect === true ? {} : autoReconnect;
}

function normalizeProtocols(
	protocols: string | readonly string[] | undefined,
): string | string[] | undefined {
	if (protocols === undefined || typeof protocols === "string") {
		return protocols;
	}

	return [...protocols];
}

function protocolsKey(
	protocols: string | readonly string[] | undefined,
): string {
	if (protocols === undefined) {
		return "";
	}
	if (typeof protocols === "string") {
		return protocols;
	}

	return protocols.join("\u0000");
}

function resolveHeartbeatMessage(
	value: MaybeValue<UseWebSocketHeartbeatMessage> | undefined,
): UseWebSocketHeartbeatMessage {
	return value === undefined ? DEFAULT_HEARTBEAT_MESSAGE : resolveValue(value);
}

function resolveDelay(
	delay: UseWebSocketAutoReconnectOptions["delay"],
	retried: number,
): number {
	if (typeof delay === "function") {
		return delay(retried);
	}

	return delay ?? 1000;
}

/**
 * Reactive WebSocket connection controls.
 */
export function useWebSocket<
	Data = unknown,
	TWebSocket extends WebSocketLike = WebSocket,
	TWindow extends
		UseWebSocketWindowLike<TWebSocket> = UseWebSocketWindowLike<TWebSocket>,
>(
	url: MaybeValue<string | URL | null | undefined>,
	options: UseWebSocketOptions<TWebSocket, TWindow> = {},
): UseWebSocketReturn<Data, TWebSocket> {
	const windowTarget: MaybeTarget<TWindow | null | undefined> =
		"window" in options
			? options.window
			: (defaultWindow as TWindow | undefined);
	const hasWebSocketOption = "webSocket" in options;
	const protocols: MaybeValue<string | readonly string[] | undefined> =
		options.protocols;
	const immediate = options.immediate ?? true;
	const autoConnect = options.autoConnect ?? true;
	const autoClose = options.autoClose ?? true;
	const data = signal<Data | null>(null);
	const status = signal<UseWebSocketStatus>("CLOSED");
	const ws = signal<TWebSocket | undefined>(undefined);
	const isSupported = signal(false);
	const error = signal<unknown | null>(null);
	const buffer: UseWebSocketSendData[] = [];
	const heartbeatOptions = resolveHeartbeatOptions(options.heartbeat);
	const socketCleanups = new Map<TWebSocket, Array<() => void>>();
	const closingSockets = new Set<TWebSocket>();
	let retryTimer: ReturnType<typeof setTimeout> | undefined;
	let pongTimer: ReturnType<typeof setTimeout> | undefined;
	let heartbeatControls:
		| {
				pause(): void;
				resume(): void;
		  }
		| undefined;
	let explicitlyClosed = false;
	let retried = 0;
	let stopped = false;

	const currentWindow = () => resolveTarget(windowTarget);
	const currentConstructor = () =>
		hasWebSocketOption
			? resolveValue(options.webSocket)
			: currentWindow()?.WebSocket;
	const syncSupport = (
		socketConstructor: WebSocketConstructorLike<TWebSocket> | null | undefined,
	) => {
		isSupported.value = isWebSocketConstructor<TWebSocket>(socketConstructor);
	};
	const clearSocketCleanups = (socket?: TWebSocket) => {
		if (socket !== undefined) {
			const cleanups = socketCleanups.get(socket) ?? [];
			for (const cleanup of cleanups) {
				cleanup();
			}
			socketCleanups.delete(socket);
			return;
		}

		for (const cleanups of socketCleanups.values()) {
			for (const cleanup of cleanups) {
				cleanup();
			}
		}
		socketCleanups.clear();
	};
	const clearClosingSockets = () => {
		for (const socket of closingSockets) {
			clearSocketCleanups(socket);
		}
		closingSockets.clear();
	};
	const clearRetry = () => {
		if (retryTimer !== undefined) {
			clearTimeout(retryTimer);
			retryTimer = undefined;
		}
	};
	const clearPong = () => {
		if (pongTimer !== undefined) {
			clearTimeout(pongTimer);
			pongTimer = undefined;
		}
	};
	const pauseHeartbeat = () => {
		clearPong();
		heartbeatControls?.pause();
	};
	const closeSocket = (
		socket: TWebSocket | undefined,
		code = DEFAULT_CLOSE_CODE,
		reason?: string,
	) => {
		if (socket === undefined) {
			return;
		}

		try {
			socket.close(code, reason);
		} catch (caughtError) {
			error.value = caughtError;
		}
	};
	const clearCurrentSocket = (
		closeCurrent: boolean,
		code = DEFAULT_CLOSE_CODE,
		reason?: string,
	) => {
		const currentSocket = ws.value;
		if (currentSocket !== undefined) {
			clearSocketCleanups(currentSocket);
			closingSockets.delete(currentSocket);
		}
		pauseHeartbeat();
		ws.value = undefined;
		status.value = "CLOSED";
		if (closeCurrent) {
			closeSocket(currentSocket, code, reason);
		}
	};
	const closeCurrentSocket = (code = DEFAULT_CLOSE_CODE, reason?: string) => {
		const currentSocket = ws.value;
		if (currentSocket === undefined) {
			status.value = "CLOSED";
			return;
		}

		pauseHeartbeat();
		closingSockets.add(currentSocket);
		ws.value = undefined;
		status.value = "CLOSED";
		closeSocket(currentSocket, code, reason);
	};
	const clearBuffer = () => {
		buffer.length = 0;
	};
	const flushBuffer = () => {
		const socket = ws.value;
		if (!isSocketOpen(socket)) {
			return;
		}

		while (buffer.length > 0 && isSocketOpen(socket)) {
			const nextData = buffer.shift();
			if (nextData === undefined) {
				return;
			}

			try {
				socket.send(nextData);
			} catch (caughtError) {
				error.value = caughtError;
				return;
			}
		}
	};
	const scheduleReconnect = () => {
		const reconnectOptions = resolveReconnectOptions(options.autoReconnect);
		if (stopped || explicitlyClosed || reconnectOptions === undefined) {
			return;
		}

		const { retries = -1, onFailed } = reconnectOptions;
		const canRetry =
			typeof retries === "function"
				? retries(retried)
				: retries < 0 || retried < retries;
		if (!canRetry) {
			onFailed?.();
			return;
		}

		retried += 1;
		clearRetry();
		retryTimer = setTimeout(
			() => {
				retryTimer = undefined;
				connect();
			},
			resolveDelay(reconnectOptions.delay, retried),
		);
	};
	const isHeartbeatResponse = (message: unknown): boolean => {
		if (heartbeatOptions === undefined) {
			return false;
		}

		const pingMessage = resolveHeartbeatMessage(heartbeatOptions.message);
		const responseMessage =
			heartbeatOptions.responseMessage === undefined
				? pingMessage
				: resolveValue(heartbeatOptions.responseMessage);

		return message === responseMessage;
	};
	const startPongTimeout = () => {
		if (heartbeatOptions === undefined || pongTimer !== undefined) {
			return;
		}

		pongTimer = setTimeout(
			() => {
				pongTimer = undefined;
				const socket = ws.value;
				if (socket === undefined || stopped) {
					return;
				}

				explicitlyClosed = false;
				closeSocket(socket);
			},
			resolveValue(heartbeatOptions.pongTimeout ?? 1000),
		);
	};
	const bindSocketEvents = (socket: TWebSocket) => {
		socketCleanups.set(socket, [
			listen(
				socket,
				"open",
				() => {
					if (stopped || ws.value !== socket) {
						return;
					}

					status.value = "OPEN";
					error.value = null;
					retried = 0;
					options.onConnected?.(socket);
					heartbeatControls?.resume();
					flushBuffer();
				},
				{ passive: true },
			),
			listen(
				socket,
				"message",
				(event) => {
					if (stopped || ws.value !== socket) {
						return;
					}

					const messageEvent = event as MessageEvent;
					if (heartbeatOptions !== undefined) {
						clearPong();
						if (isHeartbeatResponse(messageEvent.data)) {
							return;
						}
					}

					data.value = messageEvent.data as Data;
					options.onMessage?.(socket, messageEvent);
				},
				{ passive: true },
			),
			listen(
				socket,
				"error",
				(event) => {
					if (stopped || ws.value !== socket) {
						return;
					}

					error.value = event;
					options.onError?.(socket, event);
				},
				{ passive: true },
			),
			listen(
				socket,
				"close",
				(event) => {
					const isCurrentSocket = ws.value === socket;
					const isClosingSocket = closingSockets.has(socket);
					if (stopped || (!isCurrentSocket && !isClosingSocket)) {
						return;
					}

					clearSocketCleanups(socket);
					closingSockets.delete(socket);
					if (isCurrentSocket) {
						pauseHeartbeat();
						ws.value = undefined;
						status.value = "CLOSED";
					}
					options.onDisconnected?.(socket, event as CloseEvent);
					if (isCurrentSocket) {
						scheduleReconnect();
					}
				},
				{ passive: true },
			),
		]);
	};

	function connect(): void {
		if (stopped || explicitlyClosed) {
			return;
		}

		clearRetry();
		const socketConstructor = currentConstructor();
		const nextUrl = resolveValue(url);
		syncSupport(socketConstructor);
		if (
			nextUrl === null ||
			nextUrl === undefined ||
			!isWebSocketConstructor<TWebSocket>(socketConstructor)
		) {
			clearCurrentSocket(true);
			return;
		}

		clearCurrentSocket(true);

		try {
			const nextProtocols = normalizeProtocols(resolveValue(protocols));
			const nextSocket =
				nextProtocols === undefined
					? new socketConstructor(nextUrl)
					: new socketConstructor(nextUrl, nextProtocols);
			const nextBinaryType = resolveValue(options.binaryType);
			if (nextBinaryType !== undefined) {
				nextSocket.binaryType = nextBinaryType;
			}

			ws.value = nextSocket;
			status.value = toStatus(nextSocket);
			error.value = null;
			bindSocketEvents(nextSocket);
		} catch (caughtError) {
			error.value = caughtError;
			ws.value = undefined;
			status.value = "CLOSED";
		}
	}

	const open = () => {
		if (stopped) {
			return;
		}

		clearRetry();
		explicitlyClosed = false;
		retried = 0;
		connect();
	};
	const close = (code = DEFAULT_CLOSE_CODE, reason?: string): void => {
		explicitlyClosed = true;
		clearRetry();
		clearBuffer();
		closeCurrentSocket(code, reason);
	};
	const send = (nextData: UseWebSocketSendData, useBuffer = true): boolean => {
		const socket = ws.value;
		if (!isSocketOpen(socket)) {
			if (useBuffer) {
				buffer.push(nextData);
			}
			return false;
		}

		flushBuffer();
		if (!isSocketOpen(socket)) {
			if (useBuffer) {
				buffer.push(nextData);
			}
			return false;
		}

		try {
			socket.send(nextData);
			return true;
		} catch (caughtError) {
			error.value = caughtError;
			return false;
		}
	};

	if (heartbeatOptions !== undefined) {
		const scheduler =
			heartbeatOptions.scheduler ??
			((callback: () => void) =>
				useIntervalFn(callback, heartbeatOptions.interval ?? 1000, {
					immediate: false,
				}));
		heartbeatControls = scheduler(() => {
			send(resolveHeartbeatMessage(heartbeatOptions.message), false);
			startPongTimeout();
		});
		heartbeatControls.pause();
	}

	let isInitialWatchRun = true;
	const stopConnectionWatch = watch(
		() => {
			const nextProtocols = resolveValue(protocols);
			return {
				constructor: currentConstructor(),
				protocolsKey: protocolsKey(nextProtocols),
				url: resolveValue(url),
			};
		},
		(nextValue, previousValue) => {
			const isInitial = isInitialWatchRun;
			isInitialWatchRun = false;
			syncSupport(nextValue.constructor);

			if (
				previousValue !== undefined &&
				(nextValue.url !== previousValue.url ||
					nextValue.constructor !== previousValue.constructor ||
					nextValue.protocolsKey !== previousValue.protocolsKey)
			) {
				clearBuffer();
				retried = 0;
			}

			if (
				nextValue.url === null ||
				nextValue.url === undefined ||
				!isWebSocketConstructor<TWebSocket>(nextValue.constructor)
			) {
				clearCurrentSocket(true);
				return;
			}

			const shouldConnect = isInitial ? immediate : autoConnect;
			if (!shouldConnect) {
				return;
			}
			if (!isInitial) {
				explicitlyClosed = false;
			}
			if (explicitlyClosed) {
				return;
			}

			connect();
		},
		{ immediate: true, flush: "sync" },
	);
	const stopBeforeUnload = autoClose
		? listen(
				() => currentWindow(),
				"beforeunload",
				() => {
					close();
				},
				{ passive: true },
			)
		: () => {};
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopConnectionWatch();
		stopBeforeUnload();
		explicitlyClosed = true;
		clearRetry();
		clearBuffer();
		clearCurrentSocket(true);
		clearClosingSockets();
		clearSocketCleanups();
		heartbeatControls?.pause();
	};

	if (autoClose) {
		tryOnScopeDispose(stop);
	}

	return {
		data: readonly(data),
		status: readonly(status),
		ws: readonly(ws),
		isSupported: readonly(isSupported),
		error: readonly(error),
		open,
		close,
		send,
		stop,
	};
}
