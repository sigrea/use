// @vitest-environment node

import { computed, readonly, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAsyncState } from "./index";

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

describe("useAsyncState", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("uses the initial state until the first execution resolves", async () => {
		const deferred = createDeferred<number>();
		const { state, isLoading, isReady } = useAsyncState(
			() => deferred.promise,
			0,
		);

		expect(state.value).toBe(0);
		expect(isLoading.value).toBe(true);
		expect(isReady.value).toBe(false);

		deferred.resolve(2);
		await flushPromises();

		expect(state.value).toBe(2);
		expect(isLoading.value).toBe(false);
		expect(isReady.value).toBe(true);
	});

	it("executes manually when immediate is false", async () => {
		const task = vi.fn(async (value: number) => value * 2);
		const { execute, state, isLoading } = useAsyncState(task, 0, {
			immediate: false,
		});

		expect(state.value).toBe(0);
		expect(isLoading.value).toBe(false);
		expect(task).not.toHaveBeenCalled();

		await expect(execute(0, 3)).resolves.toBe(6);

		expect(task).toHaveBeenCalledWith(3);
		expect(state.value).toBe(6);
	});

	it("executes immediately without delay from executeImmediate", async () => {
		const task = vi.fn(async (value: number) => value);
		const { executeImmediate, state } = useAsyncState(task, 0, {
			immediate: false,
		});

		await executeImmediate(4);

		expect(task).toHaveBeenCalledWith(4);
		expect(state.value).toBe(4);
	});

	it("is awaitable until loading finishes", async () => {
		const deferred = createDeferred<number>();
		const asyncState = useAsyncState(() => deferred.promise, 0);

		expect(asyncState.isLoading.value).toBe(true);

		deferred.resolve(1);
		await asyncState;

		expect(asyncState.isLoading.value).toBe(false);
		expect(asyncState.state.value).toBe(1);
	});

	it("tracks errors and calls onError", async () => {
		const failure = new Error("failed");
		const onError = vi.fn();
		const { error, execute, isLoading, isReady } = useAsyncState(
			() => Promise.reject(failure),
			"initial",
			{ immediate: false, onError },
		);

		await expect(execute()).resolves.toBeUndefined();

		expect(error.value).toBe(failure);
		expect(onError).toHaveBeenCalledWith(failure);
		expect(isLoading.value).toBe(false);
		expect(isReady.value).toBe(false);
	});

	it("throws execution errors when requested", async () => {
		const failure = new Error("failed");
		const { execute } = useAsyncState(() => Promise.reject(failure), "", {
			immediate: false,
			throwError: true,
		});

		await expect(execute()).rejects.toThrow("failed");
	});

	it("reports errors with reportError by default", async () => {
		const originalReportError = globalThis.reportError;
		const reportError = vi.fn();
		globalThis.reportError = reportError;
		const failure = new Error("failed");
		const { execute } = useAsyncState(() => Promise.reject(failure), "", {
			immediate: false,
		});

		try {
			await execute();

			expect(reportError).toHaveBeenCalledWith(failure);
		} finally {
			globalThis.reportError = originalReportError;
		}
	});

	it("calls onSuccess with resolved data", async () => {
		const onSuccess = vi.fn();
		const { execute } = useAsyncState(
			(value: number) => Promise.resolve(value),
			0,
			{
				immediate: false,
				onSuccess,
			},
		);

		await execute(0, 5);

		expect(onSuccess).toHaveBeenCalledWith(5);
	});

	it("respects execute delay and immediate delay", async () => {
		vi.useFakeTimers();
		const immediateTask = vi.fn(async () => 1);
		const manualTask = vi.fn(async () => 2);
		const immediateState = useAsyncState(immediateTask, 0, { delay: 100 });
		const manualState = useAsyncState(manualTask, 0, { immediate: false });

		await vi.advanceTimersByTimeAsync(50);
		await flushPromises();
		expect(immediateTask).not.toHaveBeenCalled();
		expect(immediateState.state.value).toBe(0);

		await vi.advanceTimersByTimeAsync(50);
		await flushPromises();
		expect(immediateTask).toHaveBeenCalledOnce();
		expect(immediateState.state.value).toBe(1);

		const execution = manualState.execute(100);
		await vi.advanceTimersByTimeAsync(99);
		await flushPromises();
		expect(manualTask).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		await execution;
		expect(manualTask).toHaveBeenCalledOnce();
		expect(manualState.state.value).toBe(2);
	});

	it("resets state before executing by default", async () => {
		const first = createDeferred<number>();
		const second = createDeferred<number>();
		const task = vi
			.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const { execute, state } = useAsyncState(task, 0, {
			immediate: false,
		});

		const firstExecution = execute();
		first.resolve(1);
		await firstExecution;
		expect(state.value).toBe(1);

		void execute(0);
		await flushPromises();
		expect(state.value).toBe(0);

		second.resolve(2);
		await flushPromises();
		expect(state.value).toBe(2);
	});

	it("keeps current state while executing when resetOnExecute is false", async () => {
		const deferred = createDeferred<number>();
		const { execute, state } = useAsyncState(() => deferred.promise, 0, {
			immediate: false,
			resetOnExecute: false,
		});

		deferred.resolve(1);
		await execute();
		expect(state.value).toBe(1);

		void execute();
		await flushPromises();
		expect(state.value).toBe(1);
	});

	it("resolves MaybeValue initial state on each reset", async () => {
		const initial = signal(0);
		const computedInitial = computed(() => initial.value + 1);
		const deferred = createDeferred<number>();
		const { execute, state } = useAsyncState(
			() => deferred.promise,
			computedInitial,
			{
				immediate: false,
			},
		);

		initial.value = 2;
		void execute();
		await flushPromises();

		expect(state.value).toBe(3);

		deferred.resolve(10);
		await flushPromises();
		expect(state.value).toBe(10);
	});

	it("accepts promise sources", async () => {
		const { state } = useAsyncState(Promise.resolve(1), 0);

		await flushPromises();

		expect(state.value).toBe(1);
	});

	it("accepts readonly signal initial state", async () => {
		const initial = readonly(signal("initial"));
		const { execute, state } = useAsyncState(
			() => Promise.resolve("ready"),
			initial,
			{
				immediate: false,
			},
		);

		expect(state.value).toBe("initial");

		await execute();
		expect(state.value).toBe("ready");
	});

	it("does not apply outdated execution results", async () => {
		const first = createDeferred<string>();
		const second = createDeferred<string>();
		const task = vi
			.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const { execute, isLoading, isReady, state } = useAsyncState(task, "", {
			immediate: false,
		});

		void execute();
		void execute();

		second.resolve("second");
		await flushPromises();
		expect(state.value).toBe("second");
		expect(isReady.value).toBe(true);
		expect(isLoading.value).toBe(false);

		first.resolve("first");
		await flushPromises();
		expect(state.value).toBe("second");
		expect(isReady.value).toBe(true);
		expect(isLoading.value).toBe(false);
	});

	it("does not apply outdated errors", async () => {
		const first = createDeferred<string>();
		const second = createDeferred<string>();
		const task = vi
			.fn()
			.mockReturnValueOnce(first.promise)
			.mockReturnValueOnce(second.promise);
		const { error, execute } = useAsyncState(task, "", {
			immediate: false,
		});

		void execute();
		void execute();

		second.resolve("second");
		await flushPromises();
		first.reject(new Error("first"));
		await flushPromises();

		expect(error.value).toBeUndefined();
	});
});
