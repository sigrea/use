---
category: Browser
---

# useTitle

Reactive document title controls.

## Usage

```ts
import { signal } from "@sigrea/core";
import { useTitle } from "@sigrea/use";

const source = signal("Dashboard");
const title = useTitle(source);

source.value = "Settings";
title.value = "Profile";
```

When no title source is provided, `useTitle` starts from the current
`document.title`. Assigning a string updates `document.title`. Assigning `null`
or `undefined` writes an empty document title while keeping the returned value.

## Template

```ts
const title = useTitle("Dashboard", {
	titleTemplate: "%s | Sigrea",
});
```

`titleTemplate` applies only to the value written to `document.title`; the
returned value remains the raw title. A callback can be used when string
replacement is not enough.

## Observe

```ts
const title = useTitle("Dashboard", {
	observe: true,
});
```

When `observe` is enabled, external `document.title` changes are synced back to
the returned value. `observe` cannot be used together with `titleTemplate`.

## Stop

```ts
const title = useTitle("Dashboard");

title.stop();
```

`stop()` stops source, document, and observer tracking. Unless
`restoreOnUnmount: false` is set, the document title is restored to the value it
had before this `useTitle` instance first touched it.

## SSR

Pass `document: null` to avoid falling back to the global document. In server
environments this keeps the returned value writable without touching DOM APIs.
