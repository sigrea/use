import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	SpeechRecognitionAlternativeLike,
	SpeechRecognitionConstructorLike,
	SpeechRecognitionEventLike,
	SpeechRecognitionLike,
	SpeechRecognitionResultLike,
	SpeechRecognitionResultListLike,
	UseSpeechRecognitionWindowLike,
} from "../types";
import { useSpeechRecognition } from "./index";

class FakeSpeechRecognition
	extends EventTarget
	implements SpeechRecognitionLike
{
	static instances: FakeSpeechRecognition[] = [];
	static thrownError: unknown;
	static startError: unknown;

	continuous = false;
	interimResults = false;
	lang = "";
	maxAlternatives = 1;
	start = vi.fn(() => {
		if (FakeSpeechRecognition.startError !== undefined) {
			throw FakeSpeechRecognition.startError;
		}

		this.dispatchEvent(new Event("start"));
	});
	stop = vi.fn(() => {
		this.dispatchEvent(new Event("end"));
	});
	abort = vi.fn(() => {
		this.dispatchEvent(new Event("end"));
	});

	constructor() {
		super();

		if (FakeSpeechRecognition.thrownError !== undefined) {
			throw FakeSpeechRecognition.thrownError;
		}

		FakeSpeechRecognition.instances.push(this);
	}
}

class FakeSpeechRecognitionEvent
	extends Event
	implements SpeechRecognitionEventLike
{
	constructor(
		readonly resultIndex: number,
		readonly results: SpeechRecognitionResultListLike,
	) {
		super("result");
	}
}

class FakeErrorEvent extends Event {
	readonly error = "network";
	readonly message = "Recognition failed";

	constructor() {
		super("error");
	}
}

function createResult(
	transcript: string,
	isFinal: boolean,
): SpeechRecognitionResultLike {
	const alternative: SpeechRecognitionAlternativeLike = {
		confidence: 0.9,
		transcript,
	};
	const result = [alternative] as unknown as SpeechRecognitionResultLike;

	Object.defineProperties(result, {
		isFinal: { configurable: true, value: isFinal },
		item: {
			configurable: true,
			value: (index: number) =>
				result[index] as SpeechRecognitionAlternativeLike,
		},
	});

	return result;
}

function createResultList(
	...results: SpeechRecognitionResultLike[]
): SpeechRecognitionResultListLike {
	const resultList = results as unknown as SpeechRecognitionResultListLike;

	Object.defineProperty(resultList, "item", {
		configurable: true,
		value: (index: number) => resultList[index] as SpeechRecognitionResultLike,
	});

	return resultList;
}

function createWindow(
	property:
		| "SpeechRecognition"
		| "webkitSpeechRecognition" = "SpeechRecognition",
): UseSpeechRecognitionWindowLike<FakeSpeechRecognition> {
	return Object.assign(new EventTarget(), {
		[property]:
			FakeSpeechRecognition as SpeechRecognitionConstructorLike<FakeSpeechRecognition>,
	}) as UseSpeechRecognitionWindowLike<FakeSpeechRecognition>;
}

function latestRecognition(): FakeSpeechRecognition {
	const recognition = FakeSpeechRecognition.instances.at(-1);
	if (recognition === undefined) {
		throw new Error("SpeechRecognition was not created");
	}

	return recognition;
}

