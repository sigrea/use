import { disposeTrackedMolecules, signal } from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useElementVisibility } from "./index";

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

	emitQueued(): void {
		if (this.queuedEntries.length === 0) {
			return;
		}

		this.callback(this.takeRecords(), this);
	}

	emitStale(entry: Partial<IntersectionObserverEntry>): void {
		this.callback([this.createEntry(entry)], this);
	}

	queue(entry: Partial<IntersectionObserverEntry>): void {
		this.queuedEntries.push(this.createEntry(entry));
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
}

class FakeWindowWithIntersectionObserver extends EventTarget {
	document = document;
	navigator = navigator;
	IntersectionObserver =
		FakeIntersectionObserver as typeof IntersectionObserver;
}

class FakeWindowWithoutIntersectionObserver extends EventTarget {
	document = document;
	navigator = navigator;
}

function latestObserver(): FakeIntersectionObserver {
	const observer = FakeIntersectionObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("IntersectionObserver was not created");
	}

	return observer;
}

describe("useElementVisibility", () => {
	afterEach(() => {
		FakeIntersectionObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("starts with the initial value and tracks intersection changes", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			initialValue: true,
			window: fakeWindow,
		});
		const observer = FakeIntersectionObserver.instances[0];

		expect(visibility.isVisible.value).toBe(true);
		expect(visibility.isSupported.value).toBe(true);
		expect(observer?.observed.has(element)).toBe(true);

		observer?.emit({ isIntersecting: false, target: element, time: 1 });
		expect(visibility.isVisible.value).toBe(false);

		observer?.emit({ isIntersecting: true, target: element, time: 2 });
		expect(visibility.isVisible.value).toBe(true);

		visibility.stop();
	});

	it("uses the latest entry by time", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			window: fakeWindow,
		});
		const observer = FakeIntersectionObserver.instances[0];

		observer?.emit([
			{ isIntersecting: true, target: element, time: 5 },
			{ isIntersecting: false, target: element, time: 8 },
			{ isIntersecting: true, target: element, time: 3 },
		]);

		expect(visibility.isVisible.value).toBe(false);

		visibility.stop();
	});

	it("passes observer options and observes the target", () => {
		const element = document.createElement("div");
		const root = document.createElement("main");
		const rootMargin = signal("0px 0px 100px 0px");
		const threshold = signal<IntersectionObserverInit["threshold"]>([
			0, 0.5, 1,
		]);
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			root,
			rootMargin,
			threshold,
			window: fakeWindow,
		});
		let observer = FakeIntersectionObserver.instances[0];

		expect(observer?.options).toEqual({
			root,
			rootMargin: "0px 0px 100px 0px",
			threshold: [0, 0.5, 1],
		});
		expect(observer?.observed.has(element)).toBe(true);

		rootMargin.value = "10px";
		threshold.value = 1;
		observer = latestObserver();

		expect(FakeIntersectionObserver.instances[0]?.observed.size).toBe(0);
		expect(observer?.options).toEqual({
			root,
			rootMargin: "10px",
			threshold: 1,
		});
		expect(observer?.observed.has(element)).toBe(true);

		visibility.stop();
	});

	it("keeps the initial value when IntersectionObserver is unavailable", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithoutIntersectionObserver();
		const visibility = useElementVisibility(element, {
			initialValue: true,
			window: fakeWindow,
		});

		expect(visibility.isSupported.value).toBe(false);
		expect(visibility.isVisible.value).toBe(true);
		expect(FakeIntersectionObserver.instances).toHaveLength(0);

		visibility.stop();
	});

	it("does not use the global IntersectionObserver when window is null", () => {
		const originalIntersectionObserver = globalThis.IntersectionObserver;
		Object.defineProperty(globalThis, "IntersectionObserver", {
			configurable: true,
			value: FakeIntersectionObserver,
		});

		try {
			const element = document.createElement("div");
			const visibility = useElementVisibility(element, {
				initialValue: true,
				window: null,
			});

			expect(visibility.isSupported.value).toBe(false);
			expect(visibility.isVisible.value).toBe(true);
			expect(FakeIntersectionObserver.instances).toHaveLength(0);

			visibility.stop();
		} finally {
			Object.defineProperty(globalThis, "IntersectionObserver", {
				configurable: true,
				value: originalIntersectionObserver,
			});
		}
	});

	it("retargets observer when the element changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const target = signal<Element | null>(first);
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(target, {
			initialValue: true,
			window: fakeWindow,
		});
		const firstObserver = FakeIntersectionObserver.instances[0];

		firstObserver?.emit({ isIntersecting: false, target: first, time: 1 });
		expect(visibility.isVisible.value).toBe(false);
		target.value = second;
		const secondObserver = FakeIntersectionObserver.instances[1];
		expect(firstObserver?.observed.size).toBe(0);
		expect(visibility.isVisible.value).toBe(true);

		firstObserver?.emitStale({ isIntersecting: false, target: first, time: 3 });
		expect(visibility.isVisible.value).toBe(true);

		secondObserver?.emit({ isIntersecting: false, target: second, time: 4 });
		expect(visibility.isVisible.value).toBe(false);

		target.value = null;
		expect(secondObserver?.observed.size).toBe(0);
		expect(visibility.isVisible.value).toBe(true);

		secondObserver?.emit({ isIntersecting: false, target: second, time: 5 });
		expect(visibility.isVisible.value).toBe(true);

		visibility.stop();
	});

	it("stops after the first visibility change when once is true", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			once: true,
			window: fakeWindow,
		});
		const observer = FakeIntersectionObserver.instances[0];

		observer?.emit({ isIntersecting: false, target: element, time: 1 });
		expect(visibility.isVisible.value).toBe(false);
		expect(observer?.observed.has(element)).toBe(true);

		observer?.emit({ isIntersecting: true, target: element, time: 2 });
		expect(visibility.isVisible.value).toBe(true);
		expect(observer?.observed.size).toBe(0);

		observer?.emit({ isIntersecting: false, target: element, time: 3 });
		expect(visibility.isVisible.value).toBe(true);
	});

	it("disconnects and ignores later updates after stop", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			window: fakeWindow,
		});
		const observer = FakeIntersectionObserver.instances[0];

		observer?.emit({ isIntersecting: true, target: element, time: 1 });
		expect(visibility.isVisible.value).toBe(true);

		visibility.stop();
		visibility.stop();
		expect(observer?.observed.size).toBe(0);

		observer?.emit({ isIntersecting: false, target: element, time: 2 });
		expect(visibility.isVisible.value).toBe(true);
	});

	it("ignores queued observer entries after stop", () => {
		const element = document.createElement("div");
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			once: true,
			window: fakeWindow,
		});
		const observer = FakeIntersectionObserver.instances[0];

		observer?.emit({ isIntersecting: true, target: element, time: 1 });
		expect(visibility.isVisible.value).toBe(true);
		expect(observer?.observed.size).toBe(0);

		observer?.queue({ isIntersecting: false, target: element, time: 2 });
		observer?.emitQueued();
		expect(visibility.isVisible.value).toBe(true);
	});

	it("ignores stale observer callbacks after target options change", () => {
		const element = document.createElement("div");
		const firstRoot = document.createElement("main");
		const secondRoot = document.createElement("aside");
		const root = signal<Element | null>(firstRoot);
		const fakeWindow = new FakeWindowWithIntersectionObserver();
		const visibility = useElementVisibility(element, {
			once: true,
			root,
			window: fakeWindow,
		});
		const firstObserver = FakeIntersectionObserver.instances[0];

		root.value = secondRoot;
		const secondObserver = FakeIntersectionObserver.instances[1];

		firstObserver?.emitStale({
			isIntersecting: true,
			target: element,
			time: 1,
		});
		expect(visibility.isVisible.value).toBe(false);
		expect(secondObserver?.observed.has(element)).toBe(true);

		secondObserver?.emit({ isIntersecting: true, target: element, time: 2 });
		expect(visibility.isVisible.value).toBe(true);
		expect(secondObserver?.observed.size).toBe(0);
	});
});
