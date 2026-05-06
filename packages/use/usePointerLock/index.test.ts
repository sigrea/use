import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UsePointerLockDocumentLike,
	UsePointerLockElementLike,
} from "../types";
import { usePointerLock } from "./index";

class FakePointerLockElement
	extends EventTarget
	implements UsePointerLockElementLike
{
	requestOptions: Array<PointerLockOptions | undefined> = [];

	constructor(private readonly owner: FakePointerLockDocument) {
		super();
	}

	requestPointerLock = vi.fn(
		async (options?: PointerLockOptions): Promise<void> => {
			this.requestOptions.push(options);
			this.owner.pointerLockElement = this;
			this.owner.dispatchPointerLockChange();
		},
	);
}

class FakePointerLockDocument
	extends EventTarget
	implements UsePointerLockDocumentLike
{
	documentElement: UsePointerLockElementLike;
	pointerLockElement: UsePointerLockElementLike | null = null;

	constructor() {
		super();
		this.documentElement = new FakePointerLockElement(this);
	}

	exitPointerLock = vi.fn(async (): Promise<void> => {
		this.pointerLockElement = null;
		this.dispatchPointerLockChange();
	});

	dispatchPointerLockChange(): void {
		this.dispatchEvent(new Event("pointerlockchange"));
	}

	dispatchPointerLockError(): void {
		this.dispatchEvent(new Event("pointerlockerror"));
	}
}

class VoidPointerLockElement
	extends EventTarget
	implements UsePointerLockElementLike
{
	constructor(private readonly owner: FakePointerLockDocument) {
		super();
	}

	requestPointerLock = vi.fn((options?: PointerLockOptions): void => {
		void options;
		this.owner.pointerLockElement = this;
		this.owner.dispatchPointerLockChange();
	});
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((resolvePromise, rejectPromise) => {
		resolve = resolvePromise;
		reject = rejectPromise;
	});

	return { promise, reject, resolve };
}

