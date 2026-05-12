# useWebWorkerFn

Runs a function in a short-lived Dedicated Worker.

```ts
import { useWebWorkerFn } from "@sigrea/use";

const { workerFn, workerStatus } = useWebWorkerFn(
	(numbers: number[]) => numbers.reduce((total, value) => total + value, 0),
	{
		timeout: 5_000,
	},
);

const total = await workerFn([1, 2, 3]);
workerStatus.value; // "SUCCESS"
```

Only one invocation can run at a time. A second call while the worker is running
rejects. `workerTerminate()` terminates the active worker and rejects the active
call. `stop()` removes watchers and terminates the current worker.

## Dependencies

`dependencies` are loaded with `importScripts()` inside a classic worker.
`localDependencies` are named functions serialized into the generated worker
script.

```ts
const pow = (value: number) => value * value;

const { workerFn } = useWebWorkerFn((value: number) => pow(value), {
	localDependencies: [pow],
});
```

The function and dependencies are converted to source text and executed in a
worker context. Pass only trusted functions and dependency URLs allowed by your
CSP.

## Support

`isSupported` is true when Worker, Blob, and object URL APIs are available from
the configured window. Pass `window: null` or `worker: null` to avoid falling
back to globals in SSR or tests.
