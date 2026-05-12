import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UsePerformanceObserverWindowLike } from "../types";
import { usePerformanceObserver } from "./index";

class FakePerformanceObserverEntryList implements PerformanceObserverEntryList {
	constructor(private readonly entries: PerformanceEntry[]) {}

	getEntries(): PerformanceEntryList {
		return this.entries;
	}

	getEntriesByName(name: string, type?: string): PerformanceEntryList {
		return this.entries.filter((entry) => {
			return (
				entry.name === name && (type === undefined || entry.entryType === type)
			);
		});
	}

	getEntriesByType(type: string): PerformanceEntryList {
		return this.entries.filter((entry) => entry.entryType === type);
	}
}

class FakePerformanceObserver implements PerformanceObserver {
	static instances: FakePerformanceObserver[] = [];
	static supportedEntryTypes: ReadonlyArray<string> = [
		"mark",
		"measure",
		"paint",
	];

	observedOptions: PerformanceObserverInit | undefined;
	queuedEntries: PerformanceEntry[] = [];

	constructor(private readonly callback: PerformanceObserverCallback) {
		FakePerformanceObserver.instances.push(this);
	}

	disconnect(): void {
		this.observedOptions = undefined;
	}

	observe(options?: PerformanceObserverInit): void {
		this.observedOptions = options;
	}

	takeRecords(): PerformanceEntryList {
		const entries = this.queuedEntries.splice(0);
		return entries;
	}

	emit(entries: PerformanceEntry[]): void {
		if (this.observedOptions === undefined) {
			return;
		}

		this.callback(new FakePerformanceObserverEntryList(entries), this);
	}

	emitStale(entries: PerformanceEntry[]): void {
		this.callback(new FakePerformanceObserverEntryList(entries), this);
	}
}

class FakeWindowWithPerformanceObserver
	extends EventTarget
	implements UsePerformanceObserverWindowLike
{
	readonly document = document;
	readonly navigator = navigator;
	readonly PerformanceObserver =
		FakePerformanceObserver as typeof PerformanceObserver;
}

class FakeWindowWithoutPerformanceObserver extends EventTarget {
	readonly document = document;
	readonly navigator = navigator;
}

function latestObserver(): FakePerformanceObserver {
	const observer = FakePerformanceObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("PerformanceObserver was not created");
	}

	return observer;
}

function entry(name: string, entryType: string): PerformanceEntry {
	return {
		duration: 0,
		entryType,
		name,
		startTime: 0,
		toJSON: () => ({}),
	} as PerformanceEntry;
}

describe("usePerformanceObserver", () => {
	afterEach(() => {
		FakePerformanceObserver.instances = [];
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("observes performance entries immediately", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["mark", "measure"],
				window: new FakeWindowWithPerformanceObserver(),
			},
			callback,
		);
		const instance = latestObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(instance.observedOptions).toEqual({
			entryTypes: ["mark", "measure"],
		});

		instance.emit([entry("ready", "mark")]);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0]?.[0].getEntries()[0]?.name).toBe("ready");
		expect(callback.mock.calls[0]?.[1]).toBe(instance);

		observer.stop();
	});

	it("passes single type options through to observe", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				buffered: true,
				type: "resource",
				window: new FakeWindowWithPerformanceObserver(),
			},
			callback,
		);

		expect(latestObserver().observedOptions).toEqual({
			buffered: true,
			type: "resource",
		});

		observer.stop();
	});

	it("waits for start when immediate is false", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["paint"],
				immediate: false,
				window: new FakeWindowWithPerformanceObserver(),
			},
			callback,
		);

		expect(observer.isSupported.value).toBe(true);
		expect(FakePerformanceObserver.instances).toHaveLength(0);

		observer.start();

		expect(FakePerformanceObserver.instances).toHaveLength(1);
		expect(latestObserver().observedOptions).toEqual({
			entryTypes: ["paint"],
		});

		observer.stop();
	});

	it("restarts the observer when start is called while active", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["mark"],
				window: new FakeWindowWithPerformanceObserver(),
			},
			callback,
		);
		const firstObserver = latestObserver();

		observer.start();
		const secondObserver = latestObserver();

		expect(secondObserver).not.toBe(firstObserver);
		expect(firstObserver.observedOptions).toBeUndefined();
		expect(secondObserver.observedOptions).toEqual({ entryTypes: ["mark"] });

		observer.stop();
	});

	it("ignores stale callbacks after stop", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["mark"],
				window: new FakeWindowWithPerformanceObserver(),
			},
			callback,
		);
		const instance = latestObserver();

		observer.stop();
		instance.emitStale([entry("stale", "mark")]);

		expect(callback).not.toHaveBeenCalled();
	});

	it("retargets when a reactive window changes", () => {
		const firstWindow = new FakeWindowWithPerformanceObserver();
		const secondWindow = new FakeWindowWithPerformanceObserver();
		const windowTarget = signal<
			FakeWindowWithPerformanceObserver | FakeWindowWithoutPerformanceObserver
		>(firstWindow);
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["mark"],
				window: windowTarget,
			},
			callback,
		);
		const firstObserver = latestObserver();

		windowTarget.value = new FakeWindowWithoutPerformanceObserver();
		expect(observer.isSupported.value).toBe(false);
		expect(firstObserver.observedOptions).toBeUndefined();

		windowTarget.value = secondWindow;
		const secondObserver = latestObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(secondObserver).not.toBe(firstObserver);
		expect(secondObserver.observedOptions).toEqual({ entryTypes: ["mark"] });

		observer.stop();
	});

	it("is safe without a PerformanceObserver constructor", () => {
		const callback = vi.fn();
		const observer = usePerformanceObserver(
			{
				entryTypes: ["mark"],
				window: null,
			},
			callback,
		);

		expect(observer.isSupported.value).toBe(false);
		expect(FakePerformanceObserver.instances).toHaveLength(0);

		observer.start();
		expect(FakePerformanceObserver.instances).toHaveLength(0);

		observer.stop();
	});
});
