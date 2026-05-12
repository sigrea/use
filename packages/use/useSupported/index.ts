import { computed, readonly } from "@sigrea/core";

import type { UseSupportedReturn } from "../types";
import { useMounted } from "../useMounted";

export function useSupported(callback: () => unknown): UseSupportedReturn {
	const isMounted = useMounted();

	return readonly(
		computed(() => {
			void isMounted.value;

			return Boolean(callback());
		}),
	);
}
