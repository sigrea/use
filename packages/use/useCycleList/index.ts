import { computed, signal, watch } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseCycleListOptions,
	UseCycleListReturn,
} from "../types";

function resolveList<T>(list: MaybeValue<readonly MaybeValue<T>[]>): T[] {
	return resolveValue(list).map((item) => resolveValue(item));
}

function normalizeIndex(index: number, length: number): number {
	if (length <= 0) {
		return 0;
	}

	return ((index % length) + length) % length;
}

/**
 * Cycle through a list of items.
 *
 * @param list Source array.
 * @param options Cycle options.
 */
export function useCycleList<T>(
	list: MaybeValue<readonly MaybeValue<T>[]>,
	options: UseCycleListOptions<T> = {},
): UseCycleListReturn<T> {
	const items = computed(() => resolveList(list));
	const getInitialValue = () => {
		if (options.initialValue !== undefined) {
			return resolveValue(options.initialValue);
		}

		return items.value[0];
	};
	const state = signal<T | undefined>(getInitialValue());
	const index = computed<number>({
		get() {
			const targetList = items.value;
			let currentIndex =
				options.getIndexOf?.(state.value, targetList) ??
				targetList.indexOf(state.value as T);

			if (currentIndex < 0) {
				currentIndex =
					options.fallbackIndex === undefined
						? 0
						: resolveValue(options.fallbackIndex);
			}

			return currentIndex;
		},
		set(value) {
			go(value);
		},
	});

	function go(nextIndex: number): T | undefined {
		const targetList = items.value;
		const nextValue = targetList[normalizeIndex(nextIndex, targetList.length)];
		state.value = nextValue;
		return nextValue;
	}

	function shift(delta = 1): T | undefined {
		return go(index.value + delta);
	}

	function next(delta = 1): T | undefined {
		return shift(delta);
	}

	function prev(delta = 1): T | undefined {
		return shift(-delta);
	}

	watch(
		items,
		() => {
			go(index.value);
		},
		{
			flush: "sync",
		},
	);

	return {
		go,
		index,
		next,
		prev,
		state,
	};
}
