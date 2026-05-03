import { readonly, signal } from "@sigrea/core";
import { resolveValue } from "../../shared/resolveValue";
import type { MaybeValue, UseToggleOptions, UseToggleReturn } from "../types";

type ToggleValue<Truthy, Falsy> = Truthy | Falsy;

function resolveToggleOption<T>(
	value: MaybeValue<T> | undefined,
	fallback: T,
): T {
	return value === undefined ? fallback : resolveValue(value);
}

export function useToggle(): UseToggleReturn<boolean>;
export function useToggle(
	initialValue: MaybeValue<boolean>,
): UseToggleReturn<boolean>;
export function useToggle<const Truthy = true, const Falsy = false>(
	initialValue: MaybeValue<ToggleValue<Truthy, Falsy>>,
	options: UseToggleOptions<Truthy, Falsy>,
): UseToggleReturn<ToggleValue<Truthy, Falsy>>;
export function useToggle<const Truthy = true, const Falsy = false>(
	initialValue: undefined,
	options: UseToggleOptions<Truthy, Falsy>,
): UseToggleReturn<ToggleValue<Truthy, Falsy>>;
export function useToggle<const Truthy = true, const Falsy = false>(
	initialValue?: MaybeValue<boolean | ToggleValue<Truthy, Falsy>>,
	options: UseToggleOptions<Truthy, Falsy> = {},
): UseToggleReturn<boolean | ToggleValue<Truthy, Falsy>> {
	type Value = boolean | ToggleValue<Truthy, Falsy>;
	const truthyValue = () =>
		resolveToggleOption(options.truthyValue, true as Truthy);
	const falsyValue = () =>
		resolveToggleOption(options.falsyValue, false as Falsy);
	const value = signal(
		initialValue === undefined ? falsyValue() : resolveValue(initialValue),
	);

	function toggle(...args: [Value?]): Value {
		if (args.length > 0) {
			value.value = args[0] as Value;
			return value.value;
		}

		const nextTruthyValue = truthyValue();
		const nextFalsyValue = falsyValue();
		value.value =
			value.value === nextTruthyValue ? nextFalsyValue : nextTruthyValue;
		return value.value;
	}

	const set = (nextValue: Value) => {
		value.value = nextValue;
	};

	return {
		set,
		toggle,
		value: readonly(value),
	};
}
