// @vitest-environment node

import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseWebWorkerFnCallable,
	UseWebWorkerFnOptions,
	UseWebWorkerFnWindowLike,
	WorkerConstructorLike,
	WorkerLike,
} from "../types";
import { useWebWorkerFn } from "./index";

class FakeWorker extends EventTarget implements WorkerLike {
	static instances: FakeWorker[] = [];
	static constructorError: unknown;
	static postError: unknown;

	terminated = false;
	readonly posts: unknown[] = [];

	constructor(readonly scriptURL: string | URL) {
		super();
		if (FakeWorker.constructorError !== undefined) {
			throw FakeWorker.constructorError;
		}

		FakeWorker.instances.push(this);
	}

	postMessage(message: unknown, transfer: Transferable[]): void;
	postMessage(message: unknown, options?: StructuredSerializeOptions): void;
	postMessage(message: unknown): void {
		if (FakeWorker.postError !== undefined) {
			throw FakeWorker.postError;
		}

		this.posts.push(message);
	}

	terminate(): void {
		this.terminated = true;
	}

	emitMessage(data: unknown): void {
		this.dispatchEvent(new MessageEvent("message", { data }));
	}

	emitError(): Event {
		const event = new Event("error", { cancelable: true });
		this.dispatchEvent(event);
		return event;
	}
}

class FakeWindow
	extends EventTarget
	implements UseWebWorkerFnWindowLike<FakeWorker>
{
	readonly Blob = Blob;
	readonly createdBlobs = new Map<string, Blob>();
	readonly revokedUrls: string[] = [];
	readonly URL = {
		createObjectURL: vi.fn((blob: Blob) => {
			const url = `blob:sigrea-${this.createdBlobs.size + 1}`;
			this.createdBlobs.set(url, blob);
			return url;
		}),
		revokeObjectURL: vi.fn((url: string) => {
			this.revokedUrls.push(url);
			this.createdBlobs.delete(url);
		}),
	};

	constructor(
		readonly Worker: WorkerConstructorLike<FakeWorker> | null = FakeWorker,
	) {
		super();
	}
}

function latestWorker(): FakeWorker {
	const worker = FakeWorker.instances.at(-1);
	if (worker === undefined) {
		throw new Error("worker was not created");
	}

	return worker;
}

function useFakeWebWorkerFn<
	T extends UseWebWorkerFnCallable,
	TWindow extends UseWebWorkerFnWindowLike<FakeWorker> = FakeWindow,
>(fn: T, options: UseWebWorkerFnOptions<FakeWorker, TWindow> = {}) {
	return useWebWorkerFn<T, FakeWorker, TWindow>(fn, options);
}

