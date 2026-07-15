export const ADDRESSING_MODES = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard IPv4',
    description: 'Reserves the network and broadcast addresses.',
    gatewayIsProviderReserved: false,
    gatewayOffset: null,
    firstUsableOffset: 1,
    reservedAddresses: 2,
    minimumPrefix: 0,
    maximumPrefix: 30
  }),
  aws: Object.freeze({
    id: 'aws',
    label: 'AWS VPC',
    description: 'Reserves the first four and final address in every subnet.',
    gatewayIsProviderReserved: true,
    gatewayOffset: 1,
    firstUsableOffset: 4,
    reservedAddresses: 5,
    minimumPrefix: 16,
    maximumPrefix: 28
  }),
  azure: Object.freeze({
    id: 'azure',
    label: 'Azure virtual network',
    description: 'Reserves the first four and final address in every subnet.',
    gatewayIsProviderReserved: true,
    gatewayOffset: 1,
    firstUsableOffset: 4,
    reservedAddresses: 5,
    minimumPrefix: 2,
    maximumPrefix: 29
  })
});

export const GATEWAY_POSITIONS = Object.freeze({
  first: Object.freeze({ id: 'first', label: 'First usable address' }),
  last: Object.freeze({ id: 'last', label: 'Last usable address' }),
  provider: Object.freeze({ id: 'provider', label: 'Provider managed (network + 1)' })
});

export function getAddressingMode(mode = 'standard') {
  const modeId = typeof mode === 'string' ? mode : mode?.id;
  const policy = ADDRESSING_MODES[modeId];
  if (!policy) {
    throw new Error(`Unsupported addressing mode: ${modeId ?? mode}`);
  }
  return policy;
}

export function maximumHostsForMode(mode = 'standard') {
  const policy = getAddressingMode(mode);
  return (2 ** (32 - policy.minimumPrefix)) - policy.reservedAddresses;
}

export function getGatewayPosition(position = 'last') {
  const gatewayPosition = GATEWAY_POSITIONS[position];
  if (!gatewayPosition || position === 'provider') {
    throw new Error(`Unsupported gateway position: ${position}`);
  }
  return gatewayPosition;
}
