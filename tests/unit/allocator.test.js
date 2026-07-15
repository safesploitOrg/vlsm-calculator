import assert from 'node:assert/strict';
import test from 'node:test';

import { allocateVlsm, subnetSizeForHosts } from '../../public/assets/js/core/allocator.js';
import { parseCidr } from '../../public/assets/js/core/cidr.js';

function request(cidr, subnets, addressingMode = 'standard', gatewayPosition = 'last') {
  return {
    parent: parseCidr(cidr),
    subnets: subnets.map((subnet, originalIndex) => ({ ...subnet, originalIndex })),
    addressingMode,
    gatewayPosition
  };
}

test('uses traditional subnet capacity with /30 as the minimum', () => {
  assert.deepEqual(subnetSizeForHosts(1), {
    totalAddresses: 4,
    prefix: 30,
    usableHosts: 2,
    reservedAddresses: 2,
    firstUsableOffset: 1
  });
  assert.deepEqual(subnetSizeForHosts(50), {
    totalAddresses: 64,
    prefix: 26,
    usableHosts: 62,
    reservedAddresses: 2,
    firstUsableOffset: 1
  });
  assert.equal(subnetSizeForHosts(126).prefix, 25);
});

test('applies AWS VPC reservations and subnet-size limits', () => {
  assert.deepEqual(subnetSizeForHosts(11, 'aws'), {
    totalAddresses: 16,
    prefix: 28,
    usableHosts: 11,
    reservedAddresses: 5,
    firstUsableOffset: 4
  });
  assert.equal(subnetSizeForHosts(12, 'aws').prefix, 27);
  assert.throws(() => subnetSizeForHosts(65_532, 'aws'), /between \/16 and \/28/);
});

test('allocates AWS VPC subnets from the fourth host offset', () => {
  const result = allocateVlsm(request('10.0.0.0/24', [
    { name: 'Application', requiredHosts: 11 }
  ], 'aws'));

  assert.deepEqual(result.allocations[0], {
    name: 'Application',
    vlanId: null,
    requiredHosts: 11,
    cidr: '10.0.0.0/28',
    network: '10.0.0.0',
    gateway: '10.0.0.1',
    firstHost: '10.0.0.4',
    lastHost: '10.0.0.14',
    broadcast: '10.0.0.15',
    subnetMask: '255.255.255.240',
    prefix: 28,
    usableHosts: 11,
    reservedAddresses: 5,
    totalAddresses: 16
  });
  assert.equal(result.addressingMode.id, 'aws');
  assert.equal(result.gatewayPosition.id, 'provider');
});

test('applies Azure reservations with /29 as the smallest subnet', () => {
  assert.equal(subnetSizeForHosts(3, 'azure').prefix, 29);
  assert.equal(subnetSizeForHosts(4, 'azure').prefix, 28);

  const result = allocateVlsm(request('10.0.0.0/24', [
    { name: 'Workload', requiredHosts: 3 }
  ], 'azure'));
  assert.equal(result.allocations[0].firstHost, '10.0.0.4');
  assert.equal(result.allocations[0].gateway, '10.0.0.1');
  assert.equal(result.allocations[0].lastHost, '10.0.0.6');
  assert.equal(result.allocations[0].reservedAddresses, 5);
});

test('defaults the standard gateway to the last usable address outside the host range', () => {
  const result = allocateVlsm(request('192.168.0.0/24', [
    { name: 'Users', vlanId: 120, requiredHosts: 50 }
  ]));

  assert.equal(result.allocations[0].vlanId, 120);
  assert.equal(result.allocations[0].firstHost, '192.168.0.1');
  assert.equal(result.allocations[0].lastHost, '192.168.0.61');
  assert.equal(result.allocations[0].gateway, '192.168.0.62');
  assert.equal(result.allocations[0].usableHosts, 62);
  assert.equal(result.gatewayPosition.id, 'last');
});

test('can place the standard gateway first without overlapping the host range', () => {
  const result = allocateVlsm(request('192.168.0.0/24', [
    { name: 'Users', requiredHosts: 50 }
  ], 'standard', 'first'));

  assert.equal(result.allocations[0].gateway, '192.168.0.1');
  assert.equal(result.allocations[0].firstHost, '192.168.0.2');
  assert.equal(result.allocations[0].lastHost, '192.168.0.62');
  assert.equal(result.gatewayPosition.id, 'first');
});

test('rejects provider parent networks outside the supported prefix range', () => {
  assert.throws(
    () => allocateVlsm(request('10.0.0.0/15', [{ name: 'App', requiredHosts: 10 }], 'aws')),
    /AWS VPC parent networks.*\/16 and \/28/
  );
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
  assert.equal(result.allocations[0].gateway, '255.255.255.254');
  assert.equal(result.allocations[0].firstHost, '255.255.255.253');
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
