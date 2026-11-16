import type { MessageKey } from "@/lib/i18n/messages";
import { STATUS_LABEL, type DebtReportRow, type DebtReportTotals } from "@/lib/utils/debt-report";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * Builds and downloads the debt report as a real .xlsx file. exceljs is loaded
 * only when someone exports, so it doesn't slow down the app.
 */
export async function downloadDebtReportXlsx(
  rows: DebtReportRow[],
  totals: DebtReportTotals,
  meta: {
    shopName: string;
    periodLabel: string;
    byCustomer: boolean;
    /** Translator from useT(): column headings and titles follow the interface language. */
    t: Translate;
    /** Date formatter from useFormat(). */
    formatDay: (value: Date) => string;
    /** "Generated" date and time, already formatted. */
    generatedAt: string;
  },
) {
  const { t } = meta;
  const withEtb = (text: string) => `${text} (${t("shared.etb")})`;
  const formatDate = (timestamp: number) => (timestamp ? meta.formatDay(new Date(timestamp)) : "");
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Andalus";
  wb.created = new Date();

  const sheet = wb.addWorksheet(t("reports.debt.sheetName"), { views: [{ state: "frozen", ySplit: 4 }] });
  const columns = [
    { header: t("reports.debt.colCustomer"), width: 26 },
    { header: t("shared.phone"), width: 16 },
    { header: meta.byCustomer ? t("reports.debt.colDebts") : t("reports.debt.xlReference"), width: 12 },
    { header: meta.byCustomer ? t("reports.debt.xlLatestDebt") : t("reports.debt.xlIssuedOn"), width: 14 },
    { header: t("reports.debt.xlDueDate"), width: 14 },
    { header: withEtb(t("reports.debt.colDebtIssued")), width: 18, money: true },
    { header: withEtb(t("reports.debt.colRepaid")), width: 16, money: true },
    { header: withEtb(t("reports.debt.colRemaining")), width: 17, money: true },
    { header: t("shared.status"), width: 16 },
  ];

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = t("reports.debt.printHeader", { shop: meta.shopName });
  sheet.getCell(1, 1).font = { bold: true, size: 14 };
  sheet.mergeCells(2, 1, 2, columns.length);
  sheet.getCell(2, 1).value = t("reports.printMeta", { period: meta.periodLabel, date: meta.generatedAt });
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
      r.overdue ? `${t(STATUS_LABEL[r.status])} · ${t("reports.debt.overdue")}` : t(STATUS_LABEL[r.status]),
    ];
  });

  // Totals follow the exported rows (they may be filtered).
  const sum = (f: (r: DebtReportRow) => number) => Math.round(rows.reduce((s, r) => s + f(r), 0) * 100) / 100;
  const totalRow = sheet.getRow(5 + rows.length);
  totalRow.values = [
    t(meta.byCustomer ? "reports.debt.xlTotalCustomers" : "reports.debt.xlTotalDebts", { count: rows.length }), "", "", "", "",
    sum((r) => r.issued), sum((r) => r.paid), sum((r) => r.remaining), "",
  ];
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = { top: { style: "thin" } };
  });

  const summary = sheet.getRow(7 + rows.length);
  summary.values = [t("reports.debt.xlPaymentsReceived", { amount: totals.collectedInPeriod.toLocaleString("en-US") })];
  summary.font = { color: { argb: "FF6B7280" } };

  columns.forEach((c, i) => {
    if (c.money) sheet.getColumn(i + 1).numFmt = "#,##0.00";
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `debt-report-${meta.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
