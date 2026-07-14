import { allocateVlsm } from './core/allocator.js';
import { validateAllocationRequest } from './core/validation.js';
import { createCsv } from './export/csv-export.js';
import { downloadBlob, downloadText } from './export/download.js';
import { createXlsx } from './export/spreadsheet-export.js';
import {
  appendSubnetRow,
  readSubnetRows,
  removeSubnetRow,
  replaceSubnetRows,
  resetSubnetRows
} from './ui/form.js';
import { clearMessages, showMessages } from './ui/messages.js';
import {
  clearCalculatorState,
  loadCalculatorState,
  saveCalculatorState
} from './ui/storage.js';
import {
  allocationTableData,
  renderAllocationTable,
  selectedColumnKeys
} from './ui/table.js';

const VERSION = '0.3.0';

const form = document.getElementById('calculator-form');
const parentInput = document.getElementById('parent-cidr');
const subnetRows = document.getElementById('subnet-rows');
const subnetRowTemplate = document.getElementById('subnet-row-template');
const addSubnetButton = document.getElementById('add-subnet-button');
const duplicateSubnetButton = document.getElementById('duplicate-subnet-button');
const resetButton = document.getElementById('reset-button');
const messages = document.getElementById('messages');
const columnPicker = document.getElementById('column-picker');
const resultsSection = document.getElementById('results');
const resultsTable = document.getElementById('results-table');
const resultStatus = document.getElementById('result-status');
const copyButton = document.getElementById('copy-button');
const spreadsheetButton = document.getElementById('spreadsheet-button');
const csvButton = document.getElementById('csv-button');

let currentResult = null;
let browserStorage = null;

try {
  browserStorage = window.localStorage;
} catch {
  // The calculator still works when browser privacy settings disable storage.
}

function calculatorState() {
  return {
    parentCidr: parentInput.value,
    subnets: readSubnetRows(subnetRows),
    selectedColumns: selectedColumnKeys(columnPicker),
    hasGeneratedPlan: currentResult !== null
  };
}

function persistCalculatorState() {
  saveCalculatorState(browserStorage, calculatorState());
}

function restoreCalculatorState(state) {
  if (typeof state.parentCidr === 'string') {
    parentInput.value = state.parentCidr;
  }

  const savedSubnets = Array.isArray(state.subnets)
    ? state.subnets.filter((subnet) => subnet && typeof subnet === 'object')
    : [];
  if (savedSubnets.length > 0) {
    replaceSubnetRows(subnetRows, subnetRowTemplate, savedSubnets);
  } else {
    resetSubnetRows(subnetRows, subnetRowTemplate);
  }

  if (Array.isArray(state.selectedColumns)) {
    const selected = new Set(state.selectedColumns);
    columnPicker.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }
}

function renderResult(result) {
  const columns = selectedColumnKeys(columnPicker);
  renderAllocationTable(resultsTable, result, columns);

  document.getElementById('summary-parent').textContent = result.parent.cidr;
  document.getElementById('summary-range').textContent = `${result.parent.network} – ${result.parent.broadcast}`;
  document.getElementById('summary-total').textContent = result.parent.totalAddresses.toLocaleString();
  document.getElementById('summary-requested').textContent = result.summary.requestedHosts.toLocaleString();
  document.getElementById('summary-allocated').textContent = result.summary.allocatedAddresses.toLocaleString();
  document.getElementById('summary-remaining').textContent = result.summary.remainingAddresses.toLocaleString();

  const utilisation = result.summary.utilisation;
  const progressBar = document.querySelector('.progress-track');
  document.getElementById('utilisation-value').textContent = `${utilisation.toFixed(2)}%`;
  document.getElementById('utilisation-bar').style.width = `${Math.min(utilisation, 100)}%`;
  progressBar.setAttribute('aria-valuenow', utilisation.toFixed(2));

  resultsSection.hidden = false;
  resultStatus.textContent = `${result.allocations.length} subnet${result.allocations.length === 1 ? '' : 's'} allocated successfully.`;
}

