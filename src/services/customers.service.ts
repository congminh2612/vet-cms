import { apiClient } from "@/config/axios.config";
import type {
  CreateCustomerRequest,
  Customer,
  CustomersQueryParams,
  PaginatedResponse,
  TopCustomer,
  TopCustomersQueryParams,
  UpdateCustomerRequest,
  Debt,
  DebtStatus,
} from "@/types/api.types";

export const customersService = {
  getAll: async (
    params?: CustomersQueryParams
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Customer[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>("/customers", { params });
    // Map từ API response format sang PaginatedResponse format
    return {
      data: response.data.data || [],
      page: response.data.pagination?.page || 1,
      limit: response.data.pagination?.limit || 20,
      total: response.data.pagination?.total || 0,
      totalPages: response.data.pagination?.totalPages || 0,
    };
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Customer;
    }>(`/customers/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<Customer>("/customers", data);
    return response.data;
  },

  update: async (
    id: number,
    data: UpdateCustomerRequest
  ): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },

  getTopCustomers: async (
    params?: TopCustomersQueryParams
  ): Promise<TopCustomer[]> => {
    const response = await apiClient.get<TopCustomer[]>("/customers/top", {
      params,
    });
    return response.data;
  },

  getCustomerDebts: async (
    customerId: number,
    status?: DebtStatus
  ): Promise<Debt[]> => {
    const response = await apiClient.get<{
      success: boolean;
      data: Debt[];
    }>(`/customers/${customerId}/debts`, {
      params: status ? { status } : undefined,
    });
    return response.data.data || [];
  },
};

