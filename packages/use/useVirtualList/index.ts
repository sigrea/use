import { computed, readonly, signal, watch } from "@sigrea/core";

import { listen, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseVirtualListItem,
	UseVirtualListItemSize,
	UseVirtualListOptions,
	UseVirtualListReturn,
} from "../types";
import { useElementSize } from "../useElementSize";

type VirtualListElement = HTMLElement & {
	clientHeight: number;
	clientWidth: number;
	scrollLeft: number;
	scrollTop: number;
};

interface VirtualListState {
	readonly start: number;
	readonly end: number;
}

const defaultOverscan = 5;

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

function clampOverscan(value: number | undefined): number {
	return Math.max(0, Math.floor(value ?? defaultOverscan));
}

function getItemSize(size: UseVirtualListItemSize, index: number): number {
	const itemSize = typeof size === "number" ? size : size(index);

	return Number.isFinite(itemSize) ? Math.max(0, itemSize) : 0;
}

function getDistance(
	size: UseVirtualListItemSize,
	source: readonly unknown[],
	index: number,
): number {
	const targetIndex = clamp(Math.floor(index), 0, source.length);
	if (typeof size === "number") {
		return targetIndex * Math.max(0, size);
	}

	let distance = 0;
	for (let currentIndex = 0; currentIndex < targetIndex; currentIndex += 1) {
		distance += getItemSize(size, currentIndex);
	}

	return distance;
}

function getTotalSize(
	size: UseVirtualListItemSize,
	source: readonly unknown[],
): number {
	return getDistance(size, source, source.length);
}

function getStartIndex(
	size: UseVirtualListItemSize,
	source: readonly unknown[],
	scrollPosition: number,
): number {
	if (source.length === 0) {
		return 0;
	}

	if (typeof size === "number") {
		return size <= 0
			? 0
			: clamp(Math.floor(scrollPosition / size), 0, source.length - 1);
	}

	let distance = 0;
	for (let index = 0; index < source.length; index += 1) {
		distance += getItemSize(size, index);
		if (distance > scrollPosition) {
			return index;
		}
	}

	return source.length - 1;
}

function getEndIndex(
	size: UseVirtualListItemSize,
	source: readonly unknown[],
	scrollEnd: number,
): number {
	if (source.length === 0 || scrollEnd <= 0) {
		return 0;
	}

	if (typeof size === "number") {
		return size <= 0
			? source.length
			: clamp(Math.ceil(scrollEnd / size), 0, source.length);
	}

	let distance = 0;
	for (let index = 0; index < source.length; index += 1) {
		distance += getItemSize(size, index);
		if (distance >= scrollEnd) {
			return index + 1;
		}
	}

	return source.length;
}

function toVirtualItems<T>(
	source: readonly T[],
	state: VirtualListState,
): readonly UseVirtualListItem<T>[] {
	return source.slice(state.start, state.end).map((data, index) => ({
		data,
		index: state.start + index,
	}));
}

/**
 * Reactive virtual list range calculation.
 */
export function useVirtualList<T>(
	source: MaybeValue<readonly T[]>,
	options: UseVirtualListOptions,
): UseVirtualListReturn<T> {
	const isVertical = "itemHeight" in options;
	const itemSize: UseVirtualListItemSize = isVertical
		? (options.itemHeight as UseVirtualListItemSize)
		: (options.itemWidth as UseVirtualListItemSize);
	const overscan = clampOverscan(options.overscan);
	const containerRef = signal<HTMLElement | null>(null);
	const state = signal<VirtualListState>({ start: 0, end: 0 });
	const currentList = signal<readonly UseVirtualListItem<T>[]>([]);
	const totalSize = signal(0);
	const offset = signal(0);
	const containerStyle = isVertical ? "overflow-y: auto;" : "overflow-x: auto;";
	const wrapperStyle = computed(() => {
		const remainingSize = Math.max(0, totalSize.value - offset.value);

		return isVertical
			? `width: 100%; height: ${remainingSize}px; margin-top: ${offset.value}px;`
			: `height: 100%; width: ${remainingSize}px; margin-left: ${offset.value}px; display: flex;`;
	});
	const size = useElementSize(
		containerRef,
		{ width: 0, height: 0 },
		{ window: options.window },
	);
	let stopped = false;

	const currentElement = () => containerRef.value as VirtualListElement | null;
	const measure = () => {
		if (stopped) {
			return;
		}

		const element = currentElement();
		const list = resolveValue(source);
		if (element === null || list.length === 0) {
			state.value = { start: 0, end: 0 };
			currentList.value = [];
			totalSize.value = getTotalSize(itemSize, list);
			offset.value = 0;
			return;
		}

		const scrollPosition = isVertical ? element.scrollTop : element.scrollLeft;
		const containerSize = isVertical
			? element.clientHeight
			: element.clientWidth;
		const firstVisible = getStartIndex(itemSize, list, scrollPosition);
		const visibleEnd = getEndIndex(
			itemSize,
			list,
			scrollPosition + containerSize,
		);
		const start = Math.max(0, firstVisible - overscan);
		const end = Math.min(list.length, visibleEnd + overscan);

		state.value = { start, end };
		currentList.value = toVirtualItems(list, state.value);
		totalSize.value = getTotalSize(itemSize, list);
		offset.value = getDistance(itemSize, list, state.value.start);
	};
	const onScroll = (_event?: Event) => {
		measure();
	};
	const scrollTo = (index: number) => {
		if (stopped) {
			return;
		}

		const element = currentElement();
		const list = resolveValue(source);
		if (element === null || list.length === 0) {
			return;
		}

		const targetIndex = clamp(Math.floor(index), 0, list.length - 1);
		const distance = getDistance(itemSize, list, targetIndex);
		if (isVertical) {
			element.scrollTop = distance;
		} else {
			element.scrollLeft = distance;
		}
		measure();
	};

	const stopScrollWatch = watch(
		() => containerRef.value,
		(element, _previous, onCleanup) => {
			measure();
			if (element === null) {
				return;
			}

			const stopListening = listen(element, "scroll", onScroll, {
				passive: true,
			});

			onCleanup(stopListening);
		},
		{ immediate: true, flush: "sync" },
	);
	const stopSizeWatch = watch(
		() => [size.width.value, size.height.value] as const,
		measure,
		{ flush: "sync" },
	);
	const stopSourceWatch = watch(() => resolveValue(source), measure, {
		deep: true,
		flush: "sync",
	});
	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopScrollWatch();
		stopSizeWatch();
		stopSourceWatch();
		size.stop();
	};

	tryOnScopeDispose(stop);

	return {
		list: readonly(currentList),
		containerRef,
		containerStyle,
		wrapperStyle,
		onScroll,
		scrollTo,
		measure,
		stop,
	};
}
