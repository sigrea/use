import { disposeTrackedMolecules, signal } from "@sigrea/core";
import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	it,
	vi,
} from "vitest";

import { usePointer } from "./index";

describe("usePointer", () => {
	let nativePointerEvent: typeof PointerEvent | undefined;

	beforeAll(() => {
		nativePointerEvent = globalThis.PointerEvent;
		if (nativePointerEvent === undefined) {
			class TestPointerEvent extends MouseEvent {
				readonly height: number;
				readonly pointerId: number;
				readonly pointerType: string;
				readonly pressure: number;
				readonly tiltX: number;
				readonly tiltY: number;
				readonly twist: number;
				readonly width: number;

				constructor(type: string, options: PointerEventInit = {}) {
					super(type, options);
					this.height = options.height ?? 0;
					this.pointerId = options.pointerId ?? 1;
					this.pointerType = options.pointerType ?? "mouse";
					this.pressure = options.pressure ?? 0;
					this.tiltX = options.tiltX ?? 0;
					this.tiltY = options.tiltY ?? 0;
					this.twist = options.twist ?? 0;
					this.width = options.width ?? 0;
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

	afterEach(() => {
		disposeTrackedMolecules();
	});

	function pointerEvent(
		type: string,
		options: PointerEventInit = {},
	): PointerEvent {
		return new PointerEvent(type, {
			clientX: 0,
			clientY: 0,
			height: 0,
			pointerId: 1,
			pointerType: "mouse",
			pressure: 0,
			tiltX: 0,
			tiltY: 0,
			twist: 0,
			width: 0,
			...options,
		});
	}

	it("uses initial values", () => {
		const pointer = usePointer({
			initialValue: {
				x: 10,
				y: 20,
				pointerType: "pen",
				pressure: 0.5,
			},
			target: null,
		});

		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);
		expect(pointer.pointerType.value).toBe("pen");
		expect(pointer.pressure.value).toBe(0.5);
		expect(pointer.isInside.value).toBe(false);

		pointer.stop();
	});

	it("tracks pointer event state", () => {
		const target = new EventTarget();
		const pointer = usePointer({ target });

		target.dispatchEvent(
			pointerEvent("pointermove", {
				clientX: 30,
				clientY: 40,
				height: 8,
				pointerId: 2,
				pointerType: "touch",
				pressure: 0.75,
				tiltX: 12,
				tiltY: -8,
				twist: 45,
				width: 6,
			}),
		);

		expect(pointer.x.value).toBe(30);
		expect(pointer.y.value).toBe(40);
		expect(pointer.height.value).toBe(8);
		expect(pointer.pointerId.value).toBe(2);
		expect(pointer.pointerType.value).toBe("touch");
		expect(pointer.pressure.value).toBe(0.75);
		expect(pointer.tiltX.value).toBe(12);
		expect(pointer.tiltY.value).toBe(-8);
		expect(pointer.twist.value).toBe(45);
		expect(pointer.width.value).toBe(6);
		expect(pointer.isInside.value).toBe(true);

		target.dispatchEvent(
			pointerEvent("pointerleave", { pointerType: "touch" }),
		);
		expect(pointer.isInside.value).toBe(false);

		pointer.stop();
	});

	it("updates state and leaves on pointer cancel", () => {
		const target = new EventTarget();
		const pointer = usePointer({ target });

		target.dispatchEvent(
			pointerEvent("pointermove", {
				clientX: 30,
				clientY: 40,
				pointerType: "touch",
				pressure: 0.75,
			}),
		);
		expect(pointer.isInside.value).toBe(true);

		target.dispatchEvent(
			pointerEvent("pointercancel", {
				clientX: 35,
				clientY: 45,
				height: 7,
				pointerId: 3,
				pointerType: "touch",
				pressure: 0.5,
				tiltX: 10,
				tiltY: -6,
				twist: 30,
				width: 5,
			}),
		);

		expect(pointer.x.value).toBe(35);
		expect(pointer.y.value).toBe(45);
		expect(pointer.height.value).toBe(7);
		expect(pointer.pointerId.value).toBe(3);
		expect(pointer.pointerType.value).toBe("touch");
		expect(pointer.pressure.value).toBe(0.5);
		expect(pointer.tiltX.value).toBe(10);
		expect(pointer.tiltY.value).toBe(-6);
		expect(pointer.twist.value).toBe(30);
		expect(pointer.width.value).toBe(5);
		expect(pointer.isInside.value).toBe(false);

		pointer.stop();
	});

	it("filters pointer types", () => {
		const target = new EventTarget();
		const pointerTypes = signal<readonly ("pen" | "touch")[]>(["pen"]);
		const pointer = usePointer({ pointerTypes, target });

		target.dispatchEvent(
			pointerEvent("pointermove", {
				clientX: 10,
				clientY: 20,
				pointerType: "mouse",
			}),
		);

		expect(pointer.x.value).toBe(0);
		expect(pointer.y.value).toBe(0);
		expect(pointer.isInside.value).toBe(false);

		target.dispatchEvent(
			pointerEvent("pointerdown", {
				clientX: 30,
				clientY: 40,
				pointerType: "pen",
			}),
		);

		expect(pointer.x.value).toBe(30);
		expect(pointer.y.value).toBe(40);
		expect(pointer.pointerType.value).toBe("pen");
		expect(pointer.isInside.value).toBe(true);

		pointerTypes.value = ["touch"];
		target.dispatchEvent(pointerEvent("pointerleave", { pointerType: "pen" }));
		expect(pointer.isInside.value).toBe(true);
		target.dispatchEvent(
			pointerEvent("pointerleave", { pointerType: "touch" }),
		);
		expect(pointer.isInside.value).toBe(false);

		pointer.stop();
	});

	it("filters pointer cancel by pointer type", () => {
		const target = new EventTarget();
		const pointer = usePointer({ pointerTypes: ["pen"], target });

		target.dispatchEvent(
			pointerEvent("pointerdown", {
				clientX: 10,
				clientY: 20,
				pointerType: "pen",
			}),
		);
		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);
		expect(pointer.isInside.value).toBe(true);

		target.dispatchEvent(
			pointerEvent("pointercancel", {
				clientX: 30,
				clientY: 40,
				pointerType: "touch",
			}),
		);
		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);
		expect(pointer.isInside.value).toBe(true);

		target.dispatchEvent(
			pointerEvent("pointercancel", {
				clientX: 50,
				clientY: 60,
				pointerType: "pen",
			}),
		);
		expect(pointer.x.value).toBe(50);
		expect(pointer.y.value).toBe(60);
		expect(pointer.isInside.value).toBe(false);

		pointer.stop();
	});

	it("retargets listeners when the target changes", () => {
		const firstTarget = new EventTarget();
		const secondTarget = new EventTarget();
		const target = signal<EventTarget | null>(firstTarget);
		const pointer = usePointer({ target });

		firstTarget.dispatchEvent(
			pointerEvent("pointermove", { clientX: 10, clientY: 20 }),
		);
		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);
		expect(pointer.isInside.value).toBe(true);

		target.value = secondTarget;
		expect(pointer.isInside.value).toBe(false);
		firstTarget.dispatchEvent(
			pointerEvent("pointermove", { clientX: 30, clientY: 40 }),
		);
		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);

		secondTarget.dispatchEvent(
			pointerEvent("pointermove", { clientX: 50, clientY: 60 }),
		);
		expect(pointer.x.value).toBe(50);
		expect(pointer.y.value).toBe(60);
		expect(pointer.isInside.value).toBe(true);

		pointer.stop();
		expect(pointer.isInside.value).toBe(false);
	});

	it("stops updates after stop", () => {
		const target = new EventTarget();
		const pointer = usePointer({ target });

		target.dispatchEvent(
			pointerEvent("pointermove", { clientX: 10, clientY: 20 }),
		);
		pointer.stop();
		target.dispatchEvent(
			pointerEvent("pointermove", { clientX: 30, clientY: 40 }),
		);
		target.dispatchEvent(
			pointerEvent("pointercancel", { clientX: 50, clientY: 60 }),
		);
		target.dispatchEvent(pointerEvent("pointerleave"));

		expect(pointer.x.value).toBe(10);
		expect(pointer.y.value).toBe(20);
		expect(pointer.isInside.value).toBe(false);
	});

	it("does not fall back to the default window when window is null", () => {
		const addSpy = vi.spyOn(window, "addEventListener");
		const pointer = usePointer({ window: null });

		expect(addSpy).not.toHaveBeenCalled();

		window.dispatchEvent(
			pointerEvent("pointermove", { clientX: 20, clientY: 30 }),
		);
		expect(pointer.x.value).toBe(0);
		expect(pointer.y.value).toBe(0);

		pointer.stop();
		addSpy.mockRestore();
	});
});
