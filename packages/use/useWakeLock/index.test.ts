import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { describe, expect, it, vi } from "vitest";

import type {
	UseWakeLockDocumentLike,
	UseWakeLockNavigatorLike,
	UseWakeLockOptions,
	UseWakeLockSentinelLike,
	WakeLockType,
} from "../types";
import { useWakeLock } from "./index";

class FakeWakeLockSentinel
	extends EventTarget
	implements UseWakeLockSentinelLike
{
	released = false;
	readonly release = vi.fn(async () => {
		if (this.released) {
			return;
		}

		this.released = true;
		this.dispatchEvent(new Event("release"));
	});

	constructor(readonly type: WakeLockType = "screen") {
		super();
	}

	autoRelease(): void {
		if (this.released) {
			return;
		}

		this.released = true;
		this.dispatchEvent(new Event("release"));
	}
}

class FakeWakeLock {
	readonly sentinels: FakeWakeLockSentinel[] = [];
	readonly request = vi.fn(async (type: WakeLockType) => {
		const sentinel = new FakeWakeLockSentinel(type);
		this.sentinels.push(sentinel);

		return sentinel;
	});
}

class FakeDocument extends EventTarget implements UseWakeLockDocumentLike {
	visibilityState: DocumentVisibilityState;

	constructor(visibilityState: DocumentVisibilityState = "visible") {
		super();
		this.visibilityState = visibilityState;
	}

	setVisibility(visibilityState: DocumentVisibilityState): void {
		this.visibilityState = visibilityState;
		this.dispatchEvent(new Event("visibilitychange"));
	}
}

function createNavigator(
	wakeLock?: FakeWakeLock | null,
): UseWakeLockNavigatorLike<FakeWakeLockSentinel> {
	return { wakeLock };
}

