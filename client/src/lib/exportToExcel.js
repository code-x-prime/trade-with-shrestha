/**
 * Export array of objects to CSV (opens cleanly in Excel).
 * @param {Array<Object>} data - Rows to export
 * @param {Array<{ key: string, label: string }>} columns - Keys and headers (only included columns)
 * @param {string} filename - Download filename (without .csv)
 */
export function exportToCSV(data, columns, filename = 'export') {
  if (!data?.length || !columns?.length) return;

  const getVal = (row, key) => {
    const parts = key.split('.');
    let v = row;
    for (const p of parts) {
      v = v?.[p];
    }
    if (v == null) return '';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (typeof v === 'object' && v?.constructor?.name === 'Date') return new Date(v).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return new Date(v).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' });
    return String(v).replace(/"/g, '""');
  };

  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((row) =>
    columns.map((c) => `"${getVal(row, c.key)}"`).join(',')
  );
  const csv = '\uFEFF' + header + '\n' + rows.join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
