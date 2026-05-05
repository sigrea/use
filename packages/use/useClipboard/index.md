# useClipboard

Reactive Clipboard API for plain text. It writes text with
`navigator.clipboard.writeText()` and reads text with
`navigator.clipboard.readText()` when the browser exposes the async Clipboard
API.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useClipboard } from "@sigrea/use";

const source = signal("Hello");
const clipboard = useClipboard({ source });

await clipboard.copy();

clipboard.text.value; // "Hello"
clipboard.copied.value; // true
```

## State

| State | Description |
| --- | --- |
| `isSupported` | Whether async clipboard read or write support, or an enabled legacy fallback, is available. |
| `text` | Last copied or read plain text. |
| `copied` | `true` after a successful copy, then resets after `copiedDuring`. |
| `isCopying` | Whether a copy request is currently resolving. |
| `error` | Last copy or read error when no fallback handled it. |

## Options

| Option | Default | Description |
| --- | --- | --- |
| `source` | `undefined` | Default text source for `copy()` when no argument is passed. |
| `read` | `false` | Read clipboard text after observed `copy` or `cut` events. |
| `copiedDuring` | `1500` | Milliseconds before `copied` resets to `false`. |
| `legacy` | `false` | Fall back to `document.execCommand("copy")` when async copy is unavailable or rejected. |
| `navigator` | `defaultNavigator` | Navigator-like target for tests or embedded environments. |
| `document` | `defaultDocument` | Document-like target used only for the legacy fallback. |
| `window` | `defaultWindow` | Window-like target used for copy and cut event listeners. |

## Notes

Clipboard access is only available in secure browser contexts and can require
browser permission or a recent user interaction. Browser behavior differs for
read and write permission prompts, so `copy()` and `read()` store failures in
`error` instead of throwing by default.

`legacy` uses the deprecated `document.execCommand("copy")` path and is opt-in
only. Rich clipboard items and non-text formats are intentionally left to
`useClipboardItems`.

Concurrent `copy()` calls keep `text`, `copied`, `isCopying`, and `error` from
being updated by stale requests. They cannot cancel a native clipboard write
after it has started. Await the copy request whose browser clipboard side effect
must be the final one.
