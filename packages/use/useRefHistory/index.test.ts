import {
	disposeTrackedMolecules,
	isDeepSignal,
	molecule,
	mountMolecule,
	nextTick,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useRefHistory } from "./index";

describe("useRefHistory", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("commits source changes with the default pre flush", async () => {
		const source = signal(0);
		const history = useRefHistory(source);

		source.value = 1;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
	});

	it("supports sync undo and redo without recording its own source writes", () => {
		const source = signal(0);
		const history = useRefHistory(source, { flush: "sync" });

		source.value = 1;
		source.value = 2;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);

		history.undo();
		expect(source.value).toBe(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
		expect(history.redoStack.value.map((record) => record.snapshot)).toEqual([
			2,
		]);

		history.redo();
		expect(source.value).toBe(2);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
		expect(history.redoStack.value).toEqual([]);
	});

	it("respects shouldCommit", () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			flush: "sync",
			shouldCommit: (_oldValue, newValue) => newValue > 0,
		});

		source.value = -1;
		source.value = 2;
		source.value = -3;
		source.value = 4;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			4, 2, 0,
		]);
	});

	it("pauses and resumes tracking", () => {
		const source = signal(1);
		const history = useRefHistory(source, { flush: "sync" });

		history.pause();
		expect(history.isTracking.value).toBe(false);

		source.value = 2;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([1]);

		history.resume();
		expect(history.isTracking.value).toBe(true);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([1]);

		source.value = 3;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			3, 1,
		]);

		history.pause();
		source.value = 4;
		history.resume(true);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			4, 3, 1,
		]);
	});

	it("ignores paused pre-flush updates when resuming without commit", async () => {
		const source = signal(0);
		const history = useRefHistory(source);

		history.pause();
		source.value = 1;
		history.resume();
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);

		source.value = 2;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("restores tracking when resume commit throws", () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			flush: "sync",
			shouldCommit: (_oldValue, newValue) => {
				if (newValue === 1) {
					throw new Error("commit failed");
				}
				return true;
			},
		});

		history.pause();
		source.value = 1;

		expect(() => history.resume(true)).toThrow("commit failed");
		expect(history.isTracking.value).toBe(true);

		source.value = 2;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("ignores pending pre-flush updates after resume commit throws", async () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			shouldCommit: (_oldValue, newValue) => {
				if (newValue === 1) {
					throw new Error("commit failed");
				}
				return true;
			},
		});

		history.pause();
		source.value = 1;

		expect(() => history.resume(true)).toThrow("commit failed");
		await nextTick();

		source.value = 2;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("batches multiple sync writes into one commit", () => {
		const source = signal(0);
		const history = useRefHistory(source, { flush: "sync" });

		history.batch(() => {
			source.value = 1;
			source.value = 2;
		});

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);

		history.batch((cancel) => {
			source.value = 3;
			cancel();
		});

		expect(source.value).toBe(3);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);

		source.value = 4;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			4, 2, 0,
		]);
	});

	it("restores tracking when a batch commit throws", () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			flush: "sync",
			shouldCommit: (_oldValue, newValue) => {
				if (newValue === 1) {
					throw new Error("commit failed");
				}
				return true;
			},
		});

		expect(() => {
			history.batch(() => {
				source.value = 1;
			});
		}).toThrow("commit failed");
		expect(history.isTracking.value).toBe(true);

		source.value = 2;
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("ignores pending pre-flush updates after a batch commit throws", async () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			shouldCommit: (_oldValue, newValue) => {
				if (newValue === 1) {
					throw new Error("commit failed");
				}
				return true;
			},
		});

		expect(() => {
			history.batch(() => {
				source.value = 1;
			});
		}).toThrow("commit failed");
		await nextTick();

		source.value = 2;
		await nextTick();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 0,
		]);
	});

	it("disposes the watcher and clears undo and redo stacks", () => {
		const source = signal(0);
		const history = useRefHistory(source, { flush: "sync" });

		source.value = 1;
		source.value = 2;
		history.undo();

		expect(history.redoStack.value.map((record) => record.snapshot)).toEqual([
			2,
		]);

		history.dispose();
		source.value = 3;

		expect(history.isTracking.value).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([1]);
		expect(history.redoStack.value).toEqual([]);
	});

	it("serializes history records and parses them on undo", () => {
		const source = signal({ count: 0 });
		const history = useRefHistory(source, {
			flush: "sync",
			dump: JSON.stringify,
			parse: (value: string) => JSON.parse(value) as { count: number },
		});

		source.value = { count: 1 };

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			'{"count":1}',
			'{"count":0}',
		]);

		history.undo();

		expect(source.value).toEqual({ count: 0 });
	});

	it("clones snapshots when deep is enabled", () => {
		const source = signal({ count: 0 });
		const history = useRefHistory(source, { deep: true, flush: "sync" });

		source.value = { count: 1 };

		expect(history.history.value[0].snapshot).toEqual({ count: 1 });
		expect(history.history.value[1].snapshot).toEqual({ count: 0 });
		expect(history.history.value[0].snapshot).not.toBe(
			history.history.value[1].snapshot,
		);

		history.undo();

		expect(source.value).toEqual({ count: 0 });
		expect(history.last.value.snapshot).not.toBe(source.value);
	});

	it("does not track nested mutations when deep is disabled", () => {
		const source = signal({ nested: { count: 0 } });
		const history = useRefHistory(source, { clone: true, flush: "sync" });

		source.value.nested.count = 1;

		expect(isDeepSignal(source.value)).toBe(false);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 0 } },
		]);
	});

	it("tracks nested mutations on a plain object signal when deep is enabled", () => {
		const source = signal({ nested: { count: 0 } });
		const history = useRefHistory(source, { deep: true, flush: "sync" });

		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 1;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 1 } },
			{ nested: { count: 0 } },
		]);
		expect(isDeepSignal(history.history.value[0].snapshot)).toBe(false);
	});

	it("keeps tracking nested mutations after undo restores a snapshot", () => {
		const source = signal({ nested: { count: 0 } });
		const history = useRefHistory(source, { deep: true, flush: "sync" });

		source.value.nested.count = 1;
		history.undo();

		expect(source.value).toEqual({ nested: { count: 0 } });
		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 2;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 2 } },
			{ nested: { count: 0 } },
		]);
		expect(history.redoStack.value).toEqual([]);
	});

	it("keeps tracking nested mutations after redo and reset restore snapshots", () => {
		const source = signal({ nested: { count: 0 } });
		const history = useRefHistory(source, { deep: true, flush: "sync" });

		source.value.nested.count = 1;
		history.undo();
		history.redo();

		expect(source.value).toEqual({ nested: { count: 1 } });
		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 2;
		history.reset();

		expect(source.value).toEqual({ nested: { count: 2 } });
		expect(isDeepSignal(source.value)).toBe(true);

		source.value.nested.count = 3;

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			{ nested: { count: 3 } },
			{ nested: { count: 2 } },
			{ nested: { count: 1 } },
			{ nested: { count: 0 } },
		]);
	});

	it("creates the initial record during molecule setup", () => {
		const HistoryMolecule = molecule(() => {
			const source = signal("ready");
			return {
				source,
				history: useRefHistory(source, { flush: "sync" }),
			};
		});
		const instance = HistoryMolecule();
		trackMolecule(instance);

		expect(
			instance.history.history.value.map((record) => record.snapshot),
		).toEqual(["ready"]);

		mountMolecule(instance);
		instance.source.value = "mounted";

		expect(
			instance.history.history.value.map((record) => record.snapshot),
		).toEqual(["mounted", "ready"]);
	});
});
