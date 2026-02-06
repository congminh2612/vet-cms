import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cashLogsService } from "@/services/cash-logs.service";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CashStats } from "./CashStats";
import { CashForm } from "./CashForm";
import type {
  CashLog,
  CashInRequest,
  CashOutRequest,
  UpdateCashLogRequest,
} from "@/types/api.types";

export function CashPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"IN" | "OUT" | "all">("all");
  const [openCashIn, setOpenCashIn] = useState(false);
  const [openCashOut, setOpenCashOut] = useState(false);
  const [editingCashLog, setEditingCashLog] = useState<CashLog | null>(null);
  const [deletingCashLog, setDeletingCashLog] = useState<CashLog | null>(
    null
  );

  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["cash-logs", page, search, typeFilter],
    queryFn: () =>
      cashLogsService.getAll({
        page,
        limit,
        search: search || undefined,
        type: typeFilter !== "all" ? typeFilter : undefined,
      }),
  });

  const cashInMutation = useMutation({
    mutationFn: (data: CashInRequest) => cashLogsService.cashIn(data),
    onSuccess: () => {
      toast.success("Thu tiền thành công");
      setOpenCashIn(false);
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi thu tiền");
    },
  });

  const cashOutMutation = useMutation({
    mutationFn: (data: CashOutRequest) => cashLogsService.cashOut(data),
    onSuccess: () => {
      toast.success("Chi tiền thành công");
      setOpenCashOut(false);
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi chi tiền");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateCashLogRequest;
    }) => cashLogsService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật giao dịch thành công");
      setEditingCashLog(null);
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi cập nhật giao dịch"
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => cashLogsService.delete(id),
    onSuccess: () => {
      toast.success("Xóa giao dịch thành công");
      setDeletingCashLog(null);
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs-stats"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xóa giao dịch"
      );
    },
  });

  if (error) {
    const err = error as { response?: { data?: { message?: string } } };
    toast.error(
      err.response?.data?.message || "Có lỗi xảy ra khi tải lịch sử thu chi"
    );
  }

  const handleCashIn = (data: CashInRequest | CashOutRequest) => {
    cashInMutation.mutate(data as CashInRequest);
  };

  const handleCashOut = (data: CashInRequest | CashOutRequest) => {
    cashOutMutation.mutate(data as CashOutRequest);
  };

  const handleUpdate = (data: CashInRequest | CashOutRequest | UpdateCashLogRequest) => {
    if (editingCashLog) {
      updateMutation.mutate({
        id: editingCashLog.id,
        data: data as UpdateCashLogRequest,
      });
    }
  };

  const handleDelete = () => {
    if (deletingCashLog) {
      deleteMutation.mutate(deletingCashLog.id);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => {
    const value = amount ?? 0;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thu chi</h1>
          <p className="text-muted-foreground">
            Quản lý giao dịch thu chi tiền
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setOpenCashIn(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Thu tiền
          </Button>
          <Button variant="outline" onClick={() => setOpenCashOut(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Chi tiền
          </Button>
        </div>
      </div>

      <CashStats />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lịch sử giao dịch</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
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
                  <SelectItem value="IN">Thu tiền</SelectItem>
                  <SelectItem value="OUT">Chi tiền</SelectItem>
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
                        <TableHead>Loại</TableHead>
                        <TableHead>Số tiền</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Khách hàng
                        </TableHead>
                        <TableHead className="hidden md:table-cell">Ghi chú</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.data.map((log: CashLog) => (
                        <TableRow key={log.id}>
                          <TableCell className="hidden sm:table-cell">
                            {log.id}
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                log.type === "IN"
                                  ? "text-green-600 font-semibold"
                                  : "text-red-600 font-semibold"
                              }
                            >
                              {log.type === "IN" ? "Thu" : "Chi"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(log.amount)}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.customer?.name || "-"}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.note || "-"}
                          </TableCell>
                          <TableCell>
                            {log.createdAt
                              ? new Date(log.createdAt).toLocaleString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  }
                                )
                              : "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCashLog(log)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingCashLog(log)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
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

      {/* Cash In Dialog */}
      <CashForm
        open={openCashIn}
        onOpenChange={setOpenCashIn}
        type="IN"
        onSubmit={handleCashIn}
        isLoading={cashInMutation.isPending}
      />

      {/* Cash Out Dialog */}
      <CashForm
        open={openCashOut}
        onOpenChange={setOpenCashOut}
        type="OUT"
        onSubmit={handleCashOut}
        isLoading={cashOutMutation.isPending}
      />

      {/* Edit Dialog */}
      <CashForm
        open={!!editingCashLog}
        onOpenChange={(open) => !open && setEditingCashLog(null)}
        type={editingCashLog?.type || "IN"}
        cashLog={editingCashLog}
        onSubmit={handleUpdate}
        isLoading={updateMutation.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCashLog}
        onOpenChange={(open) => !open && setDeletingCashLog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa giao dịch này? Hành động này không thể
              hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