function generatePlan(event, { scroll = true } = {}) {
  event?.preventDefault();
  clearMessages(messages);

  const validation = validateAllocationRequest({
    parentCidr: parentInput.value,
    subnets: readSubnetRows(subnetRows)
  });

  if (!validation.valid) {
    currentResult = null;
    resultsSection.hidden = true;
    persistCalculatorState();
    showMessages(messages, validation.errors);
    messages.focus({ preventScroll: true });
    return;
  }

  try {
    currentResult = allocateVlsm(validation.value);
    parentInput.value = currentResult.parent.cidr;
    persistCalculatorState();
    renderResult(currentResult);

    if (validation.notices.length > 0) {
      showMessages(messages, validation.notices, 'notice');
    }

    if (scroll) {
      resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch (error) {
    currentResult = null;
    resultsSection.hidden = true;
    persistCalculatorState();
    showMessages(messages, [error.message]);
  }
}

function currentTableData() {
  return allocationTableData(currentResult, selectedColumnKeys(columnPicker));
}

function filename(extension) {
  return `vlsm-plan-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

async function copyTable() {
  if (!currentResult) {
    return;
  }
  const tableData = currentTableData();
  const text = [tableData.headers, ...tableData.rows]
    .map((row) => row.join('\t'))
    .join('\n');

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.append(textArea);
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
    }
    resultStatus.textContent = 'Table copied to the clipboard.';
  } catch {
    resultStatus.textContent = 'Copy was blocked by the browser. Select the table and copy it manually.';
  }
}

function downloadCsv() {
  if (!currentResult) {
    return;
  }
  downloadText(
    createCsv(currentTableData()),
    filename('csv'),
    'text/csv;charset=utf-8'
  );
  resultStatus.textContent = 'CSV download created.';
}

function downloadSpreadsheet() {
  if (!currentResult) {
    return;
  }
  const spreadsheet = createXlsx(currentResult, currentTableData(), {
    version: VERSION,
    generatedAt: new Date()
  });
  downloadBlob(
    spreadsheet,
    filename('xlsx'),
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  resultStatus.textContent = 'Spreadsheet download created with VLSM Plan and Summary worksheets.';
}

function resetCalculator() {
  const confirmed = window.confirm(
    'Reset the calculator? This will clear every subnet requirement and the plan saved in this browser.'
  );
  if (!confirmed) {
    return;
  }

  clearCalculatorState(browserStorage);
  form.reset();
  resetSubnetRows(subnetRows, subnetRowTemplate);
  clearMessages(messages);
  currentResult = null;
  resultsSection.hidden = true;
  resultStatus.textContent = '';
  parentInput.focus();
}

form.addEventListener('submit', generatePlan);

addSubnetButton.addEventListener('click', () => {
  const row = appendSubnetRow(subnetRows, subnetRowTemplate);
  persistCalculatorState();
  row.querySelector('.subnet-name').focus();
});

duplicateSubnetButton.addEventListener('click', () => {
  const rows = readSubnetRows(subnetRows);
  const last = rows.at(-1) ?? {};
  const row = appendSubnetRow(subnetRows, subnetRowTemplate, {
    name: last.name ? `${last.name} copy` : '',
    requiredHosts: last.requiredHosts
  });
  persistCalculatorState();
  row.querySelector('.subnet-name').select();
});

subnetRows.addEventListener('click', (event) => {
  const button = event.target.closest('.remove-row-button');
  if (button) {
    removeSubnetRow(subnetRows, button.closest('tr'));
    persistCalculatorState();
  }
});

columnPicker.addEventListener('change', () => {
  persistCalculatorState();
  if (currentResult) {
    renderResult(currentResult);
  }
});

form.addEventListener('input', persistCalculatorState);

resetButton.addEventListener('click', resetCalculator);
copyButton.addEventListener('click', copyTable);
csvButton.addEventListener('click', downloadCsv);
spreadsheetButton.addEventListener('click', downloadSpreadsheet);

const savedState = loadCalculatorState(browserStorage);
if (savedState) {
  restoreCalculatorState(savedState);
} else {
  resetSubnetRows(subnetRows, subnetRowTemplate);
}

if (savedState?.hasGeneratedPlan) {
  generatePlan(null, { scroll: false });
}
