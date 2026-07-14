export const MAX_IPV4 = 0xffffffff;

export function ipv4ToInteger(value) {
  if (typeof value !== 'string') {
    throw new TypeError('IPv4 address must be text.');
  }

  const parts = value.trim().split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) {
    throw new Error(`Invalid IPv4 address: ${value}`);
  }

  const octets = parts.map(Number);
  if (octets.some((octet) => octet > 255)) {
    throw new Error(`Invalid IPv4 address: ${value}`);
  }

  return octets.reduce((address, octet) => (address * 256) + octet, 0);
}

export function integerToIpv4(value) {
  if (!Number.isInteger(value) || value < 0 || value > MAX_IPV4) {
    throw new Error(`IPv4 integer must be between 0 and ${MAX_IPV4}.`);
  }

  return [
    Math.floor(value / 0x1000000) % 256,
    Math.floor(value / 0x10000) % 256,
    Math.floor(value / 0x100) % 256,
    value % 256
  ].join('.');
}

export function assertPrefix(prefix) {
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    throw new Error('CIDR prefix must be an integer from 0 to 32.');
  }
}

export function addressCount(prefix) {
  assertPrefix(prefix);
  return 2 ** (32 - prefix);
}

export function networkInteger(address, prefix) {
  assertPrefix(prefix);
  const blockSize = addressCount(prefix);
  return Math.floor(address / blockSize) * blockSize;
}

export function broadcastInteger(address, prefix) {
  return networkInteger(address, prefix) + addressCount(prefix) - 1;
}

export function prefixToMask(prefix) {
  assertPrefix(prefix);
  if (prefix === 0) {
    return '0.0.0.0';
  }

  return integerToIpv4(MAX_IPV4 - (addressCount(prefix) - 1));
}

export function alignToBoundary(address, blockSize) {
  if (!Number.isInteger(address) || address < 0 || address > MAX_IPV4) {
    throw new Error('Cannot align an invalid IPv4 integer.');
  }
  if (!Number.isInteger(blockSize) || blockSize < 1) {
    throw new Error('Block size must be a positive integer.');
  }

  return Math.ceil(address / blockSize) * blockSize;
}
