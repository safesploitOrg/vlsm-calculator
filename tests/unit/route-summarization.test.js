import assert from 'node:assert/strict';
import test from 'node:test';

import { summarizeCidrs } from '../../public/assets/js/core/route-summarization.js';

test('summarises sibling routes into their exact parent route', () => {
  assert.deepEqual(summarizeCidrs([
    '10.0.0.0/25',
    '10.0.0.128/25'
  ]), ['10.0.0.0/24']);
});

test('recursively summarises unordered routes and removes contained duplicates', () => {
  assert.deepEqual(summarizeCidrs([
    '10.0.0.192/26',
    '10.0.0.0/26',
    '10.0.0.64/26',
    '10.0.0.128/26',
    '10.0.0.9/24',
    '10.0.0.0/25'
  ]), ['10.0.0.0/24']);
});

test('does not broaden discontinuous or asymmetrically adjacent routes', () => {
  assert.deepEqual(summarizeCidrs([
    '10.0.2.0/24',
    '10.0.0.128/25',
    '10.0.1.0/24'
  ]), [
    '10.0.0.128/25',
    '10.0.1.0/24',
    '10.0.2.0/24'
  ]);
});

test('summarises host routes and the complete IPv4 range safely', () => {
  assert.deepEqual(summarizeCidrs([
    '192.0.2.3/32',
    '192.0.2.0/32',
    '192.0.2.2/32',
    '192.0.2.1/32'
  ]), ['192.0.2.0/30']);
  assert.deepEqual(summarizeCidrs(['0.0.0.0/0']), ['0.0.0.0/0']);
});

test('rejects empty, malformed, and non-array route inputs', () => {
  assert.throws(() => summarizeCidrs([]), /at least one CIDR/);
  assert.throws(() => summarizeCidrs(['not-a-route']), /CIDR notation/);
  assert.throws(() => summarizeCidrs('10.0.0.0/24'), /array/);
});
