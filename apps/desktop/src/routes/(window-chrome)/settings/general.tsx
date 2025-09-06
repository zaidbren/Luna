import { Button } from "@cap/ui-solid";
import { createWritableMemo } from "@solid-primitives/memo";
import {
	isPermissionGranted,
	requestPermission,
} from "@tauri-apps/plugin-notification";
import { type OsType, type } from "@tauri-apps/plugin-os";
import "@total-typescript/ts-reset/filter-boolean";
import { CheckMenuItem, Menu } from "@tauri-apps/api/menu";
import { confirm } from "@tauri-apps/plugin-dialog";
import { cx } from "cva";
import { ComponentProps, createResource, For, JSX, Show } from "solid-js";
import { createStore } from "solid-js/store";
import { Input } from "~/routes/editor/ui";
import { authStore, generalSettingsStore } from "~/store";
import IconSun from "~icons/cap/sun.jsx";
import IconMoon from "~icons/cap/moon.jsx";
import IconSytemTheme from "~icons/cap/systemtheme.jsx";
import {
	type AppTheme,
	commands,
	type GeneralSettingsStore,
	type MainWindowRecordingStartBehaviour,
	type PostDeletionBehaviour,
	type PostStudioRecordingBehaviour,
} from "~/utils/tauri";
import { Setting, ToggleSetting } from "./Setting";

export default function GeneralSettings() {
	const [store] = createResource(() => generalSettingsStore.get());

	return (
		<Show when={store.state === "ready" && ([store()] as const)}>
			{(store) => <Inner initialStore={store()[0] ?? null} />}
		</Show>
	);
}

function AppearanceSection(props: {
	currentTheme: AppTheme;
	onThemeChange: (theme: AppTheme) => void;
}) {
	// const options = [
	// 	{ id: "system", name: "System", preview: 'themePreviewAuto' },
	// 	{ id: "light", name: "Light", preview: 'themePreviewLight' },
	// 	{ id: "dark", name: "Dark", preview: 'themePreviewDark' },
	// ] satisfies { id: AppTheme; name: string; preview: string }[];

	const options = [
		{ id: "light", name: "Light", preview: <IconSun class="size-5 text-gray-12"/> },
		{ id: "dark", name: "Dark", preview: <IconMoon class="size-4 text-gray-12"/> },
		{ id: "system", name: "System", preview:<IconSytemTheme class="size-4 text-gray-12"/> },
	] satisfies { id: AppTheme; name: string; preview: any }[];

	return (
		<div class="flex flex-col gap-4">
			<div class="flex flex-col pb-4 border-b border-gray-2">
				<h2 class="text-lg font-medium text-gray-12">General</h2>
				<p class="text-sm text-gray-10">
					General settings
				</p>
			</div>
			<div
				class="flex justify-start items-center text-gray-12"
				onContextMenu={(e) => e.preventDefault()}
			>
				<div class="flex flex-col gap-3">
					<p class="text-sm text-gray-12">Appearance</p>
					<div style="display:flex;border-radius:21px;background-color:rgb(231 230 228);height:32px;width:88px;column-gap:0px;padding:2px;">
						<For each={options}>
							{(theme) => (
								<button
									type="button"
									aria-checked={props.currentTheme === theme.id}
									aria-label={`Select theme: ${theme.name}`}
									onClick={() => props.onThemeChange(theme.id)}
									style={{
										display: "flex",
										"align-items": "center",
										"justify-content": "center",
										"border-radius": "9999px",
										"transition-property": "color, background-color, border-color, text-decoration-color, fill, stroke",
										"transition-timing-function": "cubic-bezier(0.4, 0, 0.2, 1)",
										"transition-duration": "150ms",
										"--tw-bg-opacity": "1",
										"background-color": props.currentTheme === theme.id
											? "rgb(255 255 255 / var(--tw-bg-opacity, 1))"
											: "transparent",
										"--tw-text-opacity": "1",
										color: "rgb(13 13 13 / var(--tw-text-opacity, 1))",
										height: "28px",
										width: "28px",
									}}
								>
									{theme.preview}
								</button>
							)}
						</For>
					</div>
				</div>
			</div>
		</div>
	);
}

