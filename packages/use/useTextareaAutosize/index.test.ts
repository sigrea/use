import { disposeTrackedMolecules, nextTick, signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseTextareaAutosizeWindowLike } from "../types";
import { useTextareaAutosize } from "./index";

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

	emit(target: Element, width: number): void {
		if (!this.observed.has(target)) {
			return;
		}

		this.callback(
			[
				{
					borderBoxSize: [],
					contentBoxSize: [],
					contentRect: { width } as DOMRectReadOnly,
					devicePixelContentBoxSize: [],
					target,
				} as ResizeObserverEntry,
			],
			this,
		);
	}
}

class FakeWindow extends EventTarget implements UseTextareaAutosizeWindowLike {
	readonly document = document;
	readonly navigator = navigator;
	readonly ResizeObserver = FakeResizeObserver as typeof ResizeObserver;
	readonly animationCallbacks = new Map<number, FrameRequestCallback>();
	private nextHandle = 1;

	requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
		const handle = this.nextHandle;
		this.nextHandle += 1;
		this.animationCallbacks.set(handle, callback);
		return handle;
	});

	cancelAnimationFrame = vi.fn((handle: number) => {
		this.animationCallbacks.delete(handle);
	});

	flushAnimationFrames(): void {
		const callbacks = Array.from(this.animationCallbacks.entries());
		this.animationCallbacks.clear();
		for (const [handle, callback] of callbacks) {
			callback(handle);
		}
	}
}

function setScrollHeight(textarea: HTMLTextAreaElement, value: number): void {
	Object.defineProperty(textarea, "scrollHeight", {
		configurable: true,
		value,
	});
}

function setScrollHeightGetter(
	textarea: HTMLTextAreaElement,
	get: () => number,
): void {
	Object.defineProperty(textarea, "scrollHeight", {
		configurable: true,
		get,
	});
}

