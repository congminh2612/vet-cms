import { apiClient } from "@/config/axios.config";
import type {
  CashInRequest,
  CashLog,
  CashLogQueryParams,
  CashLogStats,
  CashLogStatsQueryParams,
  CashOutRequest,
  PaginatedResponse,
  UpdateCashLogRequest,
} from "@/types/api.types";

export const cashLogsService = {
  getAll: async (
    params?: CashLogQueryParams
  ): Promise<PaginatedResponse<CashLog>> => {
    const response = await apiClient.get<PaginatedResponse<CashLog>>(
      "/cash-logs",
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<CashLog> => {
    const response = await apiClient.get<CashLog>(`/cash-logs/${id}`);
    return response.data;
  },

  cashIn: async (data: CashInRequest): Promise<CashLog> => {
    const response = await apiClient.post<CashLog>("/cash-logs/in", data);
    return response.data;
  },

  cashOut: async (data: CashOutRequest): Promise<CashLog> => {
    const response = await apiClient.post<CashLog>("/cash-logs/out", data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateCashLogRequest
  ): Promise<CashLog> => {
    const response = await apiClient.put<CashLog>(`/cash-logs/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/cash-logs/${id}`);
  },

  getStats: async (
    params?: CashLogStatsQueryParams
  ): Promise<CashLogStats> => {
    const response = await apiClient.get<{
      success: boolean;
      data: CashLogStats;
    }>("/cash-logs/stats", {
      params,
    });
    // API trả về format { success: true, data: {...} }
    return response.data.data;
  },
};

