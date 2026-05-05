# useBroadcastChannel

Reactive BroadcastChannel API. It opens a named same-origin channel, exposes the
latest received message and error as readonly signals, and closes the channel
when `close()` or `stop()` is called.

## Usage

```ts
import { useBroadcastChannel } from "@sigrea/use";

const channel = useBroadcastChannel<string, string>({
	name: "sigrea-demo-channel",
});

channel.postMessage("hello");

channel.data.value; // latest received message
channel.error.value; // latest messageerror event
```

## Reactive Name

The channel name can be a raw value, signal, computed value, or getter. When the
name changes, the previous channel is closed and a new one is opened.

```ts
import { signal } from "@sigrea/core";

const name = signal("first");
const channel = useBroadcastChannel({ name });

name.value = "second";
```

## Cleanup

```ts
channel.close();
channel.stop();
```

BroadcastChannel communicates only between browsing contexts and workers from
the same origin. Messages are serialized with the structured clone algorithm.
