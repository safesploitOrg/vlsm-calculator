import { parseCidr } from './cidr.js';
import { getAddressingMode, maximumHostsForMode } from './addressing-modes.js';

export function validateAllocationRequest({ parentCidr, subnets, addressingMode = 'standard' }) {
  const errors = [];
  let parent;
  let policy;

  try {
    policy = getAddressingMode(addressingMode);
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
  const validatedSubnets = (subnets || []).map((subnet, index) => {
    const row = index + 1;
    const name = String(subnet.name ?? '').trim();
    const hostText = String(subnet.requiredHosts ?? '').trim();
    const requiredHosts = Number(hostText);

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

    return { name, requiredHosts, originalIndex: index };
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: { parent, subnets: validatedSubnets, addressingMode: policy.id },
    notices: parent.wasNormalised
      ? [`${parent.suppliedAddress}/${parent.prefix} was normalised to ${parent.cidr}.`]
      : []
  };
}
