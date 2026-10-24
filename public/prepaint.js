(function prepaintSmartSafar() {
  try {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var mobilePaths = {
      "/": "/m",
      "/live-map": "/m/map",
      "/routes": "/m/routes",
      "/passenger": "/m/book",
      "/login": "/m/login",
      "/driver": "/m/driver",
    };
    var installed = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)
      || navigator.standalone === true
      || (document.referrer || "").indexOf("android-app://") === 0
      || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
      || new URLSearchParams(location.search).get("source") === "pwa";
    document.documentElement.classList.add("js");
    document.documentElement.dataset.appMode = installed ? "app" : "web";
    if (installed && mobilePaths[path]) location.replace(mobilePaths[path] + location.search + location.hash);
  } catch (_error) {}
})();
