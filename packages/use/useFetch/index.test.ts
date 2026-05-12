// @vitest-environment node

import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseFetchFetch } from "../types";
import { useFetch } from "./index";

function createTextResponse(
	body: BodyInit | null,
	init?: ResponseInit,
): Response {
	return new Response(body, init);
}

function abortableFetch(): ReturnType<typeof vi.fn<UseFetchFetch>> {
	return vi.fn<UseFetchFetch>(
		(_input, init) =>
			new Promise<Response>((resolve, reject) => {
				const signal = init?.signal;

				if (signal?.aborted) {
					reject(signal.reason);
					return;
				}

				signal?.addEventListener(
					"abort",
					() => {
						reject(signal.reason);
					},
					{ once: true },
				);

				setTimeout(() => {
					resolve(createTextResponse("late"));
				}, 1_000);
			}),
	);
}

function deferred<T>() {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((promiseResolve, promiseReject) => {
		resolve = promiseResolve;
		reject = promiseReject;
	});

	return {
		promise,
		reject,
		resolve,
	};
}

describe("useFetch", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
		disposeTrackedMolecules();
	});

	it("executes immediately and reads text responses", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("hello", { status: 200 }),
		);
		const request = useFetch("https://example.com/message", { fetch }).text();

		await request;

		expect(fetch).toHaveBeenCalledOnce();
		expect(request.data.value).toBe("hello");
		expect(request.statusCode.value).toBe(200);
		expect(request.response.value).toBeInstanceOf(Response);
		expect(request.error.value).toBeNull();
		expect(request.isFetching.value).toBe(false);
		expect(request.isFinished.value).toBe(true);
	});

	it("waits for execute when immediate is false", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("manual"),
		);
		const request = useFetch("https://example.com/manual", {
			fetch,
			immediate: false,
		}).text();

		expect(fetch).not.toHaveBeenCalled();
		expect(request.isFinished.value).toBe(false);

		const response = await request.execute();

		expect(response).toBeInstanceOf(Response);
		expect(fetch).toHaveBeenCalledOnce();
		expect(request.data.value).toBe("manual");
	});

	it("reads JSON responses with typed data", async () => {
		interface Message {
			hello: string;
		}

		const fetch = vi.fn<UseFetchFetch>(async () =>
			Response.json({ hello: "world" }),
		);
		const request = useFetch("https://example.com/json", {
			fetch,
		}).json<Message>();

		await request;

		expect(request.data.value).toEqual({ hello: "world" });
	});

	it("stores HTTP errors and throws when requested", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("Bad Request", {
				status: 400,
				statusText: "Bad Request",
			}),
		);
		const request = useFetch("https://example.com/bad", {
			fetch,
			immediate: false,
			initialData: "fallback",
		}).text();

		await expect(request.execute(true)).rejects.toThrow("Bad Request");

		expect(request.statusCode.value).toBe(400);
		expect(request.response.value).toBeInstanceOf(Response);
		expect(request.error.value).toBeInstanceOf(Error);
		expect((request.error.value as Error).message).toBe("Bad Request");
		expect(request.data.value).toBe("fallback");
	});

	it("handles network errors without throwing by default", async () => {
		const networkError = new TypeError("network failed");
		const fetch = vi.fn<UseFetchFetch>(async () => {
			throw networkError;
		});
		const request = useFetch("https://example.com/network", {
			fetch,
			immediate: false,
		});

		await expect(request.execute()).resolves.toBeNull();

		expect(request.error.value).toBe(networkError);
		expect(request.response.value).toBeNull();
	});

	it("lets beforeFetch change the URL and headers", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () => createTextResponse("ok"));
		const request = useFetch(
			"https://example.com/original",
			{ headers: { Accept: "text/plain" } },
			{
				fetch,
				immediate: false,
				beforeFetch(context) {
					return {
						url: "https://example.com/changed",
						options: {
							...context.options,
							headers: {
								...context.options.headers,
								Authorization: "Bearer token",
							},
						},
					};
				},
			},
		);

		await request.execute();

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/changed",
			expect.objectContaining({
				headers: expect.objectContaining({
					Accept: "text/plain",
					Authorization: "Bearer token",
				}),
			}),
		);
	});

	it("keeps method and body when beforeFetch returns partial options", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () => createTextResponse("ok"));
		const request = useFetch("https://example.com/partial", {
			fetch,
			immediate: false,
			beforeFetch() {
				return {
					options: {
						headers: {
							Authorization: "Bearer token",
						},
					},
				};
			},
		}).post({ count: 1 });

		await request.execute();

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/partial",
			expect.objectContaining({
				body: JSON.stringify({ count: 1 }),
				headers: expect.objectContaining({
					Authorization: "Bearer token",
					"Content-Type": "application/json",
				}),
				method: "POST",
			}),
		);
	});

	it("cancels before dispatching the request", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("should not run"),
		);
		const request = useFetch("https://example.com/cancel", {
			fetch,
			immediate: false,
			beforeFetch({ cancel }) {
				cancel();
			},
		});

		await request.execute();

		expect(fetch).not.toHaveBeenCalled();
		expect(request.isFetching.value).toBe(false);
		expect(request.isFinished.value).toBe(true);
	});

	it("handles beforeFetch errors and resets loading state", async () => {
		const beforeError = new Error("before failed");
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("should not run"),
		);
		const request = useFetch("https://example.com/before-error", {
			fetch,
			immediate: false,
			beforeFetch() {
				throw beforeError;
			},
		});

		await expect(request.execute()).resolves.toBeNull();

		expect(fetch).not.toHaveBeenCalled();
		expect(request.error.value).toBe(beforeError);
		expect(request.isFetching.value).toBe(false);
		expect(request.isFinished.value).toBe(true);

		await expect(request.execute(true)).rejects.toThrow("before failed");
	});

	it("does not dispatch after being stopped during beforeFetch", async () => {
		let resumeBeforeFetch: (() => void) | undefined;
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("should not run"),
		);
		const request = useFetch("https://example.com/stopped", {
			fetch,
			immediate: false,
			beforeFetch: async () => {
				await new Promise<void>((resolve) => {
					resumeBeforeFetch = resolve;
				});
			},
		});
		const promise = request.execute();

		request.stop();
		resumeBeforeFetch?.();
		await promise;

		expect(fetch).not.toHaveBeenCalled();
		expect(request.isFetching.value).toBe(false);
		expect(request.isFinished.value).toBe(true);
	});

	it("allows afterFetch and onFetchError to replace data and errors", async () => {
		const successFetch = vi.fn<UseFetchFetch>(async () =>
			Response.json({ title: "original" }),
		);
		const success = useFetch<{ title: string }>("https://example.com/success", {
			fetch: successFetch,
			afterFetch(context) {
				return {
					data: {
						...context.data,
						title: "changed",
					},
				};
			},
		}).json<{ title: string }>();
		const errorFetch = vi.fn<UseFetchFetch>(async () =>
			Response.json(
				{ message: "bad" },
				{ status: 500, statusText: "Server Error" },
			),
		);
		const failure = useFetch<{ message: string }>(
			"https://example.com/failure",
			{
				fetch: errorFetch,
				immediate: false,
				initialData: { message: "initial" },
				onFetchError(context) {
					return {
						data: { message: "from error" },
						error: `custom: ${(context.error as Error).message}`,
					};
				},
			},
		).json<{ message: string }>();

		await success;
		await failure.execute();

		expect(success.data.value).toEqual({ title: "changed" });
		expect(failure.error.value).toBe("custom: Server Error");
		expect(failure.data.value).toEqual({ message: "initial" });

		const updating = useFetch<{ message: string }>(
			"https://example.com/update",
			{
				fetch: errorFetch,
				immediate: false,
				updateDataOnError: true,
				onFetchError() {
					return { data: { message: "from error" } };
				},
			},
		).json<{ message: string }>();

		await updating.execute();

		expect(updating.data.value).toEqual({ message: "from error" });
	});

	it("throws the error returned by onFetchError", async () => {
		const normalizedError = new Error("normalized");
		const fetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("bad", {
				status: 500,
				statusText: "Server Error",
			}),
		);
		const request = useFetch("https://example.com/normalized", {
			fetch,
			immediate: false,
			onFetchError() {
				return {
					error: normalizedError,
				};
			},
		}).text();

		await expect(request.execute(true)).rejects.toBe(normalizedError);

		expect(request.error.value).toBe(normalizedError);
	});

	it("serializes payloads for request methods", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () => createTextResponse("ok"));
		const request = useFetch("https://example.com/post", {
			fetch,
			immediate: false,
		}).post({ count: 1 });

		await request.execute();

		expect(fetch).toHaveBeenCalledWith(
			"https://example.com/post",
			expect.objectContaining({
				body: JSON.stringify({ count: 1 }),
				headers: expect.objectContaining({
					"Content-Type": "application/json",
				}),
				method: "POST",
			}),
		);

		const textPayload = useFetch("https://example.com/text", {
			fetch,
			immediate: false,
		}).post("hello", "text/plain");

		await textPayload.execute();

		expect(fetch).toHaveBeenLastCalledWith(
			"https://example.com/text",
			expect.objectContaining({
				body: "hello",
				headers: expect.objectContaining({
					"Content-Type": "text/plain",
				}),
				method: "POST",
			}),
		);
	});

	it("does not set Content-Type for FormData payloads", async () => {
		const fetch = vi.fn<UseFetchFetch>(async () => createTextResponse("ok"));
		const formData = new FormData();
		formData.append("name", "sigrea");
		const request = useFetch("https://example.com/form", {
			fetch,
			immediate: false,
		}).post(formData);

		await request.execute();

		const init = fetch.mock.calls[0]?.[1];

		expect(init?.body).toBe(formData);
		expect(init?.headers).not.toHaveProperty("Content-Type");
	});

	it("emits response, error, and finally events", async () => {
		const okFetch = vi.fn<UseFetchFetch>(async () => createTextResponse("ok"));
		const badFetch = vi.fn<UseFetchFetch>(async () =>
			createTextResponse("bad", { status: 500, statusText: "Bad" }),
		);
		const responseListener = vi.fn();
		const errorListener = vi.fn();
		const finallyListener = vi.fn();
		const ok = useFetch("https://example.com/ok", {
			fetch: okFetch,
			immediate: false,
		});
		const bad = useFetch("https://example.com/bad", {
			fetch: badFetch,
			immediate: false,
		});

		ok.onFetchResponse(responseListener);
		ok.onFetchError(errorListener);
		ok.onFetchFinally(finallyListener);
		await ok.execute();

		expect(responseListener).toHaveBeenCalledOnce();
		expect(errorListener).not.toHaveBeenCalled();
		expect(finallyListener).toHaveBeenCalledOnce();

		bad.onFetchError(errorListener);
		bad.onFetchFinally(finallyListener);
		await bad.execute();

		expect(errorListener).toHaveBeenCalledOnce();
		expect(finallyListener).toHaveBeenCalledTimes(2);
	});

	it("aborts manually and on timeout", async () => {
		vi.useFakeTimers();
		const manualFetch = abortableFetch();
		const manual = useFetch("https://example.com/abort", {
			fetch: manualFetch,
			immediate: false,
		});
		const manualPromise = manual.execute();

		expect(manual.canAbort.value).toBe(true);

		manual.abort("custom reason");
		await manualPromise;

		expect(manual.aborted.value).toBe(true);
		expect(manual.error.value).toBe("custom reason");

		const timeoutFetch = abortableFetch();
		const timeout = useFetch("https://example.com/timeout", {
			fetch: timeoutFetch,
			immediate: false,
			timeout: 10,
		});
		const timeoutPromise = timeout.execute();

		vi.advanceTimersByTime(10);
		await timeoutPromise;

		expect(timeout.aborted.value).toBe(true);
		expect(timeout.error.value).toBeInstanceOf(DOMException);
	});

	it("marks already-aborted external signals as aborted", async () => {
		const controller = new AbortController();
		const reason = new DOMException("external", "AbortError");
		const fetch = abortableFetch();
		const request = useFetch(
			"https://example.com/external-abort",
			{ signal: controller.signal },
			{
				fetch,
				immediate: false,
			},
		);

		controller.abort(reason);
		await request.execute();

		expect(request.aborted.value).toBe(true);
		expect(request.error.value).toBe(reason);
	});

	it("ignores stale responses from older executions", async () => {
		const resolvers: Array<() => void> = [];
		let count = 0;
		const fetch = vi.fn<UseFetchFetch>(
			() =>
				new Promise<Response>((resolve) => {
					count += 1;
					const body = count === 1 ? "old" : "new";
					resolvers.push(() => {
						resolve(createTextResponse(body));
					});
				}),
		);
		const request = useFetch("first", { fetch, immediate: false }).text();

		const first = request.execute();
		const second = request.execute();

		resolvers[1]?.();
		await second;
		resolvers[0]?.();
		await first;

		expect(request.data.value).toBe("new");
		expect(fetch).toHaveBeenCalledTimes(2);
	});

	it("ignores stale body parsing from older executions", async () => {
		const oldBody = deferred<string>();
		let count = 0;
		const fetch = vi.fn<UseFetchFetch>(async () => {
			count += 1;
			if (count === 1) {
				return createTextResponse(
					new ReadableStream({
						async start(controller) {
							controller.enqueue(
								new TextEncoder().encode(await oldBody.promise),
							);
							controller.close();
						},
					}),
				);
			}

			return createTextResponse("new");
		});
		const request = useFetch("https://example.com/stale-body", {
			fetch,
			immediate: false,
		}).text();

		const first = request.execute();
		await Promise.resolve();
		const second = request.execute();
		await second;

		expect(request.data.value).toBe("new");

		oldBody.resolve("old");
		await first;

		expect(request.data.value).toBe("new");
	});

	it("ignores stale afterFetch results from older executions", async () => {
		const afterFetch = deferred<void>();
		let count = 0;
		const fetch = vi.fn<UseFetchFetch>(async () => {
			count += 1;
			return createTextResponse(count === 1 ? "old" : "new");
		});
		const request = useFetch("https://example.com/stale-after", {
			fetch,
			immediate: false,
			async afterFetch(context) {
				if (context.data === "old") {
					await afterFetch.promise;
				}
			},
		}).text();

		const first = request.execute();
		await Promise.resolve();
		const second = request.execute();
		await second;

		expect(request.data.value).toBe("new");

		afterFetch.resolve();
		await first;

		expect(request.data.value).toBe("new");
	});

	it("ignores stale onFetchError results from older executions", async () => {
		const errorHook = deferred<void>();
		let count = 0;
		const fetch = vi.fn<UseFetchFetch>(async () => {
			count += 1;
			if (count === 1) {
				return createTextResponse("old", {
					status: 500,
					statusText: "Old",
				});
			}

			return createTextResponse("new");
		});
		const request = useFetch("https://example.com/stale-error", {
			fetch,
			immediate: false,
			async onFetchError() {
				await errorHook.promise;
				return {
					error: "old-error",
				};
			},
		}).text();

		const first = request.execute();
		await Promise.resolve();
		const second = request.execute();
		await second;

		expect(request.error.value).toBeNull();
		expect(request.data.value).toBe("new");

		errorHook.resolve();
		await first;

		expect(request.error.value).toBeNull();
		expect(request.data.value).toBe("new");
	});

	it("refetches reactive URLs until stopped", async () => {
		const fetch = vi.fn<UseFetchFetch>(async (input) =>
			createTextResponse(String(input)),
		);
		const url = signal<URL | string>("one");
		const request = useFetch(url, {
			fetch,
			immediate: false,
			refetch: true,
		}).text();

		url.value = "two";

		await vi.waitFor(() => {
			expect(fetch).toHaveBeenCalledOnce();
			expect(request.data.value).toBe("two");
		});

		request.stop();
		url.value = "three";
		await Promise.resolve();

		expect(fetch).toHaveBeenCalledOnce();
		expect(request.data.value).toBe("two");
	});

	it("does not fall back to global fetch when window is null", async () => {
		const fetch = vi
			.spyOn(globalThis, "fetch")
			.mockResolvedValue(createTextResponse("global"));
		const request = useFetch("https://example.com/global", {
			window: null,
		}).text();

		await request;

		expect(fetch).not.toHaveBeenCalled();
		expect(request.data.value).toBeNull();
		expect(request.isFinished.value).toBe(true);
	});
});
