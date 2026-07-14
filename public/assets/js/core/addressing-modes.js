export const ADDRESSING_MODES = Object.freeze({
  standard: Object.freeze({
    id: 'standard',
    label: 'Standard IPv4',
    description: 'Reserves the network and broadcast addresses.',
    firstUsableOffset: 1,
    reservedAddresses: 2,
    minimumPrefix: 0,
    maximumPrefix: 30
  }),
  aws: Object.freeze({
    id: 'aws',
    label: 'AWS VPC',
    description: 'Reserves the first four and final address in every subnet.',
    firstUsableOffset: 4,
    reservedAddresses: 5,
    minimumPrefix: 16,
    maximumPrefix: 28
  }),
  azure: Object.freeze({
    id: 'azure',
    label: 'Azure virtual network',
    description: 'Reserves the first four and final address in every subnet.',
    firstUsableOffset: 4,
    reservedAddresses: 5,
    minimumPrefix: 2,
    maximumPrefix: 29
  })
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
