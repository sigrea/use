---
category: State
---

# useOffsetPagination

Reactive offset pagination controls.

## Usage

```ts
import { useOffsetPagination } from "@sigrea/use";

const {
	currentPage,
	currentPageSize,
	pageCount,
	isFirstPage,
	isLastPage,
	prev,
	next,
	stop,
} = useOffsetPagination({
	total: 100,
	page: 1,
	pageSize: 10,
});

next();
console.log(currentPage.value);
console.log(currentPageSize.value);
console.log(pageCount.value);
console.log(isFirstPage.value);
console.log(isLastPage.value);

stop();
```

`currentPage` and `currentPageSize` are writable signals. When writable signals
are passed as `page` or `pageSize`, updates are synchronized both ways. Readonly
signals and getters are treated as one-way inputs.
