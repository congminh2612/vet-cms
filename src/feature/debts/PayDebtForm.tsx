import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NumberInput } from "@/components/ui/number-input";
import { formatCurrency } from "@/utils/number-utils";
import type { Debt, PayDebtRequest } from "@/types/api.types";

interface PayDebtFormProps {
  debt: Debt;
  onSubmit: (data: PayDebtRequest) => void;
  onCancel: () => void;
}

export function PayDebtForm({ debt, onSubmit, onCancel }: PayDebtFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<PayDebtRequest>({
    defaultValues: {
      amount: debt.remainingAmount,
      note: "",
    },
  });

  const amount = watch("amount") || 0;

  const onFormSubmit = (data: PayDebtRequest) => {
    onSubmit({
      amount: Number(data.amount),
      note: data.note || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Số tiền còn lại</Label>
        <div className="text-lg font-semibold text-red-600">
          {formatCurrency(debt.remainingAmount)}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Số tiền trả *</Label>
        <Controller
          name="amount"
          control={control}
          rules={{
            required: "Vui lòng nhập số tiền",
            validate: (value) => {
              if (value <= 0) return "Số tiền phải lớn hơn 0";
              if (value > debt.remainingAmount)
                return `Số tiền không được vượt quá ${formatCurrency(debt.remainingAmount)}`;
              return true;
            },
          }}
          render={({ field }) => (
            <NumberInput
              id="amount"
              value={field.value}
              onChange={(value) => field.onChange(value)}
              suffix="VNĐ"
            />
          )}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {amount > 0 && (
        <div className="space-y-2">
          <Label>Số tiền còn lại sau khi trả</Label>
          <div className="text-lg font-semibold">
            {formatCurrency(Math.max(0, debt.remainingAmount - amount))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="note">Ghi chú</Label>
        <Input
          id="note"
          {...register("note")}
          placeholder="Ghi chú về việc trả nợ"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Hủy
        </Button>
        <Button type="submit">Xác nhận trả nợ</Button>
      </div>
    </form>
  );
}
