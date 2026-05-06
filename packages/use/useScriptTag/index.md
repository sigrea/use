---
category: Browser
---

# useScriptTag

Async script tag loading.

## Usage

```ts
import { useScriptTag } from "@sigrea/use";

const { scriptTag, load, unload } = useScriptTag("/analytics.js", (script) => {
	console.log("loaded", script.src);
});

await load();

console.log(scriptTag.value);

unload();
```

By default, `useScriptTag` starts loading immediately. The returned `load()`
promise resolves after the script dispatches `load`. The script element is marked
with `data-loaded="true"` so later calls can resolve without waiting for another
event.

`error` and `abort` events reject the `load()` promise.

## Manual loading

```ts
const script = useScriptTag("/player.js", undefined, {
	manual: true,
});

await script.load(false);
```

Pass `manual: true` to disable automatic loading and scope cleanup. Calling
`load(false)` resolves as soon as the element is appended, while the later
`load` event still sets `data-loaded="true"` and runs the `onLoaded` callback.

## Options

```ts
useScriptTag("/module.js", undefined, {
	async: false,
	attrs: {
		integrity: "sha384-...",
	},
	crossOrigin: "anonymous",
	defer: true,
	noModule: false,
	nonce: "nonce-value",
	referrerPolicy: "no-referrer",
	type: "module",
});
```

`async` defaults to `true` and `type` defaults to `"text/javascript"`. Other
script attributes are written only when provided.

## Existing scripts

If a matching `<script src="...">` already exists, `useScriptTag` reuses it. If
the element already has `data-loaded="true"`, `load()` resolves immediately.

`unload()` removes only script elements created by this `useScriptTag` instance.
An existing script that was only reused is left in the document, and
`scriptTag.value` is reset to `null`.

## SSR

Pass `document: null` to avoid the global document fallback. In that case,
`load()` resolves to `false`, `scriptTag.value` stays `null`, and `unload()` does
not touch the DOM.
