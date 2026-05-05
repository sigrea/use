import { readonly, signal, watch } from "@sigrea/core";

import { defaultNavigator, defaultWindow, resolveTarget } from "../../shared";
import { createEventHook } from "../createEventHook";
import { bindAutoStart } from "../internal";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	NavigatorLike,
	UseGamepadGamepadLike,
	UseGamepadGamepadSnapshot,
	UseGamepadNavigatorLike,
	UseGamepadOptions,
	UseGamepadReturn,
	UseGamepadWindowLike,
} from "../types";
import { useEventListener } from "../useEventListener";

function getGamepadsFunction(
	navigator: NavigatorLike | null | undefined,
): UseGamepadNavigatorLike["getGamepads"] | undefined {
	try {
		const getGamepads = (navigator as UseGamepadNavigatorLike | undefined)
			?.getGamepads;

		return typeof getGamepads === "function" ? getGamepads : undefined;
	} catch {
		return undefined;
	}
}

function isGamepadNavigator(
	navigator: NavigatorLike | null | undefined,
): navigator is UseGamepadNavigatorLike {
	return getGamepadsFunction(navigator) !== undefined;
}

function getRequestAnimationFrame(
	windowTarget: UseGamepadWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseGamepadWindowLike["requestAnimationFrame"] | undefined {
	return (
		windowTarget?.requestAnimationFrame ??
		(allowGlobalFallback ? globalThis.requestAnimationFrame : undefined)
	);
}

function getCancelAnimationFrame(
	windowTarget: UseGamepadWindowLike | undefined,
	allowGlobalFallback: boolean,
): UseGamepadWindowLike["cancelAnimationFrame"] | undefined {
	return (
		windowTarget?.cancelAnimationFrame ??
		(allowGlobalFallback ? globalThis.cancelAnimationFrame : undefined)
	);
}

function getGamepadFromEvent(event: Event): UseGamepadGamepadLike | undefined {
	return (event as Event & { readonly gamepad?: UseGamepadGamepadLike })
		.gamepad;
}

function cloneGamepad(
	gamepad: UseGamepadGamepadLike,
): UseGamepadGamepadSnapshot {
	const vibrationActuator = gamepad.vibrationActuator ?? null;
	const hapticActuators = [
		...(vibrationActuator !== null ? [vibrationActuator] : []),
		...Array.from(gamepad.hapticActuators ?? []).filter(
			(actuator) => actuator !== vibrationActuator,
		),
	];

	return {
		axes: Array.from(gamepad.axes),
		buttons: Array.from(gamepad.buttons, (button) => ({
			pressed: button.pressed,
			touched: button.touched,
			value: button.value,
		})),
		connected: gamepad.connected,
		hapticActuators,
		id: gamepad.id,
		index: gamepad.index,
		mapping: gamepad.mapping,
		timestamp: gamepad.timestamp,
		vibrationActuator,
	};
}

function sortGamepads(
	gamepads: Iterable<UseGamepadGamepadSnapshot>,
): UseGamepadGamepadSnapshot[] {
	return [...gamepads].sort((first, second) => first.index - second.index);
}

/**
 * Reactive Gamepad API snapshots.
 */
export function useGamepad<
	TNavigator extends UseGamepadNavigatorLike = UseGamepadNavigatorLike,
	TWindow extends UseGamepadWindowLike = UseGamepadWindowLike,
>(options: UseGamepadOptions<TNavigator, TWindow> = {}): UseGamepadReturn {
	const useDefaultNavigator =
		!("navigator" in options) || options.navigator === undefined;
	const navigatorTarget:
		| MaybeTarget<TNavigator | null | undefined>
		| undefined = useDefaultNavigator
		? (defaultNavigator as TNavigator | undefined)
		: options.navigator;
	const useDefaultWindow =
		!("window" in options) || options.window === undefined;
	const windowTarget: MaybeTarget<TWindow | null | undefined> | undefined =
		useDefaultWindow ? (defaultWindow as TWindow | undefined) : options.window;
	const immediate = options.immediate ?? true;
	const isSupported = signal(false);
	const active = signal(false);
	const gamepads = signal<readonly UseGamepadGamepadSnapshot[]>([]);
	const connectedHook = createEventHook<number>();
	const disconnectedHook = createEventHook<number>();
	let frameHandle: number | undefined;
	let frameWindow: TWindow | undefined;
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const currentNavigator = () => {
		if (!useDefaultNavigator) {
			return navigatorTarget === undefined
				? undefined
				: resolveTarget<TNavigator | null | undefined>(navigatorTarget);
		}

		return (
			(currentWindow()?.navigator as TNavigator | null | undefined) ??
			(navigatorTarget === undefined
				? undefined
				: resolveTarget<TNavigator | null | undefined>(navigatorTarget))
		);
	};
	const syncSupport = (navigator: NavigatorLike | null | undefined) => {
		isSupported.value = isGamepadNavigator(navigator);
	};
	const clearSnapshots = () => {
		if (gamepads.value.length > 0) {
			gamepads.value = [];
		}
	};
	const clearFrame = () => {
		if (frameHandle === undefined) {
			return;
		}

		const cancelFrame = getCancelAnimationFrame(frameWindow, useDefaultWindow);
		if (typeof cancelFrame === "function") {
			cancelFrame.call(frameWindow ?? globalThis, frameHandle);
		}
		frameHandle = undefined;
		frameWindow = undefined;
	};
	const readGamepads = ():
		| readonly (UseGamepadGamepadLike | null | undefined)[]
		| undefined => {
		const navigator = currentNavigator();
		const getGamepads = getGamepadsFunction(navigator);
		isSupported.value = getGamepads !== undefined;
		if (getGamepads === undefined || navigator === undefined) {
			return undefined;
		}

		try {
			return Array.from(getGamepads.call(navigator) ?? []);
		} catch {
			isSupported.value = false;
			clearSnapshots();
			return undefined;
		}
	};
	const upsertSnapshot = (snapshot: UseGamepadGamepadSnapshot): boolean => {
		const nextGamepads = new Map(
			gamepads.value.map((gamepad) => [gamepad.index, gamepad]),
		);
		const added = !nextGamepads.has(snapshot.index);
		nextGamepads.set(snapshot.index, snapshot);
		gamepads.value = sortGamepads(nextGamepads.values());

		return added;
	};
	const removeSnapshot = (index: number): boolean => {
		const nextGamepads = gamepads.value.filter(
			(gamepad) => gamepad.index !== index,
		);
		const removed = nextGamepads.length !== gamepads.value.length;
		if (removed) {
			gamepads.value = nextGamepads;
		}

		return removed;
	};
	const updateGamepads = () => {
		const latestGamepads = readGamepads();
		if (latestGamepads === undefined) {
			pause();
			return;
		}

		const connectedIndexes = new Set<number>();
		for (const gamepad of latestGamepads) {
			if (gamepad === undefined || gamepad === null) {
				continue;
			}

			if (!gamepad.connected) {
				if (removeSnapshot(gamepad.index)) {
					void disconnectedHook.trigger(gamepad.index);
				}
				continue;
			}

			const snapshot = cloneGamepad(gamepad);
			connectedIndexes.add(snapshot.index);
			if (upsertSnapshot(snapshot)) {
				void connectedHook.trigger(snapshot.index);
			}
		}
		for (const gamepad of gamepads.value) {
			if (
				!connectedIndexes.has(gamepad.index) &&
				removeSnapshot(gamepad.index)
			) {
				void disconnectedHook.trigger(gamepad.index);
			}
		}
	};
	const scheduleFrame = () => {
		if (!active.value || frameHandle !== undefined) {
			return;
		}

		const windowValue = currentWindow();
		const requestFrame = getRequestAnimationFrame(
			windowValue,
			useDefaultWindow,
		);
		if (typeof requestFrame !== "function") {
			active.value = false;
			return;
		}

		frameWindow = windowValue;
		frameHandle = requestFrame.call(windowValue ?? globalThis, () => {
			frameHandle = undefined;
			frameWindow = undefined;

			if (!active.value) {
				return;
			}

			updateGamepads();
			scheduleFrame();
		});
	};
	const pause = () => {
		active.value = false;
		clearFrame();
	};
	const resume = () => {
		if (stopped || active.value) {
			return;
		}

		const navigator = currentNavigator();
		syncSupport(navigator);
		if (!isGamepadNavigator(navigator)) {
			return;
		}

		active.value = true;
		scheduleFrame();
	};
	const handleConnected = (event: Event) => {
		const gamepad = getGamepadFromEvent(event);
		if (gamepad === undefined) {
			return;
		}

		const snapshot = cloneGamepad(gamepad);
		if (upsertSnapshot(snapshot)) {
			void connectedHook.trigger(snapshot.index);
		}
	};
	const handleDisconnected = (event: Event) => {
		const gamepad = getGamepadFromEvent(event);
		if (gamepad === undefined) {
			return;
		}

		if (removeSnapshot(gamepad.index)) {
			void disconnectedHook.trigger(gamepad.index);
		}
	};
	const connectedListener = useEventListener(
		windowTarget as MaybeTarget<EventTarget | null | undefined> | undefined,
		"gamepadconnected",
		handleConnected,
		{ passive: true },
	);
	const disconnectedListener = useEventListener(
		windowTarget as MaybeTarget<EventTarget | null | undefined> | undefined,
		"gamepaddisconnected",
		handleDisconnected,
		{ passive: true },
	);
	const stopTargetWatch = watch(
		() => ({
			navigator: currentNavigator(),
			window: currentWindow(),
		}),
		({ navigator, window }, previousValue) => {
			syncSupport(navigator);
			if (
				previousValue !== undefined &&
				previousValue.navigator !== navigator
			) {
				clearSnapshots();
			}
			if (!isSupported.value) {
				pause();
				return;
			}
			if (active.value && previousValue?.window !== window) {
				clearFrame();
				scheduleFrame();
			}
		},
		{ immediate: true, flush: "sync" },
	);
	const stop = () => {
		if (stopped) {
			return;
		}

		pause();
		stopped = true;
		stopTargetWatch();
		connectedListener.stop();
		disconnectedListener.stop();
		connectedHook.clear();
		disconnectedHook.clear();
	};

	bindAutoStart(resume, pause, immediate);
	tryOnScopeDispose(stop);

	return {
		isSupported: readonly(isSupported),
		gamepads: readonly(gamepads),
		onConnected: connectedHook.on,
		onDisconnected: disconnectedHook.on,
		isActive: readonly(active),
		pause,
		resume,
		stop,
	};
}
