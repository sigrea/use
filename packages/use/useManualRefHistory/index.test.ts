import {
	disposeTrackedMolecules,
	molecule,
	signal,
	trackMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import { useManualRefHistory } from "./index";

describe("useManualRefHistory", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("records commits and supports undo and redo", () => {
		const source = signal(0);
		const history = useManualRefHistory(source);

		expect(history.history.value.map((record) => record.snapshot)).toEqual([0]);
		expect(history.canUndo.value).toBe(false);
		expect(history.canRedo.value).toBe(false);

		source.value = 1;
		history.commit();
		source.value = 2;
		history.commit();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			2, 1, 0,
		]);
		expect(history.canUndo.value).toBe(true);
		expect(history.canRedo.value).toBe(false);

		history.undo();
		expect(source.value).toBe(1);
		expect(history.last.value.snapshot).toBe(1);
		expect(history.canRedo.value).toBe(true);

		history.redo();
		expect(source.value).toBe(2);
		expect(history.last.value.snapshot).toBe(2);
		expect(history.canRedo.value).toBe(false);

		history.clear();
		expect(history.history.value.map((record) => record.snapshot)).toEqual([2]);
		expect(history.canUndo.value).toBe(false);
		expect(history.canRedo.value).toBe(false);
	});

	it("resets source to the last committed record without changing stacks", () => {
		const source = signal(0);
		const history = useManualRefHistory(source);

		source.value = 1;
		history.commit();
		source.value = 2;

		history.reset();

		expect(source.value).toBe(1);
		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			1, 0,
		]);
		expect(history.redoStack.value).toEqual([]);

		source.value = 3;
		history.commit();
		history.undo();
		source.value = 2;

		history.reset();

		expect(source.value).toBe(1);
		expect(history.undoStack.value.map((record) => record.snapshot)).toEqual([
			0,
		]);
		expect(history.redoStack.value.map((record) => record.snapshot)).toEqual([
			3,
		]);
	});

	it("limits the undo stack by capacity", () => {
		const source = signal(0);
		const history = useManualRefHistory(source, { capacity: 2 });

		source.value = 1;
		history.commit();
		source.value = 2;
		history.commit();
		source.value = 3;
		history.commit();

		expect(history.history.value.map((record) => record.snapshot)).toEqual([
			3, 2, 1,
		]);

		history.undo();
		history.undo();
		history.undo();

		expect(source.value).toBe(1);
		expect(history.canUndo.value).toBe(false);
	});

	it("clones object snapshots when clone is true", () => {
		const source = signal({ count: 0 });
		const history = useManualRefHistory(source, { clone: true });

		source.value.count = 1;
		history.commit();

		expect(history.history.value[0].snapshot).toEqual({ count: 1 });
		expect(history.history.value[1].snapshot).toEqual({ count: 0 });
		expect(history.history.value[0].snapshot).not.toBe(
			history.history.value[1].snapshot,
		);

		history.undo();

		expect(source.value).toEqual({ count: 0 });
		expect(history.last.value.snapshot).not.toBe(source.value);
	});

	it("uses custom dump, parse, and setSource serializers", () => {
		const source = signal({ count: 0, restored: false });
		const restoredValues: number[] = [];
		const history = useManualRefHistory(source, {
			dump: (value) => JSON.stringify({ count: value.count }),
			parse: (value: string) => ({
				...(JSON.parse(value) as { count: number }),
				restored: false,
			}),
			setSource: (target, value) => {
				restoredValues.push(value.count);
				target.value = { ...value, restored: true };
			},
		});

		source.value = { count: 1, restored: false };
		history.commit();

		expect(history.history.value[0].snapshot).toBe('{"count":1}');
		expect(history.history.value[1].snapshot).toBe('{"count":0}');

		history.undo();

		expect(source.value).toEqual({ count: 0, restored: true });
		expect(restoredValues).toEqual([0]);
	});

	it("creates the initial record during molecule setup", () => {
		const HistoryMolecule = molecule(() => {
			const source = signal("ready");
			return useManualRefHistory(source);
		});
		const instance = HistoryMolecule();
		trackMolecule(instance);

		expect(instance.history.value.map((record) => record.snapshot)).toEqual([
			"ready",
		]);
		expect(instance.canUndo.value).toBe(false);
	});
});
