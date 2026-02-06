import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { debtsService } from "@/services/debts.service";
import { customersService } from "@/services/customers.service";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Download, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PayDebtForm } from "./PayDebtForm";
import { DebtForm } from "./DebtForm";
import { exportDebtsToExcel } from "@/utils/excel-export";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
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
import type {
  Debt,
  DebtStatus,
  PayDebtRequest,
  CreateDebtRequest,
  UpdateDebtRequest,
} from "@/types/api.types";

function getStatusBadge(status: DebtStatus) {
  const variants: Record<DebtStatus, "default" | "secondary" | "destructive"> =
    {
      PENDING: "destructive",
      PARTIAL: "secondary",
      PAID: "default",
    };
  const labels: Record<DebtStatus, string> = {
    PENDING: "Chưa trả",
    PARTIAL: "Trả một phần",
    PAID: "Đã trả đủ",
  };
  return { variant: variants[status], label: labels[status] };
}

export function DebtsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [customerFilter, setCustomerFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DebtStatus | "all">("all");
  const [openPayDebt, setOpenPayDebt] = useState(false);
  const [openDebtForm, setOpenDebtForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["debts", page, customerFilter, statusFilter],
    queryFn: () =>
      debtsService.getAll({
        page,
        limit,
        customerId:
          customerFilter !== "all" ? customerFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const { data: statsData } = useQuery({
    queryKey: ["debts-stats"],
    queryFn: () => debtsService.getStats(),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersService.getAll({ page: 1, limit: 1000 }),
  });

  const payDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayDebtRequest }) =>
      debtsService.payDebt(id, data),
    onSuccess: () => {
      toast.success("Trả nợ thành công");
      setOpenPayDebt(false);
      setSelectedDebt(null);
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi trả nợ");
    },
  });

  const createDebtMutation = useMutation({
    mutationFn: (data: CreateDebtRequest) => debtsService.create(data),
    onSuccess: () => {
      toast.success("Tạo công nợ thành công");
      setOpenDebtForm(false);
      setSelectedDebt(null);
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi tạo công nợ");
    },
  });

  const updateDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDebtRequest }) =>
      debtsService.update(id, data),
    onSuccess: () => {
      toast.success("Cập nhật công nợ thành công");
      setOpenDebtForm(false);
      setSelectedDebt(null);
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật công nợ");
    },
  });

  const deleteDebtMutation = useMutation({
    mutationFn: (id: number) => debtsService.delete(id),
    onSuccess: () => {
      toast.success("Xóa công nợ thành công");
      setOpenDeleteDialog(false);
      setSelectedDebt(null);
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["debts-stats"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi xóa công nợ");
    },
  });

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setOpenPayDebt(true);
  };

  const handleCreateDebt = () => {
    setSelectedDebt(null);
    setOpenDebtForm(true);
  };

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setOpenDebtForm(true);
  };

  const handleDeleteDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedDebt) {
      deleteDebtMutation.mutate(selectedDebt.id);
    }
  };

  const handleExportExcel = () => {
    if (!data?.data) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    exportDebtsToExcel(data.data);
    toast.success("Xuất Excel thành công");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Công nợ</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Có lỗi xảy ra khi tải dữ liệu công nợ
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Công nợ</h1>
          <p className="text-muted-foreground">
            Quản lý công nợ của khách hàng
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateDebt}>
            <Plus className="mr-2 h-4 w-4" />
            Thêm công nợ
          </Button>
          {data && data.data.length > 0 && (
            <Button onClick={handleExportExcel} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Xuất Excel
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Tổng công nợ
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(statsData.totalDebt)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Đã trả</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(statsData.totalPaid)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Còn lại</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(statsData.totalRemaining)}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">
                    Số lượng công nợ
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {parseNumber(statsData.totalDebts)}
                  </div>
                </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select
              value={
                customerFilter === "all"
                  ? "all"
                  : customerFilter.toString()
              }
              onValueChange={(value) =>
                setCustomerFilter(value === "all" ? "all" : parseInt(value))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khách hàng</SelectItem>
                {customersData?.data.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter === "all" ? "all" : statusFilter}
              onValueChange={(value) =>
                setStatusFilter(
                  value === "all" ? "all" : (value as DebtStatus)
                )
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="PENDING">Chưa trả</SelectItem>
                <SelectItem value="PARTIAL">Trả một phần</SelectItem>
                <SelectItem value="PAID">Đã trả đủ</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách công nợ</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có công nợ nào
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Tổng nợ</TableHead>
                      <TableHead>Đã trả</TableHead>
                      <TableHead>Còn lại</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((debt) => {
                      const statusBadge = getStatusBadge(debt.status);
                      return (
                        <TableRow key={debt.id}>
                          <TableCell className="font-medium">
                            {debt.customer?.name || "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(debt.totalAmount)}
                          </TableCell>
                          <TableCell className="text-green-600">
                            {formatCurrency(debt.paidAmount)}
                          </TableCell>
                          <TableCell className="text-red-600 font-semibold">
                            {formatCurrency(debt.remainingAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadge.variant}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {debt.createdAt
                              ? new Date(debt.createdAt).toLocaleDateString(
                                  "vi-VN"
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {debt.status !== "PAID" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePayDebt(debt)}
                                >
                                  Trả nợ
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditDebt(debt)}
                                className="h-8 w-8"
                                title="Sửa công nợ"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDebt(debt)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                title="Xóa công nợ"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {data.page} / {data.totalPages} ({data.total} công
                    nợ)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage(page + 1)}
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

      {/* Pay Debt Dialog */}
      <Dialog open={openPayDebt} onOpenChange={setOpenPayDebt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả nợ</DialogTitle>
            <DialogDescription>
              Trả nợ cho khách hàng: {selectedDebt?.customer?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedDebt && (
            <PayDebtForm
              debt={selectedDebt}
              onSubmit={(data) => {
                payDebtMutation.mutate({
                  id: selectedDebt.id,
                  data,
                });
              }}
              onCancel={() => {
                setOpenPayDebt(false);
                setSelectedDebt(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Debt Form Dialog */}
      <Dialog open={openDebtForm} onOpenChange={setOpenDebtForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDebt ? "Sửa công nợ" : "Thêm công nợ mới"}
            </DialogTitle>
            <DialogDescription>
              {selectedDebt
                ? "Cập nhật thông tin công nợ"
                : "Tạo công nợ mới (nợ cũ không liên kết với giao dịch bán hàng)"}
            </DialogDescription>
          </DialogHeader>
          <DebtForm
            debt={selectedDebt}
            customerId={
              selectedDebt?.customerId ||
              (customerFilter !== "all" ? customerFilter : undefined)
            }
            onSubmit={(data) => {
              if (selectedDebt) {
                updateDebtMutation.mutate({
                  id: selectedDebt.id,
                  data,
                });
              } else {
                createDebtMutation.mutate(data as CreateDebtRequest);
              }
            }}
            onCancel={() => {
              setOpenDebtForm(false);
              setSelectedDebt(null);
            }}
            isLoading={
              createDebtMutation.isPending || updateDebtMutation.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa công nợ</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa công nợ{" "}
              <span className="font-semibold">#{selectedDebt?.id}</span> của khách hàng{" "}
              <span className="font-semibold">
                {selectedDebt?.customer?.name || "N/A"}
              </span>{" "}
              không?
              <br />
              <span className="text-destructive">
                Số tiền nợ:{" "}
                {selectedDebt && formatCurrency(selectedDebt.totalAmount)}
              </span>
              <br />
              Hành động này không thể hoàn tác. Lịch sử thanh toán cũng sẽ bị xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDebtMutation.isPending}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteDebtMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDebtMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

