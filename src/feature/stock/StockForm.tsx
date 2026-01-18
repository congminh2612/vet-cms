import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { productsService } from "@/services/products.service";
import type { StockInRequest, StockOutRequest } from "@/types/api.types";

interface StockFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "IN" | "OUT";
  onSubmit: (data: StockInRequest | StockOutRequest) => void;
  isLoading?: boolean;
}

export function StockForm({
  open,
  onOpenChange,
  type,
  onSubmit,
  isLoading = false,
}: StockFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    watch,
  } = useForm<StockInRequest | StockOutRequest>({
    defaultValues: {
      productId: 0,
      quantity: 0,
      note: "",
    },
  });

  const selectedProductId = watch("productId");

  // Lấy danh sách sản phẩm
  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: () => productsService.getAll({ page: 1, limit: 1000 }),
    enabled: open,
  });

  // Lấy thông tin sản phẩm được chọn từ danh sách đã có (để đảm bảo dữ liệu nhất quán)
  const selectedProduct = productsData?.data.find(
    (p) => p.id === Number(selectedProductId)
  );

  useEffect(() => {
    if (!open) {
      reset({
        productId: 0,
        quantity: 0,
        note: "",
      });
    }
  }, [open, reset]);

  const onFormSubmit = (data: StockInRequest | StockOutRequest) => {
    // Đảm bảo số lượng được convert sang number
    const formattedData = {
      ...data,
      productId: Number(data.productId) || 0,
      quantity: Number(data.quantity) || 0,
    };
    onSubmit(formattedData);
  };

  const isStockOut = type === "OUT";
  const title = isStockOut ? "Xuất kho" : "Nhập kho";
  const description = isStockOut
    ? "Xuất sản phẩm ra khỏi kho"
    : "Nhập sản phẩm vào kho";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="productId">Sản phẩm *</Label>
            <Controller
              name="productId"
              control={control}
              rules={{
                required: "Vui lòng chọn sản phẩm",
                validate: (value) =>
                  value > 0 || "Vui lòng chọn sản phẩm",
              }}
              render={({ field }) => (
                <Select
                  value={field.value?.toString() || ""}
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <SelectTrigger id="productId">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsData?.data.map((product) => (
                      <SelectItem
                        key={product.id}
                        value={product.id.toString()}
                      >
                        {product.name} {product.unit && `(${product.unit})`}
                        {product.stock !== undefined &&
                          ` - Tồn: ${product.stock}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.productId && (
              <p className="text-sm text-destructive">
                {errors.productId.message}
              </p>
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Tồn kho hiện tại:{" "}
                <span className="font-semibold text-foreground">
                  {selectedProduct.stock ?? 0}
                </span>
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="quantity">Số lượng *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              step="1"
              placeholder="0"
              {...register("quantity", {
                required: "Vui lòng nhập số lượng",
                min: {
                  value: 1,
                  message: "Số lượng phải lớn hơn 0",
                },
                valueAsNumber: true,
                validate: (value) => {
                  if (isStockOut && selectedProduct) {
                    if (value > (selectedProduct.stock ?? 0)) {
                      return "Số lượng xuất không được vượt quá tồn kho hiện tại";
                    }
                  }
                  return true;
                },
              })}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>

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
              {isLoading ? "Đang xử lý..." : title}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

