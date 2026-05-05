import { readonly, signal, watch } from "@sigrea/core";

import { defaultWindow, resolveTarget, resolveValue } from "../../shared";
import type {
	MaybeTarget,
	MaybeValue,
	UseBase64ImageOptions,
	UseBase64ObjectOptions,
	UseBase64Options,
	UseBase64Return,
	UseBase64Source,
	UseBase64WindowLike,
} from "../types";

type Base64SerializableObject =
	| Record<string, unknown>
	| Map<string, unknown>
	| Set<unknown>
	| readonly unknown[];

const dataUrlPrefixRE = /^data:.*?;base64,/;
const binaryChunkSize = 0x8000;

function watchSource<T>(target: MaybeValue<T>): T | object {
	try {
		return resolveValue(target);
	} catch (error) {
		return { error };
	}
}

function isBlob(value: unknown): value is Blob {
	return typeof Blob !== "undefined" && value instanceof Blob;
}

function isArrayBuffer(value: unknown): value is ArrayBuffer {
	return (
		value instanceof ArrayBuffer ||
		Object.prototype.toString.call(value) === "[object ArrayBuffer]"
	);
}

function getCanvasConstructor(windowTarget: UseBase64WindowLike | undefined) {
	return (
		windowTarget?.HTMLCanvasElement ??
		(typeof HTMLCanvasElement !== "undefined" ? HTMLCanvasElement : undefined)
	);
}

function getImageConstructor(windowTarget: UseBase64WindowLike | undefined) {
	return (
		windowTarget?.HTMLImageElement ??
		(typeof HTMLImageElement !== "undefined" ? HTMLImageElement : undefined)
	);
}

function isCanvasElement(
	value: unknown,
	windowTarget: UseBase64WindowLike | undefined,
): value is HTMLCanvasElement {
	const CanvasConstructor = getCanvasConstructor(windowTarget);

	return CanvasConstructor !== undefined && value instanceof CanvasConstructor;
}

function isImageElement(
	value: unknown,
	windowTarget: UseBase64WindowLike | undefined,
): value is HTMLImageElement {
	const ImageConstructor = getImageConstructor(windowTarget);

	return ImageConstructor !== undefined && value instanceof ImageConstructor;
}

function getDefaultSerialization<T extends Base64SerializableObject>(
	target: T,
) {
	if (target instanceof Map) {
		return (value: T) =>
			JSON.stringify(Object.fromEntries(value as Map<string, unknown>));
	}

	if (target instanceof Set) {
		return (value: T) => JSON.stringify(Array.from(value as Set<unknown>));
	}

	return (value: T) => JSON.stringify(value);
}

function binaryStringFromBytes(bytes: Uint8Array): string {
	let binary = "";
	for (let index = 0; index < bytes.length; index += binaryChunkSize) {
		binary += String.fromCharCode(
			...bytes.subarray(index, index + binaryChunkSize),
		);
	}

	return binary;
}

function encodeBytes(
	bytes: Uint8Array,
	windowTarget: UseBase64WindowLike | undefined,
): string {
	const encode =
		windowTarget?.btoa ??
		(typeof globalThis.btoa === "function"
			? globalThis.btoa.bind(globalThis)
			: undefined);

	if (encode === undefined) {
		throw new Error("base64 encoding is not supported");
	}

	return encode(binaryStringFromBytes(bytes));
}

function arrayBufferToBase64(
	buffer: ArrayBuffer,
	windowTarget: UseBase64WindowLike | undefined,
): string {
	return encodeBytes(new Uint8Array(buffer), windowTarget);
}

async function blobToDataUrl(
	blob: Blob,
	windowTarget: UseBase64WindowLike | undefined,
): Promise<string> {
	const FileReaderConstructor =
		windowTarget?.FileReader ??
		(typeof FileReader !== "undefined" ? FileReader : undefined);

	if (FileReaderConstructor !== undefined) {
		return new Promise((resolve, reject) => {
			const reader = new FileReaderConstructor();
			reader.onload = (event) => {
				resolve(event.target?.result as string);
			};
			reader.onerror = reject;
			reader.readAsDataURL(blob);
		});
	}

	const base64 = arrayBufferToBase64(await blob.arrayBuffer(), windowTarget);

	return `data:${blob.type};base64,${base64}`;
}

function imageLoaded(image: HTMLImageElement): Promise<void> {
	return new Promise((resolve, reject) => {
		if (image.complete) {
			resolve();
			return;
		}

		image.onload = () => {
			resolve();
		};
		image.onerror = reject;
	});
}

