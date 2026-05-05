# useEyeDropper

Reactive controls for the browser `EyeDropper` API.

## Usage

```ts
import { useEyeDropper } from "@sigrea/use";

const eyeDropper = useEyeDropper();

button.addEventListener("click", async () => {
	const result = await eyeDropper.open();

	if (result !== undefined) {
		console.log(result.sRGBHex);
	}
});
```

`open()` must be called from a user action such as a button click. Browsers can
reject the request when there is no transient user activation, another picker is
already open, the user cancels, or the picker fails.

Rejected requests do not throw from `open()`. They return `undefined` and store
the browser error in `error`.

## Initial Value

Use `initialValue` while no color has been selected yet.

```ts
const eyeDropper = useEyeDropper({
	initialValue: "#000000",
});
```

## Abort

Pass an `AbortSignal` to let another controller cancel the picker. Use
`abort()` when the current picker should be dismissed by this helper.

```ts
const controller = new AbortController();
const eyeDropper = useEyeDropper();

void eyeDropper.open({ signal: controller.signal });

controller.abort();
eyeDropper.abort();
```

`stop()` aborts the current picker and prevents future `open()` calls from this
instance. Scoped instances are stopped when their Sigrea scope is disposed.

## Support

`isSupported` reports whether the configured window exposes `EyeDropper`.
`window: null` never falls back to a global value, so server-side usage keeps
`isSupported` false and `open()` returns `undefined`.

The EyeDropper API is experimental, only available in secure contexts, and not
supported by all browsers.
