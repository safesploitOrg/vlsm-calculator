import assert from 'node:assert/strict';
import test from 'node:test';

import { createCsv } from '../../public/assets/js/export/csv-export.js';
import { createXlsx } from '../../public/assets/js/export/spreadsheet-export.js';

function storedZipEntries(zip) {
  const entries = new Map();
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const decoder = new TextDecoder();
  let offset = 0;

  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = decoder.decode(zip.slice(nameStart, nameStart + nameLength));
    entries.set(name, decoder.decode(zip.slice(dataStart, dataStart + size)));
    offset = dataStart + size;
  }

  return entries;
}

test('neutralises spreadsheet formulas in CSV values', () => {
  const csv = createCsv({ headers: ['Name'], rows: [['=HYPERLINK("bad")'], ['Normal']] });
  assert.match(csv, /^"Name"\r\n"'=HYPERLINK\(""bad""\)"/);
});

test('creates a valid two-worksheet XLSX package without formula cells', () => {
  const result = {
    addressingMode: { label: 'AWS VPC' },
    gatewayPosition: { label: 'Provider managed (network + 1)' },
    parent: {
      cidr: '10.0.0.0/24', network: '10.0.0.0', broadcast: '10.0.0.255',
      subnetMask: '255.255.255.0', totalAddresses: 256
    },
    summary: { requestedHosts: 1, allocatedAddresses: 4, remainingAddresses: 252, utilisation: 1.5625 }
  };
  const xlsx = createXlsx(result, {
    headers: ['Name', 'Network / CIDR'],
    rows: [['=malicious', '10.0.0.0/30']]
  }, { version: 'test', generatedAt: new Date('2026-01-01T00:00:00Z') });

  assert.deepEqual([...xlsx.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);

  const entries = storedZipEntries(xlsx);
  assert.equal(entries.size, 9);
  assert.ok(entries.has('[Content_Types].xml'));
  assert.ok(entries.has('xl/worksheets/sheet1.xml'));
  assert.ok(entries.has('xl/worksheets/sheet2.xml'));
  assert.match(entries.get('xl/workbook.xml'), /name="VLSM Plan"/);
  assert.match(entries.get('xl/workbook.xml'), /name="Summary"/);
  assert.match(entries.get('xl/worksheets/sheet1.xml'), /<t xml:space="preserve">=malicious<\/t>/);
  assert.doesNotMatch(entries.get('xl/worksheets/sheet1.xml'), /<f>/);
  assert.match(entries.get('xl/worksheets/sheet2.xml'), /AWS VPC/);
  assert.match(entries.get('xl/worksheets/sheet2.xml'), /Provider managed \(network \+ 1\)/);
});
