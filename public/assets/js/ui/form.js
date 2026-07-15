const DEFAULT_SUBNETS = [
  { name: 'Management', vlanId: 10, requiredHosts: 250 },
  { name: 'Servers', vlanId: 20, requiredHosts: 500 },
  { name: 'Monitoring', vlanId: 30, requiredHosts: 126 }
];

export function appendSubnetRow(container, template, subnet = {}) {
  const row = template.content.firstElementChild.cloneNode(true);
  row.querySelector('.subnet-name').value = subnet.name ?? '';
  row.querySelector('.subnet-vlan').value = subnet.vlanId ?? '';
  row.querySelector('.subnet-hosts').value = subnet.requiredHosts ?? '';
  container.append(row);
  updateRemoveButtons(container);
  return row;
}

export function removeSubnetRow(container, row) {
  if (container.children.length > 1) {
    row.remove();
    updateRemoveButtons(container);
  }
}

export function readSubnetRows(container) {
  return [...container.querySelectorAll('tr')].map((row) => ({
    name: row.querySelector('.subnet-name').value,
    vlanId: row.querySelector('.subnet-vlan').value,
    requiredHosts: row.querySelector('.subnet-hosts').value
  }));
}

export function resetSubnetRows(container, template) {
  replaceSubnetRows(container, template, DEFAULT_SUBNETS);
}

export function replaceSubnetRows(container, template, subnets) {
  container.replaceChildren();
  subnets.forEach((subnet) => appendSubnetRow(container, template, subnet));
}

function updateRemoveButtons(container) {
  const onlyOneRow = container.children.length === 1;
  container.querySelectorAll('.remove-row-button').forEach((button) => {
    button.disabled = onlyOneRow;
    button.title = onlyOneRow ? 'At least one subnet is required' : '';
  });
}
