export {
	defaultDocument,
	defaultNavigator,
	defaultWindow,
	isClient,
} from "./environment";
export { listen } from "./listen";
export type { TargetEventMap } from "./listen";
export { resolveTarget } from "./resolveTarget";
export { resolveValue } from "./resolveValue";
export * from "./types";
export { watchMediaQuery } from "./watchMediaQuery";
export type {
	MatchMediaWindow,
	WatchMediaQueryCallback,
	WatchMediaQueryOptions,
} from "./watchMediaQuery";
export { watchTarget } from "./watchTarget";
export type {
	WatchTargetCallback,
	WatchTargetOptions,
} from "./watchTarget";
