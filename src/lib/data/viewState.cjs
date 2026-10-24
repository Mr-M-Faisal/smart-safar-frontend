function getDataViewState({ isLoading = false, error = null, data = null, hasCache = false } = {}) {
  const hasData = Array.isArray(data) ? data.length > 0 : data != null;
  if (hasCache && hasData) return 'cached';
  if (isLoading && !hasData) return 'loading';
  if (error && !hasData) return 'error';
  if (!hasData) return 'empty';
  return 'ready';
}

module.exports = { getDataViewState };
