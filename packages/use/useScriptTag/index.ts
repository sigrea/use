import { readonly, signal } from "@sigrea/core";

import { defaultDocument, resolveTarget, resolveValue } from "../../shared";
import { tryOnScopeDispose } from "../tryOnScopeDispose";
import type {
	MaybeTarget,
	MaybeValue,
	UseScriptTagDocumentLike,
	UseScriptTagOptions,
	UseScriptTagReturn,
} from "../types";

interface ActiveScriptLoad {
	src: string;
	document: UseScriptTagDocumentLike;
	element: HTMLScriptElement;
	promise: Promise<HTMLScriptElement | false>;
	resolve(value: HTMLScriptElement | false): void;
	reject(reason: unknown): void;
	cleanup(): void;
	settled: boolean;
}

function isUsableDocument(
	document: UseScriptTagDocumentLike | null | undefined,
): document is UseScriptTagDocumentLike & { readonly head: HTMLHeadElement } {
	return (
		document?.head !== null &&
		document?.head !== undefined &&
		typeof document.createElement === "function" &&
		typeof document.querySelectorAll === "function"
	);
}

function findScript(
	document: UseScriptTagDocumentLike,
	src: string,
): HTMLScriptElement | null {
	const scripts =
		typeof document.querySelectorAll === "function"
			? document.querySelectorAll<HTMLScriptElement>("script[src]")
			: [];

	for (const script of Array.from(scripts)) {
		if (script.getAttribute("src") === src || script.src === src) {
			return script;
		}
	}

	return null;
}

function applyScriptOptions(
	script: HTMLScriptElement,
	options: Required<Pick<UseScriptTagOptions, "async" | "attrs" | "type">> &
		Omit<UseScriptTagOptions, "async" | "attrs" | "document" | "type">,
): void {
	for (const [name, value] of Object.entries(options.attrs)) {
		script.setAttribute(name, value);
	}

	script.type = options.type;
	script.async = options.async;

	if (options.defer !== undefined) {
		script.defer = options.defer;
	}
	if (options.crossOrigin !== undefined) {
		script.crossOrigin = options.crossOrigin;
	}
	if (options.referrerPolicy !== undefined) {
		script.referrerPolicy = options.referrerPolicy;
	}
	if (options.noModule !== undefined) {
		script.noModule = options.noModule;
	}
	if (options.nonce !== undefined) {
		script.nonce = options.nonce;
	}
}

function createActiveLoad(
	document: UseScriptTagDocumentLike,
	src: string,
	element: HTMLScriptElement,
	onLoad: (load: ActiveScriptLoad) => void,
	onError: (load: ActiveScriptLoad, event: Event) => void,
): ActiveScriptLoad {
	let resolve!: (value: HTMLScriptElement | false) => void;
	let reject!: (reason: unknown) => void;
	const promise = new Promise<HTMLScriptElement | false>(
		(resolvePromise, rejectPromise) => {
			resolve = resolvePromise;
			reject = rejectPromise;
		},
	);
	const load = {
		cleanup: () => {},
		document,
		element,
		promise,
		reject,
		resolve,
		settled: false,
		src,
	} satisfies ActiveScriptLoad;
	const handleLoad = () => {
		onLoad(load);
	};
	const handleError = (event: Event) => {
		onError(load, event);
	};

	element.addEventListener("load", handleLoad, { passive: true });
	element.addEventListener("error", handleError, { passive: true });
	element.addEventListener("abort", handleError, { passive: true });
	load.cleanup = () => {
		element.removeEventListener("load", handleLoad);
		element.removeEventListener("error", handleError);
		element.removeEventListener("abort", handleError);
	};

	return load;
}

function resolveLoad(
	load: ActiveScriptLoad,
	value: HTMLScriptElement | false,
): void {
	if (load.settled) {
		return;
	}

	load.settled = true;
	load.resolve(value);
}

function rejectLoad(load: ActiveScriptLoad, reason: unknown): void {
	if (load.settled) {
		return;
	}

	load.settled = true;
	load.reject(reason);
}

/**
 * Async script tag loading.
 */
export function useScriptTag<
	TDocument extends UseScriptTagDocumentLike = UseScriptTagDocumentLike,
