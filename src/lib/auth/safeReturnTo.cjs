function safeReturnTo(value, fallback = "/") {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value) || /^[a-z][a-z\d+.-]*:/i.test(value)) return fallback;
  return value;
}

module.exports = safeReturnTo;
