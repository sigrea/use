# useVirtualList

Virtualize large lists by exposing the currently visible item range and spacer
styles.

## Usage

```ts
import { useVirtualList } from "@sigrea/use";

const rows = Array.from({ length: 10000 }, (_, index) => `Row ${index}`);
const virtual = useVirtualList(rows, {
	itemHeight: 32,
});

virtual.containerRef.value = container;
```

Render `virtual.list.value` and apply `virtual.wrapperStyle.value` to the inner
spacer element.

```ts
for (const item of virtual.list.value) {
	item.index;
	item.data;
}
```

## Vertical

```ts
const virtual = useVirtualList(items, {
	itemHeight: 28,
	overscan: 8,
});
```

`containerStyle` is `overflow-y: auto;`.

## Horizontal

```ts
const virtual = useVirtualList(items, {
	itemWidth: 160,
});
```

`containerStyle` is `overflow-x: auto;`, and the wrapper style uses flex layout.

## Variable Size

`itemHeight` and `itemWidth` can be a function when item sizes vary.

```ts
const virtual = useVirtualList(items, {
	itemHeight: (index) => (index % 2 === 0 ? 24 : 48),
});
```

Keep the returned size in sync with the rendered item size. Incorrect sizes can
leave whitespace or cause items to jump while scrolling.

## Controls

| State | Description |
| --- | --- |
| `list` | Readonly signal of `{ index, data }` items in the current range. |
| `containerRef` | Writable signal for the scroll container element. |
| `containerStyle` | Static overflow style for the container. |
| `wrapperStyle` | Computed spacer style for the inner wrapper. |
| `onScroll()` | Recalculate manually after a custom scroll event. |
| `scrollTo(index)` | Scroll to the item index, clamped to the current list. |
| `measure()` | Recalculate from the current container size and scroll position. |
| `stop()` | Stop resize, scroll, and list watches. |

Pass `window: null` for SSR-aware setup. `measure()`, `scrollTo()`, `onScroll()`,
and `stop()` are safe when the container is not available.
