import {
	createScope,
	disposeScope,
	disposeTrackedMolecules,
	runWithScope,
	signal,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
	SpeechSynthesisErrorCode,
	SpeechSynthesisErrorEventLike,
	SpeechSynthesisEventLike,
	SpeechSynthesisLike,
	SpeechSynthesisUtteranceConstructorLike,
	SpeechSynthesisUtteranceLike,
	SpeechSynthesisVoiceLike,
	UseSpeechSynthesisWindowLike,
} from "../types";
import { useSpeechSynthesis } from "./index";

class FakeSpeechSynthesisUtterance
	extends EventTarget
	implements SpeechSynthesisUtteranceLike<FakeSpeechSynthesisVoice>
{
	static instances: FakeSpeechSynthesisUtterance[] = [];
	static thrownError: unknown;

	lang = "";
	pitch = 1;
	rate = 1;
	text = "";
	voice: FakeSpeechSynthesisVoice | null = null;
	volume = 1;

	constructor(text = "") {
		super();

		if (FakeSpeechSynthesisUtterance.thrownError !== undefined) {
			throw FakeSpeechSynthesisUtterance.thrownError;
		}

		this.text = text;
		FakeSpeechSynthesisUtterance.instances.push(this);
	}
}

interface FakeSpeechSynthesisVoice extends SpeechSynthesisVoiceLike {
	readonly id: string;
}

class FakeSpeechSynthesis
	extends EventTarget
	implements
		SpeechSynthesisLike<FakeSpeechSynthesisVoice, FakeSpeechSynthesisUtterance>
{
	cancelError: unknown;
	getVoicesError: unknown;
	pauseError: unknown;
	resumeError: unknown;
	speakError: unknown;
	startSynchronously = true;
	paused = false;
	pending = false;
	speaking = false;
	lastUtterance: FakeSpeechSynthesisUtterance | undefined;
	voices: FakeSpeechSynthesisVoice[] = [];
	cancel = vi.fn(() => {
		if (this.cancelError !== undefined) {
			throw this.cancelError;
		}

		this.speaking = false;
		this.pending = false;
		this.paused = false;
		this.lastUtterance?.dispatchEvent(new Event("end"));
	});
	getVoices = vi.fn(() => {
		if (this.getVoicesError !== undefined) {
			throw this.getVoicesError;
		}

		return this.voices;
	});
	pause = vi.fn(() => {
		if (this.pauseError !== undefined) {
			throw this.pauseError;
		}

		this.paused = true;
		if (this.speaking) {
			this.speaking = false;
			this.lastUtterance?.dispatchEvent(new Event("pause"));
		}
	});
	resume = vi.fn(() => {
		if (this.resumeError !== undefined) {
			throw this.resumeError;
		}

		this.paused = false;
		if (this.pending) {
			this.dispatchStart();
		} else if (this.lastUtterance !== undefined) {
			this.speaking = true;
			this.lastUtterance.dispatchEvent(new Event("resume"));
		}
	});
	speak = vi.fn((utterance: FakeSpeechSynthesisUtterance) => {
		if (this.speakError !== undefined) {
			throw this.speakError;
		}

		this.lastUtterance = utterance;
		this.pending = true;
		if (this.startSynchronously) {
			this.dispatchStart();
		}
	});

	dispatchStart(): void {
		if (this.lastUtterance === undefined) {
			return;
		}

		this.pending = false;
		this.speaking = true;
		this.lastUtterance.dispatchEvent(new Event("start"));
	}
}

class FakeSpeechSynthesisBoundaryEvent
	extends Event
	implements SpeechSynthesisEventLike<FakeSpeechSynthesisUtterance>
{
	readonly charIndex = 1;
	readonly charLength = 5;
	readonly elapsedTime = 0.5;
	readonly name = "word";

	constructor(readonly utterance: FakeSpeechSynthesisUtterance) {
		super("boundary");
	}
}

class FakeSpeechSynthesisErrorEvent
	extends Event
	implements SpeechSynthesisErrorEventLike<FakeSpeechSynthesisUtterance>
{
	readonly charIndex = 1;
	readonly charLength = 5;
	readonly elapsedTime = 0.5;
	readonly error: SpeechSynthesisErrorCode = "network";
	readonly name = "word";

	constructor(readonly utterance: FakeSpeechSynthesisUtterance) {
		super("error");
	}
}

function createVoice(id: string, lang: string): FakeSpeechSynthesisVoice {
	return {
		default: false,
		id,
		lang,
		localService: true,
		name: id,
		voiceURI: `voice:${id}`,
	};
}

