import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cashLogsService } from "@/services/cash-logs.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import type { CashLogStatsQueryParams } from "@/types/api.types";
import { toast } from "sonner";

export function CashStats() {
  const [dateRange, setDateRange] = useState<"today" | "week" | "month" | "year" | "custom">("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<"IN" | "OUT" | "all">("all");

  const getDateRange = (range: string) => {
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    switch (range) {
      case "today": {
        return {
          startDate: formatDate(today),
          endDate: formatDate(today),
        };
      }
      case "week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return {
          startDate: formatDate(weekStart),
          endDate: formatDate(today),
        };
      }
      case "month": {
        const monthStart = new Date(today);
        monthStart.setDate(1);
        return {
          startDate: formatDate(monthStart),
          endDate: formatDate(today),
        };
      }
      case "year": {
        const yearStart = new Date(today);
        yearStart.setMonth(0, 1);
        return {
          startDate: formatDate(yearStart),
          endDate: formatDate(today),
        };
      }
      default:
        return {
          startDate: startDate || formatDate(new Date(new Date().setMonth(new Date().getMonth() - 1))),
          endDate: endDate || formatDate(today),
        };
    }
  };

  const dateParams = getDateRange(dateRange);
  const queryParams: CashLogStatsQueryParams = {
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    ...(type !== "all" && { type: type as "IN" | "OUT" }),
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["cash-logs-stats", queryParams],
    queryFn: () => cashLogsService.getStats(queryParams),
  });

  if (error) {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(
      err.response?.data?.message || "Có lỗi xảy ra khi tải thống kê thu chi"
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

  const handleDateRangeChange = (value: string) => {
    setDateRange(value as typeof dateRange);
    if (value !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Thống kê thu chi</CardTitle>
            <CardDescription>
              Xem thống kê thu chi theo khoảng thời gian
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={dateRange} onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hôm nay</SelectItem>
                <SelectItem value="week">7 ngày qua</SelectItem>
                <SelectItem value="month">Tháng này</SelectItem>
                <SelectItem value="year">Năm nay</SelectItem>
                <SelectItem value="custom">Tùy chọn</SelectItem>
              </SelectContent>
            </Select>
            <Select value={type} onValueChange={(value) => setType(value as typeof type)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="IN">Thu vào</SelectItem>
                <SelectItem value="OUT">Chi ra</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {dateRange === "custom" && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Từ ngày</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endDate">Đến ngày</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
              />
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Đang tải...</div>
          </div>
        ) : data ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Tổng thu vào
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(data.totalIn)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng số tiền thu vào
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Tổng chi ra
                </CardTitle>
                <TrendingDown className="h-5 w-5 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {formatCurrency(data.totalOut)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Tổng số tiền chi ra
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">
                  Số dư
                </CardTitle>
                <DollarSign className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    parseNumber(data.netProfit) >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(data.netProfit)}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {parseNumber(data.netProfit) >= 0 ? "Lợi nhuận" : "Lỗ"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48">
            <div className="text-muted-foreground">Không có dữ liệu</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

