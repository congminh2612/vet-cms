import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { customersService } from "@/services/customers.service";
import { debtsService } from "@/services/debts.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { PayDebtForm } from "@/feature/debts/PayDebtForm";
import { DebtForm } from "@/feature/debts/DebtForm";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type {
  Debt,
  DebtStatus,
  PayDebtRequest,
  CreateDebtRequest,
  UpdateDebtRequest,
} from "@/types/api.types";
import { useState } from "react";

interface CustomerDebtsProps {
  customerId: number;
  customerName: string;
  onClose: () => void;
}

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

export function CustomerDebts({
  customerId,
  customerName,
  onClose: _onClose,
}: CustomerDebtsProps) {
  const queryClient = useQueryClient();
  const [openPayDebt, setOpenPayDebt] = useState(false);
  const [openDebtForm, setOpenDebtForm] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

  // Get customer details with debts
  const { data: customerData, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ["customer", customerId],
    queryFn: () => customersService.getById(customerId),
  });

  // Get customer debts
  const { data: debtsData, isLoading: isLoadingDebts } = useQuery({
    queryKey: ["customer-debts", customerId],
    queryFn: () => customersService.getCustomerDebts(customerId),
  });

  const payDebtMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: PayDebtRequest }) =>
      debtsService.payDebt(id, data),
    onSuccess: () => {
      toast.success("Trả nợ thành công");
      setOpenPayDebt(false);
      setSelectedDebt(null);
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["cash-logs"] });
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
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
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
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
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
      queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customer-debts", customerId] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
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

  const totalDebt = parseNumber(customerData?.totalDebt);
  const totalSpent = parseNumber(customerData?.totalSpent);
  const totalOrders = customerData?.totalOrders ?? 0;
  const pendingDebts = customerData?.pendingDebts ?? 0;

  const debts = debtsData || customerData?.debts || [];

  return (
    <div className="space-y-4">
      {/* Customer Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalDebt)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Số khoản nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDebts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalSpent)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đơn hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Debts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Danh sách công nợ</CardTitle>
            <Button onClick={handleCreateDebt} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Thêm công nợ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingCustomer || isLoadingDebts ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : debts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có công nợ nào
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã công nợ</TableHead>
                    <TableHead>Tổng nợ</TableHead>
                    <TableHead>Đã trả</TableHead>
                    <TableHead>Còn lại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debts.map((debt: Debt) => {
                    const statusBadge = getStatusBadge(debt.status);
                    return (
                      <TableRow key={debt.id}>
                        <TableCell className="font-medium">
                          #{debt.id}
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
          )}
        </CardContent>
      </Card>

      {/* Pay Debt Dialog */}
      <Dialog open={openPayDebt} onOpenChange={setOpenPayDebt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Trả nợ</DialogTitle>
            <DialogDescription>
              Trả nợ cho khách hàng: {customerName}
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
                : `Tạo công nợ mới cho khách hàng: ${customerName}`}
            </DialogDescription>
          </DialogHeader>
          <DebtForm
            debt={selectedDebt}
            customerId={customerId}
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
              <span className="font-semibold">{customerName}</span> không?
              <br />
              <span className="text-destructive">
                Số tiền nợ: {selectedDebt && formatCurrency(selectedDebt.totalAmount)}
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

