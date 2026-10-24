(function prepaintSmartSafar() {
  try {
    window.__smartSafarInstallPrompt = window.__smartSafarInstallPrompt || null;
    if (!window.__smartSafarInstallPromptListener) {
      window.__smartSafarInstallPromptListener = true;
      window.addEventListener("beforeinstallprompt", function (event) {
        event.preventDefault();
        window.__smartSafarInstallPrompt = event;
        window.dispatchEvent(new Event("smart-safar:install-prompt-ready"));
      });
      window.addEventListener("appinstalled", function () { window.__smartSafarInstallPrompt = null; });
    }
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
    function suffixFor(input) {
      var safe = new URLSearchParams(input);
      if (safe.has("returnTo")) {
        var returnTo = safe.get("returnTo");
        if (!returnTo || returnTo.charAt(0) !== "/" || returnTo.indexOf("//") === 0 || /[\\\u0000-\u001f]/.test(returnTo)) safe.delete("returnTo");
      }
      var serialized = safe.toString();
      return serialized ? "?" + serialized : "";
    }
    function mapWebToApp(currentPath, input) {
      var query = new URLSearchParams(input);
      var suffix = suffixFor(input);
      if (currentPath === "/safety/track" || currentPath.indexOf("/safety/track/") === 0) return null;
      if (currentPath === "/admin" || currentPath.indexOf("/admin/") === 0) {
        var adminTab = { overview: "/m/admin", drivers: "/m/admin/drivers", buses: "/m/admin/buses", routes: "/m/admin/routes", stops: "/m/admin/stops", bookings: "/m/admin/bookings", reports: "/m/admin/reports", settings: "/m/admin/settings" };
        return (adminTab[query.get("tab")] || (currentPath.indexOf("/admin/") === 0 ? "/m/admin/" + currentPath.slice(7) : "/m/admin")) + suffix;
      }
      if (currentPath === "/passenger" || currentPath.indexOf("/passenger/") === 0 || currentPath === "/booking-preview" || currentPath.indexOf("/booking-preview/") === 0) return (query.get("tab") === "history" ? "/m/trips" : "/m/book") + suffix;
      var routes = [["/routes", "/m/routes"], ["/live-map", "/m/map"], ["/login", "/m/login"], ["/driver", "/m/driver"], ["/", "/m"]];
      for (var i = 0; i < routes.length; i += 1) {
        var from = routes[i][0];
        if (currentPath === from || (from !== "/" && currentPath.indexOf(from + "/") === 0)) return routes[i][1] + currentPath.slice(from.length) + suffix;
      }
      return null;
    }
    function mapAppToWeb(currentPath, input) {
      var query = new URLSearchParams(input);
      if (query.get("preview") === "1") return null;
      var suffix = suffixFor(input);
      if (currentPath === "/m") return "/" + suffix;
      if (currentPath === "/m/book" || currentPath.indexOf("/m/book/") === 0) return "/passenger" + suffix;
      if (currentPath === "/m/trips" || currentPath === "/m/account") return "/passenger" + suffix;
      if (currentPath === "/m/admin" || currentPath.indexOf("/m/admin/") === 0) {
        var admin = { "/m/admin": "overview", "/m/admin/drivers": "drivers", "/m/admin/buses": "buses", "/m/admin/routes": "routes", "/m/admin/stops": "routes", "/m/admin/bookings": "bookings", "/m/admin/reports": "reports", "/m/admin/settings": "overview" };
        if (!Object.prototype.hasOwnProperty.call(admin, currentPath)) return null;
        query.set("tab", admin[currentPath]);
        return "/admin" + suffixFor(query);
      }
      var routes = [["/m/routes", "/routes"], ["/m/map", "/live-map"], ["/m/login", "/login"], ["/m/driver", "/driver"]];
      for (var i = 0; i < routes.length; i += 1) if (currentPath === routes[i][0] || currentPath.indexOf(routes[i][0] + "/") === 0) return routes[i][1] + currentPath.slice(routes[i][0].length) + suffix;
      return null;
    }
    if (view === "app") target = mapWebToApp(path, location.search);
    else if (params.get("preview") !== "1") target = mapAppToWeb(path, location.search);
    document.documentElement.classList.add("js");
    try { if (sessionStorage.getItem("ss-splash-shown")) document.documentElement.classList.add("ss-splash-skip"); } catch (_error) {}
    document.documentElement.dataset.appMode = view;
    document.documentElement.dataset.view = view;
    document.documentElement.dataset.installed = installed ? "true" : "false";
    if (target && target !== path + location.search) location.replace(target + location.hash);
  } catch (_error) {}
})();
