import { integerToIpv4 } from './ipv4.js';
import { parseCidrRange } from './cidr.js';

const IPV4_ADDRESS_COUNT = 2 ** 32;

function largestAlignedBlock(address) {
  if (address === 0) {
    return IPV4_ADDRESS_COUNT;
  }

  let size = 1;
  while (size < IPV4_ADDRESS_COUNT && address % (size * 2) === 0) {
    size *= 2;
  }
  return size;
}

function rangeToCidrs(start, end) {
  const cidrs = [];
  let address = start;

  while (address <= end) {
    const remainingAddresses = end - address + 1;
    const fittingBlock = 2 ** Math.floor(Math.log2(remainingAddresses));
    const blockSize = Math.min(largestAlignedBlock(address), fittingBlock);
    const prefix = 32 - Math.log2(blockSize);
    cidrs.push(`${integerToIpv4(address)}/${prefix}`);
    address += blockSize;
  }

  return cidrs;
}

export function summarizeCidrs(values) {
  if (!Array.isArray(values)) {
    throw new TypeError('Routes must be provided as an array of CIDR blocks.');
  }
  if (values.length === 0) {
    throw new Error('Add at least one CIDR block to summarise.');
  }

  const ranges = values
    .map((value) => parseCidrRange(value))
    .sort((left, right) =>
      (left.networkInteger - right.networkInteger) ||
      (right.broadcastInteger - left.broadcastInteger));

  const mergedRanges = [];
  for (const range of ranges) {
    const previous = mergedRanges.at(-1);
    if (!previous || range.networkInteger > previous.end + 1) {
      mergedRanges.push({ start: range.networkInteger, end: range.broadcastInteger });
    } else {
      previous.end = Math.max(previous.end, range.broadcastInteger);
    }
  }

  return mergedRanges.flatMap(({ start, end }) => rangeToCidrs(start, end));
}
