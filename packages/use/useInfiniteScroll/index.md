---
category: Sensors
---

# useInfiniteScroll

Runs a loader when a scroll target reaches an edge.

## Usage

```ts
import { useInfiniteScroll } from "@sigrea/use";

const list = document.querySelector("#list");
const items = [1, 2, 3, 4, 5];

const infinite = useInfiniteScroll(
	list,
	async () => {
		const nextItems = await fetchNextItems();
		items.push(...nextItems);
	},
	{
		distance: 16,
		canLoadMore: () => hasNextPage(),
	},
);
```

`reset()` schedules another check after content changes.

```ts
items.length = 0;
infinite.reset();
```

## Direction

The default direction is `bottom`. Other directions are supported when the
scroll container layout matches the scroll direction.

| Direction | Required CSS |
| --- | --- |
| `bottom` | No special settings |
| `top` | `display: flex; flex-direction: column-reverse;` |
| `left` | `display: flex; flex-direction: row-reverse;` |
| `right` | `display: flex;` |

Use `canLoadMore` to stop loading when there is no more content. Otherwise the
loader continues while the container still has space.

## SSR

```ts
const infinite = useInfiniteScroll(null, async () => {}, {
	window: null,
});
```

Passing `window: null` disables browser global fallback for visibility tracking.
