function resolveActiveTab(items = [], pathname = "/", search = "") {
  const params = search instanceof URLSearchParams ? search : new URLSearchParams(String(search || "").replace(/^\?/, ""));
  let match = null;
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const target = new URL(item.href, "https://smartsafar.invalid");
    const queryMatches = [...target.searchParams].every(([key, value]) => params.get(key) === value);
    if (!queryMatches) continue;
    const matchesPath = (base, prefix) => {
      const normalized = base.length > 1 ? base.replace(/\/$/, "") : base;
      return pathname === normalized || (prefix && pathname.startsWith(`${normalized === "/" ? "" : normalized}/`));
    };
    const candidates = [];
    if (matchesPath(target.pathname, !item.exact)) candidates.push(target.pathname.length);
    for (const path of item.matchPaths || []) if (matchesPath(path, true)) candidates.push(path.replace(/\/$/, "").length);
    if (!candidates.length) continue;
    const score = Math.max(...candidates);
    if (!match || score > match.score) match = { index, score };
  }
  return match?.index ?? -1;
}

module.exports = { resolveActiveTab };
