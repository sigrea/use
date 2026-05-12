import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, listen, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	UseScreenSafeAreaElementLike,
	UseScreenSafeAreaOptions,
	UseScreenSafeAreaReturn,
	UseScreenSafeAreaWindowLike,
} from "../types";

const safeAreaVariables = [
	{
		property: "--sigrea-safe-area-top",
		value: "env(safe-area-inset-top, 0px)",
	},
	{
		property: "--sigrea-safe-area-right",
		value: "env(safe-area-inset-right, 0px)",
	},
	{
		property: "--sigrea-safe-area-bottom",
		value: "env(safe-area-inset-bottom, 0px)",
	},
	{
		property: "--sigrea-safe-area-left",
		value: "env(safe-area-inset-left, 0px)",
	},
] as const;

interface PreviousSafeAreaVariable {
	priority: string;
	property: string;
	value: string;
}

interface SafeAreaVariableState {
	count: number;
	previousValues: PreviousSafeAreaVariable[];
}

const safeAreaVariableStates = new WeakMap<
	UseScreenSafeAreaElementLike,
	SafeAreaVariableState
>();

function getDocumentElement(
	windowTarget: UseScreenSafeAreaWindowLike | null | undefined,
): UseScreenSafeAreaElementLike | undefined {
	return windowTarget?.document?.documentElement ?? undefined;
}

function readSafeAreaValue(
	windowTarget: UseScreenSafeAreaWindowLike | null | undefined,
	property: string,
) {
	const documentElement = getDocumentElement(windowTarget);

	if (
		documentElement === undefined ||
		typeof windowTarget?.getComputedStyle !== "function"
	) {
		return "";
	}

	return windowTarget
		.getComputedStyle(documentElement)
		.getPropertyValue(property);
}

function restoreSafeAreaVariables(
	element: UseScreenSafeAreaElementLike,
	previousValues: PreviousSafeAreaVariable[],
): void {
	const style = element.style;
	if (style === undefined) {
		return;
	}

	for (const { priority, property, value } of previousValues) {
		if (value === "") {
			style.removeProperty(property);
			continue;
		}

		style.setProperty(property, value, priority);
	}
}

function setSafeAreaVariables(
	windowTarget: UseScreenSafeAreaWindowLike | null | undefined,
) {
	const documentElement = getDocumentElement(windowTarget);
	const style = documentElement?.style;
	if (documentElement === undefined || style === undefined) {
		return () => {};
	}

	const currentState = safeAreaVariableStates.get(documentElement);
	const state =
		currentState ??
		({
			count: 0,
			previousValues: safeAreaVariables.map(({ property }) => ({
				priority: style.getPropertyPriority(property),
				property,
				value: style.getPropertyValue(property),
			})),
		} satisfies SafeAreaVariableState);
	state.count += 1;
	safeAreaVariableStates.set(documentElement, state);

	for (const { property, value } of safeAreaVariables) {
		style.setProperty(property, value);
	}

	return () => {
		const current = safeAreaVariableStates.get(documentElement);
		if (current === undefined) {
			return;
		}

		current.count -= 1;
		if (current.count > 0) {
			return;
		}

		safeAreaVariableStates.delete(documentElement);
		restoreSafeAreaVariables(documentElement, current.previousValues);
	};
}

export function useScreenSafeArea<
	TWindow extends UseScreenSafeAreaWindowLike = UseScreenSafeAreaWindowLike,
>(options: UseScreenSafeAreaOptions<TWindow> = {}): UseScreenSafeAreaReturn {
	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow | null | undefined> | undefined);
	const top = signal("");
	const right = signal("");
	const bottom = signal("");
	const left = signal("");
	let stopped = false;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<TWindow | null | undefined>(windowTarget);
	const syncValues = (
		windowValue: UseScreenSafeAreaWindowLike | null | undefined,
	) => {
		top.value = readSafeAreaValue(windowValue, safeAreaVariables[0].property);
		right.value = readSafeAreaValue(windowValue, safeAreaVariables[1].property);
		bottom.value = readSafeAreaValue(
			windowValue,
			safeAreaVariables[2].property,
		);
		left.value = readSafeAreaValue(windowValue, safeAreaVariables[3].property);
	};
	const update = () => {
		syncValues(currentWindow());
	};

	const stopWindowWatch = watch(
		() => currentWindow(),
		(windowValue, _previousWindow, onCleanup) => {
			if (stopped) {
				return;
			}

			const cleanupVariables = setSafeAreaVariables(windowValue);
			syncValues(windowValue);

			if (windowValue === undefined || windowValue === null) {
				onCleanup(cleanupVariables);
				return;
			}

			const sync = () => {
				syncValues(windowValue);
			};
			const cleanups = [
				listen(windowValue, "resize", sync, { passive: true }),
				listen(windowValue, "orientationchange", sync, { passive: true }),
			];

			if (
				windowValue.visualViewport !== undefined &&
				windowValue.visualViewport !== null
			) {
				cleanups.push(
					listen(windowValue.visualViewport, "resize", sync, {
						passive: true,
					}),
				);
			}

			onCleanup(() => {
				for (const cleanup of cleanups) {
					cleanup();
				}
				cleanupVariables();
			});
		},
		{ immediate: true, flush: "sync" },
	);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		stopWindowWatch();
	};

	return {
		top: readonly(top),
		right: readonly(right),
		bottom: readonly(bottom),
		left: readonly(left),
		update,
		stop,
	};
}