describe("useTextareaAutosize", () => {
	afterEach(() => {
		FakeResizeObserver.instances = [];
		document.body.innerHTML = "";
		disposeTrackedMolecules();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("sets textarea height to scrollHeight", () => {
		const textarea = document.createElement("textarea");
		setScrollHeight(textarea, 180);
		const result = useTextareaAutosize({ element: textarea });

		result.triggerResize();

		expect(result.textarea.value).toBe(textarea);
		expect(textarea.style.height).toBe("180px");
		result.stop();
	});

	it("caps height with maxHeight", () => {
		const textarea = document.createElement("textarea");
		setScrollHeight(textarea, 240);
		const result = useTextareaAutosize({
			element: textarea,
			maxHeight: 120,
		});

		result.triggerResize();

		expect(textarea.style.height).toBe("120px");
		result.stop();
	});

	it("uses minHeight when styleProp is minHeight", () => {
		const textarea = document.createElement("textarea");
		setScrollHeight(textarea, 240);
		const result = useTextareaAutosize({
			element: textarea,
			maxHeight: 120,
			styleProp: "minHeight",
		});

		result.triggerResize();

		expect(textarea.style.minHeight).toBe("120px");
		expect(textarea.style.height).toBe("");
		result.stop();
	});

	it("applies height to styleTarget when provided", () => {
		const textarea = document.createElement("textarea");
		const styleTarget = document.createElement("div");
		setScrollHeight(textarea, 240);
		const result = useTextareaAutosize({
			element: textarea,
			styleTarget,
		});

		result.triggerResize();

		expect(styleTarget.style.height).toBe("240px");
		expect(textarea.style.height).toBe("");
		result.stop();
	});

	it("keeps height when styleTarget is the textarea", () => {
		const textarea = document.createElement("textarea");
		setScrollHeight(textarea, 160);
		const result = useTextareaAutosize({
			element: textarea,
			styleTarget: textarea,
		});

		result.triggerResize();

		expect(textarea.style.height).toBe("160px");
		result.stop();
	});

	it("updates input from native input events and resizes on input changes", async () => {
		const textarea = document.createElement("textarea");
		setScrollHeight(textarea, 80);
		const result = useTextareaAutosize({ element: textarea });

		textarea.value = "Hello";
		textarea.dispatchEvent(new Event("input"));
		await nextTick();

		expect(result.input.value).toBe("Hello");
		expect(textarea.style.height).toBe("80px");

		setScrollHeight(textarea, 140);
		result.input.value = "Hello World";
		await nextTick();

		expect(textarea.value).toBe("Hello World");
		expect(textarea.style.height).toBe("140px");
		result.stop();
	});

	it("syncs input into the textarea before measuring", async () => {
		const textarea = document.createElement("textarea");
		setScrollHeightGetter(textarea, () =>
			textarea.value.length > "Hello".length ? 140 : 80,
		);
		const result = useTextareaAutosize();

		result.textarea.value = textarea;
		result.input.value = "Hello World";
		await nextTick();

		expect(textarea.value).toBe("Hello World");
		expect(textarea.style.height).toBe("140px");
		result.stop();
	});

	it("retargets textarea listeners", async () => {
		const first = document.createElement("textarea");
		const second = document.createElement("textarea");
		setScrollHeight(first, 40);
		setScrollHeight(second, 90);
		const target = signal<HTMLTextAreaElement | null>(first);
		const result = useTextareaAutosize({ element: target });

		target.value = second;

		first.value = "old";
		first.dispatchEvent(new Event("input"));
		await nextTick();
		expect(result.input.value).not.toBe("old");

		second.value = "new";
		second.dispatchEvent(new Event("input"));
		await nextTick();

		expect(result.input.value).toBe("new");
		expect(second.style.height).toBe("90px");

		setScrollHeight(first, 120);
		first.value = "stale";
		target.value = first;
		await nextTick();

		expect(first.value).toBe("new");
		expect(first.style.height).toBe("120px");
		result.stop();
	});

	it("resizes from ResizeObserver only when width changes", () => {
		const textarea = document.createElement("textarea");
		const fakeWindow = new FakeWindow();
		setScrollHeight(textarea, 100);
		const result = useTextareaAutosize({
			element: textarea,
			window: fakeWindow,
		});
		const observer = FakeResizeObserver.instances[0];

		setScrollHeight(textarea, 120);
		observer?.emit(textarea, 20);
		fakeWindow.flushAnimationFrames();
		expect(textarea.style.height).toBe("120px");

		setScrollHeight(textarea, 180);
		observer?.emit(textarea, 20);
		fakeWindow.flushAnimationFrames();
		expect(textarea.style.height).toBe("120px");

		observer?.emit(textarea, 30);
		fakeWindow.flushAnimationFrames();
		expect(textarea.style.height).toBe("180px");

		result.stop();
	});

	it("calls onResize when scrollHeight changes", () => {
		const textarea = document.createElement("textarea");
		const onResize = vi.fn();
		setScrollHeight(textarea, 100);
		const result = useTextareaAutosize({ element: textarea, onResize });

		result.triggerResize();
		result.triggerResize();
		setScrollHeight(textarea, 140);
		result.triggerResize();

		expect(onResize).toHaveBeenCalledTimes(2);
		result.stop();
	});

	it("resizes when additional watch sources change", async () => {
		const textarea = document.createElement("textarea");
		const source = signal(0);
		setScrollHeight(textarea, 70);
		const result = useTextareaAutosize({
			element: textarea,
			watch: source,
		});

		setScrollHeight(textarea, 110);
		source.value = 1;
		await nextTick();

		expect(textarea.style.height).toBe("110px");
		result.stop();
	});

	it("stops automatic listeners and observers", async () => {
		const textarea = document.createElement("textarea");
		const input = signal("initial");
		const fakeWindow = new FakeWindow();
		const onResize = vi.fn();
		setScrollHeight(textarea, 60);
		const result = useTextareaAutosize({
			element: textarea,
			input,
			onResize,
			window: fakeWindow,
		});
		const observer = FakeResizeObserver.instances[0];

		result.triggerResize();
		onResize.mockClear();
		result.stop();

		setScrollHeight(textarea, 120);
		input.value = "changed";
		textarea.value = "native";
		textarea.dispatchEvent(new Event("input"));
		observer?.emit(textarea, 20);
		fakeWindow.flushAnimationFrames();
		await nextTick();

		expect(textarea.style.height).toBe("60px");
		expect(input.value).toBe("changed");
		expect(onResize).not.toHaveBeenCalled();
	});

	it("does nothing when textarea is not set", () => {
		const result = useTextareaAutosize();

		expect(() => result.triggerResize()).not.toThrow();
		expect(result.textarea.value).toBeUndefined();
		expect(result.input.value).toBe("");

		result.stop();
	});

	it("does not fall back to globals when window is null", () => {
		const textarea = document.createElement("textarea");
		const requestAnimationFrame = vi.fn();
		vi.stubGlobal("ResizeObserver", FakeResizeObserver);
		vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
		setScrollHeight(textarea, 100);
		const result = useTextareaAutosize({
			element: textarea,
			window: null,
		});

		result.triggerResize();

		expect(FakeResizeObserver.instances).toHaveLength(0);
		expect(requestAnimationFrame).not.toHaveBeenCalled();
		expect(textarea.style.height).toBe("100px");
		result.stop();
	});
});
