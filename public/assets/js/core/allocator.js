import {
  MAX_IPV4,
  alignToBoundary,
  integerToIpv4,
  prefixToMask
} from './ipv4.js';

export function subnetSizeForHosts(requiredHosts) {
  if (!Number.isSafeInteger(requiredHosts) || requiredHosts < 1) {
    throw new Error('Required hosts must be a positive integer.');
  }

  const totalAddresses = Math.max(4, 2 ** Math.ceil(Math.log2(requiredHosts + 2)));
  return {
    totalAddresses,
    prefix: 32 - Math.log2(totalAddresses),
    usableHosts: totalAddresses - 2
  };
}

export function allocateVlsm({ parent, subnets }) {
  const orderedSubnets = [...subnets].sort((left, right) =>
    (right.requiredHosts - left.requiredHosts) || (left.originalIndex - right.originalIndex));

  const allocations = [];
  let nextAddress = parent.networkInteger;

  for (const subnet of orderedSubnets) {
    const sizing = subnetSizeForHosts(subnet.requiredHosts);
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

    allocations.push({
      name: subnet.name,
      requiredHosts: subnet.requiredHosts,
      cidr: `${integerToIpv4(network)}/${sizing.prefix}`,
      network: integerToIpv4(network),
      firstHost: integerToIpv4(network + 1),
      lastHost: integerToIpv4(broadcast - 1),
      broadcast: integerToIpv4(broadcast),
      subnetMask: prefixToMask(sizing.prefix),
      prefix: sizing.prefix,
      usableHosts: sizing.usableHosts,
      totalAddresses: sizing.totalAddresses
    });

    nextAddress = broadcast + 1;
  }

  const requestedHosts = allocations.reduce((total, subnet) => total + subnet.requiredHosts, 0);
  const allocatedAddresses = allocations.reduce((total, subnet) => total + subnet.totalAddresses, 0);
  const remainingAddresses = parent.totalAddresses - allocatedAddresses;

  return {
    parent,
    summary: {
      requestedHosts,
      allocatedAddresses,
      remainingAddresses,
      utilisation: (allocatedAddresses / parent.totalAddresses) * 100
    },
    allocations
  };
}
