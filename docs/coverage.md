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
| `onLongPress` | `-` | Todo |
| `onStartTyping` | `-` | Todo |
| `provideLocal` | `-` | Out of scope |
| `provideSSRWidth` | `-` | Out of scope |
| `reactify` | `-` | Todo |
| `reactifyObject` | `-` | Todo |
| `reactiveComputed` | `-` | Todo |
| `reactiveOmit` | `-` | Todo |
| `reactivePick` | `-` | Todo |
| `refAutoReset` | `-` | Todo |
| `refDebounced` | `-` | Todo |
| `refDefault` | `-` | Todo |
| `refManualReset` | `-` | Todo |
| `refThrottled` | `-` | Todo |
| `refWithControl` | `-` | Todo |
| `set` | `-` | Todo |
| `syncRef` | `-` | Todo |
| `syncRefs` | `-` | Todo |
| `templateRef` | `-` | Out of scope |
| `toReactive` | `-` | Todo |
| `toRef` | `-` | Todo |
| `toRefs` | `-` | Todo |
| `tryOnBeforeMount` | `-` | Needs design |
| `tryOnBeforeUnmount` | `-` | Needs design |
| `tryOnMounted` | `-` | Needs design |
| `tryOnScopeDispose` | `-` | Todo |
| `tryOnUnmounted` | `-` | Needs design |
| `unrefElement` | `-` | Out of scope |
| `until` | `-` | Todo |
| `useActiveElement` | `-` | Todo |
| `useAnimate` | `-` | Todo |
| `useArrayDifference` | `-` | Todo |
| `useArrayEvery` | `-` | Todo |
| `useArrayFilter` | `-` | Todo |
| `useArrayFind` | `-` | Todo |
| `useArrayFindIndex` | `-` | Todo |
| `useArrayFindLast` | `-` | Todo |
| `useArrayIncludes` | `-` | Todo |
| `useArrayJoin` | `-` | Todo |
| `useArrayMap` | `-` | Todo |
| `useArrayReduce` | `-` | Todo |
| `useArraySome` | `-` | Todo |
| `useArrayUnique` | `-` | Todo |
| `useAsyncQueue` | `-` | Todo |
| `useAsyncState` | `-` | Todo |
| `useBase64` | `-` | Todo |
| `useBattery` | `-` | Todo |
| `useBluetooth` | `-` | Todo |
| `useBreakpoints` | `useBreakpoints` | Done |
| `useBroadcastChannel` | `-` | Todo |
| `useBrowserLocation` | `-` | Todo |
| `useCached` | `-` | Todo |
| `useClipboard` | `-` | Todo |
| `useClipboardItems` | `-` | Todo |
| `useCloned` | `-` | Todo |
| `useColorMode` | `-` | Todo |
| `useConfirmDialog` | `-` | Todo |
| `useCountdown` | `-` | Todo |
| `useCounter` | `useCounter` | Done |
| `useCssSupports` | `-` | Todo |
| `useCssVar` | `-` | Todo |
| `useCurrentElement` | `-` | Out of scope |
| `useCycleList` | `-` | Todo |
| `useDark` | `-` | Todo |
| `useDateFormat` | `-` | Todo |
| `useDebounceFn` | `useDebounceFn` | Done |
| `useDebouncedRefHistory` | `-` | Todo |
| `useDeviceMotion` | `-` | Todo |
| `useDeviceOrientation` | `-` | Todo |
| `useDevicePixelRatio` | `-` | Todo |
| `useDevicesList` | `-` | Todo |
| `useDisplayMedia` | `-` | Todo |
| `useDocumentVisibility` | `useDocumentVisibility` | Done |
| `useDraggable` | `-` | Todo |
| `useDropZone` | `-` | Todo |
| `useElementBounding` | `-` | Todo |
| `useElementByPoint` | `-` | Todo |
| `useElementHover` | `-` | Todo |
| `useElementSize` | `useElementSize` | Done |
| `useElementVisibility` | `-` | Todo |
| `useEventBus` | `-` | Todo |
| `useEventListener` | `useEventListener` | Done |
| `useEventSource` | `-` | Todo |
| `useEyeDropper` | `-` | Todo |
| `useFavicon` | `-` | Todo |
| `useFetch` | `-` | Todo |
| `useFileDialog` | `-` | Todo |
| `useFileSystemAccess` | `-` | Todo |
| `useFocus` | `useFocus` | Done |
| `useFocusWithin` | `-` | Todo |
| `useFps` | `-` | Todo |
| `useFullscreen` | `-` | Todo |
| `useGamepad` | `-` | Todo |
| `useGeolocation` | `-` | Todo |
| `useIdle` | `-` | Todo |
| `useImage` | `-` | Todo |
| `useInfiniteScroll` | `-` | Todo |
| `useIntersectionObserver` | `-` | Todo |
| `useInterval` | `useInterval` | Done |
| `useIntervalFn` | `useIntervalFn` | Done |
| `useKeyModifier` | `-` | Todo |
| `useLastChanged` | `-` | Todo |
| `useLocalStorage` | `useLocalStorage` | Done |
| `useMagicKeys` | `-` | Todo |
| `useManualRefHistory` | `useManualRefHistory` | Done |
| `useMediaControls` | `-` | Todo |
| `useMediaQuery` | `useMediaQuery` | Done |
| `useMemoize` | `-` | Todo |
| `useMemory` | `-` | Todo |
| `useMounted` | `-` | Needs design |
| `useMouse` | `useMouse` | Done |
| `useMouseInElement` | `-` | Todo |
| `useMousePressed` | `-` | Todo |
| `useMutationObserver` | `-` | Todo |
| `useNavigatorLanguage` | `-` | Todo |
| `useNetwork` | `-` | Todo |
| `useNow` | `-` | Todo |
| `useObjectUrl` | `-` | Todo |
| `useOffsetPagination` | `-` | Todo |
| `useOnline` | `useOnline` | Done |
| `usePageLeave` | `-` | Todo |
| `useParallax` | `-` | Todo |
| `useParentElement` | `-` | Needs design |
| `usePerformanceObserver` | `-` | Todo |
| `usePermission` | `-` | Todo |
| `usePointer` | `-` | Todo |
| `usePointerLock` | `-` | Todo |
| `usePointerSwipe` | `-` | Todo |
| `usePreferredColorScheme` | `-` | Todo |
| `usePreferredContrast` | `-` | Todo |
| `usePreferredDark` | `usePreferredDark` | Done |
| `usePreferredLanguages` | `-` | Todo |
| `usePreferredReducedMotion` | `-` | Todo |
| `usePreferredReducedTransparency` | `-` | Todo |
| `usePrevious` | `usePrevious` | Done |
| `useRafFn` | `-` | Todo |
| `useRefHistory` | `useRefHistory` | Done |
| `useResizeObserver` | `-` | Todo |
| `useSSRWidth` | `-` | Out of scope |
| `useScreenOrientation` | `-` | Todo |
| `useScreenSafeArea` | `-` | Todo |
| `useScriptTag` | `-` | Todo |
| `useScroll` | `-` | Todo |
| `useScrollLock` | `-` | Todo |
| `useSessionStorage` | `useSessionStorage` | Done |
| `useShare` | `-` | Todo |
| `useSorted` | `-` | Todo |
| `useSpeechRecognition` | `-` | Todo |
| `useSpeechSynthesis` | `-` | Todo |
| `useStepper` | `-` | Todo |
| `useStorage` | `useStorage` | Done |
| `useStorageAsync` | `-` | Todo |
| `useStyleTag` | `-` | Todo |
| `useSupported` | `-` | Todo |
| `useSwipe` | `-` | Todo |
| `useTemplateRefsList` | `-` | Out of scope |
| `useTextDirection` | `-` | Todo |
| `useTextSelection` | `-` | Todo |
| `useTextareaAutosize` | `-` | Todo |
| `useThrottleFn` | `useThrottleFn` | Done |
| `useThrottledRefHistory` | `-` | Todo |
| `useTimeAgo` | `-` | Todo |
| `useTimeAgoIntl` | `-` | Todo |
| `useTimeout` | `useTimeout` | Done |
| `useTimeoutFn` | `useTimeoutFn` | Done |
| `useTimeoutPoll` | `-` | Todo |
| `useTimestamp` | `-` | Todo |
| `useTitle` | `-` | Todo |
| `useToNumber` | `-` | Todo |
| `useToString` | `-` | Todo |
| `useToggle` | `useToggle` | Done |
| `useTransition` | `-` | Todo |
| `useUrlSearchParams` | `-` | Todo |
| `useUserMedia` | `-` | Todo |
| `useVModel` | `-` | Out of scope |
| `useVModels` | `-` | Out of scope |
| `useVibrate` | `-` | Todo |
| `useVirtualList` | `-` | Needs design |
| `useWakeLock` | `-` | Todo |
| `useWebNotification` | `-` | Todo |
| `useWebSocket` | `-` | Todo |
| `useWebWorker` | `-` | Todo |
| `useWebWorkerFn` | `-` | Todo |
| `useWindowFocus` | `-` | Todo |
| `useWindowScroll` | `-` | Todo |
| `useWindowSize` | `useWindowSize` | Done |
| `watchArray` | `-` | Todo |
| `watchAtMost` | `-` | Todo |
| `watchDebounced` | `-` | Todo |
| `watchDeep` | `-` | Todo |
| `watchIgnorable` | `-` | Todo |
| `watchImmediate` | `-` | Todo |
| `watchOnce` | `-` | Todo |
| `watchPausable` | `-` | Todo |
| `watchThrottled` | `-` | Todo |
| `watchTriggerable` | `-` | Todo |
| `watchWithFilter` | `-` | Todo |
| `whenever` | `-` | Todo |
| `math/createGenericProjection` | `-` | Todo |
| `math/createProjection` | `-` | Todo |
| `math/logicAnd` | `-` | Todo |
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
