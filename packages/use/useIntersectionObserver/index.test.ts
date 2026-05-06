import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseIntersectionObserverWindowLike } from "../types";
import { useIntersectionObserver } from "./index";

class FakeIntersectionObserver implements IntersectionObserver {
	static instances: FakeIntersectionObserver[] = [];

	readonly root: Element | Document | null;
	readonly rootMargin: string;
	readonly thresholds: readonly number[];
	readonly observed = new Set<Element>();
	readonly queuedEntries: IntersectionObserverEntry[] = [];

	constructor(
		private readonly callback: IntersectionObserverCallback,
		readonly options: IntersectionObserverInit = {},
	) {
		this.root = options.root ?? null;
		this.rootMargin = options.rootMargin ?? "0px";
		const threshold = options.threshold ?? 0;
		this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
		FakeIntersectionObserver.instances.push(this);
	}

	disconnect(): void {
		this.observed.clear();
	}

	observe(target: Element): void {
		this.observed.add(target);
	}

	takeRecords(): IntersectionObserverEntry[] {
		return this.queuedEntries.splice(0);
	}

	unobserve(target: Element): void {
		this.observed.delete(target);
	}

	createEntry(
		value: Partial<IntersectionObserverEntry> = {},
	): IntersectionObserverEntry {
		return {
			boundingClientRect: {} as DOMRectReadOnly,
			intersectionRatio: 0,
			intersectionRect: {} as DOMRectReadOnly,
			isIntersecting: false,
			rootBounds: null,
			target: [...this.observed][0],
			time: 0,
			...value,
		} as IntersectionObserverEntry;
	}

	emit(
		entry:
			| Partial<IntersectionObserverEntry>
			| readonly Partial<IntersectionObserverEntry>[],
	): void {
		const entries = Array.isArray(entry) ? entry : [entry];
		const observedEntries = entries
			.map((value) => this.createEntry(value))
			.filter((value): value is IntersectionObserverEntry => {
				return value.target !== undefined && this.observed.has(value.target);
			});

		if (observedEntries.length > 0) {
			this.callback(observedEntries, this);
		}
	}

	emitStale(entry: Partial<IntersectionObserverEntry>): void {
		this.callback([this.createEntry(entry)], this);
	}
}

class FakeWindowWithIntersectionObserver
	extends EventTarget
	implements UseIntersectionObserverWindowLike
{
	readonly document = document;
	readonly navigator = navigator;
	readonly IntersectionObserver =
		FakeIntersectionObserver as typeof IntersectionObserver;
}

class FakeWindowWithoutIntersectionObserver extends EventTarget {
	readonly document = document;
	readonly navigator = navigator;
}

function latestObserver(): FakeIntersectionObserver {
	const observer = FakeIntersectionObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("IntersectionObserver was not created");
	}

	return observer;
}

describe("useIntersectionObserver", () => {
	afterEach(() => {
		FakeIntersectionObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("observes a target immediately and forwards entries", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useIntersectionObserver(element, callback, {
			window: new FakeWindowWithIntersectionObserver(),
		});
		const instance = latestObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(observer.isActive.value).toBe(true);
		expect(instance.observed.has(element)).toBe(true);

		instance.emit({ isIntersecting: true, target: element, time: 1 });

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0]?.[0][0]?.isIntersecting).toBe(true);
		expect(callback.mock.calls[0]?.[1]).toBe(instance);

		observer.stop();
	});

	it("observes multiple targets and passes observer options", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const root = document.createElement("main");
		const rootMargin = signal("0px 0px 20px 0px");
		const threshold = signal<IntersectionObserverInit["threshold"]>([
			0, 0.5, 1,
		]);
		const callback = vi.fn();
		const observer = useIntersectionObserver([first, null, second], callback, {
			root,
			rootMargin,
			threshold,
			window: new FakeWindowWithIntersectionObserver(),
		});
		let instance = latestObserver();

		expect(instance.options).toEqual({
			root,
			rootMargin: "0px 0px 20px 0px",
			threshold: [0, 0.5, 1],
		});
		expect(instance.observed.has(first)).toBe(true);
		expect(instance.observed.has(second)).toBe(true);

		rootMargin.value = "10px";
		threshold.value = 1;
		instance = latestObserver();

		expect(FakeIntersectionObserver.instances[0]?.observed.size).toBe(0);
		expect(instance.options).toEqual({
			root,
			rootMargin: "10px",
			threshold: 1,
		});

		observer.stop();
	});

	it("pauses and resumes observation", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useIntersectionObserver(element, callback, {
			window: new FakeWindowWithIntersectionObserver(),
		});
		const firstObserver = latestObserver();

		observer.pause();

		expect(observer.isActive.value).toBe(false);
		expect(firstObserver.observed.size).toBe(0);

		firstObserver.emitStale({ isIntersecting: true, target: element });
		expect(callback).not.toHaveBeenCalled();

		observer.resume();
		const secondObserver = latestObserver();

		expect(observer.isActive.value).toBe(true);
		expect(secondObserver).not.toBe(firstObserver);
		expect(secondObserver.observed.has(element)).toBe(true);

		secondObserver.emit({ isIntersecting: true, target: element });
		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("respects immediate false until resume is called", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useIntersectionObserver(element, callback, {
			immediate: false,
			window: new FakeWindowWithIntersectionObserver(),
		});

		expect(observer.isSupported.value).toBe(true);
		expect(observer.isActive.value).toBe(false);
		expect(FakeIntersectionObserver.instances).toHaveLength(0);

		observer.resume();

		expect(FakeIntersectionObserver.instances).toHaveLength(1);
		expect(latestObserver().observed.has(element)).toBe(true);

		observer.stop();
	});

	it("recreates the observer when the target changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const target = signal<Element | null>(first);
		const callback = vi.fn();
		const observer = useIntersectionObserver(target, callback, {
			window: new FakeWindowWithIntersectionObserver(),
		});
		const firstObserver = latestObserver();

		target.value = second;
		const secondObserver = latestObserver();

		expect(firstObserver.observed.size).toBe(0);
		expect(secondObserver.observed.has(second)).toBe(true);

		firstObserver.emitStale({ isIntersecting: true, target: first });
		secondObserver.emit({ isIntersecting: true, target: second });

		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("does not use the global IntersectionObserver when window is null", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
		const observer = useIntersectionObserver(element, callback, {
			window: null,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(observer.isActive.value).toBe(true);
		expect(FakeIntersectionObserver.instances).toHaveLength(0);

		observer.stop();
	});

	it("tracks support when a reactive window becomes available", () => {
		const element = document.createElement("div");
		const windowTarget = signal<
			UseIntersectionObserverWindowLike | null | undefined
		>(new FakeWindowWithoutIntersectionObserver());
		const callback = vi.fn();
		const observer = useIntersectionObserver(element, callback, {
			window: windowTarget,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(FakeIntersectionObserver.instances).toHaveLength(0);

		windowTarget.value = new FakeWindowWithIntersectionObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(latestObserver().observed.has(element)).toBe(true);

		observer.stop();
	});

	it("stops permanently", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useIntersectionObserver(element, callback, {
			window: new FakeWindowWithIntersectionObserver(),
		});
		const firstObserver = latestObserver();

		observer.stop();
		observer.resume();

		expect(observer.isActive.value).toBe(false);
		expect(firstObserver.observed.size).toBe(0);
		expect(FakeIntersectionObserver.instances).toHaveLength(1);

		firstObserver.emitStale({ isIntersecting: true, target: element });
		expect(callback).not.toHaveBeenCalled();
	});
});
