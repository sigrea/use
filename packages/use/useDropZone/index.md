# useDropZone

Create a target that accepts dropped files.

## Usage

```ts
import { useDropZone } from "@sigrea/use";

const dropZone = useDropZone(element, {
	onDrop(files) {
		if (files !== null) {
			for (const file of files) {
				console.log(file.name);
			}
		}
	},
});
```

Browsers expose the real `DataTransfer.files` list during `drop`. Drag callbacks
receive `null` for the files argument and can use the event when they need more
detail.

## Validation

Use `dataTypes` to accept only specific `DataTransferItem.type` values.

```ts
const dropZone = useDropZone(element, {
	dataTypes: ["image/"],
});
```

`dataTypes` also accepts a predicate when the check needs custom logic.

```ts
const dropZone = useDropZone(element, {
	dataTypes: (types) => types.every((type) => type.startsWith("image/")),
});
```

Use `checkValidity` when the full `DataTransferItemList` is needed. It takes
priority over `dataTypes`; `multiple: false` is still applied.

```ts
const dropZone = useDropZone(element, {
	checkValidity: (items) => items.length > 0,
	multiple: false,
});
```

Accepted drags call `preventDefault()` and set `dropEffect` to `copy` so the
browser can dispatch `drop`. Rejected drags set `dropEffect` to `none`.
`preventDefaultForUnhandled` can also stop the browser default for rejected
drags.

Safari does not reliably expose file types during drag events. In Safari,
`isOverDropZone` can become `true` during a drag and the final rejection happens
on `drop`.

## State

| State | Description |
| --- | --- |
| `files` | Last dropped files, or `null` when no files were dropped. |
| `isOverDropZone` | Whether a drag is currently over the target. |

`stop()` removes listeners and clears `files` and `isOverDropZone`.
