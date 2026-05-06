import { computed, isComputed, isSignal, signal, watch } from "@sigrea/core";
import type { Signal, WatchStopHandle } from "@sigrea/core";

import { resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeValue,
	UseOffsetPaginationChangePayload,
	UseOffsetPaginationOptions,
	UseOffsetPaginationReturn,
} from "../types";

function getValueDescriptor(source: object): PropertyDescriptor | undefined {
	let current: object | null = source;

	while (current !== null) {
		const descriptor = Object.getOwnPropertyDescriptor(current, "value");
		if (descriptor !== undefined) {
			return descriptor;
		}

		current = Object.getPrototypeOf(current);
	}
}

function isWritableNumberSignal(source: unknown): source is Signal<number> {
	return (
		typeof source === "object" &&
		source !== null &&
		isSignal(source) &&
		!isComputed(source) &&
		typeof getValueDescriptor(source)?.set === "function"
	);
}

function isOneWayReactiveNumberSource(source: unknown): boolean {
	return (
		typeof source === "function" ||
		(typeof source === "object" &&
			source !== null &&
			isSignal(source) &&
			!isWritableNumberSignal(source))
	);
}

function readNumber(value: MaybeValue<number>): number {
	return resolveValue(value);
}

function normalizeTotal(total: number): number {
	if (Number.isNaN(total)) {
		return 0;
	}

	return Math.max(0, total);
}

function normalizePageSize(pageSize: number): number {
	if (Number.isNaN(pageSize) || pageSize <= 0) {
		return 1;
	}

	return pageSize;
}

function calculatePageCount(total: number, pageSize: number): number {
	const count = Math.ceil(normalizeTotal(total) / normalizePageSize(pageSize));

	if (Number.isNaN(count)) {
		return 1;
	}

	return Math.max(1, count);
}

function clampPage(page: number, pageCount: number): number {
	if (Number.isNaN(page) || page <= 1) {
		return 1;
	}
	if (page >= pageCount) {
		return pageCount;
	}

	return page;
}

export function useOffsetPagination(
	options: UseOffsetPaginationOptions = {},
): UseOffsetPaginationReturn {
	const {
		onPageChange,
		onPageCountChange,
		onPageSizeChange,
		page = 1,
		pageSize = 10,
		total = Number.POSITIVE_INFINITY,
	} = options;
	const currentPageSizeValue = signal(normalizePageSize(readNumber(pageSize)));
	const pageCount = computed(() =>
		calculatePageCount(readNumber(total), currentPageSizeValue.value),
	);
	const currentPageValue = signal(clampPage(readNumber(page), pageCount.value));
	const isFirstPage = computed(() => currentPageValue.value === 1);
	const isLastPage = computed(
		() =>
			Number.isFinite(pageCount.value) &&
			currentPageValue.value === pageCount.value,
	);
	const shouldReadPageSourceOnPageCountChange =
		isOneWayReactiveNumberSource(page);
	const stops: WatchStopHandle[] = [];
	let stopped = false;

	const payload = (): UseOffsetPaginationChangePayload => ({
		currentPage: currentPageValue.value,
		currentPageSize: currentPageSizeValue.value,
		isFirstPage: isFirstPage.value,
		isLastPage: isLastPage.value,
		next,
		pageCount: pageCount.value,
		prev,
	});
	const setPage = (pageValue: number): void => {
		const nextPage = clampPage(pageValue, pageCount.value);
		if (!Object.is(currentPageValue.value, nextPage)) {
			currentPageValue.value = nextPage;
		}
	};
	const setPageSize = (pageSizeValue: number): void => {
		const nextPageSize = normalizePageSize(pageSizeValue);
		if (!Object.is(currentPageSizeValue.value, nextPageSize)) {
			currentPageSizeValue.value = nextPageSize;
		}
		setPage(currentPageValue.value);
	};
	const setPageForCurrentPageCount = (): void => {
		setPage(
			shouldReadPageSourceOnPageCountChange
				? readNumber(page)
				: currentPageValue.value,
		);
	};
	const syncInitialWritableSources = (): void => {
		if (
			isWritableNumberSignal(pageSize) &&
			!Object.is(pageSize.value, currentPageSizeValue.value)
		) {
			pageSize.value = currentPageSizeValue.value;
		}
		if (
			isWritableNumberSignal(page) &&
			!Object.is(page.value, currentPageValue.value)
		) {
			page.value = currentPageValue.value;
		}
	};

	function prev(): void {
		setPage(currentPageValue.value - 1);
	}

	function next(): void {
		setPage(currentPageValue.value + 1);
	}

	const currentPage = computed({
		get: () => currentPageValue.value,
		set: setPage,
	});
	const currentPageSize = computed({
		get: () => currentPageSizeValue.value,
		set: setPageSize,
	});

	syncInitialWritableSources();

	stops.push(
		watch(
			() => readNumber(page),
			(nextPage) => {
				setPage(nextPage);
			},
			{ flush: "sync" },
		),
		watch(
			() => readNumber(pageSize),
			(nextPageSize) => {
				setPageSize(nextPageSize);
			},
			{ flush: "sync" },
		),
		watch(
			pageCount,
			() => {
				setPageForCurrentPageCount();
				onPageCountChange?.(payload());
			},
			{ flush: "sync" },
		),
		watch(
			currentPageValue,
			() => {
				if (isWritableNumberSignal(page)) {
					page.value = currentPageValue.value;
				}
				onPageChange?.(payload());
			},
			{ flush: "sync" },
		),
		watch(
			currentPageSizeValue,
			() => {
				if (isWritableNumberSignal(pageSize)) {
					pageSize.value = currentPageSizeValue.value;
				}
				onPageSizeChange?.(payload());
			},
			{ flush: "sync" },
		),
	);

	const stop = (): void => {
		if (stopped) {
			return;
		}

		stopped = true;
		for (const stopWatch of stops) {
			stopWatch();
		}
	};
	tryOnScopeDispose(stop);

	return {
		currentPage,
		currentPageSize,
		isFirstPage,
		isLastPage,
		next,
		pageCount,
		prev,
		stop,
	};
}
