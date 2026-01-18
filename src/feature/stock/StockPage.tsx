import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockLogsService } from "@/services/stock-logs.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { StockForm } from "./StockForm";
import type { StockInRequest, StockOutRequest } from "@/types/api.types";

export function StockPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"IN" | "OUT" | "all">("all");
  const [openStockIn, setOpenStockIn] = useState(false);
  const [openStockOut, setOpenStockOut] = useState(false);

  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["stock-logs", page, search, typeFilter],
    queryFn: () =>
      stockLogsService.getAll({
        page,
        limit,
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      }),
  });

  const stockInMutation = useMutation({
    mutationFn: (data: StockInRequest) => stockLogsService.stockIn(data),
    onSuccess: () => {
      toast.success("Nhập kho thành công");
      setOpenStockIn(false);
      queryClient.invalidateQueries({ queryKey: ["stock-logs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi nhập kho"
      );
    },
  });

  const stockOutMutation = useMutation({
    mutationFn: (data: StockOutRequest) => stockLogsService.stockOut(data),
    onSuccess: () => {
      toast.success("Xuất kho thành công");
      setOpenStockOut(false);
      queryClient.invalidateQueries({ queryKey: ["stock-logs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xuất kho"
      );
    },
  });

  if (error) {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(
      err.response?.data?.message || "Có lỗi xảy ra khi tải lịch sử kho hàng"
    );
  }

  const handleStockIn = (data: StockInRequest | StockOutRequest) => {
    stockInMutation.mutate(data as StockInRequest);
  };

  const handleStockOut = (data: StockInRequest | StockOutRequest) => {
    stockOutMutation.mutate(data as StockOutRequest);
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kho hàng</h1>
          <p className="text-muted-foreground">
            Quản lý nhập xuất kho hàng
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenStockIn(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nhập kho
          </Button>
          <Button variant="outline" onClick={() => setOpenStockOut(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Xuất kho
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lịch sử nhập xuất</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as "IN" | "OUT" | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Lọc theo loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="IN">Nhập kho</SelectItem>
                  <SelectItem value="OUT">Xuất kho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Đang tải...</div>
            </div>
          ) : !data?.data || data.data.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Không có dữ liệu</div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="hidden sm:table-cell">ID</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Số lượng</TableHead>
                        <TableHead className="hidden md:table-cell">Ghi chú</TableHead>
                        <TableHead>Ngày</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="hidden sm:table-cell">
                            {log.id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.product?.name || `Product ID: ${log.productId}`}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                log.type === "IN"
                                  ? "text-green-600 font-semibold"
                                  : "text-red-600 font-semibold"
                              }
                            >
                              {log.type === "IN" ? "Nhập" : "Xuất"}
                            </span>
                          </TableCell>
                          <TableCell>{log.quantity}</TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.note || "-"}
                          </TableCell>
                          <TableCell>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleDateString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} ({data.total} bản ghi)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Stock In Dialog */}
      <StockForm
        open={openStockIn}
        onOpenChange={setOpenStockIn}
        type="IN"
        onSubmit={handleStockIn}
        isLoading={stockInMutation.isPending}
      />

      {/* Stock Out Dialog */}
      <StockForm
        open={openStockOut}
        onOpenChange={setOpenStockOut}
        type="OUT"
        onSubmit={handleStockOut}
        isLoading={stockOutMutation.isPending}
      />
    </div>
  );
}

