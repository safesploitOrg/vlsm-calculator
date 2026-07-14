import assert from 'node:assert/strict';
import test from 'node:test';

import {
  cidrsOverlap,
  compareCidrRanges,
  findCidrOverlaps,
  parseCidrRange
} from '../../public/assets/js/core/cidr.js';

test('detects equal and contained CIDR ranges after canonicalisation', () => {
  const equal = compareCidrRanges('10.0.0.7/24', '10.0.0.0/24');
  assert.equal(equal.relationship, 'equal');
  assert.equal(equal.overlaps, true);
  assert.equal(equal.left.cidr, '10.0.0.0/24');

  const contains = compareCidrRanges('10.0.0.0/24', '10.0.0.128/25');
  assert.equal(contains.relationship, 'contains');
  assert.equal(contains.overlaps, true);

  const containedBy = compareCidrRanges('10.0.0.128/25', '10.0.0.0/24');
  assert.equal(containedBy.relationship, 'contained-by');
  assert.equal(cidrsOverlap('10.0.0.128/25', '10.0.0.0/24'), true);
});

test('distinguishes adjacent ranges from separate ranges', () => {
  const adjacent = compareCidrRanges('10.0.0.0/25', '10.0.0.128/25');
  assert.deepEqual(
    { overlaps: adjacent.overlaps, adjacent: adjacent.adjacent, relationship: adjacent.relationship },
    { overlaps: false, adjacent: true, relationship: 'adjacent' }
  );

  const reversed = compareCidrRanges('10.0.0.128/25', '10.0.0.0/25');
  assert.equal(reversed.relationship, 'adjacent');

  const separate = compareCidrRanges('10.0.0.0/25', '10.0.2.0/24');
  assert.equal(separate.relationship, 'separate');
  assert.equal(cidrsOverlap('10.0.0.0/25', '10.0.2.0/24'), false);
});

test('supports /31 and /32 ranges in overlap checks', () => {
  const pointToPoint = compareCidrRanges('192.0.2.0/31', '192.0.2.1/32');
  assert.equal(pointToPoint.relationship, 'contains');
  assert.equal(pointToPoint.overlaps, true);

  const hosts = compareCidrRanges('255.255.255.254/32', '255.255.255.255/32');
  assert.equal(hosts.relationship, 'adjacent');
  assert.equal(parseCidrRange('0.0.0.0/0').totalAddresses, 2 ** 32);
});

test('finds every conflicting pair in a list without flagging adjacency', () => {
  const overlaps = findCidrOverlaps([
    '10.0.0.0/24',
    '10.0.0.128/25',
    '10.0.0.0/25',
    '10.0.1.0/24'
  ]);

  assert.deepEqual(overlaps.map(({ leftIndex, rightIndex }) => [leftIndex, rightIndex]), [
    [0, 1],
    [0, 2]
  ]);
});

test('rejects malformed overlap inputs', () => {
  assert.throws(() => findCidrOverlaps('10.0.0.0/24'), /array/);
  assert.throws(() => parseCidrRange(10), /must be text/);
  assert.throws(() => compareCidrRanges('10.0.0.0/33', '10.0.0.0/24'), /between \/0 and \/32/);
});
