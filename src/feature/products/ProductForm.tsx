import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
} from "@/types/api.types";

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  onSubmit: (data: CreateProductRequest | UpdateProductRequest) => void;
  isLoading?: boolean;
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading = false,
}: ProductFormProps) {
  const isEdit = !!product;
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<CreateProductRequest>({
    defaultValues: {
      name: "",
      unit: "",
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        unit: product.unit,
        costPrice: product.costPrice,
        sellPrice: product.sellPrice,
        stock: product.stock,
      });
    } else {
      reset({
        name: "",
        unit: "",
        costPrice: 0,
        sellPrice: 0,
        stock: 0,
      });
    }
  }, [product, reset, open]);

  const onFormSubmit = (data: CreateProductRequest) => {
    // Đảm bảo tất cả số được convert đúng trước khi gọi API
    const formattedData = {
      ...data,
      costPrice: Number(data.costPrice) || 0,
      sellPrice: Number(data.sellPrice) || 0,
      stock: data.stock !== undefined ? Number(data.stock) || 0 : undefined,
    };
    onSubmit(formattedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin sản phẩm"
              : "Điền thông tin để thêm sản phẩm mới vào hệ thống"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên sản phẩm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nhập tên sản phẩm"
                {...register("name", {
                  required: "Tên sản phẩm là bắt buộc",
                  minLength: {
                    value: 2,
                    message: "Tên sản phẩm phải có ít nhất 2 ký tự",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="unit">
                Đơn vị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="unit"
                placeholder="Ví dụ: viên, hộp, chai..."
                {...register("unit", {
                  required: "Đơn vị là bắt buộc",
                })}
              />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="costPrice">
                  Giá nhập (VNĐ) <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="costPrice"
                  control={control}
                  rules={{
                    required: "Giá nhập là bắt buộc",
                    min: {
                      value: 0,
                      message: "Giá nhập phải lớn hơn hoặc bằng 0",
                    },
                  }}
                  render={({ field }) => (
                    <NumberInput
                      id="costPrice"
                      placeholder="0"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      suffix="VNĐ"
                    />
                  )}
                />
                {errors.costPrice && (
                  <p className="text-sm text-destructive">
                    {errors.costPrice.message}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="sellPrice">
                  Giá bán (VNĐ) <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="sellPrice"
                  control={control}
                  rules={{
                    required: "Giá bán là bắt buộc",
                    min: {
                      value: 0,
                      message: "Giá bán phải lớn hơn hoặc bằng 0",
                    },
                  }}
                  render={({ field }) => (
                    <NumberInput
                      id="sellPrice"
                      placeholder="0"
                      value={field.value}
                      onChange={(value) => field.onChange(value)}
                      onBlur={field.onBlur}
                      suffix="VNĐ"
                    />
                  )}
                />
                {errors.sellPrice && (
                  <p className="text-sm text-destructive">
                    {errors.sellPrice.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="stock">
                {isEdit ? "Tồn kho" : "Tồn kho ban đầu"}
              </Label>
              <Input
                id="stock"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                {...register("stock", {
                  min: {
                    value: 0,
                    message: "Tồn kho phải lớn hơn hoặc bằng 0",
                  },
                  valueAsNumber: true,
                })}
              />
              {errors.stock && (
                <p className="text-sm text-destructive">
                  {errors.stock.message}
                </p>
              )}
            </div>
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
              {isLoading
                ? "Đang xử lý..."
                : isEdit
                  ? "Cập nhật"
                  : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

