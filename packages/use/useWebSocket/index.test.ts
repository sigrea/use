import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseWebSocketOptions,
	UseWebSocketSendData,
	UseWebSocketWindowLike,
	WebSocketConstructorLike,
	WebSocketLike,
} from "../types";
import { useWebSocket } from "./index";

class FakeWebSocket extends EventTarget implements WebSocketLike {
	static readonly CONNECTING = 0;
	static readonly OPEN = 1;
	static readonly CLOSING = 2;
	static readonly CLOSED = 3;
	static instances: FakeWebSocket[] = [];

	binaryType: BinaryType = "blob";
	readyState = FakeWebSocket.CONNECTING;
	deferCloseEvent = false;
	readonly sent: UseWebSocketSendData[] = [];
	readonly closeCalls: Array<{ code?: number; reason?: string }> = [];

	constructor(
		readonly url: string | URL,
		readonly protocols?: string | readonly string[],
	) {
		super();
		FakeWebSocket.instances.push(this);
	}

	send(data: UseWebSocketSendData): void {
		if (this.readyState !== FakeWebSocket.OPEN) {
			throw new Error("socket is not open");
		}

		this.sent.push(data);
	}

	close(code?: number, reason?: string): void {
		this.closeCalls.push({ code, reason });
		this.readyState = FakeWebSocket.CLOSING;
		if (!this.deferCloseEvent) {
			this.finishClose(code, reason);
		}
	}

	finishClose(code?: number, reason?: string): void {
		this.readyState = FakeWebSocket.CLOSED;
		this.dispatchEvent(
			new CloseEvent("close", {
				code: code ?? 1000,
				reason: reason ?? "",
			}),
		);
	}

	open(): void {
		this.readyState = FakeWebSocket.OPEN;
		this.dispatchEvent(new Event("open"));
	}

	message(data: unknown): void {
		this.dispatchEvent(new MessageEvent("message", { data }));
	}

	fail(): void {
		this.dispatchEvent(new Event("error"));
	}

	serverClose(code = 1000, reason = ""): void {
		this.readyState = FakeWebSocket.CLOSED;
		this.dispatchEvent(new CloseEvent("close", { code, reason }));
	}
}

class FakeWindow
	extends EventTarget
	implements UseWebSocketWindowLike<FakeWebSocket>
{
	constructor(
		readonly WebSocket: WebSocketConstructorLike<FakeWebSocket> | null = FakeWebSocket,
	) {
		super();
	}

	beforeUnload(): void {
		this.dispatchEvent(new Event("beforeunload"));
	}
}

function resetSockets(): void {
	FakeWebSocket.instances = [];
	vi.useRealTimers();
}

function useFakeWebSocket<Data = unknown>(
	url: string | URL | null | undefined,
	options: UseWebSocketOptions<FakeWebSocket, FakeWindow> = {},
) {
	return useWebSocket<Data, FakeWebSocket, FakeWindow>(url, options);
}

