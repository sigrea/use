import type { DocumentLike, NavigatorLike, WindowLike } from "./types";

export const isClient = typeof window !== "undefined";

export const defaultWindow: WindowLike | undefined = isClient
	? (window as WindowLike)
	: undefined;

export const defaultDocument: DocumentLike | undefined =
	defaultWindow?.document;

export const defaultNavigator: NavigatorLike | undefined =
	defaultWindow?.navigator;
