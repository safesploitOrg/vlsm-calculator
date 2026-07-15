import assert from 'node:assert/strict';
import test from 'node:test';

import {
  STORAGE_KEY,
  STORAGE_TTL_MS,
  clearCalculatorState,
  loadCalculatorState,
  saveCalculatorState
} from '../../public/assets/js/ui/storage.js';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

test('persists calculator content for 90 days', () => {
  const storage = memoryStorage();
  const now = Date.UTC(2026, 0, 1);
  const state = {
    parentCidr: '10.0.0.0/24',
    gatewayPosition: 'last',
    subnets: [{ name: 'Users', vlanId: '40', requiredHosts: '20' }],
    selectedColumns: ['vlanId', 'cidr', 'gateway'],
    routeCidrs: '10.0.0.0/25\n10.0.0.128/25'
  };

  assert.equal(saveCalculatorState(storage, state, now), true);
  assert.deepEqual(loadCalculatorState(storage, now + STORAGE_TTL_MS - 1), state);
});

test('expires and removes calculator content after 90 days', () => {
  const storage = memoryStorage();
  const now = Date.UTC(2026, 0, 1);
  saveCalculatorState(storage, { parentCidr: '10.0.0.0/24' }, now);

  assert.equal(loadCalculatorState(storage, now + STORAGE_TTL_MS), null);
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test('clears calculator content on reset', () => {
  const storage = memoryStorage();
  saveCalculatorState(storage, { parentCidr: '10.0.0.0/24' });
  assert.equal(clearCalculatorState(storage), true);
  assert.equal(loadCalculatorState(storage), null);
});

test('fails safely when browser storage is unavailable', () => {
  const blockedStorage = {
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
    removeItem: () => { throw new Error('blocked'); }
  };

  assert.equal(saveCalculatorState(blockedStorage, {}), false);
  assert.equal(loadCalculatorState(blockedStorage), null);
  assert.equal(clearCalculatorState(blockedStorage), false);
});
