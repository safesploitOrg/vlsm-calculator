import assert from 'node:assert/strict';
import test from 'node:test';

import { validateAllocationRequest } from '../../public/assets/js/core/validation.js';

test('validates and normalises an allocation request', () => {
  const result = validateAllocationRequest({
    parentCidr: '10.0.0.22/24',
    subnets: [{ name: ' Users ', requiredHosts: '20' }]
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.addressingMode, 'standard');
  assert.equal(result.value.gatewayPosition, 'last');
  assert.equal(result.value.parent.cidr, '10.0.0.0/24');
  assert.deepEqual(result.value.subnets[0], {
    name: 'Users', vlanId: null, requiredHosts: 20, originalIndex: 0
  });
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

test('validates AWS VPC and Azure virtual network parent-prefix policies', () => {
  const awsInvalid = validateAllocationRequest({
    parentCidr: '10.0.0.0/15',
    addressingMode: 'aws',
    subnets: [{ name: 'App', requiredHosts: '10' }]
  });
  assert.equal(awsInvalid.valid, false);
  assert.match(awsInvalid.errors.join(' '), /AWS VPC.*\/16 and \/28/);

  const awsValid = validateAllocationRequest({
    parentCidr: '10.0.0.0/16',
    addressingMode: 'aws',
    subnets: [{ name: 'App', requiredHosts: '65532' }]
  });
  assert.equal(awsValid.valid, false);
  assert.match(awsValid.errors.join(' '), /AWS VPC host limit/);

  const azureInvalid = validateAllocationRequest({
    parentCidr: '10.0.0.0/30',
    addressingMode: 'azure',
    subnets: [{ name: 'App', requiredHosts: '3' }]
  });
  assert.equal(azureInvalid.valid, false);
  assert.match(azureInvalid.errors.join(' '), /Azure virtual network.*\/2 and \/29/);

  const azureValid = validateAllocationRequest({
    parentCidr: '10.0.0.0/29',
    addressingMode: 'azure',
    subnets: [{ name: 'App', requiredHosts: '3' }]
  });
  assert.equal(azureValid.valid, true);
  assert.equal(azureValid.value.addressingMode, 'azure');
});

test('rejects an unsupported addressing mode', () => {
  const result = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    addressingMode: 'unknown',
    subnets: [{ name: 'App', requiredHosts: '10' }]
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /Unsupported addressing mode/);
});

test('validates the selected gateway position', () => {
  const valid = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    gatewayPosition: 'first',
    subnets: [{ name: 'App', requiredHosts: '10' }]
  });
  assert.equal(valid.valid, true);
  assert.equal(valid.value.gatewayPosition, 'first');

  const invalid = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    gatewayPosition: 'middle',
    subnets: [{ name: 'App', requiredHosts: '10' }]
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /Unsupported gateway position/);
});

test('normalises valid VLAN IDs and rejects reserved or duplicate values', () => {
  const valid = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    subnets: [
      { name: 'Users', vlanId: '1', requiredHosts: '20' },
      { name: 'Servers', vlanId: '4094', requiredHosts: '10' },
      { name: 'Un tagged', vlanId: '', requiredHosts: '5' }
    ]
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.value.subnets.map(({ vlanId }) => vlanId), [1, 4094, null]);

  const invalid = validateAllocationRequest({
    parentCidr: '10.0.0.0/24',
    subnets: [
      { name: 'Users', vlanId: '0', requiredHosts: '20' },
      { name: 'Servers', vlanId: '40', requiredHosts: '10' },
      { name: 'Storage', vlanId: '40', requiredHosts: '5' },
      { name: 'Guest', vlanId: '4095', requiredHosts: '5' }
    ]
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /1 to 4094/);
  assert.match(invalid.errors.join(' '), /VLAN 40 is repeated/);
});