async function imageToDataUrl(
	image: HTMLImageElement,
	options: UseBase64ImageOptions,
	windowTarget: UseBase64WindowLike | undefined,
): Promise<string> {
	const documentTarget =
		windowTarget?.document ??
		(typeof document !== "undefined" ? document : undefined);

	if (documentTarget === undefined) {
		throw new Error("document is not available");
	}

	const clone = image.cloneNode(false) as HTMLImageElement;
	clone.crossOrigin = "Anonymous";
	await imageLoaded(clone);

	const canvas = documentTarget.createElement("canvas") as HTMLCanvasElement;
	const context = canvas.getContext("2d");
	if (context === null) {
		throw new Error("canvas 2d context is not available");
	}

	canvas.width = clone.width;
	canvas.height = clone.height;
	context.drawImage(clone, 0, 0, canvas.width, canvas.height);

	return canvas.toDataURL(options.type, options.quality);
}

async function toBase64(
	target: UseBase64Source,
	options:
		| UseBase64Options
		| UseBase64ImageOptions
		| UseBase64ObjectOptions<Base64SerializableObject>,
	windowTarget: UseBase64WindowLike | undefined,
): Promise<string> {
	if (target == null) {
		return "";
	}

	if (typeof target === "string") {
		return blobToDataUrl(
			new Blob([target], { type: "text/plain" }),
			windowTarget,
		);
	}

	if (isBlob(target)) {
		return blobToDataUrl(target, windowTarget);
	}

	if (isArrayBuffer(target)) {
		return arrayBufferToBase64(target, windowTarget);
	}

	if (isCanvasElement(target, windowTarget)) {
		const imageOptions = options as UseBase64ImageOptions;

		return target.toDataURL(imageOptions.type, imageOptions.quality);
	}

	if (isImageElement(target, windowTarget)) {
		return imageToDataUrl(
			target,
			options as UseBase64ImageOptions,
			windowTarget,
		);
	}

	if (typeof target === "object") {
		const objectOptions =
			options as UseBase64ObjectOptions<Base64SerializableObject>;
		const serialize =
			objectOptions.serializer ?? getDefaultSerialization(target);
		const serialized = serialize(target);

		return blobToDataUrl(
			new Blob([serialized], { type: "application/json" }),
			windowTarget,
		);
	}

	throw new Error("target is unsupported types");
}

export function useBase64(
	target: MaybeValue<string | null | undefined>,
	options?: UseBase64Options,
): UseBase64Return;
export function useBase64(
	target: MaybeValue<Blob | null | undefined>,
	options?: UseBase64Options,
): UseBase64Return;
export function useBase64(
	target: MaybeValue<ArrayBuffer | null | undefined>,
	options?: UseBase64Options,
): UseBase64Return;
export function useBase64(
	target: MaybeValue<HTMLCanvasElement | null | undefined>,
	options?: UseBase64ImageOptions,
): UseBase64Return;
export function useBase64(
	target: MaybeValue<HTMLImageElement | null | undefined>,
	options?: UseBase64ImageOptions,
): UseBase64Return;
export function useBase64<T extends Record<string, unknown>>(
	target: MaybeValue<T | null | undefined>,
	options?: UseBase64ObjectOptions<T>,
): UseBase64Return;
export function useBase64<T extends Map<string, unknown>>(
	target: MaybeValue<T | null | undefined>,
	options?: UseBase64ObjectOptions<T>,
): UseBase64Return;
export function useBase64<T extends Set<unknown>>(
	target: MaybeValue<T | null | undefined>,
	options?: UseBase64ObjectOptions<T>,
): UseBase64Return;
export function useBase64<T>(
	target: MaybeValue<readonly T[] | null | undefined>,
	options?: UseBase64ObjectOptions<readonly T[]>,
): UseBase64Return;
/**
 * Reactive base64 conversion.
 *
 * @param target Source value to convert.
 * @param options Base64 conversion options.
 */
export function useBase64(
	target: MaybeValue<UseBase64Source>,
	options:
		| UseBase64Options
		| UseBase64ImageOptions
		| UseBase64ObjectOptions<Base64SerializableObject> = {},
): UseBase64Return {
	const windowTarget =
		options.window ??
		(defaultWindow as MaybeTarget<UseBase64WindowLike> | undefined);
	const base64 = signal("");
	const promise = signal<Promise<string> | undefined>(undefined);
	let executionCount = 0;

	const currentWindow = () =>
		windowTarget === undefined
			? undefined
			: resolveTarget<UseBase64WindowLike>(windowTarget);

	const execute = () => {
		executionCount += 1;
		const executionId = executionCount;
		const nextPromise = Promise.resolve().then(() =>
			toBase64(resolveValue(target), options, currentWindow()),
		);
		promise.value = nextPromise;

		nextPromise.then(
			(result) => {
				if (executionId === executionCount) {
					base64.value =
						options.dataUrl === false
							? result.replace(dataUrlPrefixRE, "")
							: result;
				}
			},
			() => {},
		);

		return nextPromise;
	};

	watch(
		() => watchSource(target),
		() => {
			void execute();
		},
		{ immediate: true, flush: "sync" },
	);

	return {
		base64: readonly(base64),
		promise: readonly(promise),
		execute,
	};
}
