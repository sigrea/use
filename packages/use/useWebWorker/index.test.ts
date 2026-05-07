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
	UseWebWorkerWindowLike,
	WorkerConstructorLike,
	WorkerLike,
} from "../types";
import { useWebWorker } from "./index";

class FakeWorker extends EventTarget implements WorkerLike {
	static instances: FakeWorker[] = [];
	static thrownError: unknown;

	terminated = false;
	throwOnPost: unknown;
	readonly posts: Array<{
		message: unknown;
		transferOrOptions?: Transferable[] | StructuredSerializeOptions;
	}> = [];

	constructor(
		readonly scriptURL: string | URL,
		readonly options?: WorkerOptions,
	) {
		super();

		if (FakeWorker.thrownError !== undefined) {
			throw FakeWorker.thrownError;
		}

		FakeWorker.instances.push(this);
	}

	postMessage(message: unknown, transfer: Transferable[]): void;
	postMessage(message: unknown, options?: StructuredSerializeOptions): void;
	postMessage(
		message: unknown,
		transferOrOptions?: Transferable[] | StructuredSerializeOptions,
	): void {
		if (this.throwOnPost !== undefined) {
			throw this.throwOnPost;
		}

		this.posts.push({ message, transferOrOptions });
	}

	terminate(): void {
		this.terminated = true;
	}

	emitMessage(data: unknown): void {
		this.dispatchEvent(new MessageEvent("message", { data }));
	}

	emitError(): Event {
		const event = new Event("error");
		this.dispatchEvent(event);
		return event;
	}

	emitMessageError(data: unknown): MessageEvent {
		const event = new MessageEvent("messageerror", { data });
		this.dispatchEvent(event);
		return event;
	}
}

class FakeWindow
	extends EventTarget
	implements UseWebWorkerWindowLike<FakeWorker>
{
	readonly Worker: WorkerConstructorLike<FakeWorker> = FakeWorker;
}

class UnsupportedWindow extends EventTarget {}

function latestWorker(): FakeWorker {
	const worker = FakeWorker.instances.at(-1);
	if (worker === undefined) {
		throw new Error("worker was not created");
	}

	return worker;
}

