import { useEffect, useMemo, useState } from "react";
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
import {
  SearchableSelect,
  type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { customersService } from "@/services/customers.service";
import { productsService } from "@/services/products.service";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
import { Plus, Trash2, UserPlus, ShoppingCart, Package } from "lucide-react";
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

  const [paidAmount, setPaidAmount] = useState<number | undefined>(undefined);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CashInRequest | CashOutRequest | UpdateCashLogRequest>({
    defaultValues: {
      amount: 0,
      customerId: undefined,
      note: "",
      paidAmount: undefined,
    },
  });

  const selectedCustomerId = watch("customerId");

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
  } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsService.getAll({ page: 1, limit: 1000 }),
    enabled: open && !isStockOut && !isEdit,
  });

  // Tạo danh sách options cho SearchableSelect khách hàng
  const customerOptions: SearchableSelectOption[] = useMemo(() => {
    const opts: SearchableSelectOption[] = [
      { value: "none", label: "Không chọn khách hàng" },
    ];
    if (customersData?.data) {
      customersData.data.forEach((c) => {
        opts.push({
          value: c.id.toString(),
          label: c.name,
          sublabel: [c.phone, c.address].filter(Boolean).join(" • ") || undefined,
        });
      });
    }
    return opts;
  }, [customersData]);

  // Tạo danh sách options cho SearchableSelect sản phẩm
  const productOptions: SearchableSelectOption[] = useMemo(() => {
    if (!productsData?.data || !Array.isArray(productsData.data)) return [];
    return productsData.data.map((p) => ({
      value: p.id.toString(),
      label: `${p.name}${p.unit ? ` (${p.unit})` : ""}`,
      sublabel: `Giá: ${formatCurrency(parseNumber(p.sellPrice))} — Tồn: ${p.stock ?? 0}`,
    }));
  }, [productsData]);

  useEffect(() => {
    if (!open) {
      reset({
        amount: 0,
        customerId: undefined,
        note: "",
        paidAmount: undefined,
      });
      // Reset state khi form đóng
      setTimeout(() => {
        setMode("simple");
        setItems([]);
        setPaidAmount(undefined);
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
        paidAmount: undefined,
      });
      setTimeout(() => {
        setMode("simple");
        setItems([]);
        setPaidAmount(undefined);
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
          // paidAmount: undefined = trả đủ, 0 = chưa trả, >0 = trả một phần
          paidAmount:
            paidAmount !== undefined
              ? Number(paidAmount)
              : undefined,
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
                  <SearchableSelect
                    id="customerId"
                    options={customerOptions}
                    value={field.value?.toString() || "none"}
                    onValueChange={(value) =>
                      field.onChange(
                        value === "none" || value === ""
                          ? undefined
                          : Number(value)
                      )
                    }
                    placeholder="Tìm & chọn khách hàng..."
                    searchPlaceholder="Nhập tên hoặc SĐT khách hàng..."
                    emptyMessage="Không tìm thấy khách hàng"
                  />
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
              {/* Header sản phẩm */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">Sản phẩm bán</Label>
                  {items.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {items.length} sản phẩm
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={addItem}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Thêm
                </Button>
              </div>

              {/* Empty state */}
              {items.length === 0 ? (
                <Card className="border-dashed border-2">
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    {isLoadingProducts ? (
                      <>
                        <div className="h-10 w-10 rounded-full bg-muted animate-pulse mb-3" />
                        <p className="text-sm text-muted-foreground">Đang tải sản phẩm...</p>
                      </>
                    ) : productsData?.data && productsData.data.length === 0 ? (
                      <>
                        <Package className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-destructive">
                          Chưa có sản phẩm nào
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vui lòng thêm sản phẩm trong phần quản lý sản phẩm trước
                        </p>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-10 w-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm font-medium text-muted-foreground">
                          Chưa có sản phẩm nào
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">
                          Nhấn "Thêm" để bắt đầu thêm sản phẩm bán
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addItem}
                          className="gap-1.5"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Thêm sản phẩm đầu tiên
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ) : (
                <div className="space-y-3">
                  {items.map((item, index) => {
                    const product = productsData?.data.find(
                      (p) => p.id === item.productId
                    );
                    const unitPrice = item.unitPrice ?? product?.sellPrice ?? 0;
                    const itemTotal = unitPrice * item.quantity;
                    const stockLevel = product?.stock ?? 0;
                    const isLowStock = stockLevel > 0 && stockLevel <= 10;
                    const isOutOfStock = stockLevel === 0 && product;

                    return (
                      <Card
                        key={index}
                        className="overflow-hidden transition-shadow hover:shadow-md"
                      >
                        {/* Item header */}
                        <div className="flex items-center justify-between bg-muted/50 px-4 py-2 border-b">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium truncate">
                              {product ? product.name : "Chọn sản phẩm"}
                            </span>
                            {product && product.unit && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {product.unit}
                              </Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeItem(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        {/* Item body */}
                        <div className="p-4 space-y-3">
                          {/* Product select */}
                          <div>
                            <Label className="text-xs text-muted-foreground mb-1 block">
                              Sản phẩm <span className="text-destructive">*</span>
                            </Label>
                            <SearchableSelect
                              options={productOptions}
                              value={
                                item.productId > 0
                                  ? item.productId.toString()
                                  : ""
                              }
                              onValueChange={(value) =>
                                updateItem(
                                  index,
                                  "productId",
                                  value === "" ? 0 : Number(value)
                                )
                              }
                              placeholder="Tìm & chọn sản phẩm..."
                              searchPlaceholder="Nhập tên sản phẩm..."
                              emptyMessage="Không tìm thấy sản phẩm"
                              isLoading={isLoadingProducts}
                            />
                          </div>

                          {/* Quantity + Price row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Số lượng <span className="text-destructive">*</span>
                              </Label>
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
                                <p
                                  className={`text-xs mt-1 ${
                                    isOutOfStock
                                      ? "text-destructive font-medium"
                                      : isLowStock
                                      ? "text-orange-500"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  Tồn kho: {stockLevel}
                                  {isOutOfStock && " (Hết hàng!)"}
                                  {isLowStock && " (Sắp hết)"}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground mb-1 block">
                                Đơn giá
                              </Label>
                              <NumberInput
                                value={item.unitPrice ?? product?.sellPrice ?? 0}
                                onChange={(value) =>
                                  updateItem(index, "unitPrice", value)
                                }
                                placeholder="0"
                                suffix="VNĐ"
                              />
                              {product && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Giá gốc: {formatCurrency(product.sellPrice)}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Subtotal */}
                          {item.productId > 0 && (
                            <div className="flex items-center justify-between pt-2 border-t border-dashed">
                              <span className="text-sm text-muted-foreground">
                                Thành tiền:
                              </span>
                              <span className="text-sm font-bold text-primary">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Tổng kết & thanh toán */}
              {items.length > 0 && (
                <div className="space-y-3">
                  {/* Tổng tiền */}
                  <Card className="overflow-hidden">
                    <div className="bg-primary/5 border-b px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-primary" />
                          <span className="font-semibold">Tổng cộng</span>
                          <span className="text-xs text-muted-foreground">
                            ({items.filter((i) => i.productId > 0).length} sản phẩm)
                          </span>
                        </div>
                        <span className="text-lg font-bold text-primary">
                          {formatCurrency(totalFromItems)}
                        </span>
                      </div>
                    </div>

                    {/* Thanh toán - chỉ hiển thị khi có khách hàng */}
                    {selectedCustomerId && (
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="paidAmount" className="text-sm font-medium">
                            Khách trả ngay
                          </Label>
                          <span className="text-xs text-muted-foreground">
                            Để trống = trả đủ, nhập 0 = chưa trả
                          </span>
                        </div>
                        <NumberInput
                          id="paidAmount"
                          value={paidAmount !== undefined ? paidAmount : ""}
                          onChange={(value) => {
                            setPaidAmount(value);
                            setValue("paidAmount", value);
                          }}
                          placeholder={`${new Intl.NumberFormat("vi-VN").format(totalFromItems)} (trả đủ)`}
                          suffix="VNĐ"
                          allowZero
                        />

                        {/* Progress bar */}
                        {paidAmount !== undefined && totalFromItems > 0 && (
                          <div className="space-y-2">
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  paidAmount >= totalFromItems
                                    ? "bg-green-500"
                                    : paidAmount >= totalFromItems * 0.5
                                    ? "bg-orange-400"
                                    : "bg-red-400"
                                }`}
                                style={{
                                  width: `${Math.min(100, (paidAmount / totalFromItems) * 100)}%`,
                                }}
                              />
                            </div>

                            <div className="rounded-lg border p-3 space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tổng tiền:</span>
                                <span className="font-medium">
                                  {formatCurrency(totalFromItems)}
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Đã trả:</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(paidAmount)}
                                </span>
                              </div>
                              {paidAmount < totalFromItems && (
                                <div className="flex justify-between text-sm border-t pt-1.5">
                                  <span className="text-muted-foreground">Còn nợ:</span>
                                  <span className="font-semibold text-red-600">
                                    {formatCurrency(totalFromItems - paidAmount)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {paidAmount >= totalFromItems ? (
                              <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-500/10 px-3 py-2 rounded-md">
                                <span>✓</span>
                                <span className="font-medium">Khách hàng trả đủ, không có công nợ</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 dark:bg-orange-500/10 px-3 py-2 rounded-md">
                                <span>⚠</span>
                                <span className="font-medium">
                                  Sẽ tự động tạo công nợ: {formatCurrency(totalFromItems - paidAmount)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                </div>
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
                    suffix="VNĐ"
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
