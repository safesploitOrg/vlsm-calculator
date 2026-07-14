import {
  addressCount,
  broadcastInteger,
  integerToIpv4,
  ipv4ToInteger,
  networkInteger,
  prefixToMask
} from './ipv4.js';

export function parseCidr(value) {
  return parseCidrRange(value, { maximumPrefix: 30, context: 'Parent network' });
}

export function parseCidrRange(value, options = {}) {
  const {
    minimumPrefix = 0,
    maximumPrefix = 32,
    context = 'CIDR block'
  } = options;

  if (typeof value !== 'string') {
    throw new TypeError(`${context} must be text in CIDR notation.`);
  }

  const match = value.trim().match(/^(.+)\/(\d{1,2})$/);
  if (!match) {
    throw new Error(`Enter the ${context.toLocaleLowerCase()} in CIDR notation, for example 172.16.0.0/24.`);
  }

  const suppliedAddress = ipv4ToInteger(match[1]);
  const prefix = Number(match[2]);
  if (!Number.isInteger(prefix) || prefix < minimumPrefix || prefix > maximumPrefix) {
    throw new Error(`${context} prefix must be between /${minimumPrefix} and /${maximumPrefix}.`);
  }

  const network = networkInteger(suppliedAddress, prefix);
  const broadcast = broadcastInteger(network, prefix);

  return {
    cidr: `${integerToIpv4(network)}/${prefix}`,
    suppliedAddress: integerToIpv4(suppliedAddress),
    wasNormalised: suppliedAddress !== network,
    network: integerToIpv4(network),
    networkInteger: network,
    broadcast: integerToIpv4(broadcast),
    broadcastInteger: broadcast,
    prefix,
    subnetMask: prefixToMask(prefix),
    totalAddresses: addressCount(prefix)
  };
}

export function compareCidrRanges(leftValue, rightValue) {
  const left = parseCidrRange(leftValue);
  const right = parseCidrRange(rightValue);
  const overlaps = left.networkInteger <= right.broadcastInteger &&
    right.networkInteger <= left.broadcastInteger;
  const adjacent = !overlaps && (
    left.broadcastInteger + 1 === right.networkInteger ||
    right.broadcastInteger + 1 === left.networkInteger
  );

  let relationship = 'separate';
  if (left.networkInteger === right.networkInteger && left.broadcastInteger === right.broadcastInteger) {
    relationship = 'equal';
  } else if (left.networkInteger <= right.networkInteger && left.broadcastInteger >= right.broadcastInteger) {
    relationship = 'contains';
  } else if (right.networkInteger <= left.networkInteger && right.broadcastInteger >= left.broadcastInteger) {
    relationship = 'contained-by';
  } else if (adjacent) {
    relationship = 'adjacent';
  }

  return { left, right, overlaps, adjacent, relationship };
}

export function cidrsOverlap(leftValue, rightValue) {
  return compareCidrRanges(leftValue, rightValue).overlaps;
}

export function findCidrOverlaps(values) {
  if (!Array.isArray(values)) {
    throw new TypeError('CIDR ranges must be provided as an array.');
  }

  const ranges = values.map((value) => parseCidrRange(value));
  const overlaps = [];
  for (let leftIndex = 0; leftIndex < ranges.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < ranges.length; rightIndex += 1) {
      const left = ranges[leftIndex];
      const right = ranges[rightIndex];
      if (left.networkInteger <= right.broadcastInteger &&
          right.networkInteger <= left.broadcastInteger) {
        overlaps.push({ leftIndex, rightIndex, left, right });
      }
    }
  }
  return overlaps;
}
