function homeForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "driver") return "/driver";
  return "/";
}

module.exports = { homeForRole };
