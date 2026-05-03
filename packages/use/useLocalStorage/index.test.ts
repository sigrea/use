import { describe, expect, it } from "vitest";

import type { StorageLike, StorageWindowLike } from "../types";
import { useLocalStorage } from "./index";

class FakeStorage implements StorageLike {
	readonly data = new Map<string, string>();

	getItem(key: string): string | null {
		return this.data.get(key) ?? null;
	}

	setItem(key: string, value: string): void {
		this.data.set(key, value);
	}

	removeItem(key: string): void {
		this.data.delete(key);
	}
}

class FakeWindow extends EventTarget implements StorageWindowLike {
	readonly localStorage = new FakeStorage();
	readonly sessionStorage = new FakeStorage();
}

describe("useLocalStorage", () => {
	it("uses localStorage from the configured window", () => {
		const windowTarget = new FakeWindow();
		const stored = useLocalStorage("local-key", "fallback", {
			window: windowTarget,
		});

		expect(stored.value).toBe("fallback");
		expect(windowTarget.localStorage.data.get("local-key")).toBe("fallback");
		expect(windowTarget.sessionStorage.data.has("local-key")).toBe(false);

		stored.value = "next";
		expect(windowTarget.localStorage.data.get("local-key")).toBe("next");

		stored.stop();
	});

	it("falls back when no storage is available", () => {
		const stored = useLocalStorage("local-key", "fallback", {
			window: undefined,
		});

		expect(stored.value).toBe("fallback");

		stored.remove();
		expect(stored.value).toBe(null);

		stored.stop();
	});
});
