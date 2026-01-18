import { apiClient } from "@/config/axios.config";
import type {
  CreateProductRequest,
  PaginatedResponse,
  Product,
  ProductsQueryParams,
  UpdateProductRequest,
} from "@/types/api.types";

export const productsService = {
  getAll: async (
    params?: ProductsQueryParams
  ): Promise<PaginatedResponse<Product>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Product[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/products", { params });
    // Map từ API response format sang PaginatedResponse format
    return {
      data: response.data.data,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
      total: response.data.pagination.total,
      totalPages: response.data.pagination.totalPages,
    };
  },

  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const response = await apiClient.post<Product>("/products", data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateProductRequest
  ): Promise<Product> => {
    const response = await apiClient.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  getLowStock: async (threshold: number = 10): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>("/products/low-stock", {
      params: { threshold },
    });
    return response.data;
  },

  getStockLogs: async (
    productId: number,
    params?: { type?: "IN" | "OUT"; page?: number; limit?: number }
  ): Promise<PaginatedResponse<import("@/types/api.types").StockLog>> => {
    const response = await apiClient.get(`/products/${productId}/stock-logs`, {
      params,
    });
    return response.data;
  },
};

