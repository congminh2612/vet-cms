/**
 * Parse number safely, return 0 if invalid
 *
 * Xử lý đúng cả 2 trường hợp:
 * - API trả về string thập phân: "9900000.00" → 9900000
 * - Format tiền Việt phân cách nghìn: "9.900.000" hoặc "9,900,000" → 9900000
 */
export function parseNumber(
  value: string | number | undefined | null
): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") {
    return isNaN(value) ? 0 : value;
  }
  if (typeof value === "string") {
    // Loại bỏ khoảng trắng và suffix
    let cleaned = value.replace(/\s/g, "").replace(/vnd|đ/gi, "").trim();
    if (cleaned === "") return 0;

    // Nếu có đúng 1 dấu chấm và phần sau dấu chấm có 1-2 chữ số → đây là số thập phân (từ API)
    // Ví dụ: "9900000.00" → 9900000
    const decimalMatch = cleaned.match(/^-?\d+\.\d{1,2}$/);
    if (decimalMatch) {
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }

    // Ngược lại → dấu chấm/phẩy là phân cách hàng nghìn (tiền Việt)
    // Ví dụ: "9.900.000" hoặc "9,900,000" → 9900000
    cleaned = cleaned.replace(/[,.]/g, "");
    if (cleaned === "") return 0;
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: string | number | undefined | null
): string {
  const value = parseNumber(amount);
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

