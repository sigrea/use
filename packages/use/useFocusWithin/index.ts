import {
	getCurrentScope,
	onDispose,
	readonly,
	signal,
	watch,
} from "@sigrea/core";
import { resolveTarget } from "../../shared";
import type {
	FocusWithinElementLike,
	MaybeTarget,
	UseFocusWithinReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

const focusWithinSelector = ":focus-within";

function matchesFocusWithin(target: FocusWithinElementLike): boolean {
	try {
		return target.matches?.(focusWithinSelector) ?? false;
	} catch {
		return false;
	}
}

function containsEventTarget(
	target: FocusWithinElementLike,
	nextTarget: EventTarget | null,
): boolean {
	if (nextTarget === null || typeof target.contains !== "function") {
		return false;
	}

	try {
		return target.contains(nextTarget as Node);
	} catch {
		return false;
	}
}

function hasCurrentFocusWithin(target: FocusWithinElementLike): boolean {
	return (
		containsEventTarget(target, target.ownerDocument?.activeElement ?? null) ||
		matchesFocusWithin(target)
	);
}

function hasFocusWithinAfterFocusOut(
	target: FocusWithinElementLike,
	relatedTarget: EventTarget | null,
): boolean {
	if (relatedTarget !== null) {
		return containsEventTarget(target, relatedTarget);
	}

	return matchesFocusWithin(target);
}

export function useFocusWithin(
	target: MaybeTarget<FocusWithinElementLike | null | undefined>,
): UseFocusWithinReturn {
	const focused = signal(false);
	let stopped = false;

	const syncFocused = () => {
		if (stopped) {
			return;
		}

		const element = resolveTarget(target);
		focused.value = element ? hasCurrentFocusWithin(element) : false;
	};

	const focusin = useEventListener(
		target,
		"focusin",
		() => {
			if (!stopped) {
				focused.value = true;
			}
		},
		{ passive: true },
	);
	const focusout = useEventListener(
		target,
		"focusout",
		(event) => {
			if (stopped) {
				return;
			}

			const element = resolveTarget(target);
			focused.value = element
				? hasFocusWithinAfterFocusOut(
						element,
						(event as FocusEvent).relatedTarget,
					)
				: false;
		},
		{ passive: true },
	);
	const stopTargetWatch = watch(
		() => resolveTarget(target),
		(nextTarget, previousTarget) => {
			if (nextTarget !== previousTarget) {
				syncFocused();
			}
		},
		{ immediate: true, flush: "sync" },
	);

	const stop = () => {
		if (stopped) {
			return;
		}

		stopped = true;
		focusin.stop();
		focusout.stop();
		stopTargetWatch();
		focused.value = false;
	};

	const scope = getCurrentScope();
	if (scope !== undefined) {
		onDispose(stop, scope);
	}

	return {
		focused: readonly(focused),
		stop,
	};
}
