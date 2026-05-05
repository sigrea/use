import {
	disposeTrackedMolecules,
	molecule,
	mountMolecule,
	signal,
	trackMolecule,
	unmountMolecule,
} from "@sigrea/core";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { UseAnimateWindowLike } from "../types";
import { useAnimate } from "./index";

class FakeAnimation extends EventTarget {
	currentTime: CSSNumberish | null = null;
	effect: AnimationEffect | null = null;
	finished: Promise<Animation>;
	id = "";
	oncancel: ((this: Animation, ev: AnimationPlaybackEvent) => unknown) | null =
		null;
	onfinish: ((this: Animation, ev: AnimationPlaybackEvent) => unknown) | null =
		null;
	onremove: ((this: Animation, ev: AnimationPlaybackEvent) => unknown) | null =
		null;
	pending = false;
	playState: AnimationPlayState = "running";
	playbackRate = 1;
	ready: Promise<Animation>;
	replaceState: AnimationReplaceState = "active";
	startTime: CSSNumberish | null = null;
	timeline: AnimationTimeline | null = null;
	cancelCalls = 0;
	commitStylesCalls = 0;
	finishCalls = 0;
	pauseCalls = 0;
	persistCalls = 0;
	playCalls = 0;
	reverseCalls = 0;
	updatePlaybackRateCalls: number[] = [];

	constructor() {
		super();
		const animation = this as unknown as Animation;
		this.ready = Promise.resolve(animation);
		this.finished = Promise.resolve(animation);
	}

	cancel() {
		this.cancelCalls += 1;
		this.playState = "idle";
		this.dispatchEvent(new Event("cancel"));
	}

	commitStyles() {
		this.commitStylesCalls += 1;
	}

	finish() {
		this.finishCalls += 1;
		this.playState = "finished";
		this.dispatchEvent(new Event("finish"));
	}

	pause() {
		this.pauseCalls += 1;
		this.playState = "paused";
	}

	persist() {
		this.persistCalls += 1;
		this.replaceState = "persisted";
	}

	play() {
		this.playCalls += 1;
		this.playState = "running";
	}

	reverse() {
		this.reverseCalls += 1;
		this.playState = "running";
	}

	updatePlaybackRate(playbackRate: number) {
		this.updatePlaybackRateCalls.push(playbackRate);
		this.playbackRate = playbackRate;
	}

	dispatchRemove() {
		this.replaceState = "removed";
		this.dispatchEvent(new Event("remove"));
	}
}

function createAnimatedElement(animation = new FakeAnimation()) {
	const element = document.createElement("div");
	const animate = vi.fn(
		(_keyframes: Keyframe[] | PropertyIndexedKeyframes | null, _options) =>
			animation as unknown as Animation,
	);
	Object.defineProperty(element, "animate", {
		configurable: true,
		value: animate,
	});
	document.body.append(element);

	return { animate, animation, element };
}

