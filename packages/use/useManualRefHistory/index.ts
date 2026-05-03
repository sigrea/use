import { computed, readonly, signal } from "@sigrea/core";

import type { Signal } from "@sigrea/core";
import type {
	CloneFn,
	UseManualRefHistoryOptions,
	UseManualRefHistoryReturn,
	UseRefHistoryRecord,
} from "../types";

type Mapper<From, To> = (value: From) => To;

function bypass<From, To>(value: From): To {
	return value as unknown as To;
}

function cloneJson<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

function createDefaultDump<Raw, Serialized>(
	clone?: boolean | CloneFn<Raw>,
): Mapper<Raw, Serialized> {
	if (typeof clone === "function") {
		return clone as unknown as Mapper<Raw, Serialized>;
	}
	if (clone) {
		return cloneJson as unknown as Mapper<Raw, Serialized>;
	}
	return bypass;
}

function createDefaultParse<Raw, Serialized>(
	clone?: boolean | CloneFn<Raw>,
): Mapper<Serialized, Raw> {
	if (typeof clone === "function") {
		return clone as unknown as Mapper<Serialized, Raw>;
	}
	if (clone) {
		return cloneJson as unknown as Mapper<Serialized, Raw>;
	}
	return bypass;
}

function setSignalSource<Raw>(source: Signal<Raw>, value: Raw): void {
	source.value = value;
}

function applyCapacity<T>(records: T[], capacity: number | undefined): T[] {
	if (capacity === undefined) {
		return records;
	}
	return records.slice(0, Math.max(0, capacity));
}

export function useManualRefHistory<Raw, Serialized = Raw>(
	source: Signal<Raw>,
	options: UseManualRefHistoryOptions<Raw, Serialized> = {},
): UseManualRefHistoryReturn<Raw, Serialized> {
	const {
		clone = false,
		dump = createDefaultDump<Raw, Serialized>(clone),
		parse = createDefaultParse<Raw, Serialized>(clone),
		setSource = setSignalSource,
	} = options;

	function createHistoryRecord(): UseRefHistoryRecord<Serialized> {
		return {
			snapshot: dump(source.value),
			timestamp: Date.now(),
		};
	}

	const last = signal(createHistoryRecord());
	const undoStack = signal<UseRefHistoryRecord<Serialized>[]>([]);
	const redoStack = signal<UseRefHistoryRecord<Serialized>[]>([]);

	const history = computed(() => [last.value, ...undoStack.value]);
	const canUndo = computed(() => undoStack.value.length > 0);
	const canRedo = computed(() => redoStack.value.length > 0);

	function setSourceFromRecord(record: UseRefHistoryRecord<Serialized>): void {
		setSource(source, parse(record.snapshot));
		last.value = record;
	}

	function commit(): void {
		undoStack.value = applyCapacity(
			[last.value, ...undoStack.value],
			options.capacity,
		);
		last.value = createHistoryRecord();
		redoStack.value = [];
	}

	function clear(): void {
		undoStack.value = [];
		redoStack.value = [];
	}

	function undo(): void {
		const [record, ...nextUndoStack] = undoStack.value;
		if (record === undefined) {
			return;
		}

		undoStack.value = nextUndoStack;
		redoStack.value = [last.value, ...redoStack.value];
		setSourceFromRecord(record);
	}

	function redo(): void {
		const [record, ...nextRedoStack] = redoStack.value;
		if (record === undefined) {
			return;
		}

		redoStack.value = nextRedoStack;
		undoStack.value = [last.value, ...undoStack.value];
		setSourceFromRecord(record);
	}

	function reset(): void {
		setSourceFromRecord(last.value);
	}

	return {
		source,
		history: readonly(history),
		last,
		undoStack,
		redoStack,
		canUndo: readonly(canUndo),
		canRedo: readonly(canRedo),
		clear,
		commit,
		reset,
		undo,
		redo,
	};
}
