(function registerNavigationPolicy(scope) {
  const privateNavigation = /^\/(?:passenger|driver|admin)(?:\/|$)|^\/m\/(?:login|driver|account|trips|admin|book)(?:\/|$)/;
  scope.SmartSafarNavigationPolicy = {
    isPrivateNavigation(pathname) {
      return privateNavigation.test(String(pathname || "/"));
    },
  };
})(self);
