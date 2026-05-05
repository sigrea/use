// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

describe("SSR safety", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.computedAsync).toBe("function");
		expect(typeof mod.computedEager).toBe("function");
		expect(typeof mod.computedWithControl).toBe("function");
		expect(typeof mod.createEventHook).toBe("function");
		expect(typeof mod.createSignal).toBe("function");
		expect(typeof mod.createResolveValueFn).toBe("function");
		expect(typeof mod.extendSignal).toBe("function");
		expect(typeof mod.isDefined).toBe("function");
		expect(typeof mod.makeDestructurable).toBe("function");
		expect(typeof mod.resolveValue).toBe("function");
		expect(typeof mod.useCounter).toBe("function");
		expect(typeof mod.onClickOutside).toBe("function");
		expect(typeof mod.onElementRemoval).toBe("function");
		expect(typeof mod.onKeyDown).toBe("function");
		expect(typeof mod.onKeyPressed).toBe("function");
		expect(typeof mod.onKeyStroke).toBe("function");
		expect(typeof mod.onKeyUp).toBe("function");
		expect(typeof mod.onLongPress).toBe("function");
		expect(typeof mod.onStartTyping).toBe("function");
		expect(typeof mod.reactify).toBe("function");
		expect(typeof mod.reactifyObject).toBe("function");
		expect(typeof mod.reactiveComputed).toBe("function");
		expect(typeof mod.reactiveOmit).toBe("function");
		expect(typeof mod.reactivePick).toBe("function");
		expect(typeof mod.signalAutoReset).toBe("function");
		expect(typeof mod.signalDefault).toBe("function");
		expect(typeof mod.signalDebounced).toBe("function");
		expect(typeof mod.signalManualReset).toBe("function");
		expect(typeof mod.signalThrottled).toBe("function");
		expect(typeof mod.syncSignal).toBe("function");
		expect(typeof mod.syncSignals).toBe("function");
		expect(typeof mod.toDeepSignal).toBe("function");
		expect(typeof mod.tryOnScopeDispose).toBe("function");
		expect(typeof mod.until).toBe("function");
		expect(typeof mod.useActiveElement).toBe("function");
		expect(typeof mod.useAnimate).toBe("function");
		expect(typeof mod.useArrayDifference).toBe("function");
		expect(typeof mod.useArrayEvery).toBe("function");
		expect(typeof mod.useArrayFilter).toBe("function");
		expect(typeof mod.useArrayFind).toBe("function");
		expect(typeof mod.useArrayFindIndex).toBe("function");
		expect(typeof mod.useArrayFindLast).toBe("function");
		expect(typeof mod.useArrayIncludes).toBe("function");
		expect(typeof mod.useArrayJoin).toBe("function");
		expect(typeof mod.useArrayMap).toBe("function");
		expect(typeof mod.useArrayReduce).toBe("function");
		expect(typeof mod.useArraySome).toBe("function");
		expect(typeof mod.useArrayUnique).toBe("function");
		expect(typeof mod.useAsyncQueue).toBe("function");
		expect(typeof mod.useAsyncState).toBe("function");
		expect(typeof mod.useBase64).toBe("function");
		expect(typeof mod.useBattery).toBe("function");
		expect(typeof mod.useBluetooth).toBe("function");
		expect(typeof mod.useBroadcastChannel).toBe("function");
		expect(typeof mod.useBrowserLocation).toBe("function");
		expect(typeof mod.useCached).toBe("function");
		expect(typeof mod.useClipboard).toBe("function");
		expect(typeof mod.useClipboardItems).toBe("function");
		expect(typeof mod.useCloned).toBe("function");
		expect(typeof mod.useColorMode).toBe("function");
		expect(typeof mod.useConfirmDialog).toBe("function");
		expect(typeof mod.useCountdown).toBe("function");
		expect(typeof mod.useCssSupports).toBe("function");
		expect(typeof mod.useCssVar).toBe("function");
		expect(typeof mod.useCycleList).toBe("function");
		expect(typeof mod.useDark).toBe("function");
		expect(typeof mod.useDateFormat).toBe("function");
		expect(typeof mod.formatDate).toBe("function");
		expect(typeof mod.normalizeDate).toBe("function");
		expect(typeof mod.useDebouncedRefHistory).toBe("function");
		expect(typeof mod.useDeviceMotion).toBe("function");
		expect(typeof mod.useDeviceOrientation).toBe("function");
		expect(typeof mod.useDevicePixelRatio).toBe("function");
		expect(typeof mod.useDevicesList).toBe("function");
		expect(typeof mod.useDisplayMedia).toBe("function");
		expect(typeof mod.useBreakpoints).toBe("function");
		expect(typeof mod.useDocumentVisibility).toBe("function");
		expect(typeof mod.useDraggable).toBe("function");
		expect(typeof mod.useDropZone).toBe("function");
		expect(typeof mod.useElementBounding).toBe("function");
		expect(typeof mod.useElementByPoint).toBe("function");
		expect(typeof mod.useElementHover).toBe("function");
		expect(typeof mod.useElementSize).toBe("function");
		expect(typeof mod.useElementVisibility).toBe("function");
		expect(typeof mod.useEventBus).toBe("function");
		expect(typeof mod.useEventListener).toBe("function");
		expect(typeof mod.useEventSource).toBe("function");
		expect(typeof mod.useEyeDropper).toBe("function");
		expect(typeof mod.useFavicon).toBe("function");
		expect(typeof mod.useFetch).toBe("function");
		expect(typeof mod.useFileDialog).toBe("function");
		expect(typeof mod.useFileSystemAccess).toBe("function");
		expect(typeof mod.useFocus).toBe("function");
		expect(typeof mod.useFocusWithin).toBe("function");
		expect(typeof mod.useInterval).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useLocalStorage).toBe("function");
		expect(typeof mod.useManualRefHistory).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useMouse).toBe("function");
		expect(typeof mod.useOnline).toBe("function");
		expect(typeof mod.usePreferredDark).toBe("function");
		expect(typeof mod.usePrevious).toBe("function");
		expect(typeof mod.useRefHistory).toBe("function");
		expect(typeof mod.useSessionStorage).toBe("function");
		expect(typeof mod.useStorage).toBe("function");
		expect(typeof mod.useTimeout).toBe("function");
		expect(typeof mod.useTimeoutFn).toBe("function");
		expect(typeof mod.useToggle).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
	}, 10_000);

	it("creates browser composables without a window", async () => {
		const {
			onClickOutside,
			useBreakpoints,
			useDocumentVisibility,
			useElementSize,
			useEventListener,
			useFocus,
			useColorMode,
			useCssSupports,
			useCssVar,
			useDark,
			useDevicesList,
			useDisplayMedia,
			useDraggable,
			useDropZone,
			useElementBounding,
			useElementByPoint,
			useElementHover,
			useElementVisibility,
			useLocalStorage,
			useEventSource,
			useEyeDropper,
			useFavicon,
			useFetch,
			useFileDialog,
			useFileSystemAccess,
			useMediaQuery,
			useFocusWithin,
			useMouse,
			useOnline,
			usePreferredDark,
			onElementRemoval,
			onKeyDown,
			onKeyPressed,
			onKeyStroke,
			onKeyUp,
			onLongPress,
			onStartTyping,
			useSessionStorage,
			useStorage,
			useWindowSize,
			useActiveElement,
			useAnimate,
		} = await import("../../../index");

		const active = useActiveElement();
		const animation = useAnimate(null, null);
		const breakpoints = useBreakpoints({ md: 768 }, { ssrWidth: 800 });
		const colorMode = useColorMode({
			document: null,
			initialValue: "dark",
			window: null,
		});
		const dark = useDark({
			document: null,
			initialValue: "dark",
			window: null,
		});
		const visibility = useDocumentVisibility();
		const listener = useEventListener("resize", () => {});
		const localStorageValue = useLocalStorage("local", "fallback", {
			window: undefined,
		});
		const outside = onClickOutside(null, () => {});
		const removal = onElementRemoval(null, () => {});
		const keyStroke = onKeyStroke("Escape", () => {});
		const keyDown = onKeyDown("Escape", () => {});
		const keyPressed = onKeyPressed("Enter", () => {});
		const keyUp = onKeyUp("Shift", () => {});
		const longPress = onLongPress(null, () => {});
		const startTyping = onStartTyping(() => {});
		const focus = useFocus(null);
		const focusWithin = useFocusWithin(null);
		const mouse = useMouse();
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const online = useOnline();
		const preferredDark = usePreferredDark();
		const cssSupports = useCssSupports("display", "grid", { window: null });
		const initialCssSupports = useCssSupports("display: grid", {
			initialValue: true,
			window: null,
		});
		const cssVar = useCssVar("--color", null, {
			initialValue: "red",
			observe: true,
			window: null,
		});
		const devicesList = useDevicesList({ navigator: null });
		const displayMedia = useDisplayMedia({ navigator: null });
		const draggable = useDraggable(null, { initialValue: { x: 10, y: 20 } });
		const dropZone = useDropZone(null);
		const bounding = useElementBounding(null, {
			updateTiming: "next-frame",
			window: null,
		});
		const point = useElementByPoint({
			document: null,
			immediate: false,
			x: 0,
			y: 0,
		});
		const points = useElementByPoint<true>({
			document: null,
			immediate: false,
			multiple: true,
			x: 0,
			y: 0,
		});
		const hover = useElementHover(null);
		const elementVisibility = useElementVisibility(null, { window: null });
		const initialElementVisibility = useElementVisibility(null, {
			initialValue: true,
			window: null,
		});
		const eventSource = useEventSource("https://example.com/events");
		const eyeDropper = useEyeDropper();
		const favicon = useFavicon("favicon.ico", { document: null });
		const fileDialog = useFileDialog({ document: null });
		const fileSystemAccess = useFileSystemAccess({ window: null });
		const fetchValue = useFetch("https://example.com", {
			fetch: async () => new Response("ok"),
			immediate: false,
		}).text();
		const sessionStorageValue = useSessionStorage("session", "fallback", {
			window: undefined,
		});
		const ssrMediaQuery = useMediaQuery("(min-width: 640px)", {
			ssrWidth: 800,
		});
		const storageValue = useStorage("storage", "fallback", undefined, {
			window: undefined,
		});
		const elementSize = useElementSize(null, { width: 10, height: 20 });
		const size = useWindowSize();

		expect(active.activeElement.value).toBeUndefined();
		expect(animation.isSupported.value).toBe(false);
		expect(animation.animate.value).toBeUndefined();
		expect(breakpoints.md.matches.value).toBe(true);
		expect(colorMode.mode.value).toBe("dark");
		expect(colorMode.system.value).toBe("light");
		expect(colorMode.resolvedMode.value).toBe("dark");
		expect(dark.value).toBe(true);
		expect(visibility.visibility.value).toBe("visible");
		expect(localStorageValue.value).toBe("fallback");
		expect(focus.focused.value).toBe(false);
		expect(focusWithin.focused.value).toBe(false);
		expect(mouse.x.value).toBe(0);
		expect(mouse.y.value).toBe(0);
		expect(mediaQuery.matches.value).toBe(false);
		expect(online.isOnline.value).toBe(true);
		expect(preferredDark.matches.value).toBe(false);
		expect(cssSupports.value).toBe(false);
		expect(initialCssSupports.value).toBe(true);
		expect(cssVar.value).toBe("red");
		expect(devicesList.isSupported.value).toBe(false);
		expect(devicesList.devices.value).toEqual([]);
		expect(displayMedia.isSupported.value).toBe(false);
		expect(displayMedia.stream.value).toBeUndefined();
		expect(draggable.position.value).toEqual({ x: 10, y: 20 });
		expect(draggable.isDragging.value).toBe(false);
		expect(dropZone.files.value).toBeNull();
		expect(dropZone.isOverDropZone.value).toBe(false);
		expect(bounding.width.value).toBe(0);
		expect(bounding.height.value).toBe(0);
		expect(bounding.top.value).toBe(0);
		expect(bounding.right.value).toBe(0);
		expect(bounding.bottom.value).toBe(0);
		expect(bounding.left.value).toBe(0);
		expect(bounding.x.value).toBe(0);
		expect(bounding.y.value).toBe(0);
		expect(point.isSupported.value).toBe(false);
		expect(point.element.value).toBeNull();
		expect(points.isSupported.value).toBe(false);
		expect(points.element.value).toEqual([]);
		expect(hover.isHovered.value).toBe(false);
		expect(elementVisibility.isVisible.value).toBe(false);
		expect(elementVisibility.isSupported.value).toBe(false);
		expect(initialElementVisibility.isVisible.value).toBe(true);
		expect(initialElementVisibility.isSupported.value).toBe(false);
		expect(eventSource.isSupported.value).toBe(false);
		expect(eventSource.status.value).toBe("CLOSED");
		expect(eventSource.eventSource.value).toBeUndefined();
		expect(eyeDropper.isSupported.value).toBe(false);
		expect(eyeDropper.isOpen.value).toBe(false);
		expect(eyeDropper.sRGBHex.value).toBe("");
		expect(eyeDropper.error.value).toBeNull();
		expect(favicon.value).toBe("favicon.ico");
		expect(fileDialog.files.value).toBeNull();
		expect(fileSystemAccess.isSupported.value).toBe(false);
		expect(fileSystemAccess.data.value).toBeUndefined();
		expect(fileSystemAccess.file.value).toBeUndefined();
		expect(fileSystemAccess.fileName.value).toBe("");
		expect(fileSystemAccess.fileMIME.value).toBe("");
		expect(fileSystemAccess.fileSize.value).toBe(0);
		expect(fileSystemAccess.fileLastModified.value).toBe(0);
		expect(fileSystemAccess.error.value).toBeNull();
		expect(fetchValue.data.value).toBeNull();
		expect(sessionStorageValue.value).toBe("fallback");
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(storageValue.value).toBe("fallback");
		expect(elementSize.width.value).toBe(10);
		expect(elementSize.height.value).toBe(20);
		expect(size.width.value).toBe(0);
		expect(size.height.value).toBe(0);

		active.stop();
		animation.play();
		animation.pause();
		animation.reverse();
		animation.finish();
		animation.cancel();
		animation.stop();
		breakpoints.md.stop();
		colorMode.stop();
		dark.stop();
		visibility.stop();
		listener.stop();
		localStorageValue.stop();
		outside();
		removal();
		keyStroke();
		keyDown();
		keyPressed();
		keyUp();
		longPress();
		startTyping();
		focus.stop();
		focusWithin.stop();
		mouse.stop();
		mediaQuery.stop();
		online.stop();
		preferredDark.stop();
		cssVar.value = "blue";
		expect(cssVar.value).toBe("blue");
		cssVar.stop();
		expect(await devicesList.ensurePermissions()).toBe(false);
		devicesList.stop();
		expect(await displayMedia.start()).toBeUndefined();
		displayMedia.stop();
		draggable.stop();
		dropZone.stop();
		bounding.update();
		bounding.stop();
		point.resume();
		point.pause();
		point.stop();
		points.stop();
		hover.stop();
		elementVisibility.stop();
		initialElementVisibility.stop();
		eventSource.open();
		eventSource.close();
		eventSource.stop();
		expect(await eyeDropper.open()).toBeUndefined();
		eyeDropper.abort();
		eyeDropper.stop();
		favicon.value = "next.ico";
		expect(favicon.value).toBe("next.ico");
		favicon.stop();
		fileDialog.open();
		fileDialog.reset();
		fileDialog.stop();
		await fileSystemAccess.open();
		await fileSystemAccess.create();
		await fileSystemAccess.save();
		await fileSystemAccess.saveAs();
		await fileSystemAccess.updateData();
		fileSystemAccess.stop();
		expect(await fetchValue.execute()).toBeInstanceOf(Response);
		expect(fetchValue.data.value).toBe("ok");
		expect(fetchValue.statusCode.value).toBe(200);
		fetchValue.abort();
		fetchValue.stop();
		sessionStorageValue.stop();
		ssrMediaQuery.stop();
		storageValue.stop();
		elementSize.stop();
		size.stop();
	});

	it("creates computedAsync without a window", async () => {
		const { computedAsync } = await import("../../../index");
		const value = computedAsync(async () => "ready", "initial");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	});

	it("creates computedEager without a window", async () => {
		const { computedEager } = await import("../../../index");
		const value = computedEager(() => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});

	it("creates computedWithControl without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { computedWithControl } = await import("../../../index");
		const source = signal(0);
		const value = computedWithControl(source, () => "ready");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
	});

	it("creates useArrayDifference without a window", async () => {
		const { useArrayDifference } = await import("../../../index");
		const result = useArrayDifference([1, 2, 3], [2]);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([1, 3]);
	});

	it("creates useArrayEvery without a window", async () => {
		const { useArrayEvery } = await import("../../../index");
		const result = useArrayEvery([1, 2, 3], (value) => value > 0);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(true);
	});

	it("creates useArrayFilter without a window", async () => {
		const { useArrayFilter } = await import("../../../index");
		const result = useArrayFilter([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([2, 3]);
	});

	it("creates useArrayFind without a window", async () => {
		const { useArrayFind } = await import("../../../index");
		const result = useArrayFind([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(2);
	});

	it("creates useArrayFindIndex without a window", async () => {
		const { useArrayFindIndex } = await import("../../../index");
		const result = useArrayFindIndex([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(1);
	});

	it("creates useArrayFindLast without a window", async () => {
		const { useArrayFindLast } = await import("../../../index");
		const result = useArrayFindLast([1, 2, 3], (value) => value > 1);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(3);
	});

	it("creates useArrayIncludes without a window", async () => {
		const { useArrayIncludes } = await import("../../../index");
		const result = useArrayIncludes([1, 2, 3], 2);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(true);
	});

	it("creates useArrayJoin without a window", async () => {
		const { useArrayJoin } = await import("../../../index");
		const result = useArrayJoin([1, 2, 3], "-");

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe("1-2-3");
	});

	it("creates useDateFormat without a window", async () => {
		const { useDateFormat } = await import("../../../index");
		const result = useDateFormat(new Date(2022, 0, 1, 10, 24, 0));

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe("10:24:00");
	});

	it("creates useArrayMap without a window", async () => {
		const { useArrayMap } = await import("../../../index");
		const result = useArrayMap([1, 2, 3], (value) => value * 2);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([2, 4, 6]);
	});

	it("creates useArrayReduce without a window", async () => {
		const { useArrayReduce } = await import("../../../index");
		const result = useArrayReduce([1, 2, 3], (sum, value) => sum + value, 0);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(6);
	});

	it("creates useArraySome without a window", async () => {
		const { useArraySome } = await import("../../../index");
		const result = useArraySome([1, 2, 3], (value) => value > 2);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe(true);
	});

	it("creates useArrayUnique without a window", async () => {
		const { useArrayUnique } = await import("../../../index");
		const result = useArrayUnique([1, 2, 2, 3]);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toEqual([1, 2, 3]);
	});

	it("creates useCycleList without a window", async () => {
		const { useCycleList } = await import("../../../index");
		const result = useCycleList(["foo", "bar"]);

		expect(globalThis.window).toBeUndefined();
		expect(result.state.value).toBe("foo");
		expect(result.next()).toBe("bar");
		expect(result.index.value).toBe(1);
	});

	it("creates useAsyncQueue without a window", async () => {
		const { useAsyncQueue } = await import("../../../index");
		const result = useAsyncQueue([
			() => Promise.resolve(1),
			(value: number) => Promise.resolve(value + 1),
		]);

		await vi.waitFor(() => {
			expect(result.activeIndex.value).toBe(1);
		});
		expect(globalThis.window).toBeUndefined();
		expect(result.result.value[1].data).toBe(2);
	});

	it("creates useAsyncState without a window", async () => {
		const { useAsyncState } = await import("../../../index");
		const result = useAsyncState(async () => "ready", "initial", {
			immediate: false,
		});

		expect(globalThis.window).toBeUndefined();
		expect(result.state.value).toBe("initial");

		await result.execute();
		expect(result.state.value).toBe("ready");
	});

	it("creates useBase64 without a window", async () => {
		const { useBase64 } = await import("../../../index");
		const result = useBase64("hello");

		expect(globalThis.window).toBeUndefined();
		await result.promise.value;
		expect(result.base64.value).toBe("data:text/plain;base64,aGVsbG8=");

		await result.execute();
		expect(result.base64.value).toBe("data:text/plain;base64,aGVsbG8=");
	});

	it("creates useBattery without a window", async () => {
		const { useBattery } = await import("../../../index");
		const result = useBattery();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.charging.value).toBe(false);
		expect(result.chargingTime.value).toBe(0);
		expect(result.dischargingTime.value).toBe(0);
		expect(result.level.value).toBe(1);
		result.stop();
	});

	it("creates useBluetooth without a window", async () => {
		const { useBluetooth } = await import("../../../index");
		const result = useBluetooth();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.isConnected.value).toBe(false);
		expect(result.device.value).toBeUndefined();
		expect(result.server.value).toBeUndefined();
		expect(result.error.value).toBeNull();

		await result.requestDevice();
		await result.connect();
		result.disconnect();
		result.stop();
	});

	it("creates useBroadcastChannel without a window", async () => {
		const { useBroadcastChannel } = await import("../../../index");
		const result = useBroadcastChannel({ name: "test" });

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.isClosed.value).toBe(true);
		expect(result.channel.value).toBeUndefined();
		expect(result.data.value).toBeUndefined();
		expect(result.error.value).toBeNull();

		result.postMessage("hello");
		result.close();
		result.stop();
	});

	it("creates useDeviceMotion without a window", async () => {
		const { useDeviceMotion } = await import("../../../index");
		const result = useDeviceMotion();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.requirePermissions.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.acceleration.value).toEqual({ x: null, y: null, z: null });
		expect(result.accelerationIncludingGravity.value).toEqual({
			x: null,
			y: null,
			z: null,
		});
		expect(result.rotationRate.value).toEqual({
			alpha: null,
			beta: null,
			gamma: null,
		});
		expect(result.interval.value).toBe(0);

		await result.ensurePermissions();
		result.stop();
	});

	it("creates useDeviceOrientation without a window", async () => {
		const { useDeviceOrientation } = await import("../../../index");
		const result = useDeviceOrientation();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.requirePermissions.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.isAbsolute.value).toBe(false);
		expect(result.alpha.value).toBeNull();
		expect(result.beta.value).toBeNull();
		expect(result.gamma.value).toBeNull();

		await result.ensurePermissions();
		result.stop();
	});

	it("creates useDevicePixelRatio without a window", async () => {
		const { useDevicePixelRatio } = await import("../../../index");
		const result = useDevicePixelRatio();

		expect(globalThis.window).toBeUndefined();
		expect(result.pixelRatio.value).toBe(1);
		result.stop();
	});

	it("creates useDevicesList without a window", async () => {
		const { useDevicesList } = await import("../../../index");
		const result = useDevicesList();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.permissionGranted.value).toBe(false);
		expect(result.devices.value).toEqual([]);
		expect(result.videoInputs.value).toEqual([]);
		expect(result.audioInputs.value).toEqual([]);
		expect(result.audioOutputs.value).toEqual([]);
		expect(await result.ensurePermissions()).toBe(false);
		result.stop();
	});

	it("creates useDisplayMedia without a window", async () => {
		const { useDisplayMedia } = await import("../../../index");
		const result = useDisplayMedia();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);
		expect(result.stream.value).toBeUndefined();
		expect(result.error.value).toBeNull();
		expect(await result.start()).toBeUndefined();
		result.stop();
	});

	it("creates useDraggable without a window", async () => {
		const { useDraggable } = await import("../../../index");
		const result = useDraggable(null, { initialValue: { x: 10, y: 20 } });

		expect(globalThis.window).toBeUndefined();
		expect(result.x.value).toBe(10);
		expect(result.y.value).toBe(20);
		expect(result.position.value).toEqual({ x: 10, y: 20 });
		expect(result.isDragging.value).toBe(false);
		expect(result.style.value).toBe("left: 10px; top: 20px;");
		result.stop();
	});

	it("creates useBrowserLocation without a window", async () => {
		const { useBrowserLocation } = await import("../../../index");
		const result = useBrowserLocation();

		expect(globalThis.window).toBeUndefined();
		expect(result.trigger.value).toBe("load");
		expect(result.state.value).toBeUndefined();
		expect(result.length.value).toBeUndefined();
		expect(result.origin.value).toBeUndefined();
		expect(result.href.value).toBeUndefined();

		result.hash.value = "#local";
		expect(result.hash.value).toBe("#local");
		result.stop();
	});

	it("creates useCached without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { useCached } = await import("../../../index");
		const source = signal(1);
		const cached = useCached(source);

		expect(globalThis.window).toBeUndefined();
		expect(cached.value).toBe(1);

		source.value = 2;

		expect(cached.value).toBe(2);
	});

	it("creates useClipboard without a window", async () => {
		const { useClipboard } = await import("../../../index");
		const result = useClipboard();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
		expect(result.error.value).toBeNull();

		await result.copy("hello");

		expect(result.text.value).toBe("");
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("creates useClipboardItems without a window", async () => {
		const { useClipboardItems } = await import("../../../index");
		const item = {
			types: ["text/plain"] as const,
			getType: async (type: string) => new Blob(["hello"], { type }),
		};
		const result = useClipboardItems();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		expect(result.isCopying.value).toBe(false);
		expect(result.error.value).toBeNull();

		await result.copy([item]);
		await expect(result.read()).resolves.toBeUndefined();

		expect(result.items.value).toEqual([]);
		expect(result.copied.value).toBe(false);
		result.stop();
	});

	it("creates useCloned without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { useCloned } = await import("../../../index");
		const source = signal({ count: 1 });
		const result = useCloned(source);

		expect(globalThis.window).toBeUndefined();
		expect(result.cloned.value).toEqual({ count: 1 });
		expect(result.isModified.value).toBe(false);

		source.value = { count: 2 };

		expect(result.cloned.value).toEqual({ count: 2 });

		result.cloned.value.count = 3;

		expect(result.isModified.value).toBe(true);

		result.sync();

		expect(result.cloned.value).toEqual({ count: 2 });
		expect(result.isModified.value).toBe(false);
		result.stop();
	});

	it("creates event hooks and buses without a window", async () => {
		const { createEventHook, useConfirmDialog, useEventBus } = await import(
			"../../../index"
		);
		const hook = createEventHook<string>();
		const bus = useEventBus<string>("ssr-bus");
		const calls: string[] = [];

		hook.on((value) => calls.push(value));
		await hook.trigger("ready");
		bus.on((value) => calls.push(value));
		await bus.emit("bus-ready");

		const dialog = useConfirmDialog<unknown, string, string>();
		const result = dialog.open();
		dialog.confirm("accepted");

		expect(globalThis.window).toBeUndefined();
		expect(calls).toEqual(["ready", "bus-ready"]);
		expect(dialog.isOpen.value).toBe(false);
		await expect(result).resolves.toEqual({
			data: "accepted",
			isCanceled: false,
		});
	});

	it("creates signals without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const {
			createSignal,
			signalAutoReset,
			signalDefault,
			signalDebounced,
			signalManualReset,
			signalThrottled,
			syncSignal,
			syncSignals,
			useDebouncedRefHistory,
		} = await import("../../../index");
		const value = createSignal("ready");
		const autoResetValue = signalAutoReset("default", 100);
		const defaultValue = signalDefault(signal<string | undefined>(), "default");
		const debouncedValue = signalDebounced(signal("source"), 100);
		const debouncedHistory = useDebouncedRefHistory(signal("source"), {
			debounce: 100,
		});
		const manualResetValue = signalManualReset("manual");
		const throttledValue = signalThrottled(signal("source"), 100);
		const left = signal("left");
		const right = signal("right");
		const stopSync = syncSignal(left, right);
		const source = signal("source");
		const target = signal("target");
		const stopSyncSignals = syncSignals(source, target);

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
		expect(autoResetValue.value).toBe("default");
		expect(defaultValue.value).toBe("default");
		expect(debouncedValue.value).toBe("source");
		expect(debouncedHistory.history.value[0].snapshot).toBe("source");
		expect(manualResetValue.value).toBe("manual");
		expect(throttledValue.value).toBe("source");
		expect(right.value).toBe("left");
		expect(target.value).toBe("source");

		stopSync();
		stopSyncSignals();
		debouncedHistory.dispose();
	});

	it("extends signals without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { extendSignal } = await import("../../../index");
		const source = signal("ready");
		const extra = signal("extra");
		const extended = extendSignal(source, { extra });

		expect(globalThis.window).toBeUndefined();
		expect(extended.value).toBe("ready");
		expect(extended.extra).toBe("extra");
	});

	it("creates value-resolving functions without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { createResolveValueFn } = await import("../../../index");
		const value = signal("ready");
		const resolveValueFn = createResolveValueFn((input: string) => input);

		expect(globalThis.window).toBeUndefined();
		expect(resolveValueFn(value)).toBe("ready");
	});

	it("creates reactified functions without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { reactify } = await import("../../../index");
		const value = signal("ready");
		const result = reactify((input: string) => input)(value);

		expect(globalThis.window).toBeUndefined();
		expect(result.value).toBe("ready");
	});

	it("creates reactified objects without a window", async () => {
		const { reactifyObject } = await import("../../../index");
		const result = reactifyObject({
			double(value: number) {
				return value * 2;
			},
		});

		expect(globalThis.window).toBeUndefined();
		expect(result.double(2).value).toBe(4);
	});

	it("creates reactive computed objects without a window", async () => {
		const { reactiveComputed } = await import("../../../index");
		const state = reactiveComputed(() => ({ ready: true }));

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates reactive omitted objects without a window", async () => {
		const { reactiveOmit } = await import("../../../index");
		const state = reactiveOmit({ ready: true, hidden: false }, "hidden");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates reactive picked objects without a window", async () => {
		const { reactivePick } = await import("../../../index");
		const state = reactivePick({ ready: true, hidden: false }, "ready");

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("creates deep signal objects without a window", async () => {
		const { toDeepSignal } = await import("../../../index");
		const state = toDeepSignal({ ready: true });

		expect(globalThis.window).toBeUndefined();
		expect(state.ready).toBe(true);
	});

	it("tries scoped cleanup without a window", async () => {
		const { tryOnScopeDispose } = await import("../../../index");

		expect(globalThis.window).toBeUndefined();
		expect(tryOnScopeDispose(() => {})).toBe(false);
	});

	it("waits for values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { until } = await import("../../../index");
		const source = signal("ready");

		expect(globalThis.window).toBeUndefined();
		await expect(until(source).toBe("ready")).resolves.toBe("ready");
	});

	it("resolves values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { resolveValue } = await import("../../../index");
		const value = signal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(resolveValue(value)).toBe("ready");
	});

	it("checks defined values without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { isDefined } = await import("../../../index");
		const value = signal("ready");

		expect(globalThis.window).toBeUndefined();
		expect(isDefined(value)).toBe(true);
		expect(isDefined(undefined)).toBe(false);
	});

	it("creates destructurable values without a window", async () => {
		const { makeDestructurable } = await import("../../../index");
		const result = makeDestructurable({ count: 1 }, [1]);
		const { count } = result;
		const [first] = result;

		expect(globalThis.window).toBeUndefined();
		expect(count).toBe(1);
		expect(first).toBe(1);
	});

	it("auto-starts timers when timer APIs are available without a browser window", async () => {
		vi.useFakeTimers();
		const { useCountdown, useInterval, useTimeout } = await import(
			"../../../index"
		);
		const countdown = useCountdown(2, { interval: 1 });
		const interval = useInterval(1, { controls: true });
		const timeout = useTimeout(1, { controls: true });

		expect(globalThis.window).toBeUndefined();
		expect(countdown.remaining.value).toBe(2);
		expect(countdown.isActive.value).toBe(false);
		expect(interval.isActive.value).toBe(true);
		expect(interval.counter.value).toBe(0);
		expect(timeout.isPending.value).toBe(true);
		expect(timeout.ready.value).toBe(false);

		countdown.start();
		vi.advanceTimersByTime(1);

		expect(countdown.remaining.value).toBe(1);
		expect(interval.counter.value).toBe(1);
		expect(timeout.ready.value).toBe(true);
		expect(timeout.isPending.value).toBe(false);

		vi.advanceTimersByTime(1);

		expect(countdown.remaining.value).toBe(0);
		expect(countdown.isActive.value).toBe(false);

		countdown.stop();
		interval.pause();
		timeout.stop();
	});
});
