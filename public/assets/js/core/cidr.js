import {
  addressCount,
  broadcastInteger,
  integerToIpv4,
  ipv4ToInteger,
  networkInteger,
  prefixToMask
} from './ipv4.js';

export function parseCidr(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Parent network must be text in CIDR notation.');
  }

  const match = value.trim().match(/^(.+)\/(\d{1,2})$/);
  if (!match) {
    throw new Error('Enter the parent network in CIDR notation, for example 172.16.0.0/24.');
  }

  const suppliedAddress = ipv4ToInteger(match[1]);
  const prefix = Number(match[2]);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 30) {
    throw new Error('Parent prefix must be between /0 and /30.');
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
