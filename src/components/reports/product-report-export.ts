import type { ProductReport } from "@/lib/api/types";

/**
 * Builds and downloads the product report as a real .xlsx file. exceljs is
 * loaded only when someone exports, so it doesn't slow down the app.
 */
export async function downloadProductReportXlsx(report: ProductReport, meta: { shopName: string; periodLabel: string }) {
  const { default: ExcelJS } = await import("exceljs");
  const wb = new ExcelJS.Workbook();
  wb.creator = "Andalus";
  wb.created = new Date();

  const sheet = wb.addWorksheet("Products", { views: [{ state: "frozen", ySplit: 4 }] });
  const columns = [
    { header: "Product", key: "name", width: 28 },
    { header: "SKU", key: "sku", width: 16 },
    { header: "Category", key: "category", width: 16 },
    { header: "Units sold", key: "soldUnits", width: 12, money: false },
    { header: "Sales value (ETB)", key: "revenue", width: 18, money: true },
    { header: "Cost of goods (ETB)", key: "cogs", width: 18, money: true },
    { header: "Gross profit (ETB)", key: "profit", width: 18, money: true },
    { header: "Margin %", key: "margin", width: 10 },
    { header: "Units restocked", key: "restockedUnits", width: 15 },
    { header: "Restock cost (ETB)", key: "restockCost", width: 18, money: true },
    { header: "Paid now (ETB)", key: "paidNow", width: 15, money: true },
    { header: "On credit (ETB)", key: "onCredit", width: 15, money: true },
    { header: "Stock now", key: "onHand", width: 11 },
    { header: "Stock value at cost (ETB)", key: "stockValue", width: 22, money: true },
  ];

  sheet.mergeCells(1, 1, 1, columns.length);
  sheet.getCell(1, 1).value = `${meta.shopName} — Product report`;
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
  const t = {
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
    `Total (${t.products} products)`, "", "",
    t.soldUnits, t.revenue, t.cogs, t.profit,
    t.revenue > 0 ? Math.round((t.profit / t.revenue) * 1000) / 10 : "",
    t.restockedUnits, t.restockCost, t.restockPaidNow, t.restockOnCredit, "", "",
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
  link.download = `product-report-${meta.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
