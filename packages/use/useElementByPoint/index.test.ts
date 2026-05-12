import { disposeTrackedMolecules, readonly, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	UseElementByPointDocumentLike,
	UseElementByPointWindowLike,
	UseIntervalFnReturn,
} from "../types";
import { useElementByPoint } from "./index";

class FakePointDocument
	extends EventTarget
	implements UseElementByPointDocumentLike
{
	defaultView: UseElementByPointWindowLike | null = null;
	element: Element | null = null;
	elements: Element[] = [];
	readonly calls: Array<{
		method: "single" | "multiple";
		x: number;
		y: number;
	}> = [];

	elementFromPoint(x: number, y: number): Element | null {
		this.calls.push({ method: "single", x, y });
		return this.element;
	}

	elementsFromPoint(x: number, y: number): Element[] {
		this.calls.push({ method: "multiple", x, y });
		return this.elements;
	}
}

class FakeFrameWindow
	extends EventTarget
	implements UseElementByPointWindowLike
{
	constructor(readonly document: UseElementByPointDocumentLike) {
		super();
	}

	private frameId = 0;
	private readonly frames = new Map<number, FrameRequestCallback>();
	readonly cancelAnimationFrame = vi.fn((handle: number) => {
		this.frames.delete(handle);
	});

	requestAnimationFrame(callback: FrameRequestCallback): number {
		const handle = ++this.frameId;
		this.frames.set(handle, callback);
		return handle;
	}

	flushFrame(): void {
		for (const [handle, callback] of [...this.frames.entries()]) {
			this.frames.delete(handle);
			callback(0);
		}
	}

	get pendingFrameCount(): number {
		return this.frames.size;
	}
}

class ManualScheduler implements UseIntervalFnReturn {
	readonly active = signal(false);
	readonly isActive = readonly(this.active);

	constructor(private readonly callback: () => void) {}

	pause(): void {
		this.active.value = false;
	}

	resume(): void {
		this.active.value = true;
	}

	tick(): void {
		this.callback();
	}
}

function createManualScheduler() {
	let scheduler: ManualScheduler | undefined;
	const create = vi.fn((callback: () => void) => {
		scheduler = new ManualScheduler(callback);
		return scheduler;
	});

	return {
		create,
		get scheduler() {
			if (scheduler === undefined) {
				throw new Error("scheduler was not created");
			}

			return scheduler;
		},
	};
}

