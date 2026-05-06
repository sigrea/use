import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ResizeObserverWindowLike } from "../types";
import { useResizeObserver } from "./index";

class FakeResizeObserver implements ResizeObserver {
	static instances: FakeResizeObserver[] = [];

	readonly observed = new Map<Element, ResizeObserverOptions>();

	constructor(private readonly callback: ResizeObserverCallback) {
		FakeResizeObserver.instances.push(this);
	}

	observe(target: Element, options?: ResizeObserverOptions): void {
		this.observed.set(target, options ?? {});
	}

	unobserve(target: Element): void {
		this.observed.delete(target);
	}

	disconnect(): void {
		this.observed.clear();
	}

	emit(target: Element, values: Partial<ResizeObserverEntry> = {}): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback([this.createEntry(target, values)], this);
	}

	emitStale(target: Element, values: Partial<ResizeObserverEntry> = {}): void {
		this.callback([this.createEntry(target, values)], this);
	}

	private createEntry(
		target: Element,
		values: Partial<ResizeObserverEntry> = {},
	): ResizeObserverEntry {
		return {
			borderBoxSize: [],
			contentBoxSize: [],
			contentRect: {} as DOMRectReadOnly,
			devicePixelContentBoxSize: [],
			target,
			...values,
		} as ResizeObserverEntry;
	}
}

class FakeWindowWithResizeObserver
	extends EventTarget
	implements ResizeObserverWindowLike
{
	readonly document = document;
	readonly navigator = navigator;
	readonly ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
}

class FakeWindowWithoutResizeObserver extends EventTarget {
	readonly document = document;
	readonly navigator = navigator;
}

function latestObserver(): FakeResizeObserver {
	const observer = FakeResizeObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("ResizeObserver was not created");
	}

	return observer;
}

describe("useResizeObserver", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("observes a target immediately and forwards entries", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useResizeObserver(element, callback, {
			box: "border-box",
			window: new FakeWindowWithResizeObserver(),
		});
		const instance = latestObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(instance.observed.get(element)).toEqual({ box: "border-box" });

		instance.emit(element);

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0]?.[0][0]?.target).toBe(element);
		expect(callback.mock.calls[0]?.[1]).toBe(instance);

		observer.stop();
	});

	it("observes multiple unique targets and reactive nested targets", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const firstTarget = signal<Element | null>(first);
		const targets = signal([firstTarget, null, second, second] as const);
		const callback = vi.fn();
		const observer = useResizeObserver(targets, callback, {
			window: new FakeWindowWithResizeObserver(),
		});
		let instance = latestObserver();

		expect(instance.observed.has(first)).toBe(true);
		expect(instance.observed.has(second)).toBe(true);
		expect(instance.observed.size).toBe(2);

		firstTarget.value = null;
		instance = latestObserver();

		expect(FakeResizeObserver.instances[0]?.observed.size).toBe(0);
		expect(instance.observed.has(first)).toBe(false);
		expect(instance.observed.has(second)).toBe(true);

		instance.emit(second);
		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("recreates the observer when the target changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const target = signal<Element | null>(first);
		const callback = vi.fn();
		const observer = useResizeObserver(target, callback, {
			window: new FakeWindowWithResizeObserver(),
		});
		const firstObserver = latestObserver();

		target.value = second;
		const secondObserver = latestObserver();

		expect(firstObserver.observed.size).toBe(0);
		expect(secondObserver.observed.has(second)).toBe(true);

		firstObserver.emitStale(first);
		secondObserver.emit(second);

		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("recreates the observer when box changes", () => {
		const element = document.createElement("div");
		const box = signal<ResizeObserverBoxOptions>("content-box");
		const observer = useResizeObserver(element, () => {}, {
			box,
			window: new FakeWindowWithResizeObserver(),
		});
		const firstObserver = latestObserver();

		expect(firstObserver.observed.get(element)).toEqual({
			box: "content-box",
		});

		box.value = "device-pixel-content-box";
		const secondObserver = latestObserver();

		expect(firstObserver.observed.size).toBe(0);
		expect(secondObserver.observed.get(element)).toEqual({
			box: "device-pixel-content-box",
		});

		observer.stop();
	});

	it("tracks support when a reactive window becomes available", () => {
		const element = document.createElement("div");
		const windowTarget = signal<
			ResizeObserverWindowLike | FakeWindowWithoutResizeObserver | null
		>(new FakeWindowWithoutResizeObserver());
		const callback = vi.fn();
		const observer = useResizeObserver(element, callback, {
			window: windowTarget,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(FakeResizeObserver.instances).toHaveLength(0);

		windowTarget.value = new FakeWindowWithResizeObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(latestObserver().observed.has(element)).toBe(true);

		windowTarget.value = null;

		expect(observer.isSupported.value).toBe(false);
		expect(latestObserver().observed.size).toBe(0);

		observer.stop();
	});

	it("does not use the global ResizeObserver when window is null", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		vi.stubGlobal("ResizeObserver", FakeResizeObserver);
		const observer = useResizeObserver(element, callback, {
			window: null,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(FakeResizeObserver.instances).toHaveLength(0);

		observer.stop();
	});

	it("does not call back without a target", () => {
		const callback = vi.fn();
		const observer = useResizeObserver(null, callback, {
			window: new FakeWindowWithResizeObserver(),
		});

		expect(observer.isSupported.value).toBe(true);
		expect(FakeResizeObserver.instances).toHaveLength(0);
		expect(callback).not.toHaveBeenCalled();

		observer.stop();
	});

	it("stops observing after stop is called", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useResizeObserver(element, callback, {
			window: new FakeWindowWithResizeObserver(),
		});
		const instance = latestObserver();

		observer.stop();
		observer.stop();
		instance.emitStale(element);

		expect(instance.observed.size).toBe(0);
		expect(callback).not.toHaveBeenCalled();
	});

	it("stops observing when the active scope is disposed", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			useResizeObserver(element, callback, {
				window: new FakeWindowWithResizeObserver(),
			});
		});
		const instance = latestObserver();

		disposeScope(scope);
		instance.emitStale(element);

		expect(instance.observed.size).toBe(0);
		expect(callback).not.toHaveBeenCalled();
	});
});
