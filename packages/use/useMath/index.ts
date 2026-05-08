import { reactify } from "../reactify";
import type {
	FunctionArgs,
	UseMathArgs,
	UseMathKeys,
	UseMathMethod,
	UseMathReturn,
} from "../types";

/**
 * Reactive `Math` methods.
 */
export function useMath<K extends UseMathKeys>(
	key: K,
	...args: UseMathArgs<K>
): UseMathReturn<K> {
	const fn = Math[key] as unknown as FunctionArgs<
		Parameters<UseMathMethod<K>>,
		ReturnType<UseMathMethod<K>>,
		unknown
	>;
	const reactiveMath = reactify<
		unknown,
		Parameters<UseMathMethod<K>>,
		ReturnType<UseMathMethod<K>>
	>(fn);

	return reactiveMath(...args) as UseMathReturn<K>;
}
