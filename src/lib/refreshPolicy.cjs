function createRefreshCoordinator() {
  const requests = new Map();
  return {
    run(key, refresh) {
      if (!requests.has(key)) requests.set(key, Promise.resolve().then(refresh).finally(() => requests.delete(key)));
      return requests.get(key);
    },
  };
}
function refreshRejected(status, payload) {
  return status === 401 || status === 403 || status === 400 && payload?.code === 'REFRESH_REJECTED';
}
function shouldRefreshAfter401(status, token, path) {
  const pathname = String(path || '').split('?', 1)[0];
  return status === 401 && Boolean(token) && (!pathname.startsWith('/auth/') || pathname === '/auth/profile');
}
module.exports = { createRefreshCoordinator, refreshRejected, shouldRefreshAfter401 };