describe("usePointerLock", () => {
	afterEach(() => {
		disposeTrackedMolecules();
		vi.clearAllMocks();
	});

	it("stays unsupported and callable without a document", async () => {
		const pointerLock = usePointerLock(undefined, { document: null });

		expect(pointerLock.isSupported.value).toBe(false);
		expect(pointerLock.isLocked.value).toBe(false);
		expect(pointerLock.element.value).toBeNull();

		await pointerLock.lock();
		await pointerLock.unlock();
		await pointerLock.toggle();

		expect(pointerLock.isSupported.value).toBe(false);
		expect(pointerLock.isLocked.value).toBe(false);
		pointerLock.stop();
	});

	it("uses documentElement when target is not provided", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const pointerLock = usePointerLock(undefined, {
			document: fakeDocument,
		});

		expect(pointerLock.isSupported.value).toBe(true);
		expect(pointerLock.isLocked.value).toBe(false);

		await pointerLock.lock({ unadjustedMovement: true });

		const element = fakeDocument.documentElement as FakePointerLockElement;
		expect(element.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(element.requestOptions).toEqual([{ unadjustedMovement: true }]);
		expect(pointerLock.element.value).toBe(element);
		expect(pointerLock.isLocked.value).toBe(true);

		await pointerLock.lock();

		expect(element.requestPointerLock).toHaveBeenCalledTimes(2);
		expect(element.requestOptions).toEqual([
			{ unadjustedMovement: true },
			undefined,
		]);
		expect(pointerLock.element.value).toBe(element);

		await pointerLock.unlock();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBeNull();
		expect(pointerLock.isLocked.value).toBe(false);

		await pointerLock.toggle();
		expect(element.requestPointerLock).toHaveBeenCalledTimes(3);
		expect(pointerLock.isLocked.value).toBe(true);

		await pointerLock.toggle();
		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(2);
		expect(pointerLock.isLocked.value).toBe(false);

		pointerLock.stop();
	});

	it("does not use documentElement when an explicit target is null", async () => {
		const fakeDocument = new FakePointerLockDocument();
		fakeDocument.pointerLockElement = fakeDocument.documentElement;
		const target = signal<UsePointerLockElementLike | null>(null);
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		expect(pointerLock.isSupported.value).toBe(false);
		expect(pointerLock.isLocked.value).toBe(false);
		fakeDocument.dispatchPointerLockChange();
		expect(pointerLock.isLocked.value).toBe(false);
		await pointerLock.lock();

		const element = fakeDocument.documentElement as FakePointerLockElement;
		expect(element.requestPointerLock).not.toHaveBeenCalled();
		expect(pointerLock.isLocked.value).toBe(false);

		await pointerLock.toggle();

		expect(element.requestPointerLock).not.toHaveBeenCalled();
		expect(fakeDocument.exitPointerLock).not.toHaveBeenCalled();
		expect(pointerLock.isLocked.value).toBe(false);
		pointerLock.stop();
	});

	it("handles requestPointerLock implementations that return void", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = new VoidPointerLockElement(fakeDocument);
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await pointerLock.lock();

		expect(target.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBe(target);
		expect(pointerLock.isLocked.value).toBe(true);

		pointerLock.stop();
	});

	it("rejects a pending lock when pointerlockerror fires", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		target.requestPointerLock = vi.fn(() => {
			fakeDocument.dispatchPointerLockError();
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await expect(pointerLock.lock()).rejects.toThrow(
			"Failed to change pointer lock state.",
		);
		expect(pointerLock.isLocked.value).toBe(false);
		pointerLock.stop();
	});

	it("does not leave an unhandled pending promise when request rejects after pointerlockerror", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		target.requestPointerLock = vi.fn(
			() =>
				new Promise<void>((_resolve, reject) => {
					setTimeout(() => {
						fakeDocument.dispatchPointerLockError();
						reject(new Error("api failed"));
					}, 0);
				}),
		);
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await expect(pointerLock.lock()).rejects.toThrow("api failed");
		await Promise.resolve();

		expect(pointerLock.isLocked.value).toBe(false);
		pointerLock.stop();
	});

	it("syncs state from pointer lock events and stops listeners", () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement;
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		fakeDocument.pointerLockElement = target;
		fakeDocument.dispatchPointerLockChange();
		expect(pointerLock.element.value).toBe(target);
		expect(pointerLock.isLocked.value).toBe(true);

		pointerLock.stop();
		fakeDocument.pointerLockElement = null;
		fakeDocument.dispatchPointerLockChange();
		fakeDocument.dispatchPointerLockError();

		expect(pointerLock.element.value).toBe(target);
		expect(pointerLock.isLocked.value).toBe(true);
	});

	it("syncs pointer lock state from the target root", () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const root: { pointerLockElement: UsePointerLockElementLike | null } = {
			pointerLockElement: target,
		};
		Object.defineProperty(target, "getRootNode", {
			configurable: true,
			value: () => root,
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		expect(pointerLock.element.value).toBe(target);
		expect(pointerLock.isLocked.value).toBe(true);

		root.pointerLockElement = null;
		fakeDocument.dispatchPointerLockChange();

		expect(pointerLock.element.value).toBeNull();
		expect(pointerLock.isLocked.value).toBe(false);
		pointerLock.stop();
	});

	it("retargets when the target signal changes", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = fakeDocument.documentElement as FakePointerLockElement;
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await pointerLock.lock();
		expect(pointerLock.element.value).toBe(firstTarget);

		target.value = secondTarget;
		expect(pointerLock.element.value).toBe(firstTarget);

		await pointerLock.unlock();
		await pointerLock.lock();

		expect(secondTarget.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBe(secondTarget);
		pointerLock.stop();
	});

	it("settles a pending lock against the requested target when the target changes", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const request = createDeferred<void>();
		firstTarget.requestPointerLock = vi.fn(async () => {
			await request.promise;
			fakeDocument.pointerLockElement = firstTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const pendingLock = pointerLock.lock();

		target.value = null;
		request.resolve();

		await expect(pendingLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(firstTarget);

		pointerLock.stop();
	});

	it("does not let an old request rejection clear the current pending lock", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const firstRequest = createDeferred<void>();
		target.requestPointerLock = vi.fn(() => firstRequest.promise);
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();
		const secondLock = pointerLock.lock();

		firstRequest.reject(new Error("first failed"));

		await expect(firstLock).rejects.toThrow("first failed");
		await expect(secondLock).rejects.toThrow("first failed");
		expect(target.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBeNull();

		pointerLock.stop();
	});

	it("does not let an old pointerlockerror reject the next promise request", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const firstRequest = createDeferred<void>();
		target.requestPointerLock = vi.fn(() => firstRequest.promise);
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();

		firstRequest.reject(new Error("first failed"));
		await expect(firstLock).rejects.toThrow("first failed");

		const secondRequest = createDeferred<void>();
		target.requestPointerLock = vi.fn(() => secondRequest.promise);
		const secondLock = pointerLock.lock();

		fakeDocument.dispatchPointerLockError();
		fakeDocument.pointerLockElement = target;
		fakeDocument.dispatchPointerLockChange();
		secondRequest.resolve();

		await expect(secondLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(target);
		pointerLock.stop();
	});

	it("requests the current target after a pending lock finishes", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = new FakePointerLockElement(fakeDocument);
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const firstRequest = createDeferred<void>();
		const secondRequest = createDeferred<void>();
		firstTarget.requestPointerLock = vi.fn(async () => {
			await firstRequest.promise;
			fakeDocument.pointerLockElement = firstTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		secondTarget.requestPointerLock = vi.fn(async () => {
			await secondRequest.promise;
			fakeDocument.pointerLockElement = secondTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();

		target.value = secondTarget;
		const secondLock = pointerLock.lock();
		firstRequest.resolve();

		await firstLock;
		await Promise.resolve();

		expect(secondTarget.requestPointerLock).toHaveBeenCalledTimes(1);
		secondRequest.resolve();

		await expect(secondLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(secondTarget);
		pointerLock.stop();
	});

	it("requests the current target after a pending lock fails", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = new FakePointerLockElement(fakeDocument);
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const firstRequest = createDeferred<void>();
		const secondRequest = createDeferred<void>();
		firstTarget.requestPointerLock = vi.fn(() => firstRequest.promise);
		secondTarget.requestPointerLock = vi.fn(async () => {
			await secondRequest.promise;
			fakeDocument.pointerLockElement = secondTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();

		target.value = secondTarget;
		const secondLock = pointerLock.lock();
		firstRequest.reject(new Error("first failed"));

		await expect(firstLock).rejects.toThrow("first failed");
		await Promise.resolve();

		expect(secondTarget.requestPointerLock).toHaveBeenCalledTimes(1);
		secondRequest.resolve();

		await expect(secondLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(secondTarget);
		pointerLock.stop();
	});

	it("does not reject a null target lock with an old pending failure", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const lockTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(lockTarget);
		const request = createDeferred<void>();
		lockTarget.requestPointerLock = vi.fn(() => request.promise);
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();

		target.value = null;
		const nullTargetLock = pointerLock.lock();
		request.reject(new Error("first failed"));

		await expect(firstLock).rejects.toThrow("first failed");
		await expect(nullTargetLock).resolves.toBeUndefined();
		expect(lockTarget.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBeNull();
		pointerLock.stop();
	});

	it("shares a retargeted pending lock between callers", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = new FakePointerLockElement(fakeDocument);
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const firstRequest = createDeferred<void>();
		const secondRequest = createDeferred<void>();
		firstTarget.requestPointerLock = vi.fn(async () => {
			await firstRequest.promise;
			fakeDocument.pointerLockElement = firstTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		secondTarget.requestPointerLock = vi.fn(async () => {
			await secondRequest.promise;
			fakeDocument.pointerLockElement = secondTarget;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const firstLock = pointerLock.lock();

		target.value = secondTarget;
		const secondLock = pointerLock.lock();
		const thirdLock = pointerLock.lock();
		firstRequest.resolve();
		await firstLock;
		await Promise.resolve();

		expect(secondTarget.requestPointerLock).toHaveBeenCalledTimes(1);
		secondRequest.resolve();

		await expect(secondLock).resolves.toBeUndefined();
		await expect(thirdLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(secondTarget);
		pointerLock.stop();
	});

	it("settles a void request against the requested target when the target changes", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const lockTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(lockTarget);
		lockTarget.requestPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = lockTarget;
				fakeDocument.dispatchPointerLockChange();
			}, 0);
		});
		const pointerLock = usePointerLock(target, { document: fakeDocument });
		const pendingLock = pointerLock.lock();

		target.value = null;

		await expect(pendingLock).resolves.toBeUndefined();
		expect(pointerLock.element.value).toBe(lockTarget);
		pointerLock.stop();
	});

	it("settles a void request on the original document after the document changes", async () => {
		const firstDocument = new FakePointerLockDocument();
		const secondDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(firstDocument);
		const target = firstDocument.documentElement as FakePointerLockElement;
		target.requestPointerLock = vi.fn(() => {
			setTimeout(() => {
				firstDocument.pointerLockElement = target;
				firstDocument.dispatchPointerLockChange();
			}, 20);
		});
		const pointerLock = usePointerLock(target, { document });
		const pendingLock = pointerLock.lock();

		document.value = secondDocument;

		await expect(pendingLock).resolves.toBeUndefined();
		expect(target.requestPointerLock).toHaveBeenCalledTimes(1);
		expect(firstDocument.pointerLockElement).toBe(target);
		expect(pointerLock.element.value).toBe(target);
		pointerLock.stop();
	});

	it("unlocks on stop when autoUnlock is enabled", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const pointerLock = usePointerLock(fakeDocument.documentElement, {
			autoUnlock: true,
			document: fakeDocument,
		});

		await pointerLock.lock();
		pointerLock.stop();
		await new Promise((resolve) => {
			setTimeout(resolve, 0);
		});

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBeNull();
		expect(pointerLock.isLocked.value).toBe(false);
	});

	it("unlocks the last locked element when the target becomes null before stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const targetElement =
			fakeDocument.documentElement as FakePointerLockElement;
		const target = signal<UsePointerLockElementLike | null>(targetElement);
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document: fakeDocument,
		});

		await pointerLock.lock();
		target.value = null;
		expect(pointerLock.element.value).toBeNull();

		pointerLock.stop();
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks the last locked element when the target becomes null", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const targetElement =
			fakeDocument.documentElement as FakePointerLockElement;
		const target = signal<UsePointerLockElementLike | null>(targetElement);
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await pointerLock.lock();
		target.value = null;
		expect(pointerLock.element.value).toBeNull();

		await pointerLock.unlock();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
		pointerLock.stop();
	});

	it("unlocks from the last document when the document becomes null", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(fakeDocument);
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const pointerLock = usePointerLock(target, { document });

		await pointerLock.lock();
		document.value = null;
		expect(pointerLock.element.value).toBeNull();

		await pointerLock.unlock();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
		pointerLock.stop();
	});

	it("unlocks from the locked document when the document changes", async () => {
		const firstDocument = new FakePointerLockDocument();
		const secondDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(firstDocument);
		const target = firstDocument.documentElement as FakePointerLockElement;
		const pointerLock = usePointerLock(target, { document });

		await pointerLock.lock();
		document.value = secondDocument;
		expect(pointerLock.element.value).toBeNull();

		await pointerLock.unlock();

		expect(firstDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(secondDocument.exitPointerLock).not.toHaveBeenCalled();
		expect(firstDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
		pointerLock.stop();
	});

	it("waits for a delayed void unlock from the previous document", async () => {
		const firstDocument = new FakePointerLockDocument();
		const secondDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(firstDocument);
		const target = firstDocument.documentElement as FakePointerLockElement;
		const pointerLock = usePointerLock(target, { document });
		let finishExit = () => {};

		await pointerLock.lock();
		document.value = secondDocument;
		firstDocument.exitPointerLock = vi.fn(() => {
			finishExit = () => {
				firstDocument.pointerLockElement = null;
				firstDocument.dispatchPointerLockChange();
			};
		});

		const unlockPromise = pointerLock.unlock();
		await Promise.resolve();
		finishExit();

		await expect(unlockPromise).resolves.toBeUndefined();
		expect(firstDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(secondDocument.exitPointerLock).not.toHaveBeenCalled();
		expect(firstDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
		pointerLock.stop();
	});

	it("unlocks from the last document on stop when the document becomes null", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(fakeDocument);
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document,
		});

		await pointerLock.lock();
		document.value = null;
		expect(pointerLock.element.value).toBeNull();

		pointerLock.stop();
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks a pending promise lock after the document becomes null before stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(fakeDocument);
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const request = createDeferred<void>();
		target.requestPointerLock = vi.fn(async () => {
			await request.promise;
			fakeDocument.pointerLockElement = target;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document,
		});
		const pendingLock = pointerLock.lock();

		document.value = null;
		pointerLock.stop();
		request.resolve();

		await expect(pendingLock).rejects.toThrow(
			"Pointer lock controls were stopped.",
		);
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks a pending void lock after the document becomes null before stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const document = signal<UsePointerLockDocumentLike | null>(fakeDocument);
		const target = fakeDocument.documentElement as FakePointerLockElement;
		target.requestPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = target;
				fakeDocument.dispatchPointerLockChange();
			}, 20);
		});
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document,
		});
		const pendingLock = pointerLock.lock();

		document.value = null;
		pointerLock.stop();

		await expect(pendingLock).rejects.toThrow(
			"Pointer lock controls were stopped.",
		);
		await new Promise((resolve) => {
			setTimeout(resolve, 25);
		});
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("locks again after a pending void unlock finishes", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const pointerLock = usePointerLock(target, { document: fakeDocument });

		await pointerLock.lock();
		fakeDocument.exitPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = null;
				fakeDocument.dispatchPointerLockChange();
			}, 20);
		});

		const pendingUnlock = pointerLock.unlock();
		const pendingLock = pointerLock.lock();

		await pendingUnlock;
		await pendingLock;

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(target.requestPointerLock).toHaveBeenCalledTimes(2);
		expect(fakeDocument.pointerLockElement).toBe(target);
		expect(pointerLock.element.value).toBe(target);
		pointerLock.stop();
	});

	it("unlocks a pending promise lock that completes after stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		const request = createDeferred<void>();
		target.requestPointerLock = vi.fn(async () => {
			await request.promise;
			fakeDocument.pointerLockElement = target;
			fakeDocument.dispatchPointerLockChange();
		});
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document: fakeDocument,
		});
		const pendingLock = pointerLock.lock();

		pointerLock.stop();
		request.resolve();

		await expect(pendingLock).rejects.toThrow(
			"Pointer lock controls were stopped.",
		);
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks the current element when a pending lock fails after stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = fakeDocument.documentElement as FakePointerLockElement;
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document: fakeDocument,
		});

		await pointerLock.lock();
		expect(pointerLock.element.value).toBe(firstTarget);

		const request = createDeferred<void>();
		secondTarget.requestPointerLock = vi.fn(() => request.promise);
		target.value = secondTarget;
		const pendingLock = pointerLock.lock();

		pointerLock.stop();
		request.reject(new Error("second failed"));

		await expect(pendingLock).rejects.toThrow("second failed");
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks a pending void lock that completes after stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const target = fakeDocument.documentElement as FakePointerLockElement;
		target.requestPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = target;
				fakeDocument.dispatchPointerLockChange();
			}, 20);
		});
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document: fakeDocument,
		});
		const pendingLock = pointerLock.lock();

		pointerLock.stop();

		await expect(pendingLock).rejects.toThrow(
			"Pointer lock controls were stopped.",
		);
		await new Promise((resolve) => {
			setTimeout(resolve, 25);
		});
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("unlocks a delayed void lock after stopping with a current lock", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const firstTarget = fakeDocument.documentElement as FakePointerLockElement;
		const secondTarget = new FakePointerLockElement(fakeDocument);
		const target = signal<UsePointerLockElementLike | null>(firstTarget);
		const pointerLock = usePointerLock(target, {
			autoUnlock: true,
			document: fakeDocument,
		});

		await pointerLock.lock();
		expect(pointerLock.element.value).toBe(firstTarget);

		secondTarget.requestPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = secondTarget;
				fakeDocument.dispatchPointerLockChange();
			}, 20);
		});
		target.value = secondTarget;
		const pendingLock = pointerLock.lock();

		pointerLock.stop();

		await expect(pendingLock).rejects.toThrow(
			"Pointer lock controls were stopped.",
		);
		await new Promise((resolve) => {
			setTimeout(resolve, 25);
		});
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(2);
		expect(fakeDocument.pointerLockElement).toBeNull();
		expect(pointerLock.element.value).toBeNull();
	});

	it("ignores autoUnlock rejection during stop", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const pointerLock = usePointerLock(fakeDocument.documentElement, {
			autoUnlock: true,
			document: fakeDocument,
		});
		await pointerLock.lock();
		fakeDocument.exitPointerLock = vi.fn(async () => {
			throw new Error("exit failed");
		});

		pointerLock.stop();
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
	});

	it("syncs autoUnlock after a void exitPointerLock finishes asynchronously", async () => {
		const fakeDocument = new FakePointerLockDocument();
		const pointerLock = usePointerLock(fakeDocument.documentElement, {
			autoUnlock: true,
			document: fakeDocument,
		});
		await pointerLock.lock();
		fakeDocument.exitPointerLock = vi.fn(() => {
			setTimeout(() => {
				fakeDocument.pointerLockElement = null;
				fakeDocument.dispatchPointerLockChange();
			}, 20);
		});

		pointerLock.stop();
		await new Promise((resolve) => {
			setTimeout(resolve, 25);
		});
		await Promise.resolve();

		expect(fakeDocument.exitPointerLock).toHaveBeenCalledTimes(1);
		expect(pointerLock.element.value).toBeNull();
		expect(pointerLock.isLocked.value).toBe(false);
	});
});
