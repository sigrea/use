# useWebSocket

Reactive WebSocket connection controls.

```ts
import { useWebSocket } from "@sigrea/use";

const socket = useWebSocket<string>("wss://example.test/socket", {
	autoReconnect: true,
	heartbeat: {
		interval: 30_000,
		message: "ping",
		pongTimeout: 5_000,
	},
});

socket.send("hello");
socket.close();
```

`data` contains the latest non-heartbeat message. `status` is one of
`"CONNECTING"`, `"OPEN"`, or `"CLOSED"`. Use `ws` when native WebSocket details
such as `readyState` or `binaryType` are needed.

## Connection

`immediate` and `autoConnect` default to `true`. When the URL changes, the
current socket is closed and a new socket is opened unless `autoConnect` is
disabled. Buffered sends are dropped on URL, protocol, or constructor changes so
messages do not leak to another endpoint.

`send(data)` returns `true` only when the data is sent immediately. When the
socket is not open, data is buffered by default and flushed after the socket
opens. Pass `false` as the second argument to skip buffering.

## Permissions And Cleanup

`autoClose` defaults to `true`. It closes the socket on `beforeunload` and when
the current Sigrea scope is disposed. `stop()` removes watchers, timers, and
listeners, clears buffered messages, and closes the socket.

Pass `window: null` or `webSocket: null` to avoid falling back to globals in SSR
or tests.
