---
category: Browser
---

# useStyleTag

Inject a reactive `<style>` element in the document head.

## Usage

```ts
import { useStyleTag } from "@sigrea/use";

const { id, css, isLoaded, load, unload } = useStyleTag(
	".demo { color: red; }",
);

css.value = ".demo { color: blue; }";

console.log(id, isLoaded.value);

unload();
load();
```

By default, `useStyleTag` creates a `<style>` element immediately and removes it
when the active scope is disposed. The generated id uses the
`sigrea_style_tag_` prefix.

## Manual loading

```ts
const style = useStyleTag(".print-only { display: none; }", {
	immediate: false,
	manual: true,
	media: "print",
});

style.load();
style.unload();
```

Pass `manual: true` to disable automatic loading and scope cleanup.

## Existing styles

```ts
useStyleTag(".app { color: green; }", {
	id: "app-theme",
	nonce: "nonce-value",
});
```

If a `<style>` with the same id already exists, it is reused instead of creating
a duplicate element. `unload()` removes only elements created by this instance.
For reused elements, the previous text, `media`, and `nonce` values are restored.
When multiple active calls share the same id, cleanup removes or restores the
element only after the last active owner unloads.

## SSR

Pass `document: null` to avoid the global document fallback. In that case,
`load()` and `unload()` leave the DOM untouched, and `isLoaded.value` stays
`false`.
