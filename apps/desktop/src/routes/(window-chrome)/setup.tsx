import { Button } from "@cap/ui-solid";
import { makePersisted } from "@solid-primitives/storage";
import { createTimer } from "@solid-primitives/timer";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
	createEffect,
	createResource,
	createSignal,
	For,
	Match,
	onCleanup,
	onMount,
	Show,
	Switch,
	startTransition,
} from "solid-js";
import { createStore } from "solid-js/store";
import ModeSelect from "~/components/ModeSelect";
import {
	commands,
	RecordingMode,
	type OSPermission,
	type OSPermissionStatus,
} from "~/utils/tauri";

function isPermitted(status?: OSPermissionStatus): boolean {
	return status === "granted" || status === "notNeeded";
}

const permissions = [
	{
		name: "Screen Recording",
		key: "screenRecording" as const,
		description: "This permission is required to record your screen.",
	},
	{
		name: "Accessibility",
		key: "accessibility" as const,
		description:
			"During recording, Phia collects mouse activity locally to generate automatic zoom in segments.",
	},
] as const;

export default function () {
	const [initialCheck, setInitialCheck] = createSignal(true);
	const [check, checkActions] = createResource(() =>
		commands.doPermissionsCheck(initialCheck()),
	);
	const [currentStep, setCurrentStep] = createSignal<"permissions" | "mode">(
		"permissions",
	);

	const { rawOptions, setOptions } = createOptionsQuery();

	createEffect(() => {
		if (!initialCheck()) {
			createTimer(
				() => startTransition(() => checkActions.refetch()),
				250,
				setInterval,
			);
		}
	});

	const requestPermission = (permission: OSPermission) => {
		console.log({ permission });
		try {
			commands.requestPermission(permission);
		} catch (err) {
			console.error(`Error occurred while requesting permission: ${err}`);
		}
		setInitialCheck(false);
	};

	const openSettings = (permission: OSPermission) => {
		commands.openPermissionSettings(permission);
		setInitialCheck(false);
	};

	const [showStartup, showStartupActions] = createResource(() =>
		generalSettingsStore.get().then((s) => {
			if (s === undefined) return true;
			return !s.hasCompletedStartup;
		}),
	);

	

	const handleStudioMode = (mode: RecordingMode) => {
		setOptions({ mode });
	};

	const handleContinue = async () => {
		handleStudioMode('studio');
		
		// Mark startup as completed
		await generalSettingsStore.set({
			hasCompletedStartup: true,
		});
		
		// Proceed to the main window
		commands.showWindow("Main").then(() => {
			getCurrentWindow().close();
		});
	};

	return (
		<>
			<div class="flex flex-col px-[2rem] text-[0.875rem] font-[400] flex-1 bg-gray-1 justify-evenly items-center">
				{!showStartup() && (
					<Startup
						onClose={() => {
							showStartupActions.mutate(false);
						}}
					/>
				)}

				<Show when={currentStep() === "permissions"}>
					<div class="flex flex-col items-center">
						<IconCapLogo class="size-14 mb-3" />
						<h1 class="text-[1.2rem] font-[700] mb-1 text-[--text-primary]">
							Permissions Required
						</h1>
						<p class="text-gray-11">Phia needs permissions to run properly.</p>
					</div>

					<ul class="flex flex-col gap-4 py-8">
						<For each={permissions}>
							{(permission) => {
								const permissionCheck = () => check()?.[permission.key];

								return (
									<Show when={permissionCheck() !== "notNeeded"}>
										<li class="flex flex-row items-center gap-4">
											<div class="flex flex-col flex-[2]">
												<span class="font-[500] text-[0.875rem] text-[--text-primary]">
													{permission.name} Permission
												</span>
												<span class="text-[--text-secondary]">
													{permission.description}
												</span>
											</div>
											<Button
												class="flex-1 shrink-0"
												onClick={() =>
													permissionCheck() !== "denied"
														? requestPermission(permission.key)
														: openSettings(permission.key)
												}
												disabled={isPermitted(permissionCheck())}
											>
												{permissionCheck() === "granted"
													? "Granted"
													: permissionCheck() !== "denied"
														? "Grant Permission"
														: "Request Permission"}
											</Button>
										</li>
									</Show>
								);
							}}
						</For>
					</ul>

					<Button
						class="px-12"
						size="lg"
						disabled={
							permissions.find((p) => !isPermitted(check()?.[p.key])) !==
							undefined
						}
						onClick={handleContinue}
					>
						Continue
					</Button>
				</Show>

				<Show when={currentStep() === "mode"}>
					<div class="flex flex-col items-center">
						<IconCapLogo class="size-14 mb-3" />
						<h1 class="text-[1.2rem] font-[700] mb-1 text-[--text-primary]">
							Select Recording Mode
						</h1>
						<p class="text-gray-11">Choose how you want to record with Cap.</p>
					</div>

					<div class="w-full py-4">
						<ModeSelect />
					</div>

					<Button class="px-12" size="lg" onClick={handleContinue}>
						Continue to Phia
					</Button>
				</Show>
			</div>
		</>
	);
}

