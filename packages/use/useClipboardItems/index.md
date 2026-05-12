# useClipboardItems

Reactive Clipboard API for `ClipboardItem` data. It writes rich clipboard items
with `navigator.clipboard.write()` and reads them with
`navigator.clipboard.read()` when the browser exposes those async Clipboard API
methods.

## Difference from useClipboard

`useClipboard` is for plain text through `readText()` and `writeText()`.
`useClipboardItems` is for richer clipboard formats represented by
`ClipboardItem`, such as images or HTML, when the browser supports the MIME
types involved.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useClipboardItems } from "@sigrea/use";

const type = "text/plain";
const source = signal([
	new ClipboardItem({
		[type]: new Blob(["Hello"], { type }),
	}),
]);
const clipboard = useClipboardItems({ source });

await clipboard.copy();

clipboard.items.value; // ClipboardItem[]
clipboard.copied.value; // true
```

## State

| State | Description |
| --- | --- |
| `isSupported` | Whether async clipboard item read or write support is available. |
| `items` | Last copied or read clipboard items. |
| `copied` | `true` after a successful copy, then resets after `copiedDuring`. |
| `isCopying` | Whether a copy request is currently resolving. |
| `error` | Last copy or read error. |

## Options

| Option | Default | Description |
| --- | --- | --- |
| `source` | `undefined` | Default clipboard item source for `copy()` when no argument is passed. |
| `read` | `false` | Read clipboard items after observed `copy` or `cut` events. |
| `copiedDuring` | `1500` | Milliseconds before `copied` resets to `false`. |
| `navigator` | `defaultNavigator` | Navigator-like target for tests or embedded environments. |
| `window` | `defaultWindow` | Window-like target used for copy and cut event listeners. |

## Notes

Clipboard item access is only available in secure browser contexts and can
require browser permission or a recent user interaction. Browser support and
supported MIME types vary more than plain text clipboard access.

`useClipboardItems` does not provide a `document.execCommand("copy")` fallback
because that legacy path cannot write arbitrary `ClipboardItem` data.

Concurrent `copy()` calls keep `items`, `copied`, `isCopying`, and `error` from
being updated by stale requests. They cannot cancel a native clipboard write
after it has started. Await the copy request whose browser clipboard side effect
must be the final one.
