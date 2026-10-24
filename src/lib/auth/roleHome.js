function homeForRole(role, isApp = false) {
  if (role === "admin") return isApp ? "/m/admin" : "/admin";
  if (role === "driver") return isApp ? "/m/driver" : "/driver";
  if (role === "commuter") return isApp ? "/m" : "/";
  return isApp ? "/m" : "/";
}

module.exports = { homeForRole };
