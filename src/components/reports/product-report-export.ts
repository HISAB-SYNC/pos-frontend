import type { ProductReport } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";

type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/**
 * Builds and downloads the product report as a real .xlsx file. exceljs is
 * loaded only when someone exports, so it doesn't slow down the app.
 */
export async function downloadProductReportXlsx(
  report: ProductReport,
  meta: {
    shopName: string;
    periodLabel: string;
    /** Translator from useT(): column headings and titles follow the interface language. */
    t: Translate;
    /** "Generated" date and time, already formatted. */
    generatedAt: string;
  },
) {
  const { t } = meta;
  const withEtb = (text: string) => `${text} (${t("shared.etb")})`;
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Andalus";
  wb.created = new Date();

  const sheet = wb.addWorksheet(t("reports.product.sheetName"), { views: [{ state: "frozen", ySplit: 4 }] });
  const columns = [
    { header: t("reports.product.colProduct"), key: "name", width: 28 },
    { header: t("reports.product.xlSku"), key: "sku", width: 16 },
    { header: t("shared.category"), key: "category", width: 16 },
    { header: t("reports.product.xlUnitsSold"), key: "soldUnits", width: 12, money: false },
    { header: withEtb(t("reports.product.colSalesValue")), key: "revenue", width: 18, money: true },
    { header: withEtb(t("reports.product.colCogs")), key: "cogs", width: 18, money: true },
    { header: withEtb(t("reports.product.xlGrossProfit")), key: "profit", width: 18, money: true },
    { header: t("reports.product.xlMargin"), key: "margin", width: 10 },
    { header: t("reports.product.xlUnitsRestocked"), key: "restockedUnits", width: 15 },
    { header: withEtb(t("reports.product.colRestockCost")), key: "restockCost", width: 18, money: true },
    { header: withEtb(t("reports.product.xlPaidNow")), key: "paidNow", width: 15, money: true },
    { header: withEtb(t("reports.product.xlOnCredit")), key: "onCredit", width: 15, money: true },
    { header: t("reports.product.colStockNow"), key: "onHand", width: 11 },
    { header: withEtb(t("reports.product.xlStockValue")), key: "stockValue", width: 22, money: true },
  ];

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = t("reports.product.printHeader", { shop: meta.shopName });
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

  report.items.forEach((item, idx) => {
    const row = sheet.getRow(5 + idx);
    row.values = [
      item.name,
      item.sku ?? "",
      item.category ?? "",
      item.sold.units,
      item.sold.revenue,
      item.sold.cogs,
      item.sold.profit,
      item.sold.marginPct ?? "",
      item.restocked.units,
      item.restocked.cost,
      item.restocked.paidNow,
      item.restocked.onCredit,
      item.stock?.onHand ?? "",
      item.stock?.valueAtCost ?? "",
    ];
  });

  // Totals of the exported rows (they may be filtered).
  const add = (f: (i: ProductReport["items"][number]) => number, digits = 100) =>
    Math.round(report.items.reduce((sum, i) => sum + f(i), 0) * digits) / digits;
  const totals = {
    products: report.items.length,
    soldUnits: add((i) => i.sold.units, 1000),
    revenue: add((i) => i.sold.revenue),
    cogs: add((i) => i.sold.cogs),
    profit: add((i) => i.sold.profit),
    restockedUnits: add((i) => i.restocked.units, 1000),
    restockCost: add((i) => i.restocked.cost),
    restockPaidNow: add((i) => i.restocked.paidNow),
    restockOnCredit: add((i) => i.restocked.onCredit),
  };
  const totalRow = sheet.getRow(5 + report.items.length);
  totalRow.values = [
    t(totals.products === 1 ? "reports.product.totalRow_one" : "reports.product.totalRow_other", { count: totals.products }), "", "",
    totals.soldUnits, totals.revenue, totals.cogs, totals.profit,
    totals.revenue > 0 ? Math.round((totals.profit / totals.revenue) * 1000) / 10 : "",
    totals.restockedUnits, totals.restockCost, totals.restockPaidNow, totals.restockOnCredit, "", "",
  ];
  totalRow.font = { bold: true };
  totalRow.eachCell((cell) => {
    cell.border = { top: { style: "thin" } };
  });

  columns.forEach((c, i) => {
    if (c.money) sheet.getColumn(i + 1).numFmt = "#,##0.00";
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `product-report-${meta.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
