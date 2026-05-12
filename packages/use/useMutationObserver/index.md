---
category: Elements
---

# useMutationObserver

Watch DOM mutations with a reactive target.

## Usage

```ts
import { useMutationObserver } from "@sigrea/use";

const target = document.querySelector("#messages");

const observer = useMutationObserver(
	target,
	(records) => {
		for (const record of records) {
			console.log(record.type, record.target);
		}
	},
	{
		attributes: true,
		childList: true,
		subtree: true,
	},
);

console.log(observer.isSupported.value);
observer.stop();
```

## Pending Records

```ts
import { useMutationObserver } from "@sigrea/use";

const { takeRecords, stop } = useMutationObserver(
	document.body,
	(records) => {
		console.log(records.length);
	},
	{ attributes: true },
);

const pending = takeRecords();
console.log(pending);

stop();
```

`window: null` disables observation instead of falling back to the global window.
