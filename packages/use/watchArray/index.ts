import { isSignal, watch } from "@sigrea/core";
import type { WatchSource } from "@sigrea/core";

import type {
	WatchArrayCallback,
	WatchArrayOptions,
	WatchArrayReturn,
	WatchArraySource,
} from "../types";

function readSource<T>(source: WatchArraySource<T>): readonly T[] {
	if (isSignal(source)) {
		return source.value as readonly T[];
	}
	if (typeof source === "function") {
		return (source as () => readonly T[])();
	}
	return source as readonly T[];
}

function toWatchSource<T>(
	source: WatchArraySource<T>,
): WatchSource<readonly T[]> {
	return () => Array.from(readSource(source));
}

function difference<T>(
	nextList: readonly T[],
	previousList: readonly T[],
): { added: T[]; removed: T[] } {
	const previousRemains = new Array(previousList.length).fill(false);
	const added: T[] = [];

	for (const item of nextList) {
		let found = false;

		for (let index = 0; index < previousList.length; index += 1) {
			if (!previousRemains[index] && Object.is(item, previousList[index])) {
				previousRemains[index] = true;
				found = true;
				break;
			}
		}

		if (!found) {
			added.push(item);
		}
	}

	return {
		added,
		removed: previousList.filter((_, index) => !previousRemains[index]),
	};
}

/**
 * Watch an array and report added and removed items.
 */
export function watchArray<T, Immediate extends boolean = false>(
	source: WatchArraySource<T>,
	callback: WatchArrayCallback<T>,
	options: WatchArrayOptions<Immediate> = {},
): WatchArrayReturn {
	let oldList = options.immediate ? [] : [...readSource(source)];

	return watch(
		toWatchSource(source),
		(nextList, _previousList, onCleanup) => {
			const currentList = Array.from(nextList);
			const previousList = oldList;
			const { added, removed } = difference(currentList, previousList);
			const result = callback(
				currentList,
				previousList,
				added,
				removed,
				onCleanup,
			);
			oldList = currentList;

			return result;
		},
		options,
	);
}