function useFakeWakeLock(
	options: UseWakeLockOptions<
		FakeWakeLockSentinel,
		UseWakeLockNavigatorLike<FakeWakeLockSentinel>,
		UseWakeLockDocumentLike
	> = {},
) {
	return useWakeLock<
		FakeWakeLockSentinel,
		UseWakeLockNavigatorLike<FakeWakeLockSentinel>,
		UseWakeLockDocumentLike
	>(options);
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

describe("useWakeLock", () => {
	it("uses fallback values without wake lock support", async () => {
		const wakeLock = useFakeWakeLock({ navigator: null });

		expect(wakeLock.isSupported.value).toBe(false);
		expect(wakeLock.isActive.value).toBe(false);
		expect(wakeLock.sentinel.value).toBeNull();
		await expect(wakeLock.request()).resolves.toBeUndefined();
		await expect(wakeLock.forceRequest()).resolves.toBeUndefined();
		await expect(wakeLock.release()).resolves.toBeUndefined();
		wakeLock.stop();
	});

	it("sets the sentinel and active state when requested", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.forceRequest();

		expect(wakeLock.isSupported.value).toBe(true);
		expect(wakeLock.sentinel.value).toBe(fakeWakeLock.sentinels[0]);
		expect(wakeLock.isActive.value).toBe(true);
		expect(fakeWakeLock.request).toHaveBeenCalledWith("screen");

		await wakeLock.request();
		expect(fakeWakeLock.sentinels[0]?.release).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBe(fakeWakeLock.sentinels[1]);
		expect(wakeLock.isActive.value).toBe(true);
	});

	it("rejects direct requests when the browser refuses the wake lock", async () => {
		const error = new DOMException("hidden", "NotAllowedError");
		const fakeWakeLock = new FakeWakeLock();
		fakeWakeLock.request.mockRejectedValueOnce(error);
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator: createNavigator(fakeWakeLock),
		});

		await expect(wakeLock.forceRequest()).rejects.toBe(error);

		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);

		fakeWakeLock.request.mockRejectedValueOnce(error);
		await expect(wakeLock.request()).rejects.toBe(error);
	});

	it("queues request while hidden and runs it when visible", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const fakeDocument = new FakeDocument("hidden");
		const wakeLock = useFakeWakeLock({
			document: fakeDocument,
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();

		expect(fakeWakeLock.request).not.toHaveBeenCalled();
		expect(wakeLock.isActive.value).toBe(false);

		fakeDocument.setVisibility("visible");
		await vi.waitFor(() => {
			expect(fakeWakeLock.request).toHaveBeenCalledOnce();
		});

		expect(wakeLock.sentinel.value).toBe(fakeWakeLock.sentinels[0]);
		expect(wakeLock.isActive.value).toBe(true);
	});

	it("cancels a hidden queued request when released", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const fakeDocument = new FakeDocument("hidden");
		const wakeLock = useFakeWakeLock({
			document: fakeDocument,
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();
		await wakeLock.release();
		fakeDocument.setVisibility("visible");

		expect(fakeWakeLock.request).not.toHaveBeenCalled();
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("queues automatic release and reacquires when visible again", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const fakeDocument = new FakeDocument("visible");
		const wakeLock = useFakeWakeLock({
			document: fakeDocument,
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();
		const firstSentinel = fakeWakeLock.sentinels[0];
		expect(firstSentinel).toBeDefined();
		if (firstSentinel === undefined) {
			return;
		}

		fakeDocument.setVisibility("hidden");
		firstSentinel.autoRelease();

		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);
		expect(fakeWakeLock.request).toHaveBeenCalledOnce();

		fakeDocument.setVisibility("visible");
		await vi.waitFor(() => {
			expect(fakeWakeLock.request).toHaveBeenCalledTimes(2);
		});

		expect(wakeLock.sentinel.value).toBe(fakeWakeLock.sentinels[1]);
		expect(wakeLock.isActive.value).toBe(true);
	});

	it("updates active state when the same document becomes hidden", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const fakeDocument = new FakeDocument("visible");
		const wakeLock = useFakeWakeLock({
			document: fakeDocument,
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();
		expect(wakeLock.isActive.value).toBe(true);

		fakeDocument.setVisibility("hidden");

		expect(wakeLock.sentinel.value).toBe(fakeWakeLock.sentinels[0]);
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("does not immediately reacquire when automatically released while visible", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();
		fakeWakeLock.sentinels[0]?.autoRelease();

		expect(fakeWakeLock.request).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("does not reacquire after manual release", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const fakeDocument = new FakeDocument("visible");
		const wakeLock = useFakeWakeLock({
			document: fakeDocument,
			navigator: createNavigator(fakeWakeLock),
		});

		await wakeLock.request();
		await wakeLock.release();
		fakeDocument.setVisibility("hidden");
		fakeDocument.setVisibility("visible");

		expect(fakeWakeLock.request).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("releases a stale pending sentinel after release", async () => {
		const request = createDeferred<FakeWakeLockSentinel>();
		const staleSentinel = new FakeWakeLockSentinel();
		const fakeWakeLock = new FakeWakeLock();
		fakeWakeLock.request.mockImplementationOnce(() => request.promise);
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator: createNavigator(fakeWakeLock),
		});

		const requested = wakeLock.forceRequest();
		await vi.waitFor(() => {
			expect(fakeWakeLock.request).toHaveBeenCalledOnce();
		});
		await wakeLock.release();
		request.resolve(staleSentinel);
		await requested;

		expect(staleSentinel.release).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("releases a stale pending sentinel after stop", async () => {
		const request = createDeferred<FakeWakeLockSentinel>();
		const staleSentinel = new FakeWakeLockSentinel();
		const fakeWakeLock = new FakeWakeLock();
		fakeWakeLock.request.mockImplementationOnce(() => request.promise);
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator: createNavigator(fakeWakeLock),
		});

		const requested = wakeLock.forceRequest();
		await vi.waitFor(() => {
			expect(fakeWakeLock.request).toHaveBeenCalledOnce();
		});
		wakeLock.stop();
		request.resolve(staleSentinel);
		await requested;

		expect(staleSentinel.release).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isActive.value).toBe(false);
	});

	it("reacquires with the new navigator after a pending request becomes stale", async () => {
		const firstRequest = createDeferred<FakeWakeLockSentinel>();
		const staleSentinel = new FakeWakeLockSentinel();
		const firstWakeLock = new FakeWakeLock();
		const secondWakeLock = new FakeWakeLock();
		firstWakeLock.request.mockImplementationOnce(() => firstRequest.promise);
		const navigator = signal<UseWakeLockNavigatorLike<FakeWakeLockSentinel>>(
			createNavigator(firstWakeLock),
		);
		const wakeLock = useFakeWakeLock({
			document: new FakeDocument("visible"),
			navigator,
		});

		const requested = wakeLock.forceRequest();
		await vi.waitFor(() => {
			expect(firstWakeLock.request).toHaveBeenCalledOnce();
		});

		navigator.value = createNavigator(secondWakeLock);
		await vi.waitFor(() => {
			expect(secondWakeLock.request).toHaveBeenCalledOnce();
		});

		firstRequest.resolve(staleSentinel);
		await requested;

		expect(staleSentinel.release).toHaveBeenCalledOnce();
		expect(wakeLock.sentinel.value).toBe(secondWakeLock.sentinels[0]);
		expect(wakeLock.isActive.value).toBe(true);
	});

	it("updates support and call target when navigator and document targets change", async () => {
		const firstWakeLock = new FakeWakeLock();
		const secondWakeLock = new FakeWakeLock();
		const navigator =
			signal<UseWakeLockNavigatorLike<FakeWakeLockSentinel> | null>(
				createNavigator(firstWakeLock),
			);
		const documentTarget = signal<UseWakeLockDocumentLike | null>(
			new FakeDocument("visible"),
		);
		const wakeLock = useFakeWakeLock({
			document: documentTarget,
			navigator,
		});

		await wakeLock.request();
		expect(firstWakeLock.request).toHaveBeenCalledOnce();
		expect(wakeLock.isSupported.value).toBe(true);

		navigator.value = null;
		await vi.waitFor(() => {
			expect(firstWakeLock.sentinels[0]?.release).toHaveBeenCalledOnce();
		});
		expect(wakeLock.isSupported.value).toBe(false);
		await Promise.resolve();
		expect(secondWakeLock.request).not.toHaveBeenCalled();

		navigator.value = createNavigator(secondWakeLock);
		await vi.waitFor(() => {
			expect(secondWakeLock.request).toHaveBeenCalledOnce();
		});
		expect(wakeLock.isSupported.value).toBe(true);
		expect(wakeLock.sentinel.value).toBe(secondWakeLock.sentinels[0]);

		documentTarget.value = new FakeDocument("hidden");
		expect(wakeLock.isActive.value).toBe(false);
		documentTarget.value = new FakeDocument("visible");
		expect(wakeLock.isActive.value).toBe(true);
	});

	it("releases the sentinel when the scope is disposed", async () => {
		const fakeWakeLock = new FakeWakeLock();
		const scope = createScope();
		const wakeLock = runWithScope(scope, () =>
			useFakeWakeLock({
				document: new FakeDocument("visible"),
				navigator: createNavigator(fakeWakeLock),
			}),
		);

		await wakeLock.request();
		disposeScope(scope);

		await vi.waitFor(() => {
			expect(fakeWakeLock.sentinels[0]?.release).toHaveBeenCalledOnce();
		});
		expect(wakeLock.sentinel.value).toBeNull();
	});
});
