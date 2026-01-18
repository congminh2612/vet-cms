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