import { type as ostype } from "@tauri-apps/plugin-os";
import { cx } from "cva";
import { Portal } from "solid-js/web";
import CaptionControlsWindows11 from "~/components/titlebar/controls/CaptionControlsWindows11";
import { generalSettingsStore } from "~/store";
import welcomeBackground from "../../assets/illustrations/welcomeBackground.png";
import LogoBrown from "~icons/cap/logo-brown.jsx";
import WelcomeText from "~icons/cap/welcomeText.jsx";
import { createOptionsQuery } from "~/utils/queries";

function Startup(props: { onClose: () => void }) {
	const [isExiting, setIsExiting] = createSignal(false);

	const [isLogoAnimating, setIsLogoAnimating] = createSignal(false);

	const handleLogoClick = () => {
		if (!isLogoAnimating()) {
			setIsLogoAnimating(true);
			setTimeout(() => setIsLogoAnimating(false), 1000);
		}
	};

	const handleStartupCompleted = () =>
		generalSettingsStore.set({
			hasCompletedStartup: true,
		});

	const handleGetStarted = async () => {
		setIsExiting(true);

		await handleStartupCompleted();

		// Wait for animation to complete before showing new window and closing
		setTimeout(async () => {
			props.onClose();
		}, 600);
	};



	return (
		<Portal>
			<div class="absolute inset-0 z-40">
				<header
					class="absolute top-0 inset-x-0 h-12 z-10"
					data-tauri-drag-region
				>
									<div
					class={cx(
						"flex justify-end items-center gap-[0.25rem] w-full h-full z-10",
					)}
					data-tauri-drag-region
				>
					{ostype() === "windows" && <CaptionControlsWindows11 />}
				</div>
				</header>
				<style>
					{`
          body {
            background: transparent !important;
          }

          .content-container {
            transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);
          }

          .content-container.exiting {
            opacity: 0;
            transform: scale(1.1);
          }

          .custom-bg {
            transition: all 600ms cubic-bezier(0.4, 0, 0.2, 1);
            background-image: url('${welcomeBackground}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
          }

          /* Overlay for fade to black */
          .fade-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: transparent;
            opacity: 0;
            pointer-events: none;
            transition: opacity 600ms cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 1000;
          }

          .fade-overlay.exiting {
            opacity: 1;
          }

          @keyframes bounce {
            0%, 100% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          .logo-bounce {
            animation: bounce 1s cubic-bezier(0.36, 0, 0.66, -0.56) forwards;
          }
        `}
				</style>
				{/* Add the fade overlay */}
				<div class={`fade-overlay ${isExiting() ? "exiting" : ""}`} />
				<div
					style={{ "transition-duration": "600ms" }}
					class={cx(
						"flex flex-col h-screen custom-bg relative overflow-hidden transition-opacity text-solid-white",
						isExiting() && "exiting opacity-0",
					)}
				>

					{/* Main content */}
					<div
						class={`content-container flex flex-col items-center justify-center flex-1 relative px-4 ${
							isExiting() ? "exiting" : ""
						}`}
					>
						<div class="text-center mb-8">
							<div
								onClick={handleLogoClick}
								class="cursor-pointer inline-block"
							>
								<LogoBrown
									class={`w-30 h-10 mx-auto 
                  ${isLogoAnimating() ? "logo-bounce" : ""}`}
								/>
							</div>
							<WelcomeText
									class={`w-60 h-30 mx-auto `}
							/>
						</div>

						<Switch>
							<Match when={ostype() !== "windows"}>
								<Button
									class="px-12 text-sm bg-[#6A5141]"
									// variant="white"
									size="lg"
									onClick={handleGetStarted}
								>
									Get Started
								</Button>
							</Match>
							<Match when={ostype() === "windows"}>
								<Button
									class="px-12 text-sm bg-[#6A5141]"
									size="lg"
									onClick={async () => {
										handleStartupCompleted();
										await commands.showWindow("Main");
										getCurrentWindow().close();
									}}
								>
									Continue
								</Button>
							</Match>
						</Switch>
					</div>
				</div>
			</div>
		</Portal>
	);
}