describe("useAnimate", () => {
	afterEach(() => {
		document.body.innerHTML = "";
		disposeTrackedMolecules();
	});

	it("stays unsupported when the target cannot animate", () => {
		const element = document.createElement("div");
		const animate = useAnimate(element, null, {
			window: window as unknown as UseAnimateWindowLike,
		});

		expect(animate.isSupported.value).toBe(false);
		expect(animate.animate.value).toBeUndefined();

		animate.play();
		animate.pause();
		animate.reverse();
		animate.finish();
		animate.cancel();

		expect(animate.animate.value).toBeUndefined();
		animate.stop();
	});

	it("creates an animation and strips Sigrea-only options", () => {
		const { animate, animation, element } = createAnimatedElement();
		const onReady = vi.fn();
		const keyframes = { transform: "rotate(360deg)" };
		const controls = useAnimate(element, keyframes, {
			commitStyles: true,
			duration: 100,
			immediate: true,
			onReady,
			persist: true,
			playbackRate: 2,
			window: window as unknown as UseAnimateWindowLike,
		});

		expect(controls.isSupported.value).toBe(true);
		expect(controls.animate.value).toBe(animation);
		expect(controls.playState.value).toBe("running");
		expect(controls.replaceState.value).toBe("persisted");
		expect(animation.persistCalls).toBe(1);
		expect(animation.playbackRate).toBe(2);
		expect(onReady).toHaveBeenCalledWith(animation);
		expect(animate).toHaveBeenCalledWith(keyframes, {
			duration: 100,
			playbackRate: 2,
		});

		controls.finish();
		expect(animation.commitStylesCalls).toBe(1);
		controls.stop();
	});

	it("uses the configured window callbacks and reports ready errors", () => {
		const { element } = createAnimatedElement();
		const onError = vi.fn();
		const readyError = new Error("ready failed");
		const frameWindow = new EventTarget() as UseAnimateWindowLike;
		frameWindow.requestAnimationFrame = vi.fn(function (
			this: UseAnimateWindowLike,
			_callback: FrameRequestCallback,
		) {
			expect(this).toBe(frameWindow);
			return 10;
		});
		frameWindow.cancelAnimationFrame = vi.fn(function (
			this: UseAnimateWindowLike,
			handle: number,
		) {
			expect(this).toBe(frameWindow);
			expect(handle).toBe(10);
		});

		const controls = useAnimate(element, null, {
			onError,
			onReady: () => {
				throw readyError;
			},
			window: frameWindow,
		});

		expect(frameWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);
		expect(onError).toHaveBeenCalledWith(readyError);

		controls.stop();
		expect(frameWindow.cancelAnimationFrame).toHaveBeenCalledWith(10);
	});

	it("cancels frames on the window that created them", () => {
		const { element } = createAnimatedElement();
		let nextFrameId = 0;
		const createFrameWindow = () => {
			const frameWindow = new EventTarget() as UseAnimateWindowLike;
			frameWindow.requestAnimationFrame = vi.fn(() => {
				nextFrameId += 1;
				return nextFrameId;
			});
			frameWindow.cancelAnimationFrame = vi.fn();
			return frameWindow;
		};
		const firstWindow = createFrameWindow();
		const secondWindow = createFrameWindow();
		const windowTarget = signal(firstWindow);
		const controls = useAnimate(element, null, {
			window: windowTarget,
		});

		expect(firstWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);

		windowTarget.value = secondWindow;
		expect(firstWindow.cancelAnimationFrame).toHaveBeenCalledWith(1);
		expect(secondWindow.requestAnimationFrame).toHaveBeenCalledTimes(1);

		controls.stop();
		expect(secondWindow.cancelAnimationFrame).toHaveBeenCalledWith(2);
	});

	it("can delay playback until play is called", () => {
		const { animation, element } = createAnimatedElement();
		const controls = useAnimate(
			element,
			{ opacity: [0, 1] },
			{
				duration: 100,
				immediate: false,
				window: window as unknown as UseAnimateWindowLike,
			},
		);

		expect(animation.pauseCalls).toBe(1);
		expect(controls.playState.value).toBe("paused");

		controls.play();
		expect(animation.playCalls).toBe(1);
		expect(controls.playState.value).toBe("running");

		controls.stop();
	});

	it("forwards controls and writable state to the animation", () => {
		const { animation, element } = createAnimatedElement();
		const timeline = {} as AnimationTimeline;
		const controls = useAnimate(
			element,
			{ opacity: [0, 1] },
			{
				window: window as unknown as UseAnimateWindowLike,
			},
		);

		controls.currentTime.value = 50;
		controls.startTime.value = 10;
		controls.timeline.value = timeline;
		controls.playbackRate.value = 1.5;

		expect(animation.currentTime).toBe(50);
		expect(animation.startTime).toBe(10);
		expect(animation.timeline).toBe(timeline);
		expect(animation.playbackRate).toBe(1.5);

		controls.pause();
		expect(animation.pauseCalls).toBe(1);
		expect(controls.playState.value).toBe("paused");

		controls.reverse();
		expect(animation.reverseCalls).toBe(1);
		expect(controls.playState.value).toBe("running");

		controls.finish();
		expect(animation.finishCalls).toBe(1);
		expect(controls.playState.value).toBe("finished");

		controls.cancel();
		expect(animation.cancelCalls).toBe(1);
		expect(controls.playState.value).toBe("idle");

		controls.stop();
	});

	it("updates keyframes without pausing a running animation", () => {
		const { animate, animation, element } = createAnimatedElement();
		const setKeyframes = vi.fn();
		animation.effect = { setKeyframes } as unknown as AnimationEffect;
		const keyframes = signal<Keyframe[] | PropertyIndexedKeyframes | null>({
			opacity: [0, 1],
		});
		const controls = useAnimate(element, keyframes, {
			duration: 100,
			immediate: false,
			window: window as unknown as UseAnimateWindowLike,
		});

		expect(animation.pauseCalls).toBe(1);
		controls.play();

		const nextKeyframes = { transform: "scale(2)" };
		keyframes.value = nextKeyframes;

		expect(animate).toHaveBeenCalledTimes(1);
		expect(setKeyframes).toHaveBeenCalledWith(nextKeyframes);
		expect(animation.cancelCalls).toBe(0);
		expect(controls.playState.value).toBe("running");

		controls.stop();
	});

	it("recreates animations when targets change", () => {
		const first = createAnimatedElement();
		const second = createAnimatedElement();
		const target = signal<Element | null>(null);
		const controls = useAnimate(
			target,
			{ opacity: [0, 1] },
			{
				window: window as unknown as UseAnimateWindowLike,
			},
		);

		expect(controls.animate.value).toBeUndefined();

		target.value = first.element;
		expect(first.animate).toHaveBeenCalledTimes(1);
		expect(controls.animate.value).toBe(first.animation);

		target.value = second.element;
		expect(first.animation.cancelCalls).toBe(1);
		expect(second.animate).toHaveBeenCalledTimes(1);
		expect(controls.animate.value).toBe(second.animation);

		target.value = null;
		expect(second.animation.cancelCalls).toBe(1);
		expect(controls.animate.value).toBeUndefined();

		controls.stop();
	});

	it("removes listeners and cancels the animation on stop", () => {
		const { animation, element } = createAnimatedElement();
		const controls = useAnimate(
			element,
			{ opacity: [0, 1] },
			{
				commitStyles: true,
				window: window as unknown as UseAnimateWindowLike,
			},
		);

		controls.stop();
		controls.stop();
		animation.finish();

		expect(animation.cancelCalls).toBe(1);
		expect(animation.commitStylesCalls).toBe(0);
		expect(controls.animate.value).toBeUndefined();
	});

	it("starts on molecule mount and cancels on unmount", () => {
		const { animation, element } = createAnimatedElement();
		const UseAnimation = molecule(() =>
			useAnimate(
				element,
				{ opacity: [0, 1] },
				{
					window: window as unknown as UseAnimateWindowLike,
				},
			),
		);
		const controls = UseAnimation();
		trackMolecule(controls);

		expect(controls.animate.value).toBeUndefined();

		mountMolecule(controls);
		expect(controls.animate.value).toBe(animation);

		unmountMolecule(controls);
		expect(animation.cancelCalls).toBe(1);
		expect(controls.animate.value).toBeUndefined();
	});
});
