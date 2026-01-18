import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

export function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboard(),
  });

  if (error) {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(
      err.response?.data?.message || "Có lỗi xảy ra khi tải dữ liệu dashboard"
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Không có dữ liệu</div>
      </div>
    );
  }

  const parseNumber = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === "string") {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return value;
  };

  const formatCurrency = (amount: string | number | undefined | null) => {
    const value = parseNumber(amount);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const stats = [
    {
      title: "Tổng sản phẩm",
      value: data.totalProducts ?? 0,
      icon: Package,
      description: "Sản phẩm trong hệ thống",
    },
    {
      title: "Sản phẩm tồn kho thấp",
      value: data.lowStockProducts ?? 0,
      icon: AlertTriangle,
      description: "Cần nhập thêm",
      variant: "destructive" as const,
    },
    {
      title: "Tổng khách hàng",
      value: data.totalCustomers ?? 0,
      icon: Users,
      description: "Khách hàng đã đăng ký",
    },
    {
      title: "Doanh thu",
      value: formatCurrency(data.totalRevenue),
      icon: TrendingUp,
      description: "Tổng thu vào",
    },
    {
      title: "Chi phí",
      value: formatCurrency(data.totalExpenses),
      icon: TrendingDown,
      description: "Tổng chi ra",
    },
    {
      title: "Lợi nhuận",
      value: formatCurrency(data.netProfit),
      icon: DollarSign,
      description: "Số dư hiện tại",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Bảng điều khiển</h1>
        <p className="text-muted-foreground">
          Tổng quan hệ thống quản lý cửa hàng thuốc thú y
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <p className="text-sm text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

