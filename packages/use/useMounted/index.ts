import {
	getCurrentScope,
	onDispose,
	onMount,
	onUnmount,
	readonly,
	signal,
} from "@sigrea/core";

import type { UseMountedReturn } from "../types";

export function useMounted(): UseMountedReturn {
	const mounted = signal(false);
	const setMounted = () => {
		mounted.value = true;
	};
	const setUnmounted = () => {
		mounted.value = false;
	};
	const scope = getCurrentScope();

	if (scope !== undefined) {
		onDispose(setUnmounted, scope);
	}

	try {
		onMount(setMounted);
		onUnmount(setUnmounted);
	} catch {}

	return readonly(mounted);
}
