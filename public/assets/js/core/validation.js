import { parseCidr } from './cidr.js';
import {
  getAddressingMode,
  getGatewayPosition,
  maximumHostsForMode
} from './addressing-modes.js';

export function validateAllocationRequest({
  parentCidr,
  subnets,
  addressingMode = 'standard',
  gatewayPosition = 'last'
}) {
  const errors = [];
  let parent;
  let policy;
  let gateway;

  try {
    policy = getAddressingMode(addressingMode);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    gateway = getGatewayPosition(gatewayPosition);
  } catch (error) {
    errors.push(error.message);
  }

  try {
    parent = parseCidr(parentCidr);
  } catch (error) {
    errors.push(error.message);
  }

  if (parent && policy &&
      (parent.prefix < policy.minimumPrefix || parent.prefix > policy.maximumPrefix)) {
    errors.push(
      `${policy.label} parent networks must use a prefix between ` +
      `/${policy.minimumPrefix} and /${policy.maximumPrefix}.`
    );
  }

  if (!Array.isArray(subnets) || subnets.length === 0) {
    errors.push('Add at least one subnet requirement.');
  }

  const names = new Set();
  const vlanIds = new Set();
  const validatedSubnets = (subnets || []).map((subnet, index) => {
    const row = index + 1;
    const name = String(subnet.name ?? '').trim();
    const hostText = String(subnet.requiredHosts ?? '').trim();
    const requiredHosts = Number(hostText);
    const vlanText = String(subnet.vlanId ?? '').trim();
    const vlanId = vlanText === '' ? null : Number(vlanText);

    if (!name) {
      errors.push(`Subnet ${row} needs a name.`);
    } else if (names.has(name.toLocaleLowerCase())) {
      errors.push(`Subnet names must be unique; “${name}” is repeated.`);
    } else {
      names.add(name.toLocaleLowerCase());
    }

    if (!/^\d+$/.test(hostText) || !Number.isSafeInteger(requiredHosts) || requiredHosts < 1) {
      errors.push(`Subnet ${row} must require at least 1 whole host.`);
    } else if (policy && requiredHosts > maximumHostsForMode(policy)) {
      errors.push(`Subnet ${row} exceeds the ${policy.label} host limit.`);
    }

    if (vlanText !== '' &&
        (!/^\d+$/.test(vlanText) || !Number.isInteger(vlanId) || vlanId < 1 || vlanId > 4094)) {
      errors.push(`Subnet ${row} VLAN ID must be a whole number from 1 to 4094, or left blank.`);
    } else if (vlanId !== null && vlanIds.has(vlanId)) {
      errors.push(`VLAN IDs must be unique; VLAN ${vlanId} is repeated.`);
    } else if (vlanId !== null) {
      vlanIds.add(vlanId);
    }

    return { name, vlanId, requiredHosts, originalIndex: index };
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: {
      parent,
      subnets: validatedSubnets,
      addressingMode: policy.id,
      gatewayPosition: gateway.id
    },
    notices: parent.wasNormalised
      ? [`${parent.suppliedAddress}/${parent.prefix} was normalised to ${parent.cidr}.`]
      : []
  };
}
