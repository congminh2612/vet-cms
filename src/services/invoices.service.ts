import { apiClient } from "@/config/axios.config";
import type {
  Invoice,
  InvoicesQueryParams,
  PaginatedResponse,
} from "@/types/api.types";

export const invoicesService = {
  getAll: async (
    params?: InvoicesQueryParams
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Invoice[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/invoices", { params });
    // Map từ API response format sang PaginatedResponse format
    return {
      data: response.data.data || [],
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 20,
      total: response.data.pagination?.total || 0,
      totalPages: response.data.pagination?.totalPages || 0,
    };
  },

  getById: async (id: number): Promise<Invoice> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Invoice;
    }>(`/invoices/${id}`);
    return response.data.data;
  },
};

