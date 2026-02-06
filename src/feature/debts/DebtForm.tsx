import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { customersService } from "@/services/customers.service";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
import type {
  Debt,
  CreateDebtRequest,
  UpdateDebtRequest,
} from "@/types/api.types";

interface DebtFormProps {
  debt?: Debt | null;
  customerId?: number;
  onSubmit: (data: CreateDebtRequest | UpdateDebtRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface DebtFormValues {
  customerId?: number;
  totalAmount: number;
  paidAmount: number;
  note: string;
}

export function DebtForm({
  debt,
  customerId,
  onSubmit,
  onCancel,
  isLoading = false,
}: DebtFormProps) {
  const isEdit = !!debt;
  const needsCustomerSelection = !isEdit && !customerId;

  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersService.getAll({ page: 1, limit: 1000 }),
    enabled: needsCustomerSelection,
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    formState: { errors },
  } = useForm<DebtFormValues>({
    defaultValues: {
      customerId: customerId || undefined,
      totalAmount: 0,
      paidAmount: 0,
      note: "",
    },
  });

  useEffect(() => {
    if (debt) {
      reset({
        customerId: debt.customerId,
        totalAmount: parseNumber(debt.totalAmount),
        paidAmount: parseNumber(debt.paidAmount),
        note: debt.note || "",
      });
    } else {
      reset({
        customerId: customerId || undefined,
        totalAmount: 0,
        paidAmount: 0,
        note: "",
      });
    }
  }, [debt, reset, customerId]);

  const totalAmount = watch("totalAmount") || 0;
  const paidAmount = watch("paidAmount") || 0;
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const onFormSubmit = (data: DebtFormValues) => {
    if (isEdit) {
      const updateData: UpdateDebtRequest = {
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        note: data.note || undefined,
      };
      onSubmit(updateData);
    } else {
      const finalCustomerId = data.customerId
        ? Number(data.customerId)
        : customerId;
      if (!finalCustomerId) {
        return;
      }

      const createData: CreateDebtRequest = {
        customerId: finalCustomerId,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount > 0 ? data.paidAmount : undefined,
        note: data.note || undefined,
      };

      onSubmit(createData);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      {/* Chọn khách hàng */}
      {needsCustomerSelection && (
        <div className="space-y-2">
          <Label htmlFor="customerId">
            Khách hàng <span className="text-destructive">*</span>
          </Label>
          <Controller
            name="customerId"
            control={control}
            rules={{ required: "Vui lòng chọn khách hàng" }}
            render={({ field }) => (
              <Select
                value={field.value?.toString() || "none"}
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : Number(value))
                }
              >
                <SelectTrigger id="customerId">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Chọn khách hàng</SelectItem>
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
          {errors.customerId && (
            <p className="text-sm text-destructive">
              {errors.customerId.message}
            </p>
          )}
        </div>
      )}

      {/* Tổng số tiền nợ */}
      <div className="space-y-2">
        <Label htmlFor="totalAmount">
          Tổng số tiền nợ <span className="text-destructive">*</span>
        </Label>
        <Controller
          name="totalAmount"
          control={control}
          rules={{
            required: "Vui lòng nhập tổng số tiền nợ",
            validate: (value) =>
              value > 0 || "Tổng số tiền nợ phải lớn hơn 0",
          }}
          render={({ field }) => (
            <NumberInput
              id="totalAmount"
              value={field.value}
              onChange={(value) => field.onChange(value)}
              suffix="VNĐ"
            />
          )}
        />
        {errors.totalAmount && (
          <p className="text-sm text-destructive">
            {errors.totalAmount.message}
          </p>
        )}
      </div>

      {/* Số tiền đã trả */}
      <div className="space-y-2">
        <Label htmlFor="paidAmount">Số tiền đã trả</Label>
        <Controller
          name="paidAmount"
          control={control}
          rules={{
            min: { value: 0, message: "Số tiền đã trả không được âm" },
            validate: (value) =>
              value <= totalAmount ||
              "Số tiền đã trả không được vượt quá tổng số tiền nợ",
          }}
          render={({ field }) => (
            <NumberInput
              id="paidAmount"
              value={field.value}
              onChange={(value) => field.onChange(value)}
              suffix="VNĐ"
            />
          )}
        />
        {errors.paidAmount && (
          <p className="text-sm text-destructive">
            {errors.paidAmount.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Để trống hoặc 0 nếu chưa trả
        </p>
      </div>

      {/* Tóm tắt */}
      {totalAmount > 0 && (
        <div className="rounded-lg border p-3 bg-muted/50">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng nợ:</span>
              <span className="font-semibold">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đã trả:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(paidAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Còn lại:</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(remainingAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Ghi chú */}
      <div className="space-y-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Input
          id="note"
          {...register("note")}
          placeholder="Ghi chú về công nợ (tùy chọn)"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Tạo công nợ"}
        </Button>
      </div>
    </form>
  );
}
