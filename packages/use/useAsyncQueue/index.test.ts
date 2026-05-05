// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { useAsyncQueue } from "./index";

interface Deferred<T> {
	promise: Promise<T>;
	reject(error: unknown): void;
	resolve(value: T): void;
}

function createDeferred<T>(): Deferred<T> {
	let reject!: (error: unknown) => void;
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

async function flushPromises(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

describe("useAsyncQueue", () => {
	it("returns pending results until tasks settle", async () => {
		const first = createDeferred<number>();
		const { activeIndex, result } = useAsyncQueue([() => first.promise]);

		expect(activeIndex.value).toBe(-1);
		expect(result.value).toEqual([{ state: "pending", data: null }]);

		first.resolve(1000);
		await flushPromises();

		expect(activeIndex.value).toBe(0);
		expect(result.value).toEqual([{ state: "fulfilled", data: 1000 }]);
	});

	it("runs tasks sequentially and passes each result to the next task", async () => {
		const first = createDeferred<number>();
		const second = createDeferred<number>();
		const secondTask = vi.fn((value: number) => second.promise);
		const { activeIndex, result } = useAsyncQueue([
			() => first.promise,
			secondTask,
		]);

		await flushPromises();
		expect(secondTask).not.toHaveBeenCalled();

		first.resolve(1000);
		await flushPromises();
		expect(activeIndex.value).toBe(0);
		expect(secondTask).toHaveBeenCalledWith(1000);

		second.resolve(2000);
		await flushPromises();
		expect(activeIndex.value).toBe(1);
		expect(result.value).toEqual([
			{ state: "fulfilled", data: 1000 },
			{ state: "fulfilled", data: 2000 },
		]);
	});

	it("supports synchronous task results", async () => {
		const { activeIndex, result } = useAsyncQueue([
			() => 1,
			(value: number) => value + 1,
		]);

		await flushPromises();

		expect(activeIndex.value).toBe(1);
		expect(result.value).toEqual([
			{ state: "fulfilled", data: 1 },
			{ state: "fulfilled", data: 2 },
		]);
	});

	it("calls onFinished when all tasks finish", async () => {
		const onFinished = vi.fn();
		const { activeIndex } = useAsyncQueue([() => Promise.resolve(1)], {
			onFinished,
		});

		await flushPromises();

		expect(activeIndex.value).toBe(0);
		expect(onFinished).toHaveBeenCalledOnce();
	});

	it("calls onFinished immediately for an empty queue", () => {
		const onFinished = vi.fn();
		const { activeIndex, result } = useAsyncQueue([], { onFinished });

		expect(activeIndex.value).toBe(-1);
		expect(result.value).toEqual([]);
		expect(onFinished).toHaveBeenCalledOnce();
	});

	it("calls onError and interrupts remaining tasks when a task rejects", async () => {
		const error = new Error("failed");
		const finalTask = vi.fn(() => Promise.resolve("final"));
		const onError = vi.fn();
		const onFinished = vi.fn();
		const { activeIndex, result } = useAsyncQueue(
			[() => Promise.resolve("first"), () => Promise.reject(error), finalTask],
			{ onError, onFinished },
		);

		await flushPromises();

		expect(activeIndex.value).toBe(1);
		expect(result.value).toEqual([
			{ state: "fulfilled", data: "first" },
			{ state: "rejected", data: error },
			{ state: "pending", data: null },
		]);
		expect(onError).toHaveBeenCalledOnce();
		expect(onFinished).toHaveBeenCalledOnce();
		expect(finalTask).not.toHaveBeenCalled();
	});

	it("continues remaining tasks after rejection when interrupt is false", async () => {
		const error = new Error("failed");
		const finalTask = vi.fn((value: Error) => Promise.resolve(value.message));
		const { activeIndex, result } = useAsyncQueue(
			[() => Promise.reject(error), finalTask],
			{ interrupt: false },
		);

		await flushPromises();

		expect(activeIndex.value).toBe(1);
		expect(finalTask).toHaveBeenCalledWith(error);
		expect(result.value).toEqual([
			{ state: "rejected", data: error },
			{ state: "fulfilled", data: "failed" },
		]);
	});

	it("calls onFinished when the last task rejects", async () => {
		const onFinished = vi.fn();
		const { activeIndex } = useAsyncQueue([() => Promise.reject("failed")], {
			onFinished,
		});

		await flushPromises();

		expect(activeIndex.value).toBe(0);
		expect(onFinished).toHaveBeenCalledOnce();
	});

	it("does not run tasks when the signal is already aborted", async () => {
		const controller = new AbortController();
		const task = vi.fn(() => Promise.resolve("ready"));
		controller.abort();
		const { activeIndex, result } = useAsyncQueue([task], {
			signal: controller.signal,
		});

		await flushPromises();

		expect(activeIndex.value).toBe(0);
		expect(result.value[0].state).toBe("aborted");
		expect(result.value[0].data).toBeInstanceOf(Error);
		expect(task).not.toHaveBeenCalled();
	});

	it("aborts current and remaining tasks after AbortSignal is triggered", async () => {
		const controller = new AbortController();
		const finalTask = vi.fn(() => Promise.resolve("final"));
		const { activeIndex, result } = useAsyncQueue(
			[
				() => Promise.resolve("first"),
				() => {
					controller.abort();
				},
				finalTask,
			],
			{ signal: controller.signal },
		);

		await flushPromises();

		expect(activeIndex.value).toBe(2);
		expect(result.value[0]).toEqual({ state: "fulfilled", data: "first" });
		expect(result.value[1].state).toBe("aborted");
		expect(result.value[1].data).toBeInstanceOf(Error);
		expect(result.value[2].state).toBe("aborted");
		expect(result.value[2].data).toBeInstanceOf(Error);
		expect(finalTask).not.toHaveBeenCalled();
	});

	it("ignores a task result after abort", async () => {
		const controller = new AbortController();
		const first = createDeferred<string>();
		const finalTask = vi.fn(() => Promise.resolve("final"));
		const { activeIndex, result } = useAsyncQueue(
			[() => first.promise, finalTask],
			{ signal: controller.signal },
		);

		controller.abort();
		await flushPromises();

		expect(activeIndex.value).toBe(1);
		expect(result.value[0].state).toBe("aborted");
		expect(result.value[1].state).toBe("aborted");
		expect(finalTask).not.toHaveBeenCalled();

		first.resolve("ready");
		await flushPromises();

		expect(activeIndex.value).toBe(1);
		expect(result.value[0].state).toBe("aborted");
		expect(result.value[1].state).toBe("aborted");
	});

	it("handles a delayed rejection after aborting inside a task", async () => {
		const controller = new AbortController();
		const lateFailure = createDeferred<string>();
		const unhandled: unknown[] = [];
		const onUnhandledRejection = (reason: unknown) => {
			unhandled.push(reason);
		};
		const processLike = (
			globalThis as typeof globalThis & {
				process: {
					off(
						event: "unhandledRejection",
						listener: (reason: unknown) => void,
					): void;
					on(
						event: "unhandledRejection",
						listener: (reason: unknown) => void,
					): void;
				};
			}
		).process;
		processLike.on("unhandledRejection", onUnhandledRejection);

		try {
			const { activeIndex, result } = useAsyncQueue(
				[
					() => {
						controller.abort();
						return lateFailure.promise;
					},
				],
				{ signal: controller.signal },
			);

			await flushPromises();

			expect(activeIndex.value).toBe(0);
			expect(result.value[0].state).toBe("aborted");

			lateFailure.reject(new Error("late failure"));
			await flushPromises();

			expect(unhandled).toEqual([]);
		} finally {
			processLike.off("unhandledRejection", onUnhandledRejection);
		}
	});
});