function Inner(props: { initialStore: GeneralSettingsStore | null }) {
	const [settings, setSettings] = createStore<GeneralSettingsStore>(
		props.initialStore ?? {
			uploadIndividualFiles: false,
			hideDockIcon: false,
			autoCreateShareableLink: false,
			enableNotifications: true,
			enableNativeCameraPreview: false,
			enableNewRecordingFlow: false,
			autoZoomOnClicks: false,
			custom_cursor_capture2: true,
		},
	);

	const handleChange = async <K extends keyof typeof settings>(
		key: K,
		value: (typeof settings)[K],
	) => {
		console.log(`Handling settings change for ${key}: ${value}`);

		setSettings(key as keyof GeneralSettingsStore, value);
		generalSettingsStore.set({ [key]: value });
	};

	const ostype: OsType = type();

	type ToggleSettingItem = {
		label: string;
		type: "toggle";
		description: string;
		value: boolean;
		onChange: (value: boolean) => void | Promise<void>;
		os?: "macos" | "windows" | "linux";
	};

	type SelectSettingItem = {
		label: string;
		type: "select";
		description: string;
		value:
			| MainWindowRecordingStartBehaviour
			| PostStudioRecordingBehaviour
			| PostDeletionBehaviour
			| number;
		onChange: (
			value:
				| MainWindowRecordingStartBehaviour
				| PostStudioRecordingBehaviour
				| PostDeletionBehaviour
				| number,
		) => void | Promise<void>;
	};

	type SettingItem = ToggleSettingItem | SelectSettingItem;

	type SettingsGroup = {
		title: string;
		os?: "macos" | "windows" | "linux";
		titleStyling?: string;
		items: SettingItem[];
	};

	// Static settings groups structure to preserve component identity
	const settingsGroups: SettingsGroup[] = [
		// {
		// 	title: "Cap Pro",
		// 	titleStyling:
		// 		"bg-blue-500 py-1.5 mb-4 text-white text-xs px-2 rounded-lg",
		// 	items: [
		// 		{
		// 			label: "Disable automatic link opening",
		// 			type: "toggle",
		// 			description:
		// 				"When enabled, Cap will not automatically open links in your browser (e.g. after creating a shareable link).",
		// 			get value() {
		// 				return !!settings.disableAutoOpenLinks;
		// 			},
		// 			onChange: (value: boolean) =>
		// 				handleChange("disableAutoOpenLinks", value),
		// 		},
		// 	],
		// },
		{
			title: "App",
			os: "macos",
			items: [
				{
					label: "Hide dock icon",
					type: "toggle",
					os: "macos",
					description:
						"The dock icon will be hidden when there are no windows available to close.",
					get value() {
						return !!settings.hideDockIcon;
					},
					onChange: (value: boolean) => handleChange("hideDockIcon", value),
				},
				{
					label: "Enable system notifications",
					type: "toggle",
					os: "macos",
					description:
						"Show system notifications for events like copying to clipboard, saving files, and more. You may need to manually allow Phia access via your system's notification settings.",
					get value() {
						return !!settings.enableNotifications;
					},
					onChange: async (value: boolean) => {
						if (value) {
							// Check current permission state
							console.log("Checking notification permission status");
							const permissionGranted = await isPermissionGranted();
							console.log(`Current permission status: ${permissionGranted}`);

							if (!permissionGranted) {
								// Request permission if not granted
								console.log("Permission not granted, requesting permission");
								const permission = await requestPermission();
								console.log(`Permission request result: ${permission}`);
								if (permission !== "granted") {
									// If permission denied, don't enable the setting
									console.log("Permission denied, aborting setting change");
									return;
								}
							}
						}
						handleChange("enableNotifications", value);
					},
				},
				{
					label: "Enable haptics",
					type: "toggle",
					os: "macos",
					description: "Use haptics on Force Touch™ trackpads",
					get value() {
						return !!settings.hapticsEnabled;
					},
					onChange: (value: boolean) => handleChange("hapticsEnabled", value),
				},
			],
		},
		{
			title: "Recording",
			items: [
				{
					label: "Recording countdown",
					description: "Countdown before recording starts",
					type: "select",
					get value() {
						return settings.recordingCountdown ?? 0;
					},
					onChange: (
						value:
							| MainWindowRecordingStartBehaviour
							| PostStudioRecordingBehaviour
							| PostDeletionBehaviour
							| number,
					) => handleChange("recordingCountdown", value as number),
				},
				{
					label: "Main window recording start behaviour",
					description: "The main window recording start behaviour",
					type: "select",
					get value() {
						return settings.mainWindowRecordingStartBehaviour ?? "close";
					},
					onChange: (
						value:
							| MainWindowRecordingStartBehaviour
							| PostStudioRecordingBehaviour
							| PostDeletionBehaviour
							| number,
					) =>
						handleChange(
							"mainWindowRecordingStartBehaviour",
							value as MainWindowRecordingStartBehaviour,
						),
				},
				{
					label: "Recording finish behaviour",
					description: "The recording finish behaviour",
					type: "select",
					get value() {
						return settings.postStudioRecordingBehaviour ?? "openEditor";
					},
					onChange: (
						value:
							| MainWindowRecordingStartBehaviour
							| PostStudioRecordingBehaviour
							| PostDeletionBehaviour
							| number,
					) =>
						handleChange(
							"postStudioRecordingBehaviour",
							value as PostStudioRecordingBehaviour,
						),
				},
				{
					label: "After deleting recording behaviour",
					description:
						"Should Phia reopen after deleting an in progress recording?",
					type: "select",
					get value() {
						return settings.postDeletionBehaviour ?? "doNothing";
					},
					onChange: (
						value:
							| MainWindowRecordingStartBehaviour
							| PostStudioRecordingBehaviour
							| PostDeletionBehaviour
							| number,
					) =>
						handleChange(
							"postDeletionBehaviour",
							value as PostDeletionBehaviour,
						),
				},
			],
		},
	];

	// Helper function to render select dropdown for recording behaviors
	const renderRecordingSelect = (
		label: string,
		description: string,
		getValue: () =>
			| MainWindowRecordingStartBehaviour
			| PostStudioRecordingBehaviour
			| PostDeletionBehaviour
			| number,
		onChange: (value: any) => void,
		options: { text: string; value: any }[],
	) => {
		return (
			<Setting label={label} description={description}>
				<button
					type="button"
					class="flex flex-row gap-1 text-xs bg-gray-3 items-center px-2.5 py-1.5 rounded-md border border-gray-4"
					onClick={async () => {
						const currentValue = getValue();
						const items = options.map((option) =>
							CheckMenuItem.new({
								text: option.text,
								checked: currentValue === option.value,
								action: () => onChange(option.value),
							}),
						);
						const menu = await Menu.new({
							items: await Promise.all(items),
						});
						await menu.popup();
						await menu.close();
					}}
				>
					{(() => {
						const currentValue = getValue();
						const option = options.find((opt) => opt.value === currentValue);
						return option ? option.text : currentValue;
					})()}
					<IconCapChevronDown class="size-4" />
				</button>
			</Setting>
		);
	};

	return (
		<div class="flex flex-col w-full h-full">
			<div class="flex-1 custom-scroll">
				<div class="p-4 space-y-6">
					<AppearanceSection
						currentTheme={settings.theme ?? "system"}
						onThemeChange={(newTheme) => {
							setSettings("theme", newTheme);
							generalSettingsStore.set({ theme: newTheme });
						}}
					/>

					<For each={settingsGroups}>
						{(group) => (
							<Show when={group.os === ostype || !group.os}>
								<div>
									<h3
										class={cx(
											"mb-3 text-sm text-gray-12 w-fit",
											group.titleStyling,
										)}
									>
										{group.title}
									</h3>
									<div class="px-3 rounded-xl border divide-y divide-gray-3 border-gray-3 bg-gray-2">
										<For each={group.items}>
											{(item) => {
												// Check OS compatibility
												if (
													item.type === "toggle" &&
													item.os &&
													item.os !== ostype
												) {
													return null;
												}

												if (item.type === "toggle") {
													return (
														<ToggleSetting
															pro={group.title === "Phia Pro"}
															label={item.label}
															description={item.description}
															value={item.value}
															onChange={item.onChange}
														/>
													);
												} else if (item.type === "select") {
													if (
														item.label ===
														"Main window recording start behaviour"
													) {
														return renderRecordingSelect(
															item.label,
															item.description,
															() => item.value,
															item.onChange,
															[
																{ text: "Close", value: "close" },
																{ text: "Minimise", value: "minimise" },
															],
														);
													} else if (
														item.label === "Studio recording finish behaviour"
													) {
														return renderRecordingSelect(
															item.label,
															item.description,
															() => item.value,
															item.onChange,
															[
																{ text: "Open editor", value: "openEditor" },
																{
																	text: "Show in overlay",
																	value: "showOverlay",
																},
															],
														);
													} else if (item.label === "Recording countdown") {
														return renderRecordingSelect(
															item.label,
															item.description,
															() => item.value,
															item.onChange,
															[
																{ text: "Off", value: 0 },
																{ text: "3 seconds", value: 3 },
																{ text: "5 seconds", value: 5 },
																{ text: "10 seconds", value: 10 },
															],
														);
													} else if (
														item.label === "After deleting recording behaviour"
													) {
														return renderRecordingSelect(
															item.label,
															item.description,
															() => item.value,
															item.onChange,
															[
																{ text: "Do Nothing", value: "doNothing" },
																{
																	text: "Reopen Recording Window",
																	value: "reopenRecordingWindow",
																},
															],
														);
													}
												}
												return null;
											}}
										</For>
									</div>
								</div>
							</Show>
						)}
					</For>

					{/* <ServerURLSetting
						value={settings.serverUrl ?? "https://cap.so"}
						onChange={async (v) => {
							const url = new URL(v);
							const origin = url.origin;

							if (
								!(await confirm(
									`Are you sure you want to change the server URL to '${origin}'? You will need to sign in again.`,
								))
							)
								return;

							await authStore.set(undefined);
							await commands.setServerUrl(origin);
							handleChange("serverUrl", origin);
						}}
					/> */}
				</div>
			</div>
		</div>
	);
}

function ServerURLSetting(props: {
	value: string;
	onChange: (v: string) => void;
}) {
	const [value, setValue] = createWritableMemo(() => props.value);

	return (
		<div class="flex flex-col gap-3">
			<h3 class="text-sm text-gray-12 w-fit">Self host</h3>
			<div class="flex flex-col gap-2 px-4 rounded-xl border border-gray-3 bg-gray-2">
				<Setting
					label="Cap Server URL"
					description="This setting should only be changed if you are self hosting your own instance of Cap Web."
				>
					<div class="flex flex-col gap-2 items-end">
						<Input
							class="bg-gray-3"
							value={value()}
							onInput={(e) => setValue(e.currentTarget.value)}
						/>
						<Button
							size="sm"
							class="mt-2"
							variant="dark"
							disabled={props.value === value()}
							onClick={() => props.onChange(value())}
						>
							Update
						</Button>
					</div>
				</Setting>
			</div>
		</div>
	);
}
