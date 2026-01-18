import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { customersService } from "@/services/customers.service";
import { productsService } from "@/services/products.service";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type {
  CashLog,
  CashInRequest,
  CashOutRequest,
  UpdateCashLogRequest,
  CashInItem,
  CreateCustomerRequest,
  Customer,
} from "@/types/api.types";

interface CashFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "IN" | "OUT";
  cashLog?: CashLog | null;
  onSubmit: (
    data: CashInRequest | CashOutRequest | UpdateCashLogRequest
  ) => void;
  isLoading?: boolean;
}

export function CashForm({
  open,
  onOpenChange,
  type,
  cashLog,
  onSubmit,
  isLoading = false,
}: CashFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!cashLog;
  const isStockOut = type === "OUT";
  const [mode, setMode] = useState<"simple" | "withItems">("simple");
  const [items, setItems] = useState<CashInItem[]>([]);
  const [openNewCustomer, setOpenNewCustomer] = useState(false);
  
  // Form cho khách hàng mới
  const {
    register: registerCustomer,
    handleSubmit: handleSubmitCustomer,
    reset: resetCustomer,
    formState: { errors: customerErrors },
  } = useForm<CreateCustomerRequest>({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      note: "",
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<CashInRequest | CashOutRequest | UpdateCashLogRequest>({
    defaultValues: {
      amount: 0,
      customerId: undefined,
      note: "",
    },
  });

  // Lấy danh sách khách hàng (chỉ cho thu tiền)
  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersService.getAll({ page: 1, limit: 1000 }),
    enabled: open && !isStockOut,
  });

  // Mutation để tạo khách hàng mới
  const createCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) =>
      customersService.create(data),
    onSuccess: (newCustomer: Customer) => {
      toast.success("Tạo khách hàng thành công");
      setOpenNewCustomer(false);
      resetCustomer();
      // Refresh danh sách khách hàng
      queryClient.invalidateQueries({ queryKey: ["customers", "all"] });
      // Tự động chọn khách hàng vừa tạo
      setValue("customerId", newCustomer.id);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo khách hàng"
      );
    },
  });

  // Lấy danh sách sản phẩm (cho bán hàng) - luôn query khi form mở để sẵn sàng
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
  } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsService.getAll({ page: 1, limit: 1000 }),
    enabled: open && !isStockOut && !isEdit,
  });


  useEffect(() => {
    if (!open) {
      reset({
        amount: 0,
        customerId: undefined,
        note: "",
      });
      // Reset state khi form đóng
      setTimeout(() => {
        setMode("simple");
        setItems([]);
        setOpenNewCustomer(false);
        resetCustomer();
      }, 0);
    } else if (cashLog) {
      reset({
        amount: cashLog.amount,
        customerId: cashLog.customerId,
        note: cashLog.note || "",
      });
    } else {
      reset({
        amount: 0,
        customerId: undefined,
        note: "",
      });
      setTimeout(() => {
        setMode("simple");
        setItems([]);
      }, 0);
    }
  }, [cashLog, reset, open, resetCustomer]);

  // Tính tổng tiền từ items
  const calculateTotalFromItems = (): number => {
    return items.reduce((total, item) => {
      const product = productsData?.data.find((p) => p.id === item.productId);
      const unitPrice = item.unitPrice ?? product?.sellPrice ?? 0;
      return total + unitPrice * item.quantity;
    }, 0);
  };

  const addItem = () => {
    setItems([...items, { productId: 0, quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof CashInItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onFormSubmit = (
    data: CashInRequest | CashOutRequest | UpdateCashLogRequest
  ) => {
    if (isEdit) {
      // Edit mode: chỉ gửi amount và note
      const formattedData = {
        amount: Number(data.amount) || 0,
        note: data.note,
      };
      onSubmit(formattedData);
    } else if (isStockOut) {
      // Chi tiền: chỉ có amount và note
      const formattedData = {
        amount: Number(data.amount) || 0,
        note: data.note,
      };
      onSubmit(formattedData);
    } else {
      // Thu tiền
      if (mode === "withItems" && items.length > 0) {
        // Bán hàng với items
        const validItems = items.filter(
          (item) => item.productId > 0 && item.quantity > 0
        );
        if (validItems.length === 0) {
          return;
        }
        const formattedData: CashInRequest = {
          customerId:
            "customerId" in data &&
            data.customerId !== undefined &&
            data.customerId !== null
              ? Number(data.customerId)
              : undefined,
          note: data.note,
          items: validItems.map((item) => ({
            productId: Number(item.productId),
            quantity: Number(item.quantity),
            unitPrice:
              item.unitPrice && item.unitPrice > 0
                ? Number(item.unitPrice)
                : undefined,
          })),
        };
        onSubmit(formattedData);
      } else {
        // Thu tiền thông thường
        const formattedData: CashInRequest = {
          amount: Number(data.amount) || 0,
          customerId:
            "customerId" in data &&
            data.customerId !== undefined &&
            data.customerId !== null
              ? Number(data.customerId)
              : undefined,
          note: data.note,
        };
        onSubmit(formattedData);
      }
    }
  };

  const title = isEdit
    ? "Sửa giao dịch"
    : isStockOut
    ? "Chi tiền"
    : "Thu tiền";
  const description = isEdit
    ? "Cập nhật thông tin giao dịch"
    : isStockOut
    ? "Ghi nhận chi tiền"
    : "Ghi nhận thu tiền";

  const totalFromItems = calculateTotalFromItems();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {!isStockOut && !isEdit && (
            <div className="grid gap-2">
              <Label>Loại giao dịch</Label>
              <Select
                value={mode}
                onValueChange={(value) => {
                  const newMode = value as "simple" | "withItems";
                  setMode(newMode);
                  // Tự động thêm một item trống khi chọn mode "withItems"
                  if (newMode === "withItems" && items.length === 0) {
                    setItems([{ productId: 0, quantity: 1 }]);
                  } else if (newMode === "simple") {
                    setItems([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Thu tiền thông thường</SelectItem>
                  <SelectItem value="withItems">Bán hàng (có sản phẩm)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {!isStockOut && !isEdit && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="customerId">Khách hàng</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenNewCustomer(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tạo khách hàng mới
                </Button>
              </div>
              <Controller
                name="customerId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value?.toString() || "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : Number(value))
                    }
                  >
                    <SelectTrigger id="customerId">
                      <SelectValue placeholder="Chọn khách hàng (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không chọn</SelectItem>
                      {customersData?.data.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                        >
                          {customer.name}
                          {customer.phone && ` - ${customer.phone}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {isEdit && cashLog?.customer && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Khách hàng:{" "}
                <span className="font-semibold text-foreground">
                  {cashLog.customer.name}
                </span>
              </p>
            </div>
          )}

          {mode === "withItems" && !isStockOut && !isEdit && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Sản phẩm bán</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Thêm sản phẩm
                </Button>
              </div>

              {items.length === 0 ? (
                <Card className="p-4 text-center text-muted-foreground">
                  {isLoadingProducts ? (
                    <p>Đang tải danh sách sản phẩm...</p>
                  ) : productsData?.data && productsData.data.length === 0 ? (
                    <p className="text-destructive">
                      Chưa có sản phẩm nào trong cửa hàng. Vui lòng thêm sản phẩm trước.
                    </p>
                  ) : null}
                </Card>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const product = productsData?.data.find(
                      (p) => p.id === item.productId
                    );
                    const unitPrice = item.unitPrice ?? product?.sellPrice ?? 0;
                    const itemTotal = unitPrice * item.quantity;

                    return (
                      <Card key={index} className="p-4">
                        <div className="grid gap-3 md:grid-cols-12">
                          <div className="md:col-span-4">
                            <Label className="text-sm">Sản phẩm *</Label>
                            <Select
                              value={
                                item.productId > 0
                                  ? item.productId.toString()
                                  : "none"
                              }
                              onValueChange={(value) =>
                                updateItem(
                                  index,
                                  "productId",
                                  value === "none" ? 0 : Number(value)
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn sản phẩm từ cửa hàng" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Chọn sản phẩm</SelectItem>
                                {(() => {
                                  if (isLoadingProducts) {
                                    return (
                                      <SelectItem value="none" disabled>
                                        Đang tải...
                                      </SelectItem>
                                    );
                                  }
                                  if (productsError) {
                                    return (
                                      <SelectItem value="none" disabled>
                                        Lỗi khi tải sản phẩm
                                      </SelectItem>
                                    );
                                  }
                                  if (!productsData) {
                                    return (
                                      <SelectItem value="none" disabled>
                                        Đang tải...
                                      </SelectItem>
                                    );
                                  }
                                  if (!productsData.data || !Array.isArray(productsData.data)) {
                                    return (
                                      <SelectItem value="none" disabled>
                                        Dữ liệu không hợp lệ
                                      </SelectItem>
                                    );
                                  }
                                  if (productsData.data.length === 0) {
                                    return (
                                      <SelectItem value="none" disabled>
                                        Chưa có sản phẩm trong cửa hàng
                                      </SelectItem>
                                    );
                                  }
                                  return productsData.data.map((p) => (
                                    <SelectItem
                                      key={p.id}
                                      value={p.id.toString()}
                                    >
                                      {p.name} {p.unit && `(${p.unit})`}
                                      {p.stock !== undefined && ` - Tồn: ${p.stock}`}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-sm">Số lượng *</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity || ""}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "quantity",
                                  Number(e.target.value) || 1
                                )
                              }
                              placeholder="0"
                            />
                            {product && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tồn: {product.stock ?? 0}
                              </p>
                            )}
                          </div>

                          <div className="md:col-span-3">
                            <Label className="text-sm">Đơn giá (VNĐ)</Label>
                            <NumberInput
                              value={item.unitPrice ?? product?.sellPrice ?? 0}
                              onChange={(value) =>
                                updateItem(index, "unitPrice", value)
                              }
                              placeholder="0"
                              formatOnBlur
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Mặc định: {product?.sellPrice?.toLocaleString("vi-VN") || 0} VNĐ
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <Label className="text-sm">Thành tiền</Label>
                            <div className="h-10 flex items-center font-semibold">
                              {itemTotal.toLocaleString("vi-VN")} VNĐ
                            </div>
                          </div>

                          <div className="md:col-span-1 flex items-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {items.length > 0 && (
                <Card className="p-4 bg-muted">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Tổng tiền:</span>
                    <span className="text-lg font-bold">
                      {totalFromItems.toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>
                </Card>
              )}
            </div>
          )}

          {mode === "simple" && (
            <div className="grid gap-2">
              <Label htmlFor="amount">Số tiền *</Label>
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: mode === "simple" ? "Vui lòng nhập số tiền" : false,
                  min: {
                    value: 1,
                    message: "Số tiền phải lớn hơn 0",
                  },
                }}
                render={({ field }) => (
                  <NumberInput
                    id="amount"
                    value={field.value || 0}
                    onChange={(value) => field.onChange(value)}
                    placeholder="0"
                    formatOnBlur
                  />
                )}
              />
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Input
              id="note"
              placeholder="Nhập ghi chú (tùy chọn)"
              {...register("note")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật" : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Dialog tạo khách hàng mới */}
      <Dialog open={openNewCustomer} onOpenChange={setOpenNewCustomer}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>
              Tạo khách hàng mới để sử dụng ngay trong giao dịch này
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmitCustomer((data) => {
              createCustomerMutation.mutate(data);
            })}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="customerName">
                Tên khách hàng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Nhập tên khách hàng"
                {...registerCustomer("name", {
                  required: "Tên khách hàng là bắt buộc",
                })}
              />
              {customerErrors.name && (
                <p className="text-sm text-destructive">
                  {customerErrors.name.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerPhone">Số điện thoại</Label>
              <Input
                id="customerPhone"
                placeholder="Nhập số điện thoại (tùy chọn)"
                {...registerCustomer("phone")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerAddress">Địa chỉ</Label>
              <Input
                id="customerAddress"
                placeholder="Nhập địa chỉ (tùy chọn)"
                {...registerCustomer("address")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="customerNote">Ghi chú</Label>
              <Input
                id="customerNote"
                placeholder="Nhập ghi chú (tùy chọn)"
                {...registerCustomer("note")}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenNewCustomer(false)}
                disabled={createCustomerMutation.isPending}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending
                  ? "Đang tạo..."
                  : "Tạo khách hàng"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
