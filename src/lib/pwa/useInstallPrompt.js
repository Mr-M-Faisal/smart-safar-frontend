"use client";

import { useContext } from "react";
import { InstallPromptContext } from "./InstallPromptProvider";

export default function useInstallPrompt() {
  return useContext(InstallPromptContext) || { canInstall: false, isInstalled: false, isIOS: false, isAndroid: false, install: async () => false, dismissed: false, dismiss: () => {} };
}
