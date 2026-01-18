import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import type {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from "@/types/api.types";

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSubmit: (data: CreateCustomerRequest | UpdateCustomerRequest) => void;
  isLoading?: boolean;
}

export function CustomerForm({
  open,
  onOpenChange,
  customer,
  onSubmit,
  isLoading = false,
}: CustomerFormProps) {
  const isEdit = !!customer;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerRequest>({
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      note: "",
    },
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        phone: customer.phone || "",
        address: customer.address || "",
        note: customer.note || "",
      });
    } else {
      reset({
        name: "",
        phone: "",
        address: "",
        note: "",
      });
    }
  }, [customer, reset, open]);

  const onFormSubmit = (data: CreateCustomerRequest) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Sửa khách hàng" : "Thêm khách hàng mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin khách hàng"
              : "Điền thông tin để thêm khách hàng mới vào hệ thống"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Tên khách hàng <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Nhập tên khách hàng"
                {...register("name", {
                  required: "Tên khách hàng là bắt buộc",
                  minLength: {
                    value: 2,
                    message: "Tên khách hàng phải có ít nhất 2 ký tự",
                  },
                })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="Nhập số điện thoại"
                {...register("phone", {
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                })}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                placeholder="Nhập địa chỉ"
                {...register("address")}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="note">Ghi chú</Label>
              <Input
                id="note"
                placeholder="Nhập ghi chú (nếu có)"
                {...register("note")}
              />
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

