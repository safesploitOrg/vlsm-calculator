import { parseCidr } from './cidr.js';

const MAX_TRADITIONAL_HOSTS = (2 ** 32) - 2;

export function validateAllocationRequest({ parentCidr, subnets }) {
  const errors = [];
  let parent;

  try {
    parent = parseCidr(parentCidr);
  } catch (error) {
    errors.push(error.message);
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
    } else if (requiredHosts > MAX_TRADITIONAL_HOSTS) {
      errors.push(`Subnet ${row} exceeds the IPv4 host limit.`);
    }

    return { name, requiredHosts, originalIndex: index };
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    value: { parent, subnets: validatedSubnets },
    notices: parent.wasNormalised
      ? [`${parent.suppliedAddress}/${parent.prefix} was normalised to ${parent.cidr}.`]
      : []
  };
}
