const test = require('node:test');
const assert = require('node:assert/strict');
const { getBusListViewState } = require('../src/lib/busListState.cjs');

test('two operating buses render the bus list', () => assert.equal(getBusListViewState({ buses: [{}, {}] }), 'ready'));
test('route with no operating buses renders the empty state', () => assert.equal(getBusListViewState({ buses: [] }), 'empty'));
test('request failure renders an error state instead of an empty state', () => assert.equal(getBusListViewState({ buses: [], error: new Error('offline') }), 'error'));