describe("useElementByPoint", () => {
	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("reads a single element from viewport coordinates", () => {
		const x = signal(10);
		const y = signal(20);
		const target = document.createElement("button");
		const pointDocument = new FakePointDocument();
		const manual = createManualScheduler();
		pointDocument.element = target;
		const point = useElementByPoint({
			document: pointDocument,
			scheduler: manual.create,
			x,
			y,
		});

		expect(point.element.value).toBeNull();
		expect(point.isSupported.value).toBe(true);

		point.resume();
		manual.scheduler.tick();

		expect(point.element.value).toBe(target);
		expect(pointDocument.calls).toEqual([{ method: "single", x: 10, y: 20 }]);

		x.value = 30;
		y.value = 40;
		pointDocument.element = null;
		manual.scheduler.tick();

		expect(point.element.value).toBeNull();
		expect(pointDocument.calls.at(-1)).toEqual({
			method: "single",
			x: 30,
			y: 40,
		});

		point.stop();
	});

	it("reads multiple elements and can switch the multiple flag", () => {
		const first = document.createElement("div");
		const second = document.createElement("span");
		const multiple = signal<boolean>(false);
		const pointDocument = new FakePointDocument();
		const manual = createManualScheduler();
		pointDocument.element = first;
		pointDocument.elements = [first, second];
		const point = useElementByPoint<boolean>({
			document: pointDocument,
			multiple,
			scheduler: manual.create,
			x: 1,
			y: 2,
		});

		point.resume();
		manual.scheduler.tick();
		expect(point.element.value).toBe(first);

		multiple.value = true;
		manual.scheduler.tick();
		expect(point.element.value).toEqual([first, second]);
		expect(pointDocument.calls.at(-1)).toEqual({
			method: "multiple",
			x: 1,
			y: 2,
		});

		point.stop();
	});

	it("reports support and returns empty values when APIs are unavailable", () => {
		const singleOnly = new EventTarget() as UseElementByPointDocumentLike;
		singleOnly.elementFromPoint = vi.fn(() => document.createElement("div"));
		const multiplePoint = useElementByPoint<true>({
			document: singleOnly,
			immediate: false,
			multiple: true,
			x: 1,
			y: 2,
		});

		expect(multiplePoint.isSupported.value).toBe(false);
		expect(multiplePoint.element.value).toEqual([]);
		multiplePoint.update();
		expect(multiplePoint.isSupported.value).toBe(false);
		expect(multiplePoint.element.value).toEqual([]);
		multiplePoint.stop();

		const nullDocument = useElementByPoint({
			document: null,
			immediate: false,
			x: 1,
			y: 2,
		});
		expect(nullDocument.isSupported.value).toBe(false);
		expect(nullDocument.element.value).toBeNull();
		nullDocument.stop();
	});

	it("uses the document from the configured window", () => {
		const target = document.createElement("div");
		const pointDocument = new FakePointDocument();
		const pointWindow = new FakeFrameWindow(pointDocument);
		const manual = createManualScheduler();
		pointDocument.element = target;
		const point = useElementByPoint({
			scheduler: manual.create,
			window: pointWindow,
			x: 5,
			y: 6,
		});

		point.resume();
		manual.scheduler.tick();

		expect(point.element.value).toBe(target);
		expect(pointDocument.calls).toEqual([{ method: "single", x: 5, y: 6 }]);

		point.stop();
	});

	it("does not update from the scheduler while paused or stopped", () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const pointDocument = new FakePointDocument();
		const manual = createManualScheduler();
		pointDocument.element = first;
		const point = useElementByPoint({
			document: pointDocument,
			scheduler: manual.create,
			x: 1,
			y: 2,
		});

		point.resume();
		manual.scheduler.tick();
		expect(point.element.value).toBe(first);

		point.pause();
		pointDocument.element = second;
		manual.scheduler.tick();
		expect(point.element.value).toBe(first);

		point.update();
		expect(point.element.value).toBe(second);

		point.stop();
		pointDocument.element = first;
		point.resume();
		manual.scheduler.tick();
		expect(point.element.value).toBe(second);
	});

	it("polls with requestAnimationFrame and cancels pending frames", () => {
		const target = document.createElement("div");
		const pointDocument = new FakePointDocument();
		const pointWindow = new FakeFrameWindow(pointDocument);
		pointDocument.defaultView = pointWindow;
		pointDocument.element = target;
		const point = useElementByPoint({
			document: pointDocument,
			immediate: false,
			x: 1,
			y: 2,
		});

		expect(point.element.value).toBeNull();
		point.resume();
		expect(pointWindow.pendingFrameCount).toBe(1);
		expect(point.element.value).toBeNull();

		pointWindow.flushFrame();
		expect(point.element.value).toBe(target);
		expect(pointWindow.pendingFrameCount).toBe(1);

		point.pause();
		expect(pointWindow.cancelAnimationFrame).toHaveBeenCalledTimes(1);
		expect(pointWindow.pendingFrameCount).toBe(0);

		point.stop();
	});

	it("starts requestAnimationFrame polling when a document target resolves later", () => {
		const target = document.createElement("div");
		const documentTarget = signal<UseElementByPointDocumentLike | undefined>(
			undefined,
		);
		const pointDocument = new FakePointDocument();
		const pointWindow = new FakeFrameWindow(pointDocument);
		pointDocument.defaultView = pointWindow;
		pointDocument.element = target;
		const point = useElementByPoint({
			document: documentTarget,
			x: 1,
			y: 2,
		});

		expect(point.isActive.value).toBe(true);
		expect(point.isSupported.value).toBe(false);
		expect(point.element.value).toBeNull();
		expect(pointWindow.pendingFrameCount).toBe(0);

		documentTarget.value = pointDocument;

		expect(point.isActive.value).toBe(true);
		expect(pointWindow.pendingFrameCount).toBe(1);

		pointWindow.flushFrame();

		expect(point.isSupported.value).toBe(true);
		expect(point.element.value).toBe(target);
		expect(pointWindow.pendingFrameCount).toBe(1);

		point.stop();
	});

	it("starts requestAnimationFrame polling when a window target resolves later", () => {
		const target = document.createElement("div");
		const pointDocument = new FakePointDocument();
		const windowTarget = signal<UseElementByPointWindowLike | undefined>(
			undefined,
		);
		const pointWindow = new FakeFrameWindow(pointDocument);
		pointDocument.element = target;
		const point = useElementByPoint({
			window: windowTarget,
			x: 1,
			y: 2,
		});

		expect(point.isActive.value).toBe(true);
		expect(point.isSupported.value).toBe(false);
		expect(pointWindow.pendingFrameCount).toBe(0);

		windowTarget.value = pointWindow;

		expect(point.isActive.value).toBe(true);
		expect(pointWindow.pendingFrameCount).toBe(1);

		pointWindow.flushFrame();

		expect(point.isSupported.value).toBe(true);
		expect(point.element.value).toBe(target);
		expect(pointWindow.pendingFrameCount).toBe(1);

		point.stop();
	});

	it("stops requestAnimationFrame polling without a global scheduler", () => {
		const originalRequestAnimationFrame = Object.getOwnPropertyDescriptor(
			globalThis,
			"requestAnimationFrame",
		);
		const originalCancelAnimationFrame = Object.getOwnPropertyDescriptor(
			globalThis,
			"cancelAnimationFrame",
		);
		Object.defineProperty(globalThis, "requestAnimationFrame", {
			configurable: true,
			value: undefined,
			writable: true,
		});
		Object.defineProperty(globalThis, "cancelAnimationFrame", {
			configurable: true,
			value: undefined,
			writable: true,
		});

		try {
			const point = useElementByPoint({
				x: 1,
				y: 2,
			});

			expect(point.isActive.value).toBe(false);
			point.stop();
		} finally {
			if (originalRequestAnimationFrame === undefined) {
				Reflect.deleteProperty(globalThis, "requestAnimationFrame");
			} else {
				Object.defineProperty(
					globalThis,
					"requestAnimationFrame",
					originalRequestAnimationFrame,
				);
			}

			if (originalCancelAnimationFrame === undefined) {
				Reflect.deleteProperty(globalThis, "cancelAnimationFrame");
			} else {
				Object.defineProperty(
					globalThis,
					"cancelAnimationFrame",
					originalCancelAnimationFrame,
				);
			}
		}
	});

	it("can poll with an interval", () => {
		vi.useFakeTimers();
		const target = document.createElement("div");
		const pointDocument = new FakePointDocument();
		pointDocument.element = target;
		const point = useElementByPoint({
			document: pointDocument,
			immediate: false,
			interval: 20,
			x: 1,
			y: 2,
		});

		point.resume();
		expect(point.element.value).toBeNull();

		vi.advanceTimersByTime(20);
		expect(point.element.value).toBe(target);

		point.pause();
		pointDocument.element = null;
		vi.advanceTimersByTime(20);
		expect(point.element.value).toBe(target);

		point.stop();
	});

	it("prefers a custom scheduler over interval options", () => {
		vi.useFakeTimers();
		const target = document.createElement("div");
		const pointDocument = new FakePointDocument();
		const manual = createManualScheduler();
		pointDocument.element = target;
		const point = useElementByPoint({
			document: pointDocument,
			immediate: true,
			interval: 20,
			scheduler: manual.create,
			x: 1,
			y: 2,
		});

		vi.advanceTimersByTime(20);
		expect(point.element.value).toBeNull();

		point.resume();
		manual.scheduler.tick();
		expect(point.element.value).toBe(target);

		point.stop();
	});
});
