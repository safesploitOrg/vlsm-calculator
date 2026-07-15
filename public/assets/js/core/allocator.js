import {
  MAX_IPV4,
  alignToBoundary,
  integerToIpv4,
  prefixToMask
} from './ipv4.js';
import {
  GATEWAY_POSITIONS,
  getAddressingMode,
  getGatewayPosition
} from './addressing-modes.js';
import { findCidrOverlaps } from './cidr.js';

export function subnetSizeForHosts(
  requiredHosts,
  addressingMode = 'standard',
  gatewayPosition = 'last'
) {
  if (!Number.isSafeInteger(requiredHosts) || requiredHosts < 1) {
    throw new Error('Required hosts must be a positive integer.');
  }

  const policy = getAddressingMode(addressingMode);
  getGatewayPosition(gatewayPosition);
  const minimumSize = 2 ** (32 - policy.maximumPrefix);
  const totalAddresses = Math.max(
    minimumSize,
    2 ** Math.ceil(Math.log2(requiredHosts + policy.reservedAddresses))
  );
  const prefix = 32 - Math.log2(totalAddresses);
  if (prefix < policy.minimumPrefix) {
    throw new Error(
      `${policy.label} subnets must be between /${policy.minimumPrefix} and /${policy.maximumPrefix}. ` +
      `${requiredHosts.toLocaleString()} hosts require a /${prefix} block.`
    );
  }

  return {
    totalAddresses,
    prefix,
    usableHosts: totalAddresses - policy.reservedAddresses,
    reservedAddresses: policy.reservedAddresses,
    firstUsableOffset: policy.firstUsableOffset
  };
}

export function allocateVlsm({
  parent,
  subnets,
  addressingMode = 'standard',
  gatewayPosition = 'last'
}) {
  const policy = getAddressingMode(addressingMode);
  const requestedGatewayPosition = getGatewayPosition(gatewayPosition);
  const effectiveGatewayPosition = policy.gatewayIsProviderReserved
    ? GATEWAY_POSITIONS.provider
    : requestedGatewayPosition;
  if (parent.prefix < policy.minimumPrefix || parent.prefix > policy.maximumPrefix) {
    throw new Error(
      `${policy.label} parent networks must use a prefix between ` +
      `/${policy.minimumPrefix} and /${policy.maximumPrefix}.`
    );
  }
  const orderedSubnets = [...subnets].sort((left, right) =>
    (right.requiredHosts - left.requiredHosts) || (left.originalIndex - right.originalIndex));

  const allocations = [];
  let nextAddress = parent.networkInteger;

  for (const subnet of orderedSubnets) {
    const sizing = subnetSizeForHosts(subnet.requiredHosts, policy, requestedGatewayPosition.id);
    const network = nextAddress > MAX_IPV4
      ? nextAddress
      : alignToBoundary(nextAddress, sizing.totalAddresses);
    const broadcast = network + sizing.totalAddresses - 1;

    if (network > MAX_IPV4 || broadcast > MAX_IPV4 || broadcast > parent.broadcastInteger) {
      throw new Error(
        `The requested subnets do not fit inside ${parent.cidr}. ` +
        `“${subnet.name}” needs a /${sizing.prefix} block (${sizing.totalAddresses.toLocaleString()} addresses).`
      );
    }

    const providerGateway = policy.gatewayIsProviderReserved;
    const gateway = providerGateway || requestedGatewayPosition.id === 'first'
      ? network + (providerGateway ? policy.gatewayOffset : sizing.firstUsableOffset)
      : broadcast - 1;
    const firstHost = !providerGateway && requestedGatewayPosition.id === 'first'
      ? gateway + 1
      : network + sizing.firstUsableOffset;
    const lastHost = !providerGateway && requestedGatewayPosition.id === 'last'
      ? gateway - 1
      : broadcast - 1;

    allocations.push({
      name: subnet.name,
      vlanId: subnet.vlanId ?? null,
      requiredHosts: subnet.requiredHosts,
      cidr: `${integerToIpv4(network)}/${sizing.prefix}`,
      network: integerToIpv4(network),
      gateway: integerToIpv4(gateway),
      firstHost: integerToIpv4(firstHost),
      lastHost: integerToIpv4(lastHost),
      broadcast: integerToIpv4(broadcast),
      subnetMask: prefixToMask(sizing.prefix),
      prefix: sizing.prefix,
      usableHosts: sizing.usableHosts,
      reservedAddresses: sizing.reservedAddresses,
      totalAddresses: sizing.totalAddresses
    });

    nextAddress = broadcast + 1;
  }

  const requestedHosts = allocations.reduce((total, subnet) => total + subnet.requiredHosts, 0);
  const allocatedAddresses = allocations.reduce((total, subnet) => total + subnet.totalAddresses, 0);
  const remainingAddresses = parent.totalAddresses - allocatedAddresses;
  const overlaps = findCidrOverlaps(allocations.map((allocation) => allocation.cidr));
  if (overlaps.length > 0) {
    const conflict = overlaps[0];
    throw new Error(
      `Allocation overlap detected between ${conflict.left.cidr} and ${conflict.right.cidr}.`
    );
  }

  return {
    parent,
    addressingMode: policy,
    gatewayPosition: effectiveGatewayPosition,
    summary: {
      requestedHosts,
      allocatedAddresses,
      remainingAddresses,
      utilisation: (allocatedAddresses / parent.totalAddresses) * 100
    },
    allocations
  };
}
