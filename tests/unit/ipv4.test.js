import assert from 'node:assert/strict';
import test from 'node:test';

import {
  integerToIpv4,
  ipv4ToInteger,
  networkInteger,
  prefixToMask
} from '../../public/assets/js/core/ipv4.js';

test('converts IPv4 values without signed 32-bit overflow', () => {
  assert.equal(ipv4ToInteger('255.255.255.255'), 4294967295);
  assert.equal(integerToIpv4(4294967295), '255.255.255.255');
  assert.equal(ipv4ToInteger('172.16.0.1'), 2886729729);
});

test('rejects invalid IPv4 values', () => {
  assert.throws(() => ipv4ToInteger('192.168.1.256'), /Invalid IPv4/);
  assert.throws(() => ipv4ToInteger('192.168.1'), /Invalid IPv4/);
  assert.throws(() => integerToIpv4(4294967296), /between/);
});

test('calculates masks and network boundaries', () => {
  assert.equal(prefixToMask(26), '255.255.255.192');
  assert.equal(prefixToMask(0), '0.0.0.0');
  assert.equal(integerToIpv4(networkInteger(ipv4ToInteger('172.16.0.77'), 26)), '172.16.0.64');
});
