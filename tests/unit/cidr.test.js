import assert from 'node:assert/strict';
import test from 'node:test';

import { parseCidr } from '../../public/assets/js/core/cidr.js';

test('parses a parent CIDR into a structured range', () => {
  assert.deepEqual(
    {
      cidr: parseCidr('172.16.0.0/24').cidr,
      broadcast: parseCidr('172.16.0.0/24').broadcast,
      totalAddresses: parseCidr('172.16.0.0/24').totalAddresses
    },
    { cidr: '172.16.0.0/24', broadcast: '172.16.0.255', totalAddresses: 256 }
  );
});

test('normalises a host address to the parent network boundary', () => {
  const parent = parseCidr('172.16.0.77/26');
  assert.equal(parent.cidr, '172.16.0.64/26');
  assert.equal(parent.wasNormalised, true);
});

test('requires CIDR notation and a traditional parent block', () => {
  assert.throws(() => parseCidr('172.16.0.0'), /CIDR notation/);
  assert.throws(() => parseCidr('172.16.0.0/31'), /between \/0 and \/30/);
});
