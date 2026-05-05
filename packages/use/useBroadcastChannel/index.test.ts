import { signal } from "@sigrea/core";
import { describe, expect, it } from "vitest";

import type {
	BroadcastChannelLike,
	BroadcastChannelWindowLike,
} from "../types";
import { useBroadcastChannel } from "./index";

class FakeBroadcastChannel extends EventTarget implements BroadcastChannelLike {
	static instances: FakeBroadcastChannel[] = [];

	closed = false;
	messages: unknown[] = [];

	constructor(readonly name: string) {
		super();
		FakeBroadcastChannel.instances.push(this);
	}

	close(): void {
		this.closed = true;
	}

	postMessage(message: unknown): void {
		this.messages.push(message);
	}

	dispatchMessage(data: unknown): void {
		this.dispatchEvent(new MessageEvent("message", { data }));
	}
}

function createWindow(): BroadcastChannelWindowLike {
	return {
		BroadcastChannel: FakeBroadcastChannel,
	} as unknown as BroadcastChannelWindowLike;
}

describe("useBroadcastChannel", () => {
	it("uses fallback values without BroadcastChannel support", () => {
		const result = useBroadcastChannel<string, string>({
			name: "fallback",
			window: null,
		});

		expect(result.isSupported.value).toBe(false);
		expect(result.isClosed.value).toBe(true);
		expect(result.channel.value).toBeUndefined();
		expect(result.data.value).toBeUndefined();
		expect(result.error.value).toBeNull();

		result.postMessage("hello");
		result.close();
		result.stop();
	});

	it("opens a channel and posts messages", () => {
		FakeBroadcastChannel.instances = [];
		const result = useBroadcastChannel<string, string>({
			name: "sigrea",
			window: createWindow(),
		});
		const channel = result.channel.value as FakeBroadcastChannel;

		expect(result.isSupported.value).toBe(true);
		expect(result.isClosed.value).toBe(false);
		expect(channel.name).toBe("sigrea");

		result.postMessage("hello");
		expect(channel.messages).toEqual(["hello"]);

		channel.dispatchMessage("ready");
		expect(result.data.value).toBe("ready");
		result.stop();
	});

	it("stores messageerror events", () => {
		const result = useBroadcastChannel({
			name: "sigrea",
			window: createWindow(),
		});
		const channel = result.channel.value as FakeBroadcastChannel;
		const event = new MessageEvent("messageerror", { data: "bad" });

		channel.dispatchEvent(event);

		expect(result.error.value).toBe(event);
		result.stop();
	});

	it("closes the current channel", () => {
		const result = useBroadcastChannel({
			name: "sigrea",
			window: createWindow(),
		});
		const channel = result.channel.value as FakeBroadcastChannel;

		result.close();

		expect(channel.closed).toBe(true);
		expect(result.isClosed.value).toBe(true);
		expect(result.channel.value).toBeUndefined();
	});

	it("does not reopen after close", () => {
		FakeBroadcastChannel.instances = [];
		const name = signal("first");
		const result = useBroadcastChannel({
			name,
			window: createWindow(),
		});
		const first = result.channel.value as FakeBroadcastChannel;

		result.close();
		name.value = "second";

		expect(first.closed).toBe(true);
		expect(result.channel.value).toBeUndefined();
		expect(FakeBroadcastChannel.instances).toHaveLength(1);
		result.stop();
	});

	it("reopens the channel when the name changes", () => {
		FakeBroadcastChannel.instances = [];
		const name = signal("first");
		const result = useBroadcastChannel<string, string>({
			name,
			window: createWindow(),
		});
		const first = result.channel.value as FakeBroadcastChannel;

		name.value = "second";
		const second = result.channel.value as FakeBroadcastChannel;

		expect(first.closed).toBe(true);
		expect(second).not.toBe(first);
		expect(second.name).toBe("second");

		first.dispatchMessage("old");
		expect(result.data.value).toBeUndefined();

		second.dispatchMessage("new");
		expect(result.data.value).toBe("new");
		result.stop();
	});

	it("reacts to window support changes", () => {
		const windowTarget = signal<BroadcastChannelWindowLike | undefined>(
			undefined,
		);
		const result = useBroadcastChannel({
			name: "sigrea",
			window: windowTarget,
		});

		expect(result.isSupported.value).toBe(false);
		expect(result.channel.value).toBeUndefined();

		windowTarget.value = createWindow();
		expect(result.isSupported.value).toBe(true);
		expect(result.channel.value).toBeInstanceOf(FakeBroadcastChannel);

		windowTarget.value = undefined;
		expect(result.isSupported.value).toBe(false);
		expect(result.channel.value).toBeUndefined();
		result.stop();
	});

	it("stops watching and closes the channel", () => {
		const name = signal("first");
		const result = useBroadcastChannel({
			name,
			window: createWindow(),
		});
		const first = result.channel.value as FakeBroadcastChannel;

		result.stop();
		name.value = "second";

		expect(first.closed).toBe(true);
		expect(result.channel.value).toBeUndefined();
		expect(result.isClosed.value).toBe(true);
	});
});
