import {
	createScope,
	deepSignal,
	disposeScope,
	nextTick,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useLastChanged } from "./index";

describe("useLastChanged", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns null until the source changes", async () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const source = signal(0);
		const lastChanged = useLastChanged(source);

		expect(lastChanged.value).toBeNull();

		vi.setSystemTime(now.getTime() + 1000);
		source.value = 1;

		expect(lastChanged.value).toBeNull();

		await nextTick();

		expect(lastChanged.value).toBe(now.getTime() + 1000);
	});

	it("updates immediately with sync flushing", () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const source = signal("initial");
		const lastChanged = useLastChanged(source, { flush: "sync" });

		vi.setSystemTime(now.getTime() + 250);
		source.value = "updated";

		expect(lastChanged.value).toBe(now.getTime() + 250);
	});

	it("uses the provided initial value", () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const initialValue = now.getTime() - 5000;
		const source = signal("initial");
		const lastChanged = useLastChanged(source, {
			flush: "sync",
			initialValue,
		});

		expect(lastChanged.value).toBe(initialValue);

		source.value = "updated";

		expect(lastChanged.value).toBe(now.getTime());
	});

	it("records the initial run when immediate is true", () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const source = signal(0);
		const lastChanged = useLastChanged(source, {
			immediate: true,
		});

		expect(lastChanged.value).toBe(now.getTime());
	});

	it("passes deep watch options to Sigrea watch", () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const source = deepSignal({ count: 0 });
		const lastChanged = useLastChanged(source, {
			deep: true,
			flush: "sync",
		});

		vi.setSystemTime(now.getTime() + 750);
		source.count = 1;

		expect(lastChanged.value).toBe(now.getTime() + 750);
	});

	it("stops watching when the active scope is disposed", () => {
		vi.useFakeTimers();
		const now = new Date("2026-05-06T00:00:00.000Z");
		vi.setSystemTime(now);
		const source = signal(0);
		const scope = createScope();
		const lastChanged = runWithScope(scope, () =>
			useLastChanged(source, { flush: "sync" }),
		);

		source.value = 1;
		expect(lastChanged.value).toBe(now.getTime());

		disposeScope(scope);

		vi.setSystemTime(now.getTime() + 1000);
		source.value = 2;

		expect(lastChanged.value).toBe(now.getTime());
	});
});
