import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useEventListener } from "./index";

describe("useEventListener", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("exposes a stop handle", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const subscription = useEventListener(target, "ping", listener);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("listens on window when the target is omitted", () => {
		const listener = vi.fn();
		const subscription = useEventListener("resize", listener);

		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("listens to multiple window event names when the target is omitted", () => {
		const listener = vi.fn();
		const subscription = useEventListener(["resize", "scroll"], listener);

		window.dispatchEvent(new Event("resize"));
		window.dispatchEvent(new Event("scroll"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("does not call the listener when omitted event names are empty", () => {
		const listener = vi.fn();
		const subscription = useEventListener([], listener);

		expect(listener).not.toHaveBeenCalled();

		subscription.stop();
	});

	it("registers multiple targets, event names, and listeners", () => {
		const firstTarget = new EventTarget();
		const secondTarget = new EventTarget();
		const firstListener = vi.fn();
		const secondListener = vi.fn();
		const subscription = useEventListener(
			[firstTarget, secondTarget],
			["ping", "pong"],
			[firstListener, secondListener],
		);

		firstTarget.dispatchEvent(new Event("ping"));
		expect(firstListener).toHaveBeenCalledTimes(1);
		expect(secondListener).toHaveBeenCalledTimes(1);

		secondTarget.dispatchEvent(new Event("pong"));
		expect(firstListener).toHaveBeenCalledTimes(2);
		expect(secondListener).toHaveBeenCalledTimes(2);

		subscription.stop();
		firstTarget.dispatchEvent(new Event("ping"));
		secondTarget.dispatchEvent(new Event("pong"));
		expect(firstListener).toHaveBeenCalledTimes(2);
		expect(secondListener).toHaveBeenCalledTimes(2);
	});

	it("can watch a reactive event name when the target is omitted", () => {
		const eventName = signal<"resize" | "scroll">("resize");
		const listener = vi.fn();
		const subscription = useEventListener(() => eventName.value, listener);

		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		eventName.value = "scroll";
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		window.dispatchEvent(new Event("scroll"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
		window.dispatchEvent(new Event("scroll"));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("keeps omitted reactive event names inert while nullish", () => {
		const eventName = signal<"resize" | null | undefined>(undefined);
		const eventTypes: string[] = [];
		const listener = vi.fn((event: Event) => {
			eventTypes.push(event.type);
		});
		const subscription = useEventListener(() => eventName.value, listener);

		window.dispatchEvent(new Event("resize"));
		expect(listener).not.toHaveBeenCalled();

		eventName.value = null;
		window.dispatchEvent(new Event("resize"));
		expect(listener).not.toHaveBeenCalled();

		eventName.value = "resize";
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);
		expect(eventTypes).toEqual(["resize"]);

		eventName.value = undefined;
		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
	});

	it("removes listeners with the original options snapshot", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const options: AddEventListenerOptions = { capture: true };
		const subscription = useEventListener(target, "ping", listener, options);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		options.capture = false;
		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("accepts an options getter when the target is omitted", () => {
		const listener = vi.fn();
		const getOptions = vi.fn(() => ({ passive: true }));
		const subscription = useEventListener("resize", listener, getOptions);

		window.dispatchEvent(new Event("resize"));
		expect(listener).toHaveBeenCalledTimes(1);
		expect(getOptions).toHaveBeenCalled();

		subscription.stop();
	});

	it("retargets event listeners when the source target changes", () => {
		const firstTarget = new EventTarget();
		const secondTarget = new EventTarget();
		const currentTarget = signal(firstTarget);
		const listener = vi.fn();
		const subscription = useEventListener(currentTarget, "ping", listener);

		firstTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		currentTarget.value = secondTarget;
		firstTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		secondTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
		secondTarget.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it("stops listening when a reactive target becomes unavailable", () => {
		const target = new EventTarget();
		const currentTarget = signal<EventTarget | null>(target);
		const listener = vi.fn();
		const subscription = useEventListener(currentTarget, "ping", listener);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		currentTarget.value = null;
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		subscription.stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("can watch a reactive event name on an explicit target", () => {
		const target = new EventTarget();
		const eventName = signal("ping");
		const listener = vi.fn();
		const subscription = useEventListener(
			target,
			() => eventName.value,
			listener,
		);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		eventName.value = "pong";
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		target.dispatchEvent(new Event("pong"));
		expect(listener).toHaveBeenCalledTimes(2);

		subscription.stop();
	});

	it("re-registers listeners when the options change", () => {
		const target = new EventTarget();
		const addSpy = vi.spyOn(target, "addEventListener");
		const removeSpy = vi.spyOn(target, "removeEventListener");
		const listener = vi.fn();
		const options = signal<boolean | AddEventListenerOptions>(false);
		const subscription = useEventListener(target, "ping", listener, options);

		expect(addSpy).toHaveBeenCalledTimes(1);
		expect(addSpy.mock.calls[0]?.[2]).toBe(false);

		options.value = { capture: true };
		expect(removeSpy).toHaveBeenCalledTimes(1);
		expect(removeSpy.mock.calls[0]?.[2]).toBe(false);
		expect(addSpy).toHaveBeenCalledTimes(2);
		expect(addSpy.mock.calls[1]?.[2]).toEqual({ capture: true });

		subscription.stop();
		expect(removeSpy).toHaveBeenCalledTimes(2);
		expect(removeSpy.mock.calls[1]?.[2]).toEqual({ capture: true });
	});

	it("binds event listeners to molecule mount and unmount", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const ListenerMolecule = molecule(() =>
			useEventListener(target, "ping", listener),
		);
		const instance = ListenerMolecule();
		trackMolecule(instance);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(0);

		mountMolecule(instance);
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		unmountMolecule(instance);
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});
});
