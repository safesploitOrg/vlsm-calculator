export const COLUMN_DEFINITIONS = {
  network: { heading: 'Network', value: (allocation) => allocation.network },
  cidr: { heading: 'Network / CIDR', value: (allocation) => allocation.cidr },
  firstHost: { heading: 'First host', value: (allocation) => allocation.firstHost },
  lastHost: { heading: 'Last host', value: (allocation) => allocation.lastHost },
  broadcast: { heading: 'Broadcast', value: (allocation) => allocation.broadcast },
  subnetMask: { heading: 'Subnet mask', value: (allocation) => allocation.subnetMask },
  usableHosts: { heading: 'Usable hosts', value: (allocation) => allocation.usableHosts },
  requiredHosts: { heading: 'Required hosts', value: (allocation) => allocation.requiredHosts },
  reservedAddresses: { heading: 'Reserved addresses', value: (allocation) => allocation.reservedAddresses },
  totalAddresses: { heading: 'Total addresses', value: (allocation) => allocation.totalAddresses }
};

export function selectedColumnKeys(columnPicker) {
  return [...columnPicker.querySelectorAll('input:checked')].map((input) => input.value);
}

export function allocationTableData(result, columnKeys) {
  const columns = [
    { heading: 'Name', value: (allocation) => allocation.name },
    ...columnKeys.map((key) => COLUMN_DEFINITIONS[key])
  ];

  return {
    headers: columns.map((column) => column.heading),
    rows: result.allocations.map((allocation) =>
      columns.map((column) => column.value(allocation)))
  };
}

export function renderAllocationTable(table, result, columnKeys) {
  const data = allocationTableData(result, columnKeys);
  const head = document.createElement('thead');
  const headerRow = document.createElement('tr');

  data.headers.forEach((heading) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = heading;
    headerRow.append(cell);
  });

  head.append(headerRow);

  const body = document.createElement('tbody');
  data.rows.forEach((values) => {
    const row = document.createElement('tr');
    values.forEach((value) => {
      const cell = document.createElement('td');
      cell.textContent = value;
      row.append(cell);
    });
    body.append(row);
  });

  table.replaceChildren(head, body);
  return data;
}
