import { computed, readonly } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseCssSupportsOptions,
	UseCssSupportsReturn,
	UseCssSupportsWindowLike,
} from "../types";

function isOptionsObject(value: unknown): value is UseCssSupportsOptions {
	return typeof value === "object" && value !== null && !("value" in value);
}

export function useCssSupports<
	TWindow extends UseCssSupportsWindowLike = UseCssSupportsWindowLike,
>(
	conditionText: MaybeValue<string>,
	options?: UseCssSupportsOptions<TWindow>,
): UseCssSupportsReturn;
export function useCssSupports<
	TWindow extends UseCssSupportsWindowLike = UseCssSupportsWindowLike,
>(
	property: MaybeValue<string>,
	value: MaybeValue<string>,
	options?: UseCssSupportsOptions<TWindow>,
): UseCssSupportsReturn;
export function useCssSupports<
	TWindow extends UseCssSupportsWindowLike = UseCssSupportsWindowLike,
>(
	...input: [
		first: MaybeValue<string>,
		secondOrOptions?: MaybeValue<string> | UseCssSupportsOptions<TWindow>,
		thirdOptions?: UseCssSupportsOptions<TWindow>,
	]
): UseCssSupportsReturn {
	const [first, secondOrOptions, thirdOptions] = input;
	const args: unknown[] = [first];
	if (input.length >= 2) {
		args.push(secondOrOptions);
	}

	let options: UseCssSupportsOptions<TWindow> = {};
	if (input.length >= 3) {
		options = thirdOptions ?? {};
	} else if (isOptionsObject(secondOrOptions)) {
		options = secondOrOptions;
		args.pop();
	}

	const windowTarget =
		"window" in options && options.window !== undefined
			? options.window
			: (defaultWindow as MaybeTarget<TWindow> | undefined);
	const initialValue = options.initialValue ?? false;
	const hasValue = args.length === 2;
	const propertyOrCondition = first;
	const value = secondOrOptions as MaybeValue<string> | undefined;

	return readonly(
		computed(() => {
			const currentWindow =
				windowTarget === undefined
					? undefined
					: resolveTarget<TWindow>(windowTarget);
			const currentCss = currentWindow?.CSS;

			if (
				currentCss === undefined ||
				typeof currentCss.supports !== "function"
			) {
				return initialValue;
			}

			const currentPropertyOrCondition = String(
				resolveValue(propertyOrCondition),
			);
			const currentValue = hasValue ? String(resolveValue(value)) : undefined;

			return hasValue
				? currentCss.supports(
						currentPropertyOrCondition,
						currentValue as string,
					)
				: currentCss.supports(currentPropertyOrCondition);
		}),
	);
}
