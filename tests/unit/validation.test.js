import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAllocationRequest } from '../../public/assets/js/core/validation.js';

test('validates and normalises an allocation request', () => {
  const result = validateAllocationRequest({
    parentCidr: '10.0.0.22/24',
    subnets: [{ name: ' Users ', requiredHosts: '20' }]
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.parent.cidr, '10.0.0.0/24');
  assert.deepEqual(result.value.subnets[0], { name: 'Users', requiredHosts: 20, originalIndex: 0 });
  assert.equal(result.notices.length, 1);
});

test('reports actionable row and duplicate-name errors', () => {
  const result = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    subnets: [
      { name: 'Users', requiredHosts: '0' },
      { name: 'users', requiredHosts: 'ten' }
    ]
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.length, 3);
  assert.match(result.errors.join(' '), /unique/);
});
