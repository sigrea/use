# useFetch

Reactive controls for `fetch` requests.

## Usage

```ts
import { useFetch } from "@sigrea/use";

const request = useFetch("https://example.com/api/message").json<{
	message: string;
}>();

request.data.value;
request.isFetching.value;
request.error.value;
```

The request starts after creation by default. The return value is thenable, so
`await useFetch(url).json()` waits for the current request to finish.

## Manual Execution

```ts
const request = useFetch("https://example.com/api/message", {
	immediate: false,
}).text();

await request.execute();
```

Use `execute(true)` when the caller should receive fetch, parsing, or HTTP
errors as thrown errors. Without that flag, errors are stored in `error` and the
promise resolves with `null`.

## Request Hooks

```ts
const request = useFetch(
	"https://example.com/api/message",
	{
		headers: {
			Accept: "application/json",
		},
	},
	{
		beforeFetch(context) {
			return {
				options: {
					...context.options,
					headers: {
						...context.options.headers,
						Authorization: "Bearer token",
					},
				},
			};
		},
		afterFetch(context) {
			return {
				data: context.data,
			};
		},
	},
);
```

`beforeFetch` can change the URL or request options before dispatch. Calling
`cancel()` in that hook stops the request before `fetch` is called.

`afterFetch` runs after a successful response has been parsed. `onFetchError`
runs for network, parsing, abort, and non-2xx HTTP responses.

## Methods And Body Types

```ts
const request = useFetch("https://example.com/api/todos", {
	immediate: false,
}).post({ title: "Write docs" }).json<{ id: string }>();

await request.execute();
```

Plain objects and arrays sent as a payload are serialized as JSON and receive
`Content-Type: application/json`. `FormData` is passed through without setting
`Content-Type`, so the browser can include the boundary.

Available response readers are `text()`, `json()`, `blob()`, `arrayBuffer()`,
and `formData()`.

## Abort And Refetch

```ts
const request = useFetch(urlSignal, {
	refetch: true,
	timeout: 5_000,
});

request.abort();
request.stop();
```

`abort()` cancels the current request when an `AbortController` is available.
`timeout` aborts the request after the configured milliseconds.

When `refetch` is true, reactive URL and payload values trigger a new request.
`stop()` aborts the current request and stops future reactive refetches.

## SSR

Use `fetch` to inject the request function in server-side code. Passing
`window: null` prevents falling back to a browser window.
