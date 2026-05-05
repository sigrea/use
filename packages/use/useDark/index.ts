import { computed } from "@sigrea/core";

import { resolveValue } from "../../shared";
import type { BasicColorMode, UseDarkOptions, UseDarkReturn } from "../types";
import { useColorMode } from "../useColorMode";

export function useDark(options: UseDarkOptions = {}): UseDarkReturn {
	const {
		onChanged,
		valueDark = "dark",
		valueLight = "",
		...colorModeOptions
	} = options;
	const colorMode = useColorMode({
		...colorModeOptions,
		modes: computed(() => ({
			dark: resolveValue(valueDark),
			light: resolveValue(valueLight),
		})),
		onChanged: (mode, defaultHandler) => {
			if (onChanged !== undefined) {
				onChanged(mode === "dark", defaultHandler, mode);
				return;
			}

			defaultHandler(mode);
		},
	});
	const isDark = computed<boolean>({
		get: () => colorMode.resolvedMode.value === "dark",
		set: (nextValue) => {
			const nextMode: BasicColorMode = nextValue ? "dark" : "light";
			colorMode.mode.value =
				colorMode.system.value === nextMode ? "auto" : nextMode;
		},
	});

	Object.defineProperty(isDark, "stop", {
		configurable: true,
		enumerable: false,
		value: colorMode.stop,
	});

	return isDark as UseDarkReturn;
}
