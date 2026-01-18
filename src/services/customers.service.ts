import { apiClient } from "@/config/axios.config";
import type {
  CreateCustomerRequest,
  Customer,
  CustomersQueryParams,
  PaginatedResponse,
  TopCustomer,
  TopCustomersQueryParams,
  UpdateCustomerRequest,
} from "@/types/api.types";

export const customersService = {
  getAll: async (
    params?: CustomersQueryParams
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await apiClient.get<PaginatedResponse<Customer>>(
      "/customers",
      { params }
    );
    return response.data;
  },

  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
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
};

