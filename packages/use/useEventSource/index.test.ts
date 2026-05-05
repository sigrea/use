// @vitest-environment node

import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it } from "vitest";

import type {
	EventSourceLike,
	EventSourceWindowLike,
	UseEventSourceReturn,
} from "../types";
import { useEventSource } from "./index";

class FakeEventSource extends EventTarget implements EventSourceLike {
	static instances: FakeEventSource[] = [];
	static thrownError: unknown;

	readonly CONNECTING = 0 as const;
	readonly OPEN = 1 as const;
	readonly CLOSED = 2 as const;
	readonly url: string;
	readonly withCredentials: boolean;
	readyState: number = this.CONNECTING;
	closeCalls = 0;

	constructor(url: string | URL, init?: EventSourceInit) {
		super();

		if (FakeEventSource.thrownError !== undefined) {
			throw FakeEventSource.thrownError;
		}

		this.url = String(url);
		this.withCredentials = Boolean(init?.withCredentials);
		FakeEventSource.instances.push(this);
	}

	close(): void {
		this.readyState = this.CLOSED;
		this.closeCalls += 1;
	}

	emitError(readyState: number): Event {
		this.readyState = readyState;
		const event = new Event("error");
		this.dispatchEvent(event);
		return event;
	}

	emitMessage(data?: string, lastEventId = ""): void {
		this.dispatchEvent(
			new MessageEvent("message", {
				data,
				lastEventId,
			}),
		);
	}

	emitNamed(type: string, data?: string, lastEventId = ""): void {
		this.dispatchEvent(
			new MessageEvent(type, {
				data,
				lastEventId,
			}),
		);
	}

	emitOpen(): void {
		this.readyState = this.OPEN;
		this.dispatchEvent(new Event("open"));
	}
}

class FakeWindow
	extends EventTarget
	implements EventSourceWindowLike<FakeEventSource>
{
	readonly EventSource = FakeEventSource;
}

class UnsupportedWindow extends EventTarget {}

function latestSource(): FakeEventSource {
	const source = FakeEventSource.instances.at(-1);
	if (source === undefined) {
		throw new Error("EventSource was not created");
	}

	return source;
}