describe("useSpeechRecognition", () => {
	afterEach(() => {
		FakeSpeechRecognition.instances = [];
		FakeSpeechRecognition.thrownError = undefined;
		FakeSpeechRecognition.startError = undefined;
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("does not use the default window when window is null", () => {
		const originalSpeechRecognition = (
			window as Window & UseSpeechRecognitionWindowLike<FakeSpeechRecognition>
		).SpeechRecognition;
		Object.defineProperty(window, "SpeechRecognition", {
			configurable: true,
			value: FakeSpeechRecognition,
		});

		try {
			const speech = useSpeechRecognition({ window: null });

			expect(speech.isSupported.value).toBe(false);
			expect(speech.isListening.value).toBe(false);
			expect(speech.isFinal.value).toBe(false);
			expect(speech.recognition.value).toBeUndefined();
			expect(speech.result.value).toBe("");
			expect(speech.error.value).toBeNull();

			speech.start();

			expect(FakeSpeechRecognition.instances).toHaveLength(0);
		} finally {
			Object.defineProperty(window, "SpeechRecognition", {
				configurable: true,
				value: originalSpeechRecognition,
			});
		}
	});

	it("uses the default window when window is undefined", () => {
		const originalSpeechRecognition = (
			window as Window & UseSpeechRecognitionWindowLike<FakeSpeechRecognition>
		).SpeechRecognition;
		Object.defineProperty(window, "SpeechRecognition", {
			configurable: true,
			value: FakeSpeechRecognition,
		});

		try {
			const speech = useSpeechRecognition({ window: undefined });

			expect(speech.isSupported.value).toBe(true);
			expect(speech.recognition.value).toBeInstanceOf(FakeSpeechRecognition);
		} finally {
			Object.defineProperty(window, "SpeechRecognition", {
				configurable: true,
				value: originalSpeechRecognition,
			});
		}
	});

	it("supports webkitSpeechRecognition", () => {
		const speech = useSpeechRecognition({
			window: createWindow("webkitSpeechRecognition"),
		});

		expect(speech.isSupported.value).toBe(true);
		expect(speech.recognition.value).toBeInstanceOf(FakeSpeechRecognition);
	});

	it("recreates recognition when a reactive window changes", () => {
		const firstWindow = createWindow();
		const windowTarget =
			signal<UseSpeechRecognitionWindowLike<FakeSpeechRecognition> | null>(
				firstWindow,
			);
		const speech = useSpeechRecognition({ window: windowTarget });
		const firstRecognition = latestRecognition();

		speech.start();
		windowTarget.value = null;

		expect(firstRecognition.stop).toHaveBeenCalledOnce();
		expect(speech.isSupported.value).toBe(false);
		expect(speech.recognition.value).toBeUndefined();
		expect(speech.isListening.value).toBe(false);

		windowTarget.value = createWindow("webkitSpeechRecognition");

		expect(speech.isSupported.value).toBe(true);
		expect(speech.recognition.value).toBeInstanceOf(FakeSpeechRecognition);
		expect(speech.recognition.value).not.toBe(firstRecognition);
	});

	it("configures and controls the native recognition", () => {
		const speech = useSpeechRecognition({
			continuous: false,
			interimResults: false,
			lang: "ja-JP",
			maxAlternatives: 3,
			window: createWindow(),
		});
		const recognition = latestRecognition();

		expect(recognition.continuous).toBe(false);
		expect(recognition.interimResults).toBe(false);
		expect(recognition.lang).toBe("ja-JP");
		expect(recognition.maxAlternatives).toBe(3);

		speech.start();

		expect(recognition.start).toHaveBeenCalledOnce();
		expect(speech.isListening.value).toBe(true);
		expect(speech.isFinal.value).toBe(false);

		speech.toggle(false);

		expect(recognition.stop).toHaveBeenCalledOnce();
		expect(speech.isListening.value).toBe(false);

		speech.toggle(true);
		speech.abort();

		expect(recognition.abort).toHaveBeenCalledOnce();
		expect(speech.isListening.value).toBe(false);
	});

	it("stores full recognition results", () => {
		const speech = useSpeechRecognition({ window: createWindow() });
		const recognition = latestRecognition();

		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				1,
				createResultList(
					createResult("ignored", true),
					createResult("hello", true),
				),
			),
		);

		expect(speech.result.value).toBe("ignoredhello");
		expect(speech.isFinal.value).toBe(true);
		expect(speech.error.value).toBeNull();
	});

	it("keeps previous final transcripts when resultIndex points to a later result", () => {
		const speech = useSpeechRecognition({ window: createWindow() });
		const recognition = latestRecognition();

		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				1,
				createResultList(
					createResult("fixed ", true),
					createResult("draft", false),
				),
			),
		);

		expect(speech.result.value).toBe("fixed draft");
		expect(speech.isFinal.value).toBe(false);
	});

	it("handles resultIndex equal to results length", () => {
		const speech = useSpeechRecognition({ window: createWindow() });
		const recognition = latestRecognition();

		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				2,
				createResultList(
					createResult("final ", true),
					createResult("text", true),
				),
			),
		);

		expect(speech.result.value).toBe("final text");
		expect(speech.isFinal.value).toBe(true);
	});

	it("shortens transcript when interim results are removed", () => {
		const speech = useSpeechRecognition({ window: createWindow() });
		const recognition = latestRecognition();

		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				0,
				createResultList(
					createResult("final ", true),
					createResult("interim", false),
				),
			),
		);
		expect(speech.result.value).toBe("final interim");
		expect(speech.isFinal.value).toBe(false);

		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				1,
				createResultList(createResult("final ", true)),
			),
		);

		expect(speech.result.value).toBe("final ");
		expect(speech.isFinal.value).toBe(true);
	});

	it("stores recognition errors and start errors", () => {
		const speech = useSpeechRecognition({ window: createWindow() });
		const recognition = latestRecognition();
		const event = new FakeErrorEvent();

		recognition.dispatchEvent(event);
		expect(speech.error.value).toBe(event);

		const error = new DOMException("already started", "InvalidStateError");
		FakeSpeechRecognition.startError = error;
		speech.start();

		expect(speech.error.value).toBe(error);
		expect(speech.isListening.value).toBe(false);
	});

	it("stores constructor errors", () => {
		const error = new Error("blocked");
		FakeSpeechRecognition.thrownError = error;
		const speech = useSpeechRecognition({ window: createWindow() });

		expect(speech.isSupported.value).toBe(true);
		expect(speech.recognition.value).toBeUndefined();
		expect(speech.error.value).toBe(error);
	});

	it("applies reactive language changes while stopped", () => {
		const lang = signal("en-US");
		const speech = useSpeechRecognition({
			lang,
			window: createWindow(),
		});
		const recognition = latestRecognition();

		expect(recognition.lang).toBe("en-US");

		lang.value = "ja-JP";
		expect(recognition.lang).toBe("ja-JP");

		speech.start();
		lang.value = "fr-FR";
		expect(recognition.lang).toBe("ja-JP");

		speech.stop();
		expect(recognition.lang).toBe("fr-FR");
	});

	it("stops recognition when the Sigrea scope is disposed", () => {
		const scope = createScope();
		let speech: ReturnType<typeof useSpeechRecognition> | undefined;

		runWithScope(scope, () => {
			speech = useSpeechRecognition({ window: createWindow() });
		});

		const recognition = latestRecognition();
		speech?.start();

		disposeScope(scope);

		expect(recognition.stop).toHaveBeenCalledOnce();
		expect(speech?.recognition.value).toBeUndefined();
	});

	it("ignores recognition events after scope disposal", () => {
		const scope = createScope();
		let speech: ReturnType<typeof useSpeechRecognition> | undefined;

		runWithScope(scope, () => {
			speech = useSpeechRecognition({ window: createWindow() });
		});

		const recognition = latestRecognition();
		disposeScope(scope);
		recognition.dispatchEvent(
			new FakeSpeechRecognitionEvent(
				0,
				createResultList(createResult("late", true)),
			),
		);

		expect(speech?.result.value).toBe("");
		expect(speech?.isFinal.value).toBe(false);
		expect(speech?.recognition.value).toBeUndefined();
	});
});
