# useWakeLock

Reactive Screen Wake Lock API controls.

## Usage

```ts
import { useWakeLock } from "@sigrea/use";

const wakeLock = useWakeLock();

button.addEventListener("click", async () => {
	await wakeLock.request();
});
```

`request()` acquires the wake lock immediately when the document is visible. If
the document is hidden, the request is queued until visibility returns.

Use `forceRequest()` to call `navigator.wakeLock.request("screen")` immediately.
Browsers can reject that call when the document is hidden or the system cannot
grant a wake lock. Direct `request()` and `forceRequest()` calls reject with the
browser error in that case.

```ts
await wakeLock.forceRequest("screen");
await wakeLock.release();
```

## State

| State | Description |
| --- | --- |
| `sentinel` | Current wake lock sentinel, or `null`. |
| `isSupported` | Whether the current navigator exposes `wakeLock.request()`. |
| `isActive` | Whether a non-released sentinel exists while the document is visible. |

## Release

The browser can release a wake lock automatically when the page loses visibility
or for system reasons. When the current document is hidden, the `release` event
queues the same wake lock type again so it can be requested when the document
becomes visible.

Manual `release()` cancels any queued request and does not reacquire.

`stop()` removes watchers and releases the current sentinel. It is also called
when the current scope is disposed.

## Custom Targets

Pass `navigator` and `document` for tests, embedded environments, or SSR-aware
setup.

```ts
const wakeLock = useWakeLock({
	document: null,
	navigator: null,
});

await wakeLock.request();
wakeLock.stop();
```
