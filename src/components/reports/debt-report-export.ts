import { STATUS_LABEL, type DebtReportRow, type DebtReportTotals } from "@/lib/utils/debt-report";

const formatDate = (timestamp: number) =>
  timestamp ? new Date(timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "";

/**
 * Builds and downloads the debt report as a real .xlsx file. exceljs is loaded
 * only when someone exports, so it doesn't slow down the app.
 */
export async function downloadDebtReportXlsx(
  rows: DebtReportRow[],
  totals: DebtReportTotals,
  meta: { shopName: string; periodLabel: string; byCustomer: boolean },
) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Andalus";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Debts", { views: [{ state: "frozen", ySplit: 4 }] });
  const columns = [
    { header: "Customer", width: 26 },
    { header: "Phone", width: 16 },
    { header: meta.byCustomer ? "Debts" : "Reference", width: 12 },
    { header: meta.byCustomer ? "Latest debt" : "Issued on", width: 14 },
    { header: "Due date", width: 14 },
    { header: "Debt issued (ETB)", width: 18, money: true },
    { header: "Repaid (ETB)", width: 16, money: true },
    { header: "Remaining (ETB)", width: 17, money: true },
    { header: "Status", width: 16 },
  ];

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = `${meta.shopName} — Debt report`;
  sheet.getCell(1, 1).font = { bold: true, size: 14 };
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = `Period: ${meta.periodLabel} · Generated ${new Date().toLocaleString("en-GB")}`;
  sheet.getCell(2, 1).font = { color: { argb: "FF6B7280" } };

  const headerRow = sheet.getRow(4);
  columns.forEach((c, i) => {
    sheet.getColumn(i + 1).width = c.width;
    const cell = headerRow.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
    cell.alignment = { vertical: "middle", wrapText: true };
  });
  headerRow.height = 30;

  rows.forEach((r, idx) => {
    sheet.getRow(5 + idx).values = [
      r.customer,
      r.phone,
      meta.byCustomer ? r.count : r.reference,
      formatDate(r.issuedAt),
      formatDate(r.dueAt),
      r.issued,
      r.paid,
      r.remaining,
      r.overdue ? `${STATUS_LABEL[r.status]} · Overdue` : STATUS_LABEL[r.status],
    ];
  });

  // Totals follow the exported rows (they may be filtered).
  const sum = (f: (r: DebtReportRow) => number) => Math.round(rows.reduce((s, r) => s + f(r), 0) * 100) / 100;
  const totalRow = sheet.getRow(5 + rows.length);
  totalRow.values = [
    `Total (${rows.length} ${meta.byCustomer ? "customers" : "debts"})`, "", "", "", "",
    sum((r) => r.issued), sum((r) => r.paid), sum((r) => r.remaining), "",
  ];
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = { top: { style: "thin" } };
  });

  const summary = sheet.getRow(7 + rows.length);
  summary.values = [`Payments received in this period: ${totals.collectedInPeriod.toLocaleString("en-US")} ETB`];
  summary.font = { color: { argb: "FF6B7280" } };

  columns.forEach((c, i) => {
    if (c.money) sheet.getColumn(i + 1).numFmt = "#,##0.00";
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `debt-report-${meta.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
