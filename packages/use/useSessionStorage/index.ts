import { defaultWindow, resolveTarget } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	RemovableSignal,
	StorageWindowLike,
	UseStorageOptions,
} from "../types";
import { useStorage } from "../useStorage";

export function useSessionStorage(
	key: MaybeValue<string>,
	initialValue: MaybeValue<string>,
	options?: UseStorageOptions<string>,
): RemovableSignal<string | null>;
export function useSessionStorage(
	key: MaybeValue<string>,
	initialValue: MaybeValue<boolean>,
	options?: UseStorageOptions<boolean>,
): RemovableSignal<boolean | null>;
export function useSessionStorage(
	key: MaybeValue<string>,
	initialValue: MaybeValue<number>,
	options?: UseStorageOptions<number>,
): RemovableSignal<number | null>;
export function useSessionStorage<T>(
	key: MaybeValue<string>,
	initialValue: MaybeValue<T>,
	options?: UseStorageOptions<T>,
): RemovableSignal<T | null>;
export function useSessionStorage<T = unknown>(
	key: MaybeValue<string>,
	initialValue: MaybeValue<null>,
	options?: UseStorageOptions<T>,
): RemovableSignal<T | null>;
export function useSessionStorage<T>(
	key: MaybeValue<string>,
	initialValue: MaybeValue<T>,
	options: UseStorageOptions<T> = {},
): RemovableSignal<T | null> {
	const windowTarget =
		options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<StorageWindowLike> | undefined);

	return useStorage(
		key,
		initialValue,
		() => resolveTarget(windowTarget)?.sessionStorage,
		{
			...options,
			window: windowTarget,
		},
	);
}
