---
category: Browser
---

# useFileDialog

Reactive controls for a file input dialog.

## Usage

```ts
import { useFileDialog } from "@sigrea/use";

const dialog = useFileDialog({
	accept: "image/*",
	multiple: true,
});

dialog.onChange((files) => {
	if (files === null) {
		return;
	}

	for (const file of files) {
		console.log(file.name);
	}
});

dialog.open();
```

`open()` configures a file input and calls `click()` on it. When the input
fires `change`, `files` is updated with the browser-provided `FileList`.

## Options

```ts
const dialog = useFileDialog({
	accept: "image/png,image/jpeg",
	capture: "environment",
	directory: false,
	multiple: false,
	reset: true,
});
```

`accept` is written to the file input as a browser hint. It does not validate
selected files. Use your own validation before reading or uploading files.

`directory` writes the browser-specific `webkitdirectory` property. Unsupported
browsers ignore it.

Passing options to `open()` overrides the instance options for that call.

## Reset And Stop

```ts
dialog.reset();
dialog.stop();
```

`reset()` clears the current `files` value and the backing input value.
`stop()` removes event listeners and stops reacting to option changes. It does
not clear the last selected files.

## SSR

Pass `document: null` to avoid falling back to the global document. In server
environments, `open()`, `reset()`, and `stop()` stay callable without touching
DOM APIs.