describe("useWebWorker", () => {
	afterEach(() => {
		FakeWorker.instances = [];
		FakeWorker.thrownError = undefined;
		disposeTrackedMolecules();
	});

	it("stays safe without Worker support", () => {
		const result = useWebWorker("worker.js", { window: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.worker.value).toBeUndefined();
		expect(result.data.value).toBeNull();
		expect(result.error.value).toBeNull();
		expect(result.post("message")).toBe(false);

		result.open();
		result.terminate();
		result.stop();

		expect(FakeWorker.instances).toHaveLength(0);
	});

	it("creates a worker with constructor options and posts messages", () => {
		const workerOptions: WorkerOptions = {
			credentials: "include",
			name: "sigrea-worker",
			type: "module",
		};
		const result = useWebWorker<string, { type: string }, FakeWorker>(
			"worker.js",
			{
				workerOptions,
				window: new FakeWindow(),
			},
		);
		const worker = latestWorker();

		expect(result.isSupported.value).toBe(true);
		expect(result.worker.value).toBe(worker);
		expect(worker.scriptURL).toBe("worker.js");
		expect(worker.options).toBe(workerOptions);
		expect(result.post({ type: "start" }, [])).toBe(true);
		expect(result.post({ type: "stop" }, { transfer: [] })).toBe(true);
		expect(worker.posts).toEqual([
			{ message: { type: "start" }, transferOrOptions: [] },
			{ message: { type: "stop" }, transferOrOptions: { transfer: [] } },
		]);

		result.stop();
	});

	it("binds an existing worker without requiring a window", () => {
		const worker = new FakeWorker("manual.js");
		const onMessage = vi.fn();
		const result = useWebWorker<string, unknown, FakeWorker>(worker, {
			onMessage,
			window: null,
		});

		worker.emitMessage("ready");

		expect(result.isSupported.value).toBe(true);
		expect(result.worker.value).toBe(worker);
		expect(result.data.value).toBe("ready");
		expect(onMessage).toHaveBeenCalledWith(worker, expect.any(MessageEvent));

		result.stop();
	});

	it("tracks error and messageerror events", () => {
		const onError = vi.fn();
		const onMessageError = vi.fn();
		const result = useWebWorker("worker.js", {
			onError,
			onMessageError,
			window: new FakeWindow(),
		});
		const worker = latestWorker();

		const errorEvent = worker.emitError();
		expect(result.error.value).toBe(errorEvent);
		expect(onError).toHaveBeenCalledWith(worker, errorEvent);

		const messageError = worker.emitMessageError("bad");
		expect(result.error.value).toBe(messageError);
		expect(onMessageError).toHaveBeenCalledWith(worker, messageError);

		result.stop();
	});

	it("waits for open when immediate is false", () => {
		const result = useWebWorker("worker.js", {
			immediate: false,
			window: new FakeWindow(),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.worker.value).toBeUndefined();
		expect(FakeWorker.instances).toHaveLength(0);

		result.open();

		expect(result.worker.value).toBe(latestWorker());
		result.stop();
	});

	it("uses an injected constructor without a window", () => {
		const result = useWebWorker("worker.js", {
			window: null,
			worker: FakeWorker,
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.worker.value).toBe(latestWorker());
		result.stop();
	});

	it("keeps the existing worker when autoConnect is false", () => {
		const source = signal<string | URL | null | undefined>("one.js");
		const result = useWebWorker(source, {
			autoConnect: false,
			window: new FakeWindow(),
		});
		const firstWorker = latestWorker();

		source.value = "two.js";

		expect(result.worker.value).toBe(firstWorker);
		expect(firstWorker.terminated).toBe(false);
		expect(FakeWorker.instances).toHaveLength(1);

		result.open();

		expect(firstWorker.terminated).toBe(true);
		expect(result.worker.value).toBe(latestWorker());
		expect(FakeWorker.instances).toHaveLength(2);
		result.stop();
	});

	it("recreates the worker and ignores stale events when the source changes", () => {
		const source = signal<string | URL | null | undefined>("one.js");
		const result = useWebWorker<string, unknown, FakeWorker>(source, {
			window: new FakeWindow(),
		});
		const firstWorker = latestWorker();

		source.value = "two.js";
		const secondWorker = latestWorker();
		firstWorker.emitMessage("stale");
		secondWorker.emitMessage("fresh");

		expect(firstWorker.terminated).toBe(true);
		expect(result.worker.value).toBe(secondWorker);
		expect(result.data.value).toBe("fresh");

		result.stop();
	});

	it("stores constructor and postMessage errors", () => {
		const thrownError = new Error("blocked");
		FakeWorker.thrownError = thrownError;
		const result = useWebWorker("worker.js", {
			window: new FakeWindow(),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.worker.value).toBeUndefined();
		expect(result.error.value).toBe(thrownError);

		FakeWorker.thrownError = undefined;
		result.open();
		const worker = latestWorker();
		const postError = new Error("clone failed");
		worker.throwOnPost = postError;

		expect(result.post({ value: "bad" })).toBe(false);
		expect(result.error.value).toBe(postError);

		result.stop();
	});

	it("terminates the current worker and removes listeners", () => {
		const result = useWebWorker<string, unknown, FakeWorker>("worker.js", {
			window: new FakeWindow(),
		});
		const worker = latestWorker();

		result.terminate();
		worker.emitMessage("late");

		expect(worker.terminated).toBe(true);
		expect(result.worker.value).toBeUndefined();
		expect(result.post("message")).toBe(false);
		expect(result.data.value).toBeNull();
	});

	it("recreates the worker after terminate when the source changes", () => {
		const source = signal<string | URL | null | undefined>("one.js");
		const result = useWebWorker<unknown, string, FakeWorker>(source, {
			window: new FakeWindow(),
		});
		const firstWorker = latestWorker();

		result.terminate();
		source.value = "two.js";
		const secondWorker = latestWorker();

		expect(firstWorker.terminated).toBe(true);
		expect(secondWorker).not.toBe(firstWorker);
		expect(result.worker.value).toBe(secondWorker);
		expect(result.post("ready")).toBe(true);
		expect(secondWorker.posts).toEqual([{ message: "ready" }]);

		result.stop();
	});

	it("does not restore a terminated existing worker when unused options change", () => {
		const workerOptions = signal<WorkerOptions | undefined>({ name: "one" });
		const existingWorker = new FakeWorker("manual.js");
		const result = useWebWorker<unknown, string, FakeWorker>(existingWorker, {
			workerOptions,
			window: null,
		});

		result.terminate();
		workerOptions.value = { name: "two" };

		expect(existingWorker.terminated).toBe(true);
		expect(result.worker.value).toBeUndefined();
		expect(result.post("late")).toBe(false);
		expect(existingWorker.posts).toEqual([]);
	});

	it("terminates the worker on scope disposal", () => {
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useWebWorker("worker.js", { window: new FakeWindow() }),
		);
		const worker = latestWorker();

		disposeScope(scope);

		expect(worker.terminated).toBe(true);
		expect(result.worker.value).toBeUndefined();
	});

	it("does not auto-terminate on scope disposal when disabled", () => {
		const scope = createScope();
		const result = runWithScope(scope, () =>
			useWebWorker("worker.js", {
				autoTerminate: false,
				window: new FakeWindow(),
			}),
		);
		const worker = latestWorker();

		disposeScope(scope);

		expect(worker.terminated).toBe(false);
		expect(result.worker.value).toBe(worker);
		result.stop();
	});

	it("closes the worker when support disappears", () => {
		const window = signal<
			UseWebWorkerWindowLike<FakeWorker> | null | undefined
		>(new FakeWindow());
		const result = useWebWorker("worker.js", { window });
		const worker = latestWorker();

		window.value = new UnsupportedWindow();

		expect(result.isSupported.value).toBe(false);
		expect(worker.terminated).toBe(true);
		expect(result.worker.value).toBeUndefined();

		result.stop();
	});

	it("closes the current URL worker when support disappears with autoConnect disabled", () => {
		const window = signal<
			UseWebWorkerWindowLike<FakeWorker> | null | undefined
		>(new FakeWindow());
		const result = useWebWorker("worker.js", {
			autoConnect: false,
			window,
		});
		const worker = latestWorker();

		window.value = null;

		expect(result.isSupported.value).toBe(false);
		expect(worker.terminated).toBe(true);
		expect(result.worker.value).toBeUndefined();
		expect(result.post("message")).toBe(false);

		result.stop();
	});
});