describe("useEventSource", () => {
	afterEach(() => {
		FakeEventSource.instances = [];
		FakeEventSource.thrownError = undefined;
		disposeTrackedMolecules();
	});

	it("does not use global EventSource when window is null", () => {
		const originalEventSource = globalThis.EventSource;
		Object.defineProperty(globalThis, "EventSource", {
			configurable: true,
			value: FakeEventSource,
		});

		try {
			const result = useEventSource("https://example.com/events", [], {
				window: null,
			});

			expect(result.isSupported.value).toBe(false);
			expect(result.status.value).toBe("CLOSED");
			expect(result.eventSource.value).toBeUndefined();
			expect(result.data.value).toBeUndefined();
			expect(result.event.value).toBeUndefined();
			expect(result.lastEventId.value).toBe("");
			expect(result.error.value).toBeNull();

			result.open();

			expect(FakeEventSource.instances).toHaveLength(0);

			result.stop();
		} finally {
			Object.defineProperty(globalThis, "EventSource", {
				configurable: true,
				value: originalEventSource,
			});
		}
	});

	it("keeps fallback values when EventSource is unsupported", () => {
		const result = useEventSource("https://example.com/events", [], {
			window: new UnsupportedWindow(),
		});

		expect(result.isSupported.value).toBe(false);
		expect(result.status.value).toBe("CLOSED");
		expect(result.eventSource.value).toBeUndefined();
		expect(FakeEventSource.instances).toHaveLength(0);

		result.stop();
	});

	it("opens immediately with credentials when supported", () => {
		const result = useEventSource("https://example.com/events", [], {
			window: new FakeWindow(),
			withCredentials: true,
		});
		const source = latestSource();

		expect(result.isSupported.value).toBe(true);
		expect(result.status.value).toBe("CONNECTING");
		expect(result.eventSource.value).toBe(source);
		expect(source.url).toBe("https://example.com/events");
		expect(source.withCredentials).toBe(true);

		result.stop();
	});

	it("waits for open when immediate is false", () => {
		const result = useEventSource("https://example.com/events", [], {
			immediate: false,
			window: new FakeWindow(),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.status.value).toBe("CLOSED");
		expect(FakeEventSource.instances).toHaveLength(0);

		result.open();

		expect(result.status.value).toBe("CONNECTING");
		expect(result.eventSource.value).toBe(latestSource());

		result.stop();
	});

	it("opens initially when autoConnect is false", () => {
		const url = signal("https://example.com/one");
		const result = useEventSource(url, [], {
			autoConnect: false,
			window: new FakeWindow(),
		});
		const first = latestSource();

		expect(first.url).toBe("https://example.com/one");

		url.value = "https://example.com/two";

		expect(FakeEventSource.instances).toHaveLength(1);
		expect(first.closeCalls).toBe(0);
		expect(result.eventSource.value).toBe(first);

		result.open();

		const second = latestSource();
		expect(FakeEventSource.instances).toHaveLength(2);
		expect(first.closeCalls).toBe(1);
		expect(second.url).toBe("https://example.com/two");

		result.stop();
	});

	it("tracks open, message, named event, serializer, and last event ID", () => {
		const result = useEventSource(
			"https://example.com/events",
			["notice", "update"] as const,
			{
				serializer: {
					read: (value) =>
						value === undefined ? undefined : { value: value.toUpperCase() },
				},
				window: new FakeWindow(),
			},
		);
		const source = latestSource();

		source.emitOpen();
		expect(result.status.value).toBe("OPEN");
		expect(result.error.value).toBeNull();

		source.emitMessage("ready", "1");
		expect(result.event.value).toBeUndefined();
		expect(result.data.value).toEqual({ value: "READY" });
		expect(result.lastEventId.value).toBe("1");

		source.emitNamed("notice", "changed", "2");
		expect(result.event.value).toBe("notice");
		expect(result.data.value).toEqual({ value: "CHANGED" });
		expect(result.lastEventId.value).toBe("2");

		source.emitNamed("ignored", "stale", "3");
		expect(result.event.value).toBe("notice");
		expect(result.data.value).toEqual({ value: "CHANGED" });
		expect(result.lastEventId.value).toBe("2");

		result.stop();
	});

	it("stores constructor errors without throwing", () => {
		const error = new Error("blocked");
		FakeEventSource.thrownError = error;

		const result = useEventSource("https://example.com/events", [], {
			window: new FakeWindow(),
		});

		expect(result.isSupported.value).toBe(true);
		expect(result.status.value).toBe("CLOSED");
		expect(result.error.value).toBe(error);
		expect(result.eventSource.value).toBeUndefined();

		result.stop();
	});

	it("reflects reconnecting and closed error states from readyState", () => {
		const result = useEventSource("https://example.com/events", [], {
			window: new FakeWindow(),
		});
		const source = latestSource();
		const reconnectingError = source.emitError(source.CONNECTING);

		expect(result.status.value).toBe("CONNECTING");
		expect(result.error.value).toBe(reconnectingError);
		expect(result.eventSource.value).toBe(source);
		expect(source.closeCalls).toBe(0);

		const closedError = source.emitError(source.CLOSED);

		expect(result.status.value).toBe("CLOSED");
		expect(result.error.value).toBe(closedError);
		expect(result.eventSource.value).toBeUndefined();
		expect(source.closeCalls).toBe(1);

		result.stop();
	});

	it("reopens on URL changes and ignores stale source events", () => {
		const url = signal<string | undefined>("https://example.com/one");
		const result = useEventSource(url, [], {
			window: new FakeWindow(),
		});
		const first = latestSource();

		first.emitMessage("one", "1");
		expect(result.data.value).toBe("one");

		url.value = "https://example.com/two";

		const second = latestSource();
		expect(second).not.toBe(first);
		expect(first.closeCalls).toBe(1);
		expect(second.url).toBe("https://example.com/two");

		first.emitMessage("stale", "stale");
		expect(result.data.value).toBe("one");
		expect(result.lastEventId.value).toBe("1");

		second.emitMessage("two", "2");
		expect(result.data.value).toBe("two");
		expect(result.lastEventId.value).toBe("2");

		url.value = undefined;

		expect(second.closeCalls).toBe(1);
		expect(result.status.value).toBe("CLOSED");
		expect(result.eventSource.value).toBeUndefined();

		result.stop();
	});

	it("does not auto-connect after manual close until open is called", () => {
		const url = signal("https://example.com/one");
		const result = useEventSource(url, [], {
			window: new FakeWindow(),
		});
		const first = latestSource();

		result.close();
		url.value = "https://example.com/two";

		expect(first.closeCalls).toBe(1);
		expect(FakeEventSource.instances).toHaveLength(1);
		expect(result.eventSource.value).toBeUndefined();

		result.open();

		const second = latestSource();
		expect(FakeEventSource.instances).toHaveLength(2);
		expect(second.url).toBe("https://example.com/two");

		result.stop();
	});

	it("closes the source and stops updates when the scope is disposed", () => {
		const scope = createScope();
		let result!: UseEventSourceReturn;

		runWithScope(scope, () => {
			result = useEventSource("https://example.com/events", [], {
				window: new FakeWindow(),
			});
		});

		const source = latestSource();
		disposeScope(scope);

		expect(source.closeCalls).toBe(1);
		expect(result.eventSource.value).toBeUndefined();

		source.emitMessage("late", "late");
		expect(result.data.value).toBeUndefined();
		expect(result.lastEventId.value).toBe("");

		result.open();
		expect(FakeEventSource.instances).toHaveLength(1);
	});
});
