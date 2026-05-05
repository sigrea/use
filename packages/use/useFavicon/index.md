---
category: Browser
---

# useFavicon

Reactive favicon controls.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useFavicon } from "@sigrea/use";

const icon = signal("light.png");
const favicon = useFavicon(icon);

icon.value = "dark.png";
favicon.value = "accent.png";
```

When no source is provided, `useFavicon` reads the first existing
`rel="icon"` link if one exists. Assigning a string updates matching icon links
or creates a new `<link rel="icon">` element.

Assigning `null` or `undefined` removes this instance's favicon assignment. A
link created by `useFavicon` is removed. An existing link changed by
`useFavicon` has its previous attributes restored.

## Options

```ts
const favicon = useFavicon("favicon.svg", {
	baseUrl: "/assets/",
	media: "(prefers-color-scheme: dark)",
	rel: "icon",
	sizes: "any",
	type: "image/svg+xml",
});
```

`baseUrl` is prepended to the icon string before it is written to `href`.
`media`, `sizes`, and `type` are written only when explicitly provided.

When `media` is set, only icon links with the same `media` attribute are
updated. This keeps separate light and dark favicon links from overwriting each
other.

## Stop

```ts
const favicon = useFavicon("favicon.ico");

favicon.stop();
```

`stop()` stops source and document tracking for this instance. It does not
restore DOM changes that have already been applied.

## SSR

Pass `document: null` to avoid falling back to the global document. In server
environments this keeps the returned value writable without touching DOM APIs.
