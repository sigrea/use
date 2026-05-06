import {
	computed,
	disposeTrackedMolecules,
	readonly,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useOffsetPagination } from "./index";

describe("useOffsetPagination", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("creates page signals from value options", () => {
		const pagination = useOffsetPagination({
			page: 1,
			pageSize: 10,
			total: 40,
		});

		expect(pagination.currentPage.value).toBe(1);
		expect(pagination.currentPageSize.value).toBe(10);
		expect(pagination.pageCount.value).toBe(4);
		expect(pagination.isFirstPage.value).toBe(true);
		expect(pagination.isLastPage.value).toBe(false);

		pagination.stop();
	});

	it("navigates within the available page range", () => {
		const pagination = useOffsetPagination({
			page: 1,
			pageSize: 10,
			total: 40,
		});

		pagination.prev();
		expect(pagination.currentPage.value).toBe(1);

		pagination.next();
		pagination.next();
		expect(pagination.currentPage.value).toBe(3);

		pagination.next();
		pagination.next();
		expect(pagination.currentPage.value).toBe(4);
		expect(pagination.isLastPage.value).toBe(true);

		pagination.stop();
	});

	it("clamps page and page size inputs", () => {
		const pagination = useOffsetPagination({
			page: 999,
			pageSize: 0,
			total: 40,
		});

		expect(pagination.currentPageSize.value).toBe(1);
		expect(pagination.pageCount.value).toBe(40);
		expect(pagination.currentPage.value).toBe(40);

		pagination.currentPage.value = -10;
		expect(pagination.currentPage.value).toBe(1);

		pagination.stop();
	});

	it("syncs writable page and page size signals both ways", () => {
		const page = signal(2);
		const pageSize = signal(10);
		const pagination = useOffsetPagination({
			page,
			pageSize,
			total: 40,
		});

		expect(pagination.currentPage.value).toBe(2);
		expect(pagination.currentPageSize.value).toBe(10);

		page.value = 3;
		expect(pagination.currentPage.value).toBe(3);

		pagination.currentPage.value = 4;
		expect(page.value).toBe(4);

		pageSize.value = 20;
		expect(pagination.currentPageSize.value).toBe(20);
		expect(pagination.currentPage.value).toBe(2);
		expect(page.value).toBe(2);

		pagination.currentPageSize.value = 5;
		expect(pageSize.value).toBe(5);
		expect(pagination.pageCount.value).toBe(8);

		pagination.stop();
	});

	it("writes initial clamps back to writable sources", () => {
		const page = signal(999);
		const pageSize = signal(0);
		const pagination = useOffsetPagination({
			page,
			pageSize,
			total: 40,
		});

		expect(pagination.currentPage.value).toBe(40);
		expect(pagination.currentPageSize.value).toBe(1);
		expect(page.value).toBe(40);
		expect(pageSize.value).toBe(1);

		pagination.stop();
	});

	it("uses readonly page sources as one-way inputs", () => {
		const page = signal(2);
		const pageSize = signal(10);
		const pagination = useOffsetPagination({
			page: readonly(page),
			pageSize: readonly(pageSize),
			total: 40,
		});

		page.value = 3;
		expect(pagination.currentPage.value).toBe(3);

		pagination.currentPage.value = 4;
		expect(page.value).toBe(3);

		pageSize.value = 20;
		expect(pagination.currentPageSize.value).toBe(20);

		pagination.currentPageSize.value = 5;
		expect(pageSize.value).toBe(20);

		pagination.stop();
	});

	it("reclamps readonly page sources against the latest page count", () => {
		const page = signal(10);
		const total = signal(100);
		const pagination = useOffsetPagination({
			page: readonly(page),
			pageSize: 10,
			total,
		});

		expect(pagination.currentPage.value).toBe(10);

		total.value = 50;
		expect(pagination.currentPage.value).toBe(5);

		total.value = 100;
		expect(pagination.currentPage.value).toBe(10);

		pagination.stop();
	});

	it("reacts to total changes and clamps the current page", () => {
		const total = signal(100);
		const pagination = useOffsetPagination({
			page: 10,
			pageSize: 10,
			total,
		});

		expect(pagination.currentPage.value).toBe(10);

		total.value = 25;
		expect(pagination.pageCount.value).toBe(3);
		expect(pagination.currentPage.value).toBe(3);

		total.value = 0;
		expect(pagination.pageCount.value).toBe(1);
		expect(pagination.currentPage.value).toBe(1);

		pagination.stop();
	});

	it("supports infinite totals", () => {
		const pagination = useOffsetPagination();

		expect(pagination.pageCount.value).toBe(Number.POSITIVE_INFINITY);
		expect(pagination.isLastPage.value).toBe(false);

		pagination.currentPage.value = 100;
		expect(pagination.currentPage.value).toBe(100);
		expect(pagination.isLastPage.value).toBe(false);

		pagination.currentPage.value = Number.POSITIVE_INFINITY;
		expect(pagination.currentPage.value).toBe(Number.POSITIVE_INFINITY);
		expect(pagination.isLastPage.value).toBe(false);

		pagination.stop();
	});

	it("calls change callbacks with plain values", () => {
		const page = signal(1);
		const pageSize = signal(10);
		const total = signal(40);
		const onPageChange = vi.fn();
		const onPageSizeChange = vi.fn();
		const onPageCountChange = vi.fn();
		const pagination = useOffsetPagination({
			onPageChange,
			onPageCountChange,
			onPageSizeChange,
			page,
			pageSize,
			total,
		});

		page.value = 2;
		expect(onPageChange).toHaveBeenCalledWith({
			currentPage: 2,
			currentPageSize: 10,
			isFirstPage: false,
			isLastPage: false,
			next: expect.any(Function),
			pageCount: 4,
			prev: expect.any(Function),
		});

		pageSize.value = 20;
		expect(onPageSizeChange).toHaveBeenCalledWith({
			currentPage: 2,
			currentPageSize: 20,
			isFirstPage: false,
			isLastPage: true,
			next: expect.any(Function),
			pageCount: 2,
			prev: expect.any(Function),
		});
		expect(onPageCountChange).toHaveBeenCalledWith({
			currentPage: 2,
			currentPageSize: 20,
			isFirstPage: false,
			isLastPage: true,
			next: expect.any(Function),
			pageCount: 2,
			prev: expect.any(Function),
		});

		total.value = 10;
		expect(onPageCountChange).toHaveBeenLastCalledWith({
			currentPage: 1,
			currentPageSize: 20,
			isFirstPage: true,
			isLastPage: true,
			next: expect.any(Function),
			pageCount: 1,
			prev: expect.any(Function),
		});

		pagination.stop();
	});

	it("stops watching external sources", () => {
		const page = signal(1);
		const pagination = useOffsetPagination({
			page,
			total: 40,
		});

		pagination.stop();
		page.value = 2;

		expect(pagination.currentPage.value).toBe(1);
	});

	it("accepts computed sources", () => {
		const page = signal(1);
		const multiplier = signal(10);
		const pagination = useOffsetPagination({
			page: computed(() => page.value + 1),
			pageSize: computed(() => multiplier.value),
			total: 40,
		});

		expect(pagination.currentPage.value).toBe(2);
		expect(pagination.currentPageSize.value).toBe(10);

		page.value = 2;
		expect(pagination.currentPage.value).toBe(3);

		multiplier.value = 20;
		expect(pagination.currentPage.value).toBe(2);
		expect(pagination.currentPageSize.value).toBe(20);

		pagination.stop();
	});
});
