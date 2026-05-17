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

The owning code subscribes through `on()`. In molecule graphs, the parent or
controller molecule calls `on()` during its own setup.

```ts
const picker = useFilePicker();

const stop = picker.on("selected", (file) => {
	console.log(file.name);
});

stop();
```

## Controlled Molecule Events

For design-system molecules, use `update:*` event names for parent-owned values.
The molecule should read the current value from props and send an update request
instead of mutating local state as the source of truth.

```ts
import {
  computed,
  get,
  molecule,
  readonly,
  signal,
  toSignal,
} from "@sigrea/core";
import { createEvents } from "@sigrea/use";

interface DialogProps {
  open: boolean;
  disabled?: boolean;
}

type DialogEvents = {
  "update:open": [next: boolean];
};

export const DialogMolecule = molecule<DialogProps>((props) => {
  const { send, on } = createEvents<DialogEvents>();
  const isOpen = toSignal(props, "open");
  const isDisabled = computed(() => props.disabled ?? false);

  const emitOpenChange = async (next: boolean) => {
    if (isDisabled.value || isOpen.value === next) {
      return;
    }
    await send("update:open", next);
  };

  const open = () => {
    return emitOpenChange(true);
  };

  const close = () => {
    return emitOpenChange(false);
  };

  const toggle = () => {
    return emitOpenChange(!isOpen.value);
  };

  return {
    on,
    open,
    close,
    toggle,
  };
});

export const DialogControllerMolecule = molecule(() => {
  const isOpen = signal(false);
  const dialog = get(DialogMolecule, () => ({
    open: isOpen.value,
  }));

  dialog.on("update:open", (next) => {
    isOpen.value = next;
  });

  return {
    isOpen: readonly(isOpen),
    open: dialog.open,
    close: dialog.close,
    toggle: dialog.toggle,
  };
});
```

Use `update:value`, `update:open`, `update:selectedValue`, and similar names for
controlled value requests. Use names like `open`, `close`, `select`, and `submit` for
user actions that do not directly replace a controlled value. When a boolean
state value could be confused with an action such as `open()` or `close()`, name
internal state `isOpen` and name the update payload `next`. Avoid returning prop
mirrors such as `toSignal(props, "open")`; expose actions or derived state
instead.

Expose `on` only when a parent or controller molecule needs to listen. Keep
`send` private to the molecule; callers should use the action functions the
molecule exposes, not `send` directly.

Register listeners during molecule setup, and call `send()` from actions,
lifecycles, browser events, or async work. Do not call `send()` during molecule
setup; the owning molecule may not have registered its listener yet.

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

`send()` resolves after registered listeners finish. Listener return values are
discarded. If a listener throws or rejects, `send()` rejects.

A listener function is invoked once per `send()` call, even if the same function
was registered more than once for the same event. Each returned stop handle
releases one registration count.

When a listener is registered inside a Sigrea scope, it is removed when that
scope is disposed.

`createEvents` provides event coordination between molecules and composables
within a single Sigrea instance. It is not a replacement for Vue's
`defineEmits` or any framework event system; it has no template integration,
parent-only delivery, or runtime validators.
