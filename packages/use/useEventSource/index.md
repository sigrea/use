# useEventSource

Reactive controls for a browser `EventSource` connection.

## Usage

```ts
import { useEventSource } from "@sigrea/use";

const source = useEventSource("https://example.com/events");

source.status.value;
source.data.value;
source.close();
```

`isSupported` reports whether the configured window exposes `EventSource`.
When no browser window is available, the connection is not created.

## Named Events

Pass event names when the stream uses custom `event:` fields.

```ts
const source = useEventSource(
	"https://example.com/events",
	["notice", "update"] as const,
);

source.event.value;
source.data.value;
```

The default `message` event clears `event` to `undefined`. Named events set it
to the matching event name.

## Manual Control

The connection opens immediately by default. Set `immediate: false` to wait for
`open()`.

```ts
const source = useEventSource("https://example.com/events", [], {
	immediate: false,
});

source.open();
source.close();
```

When `url` is reactive, `autoConnect` reconnects to the new URL by default.
Calling `close()` stops that automatic reconnect until `open()` is called.

## Data Serialization

Use `serializer.read` to transform incoming string data.

```ts
const source = useEventSource("https://example.com/events", [], {
	serializer: {
		read: (value) => (value === undefined ? undefined : JSON.parse(value)),
	},
});
```

Browsers handle the standard Server-Sent Events reconnection flow, including
the internal last event ID used for `Last-Event-ID` on browser retries. This
helper does not add a separate reconnect timer. For HTTP/1.x, keep the browser
per-origin SSE connection limit in mind when opening multiple streams.
