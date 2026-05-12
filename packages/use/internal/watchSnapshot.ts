import { isSignal } from "@sigrea/core";
import type { Signal, WatchOptions } from "@sigrea/core";

export interface WatchSnapshotBaseline<T> {
	value: T;
	snapshot: unknown;
}

const SNAPSHOT_ID = Symbol("watchSnapshot.snapshotId");
const ARRAY_HOLE = Symbol("watchSnapshot.arrayHole");
const SIGNAL_SKIP = "__v_skip";
const snapshotIds = new WeakMap<object, number>();
let nextSnapshotId = 0;

function isObject(value: unknown): value is object {
	return typeof value === "object" && value !== null;
}

function isPlainObject(value: object): boolean {
	return Object.prototype.toString.call(value) === "[object Object]";
}

function isRawObject(value: object): boolean {
	return Boolean((value as Record<string, unknown>)[SIGNAL_SKIP]);
}

export function resolveWatchSnapshotDepth(deep: WatchOptions["deep"]): number {
	if (deep === true) {
		return Number.POSITIVE_INFINITY;
	}
	if (typeof deep === "number") {
		if (!Number.isFinite(deep)) {
			return Number.POSITIVE_INFINITY;
		}
		return deep <= 0 ? 1 : deep + 1;
	}
	return 0;
}

function getSnapshotId(value: object): number {
	const currentId = snapshotIds.get(value);
	if (currentId !== undefined) {
		return currentId;
	}

	const nextId = nextSnapshotId;
	nextSnapshotId += 1;
	snapshotIds.set(value, nextId);
	return nextId;
}

function assignSnapshotId<T extends object>(snapshot: T, source: object): T {
	(snapshot as Record<PropertyKey, unknown>)[SNAPSHOT_ID] =
		getSnapshotId(source);
	return snapshot;
}

function createSnapshot(
	value: unknown,
	depth: number,
	seen?: WeakMap<object, unknown>,
): unknown {
	if (depth <= 0 || !isObject(value)) {
		return value;
	}

	if (isRawObject(value)) {
		return assignSnapshotId({ type: "Raw" }, value);
	}

	const nextSeen = seen ?? new WeakMap<object, unknown>();
	const cached = nextSeen.get(value);
	if (cached !== undefined) {
		return cached;
	}

	const nextDepth = depth - 1;
	if (isSignal(value)) {
		const output = assignSnapshotId(
			{ type: "Signal", value: undefined as unknown },
			value,
		);
		nextSeen.set(value, output);
		output.value = createSnapshot(
			(value as Signal<unknown>).value,
			nextDepth,
			nextSeen,
		);
		return output;
	}
	if (Array.isArray(value)) {
		const output: unknown[] = assignSnapshotId(new Array(value.length), value);
		nextSeen.set(value, output);
		for (let index = 0; index < value.length; index += 1) {
			output[index] = Object.prototype.hasOwnProperty.call(value, index)
				? createSnapshot(value[index], nextDepth, nextSeen)
				: ARRAY_HOLE;
		}
		return output;
	}
	if (value instanceof Set) {
		const output = assignSnapshotId(
			{ type: "Set", values: [] as unknown[] },
			value,
		);
		nextSeen.set(value, output);
		for (const entry of value) {
			output.values.push(createSnapshot(entry, nextDepth, nextSeen));
		}
		return output;
	}
	if (value instanceof Map) {
		const output = assignSnapshotId(
			{ entries: [] as unknown[][], type: "Map" },
			value,
		);
		nextSeen.set(value, output);
		for (const [key, entry] of value) {
			output.entries.push([
				createSnapshot(key, nextDepth, nextSeen),
				createSnapshot(entry, nextDepth, nextSeen),
			]);
		}
		return output;
	}
	if (!isPlainObject(value)) {
		return assignSnapshotId({ type: "Object" }, value);
	}

	const output = assignSnapshotId({} as Record<PropertyKey, unknown>, value);
	nextSeen.set(value, output);
	const objectValue = value as Record<PropertyKey, unknown>;
	for (const key of Object.keys(objectValue)) {
		output[key] = createSnapshot(objectValue[key], nextDepth, nextSeen);
	}
	for (const key of Object.getOwnPropertySymbols(objectValue)) {
		if (Object.prototype.propertyIsEnumerable.call(objectValue, key)) {
			output[key] = createSnapshot(objectValue[key], nextDepth, nextSeen);
		}
	}
	return output;
}

function areSnapshotsEqual(
	left: unknown,
	right: unknown,
	seen?: WeakMap<object, WeakSet<object>>,
): boolean {
	if (Object.is(left, right)) {
		return true;
	}
	if (!isObject(left) || !isObject(right)) {
		return false;
	}

	const nextSeen = seen ?? new WeakMap<object, WeakSet<object>>();
	const seenRights = nextSeen.get(left);
	if (seenRights?.has(right)) {
		return true;
	}
	if (seenRights === undefined) {
		nextSeen.set(left, new WeakSet([right]));
	} else {
		seenRights.add(right);
	}

	const leftKeys = Reflect.ownKeys(left);
	const rightKeys = Reflect.ownKeys(right);
	if (leftKeys.length !== rightKeys.length) {
		return false;
	}

	const rightKeySet = new Set(rightKeys);
	for (const key of leftKeys) {
		if (!rightKeySet.has(key)) {
			return false;
		}
		if (
			!areSnapshotsEqual(
				(left as Record<PropertyKey, unknown>)[key],
				(right as Record<PropertyKey, unknown>)[key],
				nextSeen,
			)
		) {
			return false;
		}
	}

	return true;
}

export function createWatchSnapshotBaseline<T>(
	value: T,
	snapshotDepth: number,
): WatchSnapshotBaseline<T> {
	return {
		snapshot: createSnapshot(value, snapshotDepth),
		value,
	};
}

export function hasWatchSnapshotChanged<T>(
	value: T,
	baseline: WatchSnapshotBaseline<T>,
	snapshotDepth: number,
): boolean {
	if (!Object.is(value, baseline.value)) {
		return true;
	}
	if (snapshotDepth <= 0) {
		return false;
	}
	return !areSnapshotsEqual(
		createSnapshot(value, snapshotDepth),
		baseline.snapshot,
	);
}