describe("useWebSocket", () => {
	afterEach(() => {
		resetSockets();
	});

	it("stays safe without WebSocket support", () => {
		const socket = useFakeWebSocket("ws://example.test", { window: null });

		expect(socket.isSupported.value).toBe(false);
		expect(socket.status.value).toBe("CLOSED");
		expect(socket.ws.value).toBeUndefined();
		expect(socket.data.value).toBeNull();
		expect(socket.send("message", false)).toBe(false);
		socket.open();
		socket.close();
		socket.stop();
	});

	it("opens immediately and updates status on socket events", () => {
		const onConnected = vi.fn();
		const onMessage = vi.fn();
		const onError = vi.fn();
		const onDisconnected = vi.fn();
		const socket = useFakeWebSocket<string>("ws://example.test", {
			onConnected,
			onDisconnected,
			onError,
			onMessage,
			window: new FakeWindow(),
		});
		const nativeSocket = FakeWebSocket.instances[0];

		expect(socket.isSupported.value).toBe(true);
		expect(socket.status.value).toBe("CONNECTING");
		expect(socket.ws.value).toBe(nativeSocket);

		nativeSocket?.open();
		expect(socket.status.value).toBe("OPEN");
		expect(onConnected).toHaveBeenCalledWith(nativeSocket);

		nativeSocket?.message("hello");
		expect(socket.data.value).toBe("hello");
		expect(onMessage).toHaveBeenCalledOnce();

		nativeSocket?.fail();
		expect(socket.error.value).toBeInstanceOf(Event);
		expect(onError).toHaveBeenCalledOnce();

		nativeSocket?.serverClose(4000, "done");
		expect(socket.status.value).toBe("CLOSED");
		expect(socket.ws.value).toBeUndefined();
		expect(onDisconnected).toHaveBeenCalledOnce();
	});

	it("buffers sends until the socket opens", () => {
		const socket = useFakeWebSocket("ws://example.test", {
			immediate: false,
			window: new FakeWindow(),
		});

		expect(socket.send("queued")).toBe(false);
		socket.open();
		const nativeSocket = FakeWebSocket.instances[0];
		nativeSocket?.open();

		expect(nativeSocket?.sent).toEqual(["queued"]);
		expect(socket.send("live")).toBe(true);
		expect(nativeSocket?.sent).toEqual(["queued", "live"]);
	});

	it("closes stale sockets and drops buffered data when the url changes", () => {
		const url = signal<string | URL | null | undefined>("ws://one.test");
		const socket = useWebSocket<string, FakeWebSocket, FakeWindow>(url, {
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];
		expect(socket.send("queued")).toBe(false);

		url.value = "ws://two.test";
		const secondSocket = FakeWebSocket.instances[1];
		firstSocket?.message("stale");
		secondSocket?.open();

		expect(firstSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);
		expect(socket.data.value).toBeNull();
		expect(secondSocket?.sent).toEqual([]);
		expect(socket.ws.value).toBe(secondSocket);
	});

	it("does not reconnect on url changes when autoConnect is disabled", () => {
		const url = signal<string | URL | null | undefined>("ws://one.test");
		useWebSocket<unknown, FakeWebSocket, FakeWindow>(url, {
			autoConnect: false,
			window: new FakeWindow(),
		});

		url.value = "ws://two.test";

		expect(FakeWebSocket.instances).toHaveLength(1);
	});

	it("reconnects after server close and stops after manual close", () => {
		vi.useFakeTimers();
		const onFailed = vi.fn();
		const onDisconnected = vi.fn();
		const socket = useFakeWebSocket("ws://example.test", {
			autoReconnect: { delay: 50, onFailed, retries: 1 },
			onDisconnected,
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];

		firstSocket?.serverClose();
		vi.advanceTimersByTime(49);
		expect(FakeWebSocket.instances).toHaveLength(1);
		vi.advanceTimersByTime(1);
		expect(FakeWebSocket.instances).toHaveLength(2);

		const secondSocket = FakeWebSocket.instances[1];
		secondSocket?.serverClose();
		vi.advanceTimersByTime(50);
		expect(FakeWebSocket.instances).toHaveLength(2);
		expect(onFailed).toHaveBeenCalledOnce();

		socket.open();
		const thirdSocket = FakeWebSocket.instances[2];
		socket.close();
		vi.advanceTimersByTime(50);
		expect(FakeWebSocket.instances).toHaveLength(3);
		expect(onDisconnected).toHaveBeenCalledTimes(3);
		expect(thirdSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);
	});

	it("reconnects on url changes after a manual close", () => {
		const url = signal<string | URL | null | undefined>("ws://one.test");
		const socket = useWebSocket<unknown, FakeWebSocket, FakeWindow>(url, {
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];

		socket.close();
		url.value = "ws://two.test";

		expect(firstSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);
		expect(FakeWebSocket.instances).toHaveLength(2);
		expect(socket.ws.value).toBe(FakeWebSocket.instances[1]);
	});

	it("clears pending reconnects when the url changes", () => {
		vi.useFakeTimers();
		const url = signal<string | URL | null | undefined>("ws://one.test");
		useWebSocket<unknown, FakeWebSocket, FakeWindow>(url, {
			autoReconnect: { delay: 50 },
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];

		firstSocket?.serverClose();
		url.value = "ws://two.test";
		const secondSocket = FakeWebSocket.instances[1];

		vi.advanceTimersByTime(50);

		expect(FakeWebSocket.instances).toHaveLength(2);
		expect(secondSocket?.closeCalls).toEqual([]);
	});

	it("resets retry count when the url changes", () => {
		vi.useFakeTimers();
		const onFailed = vi.fn();
		const url = signal<string | URL | null | undefined>("ws://one.test");
		useWebSocket<unknown, FakeWebSocket, FakeWindow>(url, {
			autoReconnect: { delay: 50, onFailed, retries: 1 },
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];

		firstSocket?.serverClose();
		url.value = "ws://two.test";
		const secondSocket = FakeWebSocket.instances[1];
		secondSocket?.serverClose();
		vi.advanceTimersByTime(50);

		expect(FakeWebSocket.instances).toHaveLength(3);
		expect(onFailed).not.toHaveBeenCalled();
	});

	it("sends heartbeat pings and filters heartbeat responses", () => {
		vi.useFakeTimers();
		const socket = useFakeWebSocket<string>("ws://example.test", {
			heartbeat: {
				interval: 10,
				message: "ping",
				pongTimeout: 20,
			},
			window: new FakeWindow(),
		});
		const nativeSocket = FakeWebSocket.instances[0];
		nativeSocket?.open();

		vi.advanceTimersByTime(10);
		expect(nativeSocket?.sent).toEqual(["ping"]);

		nativeSocket?.message("ping");
		expect(socket.data.value).toBeNull();

		vi.advanceTimersByTime(10);
		expect(nativeSocket?.sent).toEqual(["ping", "ping"]);
		vi.advanceTimersByTime(20);
		expect(nativeSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);
		expect(socket.status.value).toBe("CLOSED");
	});

	it("closes on beforeunload and scope disposal when autoClose is enabled", () => {
		const window = new FakeWindow();
		const scope = createScope();
		const socket = runWithScope(scope, () =>
			useFakeWebSocket("ws://example.test", { window }),
		);
		const nativeSocket = FakeWebSocket.instances[0];

		window.beforeUnload();
		expect(nativeSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);

		socket.open();
		const secondSocket = FakeWebSocket.instances[1];
		disposeScope(scope);
		expect(secondSocket?.closeCalls).toEqual([
			{ code: 1000, reason: undefined },
		]);
	});

	it("marks manual close as closed before the close event arrives", () => {
		const onDisconnected = vi.fn();
		const socket = useFakeWebSocket("ws://example.test", {
			onDisconnected,
			window: new FakeWindow(),
		});
		const nativeSocket = FakeWebSocket.instances[0];
		if (nativeSocket === undefined) {
			throw new Error("socket was not created");
		}
		nativeSocket.open();
		nativeSocket.deferCloseEvent = true;

		socket.close();

		expect(socket.status.value).toBe("CLOSED");
		expect(socket.ws.value).toBeUndefined();
		expect(socket.send("late", false)).toBe(false);
		expect(onDisconnected).not.toHaveBeenCalled();

		nativeSocket.finishClose();

		expect(onDisconnected).toHaveBeenCalledOnce();
	});

	it("does not send while the native socket is closing", () => {
		const socket = useFakeWebSocket("ws://example.test", {
			window: new FakeWindow(),
		});
		const nativeSocket = FakeWebSocket.instances[0];
		if (nativeSocket === undefined) {
			throw new Error("socket was not created");
		}
		nativeSocket.open();
		nativeSocket.deferCloseEvent = true;
		nativeSocket.close();

		expect(socket.status.value).toBe("OPEN");
		expect(socket.send("late", false)).toBe(false);
		expect(nativeSocket.sent).toEqual([]);
	});

	it("does not reconnect from a stale manual close event", () => {
		vi.useFakeTimers();
		const socket = useFakeWebSocket("ws://example.test", {
			autoReconnect: { delay: 50 },
			window: new FakeWindow(),
		});
		const firstSocket = FakeWebSocket.instances[0];
		if (firstSocket === undefined) {
			throw new Error("socket was not created");
		}
		firstSocket.open();
		firstSocket.deferCloseEvent = true;

		socket.close();
		socket.open();
		const secondSocket = FakeWebSocket.instances[1];
		firstSocket.finishClose();
		vi.advanceTimersByTime(50);

		expect(FakeWebSocket.instances).toHaveLength(2);
		expect(secondSocket?.closeCalls).toEqual([]);
	});
});
