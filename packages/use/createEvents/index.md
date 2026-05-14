---
category: Utilities
---

# createEvents

Create a typed event channel for one composable or molecule instance.

`createEvents` groups multiple named events and exposes only `send()` and
`on()`.

## Usage

```ts
import { createEvents } from "@sigrea/use";

type FilePickerEvents = {
	selected: [file: File];
	cleared: [];
	rejected: [reason: string];
};

export function useFilePicker() {
	const { send, on } = createEvents<FilePickerEvents>();

	const select = (file: File) => {
		return send("selected", file);
	};

	const clear = () => {
		return send("cleared");
	};

	return {
		select,
		clear,
		on,
	};
}
```

Consumers subscribe through `on()`.

```ts
const picker = useFilePicker();

const stop = picker.on("selected", (file) => {
	console.log(file.name);
});

stop();
```

Pass the event spec as a type argument. Calling `createEvents()` without an
event spec is not supported.

Use fixed-length tuple payloads for event arguments. Events without arguments
should use an empty tuple.

```ts
type UploadEvents = {
	progress: [loaded: number, total: number];
	selectedMany: [items: string[]];
	completed: [];
	failed: [reason: string];
};
```

Array payloads should be wrapped as one tuple argument, such as
`[items: string[]]`.

If an event name value is a union, narrow it before calling `send()` or `on()`,
even when those events share the same payload shape.

Define event specs as a single record whose keys are event names. Do not model
event specs as unions of records.

`send()` resolves after registered listeners finish, but listener return values
are not exposed. If a listener throws or rejects, `send()` rejects.

The same listener is called once for the same event. If the same listener is
registered multiple times, each returned stop handle releases one registration.

When a listener is registered inside a Sigrea scope, it is removed when that
scope is disposed.

`createEvents` is an instance event channel for Sigrea utilities. It is not a
replacement for Vue component `defineEmits`, and it does not implement template
listeners, parent-only delivery, `$attrs` behavior, or runtime validators.
