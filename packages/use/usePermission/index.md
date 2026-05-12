---
category: Browser
---

# usePermission

Reactive Permissions API state.

## Usage

```ts
import { usePermission } from "@sigrea/use";

const microphone = usePermission("microphone");

if (microphone.state.value === "granted") {
	console.log("microphone permission is granted");
}
```

## Descriptor Options

```ts
const midi = usePermission({
	name: "midi",
	sysex: true,
});
```

Permission descriptors can require extra fields depending on the permission
name. Unsupported names or descriptors leave `state` as `undefined`.

`query()` only reads the current permission state. It does not request browser
permission prompts.

## Controls

```ts
const geolocation = usePermission("geolocation", {
	navigator: window.navigator,
});

await geolocation.query();
geolocation.stop();
```

`query()` reads the current `PermissionStatus` again. `stop()` removes the
current `PermissionStatus` change listener.
