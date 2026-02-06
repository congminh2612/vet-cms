import * as XLSX from "xlsx";
import type { Debt, Invoice } from "@/types/api.types";
import { parseNumber } from "@/utils/number-utils";

function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportDebtsToExcel(debts: Debt[]) {
  const data = debts.map((debt, index) => ({
    STT: index + 1,
    "Mã công nợ": debt.id,
    "Khách hàng": debt.customer?.name || "N/A",
    "Số điện thoại": debt.customer?.phone || "N/A",
    "Địa chỉ": debt.customer?.address || "N/A",
    "Tổng nợ": parseNumber(debt.totalAmount),
    "Đã trả": parseNumber(debt.paidAmount),
    "Còn lại": parseNumber(debt.remainingAmount),
    "Trạng thái":
      debt.status === "PAID"
        ? "Đã trả đủ"
        : debt.status === "PARTIAL"
          ? "Trả một phần"
          : "Chưa trả",
    "Ngày tạo": formatDate(debt.createdAt),
    "Ghi chú": debt.note || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Công nợ");

  // Auto-size columns
  const maxWidth = 20;
  worksheet["!cols"] = Object.keys(data[0] || {}).map(() => ({
    wch: maxWidth,
  }));

  const fileName = `Công_nợ_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

export function exportInvoicesToExcel(invoices: Invoice[]) {
  const data = invoices.map((invoice, index) => {
    const totalAmount = parseNumber(invoice.totalAmount);
    const amountReceived = parseNumber(
      invoice.amountReceived ?? invoice.paidAmount ?? invoice.totalAmount
    );
    const remainingDebt = parseNumber(invoice.remainingDebt);

    return {
      STT: index + 1,
      "Mã hóa đơn": invoice.id,
      "Khách hàng": invoice.customer?.name || "N/A",
      "Số điện thoại": invoice.customer?.phone || "N/A",
      "Tổng tiền": totalAmount,
      "Đã trả": amountReceived,
      "Có nợ": invoice.hasDebt ? "Có" : "Không",
      "Còn nợ": remainingDebt,
      "Ngày tạo": formatDate(invoice.createdAt),
      "Ghi chú": invoice.note || "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Hóa đơn");

  // Auto-size columns
  const maxWidth = 20;
  worksheet["!cols"] = Object.keys(data[0] || {}).map(() => ({
    wch: maxWidth,
  }));

  const fileName = `Hóa_đơn_${new Date().toISOString().split("T")[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

