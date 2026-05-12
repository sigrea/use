# useWebWorker

Dedicated Worker registration and communication controls.

```ts
import { useWebWorker } from "@sigrea/use";

const worker = useWebWorker<string, { type: "start" | "stop" }>(
	"/worker.js",
	{
		workerOptions: {
			type: "module",
		},
	},
);

worker.post({ type: "start" });
worker.terminate();
```

`data` contains the latest message received from the worker. `worker` exposes
the current native Worker instance when one is active. `post()` returns `false`
when no worker is active or when the browser rejects the message.

## Source

The source can be a script URL, a `URL` object, or an existing Worker-like
object. Reactive sources recreate the worker when `autoConnect` is enabled.

```ts
import { signal } from "@sigrea/core";

const source = signal("/one-worker.js");
const worker = useWebWorker(source);

source.value = "/two-worker.js";
```

`immediate` and `autoConnect` default to `true`. Pass `immediate: false` to wait
for `open()`.

## Cleanup

`autoTerminate` defaults to `true`. It terminates the worker when the current
Sigrea scope is disposed. `terminate()` stops the current worker and removes
listeners. `stop()` removes watchers and also terminates the current worker.

Pass `window: null` or `worker: null` to avoid falling back to globals in SSR or
tests. Worker script URLs execute code in a browser worker context, so only pass
trusted same-origin, `blob:`, or `data:` URLs allowed by your CSP.
