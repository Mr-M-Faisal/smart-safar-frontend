(function prepaintSmartSafar() {
  try {
    var params = new URLSearchParams(location.search);
    var cookies = document.cookie.split(";").map(function (part) { return part.trim(); });
    var preference = (cookies.find(function (part) { return part.indexOf("ss-view=") === 0; }) || "").split("=")[1];
    var phone = window.matchMedia("(max-width: 767px)").matches
      || (window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 768);
    var installed = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true
      || (document.referrer || "").indexOf("android-app://") === 0
      || (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())
      || params.get("source") === "pwa";
    var view = preference === "app" || preference === "web" ? preference : (phone ? "app" : "web");
    var path = location.pathname.replace(/\/+$/, "") || "/";
    var target = null;
    function query() {
      var safe = new URLSearchParams(location.search);
      if (safe.has("returnTo")) {
        var returnTo = safe.get("returnTo");
        if (!returnTo || returnTo.charAt(0) !== "/" || returnTo.indexOf("//") === 0 || /[\\\u0000-\u001f]/.test(returnTo)) safe.delete("returnTo");
      }
      return safe.toString();
    }
    var suffix = query();
    if (view === "app") {
      var map = { "/": "/m", "/routes": "/m/routes", "/live-map": "/m/map", "/login": "/m/login", "/driver": "/m/driver" };
      if (path === "/passenger" || path.indexOf("/passenger/") === 0 || path === "/booking-preview") target = params.get("tab") === "history" ? "/m/trips" : "/m/book";
      else if (path !== "/admin" && path.indexOf("/admin/") !== 0 && path !== "/safety/track" && path.indexOf("/safety/track/") !== 0) {
        Object.keys(map).some(function (key) {
          if (path === key || (key !== "/" && path.indexOf(key + "/") === 0)) { target = map[key] + path.slice(key.length); return true; }
          return false;
        });
      }
    } else if (params.get("preview") !== "1" && path.indexOf("/m") === 0) {
      var reverse = { "/m": "/", "/m/map": "/live-map", "/m/routes": "/routes", "/m/book": "/passenger", "/m/trips": "/passenger", "/m/account": "/passenger", "/m/login": "/login", "/m/driver": "/driver" };
      Object.keys(reverse).some(function (key) {
        if (path === key || (key !== "/m" && path.indexOf(key + "/") === 0)) { target = reverse[key] + path.slice(key.length); return true; }
        return false;
      });
    }
    document.documentElement.classList.add("js");
    try { if (sessionStorage.getItem("ss-splash-shown")) document.documentElement.classList.add("ss-splash-skip"); } catch (_error) {}
    document.documentElement.dataset.appMode = view;
    document.documentElement.dataset.view = view;
    document.documentElement.dataset.installed = installed ? "true" : "false";
    if (target && target !== path) location.replace(target + (suffix ? "?" + suffix : "") + location.hash);
  } catch (_error) {}
})();
