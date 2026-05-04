---
category: Utilities
related: reactify
---

# createResolveValueFn

Make a plain function accept raw values, signals, computed values, and getters
as arguments.

## Usage

```ts
import { signal } from "@sigrea/core";
import { createResolveValueFn } from "@sigrea/use";

function post(url: string, data: { foo: string }) {
	return fetch(url, { body: JSON.stringify(data) });
}

const url = signal("https://httpbin.org/post");
const data = signal({ foo: "bar" });
const resolvePost = createResolveValueFn(post);

await resolvePost(url, data);
```

Each argument is resolved before the original function is called. The wrapped
function keeps its `this` value and returns the original return value without
resolving it.

Function arguments are treated as getters. If the original function needs a
function value, pass it from another wrapper value instead of passing the
function directly.
