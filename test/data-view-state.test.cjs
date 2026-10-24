const test = require('node:test');
const assert = require('node:assert/strict');
const { getDataViewState } = require('../src/lib/data/viewState.cjs');

test('data view distinguishes loading, cached, ready, empty and error', () => {
  assert.equal(getDataViewState({ isLoading: true }), 'loading');
  assert.equal(getDataViewState({ isLoading: true, data: [{ _id: 'cache' }], hasCache: true }), 'cached');
  assert.equal(getDataViewState({ data: [{ _id: 'fresh' }] }), 'ready');
  assert.equal(getDataViewState({ data: [] }), 'empty');
  assert.equal(getDataViewState({ error: new Error('offline') }), 'error');
});
