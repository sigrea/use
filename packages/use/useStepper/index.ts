import { computed, readonly, signal, watch } from "@sigrea/core";

import { resolveValue } from "../../shared/resolveValue";
import type {
	MaybeValue,
	UseStepperArrayStep,
	UseStepperObjectStepName,
	UseStepperObjectStepValue,
	UseStepperObjectSteps,
	UseStepperResolvedObject,
	UseStepperReturn,
} from "../types";

function resolveSteps(
	steps: MaybeValue<
		readonly MaybeValue<UseStepperArrayStep>[] | UseStepperObjectSteps
	>,
): UseStepperArrayStep[] | Record<string, unknown> {
	const source = resolveValue(steps);

	if (Array.isArray(source)) {
		return source.map((step) => resolveValue(step));
	}

	const resolvedSteps: Record<string, unknown> = {};
	const objectSource = source as Record<string, MaybeValue<unknown>>;
	for (const key of Object.keys(objectSource)) {
		resolvedSteps[key] = resolveValue(objectSource[key]);
	}

	return resolvedSteps;
}

function getStepNames(
	steps: UseStepperArrayStep[] | Record<string, unknown>,
): UseStepperArrayStep[] {
	return Array.isArray(steps) ? steps : Object.keys(steps);
}

function findStepIndex<T extends UseStepperArrayStep>(
	stepNames: readonly T[],
	step: T,
): number {
	return stepNames.findIndex((stepName) => Object.is(stepName, step));
}

/**
 * Navigate through a list of named steps.
 */
export function useStepper<T extends UseStepperArrayStep>(
	steps: MaybeValue<readonly MaybeValue<T>[]>,
	initialStep?: MaybeValue<NoInfer<T>>,
): UseStepperReturn<T, T[], T>;
export function useStepper<T extends UseStepperObjectSteps>(
	steps: MaybeValue<T>,
	initialStep?: MaybeValue<NoInfer<UseStepperObjectStepName<T>>>,
): UseStepperReturn<
	UseStepperObjectStepName<T>,
	UseStepperResolvedObject<T>,
	UseStepperObjectStepValue<T, UseStepperObjectStepName<T>>
>;
export function useStepper(
	sourceSteps: MaybeValue<
		readonly MaybeValue<UseStepperArrayStep>[] | UseStepperObjectSteps
	>,
	initialStep?: MaybeValue<UseStepperArrayStep>,
): UseStepperReturn<UseStepperArrayStep, unknown, unknown> {
	const stepsValue = computed(() => resolveSteps(sourceSteps));
	const stepNamesValue = computed(() => getStepNames(stepsValue.value));
	const initialStepName =
		initialStep === undefined ? undefined : resolveValue(initialStep);
	const currentStepName = signal<UseStepperArrayStep | undefined>(
		initialStepName !== undefined &&
			findStepIndex(stepNamesValue.value, initialStepName) >= 0
			? initialStepName
			: stepNamesValue.value[0],
	);

	const setCurrentStepByIndex = (nextIndex: number): void => {
		const stepName = stepNamesValue.value[nextIndex];
		if (stepName !== undefined) {
			currentStepName.value = stepName;
		}
	};
	const getCurrentIndex = (): number => {
		const stepName = currentStepName.value;
		if (stepName === undefined) {
			return 0;
		}

		const currentIndex = findStepIndex(stepNamesValue.value, stepName);
		return currentIndex < 0 ? 0 : currentIndex;
	};

	const index = computed<number>({
		get: getCurrentIndex,
		set: setCurrentStepByIndex,
	});
	const current = computed(() => at(index.value));
	const next = computed(() => stepNamesValue.value[index.value + 1]);
	const previous = computed(() => stepNamesValue.value[index.value - 1]);
	const isFirst = computed(
		() => stepNamesValue.value.length > 0 && index.value === 0,
	);
	const isLast = computed(
		() =>
			stepNamesValue.value.length > 0 &&
			index.value === stepNamesValue.value.length - 1,
	);

	function at(targetIndex: number): unknown | undefined {
		const stepName = stepNamesValue.value[targetIndex];
		if (stepName === undefined) {
			return undefined;
		}

		const targetSteps = stepsValue.value;
		if (Array.isArray(targetSteps)) {
			return targetSteps[targetIndex];
		}

		return targetSteps[stepName];
	}

	function get(step: UseStepperArrayStep): unknown | undefined {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		if (targetIndex < 0) {
			return undefined;
		}

		return at(targetIndex);
	}

	function goTo(step: UseStepperArrayStep): void {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		if (targetIndex >= 0) {
			currentStepName.value = step;
		}
	}

	function goToNext(): void {
		if (!isLast.value) {
			setCurrentStepByIndex(index.value + 1);
		}
	}

	function goToPrevious(): void {
		if (!isFirst.value) {
			setCurrentStepByIndex(index.value - 1);
		}
	}

	function goBackTo(step: UseStepperArrayStep): void {
		if (isAfter(step)) {
			goTo(step);
		}
	}

	function isNext(step: UseStepperArrayStep): boolean {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		return targetIndex >= 0 && targetIndex === index.value + 1;
	}

	function isPrevious(step: UseStepperArrayStep): boolean {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		return targetIndex >= 0 && targetIndex === index.value - 1;
	}

	function isCurrent(step: UseStepperArrayStep): boolean {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		return targetIndex >= 0 && targetIndex === index.value;
	}

	function isBefore(step: UseStepperArrayStep): boolean {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		return targetIndex >= 0 && index.value < targetIndex;
	}

	function isAfter(step: UseStepperArrayStep): boolean {
		const targetIndex = findStepIndex(stepNamesValue.value, step);
		return targetIndex >= 0 && index.value > targetIndex;
	}

	watch(
		stepNamesValue,
		(stepNames) => {
			if (stepNames.length === 0) {
				currentStepName.value = undefined;
				return;
			}
			if (
				currentStepName.value === undefined ||
				findStepIndex(stepNames, currentStepName.value) < 0
			) {
				currentStepName.value = stepNames[0];
			}
		},
		{ flush: "sync" },
	);

	return {
		at,
		current: readonly(current),
		get,
		goBackTo,
		goTo,
		goToNext,
		goToPrevious,
		index,
		isAfter,
		isBefore,
		isCurrent,
		isFirst: readonly(isFirst),
		isLast: readonly(isLast),
		isNext,
		isPrevious,
		next: readonly(next),
		previous: readonly(previous),
		stepNames: readonly(stepNamesValue),
		steps: readonly(stepsValue),
	};
}
