// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

describe("SSR safety", () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it("imports the root entry in a node environment", async () => {
		const mod = await import("../../../index");

		expect(typeof mod.TransitionPresets).toBe("object");
		expect(typeof mod.computedAsync).toBe("function");
		expect(typeof mod.computedEager).toBe("function");
		expect(typeof mod.computedWithControl).toBe("function");
		expect(typeof mod.createEventHook).toBe("function");
		expect(typeof mod.createGenericProjection).toBe("function");
		expect(typeof mod.createProjection).toBe("function");
		expect(typeof mod.createSignal).toBe("function");
		expect(typeof mod.createResolveValueFn).toBe("function");
		expect(typeof mod.extendSignal).toBe("function");
		expect(typeof mod.isDefined).toBe("function");
		expect(typeof mod.logicAnd).toBe("function");
		expect(typeof mod.logicNot).toBe("function");
		expect(typeof mod.logicOr).toBe("function");
		expect(typeof mod.makeDestructurable).toBe("function");
		expect(typeof mod.resolveValue).toBe("function");
		expect(typeof mod.useAbs).toBe("function");
		expect(typeof mod.useAverage).toBe("function");
		expect(typeof mod.useCeil).toBe("function");
		expect(typeof mod.useClamp).toBe("function");
		expect(typeof mod.useFloor).toBe("function");
		expect(typeof mod.useMath).toBe("function");
		expect(typeof mod.useMax).toBe("function");
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
		expect(typeof mod.formatTimeAgo).toBe("function");
		expect(typeof mod.formatTimeAgoIntl).toBe("function");
		expect(typeof mod.formatTimeAgoIntlParts).toBe("function");
		expect(typeof mod.normalizeDate).toBe("function");
		expect(typeof mod.useDebouncedRefHistory).toBe("function");
		expect(typeof mod.useThrottledRefHistory).toBe("function");
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
		expect(typeof mod.useFps).toBe("function");
		expect(typeof mod.useFullscreen).toBe("function");
		expect(typeof mod.useGamepad).toBe("function");
		expect(typeof mod.useGeolocation).toBe("function");
		expect(typeof mod.useIdle).toBe("function");
		expect(typeof mod.useImage).toBe("function");
		expect(typeof mod.useInfiniteScroll).toBe("function");
		expect(typeof mod.useIntersectionObserver).toBe("function");
		expect(typeof mod.useKeyModifier).toBe("function");
		expect(typeof mod.useLastChanged).toBe("function");
		expect(typeof mod.useMagicKeys).toBe("function");
		expect(typeof mod.useMediaControls).toBe("function");
		expect(typeof mod.useInterval).toBe("function");
		expect(typeof mod.useIntervalFn).toBe("function");
		expect(typeof mod.useLocalStorage).toBe("function");
		expect(typeof mod.useManualRefHistory).toBe("function");
		expect(typeof mod.useMediaQuery).toBe("function");
		expect(typeof mod.useMemoize).toBe("function");
		expect(typeof mod.useMemory).toBe("function");
		expect(typeof mod.useMounted).toBe("function");
		expect(typeof mod.useMouse).toBe("function");
		expect(typeof mod.useMouseInElement).toBe("function");
		expect(typeof mod.useMousePressed).toBe("function");
		expect(typeof mod.useMutationObserver).toBe("function");
		expect(typeof mod.useNavigatorLanguage).toBe("function");
		expect(typeof mod.useNetwork).toBe("function");
		expect(typeof mod.useNow).toBe("function");
		expect(typeof mod.useObjectUrl).toBe("function");
		expect(typeof mod.useOffsetPagination).toBe("function");
		expect(typeof mod.useOnline).toBe("function");
		expect(typeof mod.usePageLeave).toBe("function");
		expect(typeof mod.useParallax).toBe("function");
		expect(typeof mod.usePerformanceObserver).toBe("function");
		expect(typeof mod.usePermission).toBe("function");
		expect(typeof mod.usePointer).toBe("function");
		expect(typeof mod.usePointerLock).toBe("function");
		expect(typeof mod.usePointerSwipe).toBe("function");
		expect(typeof mod.usePreferredColorScheme).toBe("function");
		expect(typeof mod.usePreferredContrast).toBe("function");
		expect(typeof mod.usePreferredDark).toBe("function");
		expect(typeof mod.usePreferredLanguages).toBe("function");
		expect(typeof mod.usePreferredReducedMotion).toBe("function");
		expect(typeof mod.usePreferredReducedTransparency).toBe("function");
		expect(typeof mod.usePrevious).toBe("function");
		expect(typeof mod.useRafFn).toBe("function");
		expect(typeof mod.useRefHistory).toBe("function");
		expect(typeof mod.useResizeObserver).toBe("function");
		expect(typeof mod.useScreenOrientation).toBe("function");
		expect(typeof mod.useScreenSafeArea).toBe("function");
		expect(typeof mod.useScriptTag).toBe("function");
		expect(typeof mod.useScroll).toBe("function");
		expect(typeof mod.useScrollLock).toBe("function");
		expect(typeof mod.useShare).toBe("function");
		expect(typeof mod.useSorted).toBe("function");
		expect(typeof mod.useSpeechRecognition).toBe("function");
		expect(typeof mod.useSpeechSynthesis).toBe("function");
		expect(typeof mod.useStepper).toBe("function");
		expect(typeof mod.useStyleTag).toBe("function");
		expect(typeof mod.useSupported).toBe("function");
		expect(typeof mod.useSwipe).toBe("function");
		expect(typeof mod.useTextDirection).toBe("function");
		expect(typeof mod.useTextSelection).toBe("function");
		expect(typeof mod.useTextareaAutosize).toBe("function");
		expect(typeof mod.useTimeAgo).toBe("function");
		expect(typeof mod.useTimeAgoIntl).toBe("function");
		expect(typeof mod.useSessionStorage).toBe("function");
		expect(typeof mod.useStorage).toBe("function");
		expect(typeof mod.useStorageAsync).toBe("function");
		expect(typeof mod.useTimeout).toBe("function");
		expect(typeof mod.useTimeoutFn).toBe("function");
		expect(typeof mod.useTimeoutPoll).toBe("function");
		expect(typeof mod.useTimestamp).toBe("function");
		expect(typeof mod.useTitle).toBe("function");
		expect(typeof mod.useToNumber).toBe("function");
		expect(typeof mod.useToString).toBe("function");
		expect(typeof mod.transition).toBe("function");
		expect(typeof mod.useTransition).toBe("function");
		expect(typeof mod.useToggle).toBe("function");
		expect(typeof mod.useUrlSearchParams).toBe("function");
		expect(typeof mod.useUserMedia).toBe("function");
		expect(typeof mod.useVibrate).toBe("function");
		expect(typeof mod.useVirtualList).toBe("function");
		expect(typeof mod.useWakeLock).toBe("function");
		expect(typeof mod.useWebNotification).toBe("function");
		expect(typeof mod.useWebSocket).toBe("function");
		expect(typeof mod.useWebWorker).toBe("function");
		expect(typeof mod.useWebWorkerFn).toBe("function");
		expect(typeof mod.useWindowFocus).toBe("function");
		expect(typeof mod.useWindowScroll).toBe("function");
		expect(typeof mod.useWindowSize).toBe("function");
		expect(typeof mod.watchArray).toBe("function");
		expect(typeof mod.watchAtMost).toBe("function");
		expect(typeof mod.watchDebounced).toBe("function");
		expect(typeof mod.watchDeep).toBe("function");
		expect(typeof mod.watchIgnorable).toBe("function");
		expect(typeof mod.watchImmediate).toBe("function");
		expect(typeof mod.watchOnce).toBe("function");
		expect(typeof mod.watchPausable).toBe("function");
		expect(typeof mod.watchThrottled).toBe("function");
		expect(typeof mod.watchTriggerable).toBe("function");
		expect(typeof mod.watchWithFilter).toBe("function");
		expect(typeof mod.whenever).toBe("function");
	}, 60_000);

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
			useFps,
			useFullscreen,
			useGamepad,
			useGeolocation,
			useIdle,
			useImage,
			useInfiniteScroll,
			useIntersectionObserver,
			useKeyModifier,
			useMagicKeys,
			useMediaControls,
			useMouse,
			useMouseInElement,
			useMousePressed,
			useMutationObserver,
			useNavigatorLanguage,
			useNetwork,
			useNow,
			useObjectUrl,
			useOffsetPagination,
			useOnline,
			usePageLeave,
			useParallax,
			usePerformanceObserver,
			usePermission,
			usePointer,
			usePointerLock,
			usePointerSwipe,
			usePreferredColorScheme,
			usePreferredContrast,
			usePreferredDark,
			usePreferredLanguages,
			usePreferredReducedMotion,
			usePreferredReducedTransparency,
			useRafFn,
			useResizeObserver,
			useScreenOrientation,
			useScreenSafeArea,
			useScriptTag,
			useScroll,
			useScrollLock,
			useShare,
			useSorted,
			useSpeechRecognition,
			useSpeechSynthesis,
			useStepper,
			useStyleTag,
			useSupported,
			useSwipe,
			useTextDirection,
			useTextSelection,
			useTextareaAutosize,
			onElementRemoval,
			onKeyDown,
			onKeyPressed,
			onKeyStroke,
			onKeyUp,
			onLongPress,
			onStartTyping,
			useSessionStorage,
			useStorage,
			useStorageAsync,
			useTimeoutPoll,
			useTimestamp,
			useTitle,
			useToNumber,
			useToString,
			transition,
			useTransition,
			useUrlSearchParams,
			useUserMedia,
			useVibrate,
			useVirtualList,
			useWakeLock,
			useWebNotification,
			useWebSocket,
			useWebWorker,
			useWebWorkerFn,
			useWindowFocus,
			useWindowScroll,
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
		const mouseInElement = useMouseInElement(null, { window: null });
		const mousePressed = useMousePressed({ window: null });
		const mutationObserver = useMutationObserver(null, () => {}, {
			window: null,
		});
		const navigatorLanguage = useNavigatorLanguage({ window: null });
		const network = useNetwork({ window: null });
		const now = useNow({
			controls: true,
			window: null,
		});
		const objectUrl = useObjectUrl(new Blob(["ssr"]), { window: null });
		const pagination = useOffsetPagination({ total: 0 });
		const mediaQuery = useMediaQuery("(min-width: 640px)");
		const online = useOnline();
		const pageLeave = usePageLeave({ window: null });
		const parallax = useParallax(null, { window: null });
		const performanceObserver = usePerformanceObserver(
			{ entryTypes: ["mark"], window: null },
			() => {},
		);
		const permission = usePermission("geolocation", { navigator: null });
		const pointer = usePointer({ window: null });
		const targetlessPointer = usePointer({ target: null });
		const pointerLock = usePointerLock(undefined, { document: null });
		const pointerSwipe = usePointerSwipe(null);
		const preferredColorScheme = usePreferredColorScheme();
		const preferredContrast = usePreferredContrast();
		const preferredDark = usePreferredDark();
		const preferredLanguages = usePreferredLanguages({ window: null });
		const preferredReducedMotion = usePreferredReducedMotion();
		const preferredReducedTransparency = usePreferredReducedTransparency();
		const raf = useRafFn(() => {}, { window: null });
		const resizeObserver = useResizeObserver(null, () => {}, {
			window: null,
		});
		const screenOrientation = useScreenOrientation({ window: null });
		const screenSafeArea = useScreenSafeArea({ window: null });
		const scriptTag = useScriptTag("https://example.com/script.js");
		const scroll = useScroll(null, { window: null });
		const scrollLock = useScrollLock(null, true, { window: null });
		const share = useShare({ text: "ssr" }, { navigator: null });
		const sorted = useSorted([3, 1, 2]);
		const speechRecognition = useSpeechRecognition({ window: null });
		const speechSynthesis = useSpeechSynthesis("hello", { window: null });
		const stepper = useStepper(["first", "second"], "second");
		const styleTag = useStyleTag(".ssr { color: red; }", { document: null });
		const supported = useSupported(
			() => typeof window !== "undefined" && "document" in window,
		);
		const swipe = useSwipe(null, { window: null });
		const textDirection = useTextDirection({
			document: null,
			initialValue: "rtl",
		});
		const textSelection = useTextSelection({ window: null });
		const textareaAutosize = useTextareaAutosize({ window: null });
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
		const userMedia = useUserMedia({ navigator: null });
		const vibration = useVibrate({ navigator: null });
		const virtualList = useVirtualList(["a", "b", "c"], {
			itemHeight: 20,
			window: null,
		});
		const wakeLock = useWakeLock({
			document: null,
			navigator: null,
		});
		const webNotification = useWebNotification({ window: null });
		const webSocket = useWebSocket("ws://example.test", { window: null });
		const webWorker = useWebWorker("worker.js", { window: null });
		const webWorkerFn = useWebWorkerFn((value: number) => value, {
			window: null,
		});
		const windowFocus = useWindowFocus({ window: null });
		const windowScroll = useWindowScroll({ window: null });
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
		const fps = useFps({ window: null });
		const fullscreen = useFullscreen(undefined, { document: null });
		const gamepad = useGamepad({ navigator: null, window: null });
		const geolocation = useGeolocation({ navigator: null });
		const idle = useIdle(1000, { window: null });
		const image = useImage(
			{ src: "https://example.com/image.png" },
			{ immediate: false, window: null },
		);
		const infiniteScroll = useInfiniteScroll(null, async () => {}, {
			window: null,
		});
		const intersectionObserver = useIntersectionObserver(null, () => {}, {
			window: null,
		});
		const keyModifier = useKeyModifier("CapsLock", { document: null });
		const magicKeys = useMagicKeys({ window: null });
		const mediaControls = useMediaControls(null, { document: null });
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
		const asyncStorageValue = useStorageAsync(
			"async-storage",
			"fallback",
			undefined,
			{
				window: undefined,
			},
		);
		const timeoutPoll = useTimeoutPoll(async () => {}, 100, {
			immediate: false,
		});
		const timestamp = useTimestamp({ controls: true });
		const title = useTitle("SSR title", { document: null });
		const toNumber = useToNumber("123.4");
		const stringValue = useToString(123.4);
		const transitionSource = {
			value: 0,
			peek() {
				return this.value;
			},
		};
		await transition(transitionSource, 0, 1, { window: null });
		const transitionValue = useTransition(1, { window: null });
		const urlSearchParams = useUrlSearchParams("history", {
			initialValue: { foo: "bar" },
			window: null,
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
		expect(mouseInElement.elementX.value).toBe(0);
		expect(mouseInElement.elementY.value).toBe(0);
		expect(mouseInElement.isOutside.value).toBe(true);
		expect(mousePressed.pressed.value).toBe(false);
		expect(mousePressed.sourceType.value).toBeNull();
		expect(mutationObserver.isSupported.value).toBe(false);
		expect(mutationObserver.takeRecords()).toBeUndefined();
		expect(navigatorLanguage.isSupported.value).toBe(false);
		expect(navigatorLanguage.language.value).toBeUndefined();
		expect(network.isSupported.value).toBe(false);
		expect(network.isOnline.value).toBe(true);
		expect(network.downlink.value).toBeUndefined();
		expect(network.type.value).toBe("unknown");
		expect(now.now.value).toBeInstanceOf(Date);
		expect(now.isActive.value).toBe(false);
		expect(objectUrl.url.value).toBeUndefined();
		expect(pagination.currentPage.value).toBe(1);
		expect(pagination.currentPageSize.value).toBe(10);
		expect(pagination.pageCount.value).toBe(1);
		expect(mediaQuery.matches.value).toBe(false);
		expect(online.isOnline.value).toBe(true);
		expect(pageLeave.isLeft.value).toBe(false);
		expect(parallax.source.value).toBe("mouse");
		expect(parallax.roll.value).toBe(0);
		expect(parallax.tilt.value).toBe(0);
		expect(performanceObserver.isSupported.value).toBe(false);
		expect(permission.isSupported.value).toBe(false);
		expect(permission.state.value).toBeUndefined();
		expect(pointer.x.value).toBe(0);
		expect(pointer.y.value).toBe(0);
		expect(pointer.pointerType.value).toBeNull();
		expect(pointer.isInside.value).toBe(false);
		expect(targetlessPointer.x.value).toBe(0);
		expect(targetlessPointer.isInside.value).toBe(false);
		expect(pointerLock.isSupported.value).toBe(false);
		expect(pointerLock.isLocked.value).toBe(false);
		expect(pointerLock.element.value).toBeNull();
		expect(pointerSwipe.isSwiping.value).toBe(false);
		expect(pointerSwipe.direction.value).toBe("none");
		expect(pointerSwipe.posStart.value).toEqual({ x: 0, y: 0 });
		expect(pointerSwipe.posEnd.value).toEqual({ x: 0, y: 0 });
		expect(preferredColorScheme.value).toBe("no-preference");
		expect(preferredContrast.value).toBe("no-preference");
		expect(preferredDark.matches.value).toBe(false);
		expect(preferredLanguages.isSupported.value).toBe(false);
		expect(preferredLanguages.languages.value).toEqual([]);
		expect(preferredReducedMotion.value).toBe("no-preference");
		expect(preferredReducedTransparency.value).toBe("no-preference");
		expect(raf.isActive.value).toBe(false);
		expect(resizeObserver.isSupported.value).toBe(false);
		expect(screenOrientation.isSupported.value).toBe(false);
		expect(screenOrientation.orientation.value).toBeUndefined();
		expect(screenOrientation.angle.value).toBe(0);
		expect(screenSafeArea.top.value).toBe("");
		expect(screenSafeArea.right.value).toBe("");
		expect(screenSafeArea.bottom.value).toBe("");
		expect(screenSafeArea.left.value).toBe("");
		expect(scriptTag.scriptTag.value).toBeNull();
		await expect(scriptTag.load()).resolves.toBe(false);
		scriptTag.unload();
		expect(scroll.x.value).toBe(0);
		expect(scroll.y.value).toBe(0);
		expect(scroll.isScrolling.value).toBe(false);
		expect(scroll.arrivedState.value).toEqual({
			bottom: false,
			left: true,
			right: false,
			top: true,
		});
		scroll.scrollTo({ left: 1, top: 2 });
		scroll.stop();
		expect(scrollLock.value).toBe(true);
		scrollLock.value = false;
		expect(scrollLock.value).toBe(false);
		scrollLock.stop();
		expect(share.isSupported.value).toBe(false);
		expect(share.canShare()).toBe(false);
		await expect(share.share()).resolves.toBeUndefined();
		share.stop();
		expect(sorted.value).toEqual([1, 2, 3]);
		expect(speechRecognition.isSupported.value).toBe(false);
		expect(speechRecognition.isListening.value).toBe(false);
		expect(speechRecognition.isFinal.value).toBe(false);
		expect(speechRecognition.recognition.value).toBeUndefined();
		expect(speechRecognition.result.value).toBe("");
		expect(speechRecognition.error.value).toBeNull();
		expect(speechSynthesis.isSupported.value).toBe(false);
		expect(speechSynthesis.isPlaying.value).toBe(false);
		expect(speechSynthesis.status.value).toBe("init");
		expect(speechSynthesis.utterance.value).toBeUndefined();
		expect(speechSynthesis.error.value).toBeNull();
		expect(speechSynthesis.voices.value).toEqual([]);
		expect(stepper.current.value).toBe("second");
		expect(stepper.index.value).toBe(1);
		expect(styleTag.id).toMatch(/^sigrea_style_tag_\d+$/);
		expect(styleTag.css.value).toBe(".ssr { color: red; }");
		expect(styleTag.isLoaded.value).toBe(false);
		expect(supported.value).toBe(false);
		expect(swipe.isSwiping.value).toBe(false);
		expect(swipe.direction.value).toBe("none");
		expect(swipe.coordsStart.value).toEqual({ x: 0, y: 0 });
		expect(swipe.coordsEnd.value).toEqual({ x: 0, y: 0 });
		expect(swipe.lengthX.value).toBe(0);
		expect(swipe.lengthY.value).toBe(0);
		expect(textDirection.value).toBe("rtl");
		textDirection.value = "auto";
		expect(textDirection.value).toBe("auto");
		expect(textSelection.selection.value).toBeNull();
		expect(textSelection.text.value).toBe("");
		expect(textSelection.ranges.value).toEqual([]);
		expect(textSelection.rects.value).toEqual([]);
		expect(textareaAutosize.textarea.value).toBeUndefined();
		expect(textareaAutosize.input.value).toBe("");
		textareaAutosize.triggerResize();
		styleTag.load();
		styleTag.unload();
		swipe.stop();
		textDirection.stop();
		textSelection.stop();
		textareaAutosize.stop();
		speechSynthesis.speak();
		speechSynthesis.cancel();
		speechSynthesis.pause();
		speechSynthesis.resume();
		speechSynthesis.toggle();
		speechSynthesis.stop();
		expect(cssSupports.value).toBe(false);
		expect(initialCssSupports.value).toBe(true);
		expect(cssVar.value).toBe("red");
		expect(devicesList.isSupported.value).toBe(false);
		expect(devicesList.devices.value).toEqual([]);
		expect(displayMedia.isSupported.value).toBe(false);
		expect(displayMedia.stream.value).toBeUndefined();
		expect(userMedia.isSupported.value).toBe(false);
		expect(userMedia.stream.value).toBeUndefined();
		expect(userMedia.isStarting.value).toBe(false);
		expect(userMedia.isStreaming.value).toBe(false);
		expect(userMedia.error.value).toBeNull();
		expect(userMedia.enabled.value).toBe(false);
		expect(userMedia.autoSwitch.value).toBe(true);
		expect(vibration.isSupported.value).toBe(false);
		expect(vibration.pattern.value).toEqual([]);
		expect(vibration.intervalControls).toBeUndefined();
		expect(virtualList.list.value).toEqual([]);
		expect(virtualList.containerRef.value).toBeNull();
		expect(virtualList.containerStyle).toBe("overflow-y: auto;");
		expect(virtualList.wrapperStyle.value).toBe(
			"width: 100%; height: 60px; margin-top: 0px;",
		);
		expect(wakeLock.sentinel.value).toBeNull();
		expect(wakeLock.isSupported.value).toBe(false);
		expect(wakeLock.isActive.value).toBe(false);
		expect(webNotification.notification.value).toBeNull();
		expect(webNotification.isSupported.value).toBe(false);
		expect(webNotification.permissionGranted.value).toBe(false);
		expect(webNotification.error.value).toBeNull();
		expect(webSocket.isSupported.value).toBe(false);
		expect(webSocket.status.value).toBe("CLOSED");
		expect(webSocket.ws.value).toBeUndefined();
		expect(webSocket.data.value).toBeNull();
		expect(webSocket.error.value).toBeNull();
		expect(webWorker.isSupported.value).toBe(false);
		expect(webWorker.worker.value).toBeUndefined();
		expect(webWorker.data.value).toBeNull();
		expect(webWorker.error.value).toBeNull();
		expect(webWorker.post("message")).toBe(false);
		webWorker.terminate();
		webWorker.stop();
		expect(webWorkerFn.isSupported.value).toBe(false);
		expect(webWorkerFn.workerStatus.value).toBe("PENDING");
		expect(webWorkerFn.error.value).toBeNull();
		await expect(webWorkerFn.workerFn(1)).rejects.toThrow(
			"Worker, Blob, or object URL support is missing",
		);
		webWorkerFn.stop();
		expect(windowFocus.focused.value).toBe(false);
		windowFocus.stop();
		expect(windowScroll.x.value).toBe(0);
		expect(windowScroll.y.value).toBe(0);
		expect(windowScroll.isScrolling.value).toBe(false);
		windowScroll.scrollTo({ left: 1, top: 2 });
		windowScroll.stop();
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
		expect(fps.value).toBe(0);
		expect(fullscreen.isSupported.value).toBe(false);
		expect(fullscreen.isFullscreen.value).toBe(false);
		expect(gamepad.isSupported.value).toBe(false);
		expect(gamepad.isActive.value).toBe(false);
		expect(gamepad.gamepads.value).toEqual([]);
		expect(geolocation.isSupported.value).toBe(false);
		expect(geolocation.isActive.value).toBe(false);
		expect(geolocation.coords.value).toBeNull();
		expect(geolocation.locatedAt.value).toBeNull();
		expect(geolocation.error.value).toBeNull();
		expect(idle.idle.value).toBe(false);
		expect(idle.isPending.value).toBe(false);
		expect(typeof idle.lastActive.value).toBe("number");
		expect(image.state.value).toBeUndefined();
		expect(image.isLoading.value).toBe(false);
		expect(image.error.value).toBeUndefined();
		expect(infiniteScroll.isLoading.value).toBe(false);
		expect(infiniteScroll.error.value).toBeUndefined();
		expect(intersectionObserver.isSupported.value).toBe(false);
		expect(intersectionObserver.isActive.value).toBe(true);
		expect(keyModifier.value).toBeNull();
		expect(magicKeys.a.value).toBe(false);
		expect(magicKeys.current.value).toEqual(new Set());
		expect(mediaControls.currentTime.value).toBe(0);
		expect(mediaControls.duration.value).toBe(0);
		expect(mediaControls.playing.value).toBe(false);
		expect(mediaControls.supportsPictureInPicture.value).toBe(false);
		expect(mediaControls.tracks.value).toEqual([]);
		expect(fetchValue.data.value).toBeNull();
		expect(sessionStorageValue.value).toBe("fallback");
		expect(ssrMediaQuery.matches.value).toBe(true);
		expect(storageValue.value).toBe("fallback");
		expect(asyncStorageValue.value).toBe("fallback");
		expect(timeoutPoll.isActive.value).toBe(false);
		expect(typeof timestamp.timestamp.value).toBe("number");
		expect(timestamp.isActive.value).toBe(false);
		expect(title.value).toBe("SSR title");
		expect(toNumber.value).toBe(123.4);
		expect(stringValue.value).toBe("123.4");
		expect(transitionSource.value).toBe(1);
		expect(transitionValue.value).toBe(1);
		expect(urlSearchParams.foo).toBe("bar");
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
		mouseInElement.stop();
		mousePressed.stop();
		mutationObserver.stop();
		navigatorLanguage.stop();
		network.stop();
		now.pause();
		objectUrl.stop();
		pagination.stop();
		mediaQuery.stop();
		online.stop();
		pageLeave.stop();
		parallax.stop();
		performanceObserver.start();
		performanceObserver.stop();
		expect(await permission.query()).toBeUndefined();
		permission.stop();
		pointer.stop();
		targetlessPointer.stop();
		await pointerLock.lock();
		await pointerLock.unlock();
		await pointerLock.toggle();
		pointerLock.stop();
		pointerSwipe.stop();
		preferredColorScheme.stop();
		preferredContrast.stop();
		preferredDark.stop();
		preferredLanguages.stop();
		preferredReducedMotion.stop();
		preferredReducedTransparency.stop();
		raf.resume();
		raf.pause();
		resizeObserver.stop();
		await expect(
			screenOrientation.lockOrientation("portrait-primary"),
		).rejects.toThrow("Screen Orientation API is not supported");
		screenOrientation.unlockOrientation();
		screenOrientation.stop();
		screenSafeArea.update();
		screenSafeArea.stop();
		cssVar.value = "blue";
		expect(cssVar.value).toBe("blue");
		cssVar.stop();
		expect(await devicesList.ensurePermissions()).toBe(false);
		devicesList.stop();
		expect(await displayMedia.start()).toBeUndefined();
		displayMedia.stop();
		expect(await userMedia.start()).toBeUndefined();
		expect(await userMedia.restart()).toBeUndefined();
		userMedia.enabled.value = false;
		userMedia.autoSwitch.value = false;
		userMedia.constraints.value = { audio: true };
		userMedia.stop();
		expect(vibration.vibrate()).toBeUndefined();
		expect(vibration.stop()).toBeUndefined();
		virtualList.measure();
		virtualList.onScroll(new Event("scroll"));
		virtualList.scrollTo(1);
		virtualList.stop();
		await wakeLock.request();
		await wakeLock.forceRequest();
		await wakeLock.release();
		wakeLock.stop();
		expect(await webNotification.ensurePermissions()).toBe(false);
		expect(await webNotification.show()).toBeUndefined();
		webNotification.close();
		webNotification.stop();
		webSocket.open();
		expect(webSocket.send("message", false)).toBe(false);
		webSocket.close();
		webSocket.stop();
		speechRecognition.start();
		speechRecognition.stop();
		speechRecognition.abort();
		speechRecognition.toggle();
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
		await fullscreen.enter();
		await fullscreen.exit();
		await fullscreen.toggle();
		fullscreen.stop();
		gamepad.resume();
		gamepad.pause();
		gamepad.stop();
		geolocation.resume();
		geolocation.pause();
		geolocation.stop();
		idle.start();
		idle.reset();
		idle.stop();
		infiniteScroll.reset();
		infiniteScroll.stop();
		intersectionObserver.pause();
		intersectionObserver.resume();
		intersectionObserver.stop();
		keyModifier.stop();
		magicKeys.stop();
		mediaControls.currentTime.value = 1;
		mediaControls.volume.value = 0.5;
		mediaControls.muted.value = true;
		mediaControls.rate.value = 1.25;
		mediaControls.playing.value = true;
		mediaControls.disableTrack();
		mediaControls.enableTrack(0);
		expect(await mediaControls.togglePictureInPicture()).toBeUndefined();
		mediaControls.stop();
		expect(await fetchValue.execute()).toBeInstanceOf(Response);
		expect(fetchValue.data.value).toBe("ok");
		expect(fetchValue.statusCode.value).toBe(200);
		fetchValue.abort();
		fetchValue.stop();
		sessionStorageValue.stop();
		ssrMediaQuery.stop();
		storageValue.stop();
		asyncStorageValue.stop();
		timeoutPoll.resume();
		expect(timeoutPoll.isActive.value).toBe(true);
		timeoutPoll.pause();
		timestamp.pause();
		title.value = "Next SSR title";
		expect(title.value).toBe("Next SSR title");
		title.stop();
		elementSize.stop();
		size.stop();
	}, 20_000);

	it("creates computedAsync without a window", async () => {
		const { computedAsync } = await import("../../../index");
		const value = computedAsync(async () => "ready", "initial");

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("initial");
	}, 10_000);

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

	it("does not use Node PerformanceObserver without a window", async () => {
		const { usePerformanceObserver } = await import("../../../index");
		const observer = usePerformanceObserver({ entryTypes: ["mark"] }, () => {});

		expect(globalThis.window).toBeUndefined();
		expect(observer.isSupported.value).toBe(false);

		observer.start();
		expect(observer.isSupported.value).toBe(false);
		observer.stop();
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

	it("creates useObjectUrl without a window", async () => {
		const { useObjectUrl } = await import("../../../index");
		const result = useObjectUrl(new Blob(["hello"]));

		expect(globalThis.window).toBeUndefined();
		expect(result.url.value).toBeUndefined();
		result.stop();
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

	it("creates useUserMedia without a window", async () => {
		const { useUserMedia } = await import("../../../index");
		const result = useUserMedia();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.isStarting.value).toBe(false);
		expect(result.isStreaming.value).toBe(false);
		expect(result.stream.value).toBeUndefined();
		expect(result.error.value).toBeNull();
		expect(result.enabled.value).toBe(false);
		expect(result.autoSwitch.value).toBe(true);
		expect(await result.start()).toBeUndefined();
		expect(await result.restart()).toBeUndefined();
		result.stop();
	});

	it("creates useVibrate without a window", async () => {
		const { useVibrate } = await import("../../../index");
		const result = useVibrate();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.pattern.value).toEqual([]);
		expect(result.intervalControls).toBeUndefined();
		expect(result.vibrate()).toBeUndefined();
		expect(result.stop()).toBeUndefined();
	});

	it("creates useVirtualList without a window", async () => {
		const { useVirtualList } = await import("../../../index");
		const result = useVirtualList(["a", "b", "c"], {
			itemHeight: 20,
			window: null,
		});

		expect(globalThis.window).toBeUndefined();
		expect(result.list.value).toEqual([]);
		expect(result.containerRef.value).toBeNull();
		expect(result.containerStyle).toBe("overflow-y: auto;");
		expect(result.wrapperStyle.value).toBe(
			"width: 100%; height: 60px; margin-top: 0px;",
		);
		result.measure();
		result.onScroll(new Event("scroll"));
		result.scrollTo(1);
		result.stop();
	});

	it("creates useWakeLock without a window", async () => {
		const { useWakeLock } = await import("../../../index");
		const result = useWakeLock();

		expect(globalThis.window).toBeUndefined();
		expect(result.sentinel.value).toBeNull();
		expect(result.isSupported.value).toBe(false);
		expect(result.isActive.value).toBe(false);
		await result.request();
		await result.forceRequest();
		await result.release();
		result.stop();
	});

	it("creates useFullscreen without a window", async () => {
		const { useFullscreen } = await import("../../../index");
		const result = useFullscreen();

		expect(globalThis.window).toBeUndefined();
		expect(result.isSupported.value).toBe(false);
		expect(result.isFullscreen.value).toBe(false);

		await result.enter();
		await result.exit();
		await result.toggle();

		expect(result.isSupported.value).toBe(false);
		expect(result.isFullscreen.value).toBe(false);
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

	it("creates useMemoize without a window", async () => {
		const { computed } = await import("@sigrea/core");
		const { useMemoize } = await import("../../../index");
		const resolver = vi.fn((value: number) => `result-${value}`);
		const memo = useMemoize(resolver);
		const cached = computed(() => memo(1));

		expect(globalThis.window).toBeUndefined();
		expect(cached.value).toBe("result-1");
		expect(memo(1)).toBe("result-1");
		expect(resolver).toHaveBeenCalledOnce();

		memo.load(1);

		expect(resolver).toHaveBeenCalledTimes(2);
		expect(cached.value).toBe("result-1");

		memo.delete(1);
		memo.clear();
	});

	it("creates useMemory without a window", async () => {
		const { useMemory } = await import("../../../index");
		const memory = useMemory({ window: null });

		expect(globalThis.window).toBeUndefined();
		expect(memory.isSupported.value).toBe(false);
		expect(memory.memory.value).toBeUndefined();
		expect(memory.isActive.value).toBe(false);

		memory.resume();

		expect(memory.isActive.value).toBe(false);
		memory.pause();
		memory.stop();
	});

	it("creates useMounted without a window", async () => {
		const { useMounted } = await import("../../../index");
		const mounted = useMounted();

		expect(globalThis.window).toBeUndefined();
		expect(mounted.value).toBe(false);
	});

	it("creates useSupported without a window", async () => {
		const { useSupported } = await import("../../../index");
		const supported = useSupported(
			() => typeof window !== "undefined" && "document" in window,
		);

		expect(globalThis.window).toBeUndefined();
		expect(supported.value).toBe(false);
	});

	it("creates useLastChanged without a window", async () => {
		const { signal } = await import("@sigrea/core");
		const { useLastChanged } = await import("../../../index");
		const source = signal(1);
		const lastChanged = useLastChanged(source, {
			initialValue: 123,
		});

		expect(globalThis.window).toBeUndefined();
		expect(lastChanged.value).toBe(123);
	});

	it("creates useMagicKeys without a window", async () => {
		const { useMagicKeys } = await import("../../../index");
		const keys = useMagicKeys({ window: null });

		expect(globalThis.window).toBeUndefined();
		expect(keys.a.value).toBe(false);
		expect(keys.current.value).toEqual(new Set());
		keys.stop();
	});

	it("creates useMediaControls without a window", async () => {
		const { useMediaControls } = await import("../../../index");
		const controls = useMediaControls(null, { document: null });

		expect(globalThis.window).toBeUndefined();
		expect(controls.duration.value).toBe(0);
		expect(controls.playing.value).toBe(false);
		expect(controls.supportsPictureInPicture.value).toBe(false);
		expect(controls.tracks.value).toEqual([]);
		controls.currentTime.value = 5;
		controls.volume.value = 0.25;
		controls.muted.value = true;
		controls.rate.value = 1.5;
		controls.playing.value = true;
		controls.disableTrack();
		controls.enableTrack(0);
		expect(await controls.togglePictureInPicture()).toBeUndefined();
		controls.stop();
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
			createGenericProjection,
			createProjection,
			createSignal,
			logicAnd,
			logicNot,
			logicOr,
			signalAutoReset,
			signalDefault,
			signalDebounced,
			signalManualReset,
			signalThrottled,
			syncSignal,
			syncSignals,
			formatTimeAgo,
			formatTimeAgoIntl,
			formatTimeAgoIntlParts,
			useAbs,
			useAverage,
			useCeil,
			useClamp,
			useFloor,
			useMath,
			useMax,
			useDebouncedRefHistory,
			useThrottledRefHistory,
			useTimeAgo,
			useTimeAgoIntl,
			watchArray,
			watchAtMost,
			watchDebounced,
			watchDeep,
			watchIgnorable,
			watchImmediate,
			watchOnce,
			watchPausable,
			watchThrottled,
			watchTriggerable,
			watchWithFilter,
			whenever,
		} = await import("../../../index");
		const value = createSignal("ready");
		const useGenericProjection = createGenericProjection<number, string>(
			[0, 10] as const,
			["low", "high"] as const,
			(input, fromDomain, toDomain) => {
				const midpoint = (fromDomain[0] + fromDomain[1]) / 2;
				return input <= midpoint ? toDomain[0] : toDomain[1];
			},
		);
		const genericProjection = useGenericProjection(signal(4));
		const useNumericProjection = createProjection(
			[0, 10] as const,
			[0, 100] as const,
		);
		const numericProjection = useNumericProjection(signal(4));
		const logicalAndValue = logicAnd(signal(true), () => true);
		const logicalNotValue = logicNot(signal(false));
		const logicalOrValue = logicOr(signal(false), () => true);
		const absoluteValue = useAbs(signal(-4));
		const averageValue = useAverage(signal(1), () => 3);
		const ceilValue = useCeil(signal(1.2));
		const clampValue = useClamp(signal(10), 0, 5);
		const floorValue = useFloor(signal(1.8));
		const mathValue = useMath("pow", signal(2), 3);
		const maxValue = useMax(signal(1), () => 3);
		const autoResetValue = signalAutoReset("default", 100);
		const defaultValue = signalDefault(signal<string | undefined>(), "default");
		const debouncedValue = signalDebounced(signal("source"), 100);
		const debouncedHistory = useDebouncedRefHistory(signal("source"), {
			debounce: 100,
		});
		const throttledHistory = useThrottledRefHistory(signal("source"), {
			throttle: 100,
		});
		const timeAgo = useTimeAgo("2026-05-07T00:00:00.000Z", {
			updateInterval: 0,
		});
		const timeAgoIntl = useTimeAgoIntl("2026-05-07T00:00:00.000Z", {
			locale: "en",
			updateInterval: 0,
		});
		const manualResetValue = signalManualReset("manual");
		const throttledValue = signalThrottled(signal("source"), 100);
		const left = signal("left");
		const right = signal("right");
		const stopSync = syncSignal(left, right);
		const source = signal("source");
		const target = signal("target");
		const stopSyncSignals = syncSignals(source, target);
		const list = signal([1, 2]);
		const watchedArrays: Array<{
			added: number[];
			removed: number[];
		}> = [];
		const stopArrayWatch = watchArray(
			list,
			(_next, _old, added, removed) => {
				watchedArrays.push({ added, removed });
			},
			{ flush: "sync" },
		);
		list.value = [2, 3];
		const limitedSource = signal(0);
		const limitedValues: number[] = [];
		const limitedWatch = watchAtMost(
			limitedSource,
			(value) => {
				limitedValues.push(value);
			},
			{ count: 1, flush: "sync" },
		);
		limitedSource.value = 1;
		limitedSource.value = 2;
		const debouncedSource = signal(0);
		const debouncedValues: number[] = [];
		const stopDebouncedWatch = watchDebounced(
			debouncedSource,
			(value) => {
				debouncedValues.push(value);
			},
			{ debounce: 0, flush: "sync" },
		);
		debouncedSource.value = 1;
		const deepSource = signal({ count: 0 });
		const deepValues: number[] = [];
		const stopDeepWatch = watchDeep(
			deepSource,
			(value) => {
				deepValues.push(value.count);
			},
			{ flush: "sync" },
		);
		deepSource.value = { count: 1 };
		const ignorableSource = signal(0);
		const ignorableValues: number[] = [];
		const ignorableWatch = watchIgnorable(
			ignorableSource,
			(value) => {
				ignorableValues.push(value);
			},
			{ flush: "sync" },
		);
		ignorableSource.value = 1;
		ignorableWatch.ignoreUpdates(() => {
			ignorableSource.value = 2;
		});
		const immediateSource = signal(0);
		const immediateValues: number[] = [];
		const stopImmediateWatch = watchImmediate(
			immediateSource,
			(value) => {
				immediateValues.push(value);
			},
			{ flush: "sync" },
		);
		immediateSource.value = 1;
		const onceSource = signal(0);
		const onceValues: number[] = [];
		const stopOnceWatch = watchOnce(
			onceSource,
			(value) => {
				onceValues.push(value);
			},
			{ flush: "sync" },
		);
		onceSource.value = 1;
		onceSource.value = 2;
		const pausableSource = signal(0);
		const pausableValues: number[] = [];
		const pausableWatch = watchPausable(
			pausableSource,
			(value) => {
				pausableValues.push(value);
			},
			{ flush: "sync" },
		);
		pausableSource.value = 1;
		pausableWatch.pause();
		pausableSource.value = 2;
		pausableWatch.resume();
		pausableSource.value = 3;
		const throttledWatchSource = signal(0);
		const throttledWatchValues: number[] = [];
		const stopThrottledWatch = watchThrottled(
			throttledWatchSource,
			(value) => {
				throttledWatchValues.push(value);
			},
			{ flush: "sync", throttle: 0 },
		);
		throttledWatchSource.value = 1;
		const triggerableWatchSource = signal(0);
		const triggerableWatchValues: number[] = [];
		const triggerableWatch = watchTriggerable(
			triggerableWatchSource,
			(value) => {
				triggerableWatchValues.push(value);
				return value;
			},
			{ flush: "sync" },
		);
		const triggerableResult = triggerableWatch.trigger();
		triggerableWatchSource.value = 1;
		const filteredWatchSource = signal(0);
		const filteredWatchValues: number[] = [];
		const stopFilteredWatch = watchWithFilter(
			filteredWatchSource,
			(value) => {
				filteredWatchValues.push(value);
			},
			{ eventFilter: (invoke) => invoke(), flush: "sync" },
		);
		filteredWatchSource.value = 1;
		const wheneverSource = signal(0);
		const wheneverValues: number[] = [];
		const stopWhenever = whenever(
			wheneverSource,
			(value) => {
				wheneverValues.push(value);
			},
			{ flush: "sync" },
		);
		wheneverSource.value = 1;
		wheneverSource.value = 0;
		wheneverSource.value = 2;

		expect(globalThis.window).toBeUndefined();
		expect(value.value).toBe("ready");
		expect(genericProjection.value).toBe("low");
		expect(numericProjection.value).toBe(40);
		expect(logicalAndValue.value).toBe(true);
		expect(logicalNotValue.value).toBe(true);
		expect(logicalOrValue.value).toBe(true);
		expect(absoluteValue.value).toBe(4);
		expect(averageValue.value).toBe(2);
		expect(ceilValue.value).toBe(2);
		expect(clampValue.value).toBe(5);
		expect(floorValue.value).toBe(1);
		expect(mathValue.value).toBe(8);
		expect(maxValue.value).toBe(3);
		expect(autoResetValue.value).toBe("default");
		expect(defaultValue.value).toBe("default");
		expect(debouncedValue.value).toBe("source");
		expect(debouncedHistory.history.value[0].snapshot).toBe("source");
		expect(throttledHistory.history.value[0].snapshot).toBe("source");
		expect(formatTimeAgo(new Date(), {}, new Date())).toBe("just now");
		expect(formatTimeAgoIntl(new Date(), { locale: "en" }, new Date())).toBe(
			"now",
		);
		expect(
			formatTimeAgoIntlParts([
				{ type: "integer", value: "1", unit: "second" },
				{ type: "literal", value: " second ago" },
			]),
		).toBe("1 second ago");
		expect(timeAgo.value).toBeTruthy();
		expect(timeAgoIntl.value).toBeTruthy();
		expect(manualResetValue.value).toBe("manual");
		expect(throttledValue.value).toBe("source");
		expect(right.value).toBe("left");
		expect(target.value).toBe("source");
		expect(watchedArrays).toEqual([{ added: [3], removed: [1] }]);
		expect(limitedValues).toEqual([1]);
		expect(limitedWatch.count.value).toBe(1);
		expect(debouncedValues).toEqual([1]);
		expect(deepValues).toEqual([1]);
		expect(ignorableValues).toEqual([1]);
		expect(immediateValues).toEqual([0, 1]);
		expect(onceValues).toEqual([1]);
		expect(pausableValues).toEqual([1, 3]);
		expect(pausableWatch.isActive.value).toBe(true);
		expect(throttledWatchValues).toEqual([1]);
		expect(triggerableWatchValues).toEqual([0, 1]);
		expect(triggerableResult).toBe(0);
		expect(filteredWatchValues).toEqual([1]);
		expect(wheneverValues).toEqual([1, 2]);

		stopSync();
		stopSyncSignals();
		stopArrayWatch();
		limitedWatch.stop();
		stopDebouncedWatch();
		stopDeepWatch();
		ignorableWatch.stop();
		stopImmediateWatch();
		stopOnceWatch();
		pausableWatch.stop();
		stopThrottledWatch();
		triggerableWatch.stop();
		expect(triggerableWatch.trigger()).toBeUndefined();
		stopFilteredWatch();
		stopWhenever();
		debouncedHistory.dispose();
		throttledHistory.dispose();
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
