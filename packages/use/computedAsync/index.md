---
category: Reactivity
---

# computedAsync

Computed signal for async functions.

## Usage

```ts
import { signal } from "@sigrea/core";
import { computedAsync } from "@sigrea/use";

const userId = signal(1);
const user = computedAsync(async (onCancel) => {
	const controller = new AbortController();
	onCancel(() => controller.abort());

	const response = await fetch(`/api/users/${userId.value}`, {
		signal: controller.signal,
	});
	return response.json();
}, null);
```

`computedAsync()` starts evaluating immediately and keeps the initial value until
the first evaluation resolves. When a dependency read by the callback changes,
the previous evaluation is canceled and only the latest result is applied.

## Evaluation State

```ts
const evaluating = signal(false);

const user = computedAsync(async () => getCurrentUser(), null, {
	evaluating,
});
```

You can also pass the evaluating signal directly as the third argument.

## Lazy

```ts
const user = computedAsync(async () => getCurrentUser(), null, {
	lazy: true,
});

// The async callback starts on first access.
console.log(user.value);
```

## Errors

```ts
const user = computedAsync(async () => getCurrentUser(), null, {
	onError(error) {
		console.error(error);
	},
});
```