describe("useWebWorkerFn", () => {
	afterEach(() => {
		FakeWorker.instances = [];
		FakeWorker.constructorError = undefined;
		FakeWorker.postError = undefined;
		vi.useRealTimers();
		disposeTrackedMolecules();
	});

	it("rejects safely without worker function support", async () => {
		const result = useFakeWebWorkerFn((value: number) => value * 2, {
			window: null,
		});

		expect(result.isSupported.value).toBe(false);
		expect(result.error.value).toBeNull();
		await expect(result.workerFn(2)).rejects.toThrow(
			"Worker, Blob, or object URL support is missing",
		);
		expect(result.workerStatus.value).toBe("ERROR");

		result.stop();
	});

	it("creates a worker blob, posts arguments, and resolves success", async () => {
		const window = new FakeWindow();
		const pow = (value: number) => value * value;
		const result = useFakeWebWorkerFn(
			(left: number, right: number) => pow(left) + right,
			{
				dependencies: ["https://example.test/math.js"],
				localDependencies: [pow],
				window,
			},
		);

		const promise = result.workerFn(2, 3);
		const worker = latestWorker();
		const blob = window.createdBlobs.get(String(worker.scriptURL));

		expect(result.isSupported.value).toBe(true);
		expect(result.workerStatus.value).toBe("RUNNING");
		expect(worker.posts).toEqual([[2, 3]]);
		await expect(blob?.text()).resolves.toContain(
			'importScripts("https://example.test/math.js")',
		);
		await expect(blob?.text()).resolves.toContain("const pow =");

		worker.emitMessage(["SUCCESS", 7]);

		await expect(promise).resolves.toBe(7);
		expect(result.workerStatus.value).toBe("SUCCESS");
		expect(worker.terminated).toBe(true);
		expect(window.revokedUrls).toEqual([String(worker.scriptURL)]);
	});

	it("rejects worker error messages and error events", async () => {
		const result = useFakeWebWorkerFn((value: number) => value * 2, {
			window: new FakeWindow(),
		});

		const rejectedMessage = result.workerFn(2);
		latestWorker().emitMessage(["ERROR", "failed"]);

		await expect(rejectedMessage).rejects.toBe("failed");
		expect(result.error.value).toBe("failed");
		expect(result.workerStatus.value).toBe("ERROR");

		const rejectedUndefined = result.workerFn(3);
		latestWorker().emitMessage(["ERROR", undefined]);

		await expect(rejectedUndefined).rejects.toBeUndefined();
		expect(result.error.value).toBeUndefined();
		expect(result.workerStatus.value).toBe("ERROR");

		const rejectedEvent = result.workerFn(4);
		const event = latestWorker().emitError();

		await expect(rejectedEvent).rejects.toBe(event);
		expect(event.defaultPrevented).toBe(true);
		expect(result.error.value).toBe(event);
	});

	it("rejects when worker postMessage fails", async () => {
		const postError = new Error("post failed");
		FakeWorker.postError = postError;
		const window = new FakeWindow();
		const result = useFakeWebWorkerFn((value: number) => value, { window });

		await expect(result.workerFn(1)).rejects.toBe(postError);

		const worker = latestWorker();
		expect(result.workerStatus.value).toBe("ERROR");
		expect(result.error.value).toBe(postError);
		expect(worker.terminated).toBe(true);
		expect(window.revokedUrls).toEqual([String(worker.scriptURL)]);
	});

	it("revokes the worker URL when worker construction fails", async () => {
		const constructorError = new Error("worker construction failed");
		FakeWorker.constructorError = constructorError;
		const window = new FakeWindow();
		const result = useFakeWebWorkerFn((value: number) => value, { window });

		await expect(result.workerFn(1)).rejects.toBe(constructorError);

		expect(result.workerStatus.value).toBe("ERROR");
		expect(result.error.value).toBe(constructorError);
		expect(window.revokedUrls).toEqual(["blob:sigrea-1"]);
	});

	it("revokes the worker URL with the URL API that created it", async () => {
		const firstWindow = new FakeWindow();
		const secondWindow = new FakeWindow();
		const window = signal<UseWebWorkerFnWindowLike<FakeWorker> | null>(
			firstWindow,
		);
		const result = useFakeWebWorkerFn((value: number) => value, { window });

		const promise = result.workerFn(1);
		const worker = latestWorker();
		window.value = secondWindow;

		worker.emitMessage(["SUCCESS", 1]);

		await expect(promise).resolves.toBe(1);
		expect(firstWindow.revokedUrls).toEqual([String(worker.scriptURL)]);
		expect(secondWindow.revokedUrls).toEqual([]);
	});

	it("terminates and rejects when timeout expires", async () => {
		vi.useFakeTimers();
		const result = useFakeWebWorkerFn((value: number) => value, {
			timeout: 50,
			window: new FakeWindow(),
		});

		const promise = result.workerFn(1);
		const worker = latestWorker();

		vi.advanceTimersByTime(50);

		await expect(promise).rejects.toThrow("worker timed out");
		expect(result.workerStatus.value).toBe("TIMEOUT_EXPIRED");
		expect(worker.terminated).toBe(true);
	});

	it("rejects concurrent runs", async () => {
		const result = useFakeWebWorkerFn((value: number) => value, {
			window: new FakeWindow(),
		});

		const first = result.workerFn(1);
		await expect(result.workerFn(2)).rejects.toThrow(
			"only one worker function can run at a time",
		);

		latestWorker().emitMessage(["SUCCESS", 1]);

		await expect(first).resolves.toBe(1);
	});

	it("terminates the active worker manually", async () => {
		const result = useFakeWebWorkerFn((value: number) => value, {
			window: new FakeWindow(),
		});

		const promise = result.workerFn(1);
		const worker = latestWorker();

		result.workerTerminate();

		await expect(promise).rejects.toThrow("worker terminated");
		expect(result.workerStatus.value).toBe("PENDING");
		expect(worker.terminated).toBe(true);
	});

	it("rejects manual termination even when called with an invalid success status", async () => {
		const result = useFakeWebWorkerFn((value: number) => value, {
			window: new FakeWindow(),
		});

		const promise = result.workerFn(1);
		const worker = latestWorker();

		result.workerTerminate("SUCCESS" as never);

		await expect(promise).rejects.toThrow("worker terminated");
		expect(result.workerStatus.value).toBe("PENDING");
		expect(worker.terminated).toBe(true);
	});

	it("terminates the active worker on scope disposal", async () => {
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useFakeWebWorkerFn((value: number) => value, {
				window: new FakeWindow(),
			}),
		);

		const promise = result.workerFn(1);
		const worker = latestWorker();

		disposeScope(scope);

		await expect(promise).rejects.toThrow("worker terminated");
		expect(worker.terminated).toBe(true);
	});

	it("uses an injected constructor", async () => {
		const window = new FakeWindow(null);
		const result = useFakeWebWorkerFn((value: number) => value, {
			window,
			worker: FakeWorker,
		});

		const promise = result.workerFn(4);
		latestWorker().emitMessage(["SUCCESS", 4]);

		await expect(promise).resolves.toBe(4);
		expect(result.isSupported.value).toBe(true);
	});

	it("rejects unnamed local dependencies", async () => {
		const result = useFakeWebWorkerFn((value: number) => value, {
			localDependencies: [(() => 1) as () => number],
			window: new FakeWindow(),
		});

		await expect(result.workerFn(1)).rejects.toThrow(
			"localDependencies must contain named functions",
		);
		expect(result.workerStatus.value).toBe("ERROR");
	});

	it("stops future calls", async () => {
		const result = useFakeWebWorkerFn((value: number) => value, {
			window: new FakeWindow(),
		});

		result.stop();

		await expect(result.workerFn(1)).rejects.toThrow(
			"worker function is stopped",
		);
	});
});
