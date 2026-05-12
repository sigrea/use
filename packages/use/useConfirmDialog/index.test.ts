import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useConfirmDialog } from "./index";

describe("useConfirmDialog", () => {
	afterEach(() => {
		disposeTrackedMolecules();
	});

	it("starts closed with internal state", () => {
		const dialog = useConfirmDialog();

		expect(dialog.isOpen.value).toBe(false);
	});

	it("uses a provided open state signal", () => {
		const isOpen = signal(false);
		const dialog = useConfirmDialog(isOpen);

		dialog.open();
		expect(isOpen.value).toBe(true);
		expect(dialog.isOpen.value).toBe(true);

		dialog.confirm();
		expect(isOpen.value).toBe(false);

		isOpen.value = true;
		expect(dialog.isOpen.value).toBe(true);
	});

	it("triggers onOpen with open data", () => {
		const dialog = useConfirmDialog<{ id: string }>();
		const onOpen = vi.fn();
		dialog.onOpen(onOpen);

		dialog.open({ id: "open" });

		expect(onOpen).toHaveBeenCalledWith({ id: "open" });
	});

	it("triggers onConfirm only after confirm", () => {
		const dialog = useConfirmDialog<unknown, { id: string }>();
		const onConfirm = vi.fn();
		dialog.onConfirm(onConfirm);

		dialog.open();
		expect(onConfirm).not.toHaveBeenCalled();

		dialog.confirm({ id: "confirm" });
		expect(onConfirm).toHaveBeenCalledWith({ id: "confirm" });
	});

	it("triggers onCancel only after cancel", () => {
		const dialog = useConfirmDialog<unknown, unknown, { id: string }>();
		const onCancel = vi.fn();
		dialog.onCancel(onCancel);

		dialog.open();
		expect(onCancel).not.toHaveBeenCalled();

		dialog.cancel({ id: "cancel" });
		expect(onCancel).toHaveBeenCalledWith({ id: "cancel" });
	});

	it("resolves open promises on confirm", async () => {
		const dialog = useConfirmDialog<unknown, { accepted: boolean }>();
		const result = dialog.open();

		dialog.confirm({ accepted: true });

		await expect(result).resolves.toEqual({
			data: { accepted: true },
			isCanceled: false,
		});
		expect(dialog.isOpen.value).toBe(false);
	});

	it("resolves open promises on cancel", async () => {
		const dialog = useConfirmDialog<unknown, unknown, { reason: string }>();
		const result = dialog.open();

		dialog.cancel({ reason: "dismissed" });

		await expect(result).resolves.toEqual({
			data: { reason: "dismissed" },
			isCanceled: true,
		});
		expect(dialog.isOpen.value).toBe(false);
	});

	it("allows onOpen handlers to confirm synchronously", async () => {
		const dialog = useConfirmDialog<string, { accepted: boolean }>();
		dialog.onOpen((data) => {
			if (data === "auto-confirm") {
				dialog.confirm({ accepted: true });
			}
		});

		const result = dialog.open("auto-confirm");

		await expect(result).resolves.toEqual({
			data: { accepted: true },
			isCanceled: false,
		});
		expect(dialog.isOpen.value).toBe(false);
	});

	it("allows onOpen handlers to cancel synchronously", async () => {
		const dialog = useConfirmDialog<string, unknown, { reason: string }>();
		dialog.onOpen((data) => {
			if (data === "auto-cancel") {
				dialog.cancel({ reason: "blocked" });
			}
		});

		const result = dialog.open("auto-cancel");

		await expect(result).resolves.toEqual({
			data: { reason: "blocked" },
			isCanceled: true,
		});
		expect(dialog.isOpen.value).toBe(false);
	});

	it("does not throw when confirming or canceling before open", () => {
		const dialog = useConfirmDialog<unknown, string, string>();
		const onConfirm = vi.fn();
		const onCancel = vi.fn();
		dialog.onConfirm(onConfirm);
		dialog.onCancel(onCancel);

		expect(() => dialog.confirm("ok")).not.toThrow();
		expect(() => dialog.cancel("cancel")).not.toThrow();

		expect(onConfirm).toHaveBeenCalledWith("ok");
		expect(onCancel).toHaveBeenCalledWith("cancel");
		expect(dialog.isOpen.value).toBe(false);
	});

	it("resolves the previous open as canceled when opened again", async () => {
		const dialog = useConfirmDialog<string, string, string>();
		const first = dialog.open("first");
		const second = dialog.open("second");

		await expect(first).resolves.toEqual({
			isCanceled: true,
		});

		dialog.confirm("accepted");

		await expect(second).resolves.toEqual({
			data: "accepted",
			isCanceled: false,
		});
	});

	it("settles pending promises before synchronous hook errors", async () => {
		const dialog = useConfirmDialog<unknown, string, string>();
		dialog.onConfirm(() => {
			throw new Error("confirm failed");
		});
		const confirmResult = dialog.open();

		expect(() => dialog.confirm("accepted")).toThrow("confirm failed");

		await expect(confirmResult).resolves.toEqual({
			data: "accepted",
			isCanceled: false,
		});

		dialog.onCancel(() => {
			throw new Error("cancel failed");
		});
		const cancelResult = dialog.open();

		expect(() => dialog.cancel("dismissed")).toThrow("cancel failed");

		await expect(cancelResult).resolves.toEqual({
			data: "dismissed",
			isCanceled: true,
		});
	});

	it("unsubscribes hook listeners", () => {
		const dialog = useConfirmDialog<unknown, string>();
		const onConfirm = vi.fn();
		const subscription = dialog.onConfirm(onConfirm);

		dialog.open();
		subscription.off();
		dialog.confirm("ok");

		expect(onConfirm).not.toHaveBeenCalled();
	});

	it("removes scoped hook listeners when the scope is disposed", () => {
		const dialog = useConfirmDialog<unknown, string>();
		const onConfirm = vi.fn();
		const scope = createScope();

		runWithScope(scope, () => {
			dialog.onConfirm(onConfirm);
		});

		disposeScope(scope);
		dialog.open();
		dialog.confirm("ok");

		expect(onConfirm).not.toHaveBeenCalled();
	});
});
