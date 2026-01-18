import { apiClient } from "@/config/axios.config";
import type {
  PaginatedResponse,
  StockInRequest,
  StockLog,
  StockLogQueryParams,
  StockOutRequest,
} from "@/types/api.types";

export const stockLogsService = {
  getAll: async (
    params?: StockLogQueryParams
  ): Promise<PaginatedResponse<StockLog>> => {
    const response = await apiClient.get<PaginatedResponse<StockLog>>(
      "/stock-logs",
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<StockLog> => {
    const response = await apiClient.get<StockLog>(`/stock-logs/${id}`);
    return response.data;
  },

  stockIn: async (data: StockInRequest): Promise<StockLog> => {
    const response = await apiClient.post<StockLog>("/stock-logs/in", data);
    return response.data;
  },

  stockOut: async (data: StockOutRequest): Promise<StockLog> => {
    const response = await apiClient.post<StockLog>("/stock-logs/out", data);
    return response.data;
  },
};

