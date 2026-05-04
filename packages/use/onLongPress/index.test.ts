import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { useEventListener } from "../useEventListener";
import { onLongPress } from "./index";

describe("onLongPress", () => {
	let element: HTMLElement;
	let parentElement: HTMLElement;
	let childElement: HTMLElement;
	let nativePointerEvent: typeof PointerEvent | undefined;

	beforeAll(() => {
		nativePointerEvent = globalThis.PointerEvent;
		if (nativePointerEvent === undefined) {
			class TestPointerEvent extends MouseEvent {
				readonly pointerId: number;
				readonly pointerType: string;
				readonly isPrimary: boolean;

				constructor(type: string, options: PointerEventInit = {}) {
					super(type, options);
					this.pointerId = options.pointerId ?? 1;
					this.pointerType = options.pointerType ?? "mouse";
					this.isPrimary = options.isPrimary ?? true;
				}
			}

			vi.stubGlobal("PointerEvent", TestPointerEvent);
		}
	});

	afterAll(() => {
		if (nativePointerEvent === undefined) {
			vi.unstubAllGlobals();
		}
	});

	beforeEach(() => {
		vi.useFakeTimers();
		element = document.createElement("div");
		parentElement = document.createElement("div");
		childElement = document.createElement("div");
		parentElement.appendChild(element);
		element.appendChild(childElement);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function pointerEvent(
		type: string,
		options: PointerEventInit = {},
	): PointerEvent {
		return new PointerEvent(type, {
			bubbles: true,
			cancelable: true,
			...options,
		});
	}

	async function tick(ms: number): Promise<void> {
		await vi.advanceTimersByTimeAsync(ms);
	}

	it("triggers after the default delay", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler);

		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(499);
		expect(handler).not.toHaveBeenCalled();

		await tick(1);
		expect(handler).toHaveBeenCalledTimes(1);

		stop();
	});

	it("uses a custom delay", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler, { delay: 1000 });

		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).not.toHaveBeenCalled();

		await tick(500);
		expect(handler).toHaveBeenCalledTimes(1);

		stop();
	});

	it("uses a delay getter", async () => {
		const handler = vi.fn();
		const delay = vi.fn(() => 200);
		const down = pointerEvent("pointerdown");
		const stop = onLongPress(element, handler, { delay });

		element.dispatchEvent(down);
		await tick(199);
		expect(handler).not.toHaveBeenCalled();

		await tick(1);
		expect(handler).toHaveBeenCalledTimes(1);
		expect(delay).toHaveBeenCalledWith(down);

		stop();
	});

	it("cancels when the pointer is released before the delay", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler);

		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(250);
		element.dispatchEvent(pointerEvent("pointerup"));
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("cancels when the pointer leaves before the delay", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler);

		element.dispatchEvent(pointerEvent("pointerdown"));
		element.dispatchEvent(pointerEvent("pointerleave"));
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("cancels when the pointer is canceled before the delay", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler);

		element.dispatchEvent(pointerEvent("pointerdown"));
		element.dispatchEvent(pointerEvent("pointercancel"));
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("cancels when pointer movement reaches the distance threshold", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler, {
			delay: 1000,
			distanceThreshold: 15,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 20, clientY: 20 }),
		);
		await tick(500);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 4, clientY: 30 }),
		);
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("keeps the press when movement stays within the threshold", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler, {
			delay: 1000,
			distanceThreshold: 15,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 20, clientY: 20 }),
		);
		await tick(500);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 17, clientY: 25 }),
		);
		await tick(500);

		expect(handler).toHaveBeenCalledTimes(1);
		stop();
	});

	it("disables movement cancellation when distanceThreshold is false", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler, {
			distanceThreshold: false,
		});

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 0, clientY: 0 }),
		);
		element.dispatchEvent(
			pointerEvent("pointermove", { clientX: 100, clientY: 100 }),
		);
		await tick(500);

		expect(handler).toHaveBeenCalledTimes(1);
		stop();
	});

	it("calls onMouseUp with duration, distance, and long press state", async () => {
		const handler = vi.fn();
		const onMouseUp = vi.fn();
		const stop = onLongPress(element, handler, { onMouseUp });

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 1, clientY: 1 }),
		);
		await tick(250);
		element.dispatchEvent(
			pointerEvent("pointerup", { clientX: 4, clientY: 5 }),
		);

		expect(onMouseUp).toHaveBeenCalledTimes(1);
		expect(onMouseUp).toHaveBeenLastCalledWith(
			expect.any(Number),
			5,
			false,
			expect.any(PointerEvent),
		);

		element.dispatchEvent(
			pointerEvent("pointerdown", { clientX: 1, clientY: 1 }),
		);
		await tick(500);
		element.dispatchEvent(
			pointerEvent("pointerup", { clientX: 1, clientY: 1 }),
		);

		expect(handler).toHaveBeenCalledTimes(1);
		expect(onMouseUp).toHaveBeenCalledTimes(2);
		expect(onMouseUp).toHaveBeenLastCalledWith(
			expect.any(Number),
			0,
			true,
			expect.any(PointerEvent),
		);

		stop();
	});

	it("applies prevent and stop modifiers", async () => {
		const handler = vi.fn();
		const parentHandler = vi.fn();
		const parentSubscription = useEventListener(
			parentElement,
			"pointerdown",
			parentHandler,
		);
		const stop = onLongPress(element, handler, {
			modifiers: { prevent: true, stop: true },
		});
		const down = pointerEvent("pointerdown");

		element.dispatchEvent(down);
		await tick(500);

		expect(handler).toHaveBeenCalledTimes(1);
		expect(parentHandler).not.toHaveBeenCalled();
		expect(down.defaultPrevented).toBe(true);

		stop();
		parentSubscription.stop();
	});

	it("uses the self modifier", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler, {
			modifiers: { self: true },
		});

		childElement.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).not.toHaveBeenCalled();

		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).toHaveBeenCalledTimes(1);

		stop();
	});

	it("passes capture and once listener options", () => {
		const addEventListener = vi.spyOn(element, "addEventListener");
		const stop = onLongPress(element, () => {}, {
			modifiers: { capture: true, once: true },
		});

		expect(addEventListener).toHaveBeenCalledWith(
			"pointerdown",
			expect.any(Function),
			{ capture: true, once: true },
		);

		stop();
	});

	it("returns a stop function that clears the pending timer and listeners", async () => {
		const handler = vi.fn();
		const stop = onLongPress(element, handler);

		element.dispatchEvent(pointerEvent("pointerdown"));
		stop();
		await tick(500);
		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
	});

	it("follows a reactive target", async () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<HTMLElement | null>(first);
		const handler = vi.fn();
		const stop = onLongPress(target, handler);

		first.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).toHaveBeenCalledTimes(1);

		target.value = second;
		first.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).toHaveBeenCalledTimes(1);

		second.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);
		expect(handler).toHaveBeenCalledTimes(2);

		stop();
	});

	it("clears the pending timer when the target changes", async () => {
		const first = document.createElement("div");
		const second = document.createElement("div");
		const target = signal<HTMLElement | null>(first);
		const handler = vi.fn();
		const stop = onLongPress(target, handler);

		first.dispatchEvent(pointerEvent("pointerdown"));
		target.value = second;
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("stops listening while the target is null", async () => {
		const target = signal<HTMLElement | null>(element);
		const handler = vi.fn();
		const stop = onLongPress(target, handler);

		target.value = null;
		element.dispatchEvent(pointerEvent("pointerdown"));
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
		stop();
	});

	it("cleans up with the current scope", async () => {
		const scope = createScope();
		const handler = vi.fn();

		runWithScope(scope, () => {
			onLongPress(element, handler);
		});

		element.dispatchEvent(pointerEvent("pointerdown"));
		disposeScope(scope);
		await tick(500);

		expect(handler).not.toHaveBeenCalled();
	});
});
