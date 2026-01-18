import { apiClient } from "@/config/axios.config";
import type {
  Dashboard,
  SalesByDate,
  SalesByDateQueryParams,
} from "@/types/api.types";

export const dashboardService = {
  getDashboard: async (): Promise<Dashboard> => {
    const response = await apiClient.get<{ success: boolean; data: Dashboard }>("/dashboard");
    return response.data.data;
  },

  getSalesByDate: async (
    params: SalesByDateQueryParams
  ): Promise<SalesByDate[]> => {
    const response = await apiClient.get<SalesByDate[]>(
      "/dashboard/sales-by-date",
      { params }
    );
    return response.data;
  },
};

