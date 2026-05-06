---
category: Browser
---

# useImage

Reactive image loading backed by `useAsyncState`.

## Usage

```ts
import { useImage } from "@sigrea/use";

const avatar = useImage({
	src: "/avatar.png",
	srcset: "/avatar@2x.png 2x",
	sizes: "64px",
	alt: "User avatar",
});

await avatar;

if (avatar.isReady.value) {
	document.body.append(avatar.state.value);
}
```

`state` is `undefined` until the image finishes loading. Failed loads are stored in
`error` and leave `state` at the initial value.

## Manual execution

```ts
const image = useImage({ src: "/large.png" }, { immediate: false });

await image.execute();
```

When the image options change, `useImage` starts a new load and keeps only the
newest result.

## Window injection

```ts
const image = useImage(
	{ src: "/preview.png" },
	{
		immediate: false,
		window: null,
	},
);
```

Passing `window: null` disables the browser global fallback. This is useful for
SSR and tests.
