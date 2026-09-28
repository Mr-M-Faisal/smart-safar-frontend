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
  return status === 401 && Boolean(token) && !String(path || '').startsWith('/auth/');
}
module.exports = { createRefreshCoordinator, refreshRejected, shouldRefreshAfter401 };