function createWindow(
	synthesis = new FakeSpeechSynthesis(),
): UseSpeechSynthesisWindowLike<
	FakeSpeechSynthesisVoice,
	FakeSpeechSynthesisUtterance,
	FakeSpeechSynthesis
> {
	return Object.assign(new EventTarget(), {
		SpeechSynthesisUtterance:
			FakeSpeechSynthesisUtterance as SpeechSynthesisUtteranceConstructorLike<
				FakeSpeechSynthesisVoice,
				FakeSpeechSynthesisUtterance
			>,
		speechSynthesis: synthesis,
	}) as UseSpeechSynthesisWindowLike<
		FakeSpeechSynthesisVoice,
		FakeSpeechSynthesisUtterance,
		FakeSpeechSynthesis
	>;
}

function latestUtterance(): FakeSpeechSynthesisUtterance {
	const utterance = FakeSpeechSynthesisUtterance.instances.at(-1);
	if (utterance === undefined) {
		throw new Error("SpeechSynthesisUtterance was not created");
	}

	return utterance;
}

describe("useSpeechSynthesis", () => {
	afterEach(() => {
		FakeSpeechSynthesisUtterance.instances = [];
		FakeSpeechSynthesisUtterance.thrownError = undefined;
		disposeTrackedMolecules();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("does not use the default window when window is null", () => {
		const originalSpeechSynthesis = window.speechSynthesis;
		const originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
		Object.defineProperty(window, "speechSynthesis", {
			configurable: true,
			value: new FakeSpeechSynthesis(),
		});
		Object.defineProperty(window, "SpeechSynthesisUtterance", {
			configurable: true,
			value: FakeSpeechSynthesisUtterance,
		});

		try {
			const speech = useSpeechSynthesis("hello", { window: null });

			expect(speech.isSupported.value).toBe(false);
			expect(speech.isPlaying.value).toBe(false);
			expect(speech.status.value).toBe("init");
			expect(speech.utterance.value).toBeUndefined();
			expect(speech.voices.value).toEqual([]);
			expect(speech.error.value).toBeNull();

			speech.speak();

			expect(FakeSpeechSynthesisUtterance.instances).toHaveLength(0);
		} finally {
			Object.defineProperty(window, "speechSynthesis", {
				configurable: true,
				value: originalSpeechSynthesis,
			});
			Object.defineProperty(window, "SpeechSynthesisUtterance", {
				configurable: true,
				value: originalSpeechSynthesisUtterance,
			});
		}
	});

	it("uses the default window when window is undefined", () => {
		const synthesis = new FakeSpeechSynthesis();
		const originalSpeechSynthesis = window.speechSynthesis;
		const originalSpeechSynthesisUtterance = window.SpeechSynthesisUtterance;
		Object.defineProperty(window, "speechSynthesis", {
			configurable: true,
			value: synthesis,
		});
		Object.defineProperty(window, "SpeechSynthesisUtterance", {
			configurable: true,
			value: FakeSpeechSynthesisUtterance,
		});

		try {
			const speech = useSpeechSynthesis("hello", { window: undefined });

			expect(speech.isSupported.value).toBe(true);
			expect(speech.utterance.value).toBeInstanceOf(
				FakeSpeechSynthesisUtterance,
			);
		} finally {
			Object.defineProperty(window, "speechSynthesis", {
				configurable: true,
				value: originalSpeechSynthesis,
			});
			Object.defineProperty(window, "SpeechSynthesisUtterance", {
				configurable: true,
				value: originalSpeechSynthesisUtterance,
			});
		}
	});

	it("requires speechSynthesis and SpeechSynthesisUtterance support", () => {
		const synthesisOnly = Object.assign(new EventTarget(), {
			speechSynthesis: new FakeSpeechSynthesis(),
		}) as UseSpeechSynthesisWindowLike<
			FakeSpeechSynthesisVoice,
			FakeSpeechSynthesisUtterance,
			FakeSpeechSynthesis
		>;
		const constructorOnly = Object.assign(new EventTarget(), {
			SpeechSynthesisUtterance: FakeSpeechSynthesisUtterance,
		}) as UseSpeechSynthesisWindowLike<
			FakeSpeechSynthesisVoice,
			FakeSpeechSynthesisUtterance,
			FakeSpeechSynthesis
		>;

		expect(
			useSpeechSynthesis("hello", { window: synthesisOnly }).isSupported.value,
		).toBe(false);
		expect(
			useSpeechSynthesis("hello", { window: constructorOnly }).isSupported
				.value,
		).toBe(false);
	});

	it("configures and controls the native synthesis", () => {
		const synthesis = new FakeSpeechSynthesis();
		const voice = createVoice("alex", "en-US");
		const speech = useSpeechSynthesis("hello", {
			lang: "ja-JP",
			pitch: 1.5,
			rate: 0.8,
			voice,
			volume: 0.6,
			window: createWindow(synthesis),
		});

		speech.speak();
		const utterance = latestUtterance();

		expect(utterance.text).toBe("hello");
		expect(utterance.lang).toBe("ja-JP");
		expect(utterance.pitch).toBe(1.5);
		expect(utterance.rate).toBe(0.8);
		expect(utterance.voice).toBe(voice);
		expect(utterance.volume).toBe(0.6);
		expect(synthesis.cancel).toHaveBeenCalledOnce();
		expect(synthesis.resume).toHaveBeenCalledOnce();
		expect(synthesis.speak).toHaveBeenCalledWith(utterance);
		expect(speech.isPlaying.value).toBe(true);
		expect(speech.status.value).toBe("play");

		speech.pause();
		expect(synthesis.pause).toHaveBeenCalledOnce();
		expect(speech.status.value).toBe("pause");

		speech.toggle(true);
		expect(synthesis.resume).toHaveBeenCalledTimes(2);
		expect(speech.status.value).toBe("play");

		speech.stop();
		expect(synthesis.cancel).toHaveBeenCalledTimes(2);
		expect(speech.isPlaying.value).toBe(false);
		expect(speech.status.value).toBe("end");
	});

	it("allows pausing a queued utterance before start", () => {
		const synthesis = new FakeSpeechSynthesis();
		synthesis.startSynchronously = false;
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(synthesis),
		});

		speech.speak();

		expect(speech.status.value).toBe("init");
		expect(speech.isPlaying.value).toBe(false);

		speech.pause();

		expect(synthesis.pause).toHaveBeenCalledOnce();
		expect(speech.status.value).toBe("pause");
		expect(speech.isPlaying.value).toBe(false);

		synthesis.dispatchStart();

		expect(speech.status.value).toBe("pause");
		expect(speech.isPlaying.value).toBe(false);

		speech.resume();

		expect(synthesis.resume).toHaveBeenCalledTimes(2);
		expect(speech.status.value).toBe("play");
		expect(speech.isPlaying.value).toBe(true);
	});

	it("allows toggle(false) while an utterance is queued before start", () => {
		const synthesis = new FakeSpeechSynthesis();
		synthesis.startSynchronously = false;
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(synthesis),
		});

		speech.speak();
		speech.toggle(false);

		expect(synthesis.pause).toHaveBeenCalledOnce();
		expect(speech.status.value).toBe("pause");

		synthesis.dispatchStart();

		expect(speech.status.value).toBe("pause");
	});

	it("ignores delayed start after canceling a queued utterance", () => {
		const synthesis = new FakeSpeechSynthesis();
		synthesis.startSynchronously = false;
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(synthesis),
		});

		speech.speak();
		speech.cancel();
		synthesis.dispatchStart();

		expect(speech.status.value).toBe("end");
		expect(speech.isPlaying.value).toBe(false);
	});

	it("keeps the queued utterance when reactive values change before start", () => {
		const synthesis = new FakeSpeechSynthesis();
		synthesis.startSynchronously = false;
		const text = signal("first");
		const lang = signal("en-US");
		const speech = useSpeechSynthesis(text, {
			lang,
			window: createWindow(synthesis),
		});

		speech.speak();
		const queuedUtterance = speech.utterance.value;
		text.value = "second";
		lang.value = "ja-JP";

		expect(speech.utterance.value).toBe(queuedUtterance);
		expect(queuedUtterance?.text).toBe("first");
		expect(queuedUtterance?.lang).toBe("en-US");

		synthesis.dispatchStart();

		expect(speech.status.value).toBe("play");
	});

	it("recreates utterances from reactive values before speaking", () => {
		const text = signal("first");
		const lang = signal("en-US");
		const speech = useSpeechSynthesis(text, {
			lang,
			window: createWindow(),
		});
		const initialUtterance = speech.utterance.value;

		text.value = "second";
		lang.value = "ja-JP";
		const idleUtterance = speech.utterance.value;

		expect(idleUtterance).not.toBe(initialUtterance);
		expect(idleUtterance?.text).toBe("second");
		expect(idleUtterance?.lang).toBe("ja-JP");

		speech.speak();
		const playingUtterance = latestUtterance();
		text.value = "third";

		expect(playingUtterance.text).toBe("second");
		expect(speech.utterance.value).toBe(playingUtterance);

		speech.stop();
		speech.speak();

		expect(latestUtterance()).not.toBe(playingUtterance);
		expect(latestUtterance().text).toBe("third");
	});

	it("updates voices from getVoices and voiceschanged", () => {
		const synthesis = new FakeSpeechSynthesis();
		const firstVoice = createVoice("first", "en-US");
		const secondVoice = createVoice("second", "ja-JP");
		synthesis.voices = [firstVoice];
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(synthesis),
		});

		expect(speech.voices.value).toEqual([firstVoice]);

		synthesis.voices = [firstVoice, secondVoice];
		synthesis.dispatchEvent(new Event("voiceschanged"));

		expect(speech.voices.value).toEqual([firstVoice, secondVoice]);
	});

	it("handles boundary and error events", () => {
		const onBoundary = vi.fn();
		const speech = useSpeechSynthesis("hello", {
			onBoundary,
			window: createWindow(),
		});

		speech.speak();
		const utterance = latestUtterance();
		const boundaryEvent = new FakeSpeechSynthesisBoundaryEvent(utterance);
		utterance.dispatchEvent(boundaryEvent);

		expect(onBoundary).toHaveBeenCalledWith(boundaryEvent);

		const errorEvent = new FakeSpeechSynthesisErrorEvent(utterance);
		utterance.dispatchEvent(errorEvent);

		expect(speech.error.value).toBe(errorEvent);
		expect(speech.isPlaying.value).toBe(false);
		expect(speech.status.value).toBe("end");
	});

	it("ignores events from stale utterances", () => {
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(),
		});

		speech.speak();
		const firstUtterance = latestUtterance();
		speech.speak();
		const currentUtterance = latestUtterance();

		expect(currentUtterance).not.toBe(firstUtterance);
		expect(speech.status.value).toBe("play");

		firstUtterance.dispatchEvent(
			new FakeSpeechSynthesisErrorEvent(firstUtterance),
		);
		firstUtterance.dispatchEvent(new Event("pause"));

		expect(speech.error.value).toBeNull();
		expect(speech.status.value).toBe("play");
		expect(speech.utterance.value).toBe(currentUtterance);
	});

	it("recreates synthesis when a reactive window changes", () => {
		const firstSynthesis = new FakeSpeechSynthesis();
		const firstWindow = createWindow(firstSynthesis);
		const windowTarget = signal<UseSpeechSynthesisWindowLike<
			FakeSpeechSynthesisVoice,
			FakeSpeechSynthesisUtterance,
			FakeSpeechSynthesis
		> | null>(firstWindow);
		const speech = useSpeechSynthesis("hello", { window: windowTarget });
		const firstUtterance = speech.utterance.value;

		speech.speak();
		windowTarget.value = null;

		expect(firstSynthesis.cancel).toHaveBeenCalledTimes(2);
		expect(speech.isSupported.value).toBe(false);
		expect(speech.utterance.value).toBeUndefined();
		expect(speech.isPlaying.value).toBe(false);

		windowTarget.value = createWindow(new FakeSpeechSynthesis());

		expect(speech.isSupported.value).toBe(true);
		expect(speech.utterance.value).toBeInstanceOf(FakeSpeechSynthesisUtterance);
		expect(speech.utterance.value).not.toBe(firstUtterance);
	});

	it("cancels synthesis when the Sigrea scope is disposed", () => {
		const synthesis = new FakeSpeechSynthesis();
		const scope = createScope();
		let speech: ReturnType<typeof useSpeechSynthesis> | undefined;

		runWithScope(scope, () => {
			speech = useSpeechSynthesis("hello", {
				window: createWindow(synthesis),
			});
		});

		speech?.speak();
		disposeScope(scope);

		expect(synthesis.cancel).toHaveBeenCalledTimes(2);
		expect(speech?.utterance.value).toBeUndefined();
		expect(speech?.voices.value).toEqual([]);
	});

	it("stores constructor and speech errors", () => {
		const constructorError = new Error("blocked");
		FakeSpeechSynthesisUtterance.thrownError = constructorError;
		const synthesis = new FakeSpeechSynthesis();
		const speech = useSpeechSynthesis("hello", {
			window: createWindow(synthesis),
		});

		expect(speech.isSupported.value).toBe(true);
		expect(speech.utterance.value).toBeUndefined();
		expect(speech.error.value).toBe(constructorError);

		FakeSpeechSynthesisUtterance.thrownError = undefined;
		const speakError = new Error("failed");
		synthesis.speakError = speakError;
		speech.speak();

		expect(speech.error.value).toBe(speakError);
		expect(speech.isPlaying.value).toBe(false);
		expect(speech.status.value).toBe("end");
	});
});
