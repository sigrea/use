---
category: Utilities
related: createEventHook
---

# useConfirmDialog

Creates state and event hooks for confirmation dialogs.

## Usage

```ts
import { useConfirmDialog } from "@sigrea/use";

const dialog = useConfirmDialog();

dialog.onConfirm((value) => {
	console.log(value);
});

async function removeItem() {
	const result = await dialog.open();
	if (!result.isCanceled) {
		console.log(result.data);
	}
}
```

Use `dialog.isOpen.value` to show or hide your dialog. Call `confirm()` or
`cancel()` from your UI controls to close it and resolve the promise returned by
`open()`.

## External State

```ts
import { signal } from "@sigrea/core";
import { useConfirmDialog } from "@sigrea/use";

const isOpen = signal(false);
const dialog = useConfirmDialog(isOpen);
```

The returned `isOpen` signal is readonly. Mutate the provided signal directly
only when you need to force the dialog state outside of `open()`, `confirm()`,
or `cancel()`.

## Data

```ts
import { useConfirmDialog } from "@sigrea/use";

const dialog = useConfirmDialog<
	{ id: string },
	{ accepted: true },
	{ reason: string }
>();

dialog.onOpen((data) => {
	console.log(data?.id);
});

dialog.confirm({ accepted: true });
dialog.cancel({ reason: "dismissed" });
```

Calling `open()` while a previous confirmation is still pending resolves the
previous promise as canceled before creating the new one.
