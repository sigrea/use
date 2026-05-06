# useMemory

Reactive JavaScript heap memory information from `performance.memory`.

```ts
import { useMemory } from "@sigrea/use";

const { isSupported, memory, pause, resume } = useMemory();

memory.value?.usedJSHeapSize;
```

`performance.memory` is a non-standard browser API. Check `isSupported` before
using the values.

```ts
if (isSupported.value) {
	console.log(memory.value?.usedJSHeapSize);
}
```

The value is refreshed every second by default. Use `interval` to change the
refresh rate, or `immediate: false` to start paused.

```ts
const memory = useMemory({
	interval: 5000,
	immediate: false,
});

memory.resume();
memory.pause();
memory.stop();
```
