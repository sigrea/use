import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMutationObserver } from "./index";

class FakeMutationObserver implements MutationObserver {
	static instances: FakeMutationObserver[] = [];

	readonly observed = new Map<Node, MutationObserverInit>();
	readonly queuedRecords: MutationRecord[] = [];

	constructor(private readonly callback: MutationCallback) {
		FakeMutationObserver.instances.push(this);
	}

	observe(target: Node, options?: MutationObserverInit): void {
		this.observed.set(target, options ?? {});
	}

	disconnect(): void {
		this.observed.clear();
	}

	takeRecords(): MutationRecord[] {
		return this.queuedRecords.splice(0);
	}

	emit(target: Node, values: Partial<MutationRecord> = {}): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback([this.createRecord(target, values)], this);
	}

	emitStale(target: Node, values: Partial<MutationRecord> = {}): void {
		this.callback([this.createRecord(target, values)], this);
	}

	queue(target: Node, values: Partial<MutationRecord> = {}): void {
		if (this.observed.has(target)) {
			this.queuedRecords.push(this.createRecord(target, values));
		}
	}

	private createRecord(
		target: Node,
		values: Partial<MutationRecord> = {},
	): MutationRecord {
		return {
			addedNodes: [] as unknown as NodeList,
			attributeName: null,
			attributeNamespace: null,
			nextSibling: null,
			oldValue: null,
			previousSibling: null,
			removedNodes: [] as unknown as NodeList,
			target,
			type: "attributes",
			...values,
		} as MutationRecord;
	}
}

class FakeWindowWithMutationObserver extends EventTarget {
	readonly document = document;
	readonly navigator = navigator;
	readonly MutationObserver = FakeMutationObserver as typeof MutationObserver;
}

class FakeWindowWithoutMutationObserver extends EventTarget {
	readonly document = document;
	readonly navigator = navigator;
}

function latestObserver(): FakeMutationObserver {
	const observer = FakeMutationObserver.instances.at(-1);
	if (observer === undefined) {
		throw new Error("MutationObserver was not created");
	}

	return observer;
}

describe("useMutationObserver", () => {
	afterEach(() => {
		FakeMutationObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
	});

	it("observes a target immediately and forwards mutation records", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useMutationObserver(element, callback, {
			attributeFilter: ["id"],
			attributes: true,
			window: new FakeWindowWithMutationObserver(),
		});
		const instance = latestObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(instance.observed.get(element)).toEqual({
			attributeFilter: ["id"],
			attributes: true,
		});

		instance.emit(element, { attributeName: "id" });

		expect(callback).toHaveBeenCalledTimes(1);
		expect(callback.mock.calls[0]?.[0][0]?.target).toBe(element);
		expect(callback.mock.calls[0]?.[1]).toBe(instance);

		observer.stop();
	});

	it("observes multiple unique targets and reactive nested targets", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const firstTarget = signal<Node | null>(first);
		const targets = signal([firstTarget, null, second, second] as const);
		const callback = vi.fn();
		const observer = useMutationObserver(targets, callback, {
			childList: true,
			window: new FakeWindowWithMutationObserver(),
		});
		let instance = latestObserver();

		expect(instance.observed.has(first)).toBe(true);
		expect(instance.observed.has(second)).toBe(true);
		expect(instance.observed.size).toBe(2);

		firstTarget.value = null;
		instance = latestObserver();

		expect(FakeMutationObserver.instances[0]?.observed.size).toBe(0);
		expect(instance.observed.has(first)).toBe(false);
		expect(instance.observed.has(second)).toBe(true);

		instance.emit(second, { type: "childList" });
		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("supports non-element nodes", () => {
		const text = document.createTextNode("before");
		const callback = vi.fn();
		const observer = useMutationObserver(text, callback, {
			characterData: true,
			window: new FakeWindowWithMutationObserver(),
		});
		const instance = latestObserver();

		expect(instance.observed.get(text)).toEqual({ characterData: true });

		instance.emit(text, { oldValue: "before", type: "characterData" });
		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("returns and clears pending records", () => {
		const element = document.createElement("div");
		const observer = useMutationObserver(element, () => {}, {
			attributes: true,
			window: new FakeWindowWithMutationObserver(),
		});
		const instance = latestObserver();

		instance.queue(element, { attributeName: "id" });
		const records = observer.takeRecords();

		expect(records).toHaveLength(1);
		expect(records?.[0]?.target).toBe(element);
		expect(observer.takeRecords()).toEqual([]);

		observer.stop();
		expect(observer.takeRecords()).toBeUndefined();
	});

	it("recreates the observer when the target changes", () => {
		const first = document.createElement("div");
		const second = document.createElement("section");
		const target = signal<Node | null>(first);
		const callback = vi.fn();
		const observer = useMutationObserver(target, callback, {
			attributes: true,
			window: new FakeWindowWithMutationObserver(),
		});
		const firstObserver = latestObserver();

		target.value = second;
		const secondObserver = latestObserver();

		expect(firstObserver.observed.size).toBe(0);
		expect(secondObserver.observed.has(second)).toBe(true);

		firstObserver.emitStale(first, { attributeName: "id" });
		secondObserver.emit(second, { attributeName: "class" });

		expect(callback).toHaveBeenCalledTimes(1);

		observer.stop();
	});

	it("tracks support when a reactive window becomes available", () => {
		const element = document.createElement("div");
		const windowTarget = signal<
			FakeWindowWithMutationObserver | FakeWindowWithoutMutationObserver | null
		>(new FakeWindowWithoutMutationObserver());
		const callback = vi.fn();
		const observer = useMutationObserver(element, callback, {
			attributes: true,
			window: windowTarget,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(FakeMutationObserver.instances).toHaveLength(0);

		windowTarget.value = new FakeWindowWithMutationObserver();

		expect(observer.isSupported.value).toBe(true);
		expect(latestObserver().observed.has(element)).toBe(true);

		windowTarget.value = null;

		expect(observer.isSupported.value).toBe(false);
		expect(latestObserver().observed.size).toBe(0);

		observer.stop();
	});

	it("does not use the global MutationObserver when window is null", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		vi.stubGlobal("MutationObserver", FakeMutationObserver);
		const observer = useMutationObserver(element, callback, {
			attributes: true,
			window: null,
		});

		expect(observer.isSupported.value).toBe(false);
		expect(FakeMutationObserver.instances).toHaveLength(0);

		observer.stop();
	});

	it("stops observing after stop is called", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const observer = useMutationObserver(element, callback, {
			attributes: true,
			window: new FakeWindowWithMutationObserver(),
		});
		const instance = latestObserver();

		observer.stop();
		observer.stop();
		instance.emitStale(element, { attributeName: "id" });

		expect(instance.observed.size).toBe(0);
		expect(callback).not.toHaveBeenCalled();
	});

	it("stops observing when the active scope is disposed", () => {
		const element = document.createElement("div");
		const callback = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			useMutationObserver(element, callback, {
				attributes: true,
				window: new FakeWindowWithMutationObserver(),
			});
		});
		const instance = latestObserver();

		disposeScope(scope);
		instance.emitStale(element, { attributeName: "id" });

		expect(instance.observed.size).toBe(0);
		expect(callback).not.toHaveBeenCalled();
	});
});
