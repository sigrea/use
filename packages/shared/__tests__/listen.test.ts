import { createScope, disposeScope, runWithScope, signal } from "@sigrea/core";
import { describe, expect, expectTypeOf, it, vi } from "vitest";

import { listen } from "../listen";

describe("listen", () => {
	it("subscribes to a constant target until stopped", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const stop = listen(target, "ping", listener);

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		stop();
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("retargets when the target signal changes", () => {
		const first = new EventTarget();
		const second = new EventTarget();
		const current = signal<EventTarget | null>(first);
		const listener = vi.fn();

		const stop = listen(current, "ping", listener);

		first.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		current.value = second;
		first.dispatchEvent(new Event("ping"));
		second.dispatchEvent(new Event("ping"));

		expect(listener).toHaveBeenCalledTimes(2);
		stop();
	});

	it("cleans up when the reactive target becomes null", () => {
		const first = new EventTarget();
		const second = new EventTarget();
		const current = signal<EventTarget | null>(first);
		const listener = vi.fn();

		const stop = listen(current, "ping", listener);

		first.dispatchEvent(new Event("ping"));
		current.value = null;
		first.dispatchEvent(new Event("ping"));
		current.value = second;
		second.dispatchEvent(new Event("ping"));

		expect(listener).toHaveBeenCalledTimes(2);
		stop();
	});

	it("cleans up automatically with the active scope", () => {
		const target = new EventTarget();
		const listener = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			listen(target, "ping", listener);
		});

		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);

		disposeScope(scope);
		target.dispatchEvent(new Event("ping"));
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("infers non-null targets and DOM event payloads", () => {
		const button = signal<HTMLButtonElement | null>(
			document.createElement("button"),
		);

		const stop = listen(button, "click", (event) => {
			expectTypeOf(event).toMatchTypeOf<MouseEvent>();
		});

		stop();
	});
});
