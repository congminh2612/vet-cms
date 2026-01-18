import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  formatOnBlur?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, formatOnBlur = true, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>("");

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setDisplayValue(formatNumber(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const formatNumber = (num: number): string => {
      if (num === 0) return "";
      return new Intl.NumberFormat("vi-VN").format(num);
    };

    const parseNumber = (str: string): number => {
      // Loại bỏ tất cả dấu phẩy, dấu chấm và khoảng trắng
      const cleaned = str.replace(/[,.\s]/g, "");
      if (cleaned === "") return 0;
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Cho phép xóa hết
      if (inputValue === "") {
        setDisplayValue("");
        onChange?.(0);
        return;
      }

      // Chỉ cho phép số
      const cleaned = inputValue.replace(/\D/g, "");
      
      if (cleaned === "") {
        setDisplayValue("");
        onChange?.(0);
        return;
      }
      
      // Parse số từ input
      const numValue = parseNumber(cleaned);
      
      // Hiển thị số thô khi đang nhập (sẽ format khi blur)
      setDisplayValue(cleaned);
      onChange?.(numValue);
    };

    const handleBlur = () => {
      if (displayValue) {
        const numValue = parseNumber(displayValue);
        if (numValue > 0) {
          setDisplayValue(formatNumber(numValue));
        } else {
          setDisplayValue("");
        }
        onChange?.(numValue);
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(className)}
        {...props}
      />
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };

