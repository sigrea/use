import { signal } from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseShareData, UseShareNavigatorLike } from "../types";
import { useShare } from "./index";

class FakeShareNavigator implements UseShareNavigatorLike {
	share = vi.fn(async (_data?: UseShareData) => {});
	canShare = vi.fn((_data?: UseShareData) => true);
}

describe("useShare", () => {
	afterEach(() => {
		(navigator as Partial<UseShareNavigatorLike>).canShare = undefined;
		(navigator as Partial<UseShareNavigatorLike>).share = undefined;
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("stays unsupported and callable without a navigator", async () => {
		const result = useShare({ text: "hello" }, { navigator: null });

		expect(result.isSupported.value).toBe(false);
		expect(result.canShare()).toBe(false);
		await expect(result.share()).resolves.toBeUndefined();

		result.stop();
	});

	it("uses navigator.share when the data can be shared", async () => {
		const navigator = new FakeShareNavigator();
		const result = useShare(
			{ text: "hello", title: "Greeting" },
			{ navigator },
		);

		expect(result.isSupported.value).toBe(true);
		expect(result.canShare({ url: "https://example.com" })).toBe(true);
		await result.share({ url: "https://example.com" });

		expect(navigator.canShare).toHaveBeenCalledWith({
			text: "hello",
			title: "Greeting",
			url: "https://example.com",
		});
		expect(navigator.share).toHaveBeenCalledWith({
			text: "hello",
			title: "Greeting",
			url: "https://example.com",
		});

		result.stop();
	});

	it("does not call share when canShare rejects the data", async () => {
		const navigator = new FakeShareNavigator();
		navigator.canShare.mockReturnValue(false);
		const result = useShare({ url: "file:///private" }, { navigator });

		expect(result.canShare()).toBe(false);
		await result.share();

		expect(navigator.share).not.toHaveBeenCalled();
		result.stop();
	});

	it("propagates navigator.share rejections", async () => {
		const navigator = new FakeShareNavigator();
		const error = new DOMException("Share blocked", "NotAllowedError");
		navigator.share.mockRejectedValueOnce(error);
		const result = useShare({ text: "blocked" }, { navigator });

		await expect(result.share()).rejects.toBe(error);
		expect(navigator.canShare).toHaveBeenCalledWith({ text: "blocked" });

		result.stop();
	});

	it("does not support partial Web Share implementations", async () => {
		const navigator = {
			share: vi.fn(async (_data?: UseShareData) => {}),
		} satisfies UseShareNavigatorLike;
		const result = useShare({ title: "Title" }, { navigator });

		expect(result.isSupported.value).toBe(false);
		expect(result.canShare()).toBe(false);

		await result.share();
		expect(navigator.share).not.toHaveBeenCalled();
		result.stop();
	});

	it("normalizes data and drops unknown members before canShare and share", async () => {
		const navigator = new FakeShareNavigator();
		const file = new File(["content"], "example.txt", {
			type: "text/plain",
		});
		const data = {
			files: [file],
			text: "",
			unknown: "drop",
		} as UseShareData & { unknown: string };
		const result = useShare(data, { navigator });

		await result.share({
			title: "Title",
			unknownOverride: "drop",
		} as UseShareData & { unknownOverride: string });

		expect(navigator.canShare).toHaveBeenCalledWith({
			files: [file],
			text: "",
			title: "Title",
		});
		expect(navigator.share).toHaveBeenCalledWith({
			files: [file],
			text: "",
			title: "Title",
		});
		expect(navigator.share.mock.calls[0]?.[0]?.files).not.toBe(data.files);
		result.stop();
	});

	it("uses reactive share data and navigator values", async () => {
		const first = new FakeShareNavigator();
		const second = new FakeShareNavigator();
		const data = signal<UseShareData>({ text: "first" });
		const navigator = signal<UseShareNavigatorLike | null>(first);
		const result = useShare(data, { navigator });

		await result.share();
		expect(first.share).toHaveBeenCalledWith({ text: "first" });

		data.value = { text: "second" };
		navigator.value = second;

		expect(result.isSupported.value).toBe(true);
		await result.share({ url: "https://example.com" });

		expect(second.share).toHaveBeenCalledWith({
			text: "second",
			url: "https://example.com",
		});

		navigator.value = null;
		expect(result.isSupported.value).toBe(false);
		expect(result.canShare()).toBe(false);

		result.stop();
	});

	it("uses the default navigator when no navigator option is provided", async () => {
		const share = vi.fn(async (_data?: UseShareData) => {});
		const canShare = vi.fn((_data?: UseShareData) => true);
		Object.defineProperties(navigator, {
			canShare: {
				configurable: true,
				value: canShare,
				writable: true,
			},
			share: {
				configurable: true,
				value: share,
				writable: true,
			},
		});
		const result = useShare({ text: "default" });

		expect(result.isSupported.value).toBe(true);
		await result.share();

		expect(share).toHaveBeenCalledWith({ text: "default" });
		result.stop();
	});
});
