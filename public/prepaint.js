(function prepaintSmartSafar() {
  try {
    var installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || navigator.standalone === true
      || (document.referrer || "").indexOf("android-app://") === 0
      || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
      || new URLSearchParams(location.search).get("source") === "pwa";
    document.documentElement.classList.add("js");
    document.documentElement.dataset.appMode = installed ? "app" : "web";
  } catch (_error) {}
})();
