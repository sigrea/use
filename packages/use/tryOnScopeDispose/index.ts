import { getCurrentScope, onDispose } from "@sigrea/core";
import type { Cleanup } from "@sigrea/core";

import type { TryOnScopeDisposeReturn } from "../types";

/**
 * Registers a cleanup in the current Sigrea scope when one is active.
 *
 * @param cleanup Cleanup to run when the current scope is disposed.
 */
export function tryOnScopeDispose(cleanup: Cleanup): TryOnScopeDisposeReturn {
	const scope = getCurrentScope();
	if (scope === undefined) {
		return false;
	}

	onDispose(cleanup, scope);
	return true;
}
