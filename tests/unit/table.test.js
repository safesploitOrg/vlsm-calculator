import assert from 'node:assert/strict';
import test from 'node:test';

import { allocationTableData } from '../../public/assets/js/ui/table.js';

test('includes optional VLAN and derived gateway columns in table data', () => {
  const result = {
    allocations: [{ name: 'Users', vlanId: 40, gateway: '10.0.0.1' }]
  };

  assert.deepEqual(allocationTableData(result, ['vlanId', 'gateway']), {
    headers: ['Name', 'VLAN ID', 'Gateway'],
    rows: [['Users', 40, '10.0.0.1']]
  });

  result.allocations[0].vlanId = null;
  assert.equal(allocationTableData(result, ['vlanId']).rows[0][1], '');
});
