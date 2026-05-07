# Function coverage

VueUse is the main reference for API shape, behavior, and documentation
structure. This file tracks the reference APIs considered for `@sigrea/use`.

Status values:

- `Done`: implemented in `@sigrea/use`.
- `Todo`: still intended for `@sigrea/use`, but not complete yet.
- `Needs design`: may fit `@sigrea/use`, but the Sigrea-specific behavior needs
  a separate design decision first.
- `Out of scope`: tied to Vue component, template, directive, or provide/inject
  behavior that should not be redefined in `@sigrea/use`.

| Reference API | `@sigrea/use` API | Status |
| --- | --- | --- |
| `computedAsync` | `computedAsync` | Done |
| `computedEager` | `computedEager` | Done |
| `computedInject` | `-` | Out of scope |
| `computedWithControl` | `computedWithControl` | Done |
| `createDisposableDirective` | `-` | Out of scope |
| `createEventHook` | `createEventHook` | Done |
| `createGlobalState` | `-` | Needs design |
| `createInjectionState` | `-` | Out of scope |
| `createRef` | `createSignal` | Done |
| `createReusableTemplate` | `-` | Out of scope |
| `createSharedComposable` | `-` | Needs design |
| `createTemplatePromise` | `-` | Out of scope |
| `createUnrefFn` | `createResolveValueFn` | Done |
| `extendRef` | `extendSignal` | Done |
| `get` | `resolveValue` | Done |
| `injectLocal` | `-` | Out of scope |
| `isDefined` | `isDefined` | Done |
| `makeDestructurable` | `makeDestructurable` | Done |
| `onClickOutside` | `onClickOutside` | Done |
| `onElementRemoval` | `onElementRemoval` | Done |
| `onKeyStroke` | `onKeyStroke` | Done |
| `onLongPress` | `onLongPress` | Done |
| `onStartTyping` | `onStartTyping` | Done |
| `provideLocal` | `-` | Out of scope |
| `provideSSRWidth` | `-` | Out of scope |
| `reactify` | `reactify` | Done |
| `reactifyObject` | `reactifyObject` | Done |
| `reactiveComputed` | `reactiveComputed` | Done |
| `reactiveOmit` | `reactiveOmit` | Done |
| `reactivePick` | `reactivePick` | Done |
| `refAutoReset` | `signalAutoReset` | Done |
| `refDebounced` | `signalDebounced` | Done |
| `refDefault` | `signalDefault` | Done |
| `refManualReset` | `signalManualReset` | Done |
| `refThrottled` | `signalThrottled` | Done |
| `refWithControl` | `signalWithControl` | Needs design |
| `set` | `setValue` | Needs design |
| `syncRef` | `syncSignal` | Done |
| `syncRefs` | `syncSignals` | Done |
| `templateRef` | `-` | Out of scope |
| `toReactive` | `toDeepSignal` | Done |
| `toRef` | `toSignal` | Needs design |
| `toRefs` | `toSignals` | Needs design |
| `tryOnBeforeMount` | `-` | Needs design |
| `tryOnBeforeUnmount` | `-` | Needs design |
| `tryOnMounted` | `-` | Needs design |
| `tryOnScopeDispose` | `tryOnScopeDispose` | Done |
| `tryOnUnmounted` | `-` | Needs design |
| `unrefElement` | `-` | Out of scope |
| `until` | `until` | Done |
| `useActiveElement` | `useActiveElement` | Done |
| `useAnimate` | `useAnimate` | Done |
| `useArrayDifference` | `useArrayDifference` | Done |
| `useArrayEvery` | `useArrayEvery` | Done |
| `useArrayFilter` | `useArrayFilter` | Done |
| `useArrayFind` | `useArrayFind` | Done |
| `useArrayFindIndex` | `useArrayFindIndex` | Done |
| `useArrayFindLast` | `useArrayFindLast` | Done |
| `useArrayIncludes` | `useArrayIncludes` | Done |
| `useArrayJoin` | `useArrayJoin` | Done |
| `useArrayMap` | `useArrayMap` | Done |
| `useArrayReduce` | `useArrayReduce` | Done |
| `useArraySome` | `useArraySome` | Done |
| `useArrayUnique` | `useArrayUnique` | Done |
| `useAsyncQueue` | `useAsyncQueue` | Done |
| `useAsyncState` | `useAsyncState` | Done |
| `useBase64` | `useBase64` | Done |
| `useBattery` | `useBattery` | Done |
| `useBluetooth` | `useBluetooth` | Done |
| `useBreakpoints` | `useBreakpoints` | Done |
| `useBroadcastChannel` | `useBroadcastChannel` | Done |
| `useBrowserLocation` | `useBrowserLocation` | Done |
| `useCached` | `useCached` | Done |
| `useClipboard` | `useClipboard` | Done |
| `useClipboardItems` | `useClipboardItems` | Done |
| `useCloned` | `useCloned` | Done |
| `useColorMode` | `useColorMode` | Done |
| `useConfirmDialog` | `useConfirmDialog` | Done |
| `useCountdown` | `useCountdown` | Done |
| `useCounter` | `useCounter` | Done |
| `useCssSupports` | `useCssSupports` | Done |
| `useCssVar` | `useCssVar` | Done |
| `useCurrentElement` | `-` | Out of scope |
| `useCycleList` | `useCycleList` | Done |
| `useDark` | `useDark` | Done |
| `useDateFormat` | `useDateFormat` | Done |
| `useDebounceFn` | `useDebounceFn` | Done |
| `useDebouncedRefHistory` | `useDebouncedRefHistory` | Done |
| `useDeviceMotion` | `useDeviceMotion` | Done |
| `useDeviceOrientation` | `useDeviceOrientation` | Done |
| `useDevicePixelRatio` | `useDevicePixelRatio` | Done |
| `useDevicesList` | `useDevicesList` | Done |
| `useDisplayMedia` | `useDisplayMedia` | Done |
| `useDocumentVisibility` | `useDocumentVisibility` | Done |
| `useDraggable` | `useDraggable` | Done |
| `useDropZone` | `useDropZone` | Done |
| `useElementBounding` | `useElementBounding` | Done |
| `useElementByPoint` | `useElementByPoint` | Done |
| `useElementHover` | `useElementHover` | Done |
| `useElementSize` | `useElementSize` | Done |
| `useElementVisibility` | `useElementVisibility` | Done |
| `useEventBus` | `useEventBus` | Done |
| `useEventListener` | `useEventListener` | Done |
| `useEventSource` | `useEventSource` | Done |
| `useEyeDropper` | `useEyeDropper` | Done |
| `useFavicon` | `useFavicon` | Done |
| `useFetch` | `useFetch` | Done |
| `useFileDialog` | `useFileDialog` | Done |
| `useFileSystemAccess` | `useFileSystemAccess` | Done |
| `useFocus` | `useFocus` | Done |
| `useFocusWithin` | `useFocusWithin` | Done |
| `useFps` | `useFps` | Done |
| `useFullscreen` | `useFullscreen` | Done |
| `useGamepad` | `useGamepad` | Done |
| `useGeolocation` | `useGeolocation` | Done |
| `useIdle` | `useIdle` | Done |
| `useImage` | `useImage` | Done |
| `useInfiniteScroll` | `useInfiniteScroll` | Done |
| `useIntersectionObserver` | `useIntersectionObserver` | Done |
| `useInterval` | `useInterval` | Done |
| `useIntervalFn` | `useIntervalFn` | Done |
| `useKeyModifier` | `useKeyModifier` | Done |
| `useLastChanged` | `useLastChanged` | Done |
| `useLocalStorage` | `useLocalStorage` | Done |
| `useMagicKeys` | `useMagicKeys` | Done |
| `useManualRefHistory` | `useManualRefHistory` | Done |
| `useMediaControls` | `useMediaControls` | Done |
| `useMediaQuery` | `useMediaQuery` | Done |
| `useMemoize` | `useMemoize` | Done |
| `useMemory` | `useMemory` | Done |
| `useMounted` | `useMounted` | Done |
| `useMouse` | `useMouse` | Done |
| `useMouseInElement` | `useMouseInElement` | Done |
| `useMousePressed` | `useMousePressed` | Done |
| `useMutationObserver` | `useMutationObserver` | Done |
| `useNavigatorLanguage` | `useNavigatorLanguage` | Done |
| `useNetwork` | `useNetwork` | Done |
| `useNow` | `useNow` | Done |
| `useObjectUrl` | `useObjectUrl` | Done |
| `useOffsetPagination` | `useOffsetPagination` | Done |
| `useOnline` | `useOnline` | Done |
| `usePageLeave` | `usePageLeave` | Done |
| `useParallax` | `useParallax` | Done |
| `useParentElement` | `-` | Needs design |
| `usePerformanceObserver` | `usePerformanceObserver` | Done |
| `usePermission` | `usePermission` | Done |
| `usePointer` | `usePointer` | Done |
| `usePointerLock` | `usePointerLock` | Done |
| `usePointerSwipe` | `usePointerSwipe` | Done |
| `usePreferredColorScheme` | `usePreferredColorScheme` | Done |
| `usePreferredContrast` | `usePreferredContrast` | Done |
| `usePreferredDark` | `usePreferredDark` | Done |
| `usePreferredLanguages` | `usePreferredLanguages` | Done |
| `usePreferredReducedMotion` | `usePreferredReducedMotion` | Done |
| `usePreferredReducedTransparency` | `usePreferredReducedTransparency` | Done |
| `usePrevious` | `usePrevious` | Done |
| `useRafFn` | `useRafFn` | Done |
| `useRefHistory` | `useRefHistory` | Done |
| `useResizeObserver` | `useResizeObserver` | Done |
| `useSSRWidth` | `-` | Out of scope |
| `useScreenOrientation` | `useScreenOrientation` | Done |
| `useScreenSafeArea` | `useScreenSafeArea` | Done |
| `useScriptTag` | `useScriptTag` | Done |
| `useScroll` | `useScroll` | Done |
| `useScrollLock` | `useScrollLock` | Done |
| `useSessionStorage` | `useSessionStorage` | Done |
| `useShare` | `useShare` | Done |
| `useSorted` | `useSorted` | Done |
| `useSpeechRecognition` | `useSpeechRecognition` | Done |
| `useSpeechSynthesis` | `useSpeechSynthesis` | Done |
| `useStepper` | `useStepper` | Done |
| `useStorage` | `useStorage` | Done |
| `useStorageAsync` | `useStorageAsync` | Done |
| `useStyleTag` | `useStyleTag` | Done |
| `useSupported` | `useSupported` | Done |
| `useSwipe` | `useSwipe` | Done |
| `useTemplateRefsList` | `-` | Out of scope |
| `useTextDirection` | `useTextDirection` | Done |
| `useTextSelection` | `useTextSelection` | Done |
| `useTextareaAutosize` | `useTextareaAutosize` | Done |
| `useThrottleFn` | `useThrottleFn` | Done |
| `useThrottledRefHistory` | `useThrottledRefHistory` | Done |
| `useTimeAgo` | `useTimeAgo` | Done |
| `useTimeAgoIntl` | `useTimeAgoIntl` | Done |
| `useTimeout` | `useTimeout` | Done |
| `useTimeoutFn` | `useTimeoutFn` | Done |
| `useTimeoutPoll` | `useTimeoutPoll` | Done |
| `useTimestamp` | `useTimestamp` | Done |
| `useTitle` | `useTitle` | Done |
| `useToNumber` | `useToNumber` | Done |
| `useToString` | `useToString` | Done |
| `useToggle` | `useToggle` | Done |
| `useTransition` | `useTransition` | Done |
| `useUrlSearchParams` | `useUrlSearchParams` | Done |
| `useUserMedia` | `useUserMedia` | Done |
| `useVModel` | `-` | Out of scope |
| `useVModels` | `-` | Out of scope |
| `useVibrate` | `useVibrate` | Done |
| `useVirtualList` | `useVirtualList` | Done |
| `useWakeLock` | `useWakeLock` | Done |
| `useWebNotification` | `useWebNotification` | Done |
| `useWebSocket` | `useWebSocket` | Done |
| `useWebWorker` | `useWebWorker` | Done |
| `useWebWorkerFn` | `useWebWorkerFn` | Done |
| `useWindowFocus` | `useWindowFocus` | Done |
| `useWindowScroll` | `useWindowScroll` | Done |
| `useWindowSize` | `useWindowSize` | Done |
| `watchArray` | `watchArray` | Done |
| `watchAtMost` | `watchAtMost` | Done |
| `watchDebounced` | `watchDebounced` | Done |
| `watchDeep` | `watchDeep` | Done |
| `watchIgnorable` | `watchIgnorable` | Done |
| `watchImmediate` | `watchImmediate` | Done |
| `watchOnce` | `watchOnce` | Done |
| `watchPausable` | `watchPausable` | Done |
| `watchThrottled` | `watchThrottled` | Done |
| `watchTriggerable` | `watchTriggerable` | Done |
| `watchWithFilter` | `watchWithFilter` | Done |
| `whenever` | `whenever` | Done |
| `math/createGenericProjection` | `createGenericProjection` | Done |
| `math/createProjection` | `createProjection` | Done |
| `math/logicAnd` | `logicAnd` | Done |
| `math/logicNot` | `-` | Todo |
| `math/logicOr` | `-` | Todo |
| `math/useAbs` | `-` | Todo |
| `math/useAverage` | `-` | Todo |
| `math/useCeil` | `-` | Todo |
| `math/useClamp` | `-` | Todo |
| `math/useFloor` | `-` | Todo |
| `math/useMath` | `-` | Todo |
| `math/useMax` | `-` | Todo |
| `math/useMin` | `-` | Todo |
| `math/usePrecision` | `-` | Todo |
| `math/useProjection` | `-` | Todo |
| `math/useRound` | `-` | Todo |
| `math/useSum` | `-` | Todo |
| `math/useTrunc` | `-` | Todo |
