/**
 * Universal CSV / Data Export Engine for Andalus POS
 */

export interface ExportColumn<T> {
  header: string;
  key?: keyof T;
  formatter?: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Escapes a field for CSV format (wraps in quotes if contains comma, quote, or newline)
 */
function formatCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }

  const stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);

  // If contains double quotes, escape them with double double-quotes
  const escaped = stringValue.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Converts dataset to CSV string and initiates a browser file download
 */
export function exportToCsv<T extends Record<string, any>>(
  filename: string,
  data: T[],
  columns: ExportColumn<T>[],
): boolean {
  try {
    if (!data || data.length === 0) {
      alert("No data available to export.");
      return false;
    }

    // 1. Build Header Row
    const headerRow = columns.map((col) => formatCsvField(col.header)).join(",");

    // 2. Build Data Rows
    const dataRows = data.map((item) => {
      return columns
        .map((col) => {
          let val: unknown;
          if (col.formatter) {
            val = col.formatter(item);
          } else if (col.key) {
            val = item[col.key];
          }
          return formatCsvField(val);
        })
        .join(",");
    });

    // 3. Assemble complete CSV content with UTF-8 BOM for Excel compatibility
    const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");

    // 4. Create Blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const dateSuffix = new Date().toISOString().split("T")[0];
    const finalFilename = filename.endsWith(".csv")
      ? filename
      : `${filename}-${dateSuffix}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", finalFilename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Export to CSV error:", error);
    alert("Failed to export data. Please try again.");
    return false;
  }
}