>(
	src: MaybeValue<string>,
	onLoaded: (element: HTMLScriptElement) => void = () => {},
	options: UseScriptTagOptions<TDocument> = {},
): UseScriptTagReturn {
	const {
		async = true,
		attrs = {},
		crossOrigin,
		defer,
		immediate = true,
		manual = false,
		noModule,
		nonce,
		referrerPolicy,
		type = "text/javascript",
	} = options;
	const documentTarget =
		"document" in options && options.document !== undefined
			? options.document
			: (defaultDocument as MaybeTarget<TDocument> | undefined);
	const scriptTag = signal<HTMLScriptElement | null>(null);
	const createdScripts = new WeakSet<HTMLScriptElement>();
	const managedScripts = new Set<HTMLScriptElement>();
	let activeLoad: ActiveScriptLoad | null = null;

	const currentDocument = () =>
		documentTarget === undefined
			? undefined
			: resolveTarget<TDocument | null | undefined>(documentTarget);
	const cleanupActiveLoad = () => {
		if (activeLoad === null) {
			return;
		}

		const load = activeLoad;
		activeLoad = null;
		load.cleanup();
		resolveLoad(load, false);
	};
	const removeManagedScript = (element: HTMLScriptElement) => {
		managedScripts.delete(element);
		if (createdScripts.has(element)) {
			element.remove();
			createdScripts.delete(element);
		}
	};
	const removeAllManagedScripts = () => {
		for (const managedScript of [...managedScripts]) {
			removeManagedScript(managedScript);
		}
	};
	const removeStaleManagedScripts = (
		document: UseScriptTagDocumentLike,
		src: string,
	) => {
		for (const managedScript of [...managedScripts]) {
			if (
				managedScript.ownerDocument !== document ||
				(managedScript.getAttribute("src") !== src && managedScript.src !== src)
			) {
				removeManagedScript(managedScript);
			}
		}
	};
	const clearActiveLoad = (load: ActiveScriptLoad) => {
		if (activeLoad !== load) {
			return;
		}

		activeLoad = null;
		load.cleanup();
	};
	const loadScript = (
		waitForScriptLoad: boolean,
	): Promise<HTMLScriptElement | false> => {
		const document = currentDocument();
		const nextSrc = resolveValue(src);

		if (!isUsableDocument(document)) {
			cleanupActiveLoad();
			removeAllManagedScripts();
			scriptTag.value = null;
			return Promise.resolve(false);
		}

		if (
			activeLoad !== null &&
			activeLoad.document === document &&
			activeLoad.src === nextSrc
		) {
			return activeLoad.promise;
		}

		const previousActiveElement = activeLoad?.element;
		cleanupActiveLoad();
		if (previousActiveElement !== undefined) {
			removeManagedScript(previousActiveElement);
		}
		removeStaleManagedScripts(document, nextSrc);

		let shouldAppend = false;
		let element = findScript(document, nextSrc);
		if (element === null) {
			element = document.createElement("script");
			applyScriptOptions(element, {
				async,
				attrs,
				crossOrigin,
				defer,
				noModule,
				nonce,
				referrerPolicy,
				type,
			});
			createdScripts.add(element);
			managedScripts.add(element);
			shouldAppend = true;
		}

		if (element.getAttribute("data-loaded") === "true") {
			scriptTag.value = element;
			return Promise.resolve(element);
		}

		const load = createActiveLoad(
			document,
			nextSrc,
			element,
			(currentLoad) => {
				currentLoad.element.setAttribute("data-loaded", "true");
				if (activeLoad === currentLoad) {
					scriptTag.value = currentLoad.element;
					onLoaded(currentLoad.element);
				}
				clearActiveLoad(currentLoad);
				resolveLoad(currentLoad, currentLoad.element);
			},
			(currentLoad, event) => {
				if (activeLoad === currentLoad) {
					scriptTag.value = null;
					clearActiveLoad(currentLoad);
				} else {
					currentLoad.cleanup();
				}
				rejectLoad(currentLoad, event);
			},
		);
		activeLoad = load;

		if (shouldAppend) {
			document.head.appendChild(element);
			element.src = nextSrc;
		}

		if (!waitForScriptLoad) {
			scriptTag.value = element;
			resolveLoad(load, element);
		}

		return load.promise;
	};
	const load = (waitForScriptLoad = true): Promise<HTMLScriptElement | false> =>
		loadScript(waitForScriptLoad);
	const unload = () => {
		const document = currentDocument();
		const nextSrc = resolveValue(src);

		cleanupActiveLoad();
		scriptTag.value = null;

		if (!isUsableDocument(document)) {
			removeAllManagedScripts();
			return;
		}

		const element = findScript(document, nextSrc);
		if (element !== null) {
			removeManagedScript(element);
		}

		removeAllManagedScripts();
	};

	if (!manual) {
		if (immediate) {
			void load().catch(() => {});
		}
		tryOnScopeDispose(unload);
	}

	return {
		scriptTag: readonly(scriptTag),
		load,
		unload,
	};
}
