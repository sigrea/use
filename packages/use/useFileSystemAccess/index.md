---
category: Browser
---

# useFileSystemAccess

Reactive controls for the File System Access API.

## Usage

```ts
import { useFileSystemAccess } from "@sigrea/use";

const fileAccess = useFileSystemAccess({
	types: [
		{
			accept: {
				"text/plain": [".txt"],
			},
			description: "Text",
		},
	],
});

await fileAccess.open();

fileAccess.data.value = `${fileAccess.data.value}\nUpdated`;
await fileAccess.save();
```

`open()` asks the browser for a file handle, reads the selected file, and stores
the contents in `data`. The default `dataType` is `"Text"`.

`data` is writable so callers can edit it before calling `save()` or `saveAs()`.
The other returned signals are readonly.

## Data Types

```ts
const text = useFileSystemAccess({ dataType: "Text" });
const binary = useFileSystemAccess({ dataType: "ArrayBuffer" });
const blob = useFileSystemAccess({ dataType: "Blob" });
```

`"Text"` reads with `File.text()`, `"ArrayBuffer"` reads with
`File.arrayBuffer()`, and `"Blob"` stores the selected `File` object.

When a reactive `dataType` changes, the current file handle is read again.
`updateData()` can also be called to refresh the current file from disk.

## Create And Save

```ts
await fileAccess.create({ suggestedName: "note.txt" });
fileAccess.data.value = "Draft";
await fileAccess.save();
await fileAccess.saveAs({ suggestedName: "copy.txt" });
```

`create()` asks for a new file handle and reads the browser-provided file.
`save()` writes the current `data` to the existing handle. If no handle exists
and `data` is defined, `save()` behaves like `saveAs()`. `saveAs()` always asks
for a new file handle before writing.

Writing calls `createWritable()`, then `write()`, then `close()`. Empty strings
are valid data and are written to the file. When `data` is `undefined`, `save()`
and `saveAs()` do not open the save picker.

## Support And Errors

`isSupported` is true only when both `showOpenFilePicker` and
`showSaveFilePicker` are available on the configured window.

Picker cancellation, permission failures, read failures, and write failures are
stored in `error`; the methods resolve without throwing.

## SSR

Pass `window: null` to avoid falling back to the global window. In server
environments, methods stay callable without touching browser picker APIs.

`stop()` stops reactive `dataType` tracking and prevents pending picker results
from updating state. Native picker dialogs cannot be aborted by this helper.
