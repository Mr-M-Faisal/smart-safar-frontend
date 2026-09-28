function getBusListViewState({ loading = false, error = null, buses = [] } = {}) {
  if (loading) return 'loading';
  if (error) return 'error';
  return buses.length ? 'ready' : 'empty';
}
module.exports = { getBusListViewState };
