# useAsyncQueue

Runs asynchronous tasks sequentially and passes each task result to the next
task.

## Usage

```ts
import { useAsyncQueue } from "@sigrea/use";

function firstTask() {
	return Promise.resolve(1000);
}

function secondTask(result: number) {
	return Promise.resolve(result + 1000);
}

const { activeIndex, result } = useAsyncQueue([firstTask, secondTask]);

activeIndex.value; // current settled task index
result.value; // task states and data
```

## Result State

Each task result has a `state` and `data` property.

```ts
type UseAsyncQueueResult<T> =
	| { state: "pending"; data: null }
	| { state: "fulfilled"; data: T }
	| { state: "rejected"; data: unknown }
	| { state: "aborted"; data: unknown };
```

## Interrupt On Failure

By default, a rejected task stops the remaining tasks. Set `interrupt: false` to
continue with the rejection value passed to the next task.

```ts
const { result } = useAsyncQueue([firstTask, secondTask], {
	interrupt: false,
});
```

## Callbacks

```ts
const { result } = useAsyncQueue([firstTask, secondTask], {
	onError() {
		console.error("A task failed");
	},
	onFinished() {
		console.log("The queue finished");
	},
});
```

## Abort Signal

```ts
const controller = new AbortController();

const { result } = useAsyncQueue([firstTask, secondTask], {
	signal: controller.signal,
});

controller.abort();
```
