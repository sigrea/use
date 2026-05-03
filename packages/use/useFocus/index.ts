import { computed, signal, watch } from "@sigrea/core";
import { resolveTarget } from "../../shared";
import type {
	FocusMethodOptions,
	FocusableElementLike,
	MaybeTarget,
	UseFocusOptions,
	UseFocusReturn,
} from "../types";
import { useEventListener } from "../useEventListener";

function createFocusOptions(
	preventScroll: boolean,
): FocusMethodOptions | undefined {
	const options: FocusMethodOptions = {};

	if (preventScroll) {
		options.preventScroll = true;
	}

	return Object.keys(options).length > 0 ? options : undefined;
}

function matchesFocusVisible(element: FocusableElementLike): boolean {
	try {
		return element.matches?.(":focus-visible") ?? false;
	} catch {
		return false;
	}
}

export function useFocus(
	target: MaybeTarget<FocusableElementLike>,
	options: UseFocusOptions = {},
): UseFocusReturn {
	const {
		initialValue = false,
		focusVisible = false,
		preventScroll = false,
	} = options;
	const innerFocused = signal(false);
	const focusOptions = () => createFocusOptions(preventScroll);

	const focus = () => {
		resolveTarget(target)?.focus(focusOptions());
	};

	const blur = () => {
		resolveTarget(target)?.blur();
	};

	const focused = computed({
		get: () => innerFocused.value,
		set(nextValue: boolean) {
			if (nextValue && !innerFocused.value) {
				focus();
			} else if (!nextValue && innerFocused.value) {
				blur();
			}
		},
	});

	const focusListener = useEventListener(
		target,
		"focus",
		(event) => {
			const element = event.target as FocusableElementLike | null;
			if (!focusVisible || (element && matchesFocusVisible(element))) {
				innerFocused.value = true;
			}
		},
		{ passive: true },
	);
	const blurListener = useEventListener(
		target,
		"blur",
		() => {
			innerFocused.value = false;
		},
		{ passive: true },
	);
	const initialFocus = watch(
		() => resolveTarget(target),
		(element) => {
			if (!element) {
				innerFocused.value = false;
				return;
			}

			if (initialValue) {
				focus();
			} else {
				innerFocused.value = false;
			}
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		focused,
		focus,
		blur,
		stop: () => {
			focusListener.stop();
			blurListener.stop();
			initialFocus();
		},
	};
}
