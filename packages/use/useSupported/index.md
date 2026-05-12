# useSupported

Readonly boolean signal for feature detection that may need to rerun after a
Sigrea molecule is mounted.

```ts
import { useSupported } from "@sigrea/use";

const isSupported = useSupported(
	() => typeof navigator !== "undefined" && "getBattery" in navigator,
);

if (isSupported.value) {
	console.log("Battery API is supported");
}
```

`useSupported` does not access browser globals itself. Keep SSR guards inside
the callback when checking browser-only APIs.
