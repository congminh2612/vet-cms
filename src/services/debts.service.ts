import { apiClient } from "@/config/axios.config";
import type {
  Debt,
  DebtStats,
  DebtsQueryParams,
  PaginatedResponse,
  PayDebtRequest,
  CreateDebtRequest,
  UpdateDebtRequest,
} from "@/types/api.types";

export const debtsService = {
  getAll: async (
    params?: DebtsQueryParams
  ): Promise<PaginatedResponse<Debt>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Debt[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/debts", { params });
    // Map từ API response format sang PaginatedResponse format
    return {
      data: response.data.data || [],
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 20,
      total: response.data.pagination?.total || 0,
      totalPages: response.data.pagination?.totalPages || 0,
    };
  },

  getById: async (id: number): Promise<Debt> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Debt;
    }>(`/debts/${id}`);
    return response.data.data;
  },

  getStats: async (): Promise<DebtStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: DebtStats;
    }>("/debts/stats");
    return response.data.data;
  },

  payDebt: async (
    id: number,
    data: PayDebtRequest
  ): Promise<{ debt: Debt; cashLog: any }> => {
    const response = await apiClient.post<{
      success: boolean;
      data: {
        debt: Debt;
        cashLog: any;
      };
    }>(`/debts/${id}/pay`, data);
    return response.data.data;
  },

  create: async (data: CreateDebtRequest): Promise<Debt> => {
    // Chỉ gửi các field cần thiết, loại bỏ field undefined
    const requestData: CreateDebtRequest = {
      customerId: Number(data.customerId),
      totalAmount: Number(data.totalAmount),
    };
    
    // Chỉ thêm paidAmount nếu có và > 0
    if (data.paidAmount !== undefined && data.paidAmount > 0) {
      requestData.paidAmount = Number(data.paidAmount);
    }
    
    // Chỉ thêm note nếu có
    if (data.note && data.note.trim()) {
      requestData.note = data.note.trim();
    }
    
    const response = await apiClient.post<{
      success: boolean;
      data: Debt;
    }>("/debts", requestData);
    return response.data.data;
  },

  update: async (
    id: number,
    data: UpdateDebtRequest
  ): Promise<Debt> => {
    // Chỉ gửi các field có giá trị, loại bỏ undefined
    const requestData: UpdateDebtRequest = {};
    
    if (data.totalAmount !== undefined) {
      requestData.totalAmount = Number(data.totalAmount);
    }
    
    if (data.paidAmount !== undefined) {
      requestData.paidAmount = Number(data.paidAmount);
    }
    
    if (data.note !== undefined && data.note.trim()) {
      requestData.note = data.note.trim();
    }
    
    const response = await apiClient.put<{
      success: boolean;
      data: Debt;
    }>(`/debts/${id}`, requestData);
    return response.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/debts/${id}`);
  },
};

