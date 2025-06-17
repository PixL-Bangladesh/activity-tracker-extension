import { useState, useEffect } from "react";
import Browser from "webextension-polyfill";
import { ListIcon, Pause, Play, Loader2, RefreshCw } from "lucide-react";
import Channel from "~/utils/channel";
import { LocalDataKey, RecorderStatus, EventName } from "~/types";
import type { LocalData, Session } from "~/types";

import { CircleButton } from "~/components/ui/circle-button";
import { Timer } from "~/components/ui/timer";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import { config } from "~/config";
// Fix the import path - use lowercase 'auth-channel'
import { useAuthChannel, type AuthStatus } from "~/utils/auth-channel";

const RECORD_BUTTON_SIZE = 4;
const channel = new Channel();

export function App() {
	const [status, setStatus] = useState<RecorderStatus>(RecorderStatus.IDLE);
	const [errorMessage, setErrorMessage] = useState("");
	const [startTime, setStartTime] = useState(0);
	const [newSession, setNewSession] = useState<Session | null>(null);
	const [connectionError, setConnectionError] = useState(false);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [taskId, setTaskId] = useState<string | null>(null);
	const [isLoadingAuth, setIsLoadingAuth] = useState(true);
	const [isUploading, setIsUploading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const { requestAuthStatus, onAuthStatusChange, refreshAuthStatus } =
		useAuthChannel();

	const handleAuthStatusUpdate = (authData: AuthStatus) => {
		console.log("Popup: Handling auth status update:", authData);
		setIsAuthenticated(authData.isAuthenticated);
		setTaskId(authData.taskId);

		if (!authData.isAuthenticated) {
			setStatus(RecorderStatus.IDLE);
			setStartTime(0);
			setNewSession(null);
			setErrorMessage("Not authenticated");
		} else {
			// Clear error message when authenticated
			setErrorMessage("");
		}
	};

	useEffect(() => {
		const initializeAuth = async () => {
			setIsLoadingAuth(true);
			try {
				console.log("Popup: Requesting auth status...");
				const authStatus = await requestAuthStatus();
				console.log("Popup: Received auth status:", authStatus);
				handleAuthStatusUpdate(authStatus);
			} catch (error) {
				console.error("Popup: Error initializing auth:", error);
				toast.error("Error loading authentication status");
			} finally {
				setIsLoadingAuth(false);
			}
		};

		// Listen for auth status changes
		const removeAuthListener = onAuthStatusChange(handleAuthStatusUpdate);

		// Listen for upload status
		const removeUploadStartListener = channel.on(
			EventName.UploadingStarted,
			() => {
				setIsUploading(true);
				toast.info("Uploading recording...");
			},
		);

		const removeUploadFinishListener = channel.on(
			EventName.UploadingFinished,
			async (data) => {
				setIsUploading(false);
				const sessionData = data as { session: Session };
				setNewSession(sessionData.session);
				toast.success("Recording uploaded successfully!");

				// Refresh auth status to get updated taskId
				console.log("Popup: Upload finished, refreshing auth status...");
				try {
					const updatedAuth = await refreshAuthStatus();
					handleAuthStatusUpdate(updatedAuth);
				} catch (error) {
					console.error("Error refreshing auth after upload:", error);
				}
			},
		);

		const removeUploadFailListener = channel.on(
			EventName.UploadingFailed,
			(data) => {
				setIsUploading(false);
				const errorData = data as { error: string };
				toast.error(`Upload failed: ${errorData.error}`);
			},
		);

		const parseStatusData = (data: LocalData[LocalDataKey.recorderStatus]) => {
			const { status, startTimestamp, pausedTimestamp } = data;
			setStatus(status);
			if (startTimestamp && pausedTimestamp)
				setStartTime(Date.now() - pausedTimestamp + startTimestamp);
			else if (startTimestamp) setStartTime(startTimestamp);
		};

		void Browser.storage.local.get(LocalDataKey.recorderStatus).then((data) => {
			if (!data || !data[LocalDataKey.recorderStatus]) return;
			parseStatusData((data as LocalData)[LocalDataKey.recorderStatus]);
		});

		const storageChangeListener = (changes: { [key: string]: any }) => {
			if (!changes[LocalDataKey.recorderStatus]) return;
			const data = changes[LocalDataKey.recorderStatus]
				.newValue as LocalData[LocalDataKey.recorderStatus];
			parseStatusData(data);
			if (data.errorMessage) setErrorMessage(data.errorMessage);
		};

		Browser.storage.local.onChanged.addListener(storageChangeListener);

		const removeSessionUpdateListener = channel.on(
			EventName.SessionUpdated,
			(data) => {
				setNewSession((data as { session: Session }).session);
			},
		);

		const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
			if (
				event.reason &&
				typeof event.reason.message === "string" &&
				(event.reason.message.includes("Could not establish connection") ||
					event.reason.message.includes("Receiving end does not exist"))
			) {
				setConnectionError(true);
			}
		};

		window.addEventListener("unhandledrejection", handleUnhandledRejection);

		// Initialize auth
		void initializeAuth();

		return () => {
			// Call the cleanup functions properly
			if (typeof removeAuthListener === "function") {
				removeAuthListener();
			}
			if (typeof removeUploadStartListener === "function") {
				removeUploadStartListener();
			}
			if (typeof removeUploadFinishListener === "function") {
				removeUploadFinishListener();
			}
			if (typeof removeUploadFailListener === "function") {
				removeUploadFailListener();
			}
			if (typeof removeSessionUpdateListener === "function") {
				removeSessionUpdateListener();
			}

			Browser.storage.local.onChanged.removeListener(storageChangeListener);
			window.removeEventListener(
				"unhandledrejection",
				handleUnhandledRejection,
			);
		};
	}, []);

	const safeEmit = async (eventName: EventName, data: unknown) => {
		try {
			await channel.emit(eventName, data);
		} catch (error) {
			if (
				error instanceof Error &&
				(error.message.includes("Could not establish connection") ||
					error.message.includes("Receiving end does not exist"))
			) {
				setConnectionError(true);
			}
		}
	};

	const handleRecordingAction = (action: string) => {
		try {
			if (action === "start" && status === RecorderStatus.IDLE) {
				void safeEmit(EventName.StartButtonClicked, {});
			} else if (action === "stop") {
				void safeEmit(EventName.StopButtonClicked, {});
			} else if (action === "pause" && status === RecorderStatus.RECORDING) {
				void safeEmit(EventName.PauseButtonClicked, {});
			} else if (action === "resume") {
				void safeEmit(EventName.ResumeButtonClicked, {});
			}
		} catch (error) {
			if (
				error instanceof Error &&
				(error.message.includes("Could not establish connection") ||
					error.message.includes("Receiving end does not exist"))
			) {
				setConnectionError(true);
			}
		}
	};

	const handleManualRefresh = async () => {
		setIsRefreshing(true);
		try {
			console.log("Manual refresh triggered");
			toast.info("Refreshing auth status...");

			// Force refresh auth status
			const updatedAuth = await refreshAuthStatus();
			console.log(updatedAuth);
			handleAuthStatusUpdate(updatedAuth);

			toast.success("Auth status refreshed");
			console.log("Manual refresh completed:", updatedAuth);
		} catch (error) {
			console.error("Error during manual refresh:", error);
			toast.error("Failed to refresh auth status");
		} finally {
			setIsRefreshing(false);
		}
	};

	// Show loading indicator while authenticating
	if (isLoadingAuth) {
		return (
			<div className="flex flex-col w-[320px] h-[400px] bg-gradient-to-br from-slate-50 to-slate-100 items-center justify-center">
				<div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center">
					<Loader2 className="h-10 w-10 animate-spin text-blue-600" />
					<p className="text-sm text-slate-600 mt-3 font-medium">Loading...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col w-[320px] h-[400px] bg-gradient-to-br from-slate-50 via-white to-slate-50">
			{/* Header */}
			<div className="bg-teal-500 border-b border-slate-200 px-6 py-4 shadow-sm">
				<div className="flex items-center justify-between">
					<div className="flex flex-col">
						<h1 className="text-lg font-bold text-slate-800">ScreenTrail</h1>
					</div>
					<div className="flex items-center space-x-2">
						{isAuthenticated && (
							<Button
								onClick={() => {
									window.open(`${config.SITE_URL}/dashboard/tasks`, "_blank");
								}}
								size="sm"
								variant="ghost"
								className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 transition-colors"
								title="Session List"
							>
								<ListIcon className="h-4 w-4 text-black" />
								<span className="sr-only">Session List</span>
							</Button>
						)}
						<Button
							onClick={handleManualRefresh}
							size="sm"
							variant="ghost"
							className="h-9 w-9 p-0 rounded-full hover:bg-slate-100 transition-colors"
							title="Refresh Auth Status"
							disabled={isRefreshing}
						>
							{isRefreshing ? (
								<Loader2 className="h-4 w-4 animate-spin text-blue-600" />
							) : (
								<RefreshCw className="h-4 w-4 text-black" />
							)}
							<span className="sr-only">Refresh Auth Status</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 px-6 py-4">
				{/* Timer Section */}
				{status !== RecorderStatus.IDLE && startTime && (
					<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4">
						<Timer
							startTime={startTime}
							ticking={status === RecorderStatus.RECORDING}
						/>
					</div>
				)}

				{/* Recording Controls */}
				{isAuthenticated ? (
					<div className="flex flex-col items-center space-y-6 py-4">
						<div className="flex items-center justify-center space-x-6">
							{/* Main Record Button */}
							<div className="relative">
								<CircleButton
									disabled={taskId === null || isUploading}
									diameter={RECORD_BUTTON_SIZE}
									title={
										status === RecorderStatus.IDLE
											? "Start Recording"
											: "Stop Recording"
									}
									onClick={() =>
										handleRecordingAction(
											status === RecorderStatus.IDLE ? "start" : "stop",
										)
									}
									className="shadow-lg hover:shadow-xl transition-shadow"
								>
									{isUploading ? (
										<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
									) : (
										<div
											style={{
												width: `${RECORD_BUTTON_SIZE}rem`,
												height: `${RECORD_BUTTON_SIZE}rem`,
												margin: 0,
												background:
													status === RecorderStatus.IDLE
														? "linear-gradient(135deg, #ef4444, #dc2626)"
														: "linear-gradient(135deg, #64748b, #475569)",
												borderRadius:
													status === RecorderStatus.IDLE ? "9999px" : "0.5rem",
												boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{status !== RecorderStatus.IDLE && (
												<div
													style={{
														width: "1.5rem",
														height: "1.5rem",
														backgroundColor: "white",
														borderRadius: "0.25rem",
													}}
												/>
											)}
										</div>
									)}
								</CircleButton>
								{/* Status Indicator */}
								{status === RecorderStatus.RECORDING && (
									<div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white shadow-sm" />
								)}
							</div>

							{/* Pause/Resume Button */}
							{status !== RecorderStatus.IDLE && (
								<CircleButton
									diameter={3}
									title={
										status === RecorderStatus.RECORDING
											? "Pause Recording"
											: "Resume Recording"
									}
									onClick={() =>
										handleRecordingAction(
											status === RecorderStatus.RECORDING ? "pause" : "resume",
										)
									}
									className="bg-white border-2 border-slate-200 shadow-md hover:shadow-lg transition-all hover:border-blue-300"
								>
									<div className="flex items-center justify-center w-full h-full">
										{[
											RecorderStatus.PAUSED,
											RecorderStatus.PausedSwitch,
										].includes(status) && (
											<Play
												className="h-5 w-5 text-blue-600"
												style={{ marginLeft: "2px" }}
											/>
										)}
										{status === RecorderStatus.RECORDING && (
											<Pause className="h-10 w-10 text-slate-600" />
										)}
									</div>
								</CircleButton>
							)}
						</div>

						{/* Status Text */}
						<div className="text-center">
							<p className="text-sm font-medium text-slate-700">
								{status === RecorderStatus.IDLE && "Ready to record"}
								{status === RecorderStatus.RECORDING && "Recording in progress"}
								{[RecorderStatus.PAUSED, RecorderStatus.PausedSwitch].includes(
									status,
								) && "Recording paused"}
							</p>
							{taskId && (
								<p className="text-xs text-slate-500 mt-1">Task ID: {taskId}</p>
							)}
						</div>
					</div>
				) : (
					<div className="flex flex-col items-center py-8">
						<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
							<div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
								<svg
									className="w-6 h-6 text-slate-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Lock Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
									/>
								</svg>
							</div>
							<p className="text-sm font-medium text-slate-700 mb-3">
								Authentication Required
							</p>
							<p className="text-xs text-slate-500 mb-4">
								Please log in to start recording
							</p>
							<Button
								onClick={() => {
									window.open(`${config.SITE_URL}/auth?tab=login`, "_blank");
								}}
								className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
								variant="default"
								size="sm"
							>
								Log In
							</Button>
						</div>
					</div>
				)}

				{/* New Session Notification */}
				{newSession && (
					<div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4 shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
								<svg
									className="w-4 h-4 text-green-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Check Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 13l4 4L19 7"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-green-800">
									Recording Complete!
								</p>
								<p className="text-xs text-green-600 mb-3">
									Your session has been saved successfully
								</p>
								<Button
									onClick={() => {
										window.open(
											`${config.SITE_URL}/dashboard/recordings?taskId=${taskId}`,
											"_blank",
										);
										setNewSession(null);
									}}
									className="bg-green-600 hover:bg-green-700 text-white text-xs h-7"
									variant="default"
									size="sm"
								>
									View Session
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Error Messages */}
				{errorMessage && (
					<div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 p-4 shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
								<svg
									className="w-4 h-4 text-red-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Error Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-red-800">Error</p>
								<p className="text-xs text-red-600">{errorMessage}</p>
							</div>
						</div>
					</div>
				)}

				{/* Connection Error */}
				{connectionError && (
					<div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4 shadow-sm">
						<div className="flex items-start space-x-3">
							<div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
								<svg
									className="w-4 h-4 text-orange-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Connection Error Icon</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
									/>
								</svg>
							</div>
							<div className="flex-1">
								<p className="text-sm font-medium text-orange-800">
									Connection Issue
								</p>
								<p className="text-xs text-orange-600 mb-3">
									Could not establish connection. The page may need to be
									refreshed.
								</p>
								<Button
									size="sm"
									variant="outline"
									className="bg-white border-orange-300 text-orange-700 hover:bg-orange-50 text-xs h-7"
									onClick={() => {
										Browser.tabs
											.query({ active: true, currentWindow: true })
											.then((tabs) => {
												if (tabs[0]?.id) {
													return Browser.tabs.reload(tabs[0].id);
												}
											})
											.then(() => {
												setConnectionError(false);
											})
											.catch(() => {
												setConnectionError(false);
											});
									}}
								>
									Refresh Page
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
