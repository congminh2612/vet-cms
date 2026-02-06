// ==================== Authentication ====================
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user?: User;
}

export interface User {
  id: number;
  username: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== Products ====================
export interface Product {
  id: number;
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductRequest {
  name: string;
  unit: string;
  costPrice: number;
  sellPrice: number;
  stock?: number;
}

export interface UpdateProductRequest {
  name?: string;
  unit?: string;
  costPrice?: number;
  sellPrice?: number;
  stock?: number;
}

export interface ProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================== Stock Logs ====================
export interface StockLog {
  id: number;
  productId: number;
  product?: Product;
  type: "IN" | "OUT";
  quantity: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StockLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  type?: "IN" | "OUT";
  startDate?: string;
  endDate?: string;
}

export interface StockInRequest {
  productId: number;
  quantity: number;
  note?: string;
}

export interface StockOutRequest {
  productId: number;
  quantity: number;
  note?: string;
}

// ==================== Customers ====================
export interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  // Công nợ (từ API response)
  totalDebt?: number | string; // Tổng nợ còn lại
  debtCount?: number; // Số khoản nợ chưa thanh toán
  debts?: Debt[]; // Danh sách công nợ chi tiết (khi getById)
  pendingDebts?: number; // Số khoản nợ chưa trả hết
  totalSpent?: number | string; // Tổng đã chi tiêu
  totalOrders?: number; // Tổng số đơn hàng
}

export interface CreateCustomerRequest {
  name: string;
  phone?: string;
  address?: string;
  note?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  phone?: string;
  address?: string;
  note?: string;
}

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface TopCustomer {
  customerId: number;
  customer: Customer;
  totalAmount: number;
  totalTransactions: number;
}

export interface TopCustomersQueryParams {
  limit?: number;
  startDate?: string;
  endDate?: string;
}

// ==================== Cash Logs ====================
export interface CashLog {
  id: number;
  type: "IN" | "OUT";
  amount: number;
  customerId?: number;
  customer?: Customer;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CashLogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: "IN" | "OUT";
  customerId?: number;
  startDate?: string;
  endDate?: string;
}

export interface CashInItem {
  productId: number;
  quantity: number;
  unitPrice?: number; // Optional - nếu không có sẽ dùng Product.sellPrice
}

export interface CashInRequest {
  amount?: number; // Optional khi có items (tự động tính)
  customerId?: number;
  note?: string;
  items?: CashInItem[]; // Khi có items, sẽ tự động tính amount và xuất kho
  paidAmount?: number; // Số tiền khách trả ngay (cho bán hàng nợ). Nếu paidAmount < tổng tiền → tự động tạo công nợ
}

export interface CashOutRequest {
  amount: number;
  note?: string;
}

export interface UpdateCashLogRequest {
  amount?: number;
  note?: string;
}

export interface CashLogStats {
  totalIn: string | number;
  totalOut: string | number;
  netProfit: string | number;
  totalInTransactions?: number;
  totalOutTransactions?: number;
}

export interface CashLogStatsQueryParams {
  startDate?: string;
  endDate?: string;
  type?: "IN" | "OUT";
}

// ==================== Dashboard ====================
export interface TopProduct {
  id: number;
  name: string;
  stock: number;
  sellPrice: string;
}

export interface Dashboard {
  totalProducts: number;
  lowStockProducts: number;
  totalCustomers: number;
  totalRevenue: string | number;
  totalExpenses: string | number;
  netProfit: string | number;
  recentTransactions?: CashLog[];
  recentStockLogs?: StockLog[];
  topProducts?: TopProduct[];
}

export interface SalesByDateQueryParams {
  startDate: string;
  endDate: string;
  groupBy: "day" | "week" | "month";
}

export interface SalesByDate {
  date: string;
  revenue: number;
  expense: number;
  profit: number;
}

// ==================== Debts (Công nợ) ====================
export type DebtStatus = "PENDING" | "PARTIAL" | "PAID";

export interface Debt {
  id: number;
  customerId: number;
  customer?: Customer;
  invoiceId?: number;
  invoice?: Invoice;
  totalAmount: number; // Tổng số tiền nợ
  paidAmount: number; // Số tiền đã trả
  remainingAmount: number; // Số tiền còn lại
  status: DebtStatus;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
  paymentHistory?: DebtPayment[];
}

export interface DebtPayment {
  id: number;
  debtId: number;
  amount: number;
  note?: string;
  createdAt?: string;
}

export interface DebtsQueryParams {
  page?: number;
  limit?: number;
  customerId?: number;
  status?: DebtStatus;
}

export interface DebtStats {
  totalDebt: number; // Tổng nợ
  totalPaid: number; // Tổng đã trả
  totalRemaining: number; // Tổng còn lại
  totalDebts: number; // Số lượng công nợ
  topDebtors?: TopDebtor[];
}

export interface TopDebtor {
  customerId: number;
  customer: Customer;
  totalDebt: number;
  totalPaid: number;
  remainingAmount: number;
}

export interface PayDebtRequest {
  amount: number;
  note?: string;
}

export interface CreateDebtRequest {
  customerId: number;
  totalAmount: number;
  paidAmount?: number; // Mặc định 0 nếu không có
  note?: string;
}

export interface UpdateDebtRequest {
  totalAmount?: number;
  paidAmount?: number;
  note?: string;
}

// ==================== Invoices (Hóa đơn) ====================
export interface InvoiceItem {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number | string;
  totalPrice: number | string;
}

export interface Invoice {
  id: number;
  invoiceNumber?: string; // Số hóa đơn
  customerId?: number;
  customer?: Customer;
  cashLogId?: number;
  cashLog?: CashLog;
  items?: InvoiceItem[];
  totalAmount: number | string; // API trả string "1100000.00"
  paidAmount?: number | string; // Số tiền đã trả
  amountReceived?: number | string; // API list trả field này thay vì paidAmount
  hasDebt: boolean; // Có công nợ hay không
  debt?: Debt; // Thông tin công nợ (khi getById)
  debtStatus?: string | null; // "PENDING" | "PARTIAL" | "PAID" | null (từ API list)
  remainingDebt?: number | string; // Còn nợ (từ API list)
  itemCount?: number; // Số sản phẩm (từ API list)
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoicesQueryParams {
  page?: number;
  limit?: number;
  customerId?: number;
  startDate?: string;
  endDate?: string;
  hasDebt?: boolean;
}

