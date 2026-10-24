function isIOS(userAgent = "", platform = "", maxTouchPoints = 0) {
  return /iPhone|iPad|iPod/i.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
}

function resolveInstallMode({ userAgent = "", platform = "", maxTouchPoints = 0, standalone = false, hasPromptEvent = false, relatedAppInstalled = false } = {}) {
  if (standalone || relatedAppInstalled) return "installed";
  if (hasPromptEvent) return "prompt";
  if (isIOS(userAgent, platform, maxTouchPoints)) return /Safari/i.test(userAgent) && !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/i.test(userAgent) ? "ios-safari" : "ios-other";
  if (/Android/i.test(userAgent)) return "android-manual";
  return "desktop-manual";
}

function installInstructions({ mode, userAgent = "" } = {}) {
  if (mode === "ios-safari") return ["Tap Share in Safari.", "Choose Add to Home Screen.", "Tap Add to finish."];
  if (mode === "ios-other") return ["Open this page in Safari to install Smart Safar."];
  if (mode === "android-manual") {
    if (/SamsungBrowser/i.test(userAgent)) return ["Open the browser menu ☰.", "Choose Add page to → Home screen."];
    if (/Firefox/i.test(userAgent)) return ["Open the browser menu ⋮.", "Choose Install."];
    return ["Open the browser menu ⋮.", "Choose Install app or Add to Home screen."];
  }
  if (mode === "desktop-manual") return ["Click the install icon in the address bar, or open ⋮ → Install Smart Safar."];
  return [];
}

module.exports = { installInstructions, resolveInstallMode };
