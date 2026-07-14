function safeSpreadsheetValue(value) {
  const text = String(value ?? '');
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function csvCell(value) {
  const safeValue = safeSpreadsheetValue(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function createCsv({ headers, rows }) {
  return [headers, ...rows]
    .map((row) => row.map(csvCell).join(','))
    .join('\r\n');
}
