---
category: Browser
---

# useShare

Reactive Web Share API controls.

## Usage

```ts
import { useShare } from "@sigrea/use";

const share = useShare({
	title: "Example",
	text: "Open this page",
	url: "https://example.com",
});

button.addEventListener("click", () => {
	void share.share();
});
```

`navigator.share()` requires a user activation in browsers, so call `share()`
from a click or similar user action.

## Override Data

```ts
const share = useShare({ title: "Example" });

await share.share({
	text: "Shared text",
	url: "https://example.com/article",
});
```

Default data and override data are merged before calling the browser API. Only
the Web Share `files`, `title`, `text`, and `url` members are passed through.

## Checking Support

```ts
if (share.canShare({ files })) {
	await share.share({ files });
}
```

`isSupported` reports whether the configured navigator exposes both
`canShare()` and `share()`. `canShare()` validates the merged share data through
the browser before sharing.

## SSR

Pass `navigator: null` to avoid the default navigator fallback. In that case,
`isSupported` is `false`, `canShare()` returns `false`, and `share()` resolves
without calling browser APIs.
