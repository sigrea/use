import {
	type Computed,
	type DeepSignal,
	type ReadonlySignal,
	type Signal,
	computed,
	deepSignal,
	readonly,
	signal,
} from "@sigrea/core";
import { describe, expectTypeOf, it } from "vitest";

import type {
	AfterFetchContext,
	Arrayable,
	AsyncComputedOptions,
	AsyncStorageLike,
	AsyncStorageSerializer,
	BasicColorMode,
	BatteryManagerLike,
	BatteryNavigatorLike,
	BeforeFetchContext,
	BluetoothDeviceLike,
	BluetoothLEScanFilterLike,
	BluetoothLike,
	BluetoothNavigatorLike,
	BluetoothRemoteGATTCharacteristicLike,
	BluetoothRemoteGATTServerLike,
	BluetoothRemoteGATTServiceLike,
	BluetoothRequestDeviceOptionsLike,
	BluetoothServiceUUIDLike,
	Breakpoints,
	BroadcastChannelLike,
	BroadcastChannelWindowLike,
	BrowserLocationHistoryLike,
	BrowserLocationLike,
	BrowserLocationTrigger,
	BrowserLocationWindowLike,
	BrowserLocationWritableProperty,
	ClipboardDocumentBodyLike,
	ClipboardDocumentLike,
	ClipboardItemLike,
	ClipboardItemPresentationStyleLike,
	ClipboardLike,
	ClipboardNavigatorLike,
	ClipboardTextareaLike,
	CloneFn,
	ColorModeSelection,
	ComputedEagerOptions,
	ComputedEagerReturn,
	ComputedWithControlOptions,
	ComputedWithControlReturn,
	ConfigurableEventFilter,
	CreateSignalReturn,
	CssSupportsLike,
	CubicBezierPoints,
	DateLike,
	DeviceMotionEventConstructorLike,
	DeviceMotionPermissionState,
	DeviceOrientationEventConstructorLike,
	DeviceOrientationPermissionState,
	DocumentVisibilityDocumentLike,
	EasingFunction,
	EventBusKey,
	EventBusListener,
	EventFilter,
	EventHook,
	EventHookArgs,
	EventHookCallback,
	EventHookOn,
	EventHookReturn,
	EventSourceConstructorLike,
	EventSourceLike,
	EventSourceStatus,
	EventSourceWindowLike,
	ExtendSignalOptions,
	ExtendSignalReturn,
	ExtendSignalSource,
	ExtendSignalUnwrapped,
	EyeDropperConstructorLike,
	EyeDropperLike,
	EyeDropperOpenOptions,
	EyeDropperResult,
	FileSystemAccessAcceptType,
	FileSystemAccessCreateWritableOptions,
	FileSystemAccessDataType,
	FileSystemAccessFileHandleLike,
	FileSystemAccessPickerOptions,
	FileSystemAccessShowOpenFileOptions,
	FileSystemAccessShowSaveFileOptions,
	FileSystemAccessStartInDirectory,
	FileSystemAccessWindowLike,
	FileSystemAccessWritableFileStreamLike,
	FileSystemAccessWriteData,
	FocusWithinElementLike,
	FocusableElementLike,
	FunctionWrapperOptions,
	InterpolationFunction,
	IsDefinedReturn,
	KeyFilter,
	KeyPredicate,
	KeyStrokeEventName,
	MagicKeysInternal,
	MatchMediaWindow,
	MaybeTransitionEasing,
	MaybeValue,
	MaybeValueArgs,
	OnClickOutsideOptions,
	OnElementRemovalDocumentLike,
	OnElementRemovalOptions,
	OnElementRemovalReturn,
	OnElementRemovalWindowLike,
	OnFetchErrorContext,
	OnKeyStrokeHandler,
	OnKeyStrokeOptions,
	OnKeyStrokeReturn,
	OnLongPressDelay,
	OnLongPressHandler,
	OnLongPressModifiers,
	OnLongPressOptions,
	OnLongPressReturn,
	OnStartTypingDocumentLike,
	OnStartTypingHandler,
	OnStartTypingOptions,
	OnStartTypingReturn,
	OnlineNavigatorLike,
	OrientationLockType,
	OrientationType,
	Position,
	ProjectorFunction,
	ReactifyNested,
	ReactifyObjectOptions,
	ReactifyObjectReturn,
	ReactifyReturn,
	ReactiveComputedGetter,
	ReactiveComputedReturn,
	ReactiveOmitPredicate,
	ReactiveOmitReturn,
	ReactivePickPredicate,
	ReactivePickReturn,
	RemovableSignal,
	ResizeObserverWindowLike,
	ResolveValueFn,
	SignalAutoResetReturn,
	SignalDebouncedOptions,
	SignalDebouncedReturn,
	SignalDefaultReturn,
	SignalManualResetReturn,
	SignalThrottledReturn,
	SpeechRecognitionAlternativeLike,
	SpeechRecognitionConstructorLike,
	SpeechRecognitionErrorCode,
	SpeechRecognitionErrorEventLike,
	SpeechRecognitionEventLike,
	SpeechRecognitionForWindow,
	SpeechRecognitionLike,
	SpeechRecognitionResultLike,
	SpeechRecognitionResultListLike,
	SpeechSynthesisErrorCode,
	SpeechSynthesisErrorEventLike,
	SpeechSynthesisEventLike,
	SpeechSynthesisForWindow,
	SpeechSynthesisLike,
	SpeechSynthesisStatus,
	SpeechSynthesisUtteranceConstructorLike,
	SpeechSynthesisUtteranceForWindow,
	SpeechSynthesisUtteranceLike,
	SpeechSynthesisVoiceForWindow,
	SpeechSynthesisVoiceLike,
	StorageSerializer,
	StorageWindowLike,
	SyncSignalDirection,
	SyncSignalOptions,
	SyncSignalReturn,
	SyncSignalTransform,
	SyncSignalsOptions,
	SyncSignalsReturn,
	ToDeepSignalReturn,
	TransitionEasing,
	TransitionOptions,
	TryOnScopeDisposeReturn,
	UntilArrayInstance,
	UntilBaseInstance,
	UntilToMatchOptions,
	UntilValueInstance,
	UrlParams,
	UseActiveElementDocumentLike,
	UseActiveElementOptions,
	UseActiveElementReturn,
	UseActiveElementWindowLike,
	UseAnimateKeyframes,
	UseAnimateOptions,
	UseAnimateReturn,
	UseAnimateWindowLike,
	UseArrayDifferenceCompareFn,
	UseArrayDifferenceOptions,
	UseArrayDifferenceReturn,
	UseArrayEveryPredicate,
	UseArrayEveryReturn,
	UseArrayFilterPredicate,
	UseArrayFilterReturn,
	UseArrayFindIndexPredicate,
	UseArrayFindIndexReturn,
	UseArrayFindLastPredicate,
	UseArrayFindLastReturn,
	UseArrayFindPredicate,
	UseArrayFindReturn,
	UseArrayIncludesComparatorFn,
	UseArrayIncludesOptions,
	UseArrayIncludesReturn,
	UseArrayJoinReturn,
	UseArrayMapCallback,
	UseArrayMapReturn,
	UseArrayReduceReducer,
	UseArrayReduceReturn,
	UseArraySomePredicate,
	UseArraySomeReturn,
	UseArrayUniqueCompareFn,
	UseArrayUniqueReturn,
	UseAsyncQueueOptions,
	UseAsyncQueueResult,
	UseAsyncQueueResultList,
	UseAsyncQueueResultState,
	UseAsyncQueueReturn,
	UseAsyncQueueTask,
	UseAsyncStateOptions,
	UseAsyncStateReturn,
	UseAsyncStateReturnBase,
	UseAsyncStateSource,
	UseBase64ImageOptions,
	UseBase64ObjectOptions,
	UseBase64Options,
	UseBase64Return,
	UseBase64Source,
	UseBase64WindowLike,
	UseBatteryOptions,
	UseBatteryReturn,
	UseBluetoothOptions,
	UseBluetoothReturn,
	UseBreakpointsOptions,
	UseBroadcastChannelOptions,
	UseBroadcastChannelReturn,
	UseBrowserLocationOptions,
	UseBrowserLocationReturn,
	UseCachedComparator,
	UseCachedOptions,
	UseCachedReturn,
	UseClipboardCopyFn,
	UseClipboardItemsCopyFn,
	UseClipboardItemsOptions,
	UseClipboardItemsReturn,
	UseClipboardItemsSource,
	UseClipboardItemsWindowLike,
	UseClipboardOptions,
	UseClipboardReturn,
	UseClipboardTextSource,
	UseClipboardWindowLike,
	UseClonedCloneFn,
	UseClonedOptions,
	UseClonedReturn,
	UseColorModeDefaultHandler,
	UseColorModeDocumentLike,
	UseColorModeOptions,
	UseColorModeReturn,
	UseColorModeWindowLike,
	UseConfirmDialogResult,
	UseConfirmDialogReturn,
	UseCountdownOptions,
	UseCountdownReturn,
	UseCountdownScheduler,
	UseCssSupportsOptions,
	UseCssSupportsReturn,
	UseCssSupportsWindowLike,
	UseCssVarOptions,
	UseCssVarReturn,
	UseCssVarWindowLike,
	UseCycleListOptions,
	UseCycleListReturn,
	UseDarkOptions,
	UseDarkReturn,
	UseDateFormatOptions,
	UseDateFormatReturn,
	UseDebouncedRefHistoryOptions,
	UseDebouncedRefHistoryReturn,
	UseDeviceMotionOptions,
	UseDeviceMotionReturn,
	UseDeviceMotionWindowLike,
	UseDeviceOrientationOptions,
	UseDeviceOrientationReturn,
	UseDeviceOrientationWindowLike,
	UseDevicePixelRatioOptions,
	UseDevicePixelRatioReturn,
	UseDevicePixelRatioWindowLike,
	UseDevicesListMediaDevicesLike,
	UseDevicesListMediaStreamLike,
	UseDevicesListMediaStreamTrackLike,
	UseDevicesListNavigatorLike,
	UseDevicesListOptions,
	UseDevicesListPermissionName,
	UseDevicesListPermissionStatusLike,
	UseDevicesListPermissionsLike,
	UseDevicesListReturn,
	UseDisplayMediaMediaDevicesLike,
	UseDisplayMediaMediaStreamLike,
	UseDisplayMediaMediaStreamTrackLike,
	UseDisplayMediaNavigatorLike,
	UseDisplayMediaOptions,
	UseDisplayMediaReturn,
	UseDocumentVisibilityOptions,
	UseDraggableAxis,
	UseDraggableDraggingElement,
	UseDraggableElement,
	UseDraggableOptions,
	UseDraggablePointerType,
	UseDraggableReturn,
	UseDropZoneDataTypes,
	UseDropZoneDataTypesValidator,
	UseDropZoneEventCallback,
	UseDropZoneFiles,
	UseDropZoneOptions,
	UseDropZoneReturn,
	UseDropZoneTarget,
	UseElementBoundingOptions,
	UseElementBoundingReturn,
	UseElementBoundingUpdateTiming,
	UseElementBoundingWindowLike,
	UseElementByPointDocumentLike,
	UseElementByPointElement,
	UseElementByPointInterval,
	UseElementByPointOptions,
	UseElementByPointReturn,
	UseElementByPointScheduler,
	UseElementByPointWindowLike,
	UseElementHoverDocumentLike,
	UseElementHoverOptions,
	UseElementHoverReturn,
	UseElementHoverWindowLike,
	UseElementSizeOptions,
	UseElementVisibilityOptions,
	UseElementVisibilityReturn,
	UseElementVisibilityWindowLike,
	UseEventBusReturn,
	UseEventSourceOptions,
	UseEventSourceReturn,
	UseEventSourceSerializer,
	UseEventSourceStatus,
	UseEyeDropperOptions,
	UseEyeDropperReturn,
	UseEyeDropperWindowLike,
	UseFaviconDocumentLike,
	UseFaviconOptions,
	UseFaviconReturn,
	UseFetchFetch,
	UseFetchOptions,
	UseFetchReturn,
	UseFetchReturnBase,
	UseFetchUrl,
	UseFetchWindowLike,
	UseFileDialogDocumentLike,
	UseFileDialogInputLike,
	UseFileDialogOpenOptions,
	UseFileDialogOptions,
	UseFileDialogReturn,
	UseFileSystemAccessOpenOptions,
	UseFileSystemAccessOptions,
	UseFileSystemAccessReturn,
	UseFileSystemAccessSaveOptions,
	UseFocusOptions,
	UseFocusWithinReturn,
	UseFpsOptions,
	UseFpsPerformanceLike,
	UseFpsReturn,
	UseFpsWindowLike,
	UseFullscreenDocumentLike,
	UseFullscreenElementLike,
	UseFullscreenEnterOptions,
	UseFullscreenOptions,
	UseFullscreenReturn,
	UseGamepadButtonLike,
	UseGamepadGamepadLike,
	UseGamepadGamepadSnapshot,
	UseGamepadHapticActuatorLike,
	UseGamepadNavigatorLike,
	UseGamepadOptions,
	UseGamepadReturn,
	UseGamepadWindowLike,
	UseGeolocationCoordinates,
	UseGeolocationGeolocationLike,
	UseGeolocationNavigatorLike,
	UseGeolocationOptions,
	UseGeolocationPositionLike,
	UseGeolocationReturn,
	UseIdleDocumentLike,
	UseIdleEventName,
	UseIdleOptions,
	UseIdleReturn,
	UseIdleWindowLike,
	UseImageAsyncStateOptions,
	UseImageOptions,
	UseImageReturn,
	UseImageWindowLike,
	UseInfiniteScrollArrivedState,
	UseInfiniteScrollDirection,
	UseInfiniteScrollDirections,
	UseInfiniteScrollOptions,
	UseInfiniteScrollReturn,
	UseInfiniteScrollState,
	UseInfiniteScrollWindowLike,
	UseIntersectionObserverOptions,
	UseIntersectionObserverReturn,
	UseIntersectionObserverTarget,
	UseIntersectionObserverWindowLike,
	UseIntervalFnReturn,
	UseKeyModifier,
	UseKeyModifierDocumentLike,
	UseKeyModifierEventName,
	UseKeyModifierOptions,
	UseKeyModifierReturn,
	UseLastChangedOptions,
	UseLastChangedReturn,
	UseMagicKeysOptions,
	UseMagicKeysReturn,
	UseMagicKeysWindowLike,
	UseMediaControlsDocumentLike,
	UseMediaControlsOptions,
	UseMediaControlsReturn,
	UseMediaControlsSource,
	UseMediaControlsTextTrack,
	UseMediaControlsTextTrackSource,
	UseMediaQueryOptions,
	UseMemoizeCache,
	UseMemoizeCacheKey,
	UseMemoizeOptions,
	UseMemoizeReturn,
	UseMemoryInfo,
	UseMemoryOptions,
	UseMemoryPerformanceLike,
	UseMemoryReturn,
	UseMemoryWindowLike,
	UseMountedReturn,
	UseMouseInElementOptions,
	UseMouseInElementReturn,
	UseMouseInElementWindowLike,
	UseMouseOptions,
	UseMousePressedOptions,
	UseMousePressedReturn,
	UseMousePressedSourceEvent,
	UseMousePressedWindowLike,
	UseMutationObserverOptions,
	UseMutationObserverReturn,
	UseMutationObserverTarget,
	UseMutationObserverWindowLike,
	UseNavigatorLanguageNavigatorLike,
	UseNavigatorLanguageOptions,
	UseNavigatorLanguageReturn,
	UseNetworkConnectionLike,
	UseNetworkEffectiveType,
	UseNetworkNavigatorLike,
	UseNetworkOptions,
	UseNetworkReturn,
	UseNetworkType,
	UseNowControlsReturn,
	UseNowInterval,
	UseNowOptions,
	UseNowReturn,
	UseNowScheduler,
	UseNowWindowLike,
	UseObjectUrlObject,
	UseObjectUrlOptions,
	UseObjectUrlReturn,
	UseObjectUrlUrlLike,
	UseObjectUrlWindowLike,
	UseOffsetPaginationChangePayload,
	UseOffsetPaginationOptions,
	UseOffsetPaginationReturn,
	UseOnlineOptions,
	UsePageLeaveOptions,
	UsePageLeaveReturn,
	UseParallaxAdjust,
	UseParallaxOptions,
	UseParallaxReturn,
	UseParallaxScreenOrientationLike,
	UseParallaxSource,
	UseParallaxWindowLike,
	UsePerformanceObserverObserveOptions,
	UsePerformanceObserverOptions,
	UsePerformanceObserverReturn,
	UsePerformanceObserverWindowLike,
	UsePermissionDescriptor,
	UsePermissionName,
	UsePermissionNavigatorLike,
	UsePermissionOptions,
	UsePermissionPermissionsLike,
	UsePermissionReturn,
	UsePermissionSource,
	UsePermissionStatusLike,
	UsePointerLockDocumentLike,
	UsePointerLockElementLike,
	UsePointerLockOptions,
	UsePointerLockReturn,
	UsePointerLockRootLike,
	UsePointerOptions,
	UsePointerReturn,
	UsePointerState,
	UsePointerSwipeDirection,
	UsePointerSwipeElement,
	UsePointerSwipeOptions,
	UsePointerSwipePointerType,
	UsePointerSwipeReturn,
	UsePointerType,
	UsePreferredColorScheme,
	UsePreferredColorSchemeReturn,
	UsePreferredContrast,
	UsePreferredContrastReturn,
	UsePreferredLanguagesNavigatorLike,
	UsePreferredLanguagesOptions,
	UsePreferredLanguagesReturn,
	UsePreferredReducedMotion,
	UsePreferredReducedMotionReturn,
	UsePreferredReducedTransparency,
	UsePreferredReducedTransparencyReturn,
	UseProjection,
	UseRafFnCallback,
	UseRafFnCallbackArguments,
	UseRafFnOptions,
	UseRafFnReturn,
	UseRafFnWindowLike,
	UseRefHistoryRecord,
	UseResizeObserverOptions,
	UseResizeObserverReturn,
	UseResizeObserverTarget,
	UseScreenOrientationOptions,
	UseScreenOrientationReturn,
	UseScreenOrientationScreenOrientationLike,
	UseScreenOrientationWindowLike,
	UseScreenSafeAreaDocumentLike,
	UseScreenSafeAreaElementLike,
	UseScreenSafeAreaOptions,
	UseScreenSafeAreaReturn,
	UseScreenSafeAreaVisualViewportLike,
	UseScreenSafeAreaWindowLike,
	UseScriptTagDocumentLike,
	UseScriptTagOptions,
	UseScriptTagReturn,
	UseScrollArrivedState,
	UseScrollDirection,
	UseScrollDirections,
	UseScrollDocumentLike,
	UseScrollLockElement,
	UseScrollLockOptions,
	UseScrollLockReturn,
	UseScrollLockWindowLike,
	UseScrollOptions,
	UseScrollReturn,
	UseScrollWindowLike,
	UseShareData,
	UseShareNavigatorLike,
	UseShareOptions,
	UseShareReturn,
	UseSortedCompareFn,
	UseSortedOptions,
	UseSortedReturn,
	UseSortedSortFn,
	UseSpeechRecognitionOptions,
	UseSpeechRecognitionReturn,
	UseSpeechRecognitionWindowLike,
	UseSpeechRecognitionWindowOptions,
	UseSpeechSynthesisOptions,
	UseSpeechSynthesisReturn,
	UseSpeechSynthesisWindowLike,
	UseSpeechSynthesisWindowOptions,
	UseStepperArrayStep,
	UseStepperObjectStepName,
	UseStepperObjectStepValue,
	UseStepperObjectSteps,
	UseStepperResolvedObject,
	UseStepperResolvedStep,
	UseStepperReturn,
	UseStorageAsyncOptions,
	UseStorageAsyncReturn,
	UseStorageOptions,
	UseStyleTagDocumentLike,
	UseStyleTagOptions,
	UseStyleTagReturn,
	UseSupportedReturn,
	UseSwipeDirection,
	UseSwipeOptions,
	UseSwipeReturn,
	UseSwipeWindowLike,
	UseTextDirectionDocumentLike,
	UseTextDirectionOptions,
	UseTextDirectionReturn,
	UseTextDirectionValue,
	UseTextSelectionDocumentLike,
	UseTextSelectionOptions,
	UseTextSelectionReturn,
	UseTextSelectionWindowLike,
	UseTextareaAutosizeOptions,
	UseTextareaAutosizeReturn,
	UseTextareaAutosizeStyleProp,
	UseTextareaAutosizeWatchSource,
	UseTextareaAutosizeWindowLike,
	UseThrottledRefHistoryOptions,
	UseThrottledRefHistoryReturn,
	UseTimeAgoControlsReturn,
	UseTimeAgoFormatOptions,
	UseTimeAgoIntlControlsReturn,
	UseTimeAgoIntlFormatOptions,
	UseTimeAgoIntlJoinParts,
	UseTimeAgoIntlOptions,
	UseTimeAgoIntlReturn,
	UseTimeAgoIntlUnit,
	UseTimeAgoMessages,
	UseTimeAgoOptions,
	UseTimeAgoReturn,
	UseTimeAgoUnit,
	UseTimeAgoUnitNamesDefault,
	UseTimeoutPollCallback,
	UseTimeoutPollOptions,
	UseTimeoutPollReturn,
	UseTimestampControlsReturn,
	UseTimestampInterval,
	UseTimestampOptions,
	UseTimestampReturn,
	UseTimestampScheduler,
	UseTitleDocumentLike,
	UseTitleOptions,
	UseTitleRestore,
	UseTitleReturn,
	UseTitleTemplate,
	UseToNumberOptions,
	UseToStringReturn,
	UseToggleOptions,
	UseTransitionOptions,
	UseTransitionReturn,
	UseTransitionVector,
	UseTransitionWindowLike,
	UseUrlSearchParamsHistoryLike,
	UseUrlSearchParamsLocationLike,
	UseUrlSearchParamsMode,
	UseUrlSearchParamsOptions,
	UseUrlSearchParamsWindowLike,
	UseUrlSearchParamsWriteMode,
	UseUserMediaMediaDevicesLike,
	UseUserMediaMediaStreamLike,
	UseUserMediaMediaStreamTrackLike,
	UseUserMediaNavigatorLike,
	UseUserMediaOptions,
	UseUserMediaReturn,
	UseVibrateNavigatorLike,
	UseVibrateOptions,
	UseVibratePattern,
	UseVibrateReturn,
	UseVibrateScheduler,
	UseVirtualListHorizontalOptions,
	UseVirtualListItem,
	UseVirtualListItemSize,
	UseVirtualListOptions,
	UseVirtualListOptionsBase,
	UseVirtualListReturn,
	UseVirtualListVerticalOptions,
	UseWakeLockDocumentLike,
	UseWakeLockNavigatorLike,
	UseWakeLockOptions,
	UseWakeLockReturn,
	UseWakeLockSentinelLike,
	UseWakeLockWakeLockLike,
	UseWebNotificationConstructorLike,
	UseWebNotificationConstructorOptions,
	UseWebNotificationNotificationLike,
	UseWebNotificationOptions,
	UseWebNotificationOptionsBase,
	UseWebNotificationReturn,
	UseWebNotificationWindowLike,
	UseWebSocketAutoReconnectOptions,
	UseWebSocketHeartbeatMessage,
	UseWebSocketHeartbeatOptions,
	UseWebSocketHeartbeatScheduler,
	UseWebSocketOptions,
	UseWebSocketReturn,
	UseWebSocketSendData,
	UseWebSocketStatus,
	UseWebSocketWindowLike,
	UseWebWorkerConstructorSource,
	UseWebWorkerFnBlobConstructorLike,
	UseWebWorkerFnCallable,
	UseWebWorkerFnLocalDependency,
	UseWebWorkerFnOptions,
	UseWebWorkerFnResult,
	UseWebWorkerFnReturn,
	UseWebWorkerFnStatus,
	UseWebWorkerFnTerminateStatus,
	UseWebWorkerFnUrlLike,
	UseWebWorkerFnWindowLike,
	UseWebWorkerOptions,
	UseWebWorkerReturn,
	UseWebWorkerSource,
	UseWebWorkerWindowLike,
	UseWindowFocusDocumentLike,
	UseWindowFocusOptions,
	UseWindowFocusReturn,
	UseWindowFocusWindowLike,
	UseWindowScrollOptions,
	UseWindowScrollReturn,
	UseWindowSizeOptions,
	WakeLockType,
	WatchArrayCallback,
	WatchArrayOptions,
	WatchArrayReturn,
	WatchArraySource,
	WatchAtMostCallback,
	WatchAtMostOptions,
	WatchAtMostReturn,
	WatchAtMostSource,
	WatchAtMostSourceListCallback,
	WatchAtMostSourceValues,
	WatchDebouncedCallback,
	WatchDebouncedOptions,
	WatchDebouncedReturn,
	WatchDebouncedSource,
	WatchDebouncedSourceValues,
	WatchDeepCallback,
	WatchDeepOptions,
	WatchDeepReturn,
	WatchDeepSource,
	WatchDeepSourceValues,
	WatchIgnorableCallback,
	WatchIgnorableIgnorePrevAsyncUpdates,
	WatchIgnorableIgnoreUpdates,
	WatchIgnorableOptions,
	WatchIgnorableReturn,
	WatchIgnorableSource,
	WatchIgnorableSourceValues,
	WatchImmediateCallback,
	WatchImmediateOptions,
	WatchImmediateReturn,
	WatchImmediateSource,
	WatchImmediateSourceValues,
	WatchOnceCallback,
	WatchOnceOptions,
	WatchOnceReturn,
	WatchOnceSource,
	WatchOnceSourceValues,
	WatchPausableCallback,
	WatchPausableInitialState,
	WatchPausableOptions,
	WatchPausableReturn,
	WatchPausableSource,
	WatchPausableSourceValues,
	WatchThrottledCallback,
	WatchThrottledOptions,
	WatchThrottledReturn,
	WatchThrottledSource,
	WatchThrottledSourceValues,
	WatchTriggerableCallback,
	WatchTriggerableOptions,
	WatchTriggerableReturn,
	WatchTriggerableSource,
	WatchTriggerableSourceOldValues,
	WatchTriggerableSourceValues,
	WatchWithFilterCallback,
	WatchWithFilterOptions,
	WatchWithFilterReturn,
	WatchWithFilterSource,
	WatchWithFilterSourceValues,
	WebSocketConstructorLike,
	WebSocketLike,
	WheneverCallback,
	WheneverOptions,
	WheneverReturn,
	WheneverSource,
	WheneverSourceValue,
	WheneverTruthy,
	WindowLike,
	WorkerConstructorLike,
	WorkerLike,
	WritableComputedWithControlReturn,
} from "../../../index";
import {
	DefaultMagicKeysAliasMap,
	StorageSerializers,
	TransitionPresets,
	cloneStructured,
	computedAsync,
	computedEager,
	computedWithControl,
	createEventHook,
	createGenericProjection,
	createProjection,
	createResolveValueFn,
	createSignal,
	extendSignal,
	formatDate,
	formatTimeAgo,
	formatTimeAgoIntl,
	formatTimeAgoIntlParts,
	isDefined,
	makeDestructurable,
	normalizeDate,
	onClickOutside,
	onElementRemoval,
	onKeyDown,
	onKeyPressed,
	onKeyStroke,
	onKeyUp,
	onLongPress,
	onStartTyping,
	reactify,
	reactifyObject,
	reactiveComputed,
	reactiveOmit,
	reactivePick,
	resolveValue,
	signalAutoReset,
	signalDebounced,
	signalDefault,
	signalManualReset,
	signalThrottled,
	syncSignal,
	syncSignals,
	toDeepSignal,
	transition,
	tryOnScopeDispose,
	until,
	useActiveElement,
	useAnimate,
	useArrayDifference,
	useArrayEvery,
	useArrayFilter,
	useArrayFind,
	useArrayFindIndex,
	useArrayFindLast,
	useArrayIncludes,
	useArrayJoin,
	useArrayMap,
	useArrayReduce,
	useArraySome,
	useArrayUnique,
	useAsyncQueue,
	useAsyncState,
	useBase64,
	useBattery,
	useBluetooth,
	useBreakpoints,
	useBroadcastChannel,
	useBrowserLocation,
	useCached,
	useClipboard,
	useClipboardItems,
	useCloned,
	useColorMode,
	useConfirmDialog,
	useCountdown,
	useCssSupports,
	useCssVar,
	useCycleList,
	useDark,
	useDateFormat,
	useDebounceFn,
	useDebouncedRefHistory,
	useDeviceMotion,
	useDeviceOrientation,
	useDevicePixelRatio,
	useDevicesList,
	useDisplayMedia,
	useDocumentVisibility,
	useDraggable,
	useDropZone,
	useElementBounding,
	useElementByPoint,
	useElementHover,
	useElementSize,
	useElementVisibility,
	useEventBus,
	useEventListener,
	useEventSource,
	useEyeDropper,
	useFavicon,
	useFetch,
	useFileDialog,
	useFileSystemAccess,
	useFocus,
	useFocusWithin,
	useFps,
	useFullscreen,
	useGamepad,
	useGeolocation,
	useIdle,
	useImage,
	useInfiniteScroll,
	useIntersectionObserver,
	useInterval,
	useIntervalFn,
	useKeyModifier,
	useLastChanged,
	useLocalStorage,
	useMagicKeys,
	useManualRefHistory,
	useMediaControls,
	useMediaQuery,
	useMemoize,
	useMemory,
	useMounted,
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
	usePrevious,
	useRafFn,
	useRefHistory,
	useResizeObserver,
	useScreenOrientation,
	useScreenSafeArea,
	useScriptTag,
	useScroll,
	useScrollLock,
	useSessionStorage,
	useShare,
	useSorted,
	useSpeechRecognition,
	useSpeechSynthesis,
	useStepper,
	useStorage,
	useStorageAsync,
	useStyleTag,
	useSupported,
	useSwipe,
	useTextDirection,
	useTextSelection,
	useTextareaAutosize,
	useThrottleFn,
	useThrottledRefHistory,
	useTimeAgo,
	useTimeAgoIntl,
	useTimeout,
	useTimeoutFn,
	useTimeoutPoll,
	useTimestamp,
	useTitle,
	useToNumber,
	useToString,
	useToggle,
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
} from "../../../index";

interface MatchMediaOnlyWindow extends MatchMediaWindow {
	readonly label: string;
}

interface DevicePixelRatioOnlyWindow extends UseDevicePixelRatioWindowLike {
	readonly label: string;
}

interface CssSupportsOnlyWindow extends UseCssSupportsWindowLike {
	readonly label: string;
}

interface CssVarOnlyWindow extends UseCssVarWindowLike {
	readonly label: string;
}

interface SizedWindow extends EventTarget {
	readonly innerWidth: number;
	readonly innerHeight: number;
}

interface FocusWindow extends EventTarget {
	readonly document: UseWindowFocusDocumentLike;
}

interface MouseWindow extends EventTarget {
	readonly scrollX: number;
	readonly scrollY: number;
}

interface MouseInElementWindow extends UseMouseInElementWindowLike {
	readonly label: string;
}

interface MousePressedWindow extends UseMousePressedWindowLike {
	readonly label: string;
}

interface MutationObserverWindow extends UseMutationObserverWindowLike {
	readonly label: string;
}

interface NavigatorLanguageWindow extends EventTarget, WindowLike {
	readonly navigator?: UseNavigatorLanguageNavigatorLike;
}

interface PreferredLanguagesWindow extends EventTarget, WindowLike {
	readonly navigator?: UsePreferredLanguagesNavigatorLike;
}

interface NetworkWindow extends EventTarget, WindowLike {
	readonly navigator?: UseNetworkNavigatorLike;
}

interface NowWindow extends EventTarget, UseNowWindowLike {
	readonly label: string;
}

interface RafWindow extends EventTarget, UseRafFnWindowLike {
	readonly label: string;
}

interface ResizeWindow extends EventTarget {
	readonly ResizeObserver?: typeof ResizeObserver;
}

interface BoundingWindow extends UseElementBoundingWindowLike {
	readonly label: string;
}

interface PointDocument extends UseElementByPointDocumentLike {
	readonly label: string;
}

interface PointWindow extends UseElementByPointWindowLike {
	readonly label: string;
}

interface HoverWindow extends UseElementHoverWindowLike {
	readonly label: string;
}

interface HoverDocument extends UseElementHoverDocumentLike {
	readonly label: string;
}

interface VisibilityWindow extends UseElementVisibilityWindowLike {
	readonly label: string;
}

interface FpsPerformance extends UseFpsPerformanceLike {
	readonly label: string;
}

interface FpsWindow extends UseFpsWindowLike {
	readonly label: string;
}

interface MemoryPerformance extends UseMemoryPerformanceLike {
	readonly label: string;
}

interface MemoryWindow extends UseMemoryWindowLike {
	readonly label: string;
	readonly performance?: MemoryPerformance;
}

interface IdleDocument extends UseIdleDocumentLike {
	readonly label: string;
}

interface IdleWindow extends UseIdleWindowLike {
	readonly document: IdleDocument;
	readonly label: string;
}

interface ImageWindow extends UseImageWindowLike {
	readonly label: string;
}

interface InfiniteScrollWindow extends UseInfiniteScrollWindowLike {
	readonly label: string;
}

interface ScrollDocument extends UseScrollDocumentLike {
	readonly label: string;
}

interface ScrollWindow extends UseScrollWindowLike {
	readonly document: ScrollDocument;
	readonly label: string;
}

interface IntersectionObserverWindow extends UseIntersectionObserverWindowLike {
	readonly label: string;
}

interface KeyModifierDocument extends UseKeyModifierDocumentLike {
	readonly label: string;
}

interface MagicKeysWindow extends UseMagicKeysWindowLike {
	readonly label: string;
}

interface MediaControlsDocument extends UseMediaControlsDocumentLike {
	readonly label: string;
}

interface MutationWindow extends OnElementRemovalWindowLike {
	readonly label: string;
}

interface StorageOnlyWindow extends StorageWindowLike {
	readonly label: string;
}

interface ColorModeOnlyWindow extends UseColorModeWindowLike {
	readonly label: string;
}

function typeOnly(_callback: () => void): void {}

describe("public types", () => {
	it("types async computed values and options", () => {
		typeOnly(() => {
			const evaluating = signal(false);
			const options: AsyncComputedOptions = {
				evaluating,
				flush: "sync",
				lazy: true,
				onError: (_error) => {},
				shallow: false,
			};
			const value = computedAsync(
				async (onCancel) => {
					onCancel(() => {});
					return 1;
				},
				0,
				options,
			);
			const optional = computedAsync(async () => "ready");
			const withEvaluatingSignal = computedAsync(
				async () => true,
				false,
				evaluating,
			);

			expectTypeOf(value).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(optional).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(withEvaluatingSignal).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			// @ts-expect-error returned values are readonly signals
			value.value = 2;
		});
	});

	it("types async queue values and options", () => {
		typeOnly(() => {
			const firstTask = () => Promise.resolve(1);
			const secondTask = (value: number) => Promise.resolve(`${value}`);
			const syncTask = (value: string) => value.length;
			const options: UseAsyncQueueOptions = {
				interrupt: false,
				onError() {},
				onFinished() {},
				signal: new AbortController().signal,
			};
			const task: UseAsyncQueueTask<number> = () => 1;
			const resultEntry: UseAsyncQueueResult<number> = {
				state: "fulfilled",
				data: 1,
			};
			const state: UseAsyncQueueResultState = "pending";
			const queue = useAsyncQueue([firstTask, secondTask, syncTask], options);
			const emptyQueue = useAsyncQueue([]);

			expectTypeOf(task).toEqualTypeOf<UseAsyncQueueTask<number>>();
			expectTypeOf(queue).toEqualTypeOf<
				UseAsyncQueueReturn<
					[typeof firstTask, typeof secondTask, typeof syncTask]
				>
			>();
			expectTypeOf(queue.activeIndex).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(queue.result).toEqualTypeOf<
				ReadonlySignal<
					UseAsyncQueueResultList<
						[typeof firstTask, typeof secondTask, typeof syncTask]
					>
				>
			>();
			expectTypeOf(queue.result.value[0]).toEqualTypeOf<
				UseAsyncQueueResult<number>
			>();
			expectTypeOf(queue.result.value[1]).toEqualTypeOf<
				UseAsyncQueueResult<string>
			>();
			expectTypeOf(queue.result.value[2]).toEqualTypeOf<
				UseAsyncQueueResult<number>
			>();
			if (queue.result.value[0].state === "fulfilled") {
				expectTypeOf(queue.result.value[0].data).toEqualTypeOf<number>();
			}
			if (queue.result.value[1].state === "fulfilled") {
				expectTypeOf(queue.result.value[1].data).toEqualTypeOf<string>();
			}
			if (queue.result.value[2].state === "fulfilled") {
				expectTypeOf(queue.result.value[2].data).toEqualTypeOf<number>();
			}
			expectTypeOf(emptyQueue.activeIndex).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			// @ts-expect-error activeIndex is readonly
			queue.activeIndex.value = 1;
			// @ts-expect-error result is readonly
			queue.result.value = [];
			// @ts-expect-error result entries are readonly
			queue.result.value[0] = resultEntry;
			// @ts-expect-error result state is readonly
			queue.result.value[0].state = "fulfilled";
			// @ts-expect-error invalid result state
			resultEntry.state = "ready";
			// @ts-expect-error interrupt must be boolean
			useAsyncQueue([], { interrupt: "no" });
			// @ts-expect-error tasks must be functions
			useAsyncQueue([1]);
		});
	});

	it("types async state values and options", () => {
		typeOnly(() => {
			interface Item {
				id: string;
				count: number;
			}
			const initial = signal<Item>({ id: "initial", count: 0 });
			const action = async (id: string, count: number) => ({ id, count });
			const source: UseAsyncStateSource<Item, [string, number]> = action;
			const options: UseAsyncStateOptions<Item> = {
				delay: 10,
				immediate: false,
				onError(_error) {},
				onSuccess(value) {
					expectTypeOf(value).toEqualTypeOf<Item>();
				},
				resetOnExecute: false,
				shallow: false,
				throwError: true,
			};
			const asyncState = useAsyncState(action, initial, options);
			const promiseState = useAsyncState(Promise.resolve("ready"), "initial");
			const base: UseAsyncStateReturnBase<Item, [string, number]> = asyncState;

			expectTypeOf(source).toMatchTypeOf<
				UseAsyncStateSource<Item, [string, number]>
			>();
			expectTypeOf(asyncState).toEqualTypeOf<
				UseAsyncStateReturn<Item, [string, number]>
			>();
			expectTypeOf(base.state).toEqualTypeOf<ReadonlySignal<Item>>();
			expectTypeOf(asyncState.state).toEqualTypeOf<ReadonlySignal<Item>>();
			expectTypeOf(asyncState.isReady).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(asyncState.isLoading).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(asyncState.error).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(asyncState.execute(0, "ready", 1)).toEqualTypeOf<
				Promise<Item | undefined>
			>();
			expectTypeOf(asyncState.executeImmediate("ready", 1)).toEqualTypeOf<
				Promise<Item | undefined>
			>();
			expectTypeOf(promiseState).toEqualTypeOf<
				UseAsyncStateReturn<string, []>
			>();
			// @ts-expect-error state is readonly
			asyncState.state.value = { id: "next", count: 1 };
			// @ts-expect-error isReady is readonly
			asyncState.isReady.value = true;
			// @ts-expect-error Promise source does not accept execute params
			promiseState.execute(0, "unused");
			// @ts-expect-error action params must match
			asyncState.execute(0, 1, "ready");
			// @ts-expect-error delay must be a number
			useAsyncState(action, initial, { delay: "slow" });
		});
	});

	it("types base64 values and options", () => {
		typeOnly(() => {
			const text = signal("hello");
			const windowTarget = signal<UseBase64WindowLike | undefined>(undefined);
			const options: UseBase64Options = {
				dataUrl: false,
				window: windowTarget,
			};
			const imageOptions: UseBase64ImageOptions = {
				type: "image/jpeg",
				quality: 0.8,
			};
			const objectOptions: UseBase64ObjectOptions<{ id: number }> = {
				serializer(value) {
					expectTypeOf(value).toEqualTypeOf<{ id: number }>();
					return JSON.stringify(value);
				},
			};
			const source: UseBase64Source = new Set([1]);
			const result = useBase64(text, options);
			const getterResult = useBase64(() => new Map<string, unknown>(), {
				serializer(value) {
					expectTypeOf(value).toEqualTypeOf<Map<string, unknown>>();
					return JSON.stringify(Object.fromEntries(value));
				},
			});
			const blobResult = useBase64(new Blob(["hello"]));
			const bufferResult = useBase64(new Uint8Array([1]).buffer);
			const canvasResult = useBase64(
				document.createElement("canvas"),
				imageOptions,
			);
			const objectResult = useBase64({ id: 1 }, objectOptions);
			const returnValue: UseBase64Return = result;

			expectTypeOf(source).toMatchTypeOf<UseBase64Source>();
			expectTypeOf(result).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(returnValue.base64).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.base64).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.promise).toEqualTypeOf<
				ReadonlySignal<Promise<string> | undefined>
			>();
			expectTypeOf(result.execute()).toEqualTypeOf<Promise<string>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(blobResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(bufferResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(canvasResult).toEqualTypeOf<UseBase64Return>();
			expectTypeOf(objectResult).toEqualTypeOf<UseBase64Return>();
			// @ts-expect-error base64 is readonly
			result.base64.value = "next";
			// @ts-expect-error promise is readonly
			result.promise.value = Promise.resolve("next");
			// @ts-expect-error dataUrl must be boolean
			useBase64("hello", { dataUrl: "false" });
			// @ts-expect-error string sources do not accept image options
			useBase64("hello", { type: "image/png" });
			// @ts-expect-error quality must be a number
			useBase64(document.createElement("canvas"), { quality: "high" });
			// @ts-expect-error serializers must return strings
			useBase64({ id: 1 }, { serializer: () => 1 });
		});
	});

	it("types battery values and options", () => {
		typeOnly(() => {
			class TypedBattery extends EventTarget implements BatteryManagerLike {
				charging = true;
				chargingTime = 0;
				dischargingTime = Number.POSITIVE_INFINITY;
				level = 1;
			}
			const manager = new TypedBattery();
			const navigator: BatteryNavigatorLike = {
				getBattery: () => Promise.resolve(manager),
			};
			const options: UseBatteryOptions<BatteryNavigatorLike> = {
				navigator: signal(navigator),
			};
			const result = useBattery(options);
			const fallback = useBattery({ navigator: null });
			const returnValue: UseBatteryReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseBatteryReturn>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.charging).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.chargingTime).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(result.dischargingTime).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(result.level).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseBatteryReturn>();
			// @ts-expect-error returned values are readonly signals
			result.level.value = 0.5;
			const invalidOptions: UseBatteryOptions<BatteryNavigatorLike> = {
				// @ts-expect-error getBattery must return a promise
				navigator: { getBattery: () => manager },
			};
			useBattery(invalidOptions);
		});
	});

	it("types bluetooth values and options", () => {
		typeOnly(() => {
			class TypedCharacteristic
				extends EventTarget
				implements BluetoothRemoteGATTCharacteristicLike
			{
				readValue = () => Promise.resolve(new DataView(new ArrayBuffer(1)));
			}
			class TypedService implements BluetoothRemoteGATTServiceLike {
				getCharacteristic = (_characteristic: BluetoothServiceUUIDLike) =>
					Promise.resolve(new TypedCharacteristic());
			}
			class TypedServer implements BluetoothRemoteGATTServerLike {
				connected = true;
				connect = () => Promise.resolve(this);
				disconnect() {}
				getPrimaryService = (_service: BluetoothServiceUUIDLike) =>
					Promise.resolve(new TypedService());
			}
			class TypedDevice extends EventTarget implements BluetoothDeviceLike {
				id = "device";
				name = "Device";
				gatt = new TypedServer();
			}
			class TypedBluetooth extends EventTarget implements BluetoothLike {
				getAvailability = () => Promise.resolve(true);
				getDevices = () => Promise.resolve([new TypedDevice()]);
				requestDevice = (_options?: BluetoothRequestDeviceOptionsLike) =>
					Promise.resolve(new TypedDevice());
			}
			const filter: BluetoothLEScanFilterLike = {
				namePrefix: "Sigrea",
				services: ["battery_service", 0x180f],
			};
			const navigator: BluetoothNavigatorLike = {
				bluetooth: new TypedBluetooth(),
			};
			const options: UseBluetoothOptions<BluetoothNavigatorLike> = {
				acceptAllDevices: signal(false),
				filters: signal([filter]),
				navigator: signal(navigator),
				optionalServices: ["battery_service"],
			};
			const result = useBluetooth(options);
			const fallback = useBluetooth({ navigator: null });
			const returnValue: UseBluetoothReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseBluetoothReturn>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isConnected).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.device).toEqualTypeOf<
				ReadonlySignal<BluetoothDeviceLike | undefined>
			>();
			expectTypeOf(result.server).toEqualTypeOf<
				ReadonlySignal<BluetoothRemoteGATTServerLike | undefined>
			>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.requestDevice()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.connect()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.disconnect()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseBluetoothReturn>();
			// @ts-expect-error returned values are readonly signals
			result.device.value = new TypedDevice();
			// @ts-expect-error acceptAllDevices must be boolean
			useBluetooth({ acceptAllDevices: "true" });
			// @ts-expect-error optional services must be service UUID values
			useBluetooth({ optionalServices: [false] });
			// @ts-expect-error filters must use Bluetooth scan filter fields
			useBluetooth({ filters: [{ unknown: true }] });
			const invalidOptions: UseBluetoothOptions<BluetoothNavigatorLike> = {
				// @ts-expect-error requestDevice must return a promise
				navigator: { bluetooth: { requestDevice: () => new TypedDevice() } },
			};
			useBluetooth(invalidOptions);
		});
	});

	it("types broadcast channel values and options", () => {
		typeOnly(() => {
			class TypedBroadcastChannel
				extends EventTarget
				implements BroadcastChannelLike
			{
				constructor(readonly name: string) {
					super();
				}

				close() {}
				postMessage(_message: unknown) {}
			}

			const name = signal("sigrea");
			const windowTarget: BroadcastChannelWindowLike = {
				BroadcastChannel: TypedBroadcastChannel,
			} as BroadcastChannelWindowLike;
			const options: UseBroadcastChannelOptions<BroadcastChannelWindowLike> = {
				name,
				window: signal(windowTarget),
			};
			const result = useBroadcastChannel<string, string>(options);
			const fallback = useBroadcastChannel({ name: "fallback", window: null });
			const returnValue: UseBroadcastChannelReturn<string, string> = result;

			expectTypeOf(result).toEqualTypeOf<
				UseBroadcastChannelReturn<string, string>
			>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.isClosed).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.channel).toEqualTypeOf<
				ReadonlySignal<BroadcastChannelLike | undefined>
			>();
			expectTypeOf(result.data).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.postMessage("ready")).toEqualTypeOf<void>();
			expectTypeOf(result.close()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<
				UseBroadcastChannelReturn<unknown, unknown>
			>();
			// @ts-expect-error returned values are readonly signals
			result.data.value = "next";
			// @ts-expect-error name must be a string
			useBroadcastChannel({ name: 1 });
			// @ts-expect-error payload must match the configured type
			result.postMessage(1);
			const invalidOptions: UseBroadcastChannelOptions<BroadcastChannelWindowLike> =
				{
					name: "invalid",
					// @ts-expect-error BroadcastChannel must be a constructor
					window: { BroadcastChannel: () => new TypedBroadcastChannel("x") },
				};
			useBroadcastChannel(invalidOptions);
		});
	});

	it("types browser location values and options", () => {
		typeOnly(() => {
			const location: BrowserLocationLike = {
				hash: "#start",
				host: "example.com",
				hostname: "example.com",
				href: "https://example.com/start#start",
				origin: "https://example.com",
				pathname: "/start",
				port: "",
				protocol: "https:",
				search: "",
			};
			const history: BrowserLocationHistoryLike = {
				state: { page: "start" },
				length: 2,
			};
			const property: BrowserLocationWritableProperty = "href";
			const trigger: BrowserLocationTrigger = "load";
			const windowTarget: BrowserLocationWindowLike = {
				location,
				history,
			} as BrowserLocationWindowLike;
			const options: UseBrowserLocationOptions<BrowserLocationWindowLike> = {
				window: signal(windowTarget),
			};
			const result = useBrowserLocation(options);
			const fallback = useBrowserLocation({ window: null });
			const returnValue: UseBrowserLocationReturn = result;

			expectTypeOf(property).toMatchTypeOf<BrowserLocationWritableProperty>();
			expectTypeOf(trigger).toMatchTypeOf<BrowserLocationTrigger>();
			expectTypeOf(result).toEqualTypeOf<UseBrowserLocationReturn>();
			expectTypeOf(fallback).toEqualTypeOf<UseBrowserLocationReturn>();
			expectTypeOf(returnValue.trigger).toEqualTypeOf<
				ReadonlySignal<BrowserLocationTrigger>
			>();
			expectTypeOf(result.state).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(result.length).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(result.origin).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(result.hash).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.host).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.hostname).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.href).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.pathname).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.port).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.protocol).toEqualTypeOf<
				Computed<string | undefined>
			>();
			expectTypeOf(result.search).toEqualTypeOf<Computed<string | undefined>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			result.hash.value = "#next";
			result.href.value = "https://example.com/next";
			// @ts-expect-error returned trigger is a readonly signal
			result.trigger.value = "popstate";
			// @ts-expect-error origin is a readonly signal
			result.origin.value = "https://example.org";
			// @ts-expect-error origin is not a writable location property
			const invalidProperty: BrowserLocationWritableProperty = "origin";
			expectTypeOf(
				invalidProperty,
			).toEqualTypeOf<BrowserLocationWritableProperty>();
			const invalidLocation: BrowserLocationLike = {
				...location,
				// @ts-expect-error writable location fields must be strings
				hash: 1,
			};
			expectTypeOf(invalidLocation).toEqualTypeOf<BrowserLocationLike>();
		});
	});

	it("types URL search params values and options", () => {
		typeOnly(() => {
			interface CustomParams {
				customFoo: number | undefined;
				foo?: string | string[];
			}

			const location: UseUrlSearchParamsLocationLike = {
				hash: "",
				pathname: "/",
				search: "",
			};
			const history: UseUrlSearchParamsHistoryLike = {
				pushState(_state, _title, _url) {},
				replaceState(_state, _title, _url) {},
				state: null,
			};
			const windowTarget = Object.assign(new EventTarget(), {
				document,
				history,
				location,
			}) as UseUrlSearchParamsWindowLike;
			const mode: UseUrlSearchParamsMode = "hash-params";
			const writeMode: UseUrlSearchParamsWriteMode = "push";
			const options: UseUrlSearchParamsOptions<
				CustomParams,
				UseUrlSearchParamsWindowLike
			> = {
				initialValue: {
					customFoo: 1,
					foo: "bar",
				},
				removeFalsyValues: true,
				removeNullishValues: true,
				stringify: (params) => params.toString(),
				window: signal(windowTarget),
				write: true,
				writeMode,
			};
			const params = useUrlSearchParams<CustomParams>(mode, options);
			const fallback = useUrlSearchParams("history", {
				initialValue: { foo: "bar" },
				window: null,
			});
			const defaultParams = useUrlSearchParams();

			expectTypeOf(params).toEqualTypeOf<CustomParams>();
			expectTypeOf(fallback.foo).toEqualTypeOf<string>();
			expectTypeOf(defaultParams).toEqualTypeOf<UrlParams>();
			params.customFoo = 2;
			params.foo = ["bar", "baz"];
			defaultParams.foo = "bar";
			defaultParams.foo = ["bar", "baz"];
			defaultParams.foo = undefined;
			useUrlSearchParams("hash");
			useUrlSearchParams("hash-params");
			useUrlSearchParams("history", {
				// @ts-expect-error write mode must be replace or push
				writeMode: "append",
			});
			useUrlSearchParams("history", {
				// @ts-expect-error stringify must return a string
				stringify: () => 1,
			});
			// @ts-expect-error mode must be history, hash, or hash-params
			useUrlSearchParams("query");
		});
	});

	it("types cached values and options", () => {
		typeOnly(() => {
			const source = signal({ value: 1, extra: "initial" });
			const readonlySource = readonly(source);
			const comparator: UseCachedComparator<{
				value: number;
				extra: string;
			}> = (newSourceValue, cachedValue) =>
				newSourceValue.value === cachedValue.value;
			const options: UseCachedOptions = {
				deep: true,
				flush: "sync",
			};
			const invalidOptions: UseCachedOptions = {
				// @ts-expect-error Vue deepRefs option is not part of the Sigrea API
				deepRefs: true,
			};
			const result = useCached(source, comparator, options);
			const readonlyResult = useCached(readonlySource, comparator);
			const getterResult = useCached(() => source.value.value);
			const returnValue: UseCachedReturn<{ value: number; extra: string }> =
				result;

			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<{ value: number; extra: string }>
			>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				ReadonlySignal<{ value: number; extra: string }>
			>();
			expectTypeOf(getterResult).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(returnValue).toEqualTypeOf<
				UseCachedReturn<{ value: number; extra: string }>
			>();
			expectTypeOf(comparator).toEqualTypeOf<
				UseCachedComparator<{ value: number; extra: string }>
			>();
			expectTypeOf(invalidOptions).toEqualTypeOf<UseCachedOptions>();

			// @ts-expect-error cached value is readonly
			result.value = { value: 2, extra: "manual" };
			// @ts-expect-error cached value must match the source value type
			result.value = { value: "2", extra: "manual" };
			// @ts-expect-error comparator receives the source value type
			useCached(source, (newSourceValue: string) => newSourceValue.length > 0);
			// @ts-expect-error source must be reactive or a getter
			useCached(1);
		});
	});

	it("types clipboard values and options", () => {
		typeOnly(() => {
			class TypedWindow extends EventTarget implements UseClipboardWindowLike {}
			const textarea: ClipboardTextareaLike = {
				value: "",
				style: {},
				remove() {},
				select() {},
				setAttribute(_name, _value) {},
			};
			const body: ClipboardDocumentBodyLike = {
				appendChild(_node) {},
			};
			const document: ClipboardDocumentLike = {
				body,
				createElement: (_tagName) => textarea,
				execCommand: (_command) => true,
			} as ClipboardDocumentLike;
			const nativeDocument: Document = globalThis.document;
			const nativeDocumentOptions: UseClipboardOptions<
				undefined,
				ClipboardNavigatorLike,
				Document,
				TypedWindow
			> = {
				document: nativeDocument,
				legacy: true,
			};
			const clipboard: ClipboardLike = {
				readText: async () => "current",
				writeText: async (_data) => {},
			};
			const navigator: ClipboardNavigatorLike = {
				clipboard,
			};
			const source = signal("copy me");
			const textSource: UseClipboardTextSource = source;
			const options: UseClipboardOptions<
				UseClipboardTextSource,
				ClipboardNavigatorLike,
				ClipboardDocumentLike,
				TypedWindow
			> = {
				copiedDuring: signal(100),
				document,
				legacy: true,
				navigator: signal(navigator),
				read: true,
				source: textSource,
				window: new TypedWindow(),
			};
			const result = useClipboard(options);
			const nativeDocumentResult = useClipboard(nativeDocumentOptions);
			const nativeDocumentDirectResult = useClipboard({
				document: nativeDocument,
				legacy: true,
			});
			const requiredCopy = useClipboard({ navigator: null });
			const returnValue: UseClipboardReturn<true> = result;
			const optionalCopy: UseClipboardCopyFn<true> = result.copy;
			const requiredCopyFn: UseClipboardCopyFn<false> = requiredCopy.copy;

			expectTypeOf(result).toEqualTypeOf<UseClipboardReturn<true>>();
			expectTypeOf(nativeDocumentResult).toEqualTypeOf<
				UseClipboardReturn<false>
			>();
			expectTypeOf(nativeDocumentDirectResult).toEqualTypeOf<
				UseClipboardReturn<false>
			>();
			expectTypeOf(requiredCopy).toEqualTypeOf<UseClipboardReturn<false>>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.text).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(result.copied).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.isCopying).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.copy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(optionalCopy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopy.copy("value")).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopyFn("value")).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.read()).toEqualTypeOf<Promise<string | undefined>>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			// @ts-expect-error copied state is readonly
			result.copied.value = true;
			// @ts-expect-error copy value must be text-like
			result.copy(1);
			// @ts-expect-error async providers are left to useClipboardItems
			result.copy(async () => "async");
			// @ts-expect-error source-less clipboard copy needs a value
			requiredCopy.copy();
			// @ts-expect-error Vue copyPending name is not part of the Sigrea API
			result.copyPending;
			// @ts-expect-error navigator.clipboard.writeText must return a promise
			const invalidClipboard: ClipboardLike = { writeText: (_data) => {} };
			expectTypeOf(invalidClipboard).toEqualTypeOf<ClipboardLike>();
		});
	});

	it("types clipboard item values and options", () => {
		typeOnly(() => {
			class TypedWindow
				extends EventTarget
				implements UseClipboardItemsWindowLike {}
			const presentationStyle: ClipboardItemPresentationStyleLike = "inline";
			const item: ClipboardItemLike = {
				presentationStyle,
				types: ["text/plain"] as const,
				getType: async (type) => new Blob(["copy me"], { type }),
			};
			const clipboard: ClipboardLike = {
				read: async () => [item],
				write: async (_items) => {},
			};
			const navigator: ClipboardNavigatorLike = {
				clipboard,
			};
			const source = signal([item] as const);
			const itemSource: UseClipboardItemsSource = source;
			const options: UseClipboardItemsOptions<
				UseClipboardItemsSource,
				ClipboardNavigatorLike,
				TypedWindow
			> = {
				copiedDuring: signal(100),
				navigator: signal(navigator),
				read: true,
				source: itemSource,
				window: new TypedWindow(),
			};
			const result = useClipboardItems(options);
			const requiredCopy = useClipboardItems({ navigator: null });
			const returnValue: UseClipboardItemsReturn<true> = result;
			const optionalCopy: UseClipboardItemsCopyFn<true> = result.copy;
			const requiredCopyFn: UseClipboardItemsCopyFn<false> = requiredCopy.copy;

			expectTypeOf(result).toEqualTypeOf<UseClipboardItemsReturn<true>>();
			expectTypeOf(requiredCopy).toEqualTypeOf<
				UseClipboardItemsReturn<false>
			>();
			expectTypeOf(returnValue.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.items).toEqualTypeOf<
				ReadonlySignal<readonly ClipboardItemLike[]>
			>();
			expectTypeOf(result.copied).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.isCopying).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(result.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(result.copy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(optionalCopy()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopy.copy([item])).toEqualTypeOf<Promise<void>>();
			expectTypeOf(requiredCopyFn([item])).toEqualTypeOf<Promise<void>>();
			expectTypeOf(result.read()).toEqualTypeOf<
				Promise<readonly ClipboardItemLike[] | undefined>
			>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();

			// @ts-expect-error copied state is readonly
			result.copied.value = true;
			// @ts-expect-error VueUse content name is not part of the Sigrea API
			result.content;
			// @ts-expect-error Vue copyPending name is not part of the Sigrea API
			result.copyPending;
			// @ts-expect-error source-less clipboard item copy needs items
			requiredCopy.copy();
			// @ts-expect-error text values are handled by useClipboard
			result.copy("text");
			// @ts-expect-error legacy fallback is not available for ClipboardItem data
			useClipboardItems({ legacy: true, navigator });
			// @ts-expect-error document fallback is not available for ClipboardItem data
			useClipboardItems({ document: {}, navigator });
			const invalidItem: ClipboardItemLike = {
				types: ["text/plain"],
				// @ts-expect-error getType must return a promise
				getType: (_type) => new Blob(),
			};
			expectTypeOf(invalidItem).toEqualTypeOf<ClipboardItemLike>();
			// @ts-expect-error navigator.clipboard.write must return a promise
			const invalidClipboard: ClipboardLike = { write: (_items) => {} };
			expectTypeOf(invalidClipboard).toEqualTypeOf<ClipboardLike>();
		});
	});

	it("types cloned values and options", () => {
		typeOnly(() => {
			const source = signal({ count: 1 });
			const historyClone: CloneFn<PromiseLike<number>> = (value) => value;
			const clonedClone: UseClonedCloneFn<{ count: number }> = (value) => value;
			const options: UseClonedOptions<
				{ count: number },
				{ count: number; copied: boolean }
			> = {
				clone: (value) => ({ ...value, copied: true }),
				deep: true,
				flush: "sync",
				manual: true,
			};
			const result = useCloned(source, options);
			const rawResult = useCloned({ count: 1 });
			const getterResult = useCloned(() => source.value);
			const structured = cloneStructured({ count: 1 });
			const returnValue: UseClonedReturn<{
				count: number;
				copied: boolean;
			}> = result;

			expectTypeOf(result).toEqualTypeOf<
				UseClonedReturn<{ count: number; copied: boolean }>
			>();
			expectTypeOf(rawResult.cloned).toEqualTypeOf<Signal<{ count: number }>>();
			expectTypeOf(getterResult.cloned).toEqualTypeOf<
				Signal<{ count: number }>
			>();
			expectTypeOf(returnValue.isModified).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(result.cloned).toEqualTypeOf<
				Signal<{ count: number; copied: boolean }>
			>();
			expectTypeOf(result.cloned.value.copied).toEqualTypeOf<boolean>();
			expectTypeOf(result.sync()).toEqualTypeOf<void>();
			expectTypeOf(result.stop()).toEqualTypeOf<void>();
			expectTypeOf(structured).toEqualTypeOf<{ count: number }>();
			expectTypeOf(historyClone).toEqualTypeOf<CloneFn<PromiseLike<number>>>();
			expectTypeOf(clonedClone).toEqualTypeOf<
				UseClonedCloneFn<{ count: number }>
			>();

			result.cloned.value = { count: 2, copied: false };
			// @ts-expect-error isModified is readonly
			result.isModified.value = true;
			// @ts-expect-error clone must be synchronous
			useCloned(source, { clone: async (value) => value });
			const invalidOptions: UseClonedOptions<{ count: number }> = {
				// @ts-expect-error immediate is intentionally not part of the Sigrea API
				immediate: false,
			};
			expectTypeOf(invalidOptions).toEqualTypeOf<
				UseClonedOptions<{ count: number }>
			>();
			// @ts-expect-error Vue ref name is not part of the Sigrea API
			result.ref;
		});
	});

	it("types eager computed values and options", () => {
		typeOnly(() => {
			const options: ComputedEagerOptions = {
				flush: "sync",
				onTrack: (_event) => {},
				onTrigger: (_event) => {},
			};
			const value = computedEager(() => 1, options);

			expectTypeOf(value).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(value).toEqualTypeOf<ComputedEagerReturn<number>>();
			// @ts-expect-error returned values are readonly signals
			value.value = 2;
		});
	});

	it("types array difference values", () => {
		typeOnly(() => {
			const list = signal([1, 2, 3]);
			const readonlyList = readonly(signal([1, 2, 3]));
			const values = computed(() => [2]);
			const getter = () => [1];
			const options: UseArrayDifferenceOptions = {
				symmetric: true,
			};
			const compare: UseArrayDifferenceCompareFn<number> = (
				value,
				otherValue,
			) => value === otherValue;
			const result = useArrayDifference(list, values);
			const readonlyResult = useArrayDifference(readonlyList, getter);
			const compared = useArrayDifference(list, values, compare, options);
			const keyed = useArrayDifference(
				signal([{ id: 1 }, { id: 2 }]),
				signal([{ id: 2 }]),
				"id",
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayDifferenceReturn<number>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number[]>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayDifferenceReturn<number>
			>();
			expectTypeOf(compared.value).toEqualTypeOf<number[]>();
			expectTypeOf(keyed.value).toEqualTypeOf<{ id: number }[]>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error primitive values do not have this comparison key
			useArrayDifference(signal([1]), signal([1]), "id");
			// @ts-expect-error object comparison key must exist
			useArrayDifference(signal([{ id: 1 }]), signal([{ id: 1 }]), "name");
			// @ts-expect-error comparison function must return boolean
			useArrayDifference(signal([1]), signal([1]), () => "matched");
		});
	});

	it("types array every values", () => {
		typeOnly(() => {
			const first = signal(2);
			const second = computed(() => 4);
			const third = signal(6);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayEveryPredicate<number> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<readonly MaybeValue<number>[]>();
				return element % 2 === 0;
			};
			const result = useArrayEvery(list, predicate);
			const getterResult = useArrayEvery(
				() => [1, 2, 3],
				(value) => {
					expectTypeOf(value).toEqualTypeOf<number>();
					return value > 0;
				},
			);
			const rawResult = useArrayEvery(rawList, (value) => value > 0);
			const readonlyResult = useArrayEvery(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayEveryReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayEveryReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error predicate element type must match the array item type
			useArrayEvery(signal([1]), (value: string) => value.length > 0);
			useArrayEvery(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayEvery(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array some values", () => {
		typeOnly(() => {
			const first = signal(2);
			const second = computed(() => 4);
			const third = signal(6);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArraySomePredicate<number> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<readonly MaybeValue<number>[]>();
				return element > 3;
			};
			const result = useArraySome(list, predicate);
			const getterResult = useArraySome(
				() => [1, 2, 3],
				(value) => {
					expectTypeOf(value).toEqualTypeOf<number>();
					return value > 2;
				},
			);
			const rawResult = useArraySome(rawList, (value) => value > 2);
			const readonlyResult = useArraySome(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArraySomeReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArraySomeReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error predicate element type must match the array item type
			useArraySome(signal([1]), (value: string) => value.length > 0);
			useArraySome(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArraySome(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array unique values", () => {
		typeOnly(() => {
			interface Item {
				id: number;
				name: string;
			}
			const first = signal<Item>({ id: 1, name: "foo" });
			const second = computed<Item>(() => ({ id: 2, name: "bar" }));
			const third = signal<Item>({ id: 1, name: "baz" });
			const list = signal([first, second, () => third.value]);
			const rawList: Item[] = [
				{ id: 1, name: "foo" },
				{ id: 1, name: "bar" },
			];
			const compare: UseArrayUniqueCompareFn<Item> = (
				value,
				otherValue,
				array,
			) => {
				expectTypeOf(value).toEqualTypeOf<Item>();
				expectTypeOf(otherValue).toEqualTypeOf<Item>();
				expectTypeOf(array).toEqualTypeOf<Item[]>();
				return value.id === otherValue.id;
			};
			const result = useArrayUnique(list, compare);
			const getterResult = useArrayUnique(() => rawList, compare);
			const rawResult = useArrayUnique(rawList);
			const readonlyResult = useArrayUnique(readonly(list), compare);

			expectTypeOf(result).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<Item[]>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayUniqueReturn<Item>>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error comparison function must return boolean
			useArrayUnique(signal([1]), () => "matched");
			useArrayUnique(
				signal([1]),
				// @ts-expect-error comparison is a raw function, not a signal
				signal((value: number, otherValue: number) => value === otherValue),
			);
			useArrayUnique(
				signal([1]),
				// @ts-expect-error comparison is a raw function, not a computed value
				computed(() => (value: number, otherValue: number) => {
					return value === otherValue;
				}),
			);
		});
	});

	it("types array filter values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList: Array<number | string> = [1, "ready"];
			const predicate: UseArrayFilterPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<Array<number | null>>();
				return element != null;
			};
			const result = useArrayFilter(list, predicate);
			const narrowed = useArrayFilter(rawList, (value): value is number => {
				return typeof value === "number";
			});
			const getterResult = useArrayFilter(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFilter(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFilterReturn<number | null>>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<Array<number | null>>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFilterReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number[]>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFilterReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFilterReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error predicate element type must match the array item type
			useArrayFilter(signal([1]), (value: string) => value.length > 0);
			useArrayFilter(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFilter(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList: Array<number | string> = [1, "ready"];
			const predicate: UseArrayFindPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFind(list, predicate);
			const narrowed = useArrayFind(rawList, (value): value is number => {
				return typeof value === "number";
			});
			const getterResult = useArrayFind(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFind(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFindReturn<number | null>>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<number | null | undefined>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFindReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFindReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFindReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFind(signal([1]), (value: string) => value.length > 0);
			useArrayFind(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFind(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find index values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayFindIndexPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFindIndex(list, predicate);
			const rawResult = useArrayFindIndex(rawList, (value) => value > 1);
			const getterResult = useArrayFindIndex(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFindIndex(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayFindIndexReturn>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFindIndex(signal([1]), (value: string) => value.length > 0);
			useArrayFindIndex(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFindIndex(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array find last values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const predicate: UseArrayFindLastPredicate<number | null> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element != null;
			};
			const result = useArrayFindLast(list, predicate);
			const narrowed = useArrayFindLast(
				list,
				(element): element is number => element != null,
			);
			const rawResult = useArrayFindLast(rawList, (value) => value > 1);
			const getterResult = useArrayFindLast(
				() => [1, 2, 3],
				(value) => value > 1,
			);
			const readonlyResult = useArrayFindLast(readonly(list), predicate);

			expectTypeOf(result).toEqualTypeOf<
				UseArrayFindLastReturn<number | null>
			>();
			expectTypeOf(result).toEqualTypeOf<
				ReadonlySignal<number | null | undefined>
			>();
			expectTypeOf(narrowed).toEqualTypeOf<UseArrayFindLastReturn<number>>();
			expectTypeOf(narrowed.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayFindLastReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<
				UseArrayFindLastReturn<number>
			>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayFindLastReturn<number | null>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error predicate element type must match the array item type
			useArrayFindLast(signal([1]), (value: string) => value.length > 0);
			useArrayFindLast(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a signal
				signal((value: number) => value > 0),
			);
			useArrayFindLast(
				signal([1]),
				// @ts-expect-error predicate is a raw function, not a computed value
				computed(() => (value: number) => value > 0),
			);
		});
	});

	it("types array includes values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const search = signal<number | null>(3);
			const comparator: UseArrayIncludesComparatorFn<number | null> = (
				element,
				value,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(value).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<
					readonly MaybeValue<number | null>[]
				>();
				return element === value;
			};
			const keyedOptions: UseArrayIncludesOptions<{ id: number }, number> = {
				fromIndex: signal(1),
				comparator: "id",
			};
			const functionOptions: UseArrayIncludesOptions<
				{ id: number },
				{ id: number }
			> = {
				comparator: (element, value) => element.id === value.id,
			};
			const result = useArrayIncludes(list, search, comparator);
			const rawResult = useArrayIncludes(rawList, 2);
			const getterResult = useArrayIncludes(
				() => [1, 2, 3],
				() => 2,
			);
			const readonlyResult = useArrayIncludes(readonly(list), search);
			const keyed = useArrayIncludes([{ id: 1 }], 1, "id");
			const keyedWithOptions = useArrayIncludes(
				[{ id: 1 }, { id: 2 }],
				signal(2),
				keyedOptions,
			);
			const compared = useArrayIncludes(
				[{ id: 1 }],
				{ id: 1 },
				functionOptions,
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(keyed).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(keyedWithOptions).toEqualTypeOf<UseArrayIncludesReturn>();
			expectTypeOf(compared).toEqualTypeOf<UseArrayIncludesReturn>();
			// @ts-expect-error returned value is readonly
			result.value = false;
			// @ts-expect-error comparator must return boolean
			useArrayIncludes(signal([1]), signal(1), () => "matched");
			// @ts-expect-error key comparator must exist on the array item type
			useArrayIncludes(signal([{ id: 1 }]), signal(1), "name");
			useArrayIncludes(
				signal([{ id: 1 }]),
				signal(1),
				// @ts-expect-error options key comparator must exist on the array item type
				{ comparator: "name" },
			);
			useArrayIncludes(signal([1]), signal(1), {
				// @ts-expect-error options comparator must be raw, not a signal
				comparator: signal(
					(element: number, value: number) => element === value,
				),
			});
			useArrayIncludes(signal([1]), signal(1), {
				// @ts-expect-error options comparator must be raw, not a computed value
				comparator: computed(
					() => (element: number, value: number) => element === value,
				),
			});
		});
	});

	it("types array join values", () => {
		typeOnly(() => {
			const first = signal<string | null>("foo");
			const second = computed<number | undefined>(() => 1);
			const third = signal("bar");
			const list = signal([first, second, () => third.value]);
			const separator = signal<string | undefined>("-");
			const result = useArrayJoin(list, separator);
			const rawResult = useArrayJoin(["foo", 1, null]);
			const getterResult = useArrayJoin(
				() => ["foo", "bar"],
				() => separator.value,
			);
			const readonlyResult = useArrayJoin(readonly(list), separator);

			expectTypeOf(result).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayJoinReturn>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayJoinReturn>();
			// @ts-expect-error returned value is readonly
			result.value = "next";
			// @ts-expect-error separator must resolve to string or undefined
			useArrayJoin(signal([1]), signal(1));
			// @ts-expect-error separator must resolve to string or undefined
			useArrayJoin(signal([1]), () => 1);
		});
	});

	it("types array map values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const callback: UseArrayMapCallback<number | null, string> = (
				element,
				index,
				array,
			) => {
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				expectTypeOf(array).toEqualTypeOf<(number | null)[]>();
				return `${index}:${element}`;
			};
			const result = useArrayMap(list, callback);
			const rawResult = useArrayMap(rawList, (value) => value * 2);
			const getterResult = useArrayMap(
				() => [1, 2, 3],
				(value) => value.toString(),
			);
			const readonlyResult = useArrayMap(readonly(list), callback);
			const objectResult = useArrayMap(rawList, (value) => ({ value }));

			expectTypeOf(result).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string[]>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayMapReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<UseArrayMapReturn<string>>();
			expectTypeOf(objectResult).toEqualTypeOf<
				UseArrayMapReturn<{ value: number }>
			>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error callback element type must match the array item type
			useArrayMap(signal([1]), (value: string) => value.length);
			useArrayMap(
				signal([1]),
				// @ts-expect-error callback is a raw function, not a signal
				signal((value: number) => value * 2),
			);
			useArrayMap(
				signal([1]),
				// @ts-expect-error callback is a raw function, not a computed value
				computed(() => (value: number) => value * 2),
			);
		});
	});

	it("types array reduce values", () => {
		typeOnly(() => {
			const first = signal<number | null>(1);
			const second = computed<number | null>(() => null);
			const third = signal<number | null>(3);
			const list = signal([first, second, () => third.value]);
			const rawList = [1, 2, 3];
			const reducer: UseArrayReduceReducer<number, number | null, number> = (
				sum,
				element,
				index,
			) => {
				expectTypeOf(sum).toEqualTypeOf<number>();
				expectTypeOf(element).toEqualTypeOf<number | null>();
				expectTypeOf(index).toEqualTypeOf<number>();
				return sum + (element ?? 0);
			};
			const result = useArrayReduce(list, reducer, signal(0));
			const rawResult = useArrayReduce(rawList, (sum, value) => sum + value);
			const getterResult = useArrayReduce(
				() => [1, 2, 3],
				(sum, value) => sum + value,
				() => 0,
			);
			const readonlyResult = useArrayReduce(readonly(list), reducer, 0);
			const stringResult = useArrayReduce(
				rawList,
				(text, value) => `${text}:${value}`,
				"start",
			);
			const undefinedInitial = useArrayReduce<number, number | undefined>(
				rawList,
				(sum, value) => (sum ?? 0) + value,
				undefined,
			);

			expectTypeOf(result).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseArrayReduceReturn<number>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<
				UseArrayReduceReturn<number>
			>();
			expectTypeOf(stringResult).toEqualTypeOf<UseArrayReduceReturn<string>>();
			expectTypeOf(undefinedInitial).toEqualTypeOf<
				UseArrayReduceReturn<number | undefined>
			>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error reducer element type must match the array item type
			useArrayReduce(signal([1]), (sum: string, value: string) => sum + value);
			useArrayReduce(
				signal([1]),
				// @ts-expect-error reducer is a raw function, not a signal
				signal((sum: number, value: number) => sum + value),
			);
			useArrayReduce(
				signal([1]),
				// @ts-expect-error reducer is a raw function, not a computed value
				computed(() => (sum: number, value: number) => sum + value),
			);
			useArrayReduce(
				signal([1]),
				(sum: string, value) => `${sum}:${value}`,
				// @ts-expect-error reducer return type must match the initial value type
				0,
			);
			useArrayReduce(
				signal([1]),
				(sum: number, value) => sum + value,
				// @ts-expect-error reducer accumulator type must match the initial value type
				"start",
			);
		});
	});

	it("types sorted array values", () => {
		typeOnly(() => {
			interface Item {
				age: number;
				name: string;
			}
			const first = signal<Item>({ age: 40, name: "John" });
			const second = computed<Item>(() => ({ age: 20, name: "Jane" }));
			const third = signal<Item>({ age: 30, name: "Joe" });
			const list = signal([first, second, () => third.value]);
			const rawList: Item[] = [
				{ age: 40, name: "John" },
				{ age: 20, name: "Jane" },
			];
			const compare: UseSortedCompareFn<Item> = (value, otherValue) => {
				expectTypeOf(value).toEqualTypeOf<Item>();
				expectTypeOf(otherValue).toEqualTypeOf<Item>();
				return value.age - otherValue.age;
			};
			const sortFn: UseSortedSortFn<Item> = (array, compareFn) => {
				expectTypeOf(array).toEqualTypeOf<Item[]>();
				expectTypeOf(compareFn).toEqualTypeOf<UseSortedCompareFn<Item>>();
				return array.sort(compareFn);
			};
			const options: UseSortedOptions<Item> = {
				compareFn: compare,
				sortFn,
			};
			const result = useSorted(list, compare);
			const optionsResult = useSorted(rawList, options);
			const getterResult = useSorted(() => rawList, {
				compareFn: compare,
			});
			const overloadResult = useSorted(rawList, compare, { sortFn });

			expectTypeOf(result).toEqualTypeOf<UseSortedReturn<Item>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<Item[]>>();
			expectTypeOf(optionsResult).toEqualTypeOf<UseSortedReturn<Item>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseSortedReturn<Item>>();
			expectTypeOf(overloadResult.value).toEqualTypeOf<Item[]>();
			// @ts-expect-error returned value is readonly
			result.value = [];
			// @ts-expect-error compare function must return a number
			useSorted(signal([1]), () => true);
			useSorted(signal([1]), {
				// @ts-expect-error options compare function must return a number
				compareFn: () => true,
			});
			useSorted(signal([1]), undefined, {
				// @ts-expect-error sort function must return an array
				sortFn: () => 1,
			});
			useSorted(signal([1]), {
				// @ts-expect-error dirty mode is intentionally not part of the Sigrea API
				dirty: true,
			});
		});
	});

	it("types cycle list values", () => {
		typeOnly(() => {
			interface Item {
				id: number;
				name: string;
			}

			const list = signal([
				{ id: 1, name: "foo" },
				{ id: 2, name: "bar" },
			]);
			const fallbackIndex = signal(1);
			const options: UseCycleListOptions<Item> = {
				fallbackIndex,
				getIndexOf(value, array) {
					expectTypeOf(value).toEqualTypeOf<Item | undefined>();
					expectTypeOf(array).toEqualTypeOf<Item[]>();
					return array.findIndex((item) => item.id === value?.id);
				},
				initialValue: () => list.value[1],
			};
			const cycle = useCycleList(list, options);
			const rawCycle = useCycleList(["foo", "bar"] as const);
			const readonlyCycle = useCycleList(readonly(list));
			const returnValue: UseCycleListReturn<Item> = cycle;

			expectTypeOf(cycle).toEqualTypeOf<UseCycleListReturn<Item>>();
			expectTypeOf(cycle.state).toEqualTypeOf<Signal<Item | undefined>>();
			expectTypeOf(cycle.index).toEqualTypeOf<Signal<number>>();
			expectTypeOf(cycle.next()).toEqualTypeOf<Item | undefined>();
			expectTypeOf(cycle.prev(2)).toEqualTypeOf<Item | undefined>();
			expectTypeOf(cycle.go(1)).toEqualTypeOf<Item | undefined>();
			expectTypeOf(rawCycle.state.value).toEqualTypeOf<
				"foo" | "bar" | undefined
			>();
			expectTypeOf(readonlyCycle).toEqualTypeOf<UseCycleListReturn<Item>>();

			returnValue.state.value = { id: 3, name: "baz" };
			returnValue.index.value = 0;
			// @ts-expect-error state value must match the list item type
			cycle.state.value = { id: "3", name: "baz" };
			// @ts-expect-error fallbackIndex must resolve to number
			useCycleList(list, { fallbackIndex: "0" });
			// @ts-expect-error getIndexOf must return a number
			useCycleList(list, { getIndexOf: () => "0" });
		});
	});

	it("types stepper values", () => {
		typeOnly(() => {
			const arraySteps = useStepper(["first", "second"] as const, "second");
			const numberSteps = useStepper([1, 2, 3] as const, 2);
			const title = signal("First");
			const objectSteps = useStepper(
				{
					first: title,
					second: computed(() => ({ label: "Second" })),
				},
				"first",
			);
			const arrayReturn: UseStepperReturn<
				"first" | "second",
				("first" | "second")[],
				"first" | "second"
			> = arraySteps;
			const objectReturn: UseStepperReturn<
				"first" | "second",
				{
					first: string;
					second: {
						label: string;
					};
				},
				| string
				| {
						label: string;
				  }
			> = objectSteps;
			const objectSource: UseStepperObjectSteps = {
				first: signal("First"),
			};
			const symbolStep = Symbol("step");
			const objectWithSymbol = useStepper({
				first: "First",
				[symbolStep]: signal("Symbol"),
			});
			const objectWithNumberKey = useStepper(
				{
					1: "One",
					second: "Second",
				} as const,
				"1",
			);
			const resolvedStep: UseStepperResolvedStep<typeof title> = "First";
			const resolvedObject: UseStepperResolvedObject<typeof objectSource> = {
				first: "First",
			};

			expectTypeOf(arraySteps.steps).toEqualTypeOf<
				ReadonlySignal<("first" | "second")[]>
			>();
			expectTypeOf(arraySteps.stepNames).toEqualTypeOf<
				ReadonlySignal<("first" | "second")[]>
			>();
			expectTypeOf(arraySteps.index).toEqualTypeOf<Computed<number>>();
			expectTypeOf(arraySteps.current).toEqualTypeOf<
				ReadonlySignal<"first" | "second" | undefined>
			>();
			expectTypeOf(arraySteps.next).toEqualTypeOf<
				ReadonlySignal<"first" | "second" | undefined>
			>();
			expectTypeOf(arraySteps.at(0)).toEqualTypeOf<
				"first" | "second" | undefined
			>();
			expectTypeOf(arraySteps.get("first")).toEqualTypeOf<
				"first" | "second" | undefined
			>();
			expectTypeOf(arraySteps.goTo("first")).toEqualTypeOf<void>();
			expectTypeOf(arraySteps.goToNext()).toEqualTypeOf<void>();
			expectTypeOf(arraySteps.goToPrevious()).toEqualTypeOf<void>();
			expectTypeOf(arraySteps.goBackTo("first")).toEqualTypeOf<void>();
			expectTypeOf(arraySteps.isCurrent("first")).toEqualTypeOf<boolean>();
			expectTypeOf(arraySteps.isBefore("first")).toEqualTypeOf<boolean>();
			expectTypeOf(arraySteps.isAfter("first")).toEqualTypeOf<boolean>();
			expectTypeOf(numberSteps.current).toEqualTypeOf<
				ReadonlySignal<1 | 2 | 3 | undefined>
			>();
			expectTypeOf(objectSteps.steps).toEqualTypeOf<
				ReadonlySignal<{
					first: string;
					second: {
						label: string;
					};
				}>
			>();
			expectTypeOf(objectSteps.stepNames).toEqualTypeOf<
				ReadonlySignal<("first" | "second")[]>
			>();
			expectTypeOf(objectSteps.current).toEqualTypeOf<
				ReadonlySignal<
					| string
					| {
							label: string;
					  }
					| undefined
				>
			>();

			arraySteps.index.value = 0;
			arrayReturn.goTo("first");
			objectReturn.goTo("second");
			expectTypeOf<UseStepperArrayStep>().toEqualTypeOf<string | number>();
			expectTypeOf(resolvedStep).toEqualTypeOf<string>();
			expectTypeOf(resolvedObject).toEqualTypeOf<
				UseStepperResolvedObject<typeof objectSource>
			>();
			expectTypeOf(objectWithSymbol.steps.value).toEqualTypeOf<{
				first: string;
			}>();
			expectTypeOf(objectWithNumberKey.stepNames).toEqualTypeOf<
				ReadonlySignal<("1" | "second")[]>
			>();
			expectTypeOf(objectWithNumberKey.steps.value).toEqualTypeOf<{
				1: "One";
				second: "Second";
			}>();
			expectTypeOf(objectWithNumberKey.current).toEqualTypeOf<
				ReadonlySignal<"One" | "Second" | undefined>
			>();
			expectTypeOf<
				UseStepperObjectStepName<{ 1: "One"; second: "Second" }>
			>().toEqualTypeOf<"1" | "second">();
			expectTypeOf<
				UseStepperObjectStepValue<{ 1: "One"; second: "Second" }, "1">
			>().toEqualTypeOf<"One">();
			// @ts-expect-error symbol keys are not part of Object.keys step output
			objectWithSymbol.steps.value[symbolStep];
			// @ts-expect-error array steps must resolve to string or number
			useStepper([{ id: 1 }]);
			// @ts-expect-error initial array step must match a step value
			useStepper(["first", "second"] as const, "third");
			// @ts-expect-error object initial step must match a string key
			useStepper({ first: "First" }, "second");
			// @ts-expect-error object step names are string keys
			useStepper({ first: "First" }).goTo(1);
			// @ts-expect-error number keys are exposed as Object.keys strings
			objectWithNumberKey.goTo(1);
			// @ts-expect-error step name must match array values
			arraySteps.goTo("third");
			// @ts-expect-error steps is readonly
			arraySteps.steps.value = ["first"];
			// @ts-expect-error current is readonly
			arraySteps.current.value = "first";
		});
	});

	it("types controlled computed values and options", () => {
		typeOnly(() => {
			const trigger = signal(0);
			const options: ComputedWithControlOptions = {
				deep: true,
				flush: "sync",
				onTrack: (_event) => {},
				onTrigger: (_event) => {},
			};
			const value = computedWithControl<number>(
				trigger,
				(oldValue) => {
					expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
					return oldValue === undefined ? 1 : oldValue + 1;
				},
				options,
			);
			const writable = computedWithControl(trigger, {
				get: () => 1,
				set: (_next) => {},
			});

			expectTypeOf(value).toEqualTypeOf<ComputedWithControlReturn<number>>();
			expectTypeOf(value).toMatchTypeOf<ReadonlySignal<number>>();
			expectTypeOf(value.trigger).toEqualTypeOf<() => void>();
			expectTypeOf(writable).toEqualTypeOf<
				WritableComputedWithControlReturn<number>
			>();
			expectTypeOf(writable).toMatchTypeOf<Signal<number>>();
			writable.value = 2;
			// @ts-expect-error returned getter values are readonly signals
			value.value = 2;
		});
	});

	it("types event hooks", () => {
		typeOnly(() => {
			const single = createEventHook<number>();
			const tuple = createEventHook<[number, string]>();
			const array = createEventHook<string[]>();
			const readonlyTuple = createEventHook<readonly [number, string]>();
			const readonlyArray = createEventHook<readonly string[]>();
			const empty = createEventHook<void>();
			const loose = createEventHook();
			const callback: EventHookCallback<number> = (value) => {
				expectTypeOf(value).toEqualTypeOf<number>();
			};

			single.on(callback);
			single.on((value) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				return value.toString();
			});
			single.on((value, extra) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(extra).toEqualTypeOf<unknown>();
			});
			tuple.on((count, label) => {
				expectTypeOf(count).toEqualTypeOf<number>();
				expectTypeOf(label).toEqualTypeOf<string>();
			});
			array.on((value) => {
				expectTypeOf(value).toEqualTypeOf<string[]>();
			});
			readonlyTuple.on((count, label) => {
				expectTypeOf(count).toEqualTypeOf<number>();
				expectTypeOf(label).toEqualTypeOf<string>();
			});
			readonlyArray.on((value) => {
				expectTypeOf(value).toEqualTypeOf<readonly string[]>();
			});
			empty.on((...args) => {
				expectTypeOf(args).toEqualTypeOf<unknown[]>();
			});
			loose.on((...args) => {
				expectTypeOf(args).toEqualTypeOf<unknown[]>();
			});

			expectTypeOf(single).toEqualTypeOf<EventHookReturn<number>>();
			expectTypeOf(single).toEqualTypeOf<EventHook<number>>();
			expectTypeOf<[number, ...unknown[]]>().toEqualTypeOf<
				EventHookArgs<number>
			>();
			expectTypeOf<[string[], ...unknown[]]>().toEqualTypeOf<
				EventHookArgs<string[]>
			>();
			expectTypeOf(single.on(callback)).toEqualTypeOf<{ off: () => void }>();
			expectTypeOf(single.trigger(1)).toEqualTypeOf<Promise<unknown[]>>();
			expectTypeOf(single.trigger(1, "extra")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(tuple.trigger(1, "ready")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(array.trigger(["ready"])).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(readonlyTuple.trigger(1, "ready")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(readonlyArray.trigger(["ready"])).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(empty.trigger()).toEqualTypeOf<Promise<unknown[]>>();
			// @ts-expect-error single payload hooks require the first argument
			single.trigger();
			// @ts-expect-error tuple payload hooks require all tuple arguments
			tuple.trigger(1);
			// @ts-expect-error array payload hooks receive the array as one payload
			array.trigger("ready", "done");
			// @ts-expect-error readonly array payload hooks receive the array as one payload
			readonlyArray.trigger("ready", "done");
			// @ts-expect-error payload type must match
			single.trigger("ready");
		});
	});

	it("types generic projections", () => {
		typeOnly(() => {
			const from = signal<readonly [number, number]>([0, 10]);
			const to = signal<readonly ["low", "high"]>(["low", "high"]);
			const projector: ProjectorFunction<number, string> = (
				input,
				fromDomain,
				toDomain,
			) => {
				expectTypeOf(input).toEqualTypeOf<number>();
				expectTypeOf(fromDomain).toEqualTypeOf<readonly [number, number]>();
				expectTypeOf(toDomain).toEqualTypeOf<readonly [string, string]>();
				return input <= fromDomain[1] ? toDomain[0] : toDomain[1];
			};
			const useProjection = createGenericProjection(from, to, projector);
			const output = useProjection(signal(1));
			const projectionReturn: UseProjection<number, string> = useProjection;

			expectTypeOf(useProjection).toEqualTypeOf<
				UseProjection<number, string>
			>();
			expectTypeOf(output).toMatchTypeOf<ReadonlySignal<string>>();
			expectTypeOf(output.value).toEqualTypeOf<string>();
			expectTypeOf(projectionReturn(1).value).toEqualTypeOf<string>();
			// @ts-expect-error projection output is readonly
			output.value = "high";
			// @ts-expect-error input type must match the projection source domain
			useProjection(signal("1"));
			// @ts-expect-error projector must return the target domain type
			createGenericProjection(from, to, () => 1);
		});
	});

	it("types numeric projections", () => {
		typeOnly(() => {
			const useProjection = createProjection(
				signal<readonly [number, number]>([0, 10]),
				[0, 100] as const,
			);
			const custom = createProjection(
				[0, 10] as const,
				[0, 100] as const,
				(input, fromDomain, toDomain) => {
					expectTypeOf(input).toEqualTypeOf<number>();
					expectTypeOf(fromDomain).toEqualTypeOf<readonly [number, number]>();
					expectTypeOf(toDomain).toEqualTypeOf<readonly [number, number]>();
					return input + fromDomain[0] + toDomain[0];
				},
			);
			const output = useProjection(signal(1));

			expectTypeOf(useProjection).toEqualTypeOf<
				UseProjection<number, number>
			>();
			expectTypeOf(custom).toEqualTypeOf<UseProjection<number, number>>();
			expectTypeOf(output).toMatchTypeOf<ReadonlySignal<number>>();
			expectTypeOf(output.value).toEqualTypeOf<number>();
			// @ts-expect-error projection output is readonly
			output.value = 2;
			// @ts-expect-error input must be numeric
			useProjection(signal("1"));
			// @ts-expect-error custom projector must return a number
			createProjection([0, 10] as const, [0, 100] as const, () => "1");
		});
	});

	it("types event buses", () => {
		typeOnly(() => {
			const userKey: EventBusKey<{ readonly id: string }> = Symbol(
				"user",
			) as EventBusKey<{ readonly id: string }>;
			const news = useEventBus<string>("news");
			const keyed = useEventBus(userKey);
			const tuple =
				useEventBus<
					[event: "inc" | "dec", payload: { readonly amount: number }]
				>("counter");
			const loose = useEventBus("loose");
			const listener: EventBusListener<string> = (event) => {
				expectTypeOf(event).toEqualTypeOf<string>();
			};

			news.on(listener);
			news.on((event, extra) => {
				expectTypeOf(event).toEqualTypeOf<string>();
				expectTypeOf(extra).toEqualTypeOf<unknown>();
			});
			keyed.on((event) => {
				expectTypeOf(event).toEqualTypeOf<{ readonly id: string }>();
				// @ts-expect-error keyed event remains readonly
				event.id = "next";
			});
			tuple.on((event, payload) => {
				expectTypeOf(event).toEqualTypeOf<"inc" | "dec">();
				expectTypeOf(payload).toEqualTypeOf<{
					readonly amount: number;
				}>();
				// @ts-expect-error payload remains readonly
				payload.amount = 2;
			});
			loose.on((...args) => {
				expectTypeOf(args).toEqualTypeOf<unknown[]>();
				// @ts-expect-error unknown event must be narrowed before property access
				args[0].id;
			});

			expectTypeOf(news).toEqualTypeOf<UseEventBusReturn<string>>();
			expectTypeOf(news.on(listener)).toEqualTypeOf<{ off: () => void }>();
			expectTypeOf(news.once(listener)).toEqualTypeOf<{ off: () => void }>();
			expectTypeOf(news.emit("ready")).toEqualTypeOf<Promise<unknown[]>>();
			expectTypeOf(news.emit("ready", "extra")).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(news.off(listener)).toEqualTypeOf<void>();
			expectTypeOf(news.reset()).toEqualTypeOf<void>();
			expectTypeOf(tuple.emit("inc", { amount: 1 })).toEqualTypeOf<
				Promise<unknown[]>
			>();
			expectTypeOf(keyed.emit({ id: "u1" })).toEqualTypeOf<
				Promise<unknown[]>
			>();
			useEventBus<string>(1);
			useEventBus(userKey);
			// @ts-expect-error string event bus requires the first argument
			news.emit();
			// @ts-expect-error event type must match
			news.emit(1);
			// @ts-expect-error tuple bus requires all tuple arguments
			tuple.emit("inc");
			// @ts-expect-error payload type must match
			tuple.emit("inc", { amount: "1" });
			// @ts-expect-error keyed event type must match
			keyed.emit({ id: 1 });
			// @ts-expect-error plain symbols are not typed event bus identifiers
			useEventBus<string>(Symbol("plain"));
		});
	});

	it("types event sources", () => {
		typeOnly(() => {
			interface Payload {
				readonly id: string;
			}

			class TypedEventSource extends EventTarget implements EventSourceLike {
				readonly readyState = 0;
				constructor(_url: string | URL, _init?: EventSourceInit) {
					super();
				}
				close(): void {}
			}

			const events = ["notice", "update"] as const;
			const EventSourceCtor: EventSourceConstructorLike<TypedEventSource> =
				TypedEventSource;
			const window = Object.assign(new EventTarget(), {
				EventSource: EventSourceCtor,
			}) as EventSourceWindowLike<TypedEventSource>;
			const serializer: UseEventSourceSerializer<Payload> = {
				read: (value) => (value === undefined ? undefined : { id: value }),
			};
			const options: UseEventSourceOptions<
				Payload,
				TypedEventSource,
				EventSourceWindowLike<TypedEventSource>
			> = {
				autoConnect: true,
				immediate: false,
				serializer,
				window,
				withCredentials: true,
			};
			const source = useEventSource<
				typeof events,
				Payload,
				TypedEventSource,
				EventSourceWindowLike<TypedEventSource>
			>("https://example.com/events", events, options);
			const fallback = useEventSource("https://example.com/events", [], {
				window: null,
			});
			const reactiveUrl = signal<string | URL | null | undefined>(
				"https://example.com/events",
			);

			useEventSource(reactiveUrl, events, { window });
			expectTypeOf<EventSourceStatus>().toEqualTypeOf<UseEventSourceStatus>();
			expectTypeOf(source).toEqualTypeOf<
				UseEventSourceReturn<typeof events, Payload, TypedEventSource>
			>();
			expectTypeOf(source.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(source.eventSource.value).toEqualTypeOf<
				TypedEventSource | undefined
			>();
			expectTypeOf(source.status.value).toEqualTypeOf<UseEventSourceStatus>();
			expectTypeOf(source.data.value).toEqualTypeOf<Payload | undefined>();
			expectTypeOf(source.event.value).toEqualTypeOf<
				"notice" | "update" | undefined
			>();
			expectTypeOf(source.error.value).toEqualTypeOf<unknown | null>();
			expectTypeOf(source.lastEventId.value).toEqualTypeOf<string>();
			expectTypeOf(source.open()).toEqualTypeOf<void>();
			expectTypeOf(source.close()).toEqualTypeOf<void>();
			expectTypeOf(source.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback.eventSource.value).toEqualTypeOf<
				EventSourceLike | undefined
			>();
			expectTypeOf(serializer.read()).toEqualTypeOf<Payload | undefined>();
			// @ts-expect-error url must be a string, URL, or nullish value
			useEventSource(1);
			useEventSource("https://example.com/events", [], {
				// @ts-expect-error credentials option must be boolean
				withCredentials: "true",
			});
			useEventSource<readonly string[], Payload>(
				"https://example.com/events",
				[],
				{
					serializer: {
						// @ts-expect-error serializer return must match the data type
						read: () => "payload",
					},
				},
			);
			// @ts-expect-error signals returned by useEventSource are readonly
			source.data.value = { id: "next" };
			// @ts-expect-error lastEventId is readonly
			source.lastEventId.value = "2";
			// @ts-expect-error status must be one of the EventSource states
			const invalidStatus: EventSourceStatus = "READY";
			invalidStatus;
		});
	});

	it("types eye droppers", () => {
		typeOnly(() => {
			class TypedEyeDropper implements EyeDropperLike {
				open(_options?: EyeDropperOpenOptions): Promise<EyeDropperResult> {
					return Promise.resolve({ sRGBHex: "#112233" });
				}
			}

			const EyeDropperCtor: EyeDropperConstructorLike<TypedEyeDropper> =
				TypedEyeDropper;
			const window = Object.assign(new EventTarget(), {
				EyeDropper: EyeDropperCtor,
			}) as UseEyeDropperWindowLike<TypedEyeDropper>;
			const windowSignal =
				signal<UseEyeDropperWindowLike<TypedEyeDropper> | null>(window);
			const options: UseEyeDropperOptions<TypedEyeDropper> = {
				initialValue: "#000000",
				window: windowSignal,
			};
			const eyeDropper = useEyeDropper(options);
			const fallback = useEyeDropper({ window: null });
			const abortController = new AbortController();

			expectTypeOf(eyeDropper).toEqualTypeOf<
				UseEyeDropperReturn<TypedEyeDropper>
			>();
			expectTypeOf(eyeDropper.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(eyeDropper.isOpen).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(eyeDropper.sRGBHex).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(eyeDropper.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(eyeDropper.open()).toEqualTypeOf<
				Promise<EyeDropperResult | undefined>
			>();
			expectTypeOf(
				eyeDropper.open({ signal: abortController.signal }),
			).toEqualTypeOf<Promise<EyeDropperResult | undefined>>();
			expectTypeOf(eyeDropper.abort()).toEqualTypeOf<void>();
			expectTypeOf(eyeDropper.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback.sRGBHex.value).toEqualTypeOf<string>();
			// @ts-expect-error initialValue must be a string
			useEyeDropper({ initialValue: 1 });
			useEyeDropper({
				// @ts-expect-error window must be a window-like target
				window: 1,
			});
			// @ts-expect-error signal must be an AbortSignal
			eyeDropper.open({ signal: "bad" });
			// @ts-expect-error returned signals are readonly
			eyeDropper.sRGBHex.value = "#ffffff";
			// @ts-expect-error isOpen is readonly
			eyeDropper.isOpen.value = true;
		});
	});

	it("types favicons", () => {
		typeOnly(() => {
			const source = signal<string | null | undefined>("favicon.ico");
			const customDocument = {} as UseFaviconDocumentLike;
			const documentTarget = signal<UseFaviconDocumentLike | null>(
				customDocument,
			);
			const options: UseFaviconOptions<UseFaviconDocumentLike> = {
				baseUrl: "/icons/",
				document: documentTarget,
				media: "(prefers-color-scheme: dark)",
				rel: "icon",
				sizes: "any",
				type: "image/svg+xml",
			};
			const favicon = useFavicon(source, options);
			const fallback = useFavicon("fallback.ico", { document: null });

			useFavicon(() => "getter.ico", { document: customDocument });
			expectTypeOf(favicon).toEqualTypeOf<UseFaviconReturn>();
			expectTypeOf(favicon).toEqualTypeOf<
				Computed<string | null | undefined> & { stop(): void }
			>();
			expectTypeOf(favicon.value).toEqualTypeOf<string | null | undefined>();
			expectTypeOf(fallback.value).toEqualTypeOf<string | null | undefined>();
			expectTypeOf(favicon.stop()).toEqualTypeOf<void>();
			favicon.value = "next.ico";
			favicon.value = null;
			favicon.value = undefined;
			// @ts-expect-error icon must be a string or nullish value
			useFavicon(1);
			useFavicon("favicon.ico", {
				// @ts-expect-error rel must be a string
				rel: 1,
			});
			useFavicon("favicon.ico", {
				// @ts-expect-error document must be a document-like target
				document: {},
			});
			// @ts-expect-error favicon value must be string, null, or undefined
			favicon.value = 1;
		});
	});

	it("types script tags", () => {
		typeOnly(() => {
			const source = signal("/sdk.js");
			const customDocument = document as UseScriptTagDocumentLike;
			const documentTarget = signal<UseScriptTagDocumentLike | null>(
				customDocument,
			);
			const options: UseScriptTagOptions<UseScriptTagDocumentLike> = {
				async: false,
				attrs: {
					integrity: "sha384-test",
				},
				crossOrigin: "anonymous",
				defer: true,
				document: documentTarget,
				immediate: false,
				manual: true,
				noModule: false,
				nonce: "nonce-value",
				referrerPolicy: "no-referrer",
				type: "module",
			};
			const script = useScriptTag(
				source,
				(element) => {
					expectTypeOf(element).toEqualTypeOf<HTMLScriptElement>();
				},
				options,
			);
			const fallback = useScriptTag("/fallback.js", undefined, {
				document: null,
			});

			useScriptTag(() => "/getter.js", undefined, { document: customDocument });
			expectTypeOf(customDocument).toMatchTypeOf<UseScriptTagDocumentLike>();
			expectTypeOf(script).toEqualTypeOf<UseScriptTagReturn>();
			expectTypeOf(script.scriptTag).toEqualTypeOf<
				ReadonlySignal<HTMLScriptElement | null>
			>();
			expectTypeOf(
				script.scriptTag.value,
			).toEqualTypeOf<HTMLScriptElement | null>();
			expectTypeOf(script.load()).toEqualTypeOf<
				Promise<HTMLScriptElement | false>
			>();
			expectTypeOf(script.load(false)).toEqualTypeOf<
				Promise<HTMLScriptElement | false>
			>();
			expectTypeOf(script.unload()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseScriptTagReturn>();
			// @ts-expect-error src must be a string value
			useScriptTag(1);
			useScriptTag("/sdk.js", undefined, {
				// @ts-expect-error crossOrigin must be a valid script CORS setting
				crossOrigin: "include",
			});
			useScriptTag("/sdk.js", undefined, {
				// @ts-expect-error document must be a script document-like target
				document: {},
			});
			// @ts-expect-error scriptTag is readonly
			script.scriptTag.value = document.createElement("script");
		});
	});

	it("types style tags", () => {
		typeOnly(() => {
			const source = signal(".demo { color: red; }");
			const customDocument = document as UseStyleTagDocumentLike;
			const documentTarget = signal<UseStyleTagDocumentLike | null>(
				customDocument,
			);
			const options: UseStyleTagOptions<UseStyleTagDocumentLike> = {
				document: documentTarget,
				id: "custom-style",
				immediate: false,
				manual: true,
				media: "print",
				nonce: "nonce-value",
			};
			const style = useStyleTag(source, options);
			const fallback = useStyleTag(".fallback {}", {
				document: null,
			});

			useStyleTag(() => ".getter {}", { document: customDocument });
			expectTypeOf(customDocument).toMatchTypeOf<UseStyleTagDocumentLike>();
			expectTypeOf(style).toEqualTypeOf<UseStyleTagReturn>();
			expectTypeOf(style.id).toEqualTypeOf<string>();
			expectTypeOf(style.css).toEqualTypeOf<Signal<string>>();
			expectTypeOf(style.css.value).toEqualTypeOf<string>();
			expectTypeOf(style.isLoaded).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(style.isLoaded.value).toEqualTypeOf<boolean>();
			expectTypeOf(style.load()).toEqualTypeOf<void>();
			expectTypeOf(style.unload()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseStyleTagReturn>();
			style.css.value = ".demo { color: blue; }";
			// @ts-expect-error css must be a string value
			useStyleTag(1);
			useStyleTag(".demo {}", {
				// @ts-expect-error document must be a style document-like target
				document: {},
			});
			useStyleTag(".demo {}", {
				// @ts-expect-error id must be a string
				id: 1,
			});
			// @ts-expect-error isLoaded is readonly
			style.isLoaded.value = false;
			// @ts-expect-error css value must be a string
			style.css.value = 1;
		});
	});

	it("types fetch requests", () => {
		typeOnly(() => {
			interface Item {
				id: string;
			}

			const fetcher: UseFetchFetch = async (_input, _init) =>
				Response.json({ id: "1" });
			const window = {
				fetch: fetcher,
			} as UseFetchWindowLike;
			const url = signal<UseFetchUrl>("https://example.com/items/1");
			const options: UseFetchOptions<Item> = {
				fetch: fetcher,
				immediate: false,
				initialData: { id: "initial" },
				refetch: signal(true),
				timeout: 100,
				beforeFetch(context) {
					expectTypeOf(context).toEqualTypeOf<BeforeFetchContext>();
					expectTypeOf(context.url).toEqualTypeOf<UseFetchUrl>();
					expectTypeOf(context.options).toEqualTypeOf<RequestInit>();
					expectTypeOf(context.cancel()).toEqualTypeOf<void>();

					return {
						url: new URL("https://example.com/items/2"),
					};
				},
				afterFetch(context) {
					expectTypeOf(context).toEqualTypeOf<AfterFetchContext<Item>>();
					expectTypeOf(context.data).toEqualTypeOf<Item | null>();
					expectTypeOf(context.response).toEqualTypeOf<Response>();
					expectTypeOf(context.execute()).toEqualTypeOf<
						Promise<Response | null>
					>();

					return {
						data: { id: "after" },
					};
				},
				onFetchError(context) {
					expectTypeOf(context).toEqualTypeOf<OnFetchErrorContext<Item>>();
					expectTypeOf(context.error).toEqualTypeOf<unknown>();
					expectTypeOf(context.response).toEqualTypeOf<Response | null>();

					return {
						error: "changed",
					};
				},
			};
			const request = useFetch<Item>(url, options).json<Item>();
			const text = useFetch("https://example.com/text", {
				fetch: fetcher,
				window,
			}).text();
			const withRequestInit = useFetch(
				() => new URL("https://example.com/post"),
				{ headers: { Accept: "application/json" } },
				{ fetch: fetcher },
			).post(signal({ id: "1" }), "application/json");

			expectTypeOf(request).toEqualTypeOf<UseFetchReturn<Item>>();
			expectTypeOf(request).toEqualTypeOf<
				UseFetchReturnBase<Item> & PromiseLike<UseFetchReturnBase<Item>>
			>();
			expectTypeOf(request.data).toEqualTypeOf<ReadonlySignal<Item | null>>();
			expectTypeOf(request.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(request.statusCode).toEqualTypeOf<
				ReadonlySignal<number | null>
			>();
			expectTypeOf(request.response).toEqualTypeOf<
				ReadonlySignal<Response | null>
			>();
			expectTypeOf(request.isFetching).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(request.isFinished).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(request.canAbort).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(request.aborted).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(request.execute()).toEqualTypeOf<Promise<Response | null>>();
			expectTypeOf(request.abort()).toEqualTypeOf<void>();
			expectTypeOf(request.stop()).toEqualTypeOf<void>();
			expectTypeOf(text.data.value).toEqualTypeOf<string | null>();
			expectTypeOf(withRequestInit).toEqualTypeOf<UseFetchReturn<unknown>>();
			request.onFetchResponse((response) => {
				expectTypeOf(response).toEqualTypeOf<Response>();
			});
			request.onFetchError((error) => {
				expectTypeOf(error).toEqualTypeOf<unknown>();
			});
			request.onFetchFinally(() => {});
			// @ts-expect-error URL must be a string or URL value
			useFetch(1);
			useFetch("https://example.com", {
				// @ts-expect-error immediate must be boolean
				immediate: "yes",
			});
			useFetch("https://example.com", {
				// @ts-expect-error timeout must be number
				timeout: "slow",
			});
			useFetch("https://example.com", {
				// @ts-expect-error fetch must return a Response promise
				fetch: async () => "bad",
			});
			// @ts-expect-error payload type must be a string
			request.post({ id: "1" }, 1);
			// @ts-expect-error returned data is readonly
			request.data.value = { id: "2" };
		});
	});

	it("types file dialogs", () => {
		typeOnly(() => {
			const input = {} as UseFileDialogInputLike;
			const customDocument = {} as UseFileDialogDocumentLike;
			const documentTarget = signal<UseFileDialogDocumentLike | null>(
				customDocument,
			);
			const files = {} as FileList;
			const options: UseFileDialogOptions<UseFileDialogDocumentLike> = {
				accept: () => "image/*",
				capture: signal<string | undefined>("environment"),
				directory: signal(false),
				document: documentTarget,
				initialFiles: [new File(["content"], "file.txt"), files[0]],
				input: signal<UseFileDialogInputLike | null>(input),
				multiple: signal(true),
				reset: false,
			};
			const dialog = useFileDialog(options);
			const fallback = useFileDialog({ document: null });
			const openOptions: UseFileDialogOpenOptions = {
				accept: "text/plain",
				capture: undefined,
				directory: true,
				multiple: false,
				reset: true,
			};

			useFileDialog({
				document: customDocument,
				initialFiles: files,
				input,
			});
			expectTypeOf(dialog).toEqualTypeOf<UseFileDialogReturn>();
			expectTypeOf(dialog.files).toEqualTypeOf<
				ReadonlySignal<FileList | null>
			>();
			expectTypeOf(dialog.open()).toEqualTypeOf<void>();
			expectTypeOf(dialog.open(openOptions)).toEqualTypeOf<void>();
			expectTypeOf(dialog.reset()).toEqualTypeOf<void>();
			expectTypeOf(dialog.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback.files.value).toEqualTypeOf<FileList | null>();
			dialog.onChange((selectedFiles) => {
				expectTypeOf(selectedFiles).toEqualTypeOf<FileList | null>();
			});
			dialog.onCancel(() => {});
			useFileDialog({
				// @ts-expect-error initialFiles must be a FileList or file array
				initialFiles: 1,
			});
			useFileDialog({
				// @ts-expect-error multiple must be boolean
				multiple: "true",
			});
			useFileDialog({
				// @ts-expect-error accept must be a string
				accept: 1,
			});
			useFileDialog({
				// @ts-expect-error capture must be a string
				capture: 1,
			});
			useFileDialog({
				// @ts-expect-error input must be an input target
				input: 1,
			});
			useFileDialog({
				// @ts-expect-error document must be document-like
				document: {},
			});
			// @ts-expect-error returned files signal is readonly
			dialog.files.value = null;
		});
	});

	it("types file system access controls", () => {
		typeOnly(() => {
			const acceptTypes: readonly FileSystemAccessAcceptType[] = [
				{
					accept: {
						"text/plain": [".txt"],
					},
					description: "Text",
				},
			];
			const startIn = signal<FileSystemAccessStartInDirectory | undefined>(
				"documents",
			);
			const writable = {} as FileSystemAccessWritableFileStreamLike;
			const handle = {} as FileSystemAccessFileHandleLike;
			const window = {
				showOpenFilePicker: async (
					options?: FileSystemAccessShowOpenFileOptions,
				) => {
					expectTypeOf(options).toEqualTypeOf<
						FileSystemAccessShowOpenFileOptions | undefined
					>();
					return [handle] as const;
				},
				showSaveFilePicker: async (
					options?: FileSystemAccessShowSaveFileOptions,
				) => {
					expectTypeOf(options).toEqualTypeOf<
						FileSystemAccessShowSaveFileOptions | undefined
					>();
					return handle;
				},
			} as unknown as FileSystemAccessWindowLike<FileSystemAccessFileHandleLike>;
			const dataType = signal<FileSystemAccessDataType>("Text");
			const basePickerOptions: FileSystemAccessPickerOptions = {
				excludeAcceptAllOption: true,
				id: "notes",
				startIn: "downloads",
				types: acceptTypes,
			};
			const openOptions: UseFileSystemAccessOpenOptions = {
				excludeAcceptAllOption: signal(false),
				id: () => "open",
				startIn,
				types: signal(acceptTypes),
			};
			const saveOptions: UseFileSystemAccessSaveOptions = {
				excludeAcceptAllOption: false,
				id: "save",
				startIn: "documents",
				suggestedName: signal("note.txt"),
				types: acceptTypes,
			};
			const options: UseFileSystemAccessOptions<
				FileSystemAccessWindowLike<FileSystemAccessFileHandleLike>
			> = {
				...basePickerOptions,
				dataType,
				window: signal(window),
			};
			const access = useFileSystemAccess(options);
			const textAccess = useFileSystemAccess({
				dataType: "Text",
				window,
			});
			const arrayBufferAccess = useFileSystemAccess({
				dataType: "ArrayBuffer",
				window,
			});
			const blobAccess = useFileSystemAccess({
				dataType: "Blob",
				window,
			});
			const fallback = useFileSystemAccess({ window: null });
			const writeData = "content" satisfies FileSystemAccessWriteData;
			const createWritableOptions = {
				keepExistingData: true,
			} satisfies FileSystemAccessCreateWritableOptions;

			expectTypeOf(access).toEqualTypeOf<
				UseFileSystemAccessReturn<string | ArrayBuffer | Blob>
			>();
			expectTypeOf(textAccess).toEqualTypeOf<
				UseFileSystemAccessReturn<string>
			>();
			expectTypeOf(arrayBufferAccess).toEqualTypeOf<
				UseFileSystemAccessReturn<ArrayBuffer>
			>();
			expectTypeOf(blobAccess).toEqualTypeOf<UseFileSystemAccessReturn<Blob>>();
			expectTypeOf(access.data).toEqualTypeOf<
				Signal<string | ArrayBuffer | Blob | undefined>
			>();
			expectTypeOf(textAccess.data).toEqualTypeOf<Signal<string | undefined>>();
			expectTypeOf(access.file).toEqualTypeOf<
				ReadonlySignal<File | undefined>
			>();
			expectTypeOf(access.fileName).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(access.fileMIME).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(access.fileSize).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(access.fileLastModified).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(access.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(access.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(access.open(openOptions)).toEqualTypeOf<Promise<void>>();
			expectTypeOf(access.create(saveOptions)).toEqualTypeOf<Promise<void>>();
			expectTypeOf(access.save(saveOptions)).toEqualTypeOf<Promise<void>>();
			expectTypeOf(access.saveAs(saveOptions)).toEqualTypeOf<Promise<void>>();
			expectTypeOf(access.updateData()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(access.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback.data.value).toEqualTypeOf<
				string | ArrayBuffer | Blob | undefined
			>();
			expectTypeOf(writable.write(writeData)).toEqualTypeOf<Promise<void>>();
			expectTypeOf(writable.close()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(handle.createWritable(createWritableOptions)).toEqualTypeOf<
				Promise<FileSystemAccessWritableFileStreamLike>
			>();
			access.data.value = "changed";
			textAccess.data.value = undefined;
			// @ts-expect-error dataType must be one of the supported readers
			useFileSystemAccess({ dataType: "Json" });
			access.open({
				// @ts-expect-error multiple is not part of the single-file API
				multiple: true,
			});
			access.saveAs({
				// @ts-expect-error suggestedName must be a string
				suggestedName: 1,
			});
			useFileSystemAccess({
				// @ts-expect-error types must be a readonly list
				types: "text/plain",
			});
			useFileSystemAccess({
				types: [
					{
						// @ts-expect-error accept entries must be readonly string arrays
						accept: { "text/plain": ".txt" },
					},
				],
			});
			useFileSystemAccess({
				// @ts-expect-error window must be window-like
				window: {},
			});
			// @ts-expect-error file is readonly
			access.file.value = new File([], "bad.txt");
			// @ts-expect-error metadata is readonly
			access.fileName.value = "bad.txt";
			// @ts-expect-error support is readonly
			access.isSupported.value = true;
		});
	});

	it("types confirm dialogs", () => {
		typeOnly(() => {
			interface OpenData {
				id: string;
			}
			interface ConfirmData {
				accepted: true;
			}
			interface CancelData {
				reason: string;
			}

			const isOpen = signal(false);
			const dialog = useConfirmDialog<OpenData, ConfirmData, CancelData>(
				isOpen,
			);
			const internalDialog = useConfirmDialog();
			const result = {} as UseConfirmDialogResult<ConfirmData, CancelData>;

			dialog.onOpen((data) => {
				expectTypeOf(data).toEqualTypeOf<OpenData | undefined>();
			});
			dialog.onConfirm((data) => {
				expectTypeOf(data).toEqualTypeOf<ConfirmData | undefined>();
			});
			dialog.onCancel((data) => {
				expectTypeOf(data).toEqualTypeOf<CancelData | undefined>();
			});

			expectTypeOf(dialog).toEqualTypeOf<
				UseConfirmDialogReturn<OpenData, ConfirmData, CancelData>
			>();
			expectTypeOf(dialog.isOpen).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(dialog.open({ id: "item" })).toEqualTypeOf<
				Promise<UseConfirmDialogResult<ConfirmData, CancelData>>
			>();
			expectTypeOf(internalDialog).toEqualTypeOf<UseConfirmDialogReturn>();

			dialog.open();
			dialog.confirm({ accepted: true });
			dialog.cancel({ reason: "dismissed" });

			if (result.isCanceled) {
				expectTypeOf(result.data).toEqualTypeOf<CancelData | undefined>();
			} else {
				expectTypeOf(result.data).toEqualTypeOf<ConfirmData | undefined>();
			}

			// @ts-expect-error isOpen is readonly
			dialog.isOpen.value = true;
			// @ts-expect-error open data must match
			dialog.open({ id: 1 });
			// @ts-expect-error confirm data must match
			dialog.confirm({ accepted: false });
			// @ts-expect-error cancel data must match
			dialog.cancel({ reason: 1 });
		});
	});

	it("types created signals", () => {
		typeOnly(() => {
			const shallow = createSignal({ nested: { count: 0 } });
			const shallowExplicit = createSignal({ nested: { count: 0 } }, false);
			const deep = createSignal({ nested: { count: 0 } }, true);
			const primitive = createSignal(0, true);
			const dynamic = createSignal("ready", Math.random() > 0.5);

			expectTypeOf(shallow).toEqualTypeOf<
				Signal<{ nested: { count: number } }>
			>();
			expectTypeOf(shallowExplicit).toEqualTypeOf<
				Signal<{ nested: { count: number } }>
			>();
			expectTypeOf(deep).toEqualTypeOf<
				CreateSignalReturn<{ nested: { count: number } }, true>
			>();
			expectTypeOf(deep).toEqualTypeOf<Signal<{ nested: { count: number } }>>();
			expectTypeOf(deep.value.nested.count).toEqualTypeOf<number>();
			expectTypeOf(primitive.value).toEqualTypeOf<number>();
			expectTypeOf(dynamic).toEqualTypeOf<Signal<string>>();

			shallow.value = { nested: { count: 1 } };
			deep.value.nested.count = 1;
			primitive.value = 1;
		});
	});

	it("types extended signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const count = signal(1);
			const label = computed({
				get: () => "ready",
				set: (_next: string) => {},
			});
			const readonlyCount: ReadonlySignal<number> = readonly(count);
			const options: ExtendSignalOptions<true> = {
				enumerable: true,
				unwrap: true,
			};
			const noUnwrapOptions: ExtendSignalOptions<false> = {
				unwrap: false,
			};
			const extended = extendSignal(
				source,
				{
					count,
					label,
					plain: true,
					peek: () => "ignored",
					readonlyCount,
					value: "ignored",
				},
				options,
			);
			const preserved = extendSignal(
				source,
				{ count, label, readonlyCount },
				noUnwrapOptions,
			);
			const withEnumerable = extendSignal(
				source,
				{ count },
				{ enumerable: true },
			);
			const withEmptyOptions = extendSignal(source, { count }, {});

			expectTypeOf(source).toMatchTypeOf<ExtendSignalSource<number>>();
			expectTypeOf(extended).toMatchTypeOf<
				ExtendSignalReturn<
					typeof source,
					{
						count: typeof count;
						label: typeof label;
						plain: boolean;
						peek: () => string;
						readonlyCount: typeof readonlyCount;
						value: string;
					}
				>
			>();
			expectTypeOf(extended).toMatchTypeOf<Signal<number>>();
			expectTypeOf(extended.value).toEqualTypeOf<number>();
			expectTypeOf(extended.count).toEqualTypeOf<number>();
			expectTypeOf(extended.label).toEqualTypeOf<string>();
			expectTypeOf(extended.peek).toEqualTypeOf<() => number>();
			expectTypeOf(extended.plain).toEqualTypeOf<boolean>();
			expectTypeOf(extended.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(withEnumerable.count).toEqualTypeOf<number>();
			expectTypeOf(withEmptyOptions.count).toEqualTypeOf<number>();
			extended.count = 2;
			extended.label = "updated";
			expectTypeOf(extended.peek()).toEqualTypeOf<number>();
			// @ts-expect-error value extension does not replace the source value type
			extended.value = "ignored";
			// @ts-expect-error readonly signals expose a readonly unwrapped property
			extended.readonlyCount = 2;

			expectTypeOf(preserved.count).toEqualTypeOf<Signal<number>>();
			expectTypeOf(preserved.label).toEqualTypeOf<Computed<string>>();
			expectTypeOf(preserved.readonlyCount).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			preserved.count.value = 2;

			expectTypeOf<
				ExtendSignalUnwrapped<{
					count: Signal<number>;
					readonlyCount: ReadonlySignal<number>;
				}>
			>().toMatchTypeOf<{
				count: number;
				readonly readonlyCount: number;
			}>();
		});
	});

	it("types value-resolving functions", () => {
		typeOnly(() => {
			function join(this: { prefix: string }, first: string, second: number) {
				return `${this.prefix}:${first}:${second}`;
			}
			function callFactory(factory: () => string) {
				return factory();
			}
			function formatUnion(value: string | ((input: string) => string)) {
				return typeof value === "function" ? value("ready") : value;
			}
			const first = signal("ready");
			const second = computedEager(() => 1);
			const factory = signal(() => "ready");
			const unionFactory = signal((input: string) => input.toUpperCase());
			const resolveJoin = createResolveValueFn(join);
			const resolveFactory = createResolveValueFn(callFactory);
			const resolveUnion = createResolveValueFn(formatUnion);

			expectTypeOf(resolveJoin).toEqualTypeOf<ResolveValueFn<typeof join>>();
			expectTypeOf(
				resolveJoin.call({ prefix: "item" }, first, second),
			).toEqualTypeOf<string>();
			expectTypeOf<[MaybeValue<string>, MaybeValue<number>]>().toEqualTypeOf<
				MaybeValueArgs<[string, number]>
			>();
			expectTypeOf(resolveFactory(factory)).toEqualTypeOf<string>();
			expectTypeOf(resolveUnion("ready")).toEqualTypeOf<string>();
			expectTypeOf(resolveUnion(unionFactory)).toEqualTypeOf<string>();
			resolveJoin.call({ prefix: "item" }, () => "ready", 1);
			// @ts-expect-error first argument must resolve to string
			resolveJoin.call({ prefix: "item" }, signal(1), second);
			// @ts-expect-error second argument must resolve to number
			resolveJoin.call({ prefix: "item" }, first, "1");
			// @ts-expect-error function values must be wrapped to avoid getter handling
			resolveFactory(() => "ready");
			// @ts-expect-error function values in unions must also be wrapped
			resolveUnion((input: string) => input.toUpperCase());
		});
	});

	it("types reactified functions", () => {
		typeOnly(() => {
			function join(this: { prefix: string }, first: string, second: number) {
				return `${this.prefix}:${first}:${second}`;
			}
			function callFactory(factory: () => string) {
				return factory();
			}
			function formatUnion(value: string | ((input: string) => string)) {
				return typeof value === "function" ? value("ready") : value;
			}
			const first = signal("ready");
			const second = computedEager(() => 1);
			const factory = signal(() => "ready");
			const unionFactory = signal((input: string) => input.toUpperCase());
			const reactiveJoin = reactify(join);
			const add = reactify((left: number, right: number) => left + right);
			const reactiveFactory = reactify(callFactory);
			const reactiveUnion = reactify(formatUnion);
			const total = add(
				readonly(signal(1)),
				computed(() => 2),
			);

			expectTypeOf(reactiveJoin).toEqualTypeOf<ReactifyReturn<typeof join>>();
			expectTypeOf(
				reactiveJoin.call({ prefix: "item" }, first, second),
			).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(add(1, () => 2)).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(total).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(reactiveFactory(factory)).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(reactiveUnion("ready")).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(reactiveUnion(unionFactory)).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			// @ts-expect-error returned values are readonly signals
			total.value = 3;
			// @ts-expect-error first argument must resolve to string
			reactiveJoin.call({ prefix: "item" }, signal(1), second);
			// @ts-expect-error function values must be wrapped to avoid getter handling
			reactiveFactory(() => "ready");
			// @ts-expect-error function values in unions must also be wrapped
			reactiveUnion((input: string) => input.toUpperCase());
		});
	});

	it("types reactified objects", () => {
		typeOnly(() => {
			const source = {
				count: 1,
				format(this: { prefix: string }, value: string) {
					return `${this.prefix}:${value}`;
				},
				prefix: "item",
			};
			const symbolKey = Symbol("double");
			const withSymbol = {
				[symbolKey](value: number) {
					return value * 2;
				},
			};
			const optionalSource: {
				optional?: (value: number) => number;
				status: "ready" | ((value: number) => number);
			} = {
				optional(value: number) {
					return value * 2;
				},
				status(value: number) {
					return value * 3;
				},
			};
			const options: ReactifyObjectOptions = {
				includeOwnProperties: true,
			};
			const all = reactifyObject(source, options);
			const selected = reactifyObject(source, ["format"] as const);
			const symbolResult = reactifyObject(withSymbol);
			const optionalResult = reactifyObject(optionalSource);

			expectTypeOf(all).toEqualTypeOf<
				ReactifyObjectReturn<typeof source, keyof typeof source>
			>();
			expectTypeOf(all.format("ready")).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(all.count).toEqualTypeOf<number>();
			expectTypeOf(all.prefix).toEqualTypeOf<string>();
			expectTypeOf(selected).toEqualTypeOf<
				ReactifyObjectReturn<typeof source, "format">
			>();
			expectTypeOf(selected.format(signal("ready"))).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(symbolResult[symbolKey](signal(2))).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(optionalResult.optional).toEqualTypeOf<
				| ((value: MaybeValueArgs<[number]>[0]) => ReadonlySignal<number>)
				| undefined
			>();
			expectTypeOf(optionalResult.status).toEqualTypeOf<
				| "ready"
				| ((value: MaybeValueArgs<[number]>[0]) => ReadonlySignal<number>)
			>();
			expectTypeOf<
				ReactifyNested<{
					count: number;
					double(value: number): number;
				}>
			>().toMatchTypeOf<{
				count: number;
				double(value: number): ReadonlySignal<number>;
			}>();
			// @ts-expect-error selected keys do not include non-selected properties
			selected.count;
		});
	});

	it("types reactive computed objects", () => {
		typeOnly(() => {
			const count = signal(1);
			const nestedSignal = signal({ inner: signal(1) });
			const getter: ReactiveComputedGetter<{
				count: Signal<number>;
				label: string;
				nested: { ready: boolean };
				nestedSignal: Signal<{ inner: Signal<number> }>;
			}> = (previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					| {
							count: Signal<number>;
							label: string;
							nested: { ready: boolean };
							nestedSignal: Signal<{ inner: Signal<number> }>;
					  }
					| undefined
				>();
				return {
					count,
					label: String(count.value),
					nested: { ready: true },
					nestedSignal,
				};
			};
			const state = reactiveComputed(getter);
			const inlineState = reactiveComputed<{
				count: Signal<number>;
				label: string;
				nested: { ready: boolean };
				nestedSignal: Signal<{ inner: Signal<number> }>;
			}>((previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					| {
							count: Signal<number>;
							label: string;
							nested: { ready: boolean };
							nestedSignal: Signal<{ inner: Signal<number> }>;
					  }
					| undefined
				>();
				return {
					count,
					label: String(count.value),
					nested: { ready: true },
					nestedSignal,
				};
			});
			const inferredPreviousState = reactiveComputed((previous) => {
				expectTypeOf(previous).toEqualTypeOf<
					Record<PropertyKey, unknown> | undefined
				>();
				return {
					count: typeof previous?.count === "number" ? previous.count + 1 : 1,
					nestedSignal,
				};
			});

			expectTypeOf(state).toEqualTypeOf<
				ReactiveComputedReturn<{
					count: Signal<number>;
					label: string;
					nested: { ready: boolean };
					nestedSignal: Signal<{ inner: Signal<number> }>;
				}>
			>();
			expectTypeOf(state).toMatchTypeOf<DeepSignal<object>>();
			expectTypeOf(state.count).toEqualTypeOf<number>();
			expectTypeOf(state.label).toEqualTypeOf<string>();
			expectTypeOf(state.nested.ready).toEqualTypeOf<boolean>();
			expectTypeOf(state.nestedSignal.inner).toEqualTypeOf<number>();
			expectTypeOf(inlineState.count).toEqualTypeOf<number>();
			expectTypeOf(inlineState.nestedSignal.inner).toEqualTypeOf<number>();
			expectTypeOf(inferredPreviousState.count).toEqualTypeOf<number>();
			expectTypeOf(
				inferredPreviousState.nestedSignal.inner,
			).toEqualTypeOf<number>();

			state.count = 2;
			state.nestedSignal.inner = 2;
			// @ts-expect-error signal property unwrap keeps the source value type
			state.count = "2";
			// @ts-expect-error nested signal object unwrap keeps the nested source value type
			state.nestedSignal.inner = "2";
			// @ts-expect-error reactiveComputed only accepts object returns
			reactiveComputed(() => 1);
		});
	});

	it("types reactive omitted objects", () => {
		typeOnly(() => {
			const source = {
				count: signal(1),
				label: "ready",
				hidden: true,
			};
			const readonlySource = {
				readonlyCount: readonly(signal(1)),
				hidden: true,
			};
			const readonlyObjectSource = readonly(
				deepSignal({
					label: "ready",
					hidden: true,
				}),
			);
			const readonlyNestedSource = readonly(
				deepSignal({
					nested: { count: 1 },
					hidden: true,
				}),
			);
			const optionalSource: {
				foo?: string;
				hidden: boolean;
			} = {
				hidden: true,
			};
			const all = reactiveOmit(source);
			const omitted = reactiveOmit(source, "hidden");
			const omittedFromArray = reactiveOmit(source, ["hidden"] as const);
			const readonlyOmitted = reactiveOmit(readonlySource, "hidden");
			const readonlyObjectOmitted = reactiveOmit(
				readonlyObjectSource,
				"hidden",
			);
			const readonlyNestedOmitted = reactiveOmit(
				readonlyNestedSource,
				"hidden",
			);
			const optionalOmitted = reactiveOmit(optionalSource, "hidden");
			const predicate: ReactiveOmitPredicate<typeof source> = (value, key) => {
				expectTypeOf(value).toEqualTypeOf<string | number | boolean>();
				expectTypeOf(key).toEqualTypeOf<"count" | "label" | "hidden">();
				return key === "hidden" || value === "ready";
			};
			const predicateResult = reactiveOmit(source, predicate);

			expectTypeOf(omitted).toEqualTypeOf<
				ReactiveOmitReturn<typeof source, "hidden">
			>();
			expectTypeOf(all).toEqualTypeOf<
				ReactiveOmitReturn<typeof source, never>
			>();
			expectTypeOf(all.count).toEqualTypeOf<number>();
			expectTypeOf(all.hidden).toEqualTypeOf<boolean>();
			expectTypeOf(omitted.count).toEqualTypeOf<number>();
			expectTypeOf(omitted.label).toEqualTypeOf<string>();
			expectTypeOf(omittedFromArray.count).toEqualTypeOf<number>();
			expectTypeOf(readonlyOmitted.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(readonlyObjectOmitted.label).toEqualTypeOf<string>();
			expectTypeOf(readonlyNestedOmitted.nested.count).toEqualTypeOf<number>();
			expectTypeOf(optionalOmitted.foo).toEqualTypeOf<string | undefined>();
			expectTypeOf(predicateResult).toEqualTypeOf<
				ReactiveOmitReturn<typeof source>
			>();
			expectTypeOf(predicateResult.count).toEqualTypeOf<number | undefined>();
			expectTypeOf(predicateResult.label).toEqualTypeOf<string | undefined>();

			omitted.count = 2;
			omitted.label = "next";
			// @ts-expect-error omitted keys are not exposed
			omitted.hidden;
			// @ts-expect-error omitted keys are not exposed from array keys
			omittedFromArray.hidden;
			// @ts-expect-error signal property unwrap keeps the source value type
			omitted.count = "2";
			// @ts-expect-error readonly signal source stays readonly
			readonlyOmitted.readonlyCount = 2;
			// @ts-expect-error readonly object source stays readonly
			readonlyObjectOmitted.label = "next";
			// @ts-expect-error readonly deep signal source stays readonly
			readonlyNestedOmitted.nested.count = 2;
			const optionalTarget: { foo?: string } = optionalOmitted;
			optionalTarget.foo = "next";
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { foo: string | undefined } = optionalOmitted;
		});
	});

	it("types reactive picked objects", () => {
		typeOnly(() => {
			const source = {
				count: signal(1),
				label: "ready",
				hidden: true,
			};
			const readonlySource = {
				readonlyCount: readonly(signal(1)),
				hidden: true,
			};
			const readonlyObjectSource = readonly(
				deepSignal({
					label: "ready",
					hidden: true,
				}),
			);
			const readonlyNestedSource = readonly(
				deepSignal({
					nested: { count: 1 },
					hidden: true,
				}),
			);
			const optionalSource: {
				foo?: string;
				hidden: boolean;
			} = {
				hidden: true,
			};
			const none = reactivePick(source);
			const picked = reactivePick(source, "count", "label");
			const pickedFromArray = reactivePick(source, ["count"] as const);
			const readonlyPicked = reactivePick(readonlySource, "readonlyCount");
			const readonlyObjectPicked = reactivePick(readonlyObjectSource, "label");
			const readonlyNestedPicked = reactivePick(readonlyNestedSource, "nested");
			const optionalPicked = reactivePick(optionalSource, "foo");
			const predicate: ReactivePickPredicate<typeof source> = (value, key) => {
				expectTypeOf(value).toEqualTypeOf<string | number | boolean>();
				expectTypeOf(key).toEqualTypeOf<"count" | "label" | "hidden">();
				return key !== "hidden" && value !== true;
			};
			const predicateResult = reactivePick(source, predicate);

			expectTypeOf(picked).toEqualTypeOf<
				ReactivePickReturn<typeof source, "count" | "label">
			>();
			expectTypeOf(none).toEqualTypeOf<
				ReactivePickReturn<typeof source, never>
			>();
			expectTypeOf(picked.count).toEqualTypeOf<number>();
			expectTypeOf(picked.label).toEqualTypeOf<string>();
			expectTypeOf(pickedFromArray.count).toEqualTypeOf<number>();
			expectTypeOf(readonlyPicked.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(readonlyObjectPicked.label).toEqualTypeOf<string>();
			expectTypeOf(readonlyNestedPicked.nested.count).toEqualTypeOf<number>();
			expectTypeOf(optionalPicked.foo).toEqualTypeOf<string | undefined>();
			expectTypeOf(predicateResult).toEqualTypeOf<
				ReactivePickReturn<typeof source>
			>();
			expectTypeOf(predicateResult.count).toEqualTypeOf<number | undefined>();
			expectTypeOf(predicateResult.label).toEqualTypeOf<string | undefined>();

			picked.count = 2;
			picked.label = "next";
			optionalPicked.foo = "next";
			// @ts-expect-error unpicked keys are not exposed
			picked.hidden;
			// @ts-expect-error unpicked keys are not exposed from array keys
			pickedFromArray.label;
			// @ts-expect-error signal property unwrap keeps the source value type
			picked.count = "2";
			// @ts-expect-error readonly signal source stays readonly
			readonlyPicked.readonlyCount = 2;
			// @ts-expect-error readonly object source stays readonly
			readonlyObjectPicked.label = "next";
			// @ts-expect-error readonly deep signal source stays readonly
			readonlyNestedPicked.nested.count = 2;
			const optionalTarget: { foo?: string } = optionalPicked;
			optionalTarget.foo = "next";
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { foo: string | undefined } = optionalPicked;
		});
	});

	it("types deep signal conversion", () => {
		typeOnly(() => {
			const count = signal(1);
			const readonlyCount = readonly(signal(1));
			const nested = signal({ inner: signal(1) });
			const source = {
				count,
				label: "ready",
				nested,
				readonlyCount,
			};
			const optionalSource: {
				count: Signal<number>;
				optional?: string;
			} = {
				count,
			};
			const state = toDeepSignal(source);
			const signalState = toDeepSignal(signal(source));
			const readonlySignalState = toDeepSignal(readonly(signal(source)));
			const computedState = toDeepSignal(computed(() => source));
			const optionalState = toDeepSignal(optionalSource);

			expectTypeOf(state).toEqualTypeOf<ToDeepSignalReturn<typeof source>>();
			expectTypeOf(signalState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(readonlySignalState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(computedState).toEqualTypeOf<
				ToDeepSignalReturn<typeof source>
			>();
			expectTypeOf(state).toMatchTypeOf<DeepSignal<object>>();
			expectTypeOf(state.count).toEqualTypeOf<number>();
			expectTypeOf(state.label).toEqualTypeOf<string>();
			expectTypeOf(state.nested.inner).toEqualTypeOf<number>();
			expectTypeOf(state.readonlyCount).toEqualTypeOf<number>();
			expectTypeOf(optionalState.optional).toEqualTypeOf<string | undefined>();

			state.count = 2;
			state.label = "next";
			state.nested.inner = 2;
			optionalState.optional = "next";
			// @ts-expect-error signal property unwrap keeps the source value type
			state.count = "2";
			// @ts-expect-error nested signal object unwrap keeps the nested source value type
			state.nested.inner = "2";
			// @ts-expect-error readonly signal source stays readonly
			state.readonlyCount = 2;
			// @ts-expect-error optional source keys stay optional
			const requiredTarget: { optional: string | undefined } = optionalState;
			expectTypeOf(requiredTarget).toEqualTypeOf<{
				optional: string | undefined;
			}>();
			// @ts-expect-error toDeepSignal only accepts object values
			toDeepSignal(1);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal([1]);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(signal(new Map<string, number>()));
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new Map<string, number>() as ReadonlyMap<string, number>);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new Set<number>() as ReadonlySet<number>);
			// @ts-expect-error toDeepSignal source replacement only supports plain objects
			toDeepSignal(new ArrayBuffer(8));
		});
	});

	it("types scoped cleanup registration", () => {
		typeOnly(() => {
			const result = tryOnScopeDispose(() => {});

			expectTypeOf(result).toEqualTypeOf<TryOnScopeDisposeReturn>();
			expectTypeOf(result).toEqualTypeOf<boolean>();
			// @ts-expect-error cleanup must be callable
			tryOnScopeDispose("cleanup");
		});
	});

	it("types promised watch conditions", () => {
		typeOnly(() => {
			const count = signal<0 | 1 | 2>(0);
			const values = signal([1, 2] as number[]);
			const options: UntilToMatchOptions = {
				deep: true,
				flush: "sync",
				throwOnTimeout: true,
				timeout: 100,
			};
			const sourceList = until([signal(1), computed(() => 2)]);
			const value = until(count);
			const array = until(values);
			const isOne = (input: 0 | 1 | 2): input is 1 => input === 1;

			expectTypeOf(value).toEqualTypeOf<UntilValueInstance<0 | 1 | 2>>();
			expectTypeOf(value).toMatchTypeOf<UntilBaseInstance<0 | 1 | 2>>();
			expectTypeOf(value.toBe(1 as const, options)).toEqualTypeOf<Promise<1>>();
			expectTypeOf(value.not.toBe(1)).toEqualTypeOf<Promise<0 | 1 | 2>>();
			expectTypeOf(value.toBeTruthy()).toEqualTypeOf<Promise<1 | 2>>();
			expectTypeOf(value.toBeUndefined()).toEqualTypeOf<Promise<undefined>>();
			expectTypeOf(value.not.toBeUndefined()).toEqualTypeOf<
				Promise<0 | 1 | 2>
			>();
			expectTypeOf(value.toMatch(isOne)).toEqualTypeOf<Promise<1>>();
			expectTypeOf(value.not.toMatch(isOne)).toEqualTypeOf<Promise<0 | 2>>();
			expectTypeOf(array).toEqualTypeOf<UntilArrayInstance<number[]>>();
			expectTypeOf(array.toContains(signal(2))).toEqualTypeOf<
				Promise<number[]>
			>();
			expectTypeOf(sourceList.toContains(1)).toEqualTypeOf<
				Promise<[number, number]>
			>();

			// @ts-expect-error condition must be callable
			value.toMatch(1);
			// @ts-expect-error timeout must be numeric
			value.toBe(1, { timeout: "100" });
			// @ts-expect-error contained value must match the array element type
			array.toContains("2");
		});
	});

	it("types array watchers", () => {
		typeOnly(() => {
			const values = signal([1, 2] as number[]);
			const source: WatchArraySource<number> = values;
			const options: WatchArrayOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchArrayCallback<number> = (
				value,
				oldValue,
				added,
				removed,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<readonly number[]>();
				expectTypeOf(oldValue).toEqualTypeOf<readonly number[]>();
				expectTypeOf(added).toEqualTypeOf<number[]>();
				expectTypeOf(removed).toEqualTypeOf<number[]>();
				onCleanup(() => {});

				// @ts-expect-error added values keep the source item type
				added.push("3");
			};
			const stop = watchArray(source, callback, options);
			const getterStop = watchArray(() => values.value, callback);
			const rawStop = watchArray([1, 2, 3], callback, {
				immediate: true,
			});
			const watchReturn: WatchArrayReturn = stop;

			expectTypeOf(stop).toEqualTypeOf<WatchArrayReturn>();
			expectTypeOf(getterStop).toEqualTypeOf<WatchArrayReturn>();
			expectTypeOf(rawStop).toEqualTypeOf<WatchArrayReturn>();
			watchReturn();
			// @ts-expect-error source must resolve to an array
			watchArray(signal(1), callback);
			// @ts-expect-error callback item type must match source items
			watchArray(signal(["1"]), callback);
		});
	});

	it("types count-limited watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchAtMostSource<number> = count;
			const options: WatchAtMostOptions<true> = {
				count: signal(2),
				deep: true,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchAtMostCallback<number, true> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const tupleCallback: WatchAtMostSourceListCallback<
				[number, string],
				true
			> = (value, oldValue, onCleanup) => {
				expectTypeOf(value).toEqualTypeOf<[number, string]>();
				expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				onCleanup(() => {});
			};
			const controls = watchAtMost(source, callback, options);
			const sourceValues: WatchAtMostSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleControls = watchAtMost(
				[count, label] as const,
				tupleCallback,
				{ count: 1, immediate: true },
			);
			const nonImmediateTupleControls = watchAtMost(
				[count, label] as const,
				(value, oldValue, onCleanup) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string]>();
					onCleanup(() => {});
				},
				{ count: 1 },
			);
			const watchReturn: WatchAtMostReturn = controls;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(controls).toEqualTypeOf<WatchAtMostReturn>();
			expectTypeOf(tupleControls).toEqualTypeOf<WatchAtMostReturn>();
			expectTypeOf(
				nonImmediateTupleControls,
			).toEqualTypeOf<WatchAtMostReturn>();
			expectTypeOf(controls.count).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(controls.stop()).toEqualTypeOf<void>();
			watchReturn.stop();
			// @ts-expect-error pause is handled by a dedicated watch helper
			controls.pause();
			// @ts-expect-error resume is handled by a dedicated watch helper
			controls.resume();
			// @ts-expect-error count must resolve to a number
			watchAtMost(count, callback, { count: "2" });
			// @ts-expect-error source must be watchable
			watchAtMost(1, callback, { count: 1 });
			// @ts-expect-error callback value type must match the source value
			watchAtMost(signal("1"), callback, { count: 1 });
		});
	});

	it("types debounced watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const delay = signal(100);
			const source: WatchDebouncedSource<number> = count;
			const options: WatchDebouncedOptions<true> = {
				debounce: delay,
				deep: true,
				flush: "sync",
				immediate: true,
				maxWait: () => 500,
			};
			const callback: WatchDebouncedCallback<number, true> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const stop = watchDebounced(source, callback, options);
			const sourceValues: WatchDebouncedSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleStop = watchDebounced(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string]>();
				},
				{ debounce: 1 },
			);
			const watchReturn: WatchDebouncedReturn = stop;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchDebouncedReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchDebouncedReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			// @ts-expect-error debounce must resolve to a number
			watchDebounced(count, callback, { debounce: "100" });
			// @ts-expect-error maxWait must resolve to a number
			watchDebounced(count, callback, { maxWait: "100" });
			// @ts-expect-error source must be watchable
			watchDebounced(1, callback, { debounce: 1 });
			// @ts-expect-error callback value type must match the source value
			watchDebounced(signal("1"), callback, { debounce: 1 });
		});
	});

	it("types deep watchers", () => {
		typeOnly(() => {
			const source = deepSignal({ nested: { count: 0 } });
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const watchSource: WatchDeepSource<{ nested: { count: number } }> =
				source;
			const options: WatchDeepOptions<true> = {
				flush: "sync",
				immediate: true,
			};
			const callback: WatchDeepCallback<{ nested: { count: number } }, true> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<{ nested: { count: number } }>();
				expectTypeOf(oldValue).toEqualTypeOf<
					{ nested: { count: number } } | undefined
				>();
				onCleanup(() => {});
			};
			const stop = watchDeep(watchSource, callback, options);
			const sourceValues: WatchDeepSourceValues<[typeof count, typeof label]> =
				[1, "1"];
			const tupleStop = watchDeep(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string]>();
				},
				{ flush: "sync" },
			);
			const watchReturn: WatchDeepReturn = stop;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchDeepReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchDeepReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			// @ts-expect-error deep is always enabled by this helper
			watchDeep(source, callback, { deep: false });
			// @ts-expect-error source must be watchable
			watchDeep(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchDeep(signal("1"), callback);
		});
	});

	it("types ignorable watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchIgnorableSource<number> = count;
			const options: WatchIgnorableOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchIgnorableCallback<number, true> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const controls = watchIgnorable(source, callback, options);
			const sourceValues: WatchIgnorableSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleControls = watchIgnorable(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string]>();
				},
				{ flush: "sync" },
			);
			const watchReturn: WatchIgnorableReturn = controls;
			const ignoreUpdates: WatchIgnorableIgnoreUpdates = controls.ignoreUpdates;
			const ignorePrevAsyncUpdates: WatchIgnorableIgnorePrevAsyncUpdates =
				controls.ignorePrevAsyncUpdates;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(controls).toEqualTypeOf<WatchIgnorableReturn>();
			expectTypeOf(tupleControls).toEqualTypeOf<WatchIgnorableReturn>();
			expectTypeOf(controls.stop()).toEqualTypeOf<void>();
			expectTypeOf(ignoreUpdates(() => {})).toEqualTypeOf<void>();
			expectTypeOf(ignorePrevAsyncUpdates()).toEqualTypeOf<void>();
			watchReturn.stop();
			watchIgnorable(count, callback, {
				// @ts-expect-error eventFilter is not supported without watchWithFilter
				eventFilter(invoke: () => void) {
					invoke();
				},
			});
			// @ts-expect-error source must be watchable
			watchIgnorable(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchIgnorable(signal("1"), callback);
		});
	});

	it("types immediate watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchImmediateSource<number> = count;
			const options: WatchImmediateOptions = {
				deep: true,
				flush: "sync",
			};
			const callback: WatchImmediateCallback<number> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const stop = watchImmediate(source, callback, options);
			const sourceValues: WatchImmediateSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleStop = watchImmediate(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				},
				{ flush: "sync" },
			);
			const watchReturn: WatchImmediateReturn = stop;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchImmediateReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchImmediateReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			// @ts-expect-error immediate is always enabled by this helper
			watchImmediate(count, callback, { immediate: false });
			// @ts-expect-error source must be watchable
			watchImmediate(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchImmediate(signal("1"), callback);
		});
	});

	it("types once watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchOnceSource<number> = count;
			const options: WatchOnceOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchOnceCallback<number, number | undefined> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const stop = watchOnce(source, callback, options);
			const sourceValues: WatchOnceSourceValues<[typeof count, typeof label]> =
				[1, "1"];
			const tupleStop = watchOnce(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				},
				{ flush: "sync", immediate: true },
			);
			const watchReturn: WatchOnceReturn = stop;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchOnceReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchOnceReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			watchOnce(count, callback, {
				// @ts-expect-error Sigrea watch does not support once option
				once: true,
			});
			// @ts-expect-error source must be watchable
			watchOnce(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchOnce(signal("1"), callback);
		});
	});

	it("types pausable watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchPausableSource<number> = count;
			const initialState: WatchPausableInitialState = "paused";
			const options: WatchPausableOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
				initialState,
			};
			const callback: WatchPausableCallback<number, number | undefined> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const controls = watchPausable(source, callback, options);
			const sourceValues: WatchPausableSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleControls = watchPausable(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				},
				{ flush: "sync", immediate: true },
			);
			const watchReturn: WatchPausableReturn = controls;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(controls).toEqualTypeOf<WatchPausableReturn>();
			expectTypeOf(tupleControls).toEqualTypeOf<WatchPausableReturn>();
			expectTypeOf(controls.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(controls.pause()).toEqualTypeOf<void>();
			expectTypeOf(controls.resume()).toEqualTypeOf<void>();
			expectTypeOf(watchReturn.stop()).toEqualTypeOf<void>();
			watchPausable(count, callback, {
				// @ts-expect-error eventFilter is not supported without watchWithFilter
				eventFilter(invoke: () => void) {
					invoke();
				},
			});
			watchPausable(count, callback, {
				// @ts-expect-error initialState must be active or paused
				initialState: "idle",
			});
			// @ts-expect-error source must be watchable
			watchPausable(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchPausable(signal("1"), callback);
		});
	});

	it("types throttled watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const delay = signal(100);
			const source: WatchThrottledSource<number> = count;
			const options: WatchThrottledOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
				leading: true,
				throttle: delay,
				trailing: false,
			};
			const callback: WatchThrottledCallback<number, number | undefined> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const stop = watchThrottled(source, callback, options);
			const sourceValues: WatchThrottledSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleStop = watchThrottled(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				},
				{ flush: "sync", immediate: true, throttle: 1 },
			);
			const watchReturn: WatchThrottledReturn = stop;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchThrottledReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchThrottledReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			watchThrottled(count, callback, {
				// @ts-expect-error eventFilter is not supported without watchWithFilter
				eventFilter(invoke: () => void) {
					invoke();
				},
			});
			// @ts-expect-error throttle must resolve to a number
			watchThrottled(count, callback, { throttle: "100" });
			// @ts-expect-error source must be watchable
			watchThrottled(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchThrottled(signal("1"), callback);
		});
	});

	it("types triggerable watchers", () => {
		typeOnly(() => {
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchTriggerableSource<number> = count;
			const options: WatchTriggerableOptions<true> = {
				deep: true,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchTriggerableCallback<
				number,
				number | undefined,
				string
			> = (value, oldValue, onCleanup) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
				return `${value}`;
			};
			const controls = watchTriggerable(source, callback, options);
			const sourceValues: WatchTriggerableSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const sourceOldValues: WatchTriggerableSourceOldValues<
				[typeof count, typeof label]
			> = [undefined, "1"];
			const tupleControls = watchTriggerable(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<
						[number | undefined, string | undefined] | []
					>();
					return 1;
				},
				{ flush: "sync", immediate: true },
			);
			const watchReturn: WatchTriggerableReturn<string> = controls;

			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(sourceOldValues).toEqualTypeOf<
				[number | undefined, string | undefined]
			>();
			expectTypeOf(controls).toEqualTypeOf<WatchTriggerableReturn<string>>();
			expectTypeOf(tupleControls).toEqualTypeOf<
				WatchTriggerableReturn<number>
			>();
			expectTypeOf(controls.trigger()).toEqualTypeOf<string | undefined>();
			expectTypeOf(tupleControls.trigger()).toEqualTypeOf<number | undefined>();
			expectTypeOf(controls.ignoreUpdates(() => {})).toEqualTypeOf<void>();
			expectTypeOf(controls.ignorePrevAsyncUpdates()).toEqualTypeOf<void>();
			expectTypeOf(watchReturn.stop()).toEqualTypeOf<void>();
			// @ts-expect-error eventFilter is not supported without watchWithFilter
			watchTriggerable(count, callback, {
				eventFilter(invoke: () => void) {
					invoke();
				},
			});
			// @ts-expect-error source must be watchable
			watchTriggerable(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchTriggerable(signal("1"), callback);
		});
	});

	it("types event filters and filtered watchers", () => {
		typeOnly(() => {
			const fn = function (this: { id: string }, value: number, label: string) {
				return `${this.id}:${value}:${label}`;
			};
			const wrapperOptions: FunctionWrapperOptions<
				[number, string],
				{ id: string },
				typeof fn
			> = {
				args: [1, "ready"],
				fn,
				thisArg: { id: "ctx" },
			};
			const filter: EventFilter<
				[number, string],
				{ id: string },
				() => string
			> = (invoke, options) => {
				expectTypeOf(options.args).toEqualTypeOf<[number, string]>();
				expectTypeOf(options.thisArg).toEqualTypeOf<{ id: string }>();
				return invoke();
			};
			const configurable: ConfigurableEventFilter = {
				eventFilter: filter as EventFilter,
			};
			const count = signal(0);
			const label = computed(() => `${count.value}`);
			const source: WatchWithFilterSource<number> = count;
			const options: WatchWithFilterOptions<true> = {
				deep: true,
				eventFilter: filter as EventFilter,
				flush: "sync",
				immediate: true,
			};
			const callback: WatchWithFilterCallback<number, number | undefined> = (
				value,
				oldValue,
				onCleanup,
			) => {
				expectTypeOf(value).toEqualTypeOf<number>();
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				onCleanup(() => {});
			};
			const stop = watchWithFilter(source, callback, options);
			const sourceValues: WatchWithFilterSourceValues<
				[typeof count, typeof label]
			> = [1, "1"];
			const tupleStop = watchWithFilter(
				[count, label] as const,
				(value, oldValue) => {
					expectTypeOf(value).toEqualTypeOf<[number, string]>();
					expectTypeOf(oldValue).toEqualTypeOf<[number, string] | []>();
				},
				{ eventFilter: filter as EventFilter, flush: "sync", immediate: true },
			);
			const watchReturn: WatchWithFilterReturn = stop;

			expectTypeOf(wrapperOptions.args).toEqualTypeOf<[number, string]>();
			expectTypeOf(configurable).toEqualTypeOf<ConfigurableEventFilter>();
			expectTypeOf(sourceValues).toEqualTypeOf<[number, string]>();
			expectTypeOf(stop).toEqualTypeOf<WatchWithFilterReturn>();
			expectTypeOf(tupleStop).toEqualTypeOf<WatchWithFilterReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			// @ts-expect-error eventFilter must be a function
			watchWithFilter(count, callback, { eventFilter: "filter" });
			// @ts-expect-error source must be watchable
			watchWithFilter(1, callback);
			// @ts-expect-error callback value type must match the source value
			watchWithFilter(signal("1"), callback);
		});
	});

	it("types truthy watchers", () => {
		typeOnly(() => {
			const source = signal<0 | 1 | false | null>(0);
			const watchSource: WheneverSource<0 | 1 | false | null> = source;
			const options: WheneverOptions<true> = {
				flush: "sync",
				immediate: true,
				once: true,
			};
			const callback: WheneverCallback<
				0 | 1 | false | null,
				0 | 1 | false | null | undefined
			> = (value, oldValue, onCleanup) => {
				expectTypeOf(value).toEqualTypeOf<1>();
				expectTypeOf(oldValue).toEqualTypeOf<
					0 | 1 | false | null | undefined
				>();
				onCleanup(() => {});
			};
			const stop = whenever(source, callback, options);
			const deepStop = whenever(
				deepSignal({ ready: true }),
				(value) => {
					expectTypeOf(value.ready).toEqualTypeOf<boolean>();
				},
				{ immediate: true },
			);
			const watchReturn: WheneverReturn = stop;

			expectTypeOf(watchSource).toMatchTypeOf<
				WheneverSource<0 | 1 | false | null>
			>();
			expectTypeOf<WheneverSourceValue<typeof source>>().toEqualTypeOf<
				0 | 1 | false | null
			>();
			expectTypeOf<
				WheneverTruthy<0 | 1 | false | null | "ready">
			>().toEqualTypeOf<1 | "ready">();
			expectTypeOf(stop).toEqualTypeOf<WheneverReturn>();
			expectTypeOf(deepStop).toEqualTypeOf<WheneverReturn>();
			expectTypeOf(watchReturn()).toEqualTypeOf<void>();
			// @ts-expect-error source must be watchable
			whenever(1, callback);
			// @ts-expect-error source lists are not supported
			whenever([source] as const, callback);
			// @ts-expect-error callback value is truthy, so 0 is excluded
			whenever(source, (value: 0) => {
				expectTypeOf(value).toEqualTypeOf<0>();
			});
		});
	});

	it("types resolved values", () => {
		typeOnly(() => {
			const count = signal(1);
			const readonlyCount = readonly(count);
			const doubled = computed(() => count.value * 2);
			const factory = signal((): string => "ready");
			const getter = (): string => "ready";
			const functionValue = (_input: string): string => "ready";
			const getterReturningSignal = (): Signal<string> => signal("ready");

			expectTypeOf(resolveValue("ready")).toEqualTypeOf<string>();
			expectTypeOf(resolveValue(count)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(readonlyCount)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(doubled)).toEqualTypeOf<number>();
			expectTypeOf(resolveValue(getter)).toEqualTypeOf<string>();
			expectTypeOf(resolveValue(factory)).toEqualTypeOf<() => string>();
			expectTypeOf(resolveValue(getterReturningSignal)).toEqualTypeOf<
				Signal<string>
			>();
			// @ts-expect-error resolveValue does not provide VueUse get key access
			resolveValue({ count: 1 }, "count");
			// @ts-expect-error function values must be wrapped to avoid getter handling
			resolveValue(functionValue);
		});
	});

	it("types auto-reset signals", () => {
		typeOnly(() => {
			const defaultText: MaybeValue<string> = () => "idle";
			const delay: MaybeValue<number> = computed(() => 100);
			const text = signalAutoReset(defaultText, delay);
			const count = signalAutoReset(signal(0), signal(100));
			const literal = signalAutoReset<"idle" | "done">("idle", 100);

			expectTypeOf(text).toEqualTypeOf<SignalAutoResetReturn<string>>();
			expectTypeOf(text).toEqualTypeOf<Signal<string>>();
			expectTypeOf(count).toEqualTypeOf<Signal<number>>();
			expectTypeOf(literal).toEqualTypeOf<Signal<"idle" | "done">>();

			text.value = "ready";
			count.value = 1;
			literal.value = "done";
			// @ts-expect-error value type is preserved
			literal.value = "other";
			// @ts-expect-error afterMs must resolve to a number
			signalAutoReset("idle", "100");
		});
	});

	it("types defaulted signals", () => {
		typeOnly(() => {
			const source = signal<string | null | undefined>();
			const createdSource = createSignal<string | undefined, true>(
				undefined,
				true,
			);
			const value = signalDefault(source, "default");
			const createdValue = signalDefault(createdSource, "default");
			const nullValue = signalDefault(source, null);
			const undefinedValue = signalDefault(source, undefined);
			const fallbackFn: () => string = () => "default";
			const functionValue = signalDefault(
				signal<(() => string) | undefined>(),
				fallbackFn,
			);

			expectTypeOf(value).toEqualTypeOf<SignalDefaultReturn<string>>();
			expectTypeOf(value).toEqualTypeOf<Signal<string>>();
			expectTypeOf(createdValue).toEqualTypeOf<SignalDefaultReturn<string>>();
			expectTypeOf(nullValue).toEqualTypeOf<Signal<string | null>>();
			expectTypeOf(undefinedValue).toEqualTypeOf<Signal<string | undefined>>();
			expectTypeOf(functionValue).toMatchTypeOf<Signal<() => string>>();

			value.value = "updated";
			createdValue.value = "updated";
			nullValue.value = null;
			undefinedValue.value = undefined;
			functionValue.value = () => "updated";
			// @ts-expect-error value type is preserved
			value.value = 1;
			// @ts-expect-error default value must match the source value
			signalDefault(source, 1);
			// @ts-expect-error default is a raw value, not a MaybeValue getter
			signalDefault(source, () => "default");
			// @ts-expect-error default is a raw value, not a signal wrapper
			signalDefault(source, signal("default"));
			// @ts-expect-error source must be a writable signal
			signalDefault("source", "default");
			// @ts-expect-error getter sources do not expose a writable target
			signalDefault(() => source.value, "default");
			// @ts-expect-error computed sources do not expose a safe writable target
			signalDefault(
				computed(() => source.value),
				"default",
			);
		});
	});

	it("types synced signals", () => {
		typeOnly(() => {
			const left = signal(1);
			const right = signal(2);
			const countOrText = signal<number | string>(0);
			const text = signal("1");
			const source = signal("source");
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value);
			const options: SyncSignalOptions<number, string> = {
				deep: true,
				direction: "both",
				flush: "sync",
				immediate: true,
				transform: {
					ltr: (value) => value.toString(),
					rtl: (value) => Number(value),
				},
			};
			const leftToRightOptions: SyncSignalOptions<
				number,
				number | string,
				"ltr"
			> = {
				direction: "ltr",
			};
			// @ts-expect-error one-way option types must include their runtime direction
			const missingDirectionOptions: SyncSignalOptions<number, string, "ltr"> =
				{
					transform: {
						ltr: (value) => value.toString(),
					},
				};
			const transform: SyncSignalTransform<number, string> = {
				ltr: (value) => value.toString(),
				rtl: (value) => Number(value),
			};

			expectTypeOf(syncSignal(left, right)).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(
				syncSignal(left, text, options),
			).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(
				syncSignal(left, countOrText, leftToRightOptions),
			).toEqualTypeOf<SyncSignalReturn>();
			expectTypeOf(missingDirectionOptions).toEqualTypeOf<
				SyncSignalOptions<number, string, "ltr">
			>();
			expectTypeOf(transform.ltr(1)).toEqualTypeOf<string>();
			expectTypeOf(transform.rtl("1")).toEqualTypeOf<number>();
			expectTypeOf<SyncSignalDirection>().toEqualTypeOf<
				"ltr" | "rtl" | "both"
			>();

			syncSignal(left, countOrText, {
				direction: "both",
				transform: {
					rtl: (value) => Number(value),
				},
			});
			syncSignal(left, text, {
				direction: "ltr",
				transform: {
					ltr: (value) => value.toString(),
				},
			});
			// @ts-expect-error different signal value types need a safe transform
			syncSignal(left, text);
			// @ts-expect-error both directions need a right-to-left transform here
			syncSignal(left, countOrText, { direction: "both" });
			// @ts-expect-error right-to-left cannot assign number|string to number
			syncSignal(left, countOrText, { direction: "rtl" });
			syncSignal(left, text, {
				direction: "ltr",
				transform: {
					// @ts-expect-error direction-specific transform keys are enforced
					rtl: (value: string) => Number(value),
				},
			});
			// @ts-expect-error source must be a writable signal
			syncSignal("source", right);
			// @ts-expect-error readonly signals do not expose a writable target
			syncSignal(readonlySource, right);
			// @ts-expect-error computed sources do not expose a safe writable target
			syncSignal(computedSource, right);
		});
	});

	it("types one-way synced signals", () => {
		typeOnly(() => {
			const source = signal(1);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value);
			const getterSource = () => source.value;
			const target = signal(0);
			const otherTarget = signal(2);
			const widerTarget = signal<number | string>(0);
			const textTarget = signal("target");
			const computedTarget = computed(() => target.value);
			const deepSource = deepSignal({ count: 0 });
			const deepTarget = signal(deepSignal({ count: 1 }));
			const options: SyncSignalsOptions = {
				deep: true,
				flush: "sync",
				immediate: true,
			};

			expectTypeOf(
				syncSignals(source, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(source, [target, otherTarget] as const, options),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(source, widerTarget),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(readonlySource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(computedSource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(getterSource, target),
			).toEqualTypeOf<SyncSignalsReturn>();
			expectTypeOf(
				syncSignals(deepSource, deepTarget),
			).toEqualTypeOf<SyncSignalsReturn>();

			// @ts-expect-error raw values are not watch sources
			syncSignals(1, target);
			// @ts-expect-error target must accept the source value
			syncSignals(source, textTarget);
			// @ts-expect-error computed targets do not expose a safe writable target
			syncSignals(source, computedTarget);
		});
	});

	it("types manual-reset signals", () => {
		typeOnly(() => {
			const defaultText: MaybeValue<string> = () => "idle";
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const text = signalManualReset(defaultText);
			const count = signalManualReset(source);
			const fromReadonly = signalManualReset(readonlySource);
			const fromComputed = signalManualReset(computedSource);
			const literal = signalManualReset<"idle" | "done">("idle");
			const fallbackFn = signal((): string => "default");
			const functionValue = signalManualReset(fallbackFn);
			const getterFunctionValue = signalManualReset(() => fallbackFn.value);
			const rawFunction = (_input: string): string => "default";

			expectTypeOf(text).toEqualTypeOf<SignalManualResetReturn<string>>();
			expectTypeOf(text).toMatchTypeOf<Signal<string>>();
			expectTypeOf(count).toEqualTypeOf<SignalManualResetReturn<number>>();
			expectTypeOf(fromReadonly.value).toEqualTypeOf<number>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(functionValue).toEqualTypeOf<
				SignalManualResetReturn<() => string>
			>();
			expectTypeOf(getterFunctionValue).toEqualTypeOf<
				SignalManualResetReturn<() => string>
			>();
			expectTypeOf(text.reset()).toEqualTypeOf<void>();

			text.value = "ready";
			count.value = 1;
			literal.value = "done";
			functionValue.value = () => "updated";
			getterFunctionValue.value = () => "updated";
			// @ts-expect-error value type is preserved
			literal.value = "other";
			// @ts-expect-error raw function values must be wrapped to avoid getter handling
			signalManualReset(rawFunction);
		});
	});

	it("types debounced signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const delay: MaybeValue<number> = computed(() => 100);
			const maxWait: MaybeValue<number> = signal(200);
			const options: SignalDebouncedOptions = { maxWait };
			const fromRaw = signalDebounced(0, delay, options);
			const fromWritable = signalDebounced(source, delay, options);
			const fromReadonly = signalDebounced(readonlySource, signal(100));
			const fromComputed = signalDebounced(computedSource, () => 50);
			const fromGetter = signalDebounced(() => source.value, 100);

			expectTypeOf(options.maxWait).toEqualTypeOf<
				MaybeValue<number> | undefined
			>();
			expectTypeOf(fromRaw).toEqualTypeOf<SignalDebouncedReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<SignalDebouncedReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromReadonly).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(fromGetter.value).toEqualTypeOf<number>();

			// @ts-expect-error returned value is readonly
			fromWritable.value = 1;
			// @ts-expect-error ms must resolve to a number
			signalDebounced(source, "100");
			// @ts-expect-error maxWait must resolve to a number
			signalDebounced(source, 100, { maxWait: "100" });
			// @ts-expect-error rejectOnCancel is not exposed because no promise is returned
			signalDebounced(source, 100, { rejectOnCancel: true });
		});
	});

	it("types throttled signals", () => {
		typeOnly(() => {
			const source = signal(0);
			const readonlySource = readonly(source);
			const computedSource = computed(() => source.value * 2);
			const delay: MaybeValue<number> = computed(() => 100);
			const fromRaw = signalThrottled(0, delay);
			const fromWritable = signalThrottled(source, delay, true, true);
			const fromReadonly = signalThrottled(readonlySource, signal(100));
			const fromComputed = signalThrottled(computedSource, () => 50);
			const fromGetter = signalThrottled(() => source.value, 100);

			expectTypeOf(fromRaw).toEqualTypeOf<SignalThrottledReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<SignalThrottledReturn<number>>();
			expectTypeOf(fromWritable).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromReadonly).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fromComputed.value).toEqualTypeOf<number>();
			expectTypeOf(fromGetter.value).toEqualTypeOf<number>();

			// @ts-expect-error returned value is readonly
			fromWritable.value = 1;
			// @ts-expect-error ms must resolve to a number
			signalThrottled(source, "100");
			// @ts-expect-error trailing must be boolean
			signalThrottled(source, 100, "true");
			// @ts-expect-error leading must be boolean
			signalThrottled(source, 100, true, "true");
		});
	});

	it("narrows defined values", () => {
		typeOnly(() => {
			const raw = "ready" as string | null | undefined;
			const count = signal<number | undefined>(1);
			const readonlyCount = readonly(count);
			const doubled = computed((): number | null => count.value ?? null);
			const zeroArgFunction = (() => "ready") as
				| (() => string | undefined)
				| undefined;
			const functionValue = ((_input: string): string => "ready") as
				| ((input: string) => string)
				| undefined;
			const factory = signal((): string => "ready");

			expectTypeOf(isDefined(raw)).toEqualTypeOf<IsDefinedReturn>();
			expectTypeOf(isDefined(zeroArgFunction)).toEqualTypeOf<IsDefinedReturn>();

			if (isDefined(raw)) {
				expectTypeOf(raw).toEqualTypeOf<string>();
			}
			if (isDefined(count)) {
				expectTypeOf(count.value).toEqualTypeOf<number>();
				count.value = 2;
			}
			if (isDefined(readonlyCount)) {
				expectTypeOf(readonlyCount.value).toEqualTypeOf<number>();
			}
			if (isDefined(doubled)) {
				expectTypeOf(doubled.value).toEqualTypeOf<number>();
			}
			if (isDefined(zeroArgFunction)) {
				expectTypeOf(zeroArgFunction).toEqualTypeOf<() => string | undefined>();
			}
			// @ts-expect-error function values must be wrapped to avoid getter handling
			isDefined(functionValue);
			if (isDefined(factory)) {
				expectTypeOf(factory.value).toEqualTypeOf<() => string>();
			}
		});
	});

	it("types destructurable objects and tuples", () => {
		typeOnly(() => {
			const foo = { name: "foo" };
			const bar: number = 1024;
			const result = makeDestructurable(
				{ bar, foo } as const,
				[foo, bar] as const,
			);
			const { bar: objectBar, foo: objectFoo } = result;
			const [arrayFoo, arrayBar] = result;

			expectTypeOf(objectFoo).toEqualTypeOf<{ name: string }>();
			expectTypeOf(objectBar).toEqualTypeOf<number>();
			expectTypeOf(arrayFoo).toEqualTypeOf<{ name: string }>();
			expectTypeOf(arrayBar).toEqualTypeOf<number>();
			expectTypeOf(result.length).toEqualTypeOf<2>();
		});
	});

	it("infers window event payloads when the target is omitted", () => {
		const listener = useEventListener("resize", (event) => {
			expectTypeOf(event).toEqualTypeOf<UIEvent>();
		});

		listener.stop();
	});

	it("accepts multiple window event names", () => {
		const events: Arrayable<"resize" | "scroll"> = ["resize", "scroll"];

		const listener = useEventListener(events, (event) => {
			expectTypeOf(event).toEqualTypeOf<UIEvent | Event>();
		});

		listener.stop();
	});

	it("preserves DOM event payload types", () => {
		const button = document.createElement("button");

		const listener = useEventListener(button, "click", (event) => {
			expectTypeOf(event).toEqualTypeOf<PointerEvent>();
		});

		listener.stop();
	});

	it("preserves DOM event payload types with array inputs", () => {
		const button = document.createElement("button");

		const listener = useEventListener(
			[button],
			["click"],
			[
				(event) => {
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
			],
		);

		listener.stop();
	});

	it("narrows onClickOutside controls return", () => {
		const target = document.createElement("div");
		const controlsOptions: OnClickOutsideOptions<true> = {
			controls: true,
			ignore: [() => document.body, ".ignored"],
		};
		const controls = onClickOutside(
			target,
			(event) => {
				expectTypeOf(event).toMatchTypeOf<Event>();
			},
			controlsOptions,
		);
		const stop = onClickOutside(target, () => {});

		controls.cancel();
		controls.trigger(new Event("click"));
		controls.stop();
		stop();
	});

	it("types onElementRemoval targets and options", () => {
		const host = document.createElement("div");
		const shadowRoot = host.attachShadow({ mode: "open" });
		const mutationWindow = new EventTarget() as MutationWindow;
		Object.defineProperties(mutationWindow, {
			document: { value: document },
			label: { value: "test" },
			MutationObserver: { value: MutationObserver },
		});
		const documentTarget = shadowRoot;
		expectTypeOf(documentTarget).toMatchTypeOf<OnElementRemovalDocumentLike>();
		const options: OnElementRemovalOptions<MutationWindow, ShadowRoot> = {
			document: signal(documentTarget),
			flush: "sync",
			window: signal(mutationWindow),
		};
		const target = signal<Element | null>(document.createElement("div"));
		const stop = onElementRemoval(
			target,
			(mutationRecords) => {
				expectTypeOf(mutationRecords).toEqualTypeOf<MutationRecord[]>();
			},
			options,
		);

		expectTypeOf(stop).toEqualTypeOf<OnElementRemovalReturn>();
		stop();
	});

	it("types keyboard stroke handlers and options", () => {
		typeOnly(() => {
			const target = signal<EventTarget | null>(new EventTarget());
			const dedupe = signal(true);
			const eventName: KeyStrokeEventName = "keyup";
			const filter: KeyFilter = ["Enter", "Escape"];
			const predicate: KeyPredicate = (event) => event.key === "Enter";
			const handler: OnKeyStrokeHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
			};
			const options: OnKeyStrokeOptions<EventTarget> = {
				dedupe,
				eventName,
				passive: true,
				target,
			};

			const stopByFilter = onKeyStroke(filter, handler, options);
			const stopByPredicate = onKeyStroke(predicate, handler, options);
			const stopByHandler = onKeyStroke(handler, options);
			const stopDown = onKeyDown("Enter", handler, options);
			const stopPressed = onKeyPressed("Enter", handler, options);
			const stopUp = onKeyUp("Enter", handler, options);

			expectTypeOf(stopByFilter).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopByPredicate).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopByHandler).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopDown).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopPressed).toEqualTypeOf<OnKeyStrokeReturn>();
			expectTypeOf(stopUp).toEqualTypeOf<OnKeyStrokeReturn>();
			// @ts-expect-error keyboard stroke event names are limited
			onKeyStroke("Enter", handler, { eventName: "click" });
		});
	});

	it("types key modifier state", () => {
		typeOnly(() => {
			const documentTarget = Object.assign(new EventTarget(), {
				label: "document",
			}) as KeyModifierDocument;
			const modifier: UseKeyModifier = "CapsLock";
			const eventName: UseKeyModifierEventName = "keydown";
			const options: UseKeyModifierOptions<false, KeyModifierDocument> = {
				document: signal(documentTarget),
				events: [eventName, "keyup"],
				initial: false,
			};
			const nullableModifier = useKeyModifier(modifier, {
				document: signal(documentTarget),
			});
			const booleanModifier = useKeyModifier("Shift", options);
			const nullableReturn: UseKeyModifierReturn = nullableModifier;
			const booleanReturn: UseKeyModifierReturn<false> = booleanModifier;

			expectTypeOf(nullableReturn.value).toEqualTypeOf<boolean | null>();
			expectTypeOf(booleanReturn.value).toEqualTypeOf<boolean>();
			expectTypeOf(nullableModifier.stop()).toEqualTypeOf<void>();
			expectTypeOf(booleanModifier.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error modifier is readonly
				nullableModifier.value = true;
				// @ts-expect-error modifier names are limited
				useKeyModifier("Hyper");
				useKeyModifier("Shift", {
					// @ts-expect-error event names must be document event names
					events: ["unknown-event"],
				});
				useKeyModifier("Shift", {
					// @ts-expect-error initial must be boolean or null
					initial: "false",
				});
			});
		});
	});

	it("types last changed timestamps", () => {
		typeOnly(() => {
			const source = signal(0);
			const readonlySource = readonly(source);
			const options: UseLastChangedOptions<false, null> = {
				deep: true,
				flush: "sync",
				initialValue: null,
			};
			const initialOptions: UseLastChangedOptions<boolean, number> & {
				initialValue: number;
			} = {
				initialValue: 123,
			};
			const immediateValue: boolean = false;
			const dynamicInitial: number | null = null;
			const nullable = useLastChanged(source);
			const getterResult = useLastChanged(() => source.value, options);
			const readonlyResult = useLastChanged(readonlySource, initialOptions);
			const immediate = useLastChanged(source, {
				immediate: true,
				initialValue: null,
			});
			const syncResult = useLastChanged(source, {
				flush: "sync",
			});
			const nullInitialResult = useLastChanged(source, {
				initialValue: null,
			});
			const dynamicInitialResult = useLastChanged(source, {
				initialValue: dynamicInitial,
			});
			const maybeImmediate = useLastChanged(source, {
				immediate: immediateValue,
			});
			const nullableReturn: UseLastChangedReturn = nullable;
			const numberReturn: UseLastChangedReturn<boolean, number> =
				readonlyResult;

			expectTypeOf(nullable).toEqualTypeOf<ReadonlySignal<number | null>>();
			expectTypeOf(getterResult).toEqualTypeOf<ReadonlySignal<number | null>>();
			expectTypeOf(readonlyResult).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(immediate).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(syncResult).toEqualTypeOf<ReadonlySignal<number | null>>();
			expectTypeOf(nullInitialResult).toEqualTypeOf<
				ReadonlySignal<number | null>
			>();
			expectTypeOf(dynamicInitialResult).toEqualTypeOf<
				ReadonlySignal<number | null>
			>();
			expectTypeOf(maybeImmediate).toEqualTypeOf<
				ReadonlySignal<number | null>
			>();
			expectTypeOf(nullableReturn.value).toEqualTypeOf<number | null>();
			expectTypeOf(numberReturn.value).toEqualTypeOf<number>();

			typeOnly(() => {
				// @ts-expect-error returned timestamp is readonly
				nullable.value = 123;
				// @ts-expect-error source must be reactive or a getter
				useLastChanged(1);
				const invalidOptions: UseLastChangedOptions = {
					// @ts-expect-error initialValue must be a timestamp or null
					initialValue: "now",
				};
				expectTypeOf(invalidOptions).toEqualTypeOf<UseLastChangedOptions>();
			});
		});
	});

	it("types magic keys", () => {
		typeOnly(() => {
			const target = new EventTarget();
			const windowTarget = Object.assign(new EventTarget(), {
				label: "window",
			}) as MagicKeysWindow;
			const options: UseMagicKeysOptions<false, EventTarget, MagicKeysWindow> =
				{
					aliasMap: {
						cool: "space",
					},
					onEventFired(event) {
						expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
					},
					passive: false,
					target: signal(target),
					window: signal(windowTarget),
				};
			const keys = useMagicKeys(options);
			const reactiveKeys = useMagicKeys({ reactive: true, target });
			const returnValue: UseMagicKeysReturn = keys;
			const reactiveReturn: UseMagicKeysReturn<true> = reactiveKeys;
			const internal: MagicKeysInternal = keys;

			expectTypeOf(DefaultMagicKeysAliasMap).toEqualTypeOf<
				Readonly<Record<string, string>>
			>();
			expectTypeOf(keys.a).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(keys.ctrl_shift_a).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(keys.current).toEqualTypeOf<
				ReadonlySignal<ReadonlySet<string>>
			>();
			expectTypeOf(keys.stop()).toEqualTypeOf<void>();
			expectTypeOf(reactiveKeys.a).toEqualTypeOf<boolean>();
			expectTypeOf(reactiveKeys.current).toEqualTypeOf<ReadonlySet<string>>();
			expectTypeOf(returnValue).toEqualTypeOf<UseMagicKeysReturn>();
			expectTypeOf(reactiveReturn).toEqualTypeOf<UseMagicKeysReturn<true>>();
			expectTypeOf(internal.current).toEqualTypeOf<
				ReadonlySignal<ReadonlySet<string>>
			>();

			typeOnly(() => {
				// @ts-expect-error key state is readonly
				keys.a.value = true;
				// @ts-expect-error passive must be a boolean
				useMagicKeys({ passive: "false" });
				useMagicKeys({
					// @ts-expect-error target must be an EventTarget
					target: {},
				});
				useMagicKeys({
					// @ts-expect-error window must be an EventTarget-compatible object
					window: {},
				});
			});
		});
	});

	it("types media controls", () => {
		typeOnly(() => {
			const video = document.createElement("video");
			const documentTarget = Object.assign(document, {
				label: "document",
			}) as MediaControlsDocument;
			const source: UseMediaControlsSource = {
				media: "(min-width: 1px)",
				src: "video.mp4",
				type: "video/mp4",
			};
			const trackSource: UseMediaControlsTextTrackSource = {
				default: true,
				kind: "subtitles",
				label: "English",
				src: "subtitles.vtt",
				srcLang: "en",
			};
			const options: UseMediaControlsOptions<MediaControlsDocument> = {
				document: signal(documentTarget),
				src: signal([source]),
				tracks: signal([trackSource]),
			};
			const controls = useMediaControls(
				signal<HTMLMediaElement | null>(video),
				options,
			);
			const returnValue: UseMediaControlsReturn = controls;
			const textTrack: UseMediaControlsTextTrack = {
				activeCues: null,
				cues: null,
				id: 0,
				inBandMetadataTrackDispatchType: "",
				kind: "subtitles",
				label: "English",
				language: "en",
				mode: "disabled",
			};

			expectTypeOf(returnValue).toEqualTypeOf<UseMediaControlsReturn>();
			expectTypeOf(controls.currentTime).toEqualTypeOf<Computed<number>>();
			expectTypeOf(controls.playing).toEqualTypeOf<Computed<boolean>>();
			expectTypeOf(controls.volume).toEqualTypeOf<Computed<number>>();
			expectTypeOf(controls.muted).toEqualTypeOf<Computed<boolean>>();
			expectTypeOf(controls.rate).toEqualTypeOf<Computed<number>>();
			expectTypeOf(controls.duration).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(controls.buffered.value).toEqualTypeOf<[number, number][]>();
			expectTypeOf(controls.tracks.value).toEqualTypeOf<
				UseMediaControlsTextTrack[]
			>();
			expectTypeOf(controls.selectedTrack.value).toEqualTypeOf<number>();
			expectTypeOf(
				controls.supportsPictureInPicture.value,
			).toEqualTypeOf<boolean>();
			expectTypeOf(controls.isPictureInPicture.value).toEqualTypeOf<boolean>();
			expectTypeOf(controls.onSourceError).toEqualTypeOf<EventHookOn<Event>>();
			expectTypeOf(controls.onPlaybackError).toEqualTypeOf<
				EventHookOn<unknown>
			>();
			expectTypeOf(controls.togglePictureInPicture()).toEqualTypeOf<
				Promise<PictureInPictureWindow | void>
			>();
			expectTypeOf(controls.enableTrack(textTrack)).toEqualTypeOf<void>();
			expectTypeOf(controls.disableTrack(0)).toEqualTypeOf<void>();
			expectTypeOf(controls.stop()).toEqualTypeOf<void>();

			controls.currentTime.value = 10;
			controls.playing.value = true;
			controls.volume.value = 0.5;
			controls.muted.value = true;
			controls.rate.value = 1.25;

			typeOnly(() => {
				// @ts-expect-error duration is readonly
				controls.duration.value = 10;
				// @ts-expect-error tracks is readonly
				controls.tracks.value = [];
				// @ts-expect-error source objects require src
				const invalidSource: UseMediaControlsSource = { type: "video/mp4" };
				expectTypeOf(invalidSource).toEqualTypeOf<UseMediaControlsSource>();
				const invalidTrack: UseMediaControlsTextTrackSource = {
					kind: "subtitles",
					label: "English",
					src: "subtitles.vtt",
					// @ts-expect-error text track sources require srcLang
					srclang: "en",
				};
				expectTypeOf(
					invalidTrack,
				).toEqualTypeOf<UseMediaControlsTextTrackSource>();
			});
		});
	});

	it("types memoized functions", () => {
		typeOnly(() => {
			const cacheKey: UseMemoizeCacheKey = "1";
			const stringMemo = useMemoize((id: number) => `user-${id}`);
			const emptyOptionsMemo = useMemoize((id: number) => `user-${id}`, {});
			const stringReturn: UseMemoizeReturn<string, [number], string> =
				stringMemo;
			const numberCache: UseMemoizeCache<number, string> = new Map<
				number,
				string
			>();
			const options: UseMemoizeOptions<string, [number, string], number> = {
				cache: numberCache,
				getKey: (id) => id,
			};
			const numberMemo = useMemoize(
				(id: number, scope: string) => `${scope}-${id}`,
				options,
			);
			const promiseMemo = useMemoize(async (id: number) => ({ id }));

			expectTypeOf<UseMemoizeCacheKey>().toEqualTypeOf<string | number>();
			expectTypeOf(cacheKey).toEqualTypeOf<string>();
			expectTypeOf(stringReturn).toEqualTypeOf<
				UseMemoizeReturn<string, [number], string>
			>();
			expectTypeOf(stringMemo(1)).toEqualTypeOf<string>();
			expectTypeOf(stringMemo.load(1)).toEqualTypeOf<string>();
			expectTypeOf(stringMemo.generateKey(1)).toEqualTypeOf<string>();
			expectTypeOf(stringMemo.cache).toEqualTypeOf<
				UseMemoizeCache<string, string>
			>();
			expectTypeOf(emptyOptionsMemo).toEqualTypeOf<
				UseMemoizeReturn<string, [number], string>
			>();
			expectTypeOf(numberMemo).toEqualTypeOf<
				UseMemoizeReturn<string, [number, string], number>
			>();
			expectTypeOf(numberMemo.generateKey(1, "admin")).toEqualTypeOf<number>();
			expectTypeOf(numberMemo.cache).toEqualTypeOf<
				UseMemoizeCache<number, string>
			>();
			expectTypeOf(promiseMemo(1)).toEqualTypeOf<Promise<{ id: number }>>();

			typeOnly(() => {
				// @ts-expect-error memoized arguments must match the resolver
				stringMemo("1");
				// @ts-expect-error default cache key is a string
				stringMemo.cache.set(1, "value");
				const invalidOptions: UseMemoizeOptions<string, [number], number> = {
					// @ts-expect-error getKey must return the configured key type
					getKey: () => "1",
				};
				expectTypeOf(invalidOptions).toEqualTypeOf<
					UseMemoizeOptions<string, [number], number>
				>();
				// @ts-expect-error non-string cache keys require getKey
				useMemoize((id: number) => `user-${id}`, { cache: numberCache });
			});
		});
	});

	it("types memory polling controls and injectable window", () => {
		typeOnly(() => {
			const memoryInfo: UseMemoryInfo = {
				jsHeapSizeLimit: 1000,
				totalJSHeapSize: 200,
				usedJSHeapSize: 100,
			};
			const performanceTarget: MemoryPerformance = {
				label: "performance",
				memory: memoryInfo,
			};
			const memoryWindow = Object.assign(new EventTarget(), {
				label: "memory",
				performance: performanceTarget,
			}) as MemoryWindow;
			const options: UseMemoryOptions<MemoryWindow> = {
				immediate: false,
				immediateCallback: true,
				interval: signal(500),
				window: signal(memoryWindow),
			};
			const memory = useMemory(options);
			const memoryReturn: UseMemoryReturn = memory;

			expectTypeOf(memoryInfo).toEqualTypeOf<UseMemoryInfo>();
			expectTypeOf(memoryReturn).toEqualTypeOf<UseMemoryReturn>();
			expectTypeOf(memory.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(memory.memory).toEqualTypeOf<
				ReadonlySignal<UseMemoryInfo | undefined>
			>();
			expectTypeOf(memory.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(memory.pause()).toEqualTypeOf<void>();
			expectTypeOf(memory.resume()).toEqualTypeOf<void>();
			expectTypeOf(memory.stop()).toEqualTypeOf<void>();

			typeOnly(() => {
				// @ts-expect-error returned memory is readonly
				memory.memory.value = undefined;
				useMemory({
					// @ts-expect-error interval must be numeric
					interval: "1000",
				});
				useMemory({
					// @ts-expect-error window must be EventTarget-like
					window: { performance: performanceTarget },
				});
			});
		});
	});

	it("types mounted state", () => {
		typeOnly(() => {
			const mounted = useMounted();
			const mountedReturn: UseMountedReturn = mounted;

			expectTypeOf(mounted).toEqualTypeOf<UseMountedReturn>();
			expectTypeOf(mountedReturn).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(mounted.value).toEqualTypeOf<boolean>();

			typeOnly(() => {
				// @ts-expect-error mounted state is readonly
				mounted.value = true;
			});
		});
	});

	it("types supported state", () => {
		typeOnly(() => {
			const supported = useSupported(() => true);
			const supportedByString = useSupported(() => "supported");
			const supportedByNumber = useSupported(() => 1);
			const supportedReturn: UseSupportedReturn = supported;

			expectTypeOf(supported).toEqualTypeOf<UseSupportedReturn>();
			expectTypeOf(supportedByString).toEqualTypeOf<UseSupportedReturn>();
			expectTypeOf(supportedByNumber).toEqualTypeOf<UseSupportedReturn>();
			expectTypeOf(supportedReturn).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(supported.value).toEqualTypeOf<boolean>();

			typeOnly(() => {
				// @ts-expect-error supported state is readonly
				supported.value = false;
				// @ts-expect-error callback is required
				useSupported();
				// @ts-expect-error callback must be a function
				useSupported(true);
				// @ts-expect-error callback must not require arguments
				useSupported((value: string) => value);
			});
		});
	});

	it("types text direction controls", () => {
		typeOnly(() => {
			const textDirectionDocument = Object.assign(new EventTarget(), {
				defaultView: null,
				querySelector: (_selectors: string) => document.documentElement,
			}) as UseTextDirectionDocumentLike;
			const textDirectionValue: UseTextDirectionValue = "auto";
			const textDirectionOptions: UseTextDirectionOptions<
				typeof textDirectionDocument
			> = {
				document: signal(textDirectionDocument),
				initialValue: computed(() => "rtl" as const),
				observe: signal(true),
				selector: () => "body",
			};
			const textDirection = useTextDirection(textDirectionOptions);
			const textDirectionReturn: UseTextDirectionReturn = textDirection;

			expectTypeOf(textDirectionValue).toMatchTypeOf<UseTextDirectionValue>();
			expectTypeOf(textDirection).toEqualTypeOf<UseTextDirectionReturn>();
			expectTypeOf(
				textDirectionReturn.value,
			).toEqualTypeOf<UseTextDirectionValue>();
			expectTypeOf(textDirection.stop()).toEqualTypeOf<void>();
			textDirection.value = textDirectionValue;
			useTextDirection({ document: null, initialValue: "ltr" });

			typeOnly(() => {
				// @ts-expect-error direction must be a known text direction
				const invalidTextDirection: UseTextDirectionValue = "vertical";
				invalidTextDirection;
				useTextDirection({
					// @ts-expect-error initialValue must be a known text direction
					initialValue: "vertical",
				});
				useTextDirection({
					// @ts-expect-error selector must be a string
					selector: 1,
				});
				useTextDirection({
					// @ts-expect-error observe must be boolean
					observe: "true",
				});
				useTextDirection({
					// @ts-expect-error document must be document-like or nullish
					document: 1,
				});
			});
		});
	});

	it("types text selection controls", () => {
		typeOnly(() => {
			const textSelectionDocument =
				new EventTarget() as UseTextSelectionDocumentLike;
			const textSelectionWindow = Object.assign(new EventTarget(), {
				document: textSelectionDocument,
				getSelection: () => null,
			}) as UseTextSelectionWindowLike;
			const textSelectionOptions: UseTextSelectionOptions<
				typeof textSelectionWindow
			> = {
				window: signal(textSelectionWindow),
			};
			const textSelection = useTextSelection(textSelectionOptions);
			const textSelectionReturn: UseTextSelectionReturn = textSelection;

			expectTypeOf(textSelection).toEqualTypeOf<UseTextSelectionReturn>();
			expectTypeOf(textSelectionReturn.text).toEqualTypeOf<Computed<string>>();
			expectTypeOf(textSelection.rects).toEqualTypeOf<Computed<DOMRect[]>>();
			expectTypeOf(textSelection.ranges).toEqualTypeOf<Computed<Range[]>>();
			expectTypeOf(textSelection.selection).toEqualTypeOf<
				ReadonlySignal<Selection | null>
			>();
			expectTypeOf(textSelection.stop()).toEqualTypeOf<void>();
			useTextSelection({ window: null });

			typeOnly(() => {
				// @ts-expect-error selection state is readonly
				textSelection.selection.value = null;
				useTextSelection({
					// @ts-expect-error window must be window-like or nullish
					window: 1,
				});
			});
		});
	});

	it("types textarea autosize controls", () => {
		typeOnly(() => {
			const textarea = document.createElement("textarea");
			const styleTarget = document.createElement("div");
			const textareaWindow = Object.assign(new EventTarget(), {
				ResizeObserver,
				cancelAnimationFrame: (_handle: number) => {},
				document,
				requestAnimationFrame: (_callback: FrameRequestCallback) => 1,
			}) as UseTextareaAutosizeWindowLike;
			const styleProp: UseTextareaAutosizeStyleProp = "minHeight";
			const watchSource = signal(0);
			const watchSources: UseTextareaAutosizeWatchSource = [watchSource];
			const textareaOptions: UseTextareaAutosizeOptions<
				typeof textarea,
				typeof styleTarget,
				typeof textareaWindow
			> = {
				element: signal<HTMLTextAreaElement | null>(textarea),
				input: signal("value"),
				maxHeight: 120,
				onResize: () => {},
				styleProp,
				styleTarget,
				watch: watchSources,
				window: signal(textareaWindow),
			};
			const autosize = useTextareaAutosize(textareaOptions);
			const autosizeReturn: UseTextareaAutosizeReturn = autosize;

			expectTypeOf(autosize).toEqualTypeOf<
				UseTextareaAutosizeReturn<HTMLTextAreaElement>
			>();
			expectTypeOf(autosizeReturn.textarea).toEqualTypeOf<
				Signal<HTMLTextAreaElement | null | undefined>
			>();
			expectTypeOf(autosize.input).toEqualTypeOf<Signal<string>>();
			expectTypeOf(autosize.triggerResize()).toEqualTypeOf<void>();
			expectTypeOf(autosize.stop()).toEqualTypeOf<void>();
			useTextareaAutosize({ window: null });

			typeOnly(() => {
				useTextareaAutosize({
					// @ts-expect-error element must be textarea-like or nullish
					element: document.createElement("div"),
				});
				useTextareaAutosize({
					// @ts-expect-error styleProp must be height or minHeight
					styleProp: "width",
				});
				useTextareaAutosize({
					// @ts-expect-error maxHeight must be a number
					maxHeight: "120",
				});
				useTextareaAutosize({
					// @ts-expect-error window must be window-like or nullish
					window: 1,
				});
			});
		});
	});

	it("types long press targets and options", () => {
		typeOnly(() => {
			const target = signal<Element | null>(document.createElement("button"));
			const modifiers: OnLongPressModifiers = {
				capture: true,
				once: true,
				prevent: true,
				self: true,
				stop: true,
			};
			const delay: OnLongPressDelay = (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				return 500;
			};
			const handler: OnLongPressHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
			};
			const options: OnLongPressOptions = {
				delay,
				distanceThreshold: false,
				modifiers,
				onMouseUp(duration, distance, isLongPress, event) {
					expectTypeOf(duration).toEqualTypeOf<number>();
					expectTypeOf(distance).toEqualTypeOf<number>();
					expectTypeOf(isLongPress).toEqualTypeOf<boolean>();
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
			};
			const stop = onLongPress(target, handler, options);

			expectTypeOf(stop).toEqualTypeOf<OnLongPressReturn>();
			stop();
			// @ts-expect-error onLongPress targets must be elements
			onLongPress(new EventTarget(), handler);
		});
	});

	it("types start typing handlers and options", () => {
		typeOnly(() => {
			const documentTarget = signal<Document | null>(document);
			const options: OnStartTypingOptions<Document> = {
				document: documentTarget,
			};
			const handler: OnStartTypingHandler = (event) => {
				expectTypeOf(event).toEqualTypeOf<KeyboardEvent>();
			};
			const stop = onStartTyping(handler, options);

			expectTypeOf(document).toMatchTypeOf<OnStartTypingDocumentLike>();
			expectTypeOf(stop).toEqualTypeOf<OnStartTypingReturn>();
			stop();
		});
	});

	it("accepts lightweight matchMedia windows", () => {
		const queryList = new EventTarget() as MediaQueryList;
		Object.defineProperties(queryList, {
			matches: { value: true, writable: true },
			media: { value: "(min-width: 1px)" },
			onchange: { value: null, writable: true },
		});

		const customWindow = {
			label: "test",
			matchMedia: (_query: string) => queryList,
		} satisfies MatchMediaOnlyWindow;

		const options: UseMediaQueryOptions<MatchMediaOnlyWindow> = {
			ssrWidth: 1024,
			window: signal(customWindow),
		};

		const mediaQuery = useMediaQuery("(min-width: 768px)", options);

		mediaQuery.stop();
	});

	it("accepts lightweight CSS.supports windows", () => {
		typeOnly(() => {
			const css: CssSupportsLike = {
				supports(_first: string, _second?: string) {
					return true;
				},
			};
			const customWindow: CssSupportsOnlyWindow = Object.assign(
				new EventTarget(),
				{
					CSS: css,
					label: "test",
				},
			);
			const options: UseCssSupportsOptions<CssSupportsOnlyWindow> = {
				initialValue: false,
				window: signal<CssSupportsOnlyWindow>(customWindow),
			};
			const condition = useCssSupports(signal("display: flex"), options);
			const propValue = useCssSupports(
				() => "display",
				readonly(signal("grid")),
				options,
			);

			expectTypeOf(condition).toEqualTypeOf<UseCssSupportsReturn>();
			expectTypeOf(condition).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(propValue).toEqualTypeOf<UseCssSupportsReturn>();
			// @ts-expect-error CSS support signals are readonly
			condition.value = false;
			// @ts-expect-error condition text must be a string
			useCssSupports(1, options);
			// @ts-expect-error CSS property values must be strings
			useCssSupports("display", 1, options);
			const invalidOptions: UseCssSupportsOptions<CssSupportsOnlyWindow> = {
				// @ts-expect-error initialValue must be boolean
				initialValue: "true",
				window: customWindow,
			};
			invalidOptions;
		});
	});

	it("accepts lightweight CSS variable windows", () => {
		typeOnly(() => {
			const element = document.createElement("div");
			const customWindow = Object.assign(new EventTarget(), {
				document,
				getComputedStyle: (_element: Element) =>
					({
						getPropertyValue: (_property: string) => "",
					}) as CSSStyleDeclaration,
				label: "test",
				MutationObserver,
			}) satisfies CssVarOnlyWindow;
			const options: UseCssVarOptions<CssVarOnlyWindow> = {
				initialValue: "red",
				observe: true,
				window: signal(customWindow),
			};
			const variable = useCssVar(signal("--color"), signal(element), options);
			const nullable = useCssVar(() => null as string | null, null, options);

			expectTypeOf(variable).toEqualTypeOf<UseCssVarReturn>();
			expectTypeOf(variable.value).toEqualTypeOf<string | null | undefined>();
			variable.value = "blue";
			variable.value = null;
			variable.value = undefined;
			variable.stop();
			nullable.stop();
			// @ts-expect-error CSS variable names must be strings or nullish
			useCssVar(1, element, options);
			// @ts-expect-error targets must be elements or nullish
			useCssVar("--color", new EventTarget(), options);
			const invalidOptions: UseCssVarOptions<CssVarOnlyWindow> = {
				// @ts-expect-error initialValue must be string
				initialValue: 1,
				window: customWindow,
			};
			invalidOptions;
		});
	});

	it("preserves browser composable public types", () => {
		expectTypeOf(document).toMatchTypeOf<UseActiveElementDocumentLike>();
		expectTypeOf(window).toMatchTypeOf<UseActiveElementWindowLike>();
		const activeOptions: UseActiveElementOptions<
			UseActiveElementWindowLike,
			UseActiveElementDocumentLike
		> = {
			deep: true,
			document: signal(document),
			triggerOnRemoval: true,
			window: signal(window),
		};
		const active = useActiveElement<HTMLInputElement>(activeOptions);
		const defaultActive = useActiveElement();

		expectTypeOf(active).toEqualTypeOf<
			UseActiveElementReturn<HTMLInputElement>
		>();
		expectTypeOf(defaultActive).toEqualTypeOf<UseActiveElementReturn>();
		expectTypeOf(active.activeElement.value).toEqualTypeOf<
			HTMLInputElement | null | undefined
		>();
		expectTypeOf(defaultActive.activeElement.value).toEqualTypeOf<
			Element | null | undefined
		>();
		typeOnly(() => {
			// @ts-expect-error activeElement is readonly
			active.activeElement.value = document.createElement("input");
		});
		expectTypeOf(window).toMatchTypeOf<UseAnimateWindowLike>();
		const animateKeyframes: UseAnimateKeyframes = signal({
			opacity: [0, 1],
		});
		const animateOptions: UseAnimateOptions<UseAnimateWindowLike> = {
			commitStyles: true,
			duration: 100,
			immediate: false,
			persist: true,
			playbackRate: 2,
			window: signal(window),
		};
		const animated = useAnimate(
			document.body,
			animateKeyframes,
			animateOptions,
		);

		expectTypeOf(animated).toEqualTypeOf<UseAnimateReturn>();
		expectTypeOf(animated.isSupported.value).toEqualTypeOf<boolean>();
		expectTypeOf(animated.animate.value).toEqualTypeOf<Animation | undefined>();
		expectTypeOf(animated.pending.value).toEqualTypeOf<boolean>();
		expectTypeOf(animated.playState.value).toEqualTypeOf<AnimationPlayState>();
		expectTypeOf(
			animated.replaceState.value,
		).toEqualTypeOf<AnimationReplaceState>();
		expectTypeOf(animated.startTime).toEqualTypeOf<
			Computed<CSSNumberish | null>
		>();
		expectTypeOf(animated.currentTime).toEqualTypeOf<
			Computed<CSSNumberish | null>
		>();
		expectTypeOf(animated.timeline).toEqualTypeOf<
			Computed<AnimationTimeline | null>
		>();
		expectTypeOf(animated.playbackRate).toEqualTypeOf<Computed<number>>();
		typeOnly(() => {
			// @ts-expect-error playState is readonly
			animated.playState.value = "running";
		});

		const queryList = new EventTarget() as MediaQueryList;
		Object.defineProperties(queryList, {
			matches: { value: true, writable: true },
			media: { value: "(min-width: 1px)" },
			onchange: { value: null, writable: true },
		});

		const customWindow = {
			label: "test",
			matchMedia: (_query: string) => queryList,
		} satisfies MatchMediaOnlyWindow;
		const mediaOptions: UseBreakpointsOptions<MatchMediaOnlyWindow> = {
			ssrWidth: 1024,
			window: signal(customWindow),
		};
		const points = {
			md: signal("48rem"),
			sm: 640,
		} satisfies Breakpoints<"sm" | "md">;
		const breakpoints = useBreakpoints(points, mediaOptions);
		const preferredColorScheme = usePreferredColorScheme(mediaOptions);
		const preferredContrast = usePreferredContrast(mediaOptions);
		const preferredDark = usePreferredDark(mediaOptions);
		const preferredReducedMotion = usePreferredReducedMotion(mediaOptions);
		const preferredReducedTransparency =
			usePreferredReducedTransparency(mediaOptions);
		const colorStorage = {
			getItem: (_key: string) => null,
			removeItem: (_key: string) => {},
			setItem: (_key: string, _value: string) => {},
		};
		const colorWindow = new EventTarget() as ColorModeOnlyWindow;
		Object.defineProperties(colorWindow, {
			document: { value: document },
			getComputedStyle: {
				value: (_element: Element) => ({ opacity: "1" }) as CSSStyleDeclaration,
			},
			label: { value: "color-mode" },
			localStorage: { value: colorStorage },
		});
		const colorStorageSignal = signal<ColorModeSelection<"sepia"> | null>(
			"auto",
		);
		const colorOptions: UseColorModeOptions<"sepia"> = {
			attribute: "data-theme",
			document: signal(document as UseColorModeDocumentLike),
			initialValue: "auto",
			modes: {
				sepia: "theme-sepia",
			},
			onChanged: (mode, defaultHandler) => {
				expectTypeOf(mode).toEqualTypeOf<BasicColorMode | "sepia">();
				expectTypeOf(defaultHandler).toEqualTypeOf<
					UseColorModeDefaultHandler<"sepia">
				>();
				defaultHandler(mode);
			},
			selector: "html",
			storage: colorStorage,
			storageKey: "theme",
			storageSignal: colorStorageSignal,
			target: signal<Element | null>(document.documentElement),
			window: signal(colorWindow),
		};
		const colorMode = useColorMode<"sepia">(colorOptions);

		expectTypeOf(breakpoints.md.matches.value).toEqualTypeOf<boolean>();
		expectTypeOf(breakpoints.active().value).toEqualTypeOf<"sm" | "md" | "">();
		expectTypeOf(breakpoints.stop).toEqualTypeOf<() => void>();
		expectTypeOf(
			preferredColorScheme,
		).toEqualTypeOf<UsePreferredColorSchemeReturn>();
		expectTypeOf(
			preferredColorScheme.value,
		).toEqualTypeOf<UsePreferredColorScheme>();
		expectTypeOf<UsePreferredColorScheme>().toEqualTypeOf<
			"light" | "dark" | "no-preference"
		>();
		expectTypeOf(preferredColorScheme.stop).toEqualTypeOf<() => void>();
		expectTypeOf(preferredContrast).toEqualTypeOf<UsePreferredContrastReturn>();
		expectTypeOf(preferredContrast.value).toEqualTypeOf<UsePreferredContrast>();
		expectTypeOf(preferredContrast.stop).toEqualTypeOf<() => void>();
		expectTypeOf(preferredDark.matches.value).toEqualTypeOf<boolean>();
		expectTypeOf(
			preferredReducedMotion,
		).toEqualTypeOf<UsePreferredReducedMotionReturn>();
		expectTypeOf(
			preferredReducedMotion.value,
		).toEqualTypeOf<UsePreferredReducedMotion>();
		expectTypeOf(preferredReducedMotion.stop).toEqualTypeOf<() => void>();
		expectTypeOf(
			preferredReducedTransparency,
		).toEqualTypeOf<UsePreferredReducedTransparencyReturn>();
		expectTypeOf(
			preferredReducedTransparency.value,
		).toEqualTypeOf<UsePreferredReducedTransparency>();
		expectTypeOf(preferredReducedTransparency.stop).toEqualTypeOf<() => void>();
		expectTypeOf(colorMode).toEqualTypeOf<UseColorModeReturn<"sepia">>();
		expectTypeOf(colorMode.mode).toEqualTypeOf<
			Computed<ColorModeSelection<"sepia">>
		>();
		expectTypeOf(colorMode.mode.value).toEqualTypeOf<
			ColorModeSelection<"sepia">
		>();
		expectTypeOf(colorMode.system.value).toEqualTypeOf<BasicColorMode>();
		expectTypeOf(colorMode.resolvedMode.value).toEqualTypeOf<
			BasicColorMode | "sepia"
		>();
		colorMode.mode.value = "sepia";
		colorMode.mode.value = "auto";
		typeOnly(() => {
			// @ts-expect-error custom modes must be declared in the generic
			colorMode.mode.value = "dim";
			// @ts-expect-error system is readonly
			colorMode.system.value = "dark";
			// @ts-expect-error resolvedMode is readonly
			colorMode.resolvedMode.value = "dark";
		});
		const darkOptions: UseDarkOptions = {
			attribute: "data-theme",
			document: signal(document as UseColorModeDocumentLike),
			initialValue: "auto",
			onChanged: (isDark, defaultHandler, mode) => {
				expectTypeOf(isDark).toEqualTypeOf<boolean>();
				expectTypeOf(
					defaultHandler,
				).toEqualTypeOf<UseColorModeDefaultHandler>();
				expectTypeOf(mode).toEqualTypeOf<BasicColorMode>();
				defaultHandler(mode);
			},
			selector: "html",
			storage: colorStorage,
			storageKey: "theme",
			storageSignal: signal<ColorModeSelection | null>("auto"),
			target: signal<Element | null>(document.documentElement),
			valueDark: signal("theme-dark"),
			valueLight: "theme-light",
			window: signal(colorWindow),
		};
		const darkMode = useDark(darkOptions);

		expectTypeOf(darkMode).toEqualTypeOf<UseDarkReturn>();
		expectTypeOf(darkMode.value).toEqualTypeOf<boolean>();
		expectTypeOf(darkMode.stop).toEqualTypeOf<() => void>();
		darkMode.value = true;
		typeOnly(() => {
			// @ts-expect-error useDark only accepts boolean values
			darkMode.value = "dark";
			// @ts-expect-error custom modes are managed by valueDark and valueLight
			useDark({ modes: { dark: "theme-dark" } });
			// @ts-expect-error valueDark must resolve to a string
			useDark({ valueDark: 1 });
		});

		class TypedDeviceMotionEvent extends Event implements DeviceMotionEvent {
			acceleration: DeviceMotionEventAcceleration | null = null;
			accelerationIncludingGravity: DeviceMotionEventAcceleration | null = null;
			interval = 0;
			rotationRate: DeviceMotionEventRotationRate | null = null;
		}
		const deviceMotionPermission: DeviceMotionPermissionState = "granted";
		const DeviceMotionEventConstructor: DeviceMotionEventConstructorLike = class extends TypedDeviceMotionEvent {
			static requestPermission = () => Promise.resolve(deviceMotionPermission);
		};
		const motionWindow = new EventTarget() as UseDeviceMotionWindowLike;
		Object.defineProperty(motionWindow, "DeviceMotionEvent", {
			value: DeviceMotionEventConstructor,
		});
		const motionOptions: UseDeviceMotionOptions = {
			requestPermissions: signal(false),
			window: signal(motionWindow),
		};
		const motion = useDeviceMotion(motionOptions);
		const motionFallback = useDeviceMotion({ window: null });
		const motionReturn: UseDeviceMotionReturn = motion;

		expectTypeOf(motion).toEqualTypeOf<UseDeviceMotionReturn>();
		expectTypeOf(motionReturn.acceleration).toEqualTypeOf<
			ReadonlySignal<DeviceMotionEventAcceleration | null>
		>();
		expectTypeOf(motion.accelerationIncludingGravity).toEqualTypeOf<
			ReadonlySignal<DeviceMotionEventAcceleration | null>
		>();
		expectTypeOf(motion.rotationRate).toEqualTypeOf<
			ReadonlySignal<DeviceMotionEventRotationRate | null>
		>();
		expectTypeOf(motion.interval).toEqualTypeOf<ReadonlySignal<number>>();
		expectTypeOf(motion.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
		expectTypeOf(motion.requirePermissions).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(motion.permissionGranted).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(motion.ensurePermissions()).toEqualTypeOf<Promise<void>>();
		expectTypeOf(motion.stop()).toEqualTypeOf<void>();
		expectTypeOf(motionFallback).toEqualTypeOf<UseDeviceMotionReturn>();
		typeOnly(() => {
			// @ts-expect-error returned values are readonly signals
			motion.interval.value = 1;
			// @ts-expect-error requestPermissions must be boolean
			useDeviceMotion({ requestPermissions: "true" });
		});

		class TypedDeviceOrientationEvent
			extends Event
			implements DeviceOrientationEvent
		{
			absolute = false;
			alpha: number | null = null;
			beta: number | null = null;
			gamma: number | null = null;
		}
		const deviceOrientationPermission: DeviceOrientationPermissionState =
			"granted";
		const DeviceOrientationEventConstructor: DeviceOrientationEventConstructorLike = class extends TypedDeviceOrientationEvent {
			static requestPermission = (absolute?: boolean) =>
				Promise.resolve(deviceOrientationPermission);
		};
		const orientationWindow =
			new EventTarget() as UseDeviceOrientationWindowLike;
		Object.defineProperty(orientationWindow, "DeviceOrientationEvent", {
			value: DeviceOrientationEventConstructor,
		});
		const orientationOptions: UseDeviceOrientationOptions = {
			absolute: signal(true),
			requestPermissions: signal(false),
			window: signal(orientationWindow),
		};
		const orientation = useDeviceOrientation(orientationOptions);
		const orientationFallback = useDeviceOrientation({ window: null });
		const orientationReturn: UseDeviceOrientationReturn = orientation;

		expectTypeOf(orientation).toEqualTypeOf<UseDeviceOrientationReturn>();
		expectTypeOf(orientationReturn.isAbsolute).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(orientation.alpha).toEqualTypeOf<
			ReadonlySignal<number | null>
		>();
		expectTypeOf(orientation.beta).toEqualTypeOf<
			ReadonlySignal<number | null>
		>();
		expectTypeOf(orientation.gamma).toEqualTypeOf<
			ReadonlySignal<number | null>
		>();
		expectTypeOf(orientation.isSupported).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(orientation.requirePermissions).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(orientation.permissionGranted).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(orientation.ensurePermissions()).toEqualTypeOf<
			Promise<void>
		>();
		expectTypeOf(orientation.ensurePermissions(true)).toEqualTypeOf<
			Promise<void>
		>();
		expectTypeOf(orientation.stop()).toEqualTypeOf<void>();
		expectTypeOf(
			orientationFallback,
		).toEqualTypeOf<UseDeviceOrientationReturn>();
		typeOnly(() => {
			// @ts-expect-error returned values are readonly signals
			orientation.alpha.value = 1;
			// @ts-expect-error requestPermissions must be boolean
			useDeviceOrientation({ requestPermissions: "true" });
			// @ts-expect-error absolute must be boolean
			useDeviceOrientation({ absolute: "true" });
		});

		const pixelRatioQueryList = new EventTarget() as MediaQueryList;
		Object.defineProperty(pixelRatioQueryList, "matches", {
			value: true,
		});
		Object.defineProperty(pixelRatioQueryList, "media", {
			value: "(resolution: 2dppx)",
		});
		const pixelRatioWindow = new EventTarget() as DevicePixelRatioOnlyWindow;
		Object.defineProperty(pixelRatioWindow, "label", {
			value: "pixel-ratio",
		});
		Object.defineProperty(pixelRatioWindow, "devicePixelRatio", {
			value: 2,
		});
		Object.defineProperty(pixelRatioWindow, "matchMedia", {
			value: (_query: string) => pixelRatioQueryList,
		});
		const pixelRatioOptions: UseDevicePixelRatioOptions<DevicePixelRatioOnlyWindow> =
			{
				initialValue: 1,
				window: signal(pixelRatioWindow),
			};
		const pixelRatio = useDevicePixelRatio(pixelRatioOptions);
		const pixelRatioFallback = useDevicePixelRatio({ window: null });
		const pixelRatioReturn: UseDevicePixelRatioReturn = pixelRatio;

		expectTypeOf(pixelRatio).toEqualTypeOf<UseDevicePixelRatioReturn>();
		expectTypeOf(pixelRatioReturn.pixelRatio).toEqualTypeOf<
			ReadonlySignal<number>
		>();
		expectTypeOf(pixelRatio.stop()).toEqualTypeOf<void>();
		expectTypeOf(pixelRatioFallback).toEqualTypeOf<UseDevicePixelRatioReturn>();
		typeOnly(() => {
			// @ts-expect-error returned values are readonly signals
			pixelRatio.pixelRatio.value = 1;
			// @ts-expect-error initialValue must be a number
			useDevicePixelRatio({ initialValue: "1" });
		});

		typeOnly(() => {
			const permissionName: UseDevicesListPermissionName = "camera";
			const track: UseDevicesListMediaStreamTrackLike = {
				stop: () => {},
			};
			const stream: UseDevicesListMediaStreamLike = {
				getTracks: () => [track],
			};
			const mediaDevices = Object.assign(new EventTarget(), {
				enumerateDevices: () => Promise.resolve([] as MediaDeviceInfo[]),
				getUserMedia: (_constraints?: MediaStreamConstraints) =>
					Promise.resolve(stream),
			}) satisfies UseDevicesListMediaDevicesLike;
			const permissionStatus = Object.assign(new EventTarget(), {
				state: "granted" as PermissionState,
			}) satisfies UseDevicesListPermissionStatusLike;
			const permissions: UseDevicesListPermissionsLike = {
				query: ({ name }) => {
					expectTypeOf(name).toEqualTypeOf<UseDevicesListPermissionName>();
					return Promise.resolve(permissionStatus);
				},
			};
			const devicesNavigator: UseDevicesListNavigatorLike = {
				mediaDevices,
				permissions,
			};
			const devicesListOptions: UseDevicesListOptions<UseDevicesListNavigatorLike> =
				{
					constraints: signal({ audio: true, video: false }),
					navigator: signal(devicesNavigator),
					onUpdated: (devices) => {
						expectTypeOf(devices).toEqualTypeOf<readonly MediaDeviceInfo[]>();
					},
					requestPermissions: signal(false),
				};
			const devicesList = useDevicesList(devicesListOptions);
			const devicesListFallback = useDevicesList({ navigator: null });
			const devicesListReturn: UseDevicesListReturn = devicesList;

			expectTypeOf(
				permissionName,
			).toMatchTypeOf<UseDevicesListPermissionName>();
			expectTypeOf(devicesList).toEqualTypeOf<UseDevicesListReturn>();
			expectTypeOf(devicesListReturn.devices).toEqualTypeOf<
				ReadonlySignal<readonly MediaDeviceInfo[]>
			>();
			expectTypeOf(devicesList.videoInputs).toEqualTypeOf<
				ReadonlySignal<readonly MediaDeviceInfo[]>
			>();
			expectTypeOf(devicesList.audioInputs).toEqualTypeOf<
				ReadonlySignal<readonly MediaDeviceInfo[]>
			>();
			expectTypeOf(devicesList.audioOutputs).toEqualTypeOf<
				ReadonlySignal<readonly MediaDeviceInfo[]>
			>();
			expectTypeOf(devicesList.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(devicesList.permissionGranted).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(devicesList.ensurePermissions()).toEqualTypeOf<
				Promise<boolean>
			>();
			expectTypeOf(devicesList.stop()).toEqualTypeOf<void>();
			expectTypeOf(devicesListFallback).toEqualTypeOf<UseDevicesListReturn>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				devicesList.devices.value = [];
				// @ts-expect-error requestPermissions must be boolean
				useDevicesList({ requestPermissions: "true" });
				// @ts-expect-error audio constraints must be boolean or MediaTrackConstraints
				useDevicesList({ constraints: { audio: "true" } });
			});
		});

		typeOnly(() => {
			const displayTrack: UseDisplayMediaMediaStreamTrackLike =
				new EventTarget() as UseDisplayMediaMediaStreamTrackLike;
			displayTrack.stop = () => {};
			const displayStream: UseDisplayMediaMediaStreamLike = {
				getTracks: () => [displayTrack],
			};
			const displayMediaDevices = {
				getDisplayMedia: (_options?: DisplayMediaStreamOptions) =>
					Promise.resolve(displayStream),
			} satisfies UseDisplayMediaMediaDevicesLike<UseDisplayMediaMediaStreamLike>;
			const displayNavigator: UseDisplayMediaNavigatorLike<UseDisplayMediaMediaStreamLike> =
				{
					mediaDevices: displayMediaDevices,
				};
			const displayOptions: UseDisplayMediaOptions<
				UseDisplayMediaMediaStreamLike,
				UseDisplayMediaNavigatorLike<UseDisplayMediaMediaStreamLike>
			> = {
				constraints: signal({
					audio: true,
					video: { displaySurface: "browser" },
				}),
				enabled: signal(false),
				navigator: signal(displayNavigator),
			};
			const displayMedia = useDisplayMedia(displayOptions);
			const displayFallback = useDisplayMedia({ navigator: null });
			const displayReturn: UseDisplayMediaReturn<UseDisplayMediaMediaStreamLike> =
				displayMedia;

			expectTypeOf(displayMedia).toEqualTypeOf<
				UseDisplayMediaReturn<UseDisplayMediaMediaStreamLike>
			>();
			expectTypeOf(displayReturn.stream).toEqualTypeOf<
				ReadonlySignal<UseDisplayMediaMediaStreamLike | undefined>
			>();
			expectTypeOf(displayMedia.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(displayMedia.isStarting).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(displayMedia.isStreaming).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(displayMedia.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(displayMedia.start()).toEqualTypeOf<
				Promise<UseDisplayMediaMediaStreamLike | undefined>
			>();
			expectTypeOf(displayMedia.stop()).toEqualTypeOf<void>();
			expectTypeOf(displayFallback).toEqualTypeOf<UseDisplayMediaReturn>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				displayMedia.stream.value = displayStream;
				// @ts-expect-error enabled must be boolean
				useDisplayMedia({ enabled: "true" });
				// @ts-expect-error display media options must use valid option types
				useDisplayMedia({ constraints: { audio: "true" } });
			});
		});

		typeOnly(() => {
			const userTrack: UseUserMediaMediaStreamTrackLike =
				new EventTarget() as UseUserMediaMediaStreamTrackLike;
			userTrack.stop = () => {};
			const userStream: UseUserMediaMediaStreamLike = {
				getTracks: () => [userTrack],
			};
			const userMediaDevices = {
				getUserMedia: (_constraints?: MediaStreamConstraints) =>
					Promise.resolve(userStream),
			} satisfies UseUserMediaMediaDevicesLike<UseUserMediaMediaStreamLike>;
			const userNavigator: UseUserMediaNavigatorLike<UseUserMediaMediaStreamLike> =
				{
					mediaDevices: userMediaDevices,
				};
			const userOptions: UseUserMediaOptions<
				UseUserMediaMediaStreamLike,
				UseUserMediaNavigatorLike<UseUserMediaMediaStreamLike>
			> = {
				autoSwitch: signal(true),
				constraints: signal({
					audio: true,
					video: { facingMode: "user" },
				}),
				enabled: signal(false),
				navigator: signal(userNavigator),
			};
			const userMedia = useUserMedia(userOptions);
			const userFallback = useUserMedia({ navigator: null });
			const userReturn: UseUserMediaReturn<UseUserMediaMediaStreamLike> =
				userMedia;

			expectTypeOf(userMedia).toEqualTypeOf<
				UseUserMediaReturn<UseUserMediaMediaStreamLike>
			>();
			expectTypeOf(userReturn.stream).toEqualTypeOf<
				ReadonlySignal<UseUserMediaMediaStreamLike | undefined>
			>();
			expectTypeOf(userMedia.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(userMedia.isStarting).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(userMedia.isStreaming).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(userMedia.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(userMedia.enabled).toEqualTypeOf<Signal<boolean>>();
			expectTypeOf(userMedia.autoSwitch).toEqualTypeOf<Signal<boolean>>();
			expectTypeOf(userMedia.constraints).toEqualTypeOf<
				Signal<MediaStreamConstraints>
			>();
			expectTypeOf(userMedia.start()).toEqualTypeOf<
				Promise<UseUserMediaMediaStreamLike | undefined>
			>();
			expectTypeOf(userMedia.stop()).toEqualTypeOf<void>();
			expectTypeOf(userMedia.restart()).toEqualTypeOf<
				Promise<UseUserMediaMediaStreamLike | undefined>
			>();
			expectTypeOf(userFallback).toEqualTypeOf<UseUserMediaReturn>();
			userMedia.enabled.value = true;
			userMedia.autoSwitch.value = false;
			userMedia.constraints.value = { audio: false, video: true };
			typeOnly(() => {
				// @ts-expect-error returned stream is a readonly signal
				userMedia.stream.value = userStream;
				// @ts-expect-error enabled must be boolean
				useUserMedia({ enabled: "true" });
				// @ts-expect-error autoSwitch must be boolean
				useUserMedia({ autoSwitch: "true" });
				// @ts-expect-error user media options must use valid constraint types
				useUserMedia({ constraints: { audio: "true" } });
			});
		});

		typeOnly(() => {
			const vibrateNavigator: UseVibrateNavigatorLike = {
				vibrate: (_pattern: number | number[]) => true,
			};
			const vibratePattern: UseVibratePattern = [10, 20] as const;
			const vibrateScheduler: UseVibrateScheduler = (callback) =>
				useIntervalFn(callback, 100, {
					immediate: false,
					immediateCallback: false,
				});
			const vibrateOptions: UseVibrateOptions = {
				interval: signal(100),
				navigator: signal(vibrateNavigator),
				pattern: signal(vibratePattern),
				scheduler: vibrateScheduler,
			};
			const vibration = useVibrate(vibrateOptions);
			const fallbackVibration = useVibrate({ navigator: null });
			const vibrationReturn: UseVibrateReturn = vibration;

			expectTypeOf(vibration).toEqualTypeOf<UseVibrateReturn>();
			expectTypeOf(vibrationReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(vibration.pattern).toEqualTypeOf<
				Signal<UseVibratePattern>
			>();
			expectTypeOf(vibration.intervalControls).toEqualTypeOf<
				UseIntervalFnReturn | undefined
			>();
			expectTypeOf(vibration.vibrate()).toEqualTypeOf<void>();
			expectTypeOf(vibration.vibrate(10)).toEqualTypeOf<void>();
			expectTypeOf(vibration.vibrate([10, 20] as const)).toEqualTypeOf<void>();
			expectTypeOf(vibration.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallbackVibration).toEqualTypeOf<UseVibrateReturn>();
			vibration.pattern.value = 20;
			vibration.pattern.value = [20, 30] as const;
			typeOnly(() => {
				// @ts-expect-error isSupported is readonly
				vibration.isSupported.value = true;
				// @ts-expect-error pattern must be a number or number array
				useVibrate({ pattern: "100" });
				// @ts-expect-error interval must be numeric
				useVibrate({ interval: "100" });
				// @ts-expect-error navigator must expose a valid vibrate function
				useVibrate({ navigator: { vibrate: (_pattern: string) => true } });
				// @ts-expect-error scheduler must return interval controls
				useVibrate({ scheduler: () => ({}) });
			});
		});

		typeOnly(() => {
			const itemSize: UseVirtualListItemSize = (index) => index + 20;
			const virtualBaseOptions: UseVirtualListOptionsBase<ResizeObserverWindowLike> =
				{
					overscan: 2,
					window: null,
				};
			const verticalOptions: UseVirtualListVerticalOptions = {
				...virtualBaseOptions,
				itemHeight: itemSize,
			};
			const horizontalOptions: UseVirtualListHorizontalOptions = {
				itemWidth: 120,
				overscan: 1,
			};
			const options: UseVirtualListOptions = verticalOptions;
			const readonlySource = [1, 2, 3] as const;
			const source = signal<readonly number[]>(readonlySource);
			const virtual = useVirtualList(source, options);
			const getterVirtual = useVirtualList(
				() => source.value,
				horizontalOptions,
			);
			const plainVirtual = useVirtualList([1, 2, 3], { itemHeight: 20 });
			const virtualReturn: UseVirtualListReturn<number> = virtual;
			const item: UseVirtualListItem<number> = {
				data: 1,
				index: 0,
			};

			expectTypeOf(virtual).toEqualTypeOf<UseVirtualListReturn<number>>();
			expectTypeOf(virtualReturn.list).toEqualTypeOf<
				ReadonlySignal<readonly UseVirtualListItem<number>[]>
			>();
			expectTypeOf(virtual.containerRef).toEqualTypeOf<
				Signal<HTMLElement | null>
			>();
			expectTypeOf(virtual.containerStyle).toEqualTypeOf<string>();
			expectTypeOf(virtual.wrapperStyle).toEqualTypeOf<Computed<string>>();
			expectTypeOf(virtual.onScroll()).toEqualTypeOf<void>();
			expectTypeOf(virtual.onScroll(new Event("scroll"))).toEqualTypeOf<void>();
			expectTypeOf(virtual.scrollTo(1)).toEqualTypeOf<void>();
			expectTypeOf(virtual.measure()).toEqualTypeOf<void>();
			expectTypeOf(virtual.stop()).toEqualTypeOf<void>();
			expectTypeOf(getterVirtual).toEqualTypeOf<UseVirtualListReturn<number>>();
			expectTypeOf(plainVirtual).toEqualTypeOf<UseVirtualListReturn<number>>();
			expectTypeOf(item).toEqualTypeOf<UseVirtualListItem<number>>();
			virtual.containerRef.value = document.createElement("div");
			virtual.containerRef.value = null;
			typeOnly(() => {
				// @ts-expect-error list is readonly
				virtual.list.value = [];
				// @ts-expect-error virtual items are readonly
				item.index = 1;
				// @ts-expect-error itemHeight and itemWidth are mutually exclusive
				useVirtualList([1], { itemHeight: 20, itemWidth: 20 });
				// @ts-expect-error itemHeight is not a MaybeValue
				useVirtualList([1], { itemHeight: signal(20) });
				// @ts-expect-error one item size option is required
				useVirtualList([1], { overscan: 1 });
				// @ts-expect-error overscan must be numeric
				useVirtualList([1], { itemHeight: 20, overscan: "1" });
			});
		});

		typeOnly(() => {
			class TypeWakeLockSentinel
				extends EventTarget
				implements UseWakeLockSentinelLike
			{
				readonly released = false;
				readonly type: WakeLockType = "screen";

				async release() {}
			}
			const wakeLockApi = {
				request: (_type: WakeLockType) =>
					Promise.resolve(new TypeWakeLockSentinel()),
			} satisfies UseWakeLockWakeLockLike<TypeWakeLockSentinel>;
			const wakeLockNavigator: UseWakeLockNavigatorLike<TypeWakeLockSentinel> =
				{
					wakeLock: wakeLockApi,
				};
			const wakeLockDocument: UseWakeLockDocumentLike =
				new EventTarget() as UseWakeLockDocumentLike;
			const wakeLockOptions: UseWakeLockOptions<
				TypeWakeLockSentinel,
				UseWakeLockNavigatorLike<TypeWakeLockSentinel>,
				UseWakeLockDocumentLike
			> = {
				document: signal(wakeLockDocument),
				navigator: signal(wakeLockNavigator),
			};
			const wakeLock = useWakeLock(wakeLockOptions);
			const fallbackWakeLock = useWakeLock({ navigator: null });
			const wakeLockReturn: UseWakeLockReturn<TypeWakeLockSentinel> = wakeLock;

			expectTypeOf(wakeLock).toEqualTypeOf<
				UseWakeLockReturn<TypeWakeLockSentinel>
			>();
			expectTypeOf(wakeLockReturn.sentinel).toEqualTypeOf<
				ReadonlySignal<TypeWakeLockSentinel | null>
			>();
			expectTypeOf(wakeLock.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(wakeLock.isActive).toEqualTypeOf<Computed<boolean>>();
			expectTypeOf(wakeLock.request()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(wakeLock.request("screen")).toEqualTypeOf<Promise<void>>();
			expectTypeOf(wakeLock.forceRequest()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(wakeLock.forceRequest("screen")).toEqualTypeOf<
				Promise<void>
			>();
			expectTypeOf(wakeLock.release()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(wakeLock.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallbackWakeLock).toEqualTypeOf<UseWakeLockReturn>();
			typeOnly(() => {
				// @ts-expect-error sentinel is readonly
				wakeLock.sentinel.value = new TypeWakeLockSentinel();
				// @ts-expect-error only screen is currently supported
				wakeLock.request("system");
				// @ts-expect-error navigator must expose wakeLock.request
				useWakeLock({ navigator: { wakeLock: {} } });
				// @ts-expect-error sentinel must be an EventTarget-like object
				useWakeLock({ navigator: { wakeLock: { request: async () => ({}) } } });
			});
		});

		typeOnly(() => {
			class TypeWebNotification
				extends EventTarget
				implements UseWebNotificationNotificationLike
			{
				close() {}
			}
			const notificationConstructor = class extends TypeWebNotification {
				static readonly permission: NotificationPermission = "granted";
				static requestPermission(): Promise<NotificationPermission> {
					return Promise.resolve("granted");
				}

				constructor(
					readonly title: string,
					readonly options?: UseWebNotificationConstructorOptions,
				) {
					super();
				}
			} satisfies UseWebNotificationConstructorLike<TypeWebNotification>;
			const notificationWindow: UseWebNotificationWindowLike<TypeWebNotification> =
				Object.assign(new EventTarget(), {
					Notification: notificationConstructor,
				});
			const notificationOptions: UseWebNotificationOptions<
				TypeWebNotification,
				UseWebNotificationWindowLike<TypeWebNotification>
			> = {
				body: "body",
				requestPermissions: signal(false),
				title: "title",
				vibrate: [100, 50, 100] as const,
				window: signal(notificationWindow),
			};
			const notificationOverride: UseWebNotificationOptionsBase = {
				body: "override",
			};
			const webNotification = useWebNotification(notificationOptions);
			const fallbackWebNotification =
				useWebNotification<UseWebNotificationNotificationLike>({
					window: null,
				});
			const webNotificationReturn: UseWebNotificationReturn<TypeWebNotification> =
				webNotification;

			expectTypeOf(webNotification).toEqualTypeOf<
				UseWebNotificationReturn<TypeWebNotification>
			>();
			expectTypeOf(webNotificationReturn.notification).toEqualTypeOf<
				ReadonlySignal<TypeWebNotification | null>
			>();
			expectTypeOf(webNotification.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(webNotification.permissionGranted).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(webNotification.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(webNotification.ensurePermissions()).toEqualTypeOf<
				Promise<boolean>
			>();
			expectTypeOf(webNotification.show()).toEqualTypeOf<
				Promise<TypeWebNotification | undefined>
			>();
			expectTypeOf(webNotification.show(notificationOverride)).toEqualTypeOf<
				Promise<TypeWebNotification | undefined>
			>();
			expectTypeOf(webNotification.close()).toEqualTypeOf<void>();
			expectTypeOf(webNotification.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallbackWebNotification).toEqualTypeOf<
				UseWebNotificationReturn<UseWebNotificationNotificationLike>
			>();
			webNotification.onClick((event) => {
				expectTypeOf(event).toEqualTypeOf<Event>();
			});
			webNotification.onShow((event) => {
				expectTypeOf(event).toEqualTypeOf<Event>();
			});
			webNotification.onError((event) => {
				expectTypeOf(event).toEqualTypeOf<Event>();
			});
			webNotification.onClose((event) => {
				expectTypeOf(event).toEqualTypeOf<Event>();
			});
			typeOnly(() => {
				// @ts-expect-error notification is readonly
				webNotification.notification.value = new TypeWebNotification();
				useWebNotification({
					// @ts-expect-error window must expose a Notification constructor
					window: Object.assign(new EventTarget(), { Notification: {} }),
				});
				// @ts-expect-error requestPermissions must be boolean-like
				useWebNotification({ requestPermissions: "true" });
				// @ts-expect-error vibrate accepts a number or readonly numbers
				useWebNotification({ vibrate: ["100"] });
			});
		});

		typeOnly(() => {
			class TypeWebSocket extends EventTarget implements WebSocketLike {
				binaryType: BinaryType = "blob";
				readonly readyState = 0;

				close(_code?: number, _reason?: string) {}
				send(_data: UseWebSocketSendData) {}
			}
			const webSocketConstructor = class extends TypeWebSocket {
				static readonly CONNECTING = 0;
				static readonly OPEN = 1;
				static readonly CLOSING = 2;
				static readonly CLOSED = 3;

				constructor(
					readonly url: string | URL,
					readonly protocols?: string | readonly string[],
				) {
					super();
				}
			} satisfies WebSocketConstructorLike<TypeWebSocket>;
			const webSocketWindow: UseWebSocketWindowLike<TypeWebSocket> =
				Object.assign(new EventTarget(), {
					WebSocket: webSocketConstructor,
				});
			const heartbeatMessage: UseWebSocketHeartbeatMessage = "ping";
			const heartbeatScheduler: UseWebSocketHeartbeatScheduler = (
				_callback,
			) => ({
				isActive: signal(false),
				pause() {},
				resume() {},
			});
			const heartbeat: UseWebSocketHeartbeatOptions = {
				interval: signal(1000),
				message: heartbeatMessage,
				pongTimeout: signal(500),
				scheduler: heartbeatScheduler,
			};
			const autoReconnect: UseWebSocketAutoReconnectOptions = {
				delay: (retried) => retried * 100,
				retries: (retried) => retried < 3,
				onFailed() {},
			};
			const webSocketOptions: UseWebSocketOptions<
				TypeWebSocket,
				UseWebSocketWindowLike<TypeWebSocket>
			> = {
				autoConnect: true,
				autoReconnect,
				binaryType: signal("arraybuffer" as BinaryType),
				heartbeat,
				protocols: signal(["chat"] as const),
				webSocket: signal(webSocketConstructor),
				window: signal(webSocketWindow),
				onConnected(socket) {
					expectTypeOf(socket).toEqualTypeOf<TypeWebSocket>();
				},
				onDisconnected(socket, event) {
					expectTypeOf(socket).toEqualTypeOf<TypeWebSocket>();
					expectTypeOf(event).toEqualTypeOf<CloseEvent>();
				},
				onError(socket, event) {
					expectTypeOf(socket).toEqualTypeOf<TypeWebSocket>();
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				onMessage(socket, event) {
					expectTypeOf(socket).toEqualTypeOf<TypeWebSocket>();
					expectTypeOf(event).toEqualTypeOf<MessageEvent>();
				},
			};
			const webSocket = useWebSocket<string, TypeWebSocket>(
				signal("ws://example.test"),
				webSocketOptions,
			);
			const fallbackWebSocket = useWebSocket<unknown, WebSocketLike>(
				"ws://example.test",
				{
					window: null,
				},
			);
			const webSocketReturn: UseWebSocketReturn<string, TypeWebSocket> =
				webSocket;
			const status: UseWebSocketStatus = "OPEN";

			expectTypeOf(status).toMatchTypeOf<UseWebSocketStatus>();
			expectTypeOf(webSocket).toEqualTypeOf<
				UseWebSocketReturn<string, TypeWebSocket>
			>();
			expectTypeOf(webSocketReturn.data).toEqualTypeOf<
				ReadonlySignal<string | null>
			>();
			expectTypeOf(webSocket.status).toEqualTypeOf<
				ReadonlySignal<UseWebSocketStatus>
			>();
			expectTypeOf(webSocket.ws).toEqualTypeOf<
				ReadonlySignal<TypeWebSocket | undefined>
			>();
			expectTypeOf(webSocket.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(webSocket.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(webSocket.open()).toEqualTypeOf<void>();
			expectTypeOf(webSocket.close()).toEqualTypeOf<void>();
			expectTypeOf(webSocket.close(1000, "done")).toEqualTypeOf<void>();
			expectTypeOf(webSocket.send("message")).toEqualTypeOf<boolean>();
			expectTypeOf(
				webSocket.send(new Uint8Array(), false),
			).toEqualTypeOf<boolean>();
			expectTypeOf(webSocket.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallbackWebSocket).toEqualTypeOf<UseWebSocketReturn>();
			typeOnly(() => {
				// @ts-expect-error data is readonly
				webSocket.data.value = "next";
				// @ts-expect-error status is readonly
				webSocket.status.value = "CLOSED";
				// @ts-expect-error send data must be WebSocket-compatible
				webSocket.send({ value: "message" });
				// @ts-expect-error protocols must be strings
				useWebSocket("ws://example.test", { protocols: [1] });
				useWebSocket("ws://example.test", {
					// @ts-expect-error constructor must create WebSocket-like objects
					webSocket: class {},
				});
			});
		});

		typeOnly(() => {
			class TypeWorker extends EventTarget implements WorkerLike {
				postMessage(_message: unknown, _transfer: Transferable[]): void;
				postMessage(
					_message: unknown,
					_options?: StructuredSerializeOptions,
				): void;
				postMessage(
					_message?: unknown,
					_transferOrOptions?: Transferable[] | StructuredSerializeOptions,
				) {}
				terminate() {}
			}
			const workerConstructor = class extends TypeWorker {
				constructor(
					readonly scriptURL: string | URL,
					readonly options?: WorkerOptions,
				) {
					super();
				}
			} satisfies WorkerConstructorLike<TypeWorker>;
			const workerWindow: UseWebWorkerWindowLike<TypeWorker> = Object.assign(
				new EventTarget(),
				{
					Worker: workerConstructor,
				},
			);
			const workerConstructorSource: UseWebWorkerConstructorSource<TypeWorker> =
				signal(workerConstructor);
			const workerSource: UseWebWorkerSource<TypeWorker> = new TypeWorker();
			const workerOptions: UseWebWorkerOptions<
				TypeWorker,
				UseWebWorkerWindowLike<TypeWorker>,
				string
			> = {
				autoConnect: true,
				autoTerminate: true,
				immediate: true,
				worker: workerConstructorSource,
				workerOptions: signal({ type: "module" as const }),
				window: signal(workerWindow),
				onMessage(worker, event) {
					expectTypeOf(worker).toEqualTypeOf<TypeWorker>();
					expectTypeOf(event).toEqualTypeOf<MessageEvent<string>>();
				},
				onError(worker, event) {
					expectTypeOf(worker).toEqualTypeOf<TypeWorker>();
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				onMessageError(worker, event) {
					expectTypeOf(worker).toEqualTypeOf<TypeWorker>();
					expectTypeOf(event).toEqualTypeOf<MessageEvent>();
				},
			};
			const webWorker = useWebWorker<string, { type: "start" }, TypeWorker>(
				signal("worker.js"),
				workerOptions,
			);
			const existingWebWorker = useWebWorker<string, unknown, TypeWorker>(
				workerSource,
				{
					window: null,
				},
			);
			const fallbackWebWorker = useWebWorker<unknown, unknown, WorkerLike>(
				"worker.js",
				{
					window: null,
				},
			);
			const webWorkerReturn: UseWebWorkerReturn<
				string,
				{ type: "start" },
				TypeWorker
			> = webWorker;

			expectTypeOf(webWorker).toEqualTypeOf<
				UseWebWorkerReturn<string, { type: "start" }, TypeWorker>
			>();
			expectTypeOf(webWorkerReturn.data).toEqualTypeOf<
				ReadonlySignal<string | null>
			>();
			expectTypeOf(webWorker.worker).toEqualTypeOf<
				ReadonlySignal<TypeWorker | undefined>
			>();
			expectTypeOf(webWorker.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(webWorker.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(webWorker.open()).toEqualTypeOf<void>();
			expectTypeOf(webWorker.post({ type: "start" })).toEqualTypeOf<boolean>();
			expectTypeOf(
				webWorker.post({ type: "start" }, []),
			).toEqualTypeOf<boolean>();
			expectTypeOf(
				webWorker.post({ type: "start" }, { transfer: [] }),
			).toEqualTypeOf<boolean>();
			expectTypeOf(webWorker.terminate()).toEqualTypeOf<void>();
			expectTypeOf(webWorker.stop()).toEqualTypeOf<void>();
			expectTypeOf(existingWebWorker).toEqualTypeOf<
				UseWebWorkerReturn<string, unknown, TypeWorker>
			>();
			expectTypeOf(fallbackWebWorker).toEqualTypeOf<UseWebWorkerReturn>();
			typeOnly(() => {
				// @ts-expect-error data is readonly
				webWorker.data.value = "next";
				// @ts-expect-error worker is readonly
				webWorker.worker.value = new TypeWorker();
				// @ts-expect-error post payload must match Payload
				webWorker.post({ type: "stop" });
				// @ts-expect-error source must be a worker source
				useWebWorker({});
				useWebWorker("worker.js", {
					// @ts-expect-error constructor must create Worker-like objects
					worker: class {},
				});
			});
		});

		typeOnly(() => {
			class TypeFnWorker extends EventTarget implements WorkerLike {
				postMessage(_message: unknown, _transfer: Transferable[]): void;
				postMessage(
					_message: unknown,
					_options?: StructuredSerializeOptions,
				): void;
				postMessage(
					_message?: unknown,
					_transferOrOptions?: Transferable[] | StructuredSerializeOptions,
				) {}
				terminate() {}
			}
			const workerConstructor = class extends TypeFnWorker {
				constructor(readonly scriptURL: string | URL) {
					super();
				}
			} satisfies WorkerConstructorLike<TypeFnWorker>;
			const urlApi: UseWebWorkerFnUrlLike = {
				createObjectURL(_object) {
					return "blob:sigrea";
				},
				revokeObjectURL(_url) {},
			};
			const blobConstructor: UseWebWorkerFnBlobConstructorLike = Blob;
			const workerWindow: UseWebWorkerFnWindowLike<TypeFnWorker> =
				Object.assign(new EventTarget(), {
					Blob: blobConstructor,
					URL: urlApi,
					Worker: workerConstructor,
				});
			const localDependency: UseWebWorkerFnLocalDependency = (value) => value;
			const asyncWorkerFn = async (value: number) => `${value}`;
			const workerOptions: UseWebWorkerFnOptions<
				TypeFnWorker,
				UseWebWorkerFnWindowLike<TypeFnWorker>
			> = {
				dependencies: signal(["/dependency.js"] as const),
				localDependencies: signal([localDependency] as const),
				timeout: signal(1000),
				worker: signal(workerConstructor),
				window: signal(workerWindow),
			};
			const callable: UseWebWorkerFnCallable = (left: number, right: number) =>
				left + right;
			const asyncResult: UseWebWorkerFnResult<typeof asyncWorkerFn> = "1";
			const status: UseWebWorkerFnStatus = "RUNNING";
			const terminateStatus: UseWebWorkerFnTerminateStatus = "PENDING";
			const webWorkerFn = useWebWorkerFn(asyncWorkerFn, workerOptions);
			const fallbackWebWorkerFn = useWebWorkerFn<(value: number) => number>(
				(value: number) => value * 2,
				{
					window: null,
				},
			);
			const workerFnReturn: UseWebWorkerFnReturn<typeof asyncWorkerFn> =
				webWorkerFn;

			expectTypeOf(status).toMatchTypeOf<UseWebWorkerFnStatus>();
			expectTypeOf(
				terminateStatus,
			).toMatchTypeOf<UseWebWorkerFnTerminateStatus>();
			expectTypeOf(callable).toMatchTypeOf<UseWebWorkerFnCallable>();
			expectTypeOf(asyncResult).toEqualTypeOf<string>();
			expectTypeOf(webWorkerFn).toEqualTypeOf<
				UseWebWorkerFnReturn<typeof asyncWorkerFn>
			>();
			expectTypeOf(workerFnReturn.workerFn(1)).toEqualTypeOf<Promise<string>>();
			expectTypeOf(webWorkerFn.workerStatus).toEqualTypeOf<
				ReadonlySignal<UseWebWorkerFnStatus>
			>();
			expectTypeOf(webWorkerFn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(webWorkerFn.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(webWorkerFn.workerTerminate()).toEqualTypeOf<void>();
			expectTypeOf(webWorkerFn.workerTerminate("ERROR")).toEqualTypeOf<void>();
			expectTypeOf(webWorkerFn.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallbackWebWorkerFn).toEqualTypeOf<
				UseWebWorkerFnReturn<(value: number) => number>
			>();
			typeOnly(() => {
				// @ts-expect-error workerStatus is readonly
				webWorkerFn.workerStatus.value = "PENDING";
				// @ts-expect-error workerFn parameters must match the source function
				webWorkerFn.workerFn("1");
				// @ts-expect-error status values are fixed
				webWorkerFn.workerTerminate("DONE");
				// @ts-expect-error termination status cannot be success
				webWorkerFn.workerTerminate("SUCCESS");
				// @ts-expect-error termination status cannot stay running
				webWorkerFn.workerTerminate("RUNNING");
				useWebWorkerFn(asyncWorkerFn, {
					// @ts-expect-error dependencies must be script URLs
					dependencies: [1],
				});
				useWebWorkerFn(asyncWorkerFn, {
					// @ts-expect-error localDependencies must be functions
					localDependencies: ["pow"],
				});
				useWebWorkerFn(asyncWorkerFn, {
					// @ts-expect-error constructor must create Worker-like objects
					worker: class {},
				});
			});
		});

		typeOnly(() => {
			const dropTarget: UseDropZoneTarget = document.createElement("div");
			const dropFiles: UseDropZoneFiles = [
				new File(["sigrea"], "photo.jpg", { type: "image/jpeg" }),
			];
			const dropDataTypes: UseDropZoneDataTypes = signal(["image/"] as const);
			const dropValidator: UseDropZoneDataTypesValidator = (types) =>
				types.includes("image/jpeg");
			const dropCallback: UseDropZoneEventCallback = (files, event) => {
				expectTypeOf(files).toEqualTypeOf<UseDropZoneFiles>();
				expectTypeOf(event).toEqualTypeOf<DragEvent>();
			};
			const dropOptions: UseDropZoneOptions = {
				checkValidity: (items) => items.length > 0,
				dataTypes: dropDataTypes,
				multiple: signal(true),
				onDrop: dropCallback,
				onEnter: dropCallback,
				onLeave: dropCallback,
				onOver: dropCallback,
				preventDefaultForUnhandled: signal(false),
			};
			const dropZone = useDropZone(signal(dropTarget), dropOptions);
			const predicateDropZone = useDropZone(dropTarget, {
				dataTypes: dropValidator,
			});
			const shorthandDropZone = useDropZone(dropTarget, dropCallback);
			const dropReturn: UseDropZoneReturn = dropZone;

			expectTypeOf(dropFiles).toMatchTypeOf<UseDropZoneFiles>();
			expectTypeOf(dropZone).toEqualTypeOf<UseDropZoneReturn>();
			expectTypeOf(dropReturn.files).toEqualTypeOf<
				ReadonlySignal<UseDropZoneFiles>
			>();
			expectTypeOf(dropZone.isOverDropZone).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(dropZone.stop()).toEqualTypeOf<void>();
			expectTypeOf(predicateDropZone).toEqualTypeOf<UseDropZoneReturn>();
			expectTypeOf(shorthandDropZone).toEqualTypeOf<UseDropZoneReturn>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				dropZone.files.value = null;
				// @ts-expect-error dataTypes must be an array or predicate
				useDropZone(dropTarget, { dataTypes: "image/" });
				// @ts-expect-error multiple must be boolean
				useDropZone(dropTarget, { multiple: "true" });
				// @ts-expect-error target must be an EventTarget
				useDropZone(1, {});
			});
		});

		typeOnly(() => {
			const axis: UseDraggableAxis = "both";
			const pointerType: UseDraggablePointerType = "mouse";
			const draggableElement = document.createElement(
				"div",
			) as UseDraggableElement;
			const draggingElement: UseDraggableDraggingElement = window;
			const handle = document.createElement("button");
			const draggableOptions: UseDraggableOptions = {
				axis: signal(axis),
				buttons: signal([0] as const),
				capture: signal(true),
				containerElement: signal(draggableElement),
				disabled: signal(false),
				draggingElement: signal(draggingElement),
				exact: signal(false),
				handle: signal(handle),
				initialValue: signal({ x: 1, y: 2 }),
				onEnd: (position, event) => {
					expectTypeOf(position).toEqualTypeOf<Position>();
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
				onMove: (position, event) => {
					expectTypeOf(position).toEqualTypeOf<Position>();
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				},
				onStart: (position, event) => {
					expectTypeOf(position).toEqualTypeOf<Position>();
					expectTypeOf(event).toEqualTypeOf<PointerEvent>();
					return false;
				},
				pointerTypes: signal([pointerType] as const),
				preventDefault: signal(false),
				stopPropagation: signal(false),
			};
			const draggable = useDraggable(
				signal(draggableElement),
				draggableOptions,
			);
			const draggableReturn: UseDraggableReturn = draggable;

			expectTypeOf(draggable).toEqualTypeOf<UseDraggableReturn>();
			expectTypeOf(draggableReturn.x).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(draggable.y).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(draggable.position).toEqualTypeOf<Computed<Position>>();
			expectTypeOf(draggable.isDragging).toEqualTypeOf<Computed<boolean>>();
			expectTypeOf(draggable.style).toEqualTypeOf<Computed<string>>();
			expectTypeOf(draggable.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				draggable.x.value = 1;
				// @ts-expect-error axis must be x, y, or both
				useDraggable(draggableElement, { axis: "z" });
				// @ts-expect-error pointerTypes must be an array
				useDraggable(draggableElement, { pointerTypes: "mouse" });
				// @ts-expect-error buttons must be an array
				useDraggable(draggableElement, { buttons: 0 });
			});
		});

		const visibilityDocument =
			new EventTarget() as DocumentVisibilityDocumentLike;
		Object.defineProperty(visibilityDocument, "visibilityState", {
			value: "visible",
		});
		const visibilityOptions: UseDocumentVisibilityOptions = {
			document: signal(visibilityDocument),
		};
		const visibility = useDocumentVisibility(visibilityOptions);

		expectTypeOf(
			visibility.visibility.value,
		).toEqualTypeOf<DocumentVisibilityState>();

		const onlineNavigator: OnlineNavigatorLike = {
			onLine: true,
		};
		const onlineWindow = new EventTarget() as Window & {
			readonly navigator: OnlineNavigatorLike;
		};
		Object.defineProperty(onlineWindow, "navigator", {
			value: onlineNavigator,
		});
		const onlineOptions: UseOnlineOptions<typeof onlineWindow> = {
			window: signal(onlineWindow),
		};
		const online = useOnline(onlineOptions);
		const pageLeaveOptions: UsePageLeaveOptions<typeof onlineWindow> = {
			window: onlineWindow,
		};
		const pageLeave = usePageLeave(pageLeaveOptions);
		const pageLeaveReturn: UsePageLeaveReturn = pageLeave;
		const focusDocument: UseWindowFocusDocumentLike = Object.assign(
			new EventTarget(),
			{
				hasFocus: () => true,
			},
		);
		const focusWindow: FocusWindow = Object.assign(new EventTarget(), {
			document: focusDocument,
		});
		const focusOptions: UseWindowFocusOptions<typeof focusWindow> = {
			window: signal(focusWindow),
		};
		const windowFocus = useWindowFocus(focusOptions);
		const windowFocusReturn: UseWindowFocusReturn = windowFocus;
		const orientationType: OrientationType = "portrait-primary";
		const orientationLockType: OrientationLockType = "landscape";
		const screenOrientationApi = Object.assign(new EventTarget(), {
			angle: 0,
			lock: async (type: OrientationLockType) => {
				expectTypeOf(type).toEqualTypeOf<OrientationLockType>();
			},
			type: orientationType,
			unlock: () => {},
		}) as UseScreenOrientationScreenOrientationLike;
		const screenOrientationWindow = Object.assign(new EventTarget(), {
			screen: {
				orientation: screenOrientationApi,
			},
		}) as UseScreenOrientationWindowLike;
		const screenOrientationOptions: UseScreenOrientationOptions<
			typeof screenOrientationWindow
		> = {
			window: signal(screenOrientationWindow),
		};
		const screenOrientationResult = useScreenOrientation(
			screenOrientationOptions,
		);
		const screenOrientationFallback = useScreenOrientation({ window: null });
		const screenOrientationReturn: UseScreenOrientationReturn =
			screenOrientationResult;
		const safeAreaVisualViewport =
			new EventTarget() as UseScreenSafeAreaVisualViewportLike;
		const safeAreaWindow = Object.assign(new EventTarget(), {
			document,
			getComputedStyle: (_element: Element) =>
				({
					getPropertyValue: (_property: string) => "",
				}) as CSSStyleDeclaration,
			visualViewport: safeAreaVisualViewport,
		}) satisfies UseScreenSafeAreaWindowLike;
		const safeAreaOptions: UseScreenSafeAreaOptions<typeof safeAreaWindow> = {
			window: signal(safeAreaWindow),
		};
		const safeArea = useScreenSafeArea(safeAreaOptions);
		const safeAreaFallback = useScreenSafeArea({ window: null });
		const safeAreaReturn: UseScreenSafeAreaReturn = safeArea;
		const parallaxWindow = onlineWindow as Window & UseParallaxWindowLike;
		const parallaxAdjust: UseParallaxAdjust = (value) => value;
		const screenOrientation =
			new EventTarget() as UseParallaxScreenOrientationLike;
		const parallaxOptions: UseParallaxOptions<typeof parallaxWindow> = {
			absolute: true,
			deviceOrientationRollAdjust: parallaxAdjust,
			deviceOrientationTiltAdjust: parallaxAdjust,
			mouseRollAdjust: parallaxAdjust,
			mouseTiltAdjust: parallaxAdjust,
			requestPermissions: false,
			window: signal(parallaxWindow),
		};
		const parallax = useParallax(document.body, parallaxOptions);
		const parallaxReturn: UseParallaxReturn = parallax;
		const performanceWindow =
			new EventTarget() as UsePerformanceObserverWindowLike;
		const performanceOptions: UsePerformanceObserverOptions<
			typeof performanceWindow
		> = {
			entryTypes: ["mark", "measure"],
			immediate: false,
			window: performanceWindow,
		};
		const bufferedPerformanceOptions: UsePerformanceObserverObserveOptions = {
			buffered: true,
			type: "resource",
		};
		const thresholdPerformanceOptions: UsePerformanceObserverObserveOptions = {
			durationThreshold: 16,
			type: "event",
		};
		const performance = usePerformanceObserver(
			performanceOptions,
			(list, observer) => {
				expectTypeOf(list.getEntries()).toEqualTypeOf<PerformanceEntryList>();
				expectTypeOf(observer).toEqualTypeOf<PerformanceObserver>();
			},
		);
		const performanceReturn: UsePerformanceObserverReturn = performance;
		const permissionName: UsePermissionName = "display-capture";
		const permissionDescriptor: UsePermissionDescriptor = {
			name: "midi",
			sysex: true,
		};
		const permissionSource = signal<UsePermissionSource>(permissionName);
		const permissionStatus = new EventTarget() as PermissionStatus;
		const permissionStatusLike: UsePermissionStatusLike = permissionStatus;
		const permissionPermissions: UsePermissionPermissionsLike = {
			query: async (descriptor) => {
				expectTypeOf(descriptor).toEqualTypeOf<PermissionDescriptor>();
				return permissionStatus;
			},
		};
		const permissionNavigator: UsePermissionNavigatorLike = {
			permissions: permissionPermissions,
		};
		const permissionOptions: UsePermissionOptions<typeof permissionNavigator> =
			{
				navigator: signal(permissionNavigator),
			};
		const permission = usePermission(permissionDescriptor, permissionOptions);
		const permissionReturn: UsePermissionReturn = permission;
		const pointerTarget = new EventTarget();
		const pointerType: UsePointerType = "pen";
		const pointerInitialState: Partial<UsePointerState> = {
			x: 1,
			y: 2,
			pointerType,
		};
		const pointerOptions: UsePointerOptions<Window, typeof pointerTarget> = {
			initialValue: signal(pointerInitialState),
			pointerTypes: signal([pointerType] as const),
			target: pointerTarget,
			window,
		};
		const pointer = usePointer(pointerOptions);
		const pointerReturn: UsePointerReturn = pointer;
		const pointerSwipeElement = document.createElement(
			"div",
		) as UsePointerSwipeElement;
		const pointerSwipeDirection: UsePointerSwipeDirection = "left";
		const pointerSwipePointerType: UsePointerSwipePointerType = "touch";
		const pointerSwipeOptions: UsePointerSwipeOptions = {
			capture: signal(false),
			disabled: signal(false),
			disableTextSelect: signal(true),
			onSwipe: (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
			},
			onSwipeEnd: (event, direction) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
				expectTypeOf(direction).toEqualTypeOf<UsePointerSwipeDirection>();
			},
			onSwipeStart: (event) => {
				expectTypeOf(event).toEqualTypeOf<PointerEvent>();
			},
			pointerTypes: signal([pointerSwipePointerType] as const),
			preventDefault: signal(false),
			stopPropagation: signal(false),
			threshold: signal(12),
			touchAction: signal("none"),
		};
		const pointerSwipe = usePointerSwipe(
			signal(pointerSwipeElement),
			pointerSwipeOptions,
		);
		const pointerSwipeReturn: UsePointerSwipeReturn = pointerSwipe;
		const swipeDirection: UseSwipeDirection = "right";
		const swipeWindow = new EventTarget() as UseSwipeWindowLike;
		const swipeOptions: UseSwipeOptions<typeof swipeWindow> = {
			onSwipe: (event) => {
				expectTypeOf(event).toEqualTypeOf<TouchEvent>();
			},
			onSwipeEnd: (event, direction) => {
				expectTypeOf(event).toEqualTypeOf<TouchEvent>();
				expectTypeOf(direction).toEqualTypeOf<UseSwipeDirection>();
			},
			onSwipeStart: (event) => {
				expectTypeOf(event).toEqualTypeOf<TouchEvent>();
			},
			passive: false,
			threshold: signal(12),
			window: signal(swipeWindow),
		};
		const swipe = useSwipe(signal(new EventTarget()), swipeOptions);
		const swipeReturn: UseSwipeReturn = swipe;
		const pointerLockElement = Object.assign(new EventTarget(), {
			requestPointerLock: (_options?: PointerLockOptions) => Promise.resolve(),
		}) as UsePointerLockElementLike;
		const pointerLockRoot: UsePointerLockRootLike = {
			pointerLockElement,
		};
		const pointerLockDocument = Object.assign(new EventTarget(), {
			documentElement: pointerLockElement,
			exitPointerLock: () => {},
			pointerLockElement: null,
		}) as UsePointerLockDocumentLike;
		const pointerLockOptions: UsePointerLockOptions<
			typeof pointerLockDocument
		> = {
			autoUnlock: true,
			document: signal(pointerLockDocument),
		};
		const pointerLock = usePointerLock(
			signal(pointerLockElement),
			pointerLockOptions,
		);
		const pointerLockReturn: UsePointerLockReturn<typeof pointerLockElement> =
			pointerLock;

		expectTypeOf(online.isOnline.value).toEqualTypeOf<boolean>();
		expectTypeOf(pageLeave).toEqualTypeOf<UsePageLeaveReturn>();
		expectTypeOf(pageLeaveReturn.isLeft.value).toEqualTypeOf<boolean>();
		expectTypeOf(pageLeave.stop()).toEqualTypeOf<void>();
		expectTypeOf(windowFocus).toEqualTypeOf<UseWindowFocusReturn>();
		expectTypeOf(windowFocusReturn.focused.value).toEqualTypeOf<boolean>();
		expectTypeOf(windowFocus.stop()).toEqualTypeOf<void>();
		expectTypeOf(orientationType).toMatchTypeOf<OrientationType>();
		expectTypeOf(orientationLockType).toMatchTypeOf<OrientationLockType>();
		expectTypeOf(
			screenOrientationResult,
		).toEqualTypeOf<UseScreenOrientationReturn>();
		expectTypeOf(screenOrientationReturn.isSupported).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(screenOrientationResult.orientation.value).toEqualTypeOf<
			OrientationType | undefined
		>();
		expectTypeOf(screenOrientationResult.angle.value).toEqualTypeOf<number>();
		expectTypeOf(
			screenOrientationResult.lockOrientation(orientationLockType),
		).toEqualTypeOf<Promise<void>>();
		expectTypeOf(
			screenOrientationResult.unlockOrientation(),
		).toEqualTypeOf<void>();
		expectTypeOf(screenOrientationResult.stop()).toEqualTypeOf<void>();
		expectTypeOf(
			screenOrientationFallback,
		).toEqualTypeOf<UseScreenOrientationReturn>();
		expectTypeOf(document).toMatchTypeOf<UseScreenSafeAreaDocumentLike>();
		expectTypeOf(
			document.documentElement,
		).toMatchTypeOf<UseScreenSafeAreaElementLike>();
		expectTypeOf(safeArea).toEqualTypeOf<UseScreenSafeAreaReturn>();
		expectTypeOf(safeAreaReturn.top).toEqualTypeOf<ReadonlySignal<string>>();
		expectTypeOf(safeArea.right.value).toEqualTypeOf<string>();
		expectTypeOf(safeArea.bottom.value).toEqualTypeOf<string>();
		expectTypeOf(safeArea.left.value).toEqualTypeOf<string>();
		expectTypeOf(safeArea.update()).toEqualTypeOf<void>();
		expectTypeOf(safeArea.stop()).toEqualTypeOf<void>();
		expectTypeOf(safeAreaFallback).toEqualTypeOf<UseScreenSafeAreaReturn>();
		expectTypeOf(screenOrientation.type).toEqualTypeOf<
			OrientationType | undefined
		>();
		expectTypeOf(parallax).toEqualTypeOf<UseParallaxReturn>();
		expectTypeOf(parallaxReturn.roll.value).toEqualTypeOf<number>();
		expectTypeOf(parallax.tilt.value).toEqualTypeOf<number>();
		expectTypeOf(parallax.source.value).toEqualTypeOf<UseParallaxSource>();
		expectTypeOf(parallax.ensurePermissions()).toEqualTypeOf<Promise<void>>();
		expectTypeOf(parallax.ensurePermissions(true)).toEqualTypeOf<
			Promise<void>
		>();
		expectTypeOf(parallax.stop()).toEqualTypeOf<void>();
		typeOnly(() => {
			// @ts-expect-error lockOrientation only accepts spec lock types
			screenOrientationResult.lockOrientation("sideways");
		});
		expectTypeOf(performance).toEqualTypeOf<UsePerformanceObserverReturn>();
		expectTypeOf(performanceReturn.isSupported.value).toEqualTypeOf<boolean>();
		expectTypeOf(performance.start()).toEqualTypeOf<void>();
		expectTypeOf(performance.stop()).toEqualTypeOf<void>();
		usePerformanceObserver(
			{
				...bufferedPerformanceOptions,
				window: performanceWindow,
			},
			() => {},
		);
		usePerformanceObserver(thresholdPerformanceOptions, () => {});
		expectTypeOf(permission).toEqualTypeOf<UsePermissionReturn>();
		expectTypeOf(permissionStatusLike.state).toEqualTypeOf<PermissionState>();
		expectTypeOf(permissionReturn.isSupported.value).toEqualTypeOf<boolean>();
		expectTypeOf(permission.state.value).toEqualTypeOf<
			PermissionState | undefined
		>();
		expectTypeOf(permission.query()).toEqualTypeOf<
			Promise<PermissionStatus | undefined>
		>();
		expectTypeOf(permission.stop()).toEqualTypeOf<void>();
		usePermission(permissionSource, permissionOptions);
		expectTypeOf(pointer).toEqualTypeOf<UsePointerReturn>();
		expectTypeOf(pointerReturn.x.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.y.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.height.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.isInside.value).toEqualTypeOf<boolean>();
		expectTypeOf(pointer.pointerId.value).toEqualTypeOf<number>();
		expectTypeOf(
			pointer.pointerType.value,
		).toEqualTypeOf<UsePointerType | null>();
		expectTypeOf(pointer.pressure.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.tiltX.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.tiltY.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.twist.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.width.value).toEqualTypeOf<number>();
		expectTypeOf(pointer.stop()).toEqualTypeOf<void>();
		expectTypeOf(
			pointerSwipeDirection,
		).toMatchTypeOf<UsePointerSwipeDirection>();
		expectTypeOf(pointerSwipe).toEqualTypeOf<UsePointerSwipeReturn>();
		expectTypeOf(pointerSwipeReturn.isSwiping).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(pointerSwipe.direction).toEqualTypeOf<
			Computed<UsePointerSwipeDirection>
		>();
		expectTypeOf(pointerSwipe.posStart).toEqualTypeOf<Computed<Position>>();
		expectTypeOf(pointerSwipe.posEnd).toEqualTypeOf<Computed<Position>>();
		expectTypeOf(pointerSwipe.distanceX).toEqualTypeOf<Computed<number>>();
		expectTypeOf(pointerSwipe.distanceY).toEqualTypeOf<Computed<number>>();
		expectTypeOf(pointerSwipe.stop()).toEqualTypeOf<void>();
		expectTypeOf(swipeDirection).toMatchTypeOf<UseSwipeDirection>();
		expectTypeOf(swipe).toEqualTypeOf<UseSwipeReturn>();
		expectTypeOf(swipeReturn.isSwiping).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(swipe.direction).toEqualTypeOf<Computed<UseSwipeDirection>>();
		expectTypeOf(swipe.coordsStart).toEqualTypeOf<Computed<Position>>();
		expectTypeOf(swipe.coordsEnd).toEqualTypeOf<Computed<Position>>();
		expectTypeOf(swipe.lengthX).toEqualTypeOf<Computed<number>>();
		expectTypeOf(swipe.lengthY).toEqualTypeOf<Computed<number>>();
		expectTypeOf(swipe.stop()).toEqualTypeOf<void>();
		expectTypeOf(pointerLockRoot.pointerLockElement).toEqualTypeOf<
			UsePointerLockElementLike | null | undefined
		>();
		expectTypeOf(pointerLock).toEqualTypeOf<
			UsePointerLockReturn<typeof pointerLockElement>
		>();
		expectTypeOf(pointerLockReturn.isSupported.value).toEqualTypeOf<boolean>();
		expectTypeOf(pointerLock.isLocked.value).toEqualTypeOf<boolean>();
		expectTypeOf(pointerLock.element.value).toEqualTypeOf<
			typeof pointerLockElement | UsePointerLockElementLike | null
		>();
		expectTypeOf(pointerLock.lock).toEqualTypeOf<
			(options?: PointerLockOptions) => Promise<void>
		>();
		expectTypeOf(pointerLock.unlock).toEqualTypeOf<() => Promise<void>>();
		expectTypeOf(pointerLock.toggle).toEqualTypeOf<
			(options?: PointerLockOptions) => Promise<void>
		>();
		expectTypeOf(pointerLock.stop).toEqualTypeOf<() => void>();
		typeOnly(() => {
			usePerformanceObserver(
				// @ts-expect-error entryTypes cannot be used with type
				{
					entryTypes: ["mark"],
					type: "mark",
				},
				() => {},
			);
			usePerformanceObserver(
				// @ts-expect-error entryTypes cannot be used with buffered
				{
					buffered: true,
					entryTypes: ["resource"],
				},
				() => {},
			);
			usePerformanceObserver(
				// @ts-expect-error entryTypes cannot be used with durationThreshold
				{
					durationThreshold: 16,
					entryTypes: ["event"],
				},
				() => {},
			);
			usePermission(
				// @ts-expect-error permission name must be a string
				{ name: 1 },
				permissionOptions,
			);
			usePermission("geolocation", {
				// @ts-expect-error navigator must be navigator-like or nullish
				navigator: "navigator",
			});
			usePointer({
				// @ts-expect-error pointerTypes must be an array
				pointerTypes: "mouse",
			});
			// @ts-expect-error returned values are readonly signals
			pointerSwipe.isSwiping.value = true;
			// @ts-expect-error direction must be a known swipe direction
			const invalidPointerSwipeDirection: UsePointerSwipeDirection = "start";
			invalidPointerSwipeDirection;
			// @ts-expect-error pointerTypes must be an array
			usePointerSwipe(pointerSwipeElement, { pointerTypes: "touch" });
			// @ts-expect-error target must be an element
			usePointerSwipe(new EventTarget());
			// @ts-expect-error returned values are readonly signals
			swipe.isSwiping.value = true;
			// @ts-expect-error direction must be a known swipe direction
			const invalidSwipeDirection: UseSwipeDirection = "start";
			invalidSwipeDirection;
			useSwipe(new EventTarget(), {
				// @ts-expect-error passive must be boolean
				passive: "false",
			});
			useSwipe(new EventTarget(), {
				// @ts-expect-error window must be window-like or nullish
				window: 1,
			});
			// @ts-expect-error target must be EventTarget-like
			usePointerLock(1, pointerLockOptions);
			usePointerLock(pointerLockElement, {
				// @ts-expect-error document must be document-like
				document: 1,
			});
			usePointerLock(pointerLockElement, {
				// @ts-expect-error unknown options are rejected
				autoExit: true,
			});
			pointerLock.lock({
				// @ts-expect-error unadjustedMovement must be boolean
				unadjustedMovement: "true",
			});
		});

		breakpoints.stop();
		preferredDark.stop();
		active.stop();
		defaultActive.stop();
		animated.stop();
		colorMode.stop();
		motion.stop();
		motionFallback.stop();
		pixelRatio.stop();
		pixelRatioFallback.stop();
		visibility.stop();
		online.stop();
		pageLeave.stop();
		screenOrientationResult.stop();
		screenOrientationFallback.stop();
		parallax.stop();
		performance.stop();
		permission.stop();
		pointer.stop();
		pointerLock.stop();
	});

	it("forwards timeout start arguments", () => {
		const timeout = useTimeoutFn((label: string) => label.length, 100, {
			immediate: false,
		});
		const optionalTimeout = useTimeoutFn(
			(label?: string) => label?.length,
			100,
		);
		const restTimeout = useTimeoutFn(
			(...labels: string[]) => labels.length,
			100,
		);

		typeOnly(() => {
			timeout.start("ready");
			optionalTimeout.start();
			optionalTimeout.start("ready");
			restTimeout.start("ready", "set");
			// @ts-expect-error required callback arguments must be passed to start
			timeout.start();
			// @ts-expect-error start arguments must match the callback
			timeout.start(1);
			// @ts-expect-error callbacks with required arguments must opt out of auto start
			useTimeoutFn((label: string) => label.length, 100);
		});
	});

	it("types timeout ready signals and controls", () => {
		const ready = useTimeout(100, { immediate: false });
		const timeout = useTimeout(100, {
			controls: true,
			immediate: false,
		});

		expectTypeOf(ready).toEqualTypeOf<ReadonlySignal<boolean>>();
		expectTypeOf(timeout.ready).toEqualTypeOf<ReadonlySignal<boolean>>();
		expectTypeOf(timeout.isPending).toEqualTypeOf<ReadonlySignal<boolean>>();
		timeout.start();
		timeout.stop();
	});

	it("types timeout poll controls and options", () => {
		typeOnly(() => {
			const interval = signal(100);
			const callback: UseTimeoutPollCallback = async () => {};
			const options: UseTimeoutPollOptions = {
				immediate: false,
				immediateCallback: true,
			};
			const poll = useTimeoutPoll(callback, interval, options);
			const returnValue: UseTimeoutPollReturn = poll;

			expectTypeOf(returnValue.isActive).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			poll.pause();
			poll.resume();

			// @ts-expect-error returned value is readonly
			poll.isActive.value = false;
			// @ts-expect-error interval must be a number-like MaybeValue
			useTimeoutPoll(callback, "1000");
		});
	});

	it("types countdown controls and options", () => {
		typeOnly(() => {
			const initial = signal(3);
			const interval = signal(100);
			const scheduler: UseCountdownScheduler = (callback) =>
				useIntervalFn(callback, 100, { immediate: false });
			const options: UseCountdownOptions = {
				immediate: false,
				interval,
				onComplete: () => {},
				onTick: (remaining) => {
					expectTypeOf(remaining).toEqualTypeOf<number>();
				},
				scheduler,
			};
			const countdown = useCountdown(initial, options);

			expectTypeOf(countdown).toEqualTypeOf<UseCountdownReturn>();
			expectTypeOf(countdown.remaining).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(countdown.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();

			countdown.pause();
			countdown.resume();
			countdown.start();
			countdown.start(signal(2));
			countdown.stop();
			countdown.reset();
			countdown.reset(() => 4);

			// @ts-expect-error remaining is readonly
			countdown.remaining.value = 1;
			// @ts-expect-error countdown values must be numeric
			countdown.start("1");
			// @ts-expect-error countdown values must be numeric
			countdown.reset("1");
			// @ts-expect-error custom schedulers must return pausable controls
			const invalidScheduler: UseCountdownScheduler = (_callback) => ({
				pause() {},
				resume() {},
			});
			invalidScheduler;
		});
	});

	it("types date formatting values", () => {
		typeOnly(() => {
			const date = signal<DateLike>(new Date());
			const format = computed(() => "YYYY-MM-DD");
			const locales = signal<Intl.LocalesArgument>("en-US");
			const options: UseDateFormatOptions = {
				customMeridiem: (hours, minutes, isLowercase, hasPeriod) => {
					expectTypeOf(hours).toEqualTypeOf<number>();
					expectTypeOf(minutes).toEqualTypeOf<number>();
					expectTypeOf(isLowercase).toEqualTypeOf<boolean | undefined>();
					expectTypeOf(hasPeriod).toEqualTypeOf<boolean | undefined>();

					return "AM";
				},
				locales,
			};
			const result = useDateFormat(date, format, options);
			const getterResult = useDateFormat(() => Date.now());

			expectTypeOf(result).toEqualTypeOf<UseDateFormatReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(getterResult).toEqualTypeOf<UseDateFormatReturn>();
			expectTypeOf(
				formatDate(new Date(), "YYYY", options),
			).toEqualTypeOf<string>();
			expectTypeOf(normalizeDate(undefined)).toEqualTypeOf<Date>();
			// @ts-expect-error returned value is readonly
			result.value = "next";
			// @ts-expect-error source must resolve to Date, number, string, or undefined
			useDateFormat({});
			// @ts-expect-error format must resolve to string
			useDateFormat(new Date(), signal(1));
			const invalidOptions: UseDateFormatOptions = {
				// @ts-expect-error locales must match Intl.LocalesArgument
				locales: signal(1),
			};
			invalidOptions;
			const invalidMeridiemOptions: UseDateFormatOptions = {
				// @ts-expect-error custom meridiem must return a string
				customMeridiem: () => 1,
			};
			invalidMeridiemOptions;
		});
	});

	it("types time ago formatting and controls", () => {
		typeOnly(() => {
			type CustomUnit = UseTimeAgoUnitNamesDefault | "quarter";
			const source = signal<Date | number | string>(new Date());
			const interval = signal(1000);
			const units: UseTimeAgoUnit<CustomUnit>[] = [
				{ max: 60_000, name: "second", value: 1000 },
				{ max: 3 * 2_592_000_000, name: "month", value: 2_592_000_000 },
				{
					max: Number.POSITIVE_INFINITY,
					name: "quarter",
					value: 7_776_000_000,
				},
			];
			const messages: UseTimeAgoMessages<CustomUnit> = {
				justNow: "now",
				past: "{0} ago",
				future: (value) => `in ${value}`,
				invalid: "",
				second: (value, isPast) => {
					expectTypeOf(value).toEqualTypeOf<number>();
					expectTypeOf(isPast).toEqualTypeOf<boolean>();
					return `${value}s`;
				},
				minute: "{0}m",
				hour: "{0}h",
				day: "{0}d",
				week: "{0}w",
				month: "{0}mo",
				year: "{0}y",
				quarter: "{0}q",
			};
			const options: UseTimeAgoOptions<false, CustomUnit> = {
				fullDateFormatter: (date) => date.toISOString(),
				max: "quarter",
				messages,
				rounding: "ceil",
				showSecond: true,
				units,
				updateInterval: interval,
			};
			const result = useTimeAgo(source, options);
			const controls = useTimeAgo(source, {
				...options,
				controls: true,
				scheduler: (callback) => useIntervalFn(callback, interval),
			});
			const formatOptions: UseTimeAgoFormatOptions<CustomUnit> = options;
			const controlsReturn: UseTimeAgoControlsReturn = controls;
			const returnValue: UseTimeAgoReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseTimeAgoReturn<false>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(returnValue).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(controls).toEqualTypeOf<UseTimeAgoReturn<true>>();
			expectTypeOf(controlsReturn.timeAgo).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(formatOptions.units?.[0]?.name).toEqualTypeOf<
				CustomUnit | undefined
			>();
			expectTypeOf(formatTimeAgo(new Date(), options)).toEqualTypeOf<string>();
			expectTypeOf(controls.pause()).toEqualTypeOf<void>();
			expectTypeOf(controls.resume()).toEqualTypeOf<void>();

			// @ts-expect-error returned value is readonly
			result.value = "next";
			// @ts-expect-error time must resolve to Date, number, or string
			useTimeAgo({});
			const invalidMaxOptions: UseTimeAgoOptions = {
				// @ts-expect-error max must be a default unit or number
				max: "decade",
			};
			invalidMaxOptions;
			useTimeAgo(source, {
				// @ts-expect-error updateInterval must be a number-like MaybeValue
				updateInterval: "1000",
			});
			useTimeAgo(source, {
				// @ts-expect-error rounding must be a supported method or decimal count
				rounding: "nearest",
			});
		});
	});

	it("types Intl time ago formatting and controls", () => {
		typeOnly(() => {
			const source = signal<Date | number | string>(new Date());
			const interval = signal(1000);
			const locale = signal<Intl.LocalesArgument>("en-US");
			const units: UseTimeAgoIntlUnit[] = [
				{ name: "quarter", ms: 7_776_000_000 },
				{ name: "day", ms: 86_400_000 },
				{ name: "second", ms: 1000 },
			];
			const joinParts: UseTimeAgoIntlJoinParts = (parts, localeArg) => {
				expectTypeOf(parts).toEqualTypeOf<Intl.RelativeTimeFormatPart[]>();
				expectTypeOf(localeArg).toEqualTypeOf<
					Intl.LocalesArgument | undefined
				>();

				return parts.map((part) => part.value).join(String(localeArg ?? ""));
			};
			const options: UseTimeAgoIntlOptions<false> = {
				insertSpace: false,
				joinParts,
				locale,
				relativeTimeFormatOptions: {
					numeric: "auto",
					style: "short",
				},
				units,
				updateInterval: interval,
			};
			const result = useTimeAgoIntl(source, options);
			const controls = useTimeAgoIntl(source, {
				...options,
				controls: true,
				scheduler: (callback) => useIntervalFn(callback, interval),
			});
			const formatOptions: UseTimeAgoIntlFormatOptions = options;
			const controlsReturn: UseTimeAgoIntlControlsReturn = controls;
			const returnValue: UseTimeAgoIntlReturn = result;

			expectTypeOf(result).toEqualTypeOf<UseTimeAgoIntlReturn<false>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(returnValue).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(controls).toEqualTypeOf<UseTimeAgoIntlReturn<true>>();
			expectTypeOf(controlsReturn.timeAgoIntl).toEqualTypeOf<
				ReadonlySignal<string>
			>();
			expectTypeOf(controlsReturn.parts).toEqualTypeOf<
				ReadonlySignal<Intl.RelativeTimeFormatPart[]>
			>();
			expectTypeOf(formatOptions.units?.[0]?.name).toEqualTypeOf<
				Intl.RelativeTimeFormatUnit | undefined
			>();
			expectTypeOf(
				formatTimeAgoIntl(new Date(), options),
			).toEqualTypeOf<string>();
			expectTypeOf(formatTimeAgoIntlParts([], options)).toEqualTypeOf<string>();
			expectTypeOf(controls.pause()).toEqualTypeOf<void>();
			expectTypeOf(controls.resume()).toEqualTypeOf<void>();

			// @ts-expect-error returned value is readonly
			result.value = "next";
			// @ts-expect-error time must resolve to Date, number, or string
			useTimeAgoIntl({});
			const invalidUnitOptions: UseTimeAgoIntlOptions = {
				units: [
					{
						// @ts-expect-error unit must be accepted by Intl.RelativeTimeFormat
						name: "decade",
						ms: 1000,
					},
				],
			};
			invalidUnitOptions;
			useTimeAgoIntl(source, {
				// @ts-expect-error locale must be accepted by Intl.RelativeTimeFormat
				locale: 1000,
			});
			useTimeAgoIntl(source, {
				// @ts-expect-error updateInterval must be a number-like MaybeValue
				updateInterval: "1000",
			});
		});
	});

	it("allows the default interval duration", () => {
		const interval = useIntervalFn(() => {}, 1000, { immediate: false });

		interval.pause();
	});

	it("types interval counters and callback counts", () => {
		const counter = useInterval(100, { immediate: false });
		const interval = useInterval(100, {
			callback: (count) => {
				expectTypeOf(count).toEqualTypeOf<number>();
			},
			controls: true,
			immediate: false,
		});

		expectTypeOf(counter).toEqualTypeOf<ReadonlySignal<number>>();
		expectTypeOf(interval.counter).toEqualTypeOf<ReadonlySignal<number>>();
		expectTypeOf(interval.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
		interval.pause();
		interval.resume();
		interval.pause();
		interval.reset();
	});

	it("preserves debounce arguments, this, and return value", () => {
		function label(this: { prefix: string }, value: number) {
			return `${this.prefix}${value}`;
		}
		const debounced = useDebounceFn(label, 100);

		typeOnly(() => {
			expectTypeOf(debounced.call({ prefix: "id:" }, 1)).toEqualTypeOf<
				Promise<string | undefined>
			>();
			// @ts-expect-error arguments must match the original function
			debounced.call({ prefix: "id:" }, "1");
		});
	});

	it("preserves throttle arguments, this, and return value", () => {
		function label(this: { prefix: string }, value: number) {
			return `${this.prefix}${value}`;
		}
		const throttled = useThrottleFn(label, 100);

		typeOnly(() => {
			expectTypeOf(throttled.call({ prefix: "id:" }, 1)).toEqualTypeOf<
				Promise<string | undefined>
			>();
			// @ts-expect-error arguments must match the original function
			throttled.call({ prefix: "id:" }, "1");
		});
	});

	it("accepts reactive window-like targets for window size", () => {
		const sizedWindow = new EventTarget() as SizedWindow;
		Object.defineProperties(sizedWindow, {
			innerHeight: { value: 600, writable: true },
			innerWidth: { value: 800, writable: true },
		});

		const options: UseWindowSizeOptions<SizedWindow> = {
			window: signal(sizedWindow),
		};

		const size = useWindowSize(options);

		size.stop();
	});

	it("accepts mouse options with custom targets", () => {
		const mouseWindow = new EventTarget() as MouseWindow;
		Object.defineProperties(mouseWindow, {
			scrollX: { value: 0 },
			scrollY: { value: 0 },
		});
		const target = new EventTarget();
		const options: UseMouseOptions<MouseWindow> = {
			target: signal(target),
			type: "client",
			window: signal(mouseWindow),
		};
		const mouse = useMouse(options);

		expectTypeOf(mouse.x.value).toEqualTypeOf<number>();
		expectTypeOf(mouse.sourceType.value).toEqualTypeOf<
			"mouse" | "touch" | null
		>();
		mouse.stop();
	});

	it("types mouse-in-element values and options", () => {
		typeOnly(() => {
			const mouseWindow = new EventTarget() as MouseInElementWindow;
			const target = signal<Element | null>(document.createElement("div"));
			const options: UseMouseInElementOptions<MouseInElementWindow> = {
				handleOutside: false,
				target: signal(new EventTarget()),
				type: "client",
				window: signal(mouseWindow),
				windowResize: false,
				windowScroll: false,
			};
			const extractorOptions: UseMouseInElementOptions<MouseInElementWindow> = {
				type: (event) => [event.pageX, event.pageY],
				window: signal(mouseWindow),
			};
			const state = useMouseInElement(target, options);
			const customExtractorState = useMouseInElement(
				document.createElement("div"),
				extractorOptions,
			);
			const stateReturn: UseMouseInElementReturn = state;

			expectTypeOf(state).toEqualTypeOf<UseMouseInElementReturn>();
			expectTypeOf(stateReturn.elementX).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(state.elementY).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(state.elementPositionX).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(state.elementPositionY).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(state.elementWidth).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(state.elementHeight).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(state.isOutside).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(
				customExtractorState,
			).toEqualTypeOf<UseMouseInElementReturn>();
			expectTypeOf(state.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				state.elementX.value = 1;
				useMouseInElement(document.createElement("div"), {
					// @ts-expect-error movement deltas cannot be used for element-relative coordinates
					type: "movement",
				});
				useMouseInElement(document.createElement("div"), {
					// @ts-expect-error handleOutside must be boolean
					handleOutside: "false",
				});
				useMouseInElement(document.createElement("div"), {
					// @ts-expect-error windowScroll must be boolean
					windowScroll: "true",
				});
			});
		});
	});

	it("types mouse pressed values and options", () => {
		typeOnly(() => {
			const mouseWindow = new EventTarget() as MousePressedWindow;
			const target = signal<EventTarget | null>(new EventTarget());
			const options: UseMousePressedOptions<MousePressedWindow> = {
				capture: true,
				drag: false,
				initialValue: true,
				onPressed(event) {
					expectTypeOf(event).toEqualTypeOf<UseMousePressedSourceEvent>();
				},
				onReleased(event) {
					expectTypeOf(event).toEqualTypeOf<UseMousePressedSourceEvent>();
				},
				target,
				touch: false,
				window: signal(mouseWindow),
			};
			const state = useMousePressed(options);
			const stateReturn: UseMousePressedReturn = state;

			expectTypeOf(state).toEqualTypeOf<UseMousePressedReturn>();
			expectTypeOf(stateReturn.pressed).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(state.sourceType).toEqualTypeOf<
				ReadonlySignal<"mouse" | "touch" | null>
			>();
			expectTypeOf(state.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				state.pressed.value = true;
				useMousePressed({
					// @ts-expect-error touch must be boolean
					touch: "false",
				});
				useMousePressed({
					// @ts-expect-error target must be an event target
					target: "button",
				});
			});
		});
	});

	it("types mutation observer values and options", () => {
		typeOnly(() => {
			const mutationWindow = new EventTarget() as MutationObserverWindow;
			const node = document.createTextNode("content");
			const element = document.createElement("div");
			const target: UseMutationObserverTarget<Node> = [
				signal(node),
				null,
				element,
			];
			const options: UseMutationObserverOptions<MutationObserverWindow> = {
				attributeFilter: ["id"],
				attributes: true,
				childList: true,
				window: signal(mutationWindow),
			};
			const observer = useMutationObserver(
				target,
				(records, observer) => {
					expectTypeOf(records).toEqualTypeOf<MutationRecord[]>();
					expectTypeOf(observer).toEqualTypeOf<MutationObserver>();
				},
				options,
			);
			const observerReturn: UseMutationObserverReturn = observer;

			expectTypeOf(observer).toEqualTypeOf<UseMutationObserverReturn>();
			expectTypeOf(observerReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(observer.takeRecords()).toEqualTypeOf<
				MutationRecord[] | undefined
			>();
			expectTypeOf(observer.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				observer.isSupported.value = true;
				useMutationObserver(document.createElement("div"), () => {}, {
					// @ts-expect-error attributes must be boolean
					attributes: "true",
				});
				useMutationObserver(
					// @ts-expect-error target must resolve to a node
					"node",
					() => {},
				);
			});
		});
	});

	it("types resize observer values and options", () => {
		typeOnly(() => {
			const resizeWindow = new EventTarget() as ResizeWindow;
			const first = document.createElement("div");
			const second = document.createElement("section");
			const target: UseResizeObserverTarget<HTMLElement> = [
				signal(first),
				null,
				second,
			];
			const box = signal<ResizeObserverBoxOptions>("border-box");
			const options: UseResizeObserverOptions<ResizeWindow> = {
				box,
				window: signal(resizeWindow),
			};
			const observer = useResizeObserver(
				target,
				(entries, resizeObserver) => {
					expectTypeOf(entries).toEqualTypeOf<ResizeObserverEntry[]>();
					expectTypeOf(resizeObserver).toEqualTypeOf<ResizeObserver>();
				},
				options,
			);
			const observerReturn: UseResizeObserverReturn = observer;

			expectTypeOf(observer).toEqualTypeOf<UseResizeObserverReturn>();
			expectTypeOf(observerReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(observer.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				observer.isSupported.value = true;
				useResizeObserver(first, () => {}, {
					// @ts-expect-error box must be a ResizeObserver box option
					box: "margin-box",
				});
				useResizeObserver(
					// @ts-expect-error target must resolve to an element
					"element",
					() => {},
				);
			});
		});
	});

	it("types navigator language values and options", () => {
		typeOnly(() => {
			const navigatorTarget: UseNavigatorLanguageNavigatorLike = {
				language: "en-US",
			};
			const languageWindow = new EventTarget() as NavigatorLanguageWindow;
			const options: UseNavigatorLanguageOptions<
				NavigatorLanguageWindow,
				UseNavigatorLanguageNavigatorLike
			> = {
				navigator: signal(navigatorTarget),
				window: signal(languageWindow),
			};
			const language = useNavigatorLanguage(options);
			const languageReturn: UseNavigatorLanguageReturn = language;

			expectTypeOf(language).toEqualTypeOf<UseNavigatorLanguageReturn>();
			expectTypeOf(languageReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(language.language).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(language.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				language.language.value = "ja-JP";
				useNavigatorLanguage({
					// @ts-expect-error navigator must be navigator-like
					navigator: "en-US",
				});
			});
		});
	});

	it("types preferred languages values and options", () => {
		typeOnly(() => {
			const navigatorTarget: UsePreferredLanguagesNavigatorLike = {
				languages: ["en-US", "en"],
			};
			const languageWindow = new EventTarget() as PreferredLanguagesWindow;
			const options: UsePreferredLanguagesOptions<
				PreferredLanguagesWindow,
				UsePreferredLanguagesNavigatorLike
			> = {
				navigator: signal(navigatorTarget),
				window: signal(languageWindow),
			};
			const preferred = usePreferredLanguages(options);
			const preferredReturn: UsePreferredLanguagesReturn = preferred;

			expectTypeOf(preferred).toEqualTypeOf<UsePreferredLanguagesReturn>();
			expectTypeOf(preferredReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(preferred.languages).toEqualTypeOf<
				ReadonlySignal<readonly string[]>
			>();
			expectTypeOf(preferred.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				preferred.languages.value = ["ja-JP"];
				usePreferredLanguages({
					// @ts-expect-error navigator must be navigator-like
					navigator: ["en-US"],
				});
			});
		});
	});

	it("types network values and options", () => {
		typeOnly(() => {
			const connectionTarget: UseNetworkConnectionLike = Object.assign(
				new EventTarget(),
				{
					downlink: 10,
					effectiveType: "4g" as UseNetworkEffectiveType,
					type: "wifi" as UseNetworkType,
				},
			);
			const navigatorTarget: UseNetworkNavigatorLike = {
				connection: connectionTarget,
				onLine: true,
			};
			const networkWindow = new EventTarget() as NetworkWindow;
			const options: UseNetworkOptions<NetworkWindow, UseNetworkNavigatorLike> =
				{
					navigator: signal(navigatorTarget),
					window: signal(networkWindow),
				};
			const network = useNetwork(options);
			const networkReturn: UseNetworkReturn = network;

			expectTypeOf(network).toEqualTypeOf<UseNetworkReturn>();
			expectTypeOf(networkReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(network.isOnline).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(network.offlineAt).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(network.downlink).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(network.effectiveType).toEqualTypeOf<
				ReadonlySignal<UseNetworkEffectiveType | undefined>
			>();
			expectTypeOf(network.saveData).toEqualTypeOf<
				ReadonlySignal<boolean | undefined>
			>();
			expectTypeOf(network.type).toEqualTypeOf<
				ReadonlySignal<UseNetworkType>
			>();
			expectTypeOf(network.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				network.type.value = "cellular";
				useNetwork({
					// @ts-expect-error navigator must be network navigator-like
					navigator: "online",
				});
			});
		});
	});

	it("types now signals and controls", () => {
		typeOnly(() => {
			const scheduler: UseNowScheduler = () => ({
				isActive: signal(false),
				pause: () => {},
				resume: () => {},
			});
			const interval: UseNowInterval = signal(1000);
			const nowWindow = Object.assign(new EventTarget(), {
				cancelAnimationFrame: (_handle: number) => {},
				label: "now",
				requestAnimationFrame: (_callback: FrameRequestCallback) => 1,
			}) as NowWindow;
			const options: UseNowOptions<true> = {
				controls: true,
				interval,
				scheduler,
				window: signal(nowWindow),
			};
			const now = useNow();
			const controlled = useNow(options);
			const controlledReturn: UseNowReturn<true> = controlled;

			expectTypeOf(now).toEqualTypeOf<ReadonlySignal<Date>>();
			expectTypeOf(controlled).toEqualTypeOf<UseNowControlsReturn>();
			expectTypeOf(controlledReturn.now).toEqualTypeOf<ReadonlySignal<Date>>();
			expectTypeOf(controlled.isActive).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(controlled.pause()).toEqualTypeOf<void>();
			expectTypeOf(controlled.resume()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				now.value = new Date();
				// @ts-expect-error returned values are readonly signals
				controlled.now.value = new Date();
				useNow({
					// @ts-expect-error interval must be numeric or requestAnimationFrame
					interval: "slow",
				});
				useNow({
					// @ts-expect-error window must provide animation frame methods when present
					window: { requestAnimationFrame: true },
				});
			});
		});
	});

	it("types timestamp signals and controls", () => {
		typeOnly(() => {
			const scheduler: UseTimestampScheduler = () => ({
				isActive: signal(false),
				pause: () => {},
				resume: () => {},
			});
			const interval: UseTimestampInterval = signal(1000);
			const offset = signal(100);
			const options: UseTimestampOptions<true> = {
				callback: (timestamp) => {
					expectTypeOf(timestamp).toEqualTypeOf<number>();
				},
				controls: true,
				interval,
				offset,
				scheduler,
			};
			const timestamp = useTimestamp();
			const controlled = useTimestamp(options);
			const controlledReturn: UseTimestampReturn<true> = controlled;

			expectTypeOf(timestamp).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(controlled).toEqualTypeOf<UseTimestampControlsReturn>();
			expectTypeOf(controlledReturn.timestamp).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(controlled.isActive).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(controlled.pause()).toEqualTypeOf<void>();
			expectTypeOf(controlled.resume()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				timestamp.value = 1;
				// @ts-expect-error returned values are readonly signals
				controlled.timestamp.value = 1;
				useTimestamp({
					// @ts-expect-error interval must be numeric or requestAnimationFrame
					interval: "slow",
				});
				useTimestamp({
					// @ts-expect-error offset must be numeric
					offset: "100",
				});
			});
		});
	});

	it("types document title controls", () => {
		typeOnly(() => {
			const source = signal<string | null | undefined>("Dashboard");
			const customDocument = document as UseTitleDocumentLike;
			const documentTarget = signal<UseTitleDocumentLike | null>(
				customDocument,
			);
			const restore: UseTitleRestore = (originalTitle, currentTitle) => {
				expectTypeOf(originalTitle).toEqualTypeOf<string>();
				expectTypeOf(currentTitle).toEqualTypeOf<string>();
				return originalTitle;
			};
			const stringTemplate: UseTitleTemplate = signal("%s | App");
			const functionTemplate: UseTitleTemplate = (title) => {
				expectTypeOf(title).toEqualTypeOf<string>();
				return `${title} | App`;
			};
			const options: UseTitleOptions<UseTitleDocumentLike> = {
				document: documentTarget,
				restoreOnUnmount: restore,
				titleTemplate: stringTemplate,
			};
			const title = useTitle(source, options);
			const fallback = useTitle(undefined, { document: null });
			const observed = useTitle("Observed", {
				document: customDocument,
				observe: true,
			});

			useTitle(() => "Getter", {
				document: customDocument,
				titleTemplate: (title) => `${title} | Getter`,
			});
			useTitle("Function", {
				titleTemplate: functionTemplate,
			});
			expectTypeOf(title).toEqualTypeOf<UseTitleReturn>();
			expectTypeOf(title).toEqualTypeOf<
				Computed<string | null | undefined> & { stop(): void }
			>();
			expectTypeOf(title.value).toEqualTypeOf<string | null | undefined>();
			expectTypeOf(fallback.value).toEqualTypeOf<string | null | undefined>();
			title.value = "Next";
			title.value = null;
			title.value = undefined;
			expectTypeOf(title.stop()).toEqualTypeOf<void>();
			observed.stop();
			// @ts-expect-error title must be a string or nullish value
			useTitle(1);
			useTitle("Dashboard", {
				// @ts-expect-error document must be a document-like target
				document: {},
			});
			useTitle("Dashboard", {
				// @ts-expect-error observe must be boolean
				observe: "true",
			});
			useTitle("Dashboard", {
				// @ts-expect-error titleTemplate must be a string template or callback
				titleTemplate: 1,
			});
			useTitle("Dashboard", {
				// @ts-expect-error restoreOnUnmount must be false or a restore callback
				restoreOnUnmount: true,
			});
			// @ts-expect-error titleTemplate and observe cannot be used together
			useTitle("Dashboard", { observe: true, titleTemplate: "%s | App" });
			// @ts-expect-error title value must be string, null, or undefined
			title.value = 1;
		});
	});

	it("types requestAnimationFrame controls", () => {
		typeOnly(() => {
			const callback: UseRafFnCallback = (args) => {
				const callbackArgs: UseRafFnCallbackArguments = args;
				expectTypeOf(callbackArgs.delta).toEqualTypeOf<number>();
				expectTypeOf(callbackArgs.timestamp).toEqualTypeOf<number>();
			};
			const fpsLimit = signal<number | null>(30);
			const rafWindow = Object.assign(new EventTarget(), {
				cancelAnimationFrame: (_handle: number) => {},
				label: "raf",
				requestAnimationFrame: (_callback: FrameRequestCallback) => 1,
			}) as RafWindow;
			const options: UseRafFnOptions<RafWindow> = {
				fpsLimit,
				immediate: false,
				once: true,
				window: signal(rafWindow),
			};
			const raf = useRafFn(callback, options);
			const rafReturn: UseRafFnReturn = raf;

			expectTypeOf(raf).toEqualTypeOf<UseRafFnReturn>();
			expectTypeOf(rafReturn.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(raf.pause()).toEqualTypeOf<void>();
			expectTypeOf(raf.resume()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				raf.isActive.value = true;
				useRafFn(callback, {
					// @ts-expect-error window must provide requestAnimationFrame when present
					window: { requestAnimationFrame: true },
				});
				useRafFn(callback, {
					// @ts-expect-error fpsLimit must be numeric or null
					fpsLimit: "30",
				});
			});
		});
	});

	it("types object URLs", () => {
		typeOnly(() => {
			const source = signal<UseObjectUrlObject | null>(new Blob(["hello"]));
			const urlApi: UseObjectUrlUrlLike = {
				createObjectURL: (_object) => "blob:mock",
				revokeObjectURL: (_objectURL) => {},
			};
			const windowTarget = Object.assign(new EventTarget(), {
				URL: urlApi,
			}) as UseObjectUrlWindowLike;
			const options: UseObjectUrlOptions = {
				window: signal(windowTarget),
			};
			const objectUrl = useObjectUrl(source, options);
			const objectUrlReturn: UseObjectUrlReturn = objectUrl;

			expectTypeOf(objectUrl).toEqualTypeOf<UseObjectUrlReturn>();
			expectTypeOf(objectUrlReturn.url).toEqualTypeOf<
				ReadonlySignal<string | undefined>
			>();
			expectTypeOf(objectUrl.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				objectUrl.url.value = "blob:next";
				useObjectUrl({
					// @ts-expect-error object must be a Blob, File, MediaSource, or signal/getter for one
					src: "blob:source",
				});
				useObjectUrl(source, {
					window: {
						URL: {
							createObjectURL: (_object) => "blob:mock",
							// @ts-expect-error revokeObjectURL receives a string
							revokeObjectURL: (_objectURL: number) => {},
						},
					},
				});
			});
		});
	});

	it("types offset pagination controls", () => {
		typeOnly(() => {
			const page = signal(1);
			const pageSize = signal(10);
			const total = signal(100);
			const options: UseOffsetPaginationOptions = {
				onPageChange: (value) => {
					expectTypeOf(value).toEqualTypeOf<UseOffsetPaginationChangePayload>();
				},
				onPageCountChange: (value) => {
					expectTypeOf(value.pageCount).toEqualTypeOf<number>();
				},
				onPageSizeChange: (value) => {
					expectTypeOf(value.currentPageSize).toEqualTypeOf<number>();
				},
				page,
				pageSize,
				total,
			};
			const pagination = useOffsetPagination(options);
			const paginationReturn: UseOffsetPaginationReturn = pagination;

			expectTypeOf(pagination).toEqualTypeOf<UseOffsetPaginationReturn>();
			expectTypeOf(paginationReturn.currentPage).toEqualTypeOf<
				Computed<number>
			>();
			expectTypeOf(pagination.currentPageSize).toEqualTypeOf<
				Computed<number>
			>();
			expectTypeOf(pagination.pageCount).toEqualTypeOf<
				ReadonlySignal<number>
			>();
			expectTypeOf(pagination.isFirstPage).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(pagination.prev()).toEqualTypeOf<void>();
			expectTypeOf(pagination.next()).toEqualTypeOf<void>();
			expectTypeOf(pagination.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				pagination.currentPage.value = 2;
				pagination.currentPageSize.value = 20;
				// @ts-expect-error readonly computed signal
				pagination.pageCount.value = 5;
				useOffsetPagination({
					// @ts-expect-error page must resolve to a number
					page: "1",
				});
				useOffsetPagination({
					// @ts-expect-error callback receives pagination values
					onPageChange: (value: string) => value,
				});
			});
		});
	});

	it("returns writable focused state for focus", () => {
		const target = document.createElement("button") as FocusableElementLike;
		const options: UseFocusOptions = {
			focusVisible: true,
			preventScroll: true,
		};
		const focus = useFocus(target, options);

		focus.focused.value = true;
		expectTypeOf(focus.focused.value).toEqualTypeOf<boolean>();
		focus.stop();
	});

	it("types readonly focused state for focus within", () => {
		const target = signal<FocusWithinElementLike | null>(
			document.createElement("form"),
		);
		const focusWithin = useFocusWithin(target);
		const focusWithinReturn: UseFocusWithinReturn = focusWithin;

		expectTypeOf(focusWithin).toEqualTypeOf<UseFocusWithinReturn>();
		expectTypeOf(focusWithinReturn.focused).toEqualTypeOf<
			ReadonlySignal<boolean>
		>();
		expectTypeOf(focusWithin.stop()).toEqualTypeOf<void>();
		typeOnly(() => {
			// @ts-expect-error returned values are readonly signals
			focusWithin.focused.value = true;
			// @ts-expect-error target must be an EventTarget
			useFocusWithin({ matches: () => true });
		});
		focusWithin.stop();
	});

	it("types FPS signal and injectable targets", () => {
		typeOnly(() => {
			const performanceTarget: FpsPerformance = {
				label: "perf",
				now: () => 0,
			};
			const fpsWindow = Object.assign(new EventTarget(), {
				label: "fps",
				performance: performanceTarget,
			}) as FpsWindow;
			const options: UseFpsOptions<FpsWindow> = {
				every: signal(5),
				window: signal(fpsWindow),
			};
			const fps = useFps(options);
			const fpsReturn: UseFpsReturn = fps;

			expectTypeOf(fps).toEqualTypeOf<UseFpsReturn>();
			expectTypeOf(fpsReturn).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(fps.value).toEqualTypeOf<number>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				fps.value = 1;
				useFps({
					// @ts-expect-error every must be numeric
					every: "10",
				});
				useFps({
					// @ts-expect-error window must be EventTarget-like
					window: { performance: performanceTarget },
				});
				useFps({
					window: {
						// @ts-expect-error performance must expose now()
						performance: {},
					},
				});
			});
		});
	});

	it("types fullscreen controls and injectable document", () => {
		typeOnly(() => {
			const fullscreenElement = Object.assign(new EventTarget(), {
				requestFullscreen: (_options?: UseFullscreenEnterOptions) =>
					Promise.resolve(),
			}) as UseFullscreenElementLike;
			const fullscreenDocument = Object.assign(new EventTarget(), {
				documentElement: fullscreenElement,
				exitFullscreen: () => Promise.resolve(),
				fullscreenElement: null,
				fullscreenEnabled: true,
			}) as UseFullscreenDocumentLike;
			const options: UseFullscreenOptions = {
				autoExit: true,
				document: signal(fullscreenDocument),
			};
			const fullscreen = useFullscreen(signal(fullscreenElement), options);
			const fallback = useFullscreen(undefined, { document: null });
			const fullscreenReturn: UseFullscreenReturn = fullscreen;

			expectTypeOf(fullscreen).toEqualTypeOf<UseFullscreenReturn>();
			expectTypeOf(fullscreenReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(fullscreen.isFullscreen).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(fullscreen.enter()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(fullscreen.enter({ navigationUI: "show" })).toEqualTypeOf<
				Promise<void>
			>();
			expectTypeOf(fullscreen.exit()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(fullscreen.toggle()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(fullscreen.stop()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseFullscreenReturn>();
			useFullscreen(null, options);
			useFullscreen(() => fullscreenElement, options);
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				fullscreen.isFullscreen.value = true;
				// @ts-expect-error target must be EventTarget-like
				useFullscreen(1, options);
				useFullscreen(fullscreenElement, {
					// @ts-expect-error document must be document-like
					document: 1,
				});
				useFullscreen(fullscreenElement, {
					// @ts-expect-error unknown options are rejected
					navigationUI: "hide",
				});
				// @ts-expect-error enter options must use a valid navigationUI value
				fullscreen.enter({ navigationUI: "minimal" });
			});
		});
	});

	it("types gamepad controls and snapshots", () => {
		typeOnly(() => {
			const actuator: UseGamepadHapticActuatorLike = {
				playEffect: async () => undefined,
				reset: async () => undefined,
			};
			const button: UseGamepadButtonLike = {
				pressed: true,
				touched: true,
				value: 1,
			};
			const rawGamepad: UseGamepadGamepadLike = {
				axes: [0, 1],
				buttons: [button],
				connected: true,
				hapticActuators: [actuator],
				id: "pad",
				index: 0,
				mapping: "standard",
				timestamp: 1,
				vibrationActuator: actuator,
			};
			const navigatorTarget: UseGamepadNavigatorLike = {
				getGamepads: () => [rawGamepad],
			};
			const windowTarget = Object.assign(new EventTarget(), {
				cancelAnimationFrame: (_handle: number) => {},
				navigator: navigatorTarget,
				requestAnimationFrame: (_callback: FrameRequestCallback) => 1,
			}) as UseGamepadWindowLike;
			const options: UseGamepadOptions<
				UseGamepadNavigatorLike,
				UseGamepadWindowLike
			> = {
				immediate: false,
				navigator: signal(navigatorTarget),
				window: signal(windowTarget),
			};
			const gamepad = useGamepad(options);
			const gamepadReturn: UseGamepadReturn = gamepad;

			expectTypeOf(gamepad).toEqualTypeOf<UseGamepadReturn>();
			expectTypeOf(gamepadReturn.gamepads).toEqualTypeOf<
				ReadonlySignal<readonly UseGamepadGamepadSnapshot[]>
			>();
			expectTypeOf(gamepad.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(gamepad.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(gamepad.pause()).toEqualTypeOf<void>();
			expectTypeOf(gamepad.resume()).toEqualTypeOf<void>();
			expectTypeOf(gamepad.stop()).toEqualTypeOf<void>();
			gamepad.onConnected((index) => {
				expectTypeOf(index).toEqualTypeOf<number>();
			});
			gamepad.onDisconnected((index) => {
				expectTypeOf(index).toEqualTypeOf<number>();
			});
			typeOnly(() => {
				// @ts-expect-error gamepads is readonly
				gamepad.gamepads.value = [];
				useGamepad({
					// @ts-expect-error navigator must expose getGamepads()
					navigator: {},
				});
				useGamepad({
					// @ts-expect-error window must be EventTarget-like
					window: { navigator: navigatorTarget },
				});
				useGamepad({
					// @ts-expect-error immediate must be boolean
					immediate: "yes",
				});
			});
		});
	});

	it("types geolocation controls and snapshots", () => {
		typeOnly(() => {
			const coordinates: UseGeolocationCoordinates = {
				accuracy: 1,
				altitude: null,
				altitudeAccuracy: null,
				heading: null,
				latitude: 35,
				longitude: 139,
				speed: null,
			};
			const geolocationTarget: UseGeolocationGeolocationLike = {
				clearWatch: (_watchId: number) => {},
				watchPosition: (
					_successCallback: PositionCallback,
					_errorCallback?: PositionErrorCallback | null,
					_options?: PositionOptions,
				) => 1,
			};
			const navigatorTarget: UseGeolocationNavigatorLike = {
				geolocation: geolocationTarget,
			};
			const position: UseGeolocationPositionLike = {
				coords: coordinates,
				timestamp: 1000,
			};
			const options: UseGeolocationOptions<UseGeolocationNavigatorLike> = {
				enableHighAccuracy: true,
				immediate: false,
				maximumAge: 1000,
				navigator: signal(navigatorTarget),
				timeout: 500,
			};
			const geolocation = useGeolocation(options);
			const geolocationReturn: UseGeolocationReturn = geolocation;

			expectTypeOf(geolocation).toEqualTypeOf<UseGeolocationReturn>();
			expectTypeOf(geolocationReturn.coords).toEqualTypeOf<
				ReadonlySignal<UseGeolocationCoordinates | null>
			>();
			expectTypeOf(geolocation.locatedAt).toEqualTypeOf<
				ReadonlySignal<number | null>
			>();
			expectTypeOf(geolocation.error).toEqualTypeOf<
				ReadonlySignal<GeolocationPositionError | null>
			>();
			expectTypeOf(geolocation.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(geolocation.isActive).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(geolocation.resume()).toEqualTypeOf<void>();
			expectTypeOf(geolocation.pause()).toEqualTypeOf<void>();
			expectTypeOf(geolocation.stop()).toEqualTypeOf<void>();
			expectTypeOf(coordinates.latitude).toEqualTypeOf<number>();
			expectTypeOf(position.timestamp).toEqualTypeOf<number>();
			typeOnly(() => {
				// @ts-expect-error coords is readonly
				geolocation.coords.value = null;
				useGeolocation({
					// @ts-expect-error navigator must expose geolocation controls
					navigator: { geolocation: {} },
				});
				useGeolocation({
					// @ts-expect-error immediate must be boolean
					immediate: "yes",
				});
			});
		});
	});

	it("types idle tracking controls", () => {
		typeOnly(() => {
			const idleDocument = Object.assign(new EventTarget(), {
				hidden: false,
				label: "document",
			}) as IdleDocument;
			const idleWindow = Object.assign(new EventTarget(), {
				document: idleDocument,
				label: "window",
			}) as IdleWindow;
			const eventName: UseIdleEventName = "mousemove";
			const options: UseIdleOptions<IdleWindow> = {
				events: [eventName, "keydown"],
				immediate: false,
				initialState: true,
				listenForVisibilityChange: true,
				window: signal(idleWindow),
			};
			const idle = useIdle(1000, options);
			const idleReturn: UseIdleReturn = idle;

			expectTypeOf(idle).toEqualTypeOf<UseIdleReturn>();
			expectTypeOf(idleReturn.idle).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(idle.lastActive).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(idle.isPending).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(idle.reset()).toEqualTypeOf<void>();
			expectTypeOf(idle.start()).toEqualTypeOf<void>();
			expectTypeOf(idle.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error idle is readonly
				idle.idle.value = false;
				useIdle(1000, {
					// @ts-expect-error events must be window event names
					events: ["unknown-event"],
				});
				useIdle(1000, {
					// @ts-expect-error immediate must be boolean
					immediate: "yes",
				});
			});
		});
	});

	it("types image loading controls", () => {
		typeOnly(() => {
			const imageWindow = Object.assign(new EventTarget(), {
				Image: class {},
				label: "window",
			}) as ImageWindow;
			const options: UseImageOptions = {
				alt: "Avatar",
				class: "avatar",
				crossorigin: "anonymous",
				decoding: "async",
				fetchPriority: "high",
				height: 64,
				ismap: true,
				loading: "lazy",
				referrerPolicy: "no-referrer",
				sizes: "64px",
				src: "/avatar.png",
				srcset: "/avatar@2x.png 2x",
				usemap: "#avatar-map",
				width: 64,
			};
			const asyncOptions: UseImageAsyncStateOptions<ImageWindow> = {
				immediate: false,
				resetOnExecute: true,
				window: signal(imageWindow),
			};
			const image = useImage(options, asyncOptions);
			const imageReturn: UseImageReturn = image;

			expectTypeOf(image).toEqualTypeOf<UseImageReturn>();
			expectTypeOf(imageReturn.state).toEqualTypeOf<
				ReadonlySignal<HTMLImageElement | undefined>
			>();
			expectTypeOf(image.isReady).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(image.isLoading).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(image.error).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(image.execute()).toEqualTypeOf<
				Promise<HTMLImageElement | undefined>
			>();
			expectTypeOf(image.executeImmediate()).toEqualTypeOf<
				Promise<HTMLImageElement | undefined>
			>();
			typeOnly(() => {
				// @ts-expect-error state is readonly
				image.state.value = undefined;
				// @ts-expect-error src is required
				useImage({ alt: "missing source" });
				useImage(options, {
					// @ts-expect-error window must expose Image constructor
					window: new EventTarget(),
				});
			});
		});
	});

	it("types infinite scroll controls", () => {
		typeOnly(() => {
			const element = document.createElement("div");
			const infiniteWindow = Object.assign(new EventTarget(), {
				IntersectionObserver,
				getComputedStyle: () => document.body.style,
				label: "window",
			}) as InfiniteScrollWindow;
			const direction: UseInfiniteScrollDirection = "bottom";
			const options: UseInfiniteScrollOptions<
				HTMLElement,
				InfiniteScrollWindow
			> = {
				canLoadMore: (target) => target.scrollHeight > 0,
				direction,
				distance: 16,
				eventListenerOptions: { passive: true },
				idle: 200,
				interval: 100,
				offset: { bottom: 16 },
				onError: (error) => {
					expectTypeOf(error).toEqualTypeOf<unknown>();
				},
				onScroll: (event) => {
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				onStop: (event) => {
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				throttle: 50,
				window: signal(infiniteWindow),
			};
			const infinite = useInfiniteScroll(
				element,
				(state) => {
					const scrollState: UseInfiniteScrollState = state;
					const arrived: UseInfiniteScrollArrivedState =
						scrollState.arrivedState.value;
					const directions: UseInfiniteScrollDirections =
						scrollState.directions.value;

					expectTypeOf(scrollState.x).toEqualTypeOf<ReadonlySignal<number>>();
					expectTypeOf(scrollState.y).toEqualTypeOf<ReadonlySignal<number>>();
					expectTypeOf(scrollState.isScrolling).toEqualTypeOf<
						ReadonlySignal<boolean>
					>();
					expectTypeOf(arrived.bottom).toEqualTypeOf<boolean>();
					expectTypeOf(directions.top).toEqualTypeOf<boolean>();
					expectTypeOf(scrollState.measure()).toEqualTypeOf<void>();
				},
				options,
			);
			const infiniteReturn: UseInfiniteScrollReturn = infinite;

			expectTypeOf(infinite).toEqualTypeOf<UseInfiniteScrollReturn>();
			expectTypeOf(infiniteReturn.isLoading).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(infinite.error).toEqualTypeOf<
				ReadonlySignal<unknown | undefined>
			>();
			expectTypeOf(infinite.reset()).toEqualTypeOf<void>();
			expectTypeOf(infinite.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error isLoading is readonly
				infinite.isLoading.value = true;
				useInfiniteScroll(element, () => {}, {
					// @ts-expect-error direction must be one of the supported edges
					direction: "middle",
				});
			});
		});
	});

	it("types scroll controls", () => {
		typeOnly(() => {
			const element = document.createElement("div");
			const scrollDocument = Object.assign(document, {
				label: "document",
			}) as ScrollDocument;
			const scrollWindow = Object.assign(new EventTarget(), {
				MutationObserver,
				document: scrollDocument,
				getComputedStyle: () => document.body.style,
				label: "window",
				scrollTo: (_options?: ScrollToOptions) => {},
			}) as ScrollWindow;
			const direction: UseScrollDirection = "bottom";
			const options: UseScrollOptions<HTMLElement, ScrollWindow> = {
				behavior: computed(() => "smooth" as ScrollBehavior),
				eventListenerOptions: { passive: true },
				idle: 200,
				offset: { [direction]: 16 },
				onError: (error) => {
					expectTypeOf(error).toEqualTypeOf<unknown>();
				},
				onScroll: (event) => {
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				onStop: (event) => {
					expectTypeOf(event).toEqualTypeOf<Event>();
				},
				observe: { mutation: true },
				throttle: 50,
				window: signal(scrollWindow),
			};
			const scroll = useScroll(element, options);
			const documentScroll = useScroll(scrollDocument, {
				window: scrollWindow,
			});
			const windowScrollOptions: UseWindowScrollOptions<ScrollWindow> = {
				behavior: "smooth",
				throttle: 16,
				window: signal(scrollWindow),
			};
			const windowScroll = useWindowScroll(windowScrollOptions);
			const arrived: UseScrollArrivedState = scroll.arrivedState.value;
			const directions: UseScrollDirections = scroll.directions.value;
			const scrollReturn: UseScrollReturn = scroll;
			const windowScrollReturn: UseWindowScrollReturn = windowScroll;

			expectTypeOf(scroll).toEqualTypeOf<UseScrollReturn>();
			expectTypeOf(scrollReturn.x).toEqualTypeOf<Computed<number>>();
			expectTypeOf(scroll.y).toEqualTypeOf<Computed<number>>();
			expectTypeOf(scroll.isScrolling).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(arrived.bottom).toEqualTypeOf<boolean>();
			expectTypeOf(directions.top).toEqualTypeOf<boolean>();
			expectTypeOf(scroll.measure()).toEqualTypeOf<void>();
			expectTypeOf(scroll.scrollTo()).toEqualTypeOf<void>();
			expectTypeOf(scroll.scrollTo({ left: 1, top: 2 })).toEqualTypeOf<void>();
			expectTypeOf(scroll.stop()).toEqualTypeOf<void>();
			expectTypeOf(documentScroll).toEqualTypeOf<UseScrollReturn>();
			expectTypeOf(windowScrollReturn).toEqualTypeOf<UseWindowScrollReturn>();
			expectTypeOf(windowScroll.x).toEqualTypeOf<Computed<number>>();
			expectTypeOf(windowScroll.y).toEqualTypeOf<Computed<number>>();
			expectTypeOf(windowScroll.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				scroll.x.value = 10;
				scroll.y.value = 20;
				windowScroll.x.value = 30;
				windowScroll.y.value = 40;
				// @ts-expect-error isScrolling is readonly
				scroll.isScrolling.value = true;
				useScroll(element, {
					// @ts-expect-error behavior must be a scroll behavior
					behavior: "slow",
				});
				useWindowScroll({
					// @ts-expect-error behavior must be a scroll behavior
					behavior: "slow",
				});
				useScroll(element, {
					// @ts-expect-error offset keys must be scroll edges
					offset: { middle: 16 },
				});
			});
		});
	});

	it("types scroll lock controls", () => {
		typeOnly(() => {
			const element = document.createElement("div");
			const target = signal<UseScrollLockElement>(element);
			const scrollLockWindow = Object.assign(new EventTarget(), {
				document,
				getComputedStyle: (_element: Element) => document.body.style,
				label: "window",
				navigator: {
					maxTouchPoints: 1,
					platform: "iPhone",
					userAgent: "",
				},
			}) as UseScrollLockWindowLike;
			const options: UseScrollLockOptions<typeof scrollLockWindow> = {
				window: signal(scrollLockWindow),
			};
			const scrollLock = useScrollLock(target, true, options);
			const scrollLockReturn: UseScrollLockReturn = scrollLock;

			expectTypeOf(scrollLock).toEqualTypeOf<UseScrollLockReturn>();
			expectTypeOf(scrollLockReturn.value).toEqualTypeOf<boolean>();
			expectTypeOf(scrollLock.stop()).toEqualTypeOf<void>();
			scrollLock.value = false;
			useScrollLock(document, false, { window: scrollLockWindow });
			useScrollLock(scrollLockWindow, false, { window: null });
			typeOnly(() => {
				// @ts-expect-error target must be element, document, window, or nullish
				useScrollLock(1);
				// @ts-expect-error initialState must be boolean
				useScrollLock(element, "true");
				useScrollLock(element, false, {
					// @ts-expect-error window must be window-like or nullish
					window: 1,
				});
			});
		});
	});

	it("types speech recognition controls", () => {
		typeOnly(() => {
			class TypedSpeechRecognition
				extends EventTarget
				implements SpeechRecognitionLike
			{
				continuous = true;
				interimResults = true;
				lang = "en-US";
				maxAlternatives = 1;
				start(): void {}
				stop(): void {}
				abort(): void {}
			}

			const SpeechRecognitionCtor: SpeechRecognitionConstructorLike<TypedSpeechRecognition> =
				TypedSpeechRecognition;
			const speechAlternative: SpeechRecognitionAlternativeLike = {
				confidence: 1,
				transcript: "hello",
			};
			const speechResult: SpeechRecognitionResultLike = {
				0: speechAlternative,
				isFinal: true,
				item: () => speechAlternative,
				length: 1,
			};
			const speechResultList: SpeechRecognitionResultListLike = {
				0: speechResult,
				item: () => speechResult,
				length: 1,
			};
			const speechEvent = Object.assign(new Event("result"), {
				resultIndex: 0,
				results: speechResultList,
			}) satisfies SpeechRecognitionEventLike;
			const speechErrorEvent = Object.assign(new Event("error"), {
				error: "network" as SpeechRecognitionErrorCode,
				message: "failed",
			}) satisfies SpeechRecognitionErrorEventLike;
			const speechWindow = Object.assign(new EventTarget(), {
				webkitSpeechRecognition: SpeechRecognitionCtor,
			}) as UseSpeechRecognitionWindowLike<TypedSpeechRecognition>;
			const windowOptions: UseSpeechRecognitionWindowOptions<
				typeof speechWindow
			> = {
				window: signal(speechWindow),
			};
			const options: UseSpeechRecognitionOptions<TypedSpeechRecognition> = {
				continuous: false,
				interimResults: true,
				lang: signal("ja-JP"),
				maxAlternatives: 2,
				window: signal(speechWindow),
			};
			const speech = useSpeechRecognition(options);
			const directSpeech = useSpeechRecognition({
				lang: signal("en-US"),
				window: signal(speechWindow),
			});
			const windowOptionsSpeech = useSpeechRecognition(windowOptions);
			const fallback = useSpeechRecognition({ window: null });
			const speechReturn: UseSpeechRecognitionReturn<TypedSpeechRecognition> =
				speech;

			expectTypeOf(speech).toEqualTypeOf<
				UseSpeechRecognitionReturn<TypedSpeechRecognition>
			>();
			expectTypeOf(speechReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(speech.isListening).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(speech.isFinal).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(speech.recognition).toEqualTypeOf<
				ReadonlySignal<TypedSpeechRecognition | undefined>
			>();
			expectTypeOf(directSpeech.recognition).toEqualTypeOf<
				ReadonlySignal<TypedSpeechRecognition | undefined>
			>();
			expectTypeOf(windowOptionsSpeech.recognition).toEqualTypeOf<
				ReadonlySignal<TypedSpeechRecognition | undefined>
			>();
			expectTypeOf<
				SpeechRecognitionForWindow<typeof speechWindow>
			>().toEqualTypeOf<TypedSpeechRecognition>();
			expectTypeOf(speech.result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(speech.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(speech.start()).toEqualTypeOf<void>();
			expectTypeOf(speech.stop()).toEqualTypeOf<void>();
			expectTypeOf(speech.abort()).toEqualTypeOf<void>();
			expectTypeOf(speech.toggle()).toEqualTypeOf<void>();
			expectTypeOf(speech.toggle(true)).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseSpeechRecognitionReturn>();
			expectTypeOf(
				speechEvent.results,
			).toEqualTypeOf<SpeechRecognitionResultListLike>();
			expectTypeOf(
				speechErrorEvent.error,
			).toEqualTypeOf<SpeechRecognitionErrorCode>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				speech.result.value = "next";
				// @ts-expect-error continuous must be boolean
				useSpeechRecognition({ continuous: "true" });
				// @ts-expect-error lang must resolve to string
				useSpeechRecognition({ lang: 1 });
				useSpeechRecognition({
					// @ts-expect-error window must be window-like or nullish
					window: 1,
				});
				// @ts-expect-error toggle value must be boolean
				speech.toggle("true");
			});
		});
	});

	it("types speech synthesis controls", () => {
		typeOnly(() => {
			interface TypedSpeechSynthesisVoice extends SpeechSynthesisVoiceLike {
				readonly id: string;
			}

			class TypedSpeechSynthesisUtterance
				extends EventTarget
				implements SpeechSynthesisUtteranceLike<TypedSpeechSynthesisVoice>
			{
				lang = "";
				pitch = 1;
				rate = 1;
				text = "";
				voice: TypedSpeechSynthesisVoice | null = null;
				volume = 1;
			}

			class TypedSpeechSynthesis
				extends EventTarget
				implements
					SpeechSynthesisLike<
						TypedSpeechSynthesisVoice,
						TypedSpeechSynthesisUtterance
					>
			{
				readonly paused = false;
				readonly pending = false;
				readonly speaking = false;
				cancel(): void {}
				getVoices(): ArrayLike<TypedSpeechSynthesisVoice> {
					return [];
				}
				pause(): void {}
				resume(): void {}
				speak(utterance: TypedSpeechSynthesisUtterance): void {
					expectTypeOf(
						utterance,
					).toEqualTypeOf<TypedSpeechSynthesisUtterance>();
				}
			}

			const voice: TypedSpeechSynthesisVoice = {
				default: true,
				id: "typed",
				lang: "en-US",
				localService: true,
				name: "Typed",
				voiceURI: "typed",
			};
			const SpeechSynthesisUtteranceCtor: SpeechSynthesisUtteranceConstructorLike<
				TypedSpeechSynthesisVoice,
				TypedSpeechSynthesisUtterance
			> = TypedSpeechSynthesisUtterance;
			const speechWindow = Object.assign(new EventTarget(), {
				SpeechSynthesisUtterance: SpeechSynthesisUtteranceCtor,
				speechSynthesis: new TypedSpeechSynthesis(),
			}) as UseSpeechSynthesisWindowLike<
				TypedSpeechSynthesisVoice,
				TypedSpeechSynthesisUtterance,
				TypedSpeechSynthesis
			>;
			const windowOptions: UseSpeechSynthesisWindowOptions<
				typeof speechWindow
			> = {
				window: signal(speechWindow),
			};
			const options: UseSpeechSynthesisOptions<
				TypedSpeechSynthesisVoice,
				TypedSpeechSynthesisUtterance
			> = {
				lang: signal("ja-JP"),
				onBoundary: (event) => {
					expectTypeOf(event).toEqualTypeOf<
						SpeechSynthesisEventLike<TypedSpeechSynthesisUtterance>
					>();
				},
				pitch: signal(1.2),
				rate: signal(0.9),
				voice: signal(voice),
				volume: signal(0.8),
				window: signal(speechWindow),
			};
			interface OtherSpeechSynthesisVoice extends SpeechSynthesisVoiceLike {
				readonly otherId: string;
			}

			const otherVoice: OtherSpeechSynthesisVoice = {
				default: false,
				lang: "en-US",
				localService: false,
				name: "Other",
				otherId: "other",
				voiceURI: "other",
			};
			const mismatchedVoiceOptions: UseSpeechSynthesisOptions<
				TypedSpeechSynthesisVoice,
				TypedSpeechSynthesisUtterance
			> = {
				// @ts-expect-error voice must match the utterance voice type
				voice: signal(otherVoice),
				window: signal(speechWindow),
			};
			const speech = useSpeechSynthesis(signal("hello"), options);
			const directSpeech = useSpeechSynthesis("hello", {
				window: signal(speechWindow),
			});
			const windowOptionsSpeech = useSpeechSynthesis("hello", windowOptions);
			const fallback = useSpeechSynthesis("hello", { window: null });
			const speechReturn: UseSpeechSynthesisReturn<
				TypedSpeechSynthesisVoice,
				TypedSpeechSynthesisUtterance
			> = speech;
			const speechEvent = Object.assign(new Event("boundary"), {
				charIndex: 0,
				charLength: 5,
				elapsedTime: 1,
				name: "word",
				utterance: new TypedSpeechSynthesisUtterance(),
			}) satisfies SpeechSynthesisEventLike<TypedSpeechSynthesisUtterance>;
			const speechErrorEvent = Object.assign(speechEvent, {
				error: "network" as SpeechSynthesisErrorCode,
			}) satisfies SpeechSynthesisErrorEventLike<TypedSpeechSynthesisUtterance>;
			mismatchedVoiceOptions;
			expectTypeOf(speech).toEqualTypeOf<
				UseSpeechSynthesisReturn<
					TypedSpeechSynthesisVoice,
					TypedSpeechSynthesisUtterance
				>
			>();
			expectTypeOf(speechReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(speech.isPlaying).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(speech.status).toEqualTypeOf<
				ReadonlySignal<SpeechSynthesisStatus>
			>();
			expectTypeOf(speech.utterance).toEqualTypeOf<
				ReadonlySignal<TypedSpeechSynthesisUtterance | undefined>
			>();
			expectTypeOf(directSpeech.utterance).toEqualTypeOf<
				ReadonlySignal<TypedSpeechSynthesisUtterance | undefined>
			>();
			expectTypeOf(windowOptionsSpeech.utterance).toEqualTypeOf<
				ReadonlySignal<TypedSpeechSynthesisUtterance | undefined>
			>();
			expectTypeOf<
				SpeechSynthesisForWindow<typeof speechWindow>
			>().toEqualTypeOf<TypedSpeechSynthesis>();
			expectTypeOf<
				SpeechSynthesisUtteranceForWindow<typeof speechWindow>
			>().toEqualTypeOf<TypedSpeechSynthesisUtterance>();
			expectTypeOf<
				SpeechSynthesisVoiceForWindow<typeof speechWindow>
			>().toEqualTypeOf<TypedSpeechSynthesisVoice>();
			expectTypeOf(speech.error).toEqualTypeOf<
				ReadonlySignal<unknown | null>
			>();
			expectTypeOf(speech.voices).toEqualTypeOf<
				ReadonlySignal<readonly TypedSpeechSynthesisVoice[]>
			>();
			expectTypeOf(speech.speak()).toEqualTypeOf<void>();
			expectTypeOf(speech.cancel()).toEqualTypeOf<void>();
			expectTypeOf(speech.stop()).toEqualTypeOf<void>();
			expectTypeOf(speech.toggle()).toEqualTypeOf<void>();
			expectTypeOf(speech.toggle(true)).toEqualTypeOf<void>();
			expectTypeOf(speech.pause()).toEqualTypeOf<void>();
			expectTypeOf(speech.resume()).toEqualTypeOf<void>();
			expectTypeOf(fallback).toEqualTypeOf<UseSpeechSynthesisReturn>();
			expectTypeOf<SpeechSynthesisStatus>().toEqualTypeOf<
				"init" | "play" | "pause" | "end"
			>();
			expectTypeOf(
				speechErrorEvent.error,
			).toEqualTypeOf<SpeechSynthesisErrorCode>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				speech.status.value = "end";
				// @ts-expect-error text must resolve to string
				useSpeechSynthesis(1);
				// @ts-expect-error pitch must resolve to number
				useSpeechSynthesis("hello", { pitch: "high" });
				useSpeechSynthesis("hello", {
					// @ts-expect-error window must be window-like or nullish
					window: 1,
				});
				// @ts-expect-error toggle value must be boolean
				speech.toggle("true");
			});
		});
	});

	it("types share controls", () => {
		typeOnly(() => {
			const file = new File(["content"], "content.txt");
			const shareData: UseShareData = {
				files: [file] as const,
				text: "",
				title: "Title",
				url: "https://example.com",
			};
			const shareNavigator = {
				canShare: (data?: UseShareData) => {
					expectTypeOf(data).toEqualTypeOf<UseShareData | undefined>();
					return true;
				},
				share: async (data?: UseShareData) => {
					expectTypeOf(data).toEqualTypeOf<UseShareData | undefined>();
				},
			} satisfies UseShareNavigatorLike;
			const options: UseShareOptions<typeof shareNavigator> = {
				navigator: signal(shareNavigator),
			};
			const share = useShare(signal(shareData), options);
			const shareReturn: UseShareReturn = share;

			expectTypeOf(share).toEqualTypeOf<UseShareReturn>();
			expectTypeOf(shareReturn.isSupported.value).toEqualTypeOf<boolean>();
			expectTypeOf(share.canShare()).toEqualTypeOf<boolean>();
			expectTypeOf(
				share.canShare({ text: "override" }),
			).toEqualTypeOf<boolean>();
			expectTypeOf(share.share()).toEqualTypeOf<Promise<void>>();
			expectTypeOf(share.share({ files: [file] })).toEqualTypeOf<
				Promise<void>
			>();
			expectTypeOf(share.stop()).toEqualTypeOf<void>();
			useShare(null, { navigator: null });
			typeOnly(() => {
				useShare({
					// @ts-expect-error files must be File values
					files: ["file"],
				});
				useShare({
					// @ts-expect-error title must be a string
					title: 1,
				});
				useShare(shareData, {
					// @ts-expect-error navigator must be navigator-like or nullish
					navigator: 1,
				});
			});
		});
	});

	it("types intersection observer controls", () => {
		typeOnly(() => {
			const first = document.createElement("div");
			const second = document.createElement("section");
			const root = document.createElement("main");
			const observerWindow = Object.assign(new EventTarget(), {
				IntersectionObserver,
				label: "window",
			}) as IntersectionObserverWindow;
			const target: UseIntersectionObserverTarget<HTMLElement> = [
				first,
				null,
				second,
			];
			const options: UseIntersectionObserverOptions<IntersectionObserverWindow> =
				{
					immediate: false,
					root: signal(root),
					rootMargin: signal("0px"),
					threshold: signal([0, 0.5, 1]),
					window: signal(observerWindow),
				};
			const observer = useIntersectionObserver(
				target,
				(entries, intersectionObserver) => {
					expectTypeOf(entries).toEqualTypeOf<IntersectionObserverEntry[]>();
					expectTypeOf(
						intersectionObserver,
					).toEqualTypeOf<IntersectionObserver>();
				},
				options,
			);
			const observerReturn: UseIntersectionObserverReturn = observer;

			expectTypeOf(observer).toEqualTypeOf<UseIntersectionObserverReturn>();
			expectTypeOf(observerReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(observer.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(observer.pause()).toEqualTypeOf<void>();
			expectTypeOf(observer.resume()).toEqualTypeOf<void>();
			expectTypeOf(observer.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error isActive is readonly
				observer.isActive.value = false;
				useIntersectionObserver(first, () => {}, {
					// @ts-expect-error immediate must be boolean
					immediate: "yes",
				});
				useIntersectionObserver(first, () => {}, {
					// @ts-expect-error rootMargin must be a string when provided
					rootMargin: 10,
				});
			});
		});
	});

	it("accepts ResizeObserver windows for element size", () => {
		const resizeWindow = new EventTarget() as ResizeWindow;
		const options: UseElementSizeOptions<ResizeWindow> = {
			box: "border-box",
			window: signal(resizeWindow),
		};
		const size = useElementSize(
			document.createElement("div"),
			undefined,
			options,
		);

		expectTypeOf(size.width.value).toEqualTypeOf<number>();
		size.stop();
	});

	it("types element bounding values and options", () => {
		typeOnly(() => {
			const boundingWindow = new EventTarget() as BoundingWindow;
			const timing: UseElementBoundingUpdateTiming = "next-frame";
			const options: UseElementBoundingOptions<BoundingWindow> = {
				immediate: true,
				reset: true,
				updateTiming: timing,
				window: signal(boundingWindow),
				windowResize: true,
				windowScroll: true,
			};
			const bounds = useElementBounding(
				signal(document.createElement("div")),
				options,
			);
			const boundsReturn: UseElementBoundingReturn = bounds;

			expectTypeOf(bounds).toEqualTypeOf<UseElementBoundingReturn>();
			expectTypeOf(boundsReturn.width).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.height).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.top).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.right).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.bottom).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.left).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.x).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.y).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(bounds.update()).toEqualTypeOf<void>();
			expectTypeOf(bounds.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				bounds.width.value = 1;
				useElementBounding(document.createElement("div"), {
					// @ts-expect-error updateTiming must be a known value
					updateTiming: "later",
				});
				useElementBounding(document.createElement("div"), {
					// @ts-expect-error windowResize must be boolean
					windowResize: "true",
				});
			});
		});
	});

	it("types element by point values and options", () => {
		typeOnly(() => {
			const pointDocument = new EventTarget() as PointDocument;
			const pointWindow = new EventTarget() as PointWindow;
			const interval: UseElementByPointInterval = signal(16);
			const scheduler: UseElementByPointScheduler = (_callback) => ({
				isActive: readonly(signal(false)),
				pause() {},
				resume() {},
			});
			const options: UseElementByPointOptions<
				false,
				PointDocument,
				PointWindow
			> = {
				document: signal(pointDocument),
				immediate: false,
				interval,
				scheduler,
				window: signal(pointWindow),
				x: signal(1),
				y: signal(2),
			};
			const single = useElementByPoint(options);
			const multiple = useElementByPoint<true, HTMLButtonElement>({
				document: pointDocument,
				multiple: true,
				x: 1,
				y: 2,
			});
			const dynamic = useElementByPoint<boolean, HTMLButtonElement>({
				document: pointDocument,
				multiple: signal<boolean>(false),
				x: 1,
				y: 2,
			});
			const singleReturn: UseElementByPointReturn = single;
			const elementValue: UseElementByPointElement<true, HTMLButtonElement> = [
				document.createElement("button"),
			];

			expectTypeOf(elementValue).toMatchTypeOf<
				UseElementByPointElement<true, HTMLButtonElement>
			>();
			expectTypeOf(single).toEqualTypeOf<UseElementByPointReturn>();
			expectTypeOf(singleReturn.element).toEqualTypeOf<
				ReadonlySignal<Element | null>
			>();
			expectTypeOf(single.isSupported).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(single.isActive).toEqualTypeOf<ReadonlySignal<boolean>>();
			expectTypeOf(single.pause()).toEqualTypeOf<void>();
			expectTypeOf(single.resume()).toEqualTypeOf<void>();
			expectTypeOf(single.update()).toEqualTypeOf<void>();
			expectTypeOf(single.stop()).toEqualTypeOf<void>();
			expectTypeOf(multiple.element).toEqualTypeOf<
				ReadonlySignal<readonly HTMLButtonElement[]>
			>();
			expectTypeOf(dynamic.element).toEqualTypeOf<
				ReadonlySignal<HTMLButtonElement | readonly HTMLButtonElement[] | null>
			>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				single.element.value = null;
				useElementByPoint({
					// @ts-expect-error x must be numeric
					x: "1",
					y: 2,
				});
				useElementByPoint({
					// @ts-expect-error multiple must be boolean
					multiple: "true",
					x: 1,
					y: 2,
				});
				useElementByPoint({
					// @ts-expect-error interval must be numeric or requestAnimationFrame
					interval: "slow",
					x: 1,
					y: 2,
				});
			});
		});
	});

	it("types element hover values and options", () => {
		typeOnly(() => {
			const hoverDocument: HoverDocument = Object.assign(
				document.createElement("div"),
				{ label: "root" },
			);
			const hoverWindow = new EventTarget() as HoverWindow;
			const target = signal<Element | null>(document.createElement("button"));
			const options: UseElementHoverOptions<HoverWindow, HoverDocument> = {
				delayEnter: signal(10),
				delayLeave: signal(20),
				document: signal(hoverDocument),
				triggerOnRemoval: true,
				window: signal(hoverWindow),
			};
			const hover = useElementHover(target, options);
			const hoverReturn: UseElementHoverReturn = hover;

			expectTypeOf(hover).toEqualTypeOf<UseElementHoverReturn>();
			expectTypeOf(hoverReturn.isHovered).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(hover.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				hover.isHovered.value = true;
				useElementHover(target, {
					// @ts-expect-error delayEnter must be numeric
					delayEnter: "10",
				});
				// @ts-expect-error target must be an Element
				useElementHover(new EventTarget());
			});
		});
	});

	it("types element visibility values and options", () => {
		typeOnly(() => {
			const visibilityWindow = new EventTarget() as VisibilityWindow;
			const root = signal<Element | Document | null>(
				document.createElement("main"),
			);
			const target = signal<Element | null>(document.createElement("section"));
			const options: UseElementVisibilityOptions<VisibilityWindow> = {
				initialValue: true,
				once: false,
				root,
				rootMargin: signal("0px 0px 100px 0px"),
				threshold: signal([0, 0.5, 1]),
				window: signal(visibilityWindow),
			};
			const visibility = useElementVisibility(target, options);
			const visibilityReturn: UseElementVisibilityReturn = visibility;

			expectTypeOf(visibility).toEqualTypeOf<UseElementVisibilityReturn>();
			expectTypeOf(visibilityReturn.isVisible).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(visibilityReturn.isSupported).toEqualTypeOf<
				ReadonlySignal<boolean>
			>();
			expectTypeOf(visibility.stop()).toEqualTypeOf<void>();
			typeOnly(() => {
				// @ts-expect-error returned values are readonly signals
				visibility.isVisible.value = true;
				// @ts-expect-error returned values are readonly signals
				visibility.isSupported.value = true;
				useElementVisibility(target, {
					// @ts-expect-error once must be boolean
					once: "true",
				});
				useElementVisibility(target, {
					// @ts-expect-error threshold must be numeric or numeric array
					threshold: "1",
				});
				useElementVisibility(target, {
					// @ts-expect-error root must be an Element or Document
					root: new EventTarget(),
				});
				// @ts-expect-error target must be an Element
				useElementVisibility(new EventTarget());
			});
		});
	});

	it("types to number values and options", () => {
		typeOnly(() => {
			const source = signal<string | number>("123.4");
			const options: UseToNumberOptions = {
				method: (value) => {
					expectTypeOf(value).toEqualTypeOf<string | number>();
					return Number(value);
				},
				nanToZero: true,
				radix: 10,
			};
			const result = useToNumber(source, options);
			const rawResult = useToNumber(123.4);
			const getterResult = useToNumber(() => source.value, {
				method: "parseInt",
				radix: 10,
			});
			const computedResult = useToNumber(computed(() => source.value));

			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(rawResult).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(getterResult).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(computedResult).toEqualTypeOf<ReadonlySignal<number>>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error source must resolve to a string or number
			useToNumber(true);
			useToNumber("1", {
				// @ts-expect-error method must be parseFloat, parseInt, or a callback
				method: "Number",
			});
			useToNumber("1", {
				// @ts-expect-error radix must be a number
				radix: "10",
			});
			useToNumber("1", {
				// @ts-expect-error nanToZero must be a boolean
				nanToZero: "true",
			});
		});
	});

	it("types to string values", () => {
		typeOnly(() => {
			const source = signal<unknown>(123.4);
			const result = useToString(source);
			const rawResult = useToString({ value: 1 });
			const getterResult = useToString(() => source.value);
			const computedResult = useToString(computed(() => source.value));

			expectTypeOf(result).toEqualTypeOf<UseToStringReturn>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<string>>();
			expectTypeOf(rawResult).toEqualTypeOf<UseToStringReturn>();
			expectTypeOf(getterResult).toEqualTypeOf<UseToStringReturn>();
			expectTypeOf(computedResult).toEqualTypeOf<UseToStringReturn>();
			// @ts-expect-error returned value is readonly
			result.value = "next";
		});
	});

	it("types transition values and options", () => {
		typeOnly(() => {
			const source = signal(0);
			const duration = signal(100);
			const disabled = signal(false);
			const easing: EasingFunction = (value) => value;
			const bezier: CubicBezierPoints = [0.75, 0, 0.25, 1];
			const easingSource = signal<TransitionEasing>(easing);
			const maybeEasing: MaybeTransitionEasing = easingSource;
			const interpolation: InterpolationFunction<string> = (
				from,
				to,
				alpha,
			) => {
				expectTypeOf(from).toEqualTypeOf<string>();
				expectTypeOf(to).toEqualTypeOf<string>();
				expectTypeOf(alpha).toEqualTypeOf<number>();
				return alpha < 0.5 ? from : to;
			};
			const transitionWindow = new EventTarget() as UseTransitionWindowLike;
			const options: UseTransitionOptions<number> = {
				abort: () => false,
				delay: duration,
				disabled,
				duration,
				easing: maybeEasing,
				onFinished() {},
				onStarted() {},
				window: transitionWindow,
			};
			const result = useTransition(source, options);
			const vector = useTransition(signal([0, 1]), { easing });
			const tupleSource = [signal(0), () => 1] as const;
			const tuple = useTransition(tupleSource);
			const word = useTransition("from", { interpolation });
			const transitionOptions: TransitionOptions<number> = {
				duration: 100,
				easing: bezier,
				window: null,
			};
			type TupleVector = UseTransitionVector<typeof tupleSource>;

			expectTypeOf(result).toEqualTypeOf<UseTransitionReturn<number>>();
			expectTypeOf(result).toEqualTypeOf<ReadonlySignal<number>>();
			expectTypeOf(vector).toEqualTypeOf<UseTransitionReturn<number[]>>();
			expectTypeOf(tuple.value[0]).toEqualTypeOf<number>();
			expectTypeOf(tuple.value[1]).toEqualTypeOf<number>();
			expectTypeOf<TupleVector[0]>().toEqualTypeOf<number>();
			expectTypeOf(word).toEqualTypeOf<UseTransitionReturn<string>>();
			expectTypeOf(transition(source, 0, 1, transitionOptions)).toEqualTypeOf<
				Promise<void>
			>();
			expectTypeOf(TransitionPresets.linear).toEqualTypeOf<EasingFunction>();
			expectTypeOf(
				TransitionPresets.easeInOutCubic,
			).toEqualTypeOf<CubicBezierPoints>();
			// @ts-expect-error returned value is readonly
			result.value = 1;
			// @ts-expect-error interpolation must return the source type
			useTransition("from", {
				interpolation: () => 1,
			});
			// @ts-expect-error duration must resolve to a number
			useTransition(source, {
				duration: "fast",
			});
			// @ts-expect-error disabled must resolve to a boolean
			useTransition(source, {
				disabled: "true",
			});
		});
	});

	it("infers custom toggle values", () => {
		const options: UseToggleOptions<"on", "off"> = {
			falsyValue: "off",
			truthyValue: "on",
		};
		const toggle = useToggle("off", options);

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("infers custom toggle values when the initial value is omitted", () => {
		const toggle = useToggle(undefined, {
			falsyValue: "off",
			truthyValue: "on",
		});

		expectTypeOf(toggle.value.value).toEqualTypeOf<"on" | "off">();
	});

	it("requires options for custom toggle values", () => {
		// @ts-expect-error custom values require truthy/falsy options
		useToggle("off");
	});

	it("infers manual ref history snapshots", () => {
		const source = signal(0);
		const history = useManualRefHistory(source);

		expectTypeOf(history.source).toEqualTypeOf(source);
		expectTypeOf(history.history.value).toEqualTypeOf<
			UseRefHistoryRecord<number>[]
		>();

		const serialized = useManualRefHistory(signal({ count: 0 }), {
			dump: JSON.stringify,
			parse: (value: string) => JSON.parse(value) as { count: number },
		});

		expectTypeOf(serialized.history.value[0].snapshot).toEqualTypeOf<string>();
	});

	it("infers ref history shouldCommit values", () => {
		const source = signal(0);
		const history = useRefHistory(source, {
			shouldCommit: (oldValue, newValue) => {
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				expectTypeOf(newValue).toEqualTypeOf<number>();
				return true;
			},
		});

		expectTypeOf(history.isTracking.value).toEqualTypeOf<boolean>();
		history.dispose();
	});

	it("infers debounced ref history options", () => {
		const source = signal(0);
		const delay = signal(100);
		const options: UseDebouncedRefHistoryOptions<number> = {
			debounce: delay,
			shouldCommit: (oldValue, newValue) => {
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				expectTypeOf(newValue).toEqualTypeOf<number>();
				return true;
			},
		};
		const history = useDebouncedRefHistory(source, options);
		const serialized = useDebouncedRefHistory(signal({ count: 0 }), {
			debounce: () => delay.value,
			dump: JSON.stringify,
			parse: (value: string) => JSON.parse(value) as { count: number },
		});

		expectTypeOf(history).toEqualTypeOf<UseDebouncedRefHistoryReturn<number>>();
		expectTypeOf(history.history.value).toEqualTypeOf<
			UseRefHistoryRecord<number>[]
		>();
		expectTypeOf(history.isTracking.value).toEqualTypeOf<boolean>();
		expectTypeOf(serialized).toEqualTypeOf<
			UseDebouncedRefHistoryReturn<{ count: number }, string>
		>();
		expectTypeOf(serialized.history.value[0].snapshot).toEqualTypeOf<string>();
		history.dispose();
		serialized.dispose();

		// @ts-expect-error debounce must be a number-like MaybeValue.
		useDebouncedRefHistory(source, { debounce: "100" });
	});

	it("infers throttled ref history options", () => {
		const source = signal(0);
		const delay = signal(100);
		const options: UseThrottledRefHistoryOptions<number> = {
			shouldCommit: (oldValue, newValue) => {
				expectTypeOf(oldValue).toEqualTypeOf<number | undefined>();
				expectTypeOf(newValue).toEqualTypeOf<number>();
				return true;
			},
			throttle: delay,
			trailing: true,
		};
		const history = useThrottledRefHistory(source, options);
		const serialized = useThrottledRefHistory(signal({ count: 0 }), {
			dump: JSON.stringify,
			parse: (value: string) => JSON.parse(value) as { count: number },
			throttle: () => delay.value,
		});

		expectTypeOf(history).toEqualTypeOf<UseThrottledRefHistoryReturn<number>>();
		expectTypeOf(history.history.value).toEqualTypeOf<
			UseRefHistoryRecord<number>[]
		>();
		expectTypeOf(history.isTracking.value).toEqualTypeOf<boolean>();
		expectTypeOf(serialized).toEqualTypeOf<
			UseThrottledRefHistoryReturn<{ count: number }, string>
		>();
		expectTypeOf(serialized.history.value[0].snapshot).toEqualTypeOf<string>();
		history.dispose();
		serialized.dispose();

		// @ts-expect-error throttle must be a number-like MaybeValue.
		useThrottledRefHistory(source, { throttle: "100" });
		// @ts-expect-error trailing must be a boolean.
		useThrottledRefHistory(source, { trailing: "true" });
	});

	it("types previous values with and without an initial value", () => {
		const source = signal(0);

		typeOnly(() => {
			const previous = usePrevious(source);
			const previousWithInitial = usePrevious(source, 0);

			expectTypeOf(previous.value).toEqualTypeOf<number | undefined>();
			expectTypeOf(previousWithInitial.value).toEqualTypeOf<number>();
			expectTypeOf(previous).toEqualTypeOf<
				ReadonlySignal<number | undefined>
			>();
			expectTypeOf(previousWithInitial).toEqualTypeOf<ReadonlySignal<number>>();
		});
	});

	it("returns removable writable storage signals", () => {
		typeOnly(() => {
			const storage = useStorage("key", 1);
			const asyncStorage = useStorageAsync("key", 1);

			storage.value = 2;
			storage.value = null;
			storage.remove();
			asyncStorage.value = 2;
			asyncStorage.value = null;
			asyncStorage.remove();

			expectTypeOf(storage).toEqualTypeOf<RemovableSignal<number | null>>();
			expectTypeOf(asyncStorage).toEqualTypeOf<UseStorageAsyncReturn<number>>();
		});
	});

	it("keeps default value inference with built-in storage serializers", () => {
		typeOnly(() => {
			const map = useStorage("map", new Map<string, number>(), undefined, {
				serializer: StorageSerializers.map,
			});
			const set = useStorage("set", new Set<string>(), undefined, {
				serializer: StorageSerializers.set,
			});

			expectTypeOf(map).toEqualTypeOf<
				RemovableSignal<Map<string, number> | null>
			>();
			expectTypeOf(set).toEqualTypeOf<RemovableSignal<Set<string> | null>>();

			StorageSerializers.map.write(new Map<string, number>());
			StorageSerializers.set.write(new Set<string>());
			StorageSerializers.array.write([1, 2]);
			StorageSerializers.object.write({ count: 1 });

			expectTypeOf(
				StorageSerializers.map.read<string, number>("[]"),
			).toEqualTypeOf<Map<string, number>>();
			expectTypeOf(StorageSerializers.set.read<string>("[]")).toEqualTypeOf<
				Set<string>
			>();
		});
	});

	it("supports null defaults with explicit storage value types", () => {
		typeOnly(() => {
			const objectSerializer: StorageSerializer<{ count: number }> = {
				read(raw) {
					return JSON.parse(raw) as { count: number };
				},
				write(value) {
					return JSON.stringify(value);
				},
			};
			const asyncObjectSerializer: AsyncStorageSerializer<{ count: number }> =
				objectSerializer;
			const stored = useStorage<{ count: number }>("key", null, undefined, {
				serializer: objectSerializer,
			});
			const asyncStored = useStorageAsync<{ count: number }>(
				"key",
				null,
				undefined,
				{
					serializer: asyncObjectSerializer,
				},
			);

			stored.value = { count: 1 };
			stored.value = null;
			asyncStored.value = { count: 1 };
			asyncStored.value = null;

			expectTypeOf(stored).toEqualTypeOf<
				RemovableSignal<{ count: number } | null>
			>();
			expectTypeOf(asyncStored).toEqualTypeOf<
				UseStorageAsyncReturn<{ count: number }>
			>();
		});
	});

	it("accepts sync storage for async storage", () => {
		typeOnly(() => {
			const syncStorage = {
				getItem: (_key: string) => null,
				removeItem: (_key: string) => {},
				setItem: (_key: string, _value: string) => {},
			};
			const asyncStorage: AsyncStorageLike = syncStorage;
			const options: UseStorageAsyncOptions<string> = {
				onReady(value) {
					expectTypeOf(value).toEqualTypeOf<string | null>();
				},
			};

			const stored = useStorageAsync("async", "value", asyncStorage, options);

			expectTypeOf(stored).toEqualTypeOf<UseStorageAsyncReturn<string>>();
		});
	});

	it("accepts storage window overrides", () => {
		typeOnly(() => {
			const localStorage = {
				getItem: (_key: string) => null,
				removeItem: (_key: string) => {},
				setItem: (_key: string, _value: string) => {},
			};
			const customWindow = new EventTarget() as StorageOnlyWindow;
			Object.defineProperties(customWindow, {
				label: { value: "storage" },
				localStorage: { value: localStorage },
				sessionStorage: { value: localStorage },
			});
			const options: UseStorageOptions<string, StorageOnlyWindow> = {
				window: signal(customWindow),
			};

			useLocalStorage("local", "value", options);
			useSessionStorage("session", "value", options);
		});
	});
});
