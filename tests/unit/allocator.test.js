import assert from 'node:assert/strict';
import test from 'node:test';

import { allocateVlsm, subnetSizeForHosts } from '../../public/assets/js/core/allocator.js';
import { parseCidr } from '../../public/assets/js/core/cidr.js';

function request(cidr, subnets) {
  return {
    parent: parseCidr(cidr),
    subnets: subnets.map((subnet, originalIndex) => ({ ...subnet, originalIndex }))
  };
}

test('uses traditional subnet semantics with /30 as the minimum', () => {
  assert.deepEqual(subnetSizeForHosts(1), { totalAddresses: 4, prefix: 30, usableHosts: 2 });
  assert.deepEqual(subnetSizeForHosts(50), { totalAddresses: 64, prefix: 26, usableHosts: 62 });
});

test('allocates the example plan largest-first on valid boundaries', () => {
  const result = allocateVlsm(request('172.16.0.0/24', [
    { name: 'Monitoring', requiredHosts: 10 },
    { name: 'Management', requiredHosts: 50 },
    { name: 'Servers', requiredHosts: 30 }
  ]));

  assert.deepEqual(result.allocations.map(({ name, cidr }) => ({ name, cidr })), [
    { name: 'Management', cidr: '172.16.0.0/26' },
    { name: 'Servers', cidr: '172.16.0.64/27' },
    { name: 'Monitoring', cidr: '172.16.0.96/28' }
  ]);
  assert.deepEqual(result.summary, {
    requestedHosts: 90,
    allocatedAddresses: 112,
    remainingAddresses: 144,
    utilisation: 43.75
  });
});

test('supports an exact fit and preserves input order for equal sizes', () => {
  const result = allocateVlsm(request('10.0.0.0/24', [
    { name: 'First', requiredHosts: 126 },
    { name: 'Second', requiredHosts: 126 }
  ]));

  assert.deepEqual(result.allocations.map(({ name, cidr }) => ({ name, cidr })), [
    { name: 'First', cidr: '10.0.0.0/25' },
    { name: 'Second', cidr: '10.0.0.128/25' }
  ]);
  assert.equal(result.summary.remainingAddresses, 0);
});

test('rejects allocations that overflow the parent block', () => {
  assert.throws(
    () => allocateVlsm(request('192.168.1.0/25', [
      { name: 'Too large', requiredHosts: 126 },
      { name: 'Overflow', requiredHosts: 1 }
    ])),
    /do not fit inside 192\.168\.1\.0\/25/
  );
});

test('allocates safely at the IPv4 maximum boundary', () => {
  const result = allocateVlsm(request('255.255.255.252/30', [
    { name: 'Final block', requiredHosts: 2 }
  ]));
  assert.equal(result.allocations[0].broadcast, '255.255.255.255');
});

test('returns a parent-range error rather than wrapping after the IPv4 maximum', () => {
  assert.throws(
    () => allocateVlsm(request('255.255.255.252/30', [
      { name: 'Final block', requiredHosts: 2 },
      { name: 'No space', requiredHosts: 1 }
    ])),
    /do not fit inside 255\.255\.255\.252\/30/
  );
});
