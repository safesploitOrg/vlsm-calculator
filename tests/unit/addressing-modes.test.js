import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADDRESSING_MODES,
  getAddressingMode,
  maximumHostsForMode
} from '../../public/assets/js/core/addressing-modes.js';

test('returns immutable addressing policies by id or policy object', () => {
  assert.equal(getAddressingMode().id, 'standard');
  assert.equal(getAddressingMode('aws'), ADDRESSING_MODES.aws);
  assert.equal(getAddressingMode(ADDRESSING_MODES.azure), ADDRESSING_MODES.azure);
  assert.equal(Object.isFrozen(ADDRESSING_MODES), true);
  assert.equal(Object.isFrozen(ADDRESSING_MODES.aws), true);
});

test('calculates the maximum assignable hosts for each provider', () => {
  assert.equal(maximumHostsForMode('standard'), (2 ** 32) - 2);
  assert.equal(maximumHostsForMode('aws'), 65_531);
  assert.equal(maximumHostsForMode('azure'), (2 ** 30) - 5);
});

test('rejects unsupported addressing policies', () => {
  assert.throws(() => getAddressingMode('gcp'), /Unsupported addressing mode/);
  assert.throws(() => getAddressingMode({ id: 'gcp' }), /Unsupported addressing mode/);
});
