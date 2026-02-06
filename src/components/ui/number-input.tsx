import * as React from "react";
import { Input } from "./input";
import { cn } from "@/lib/utils";

export interface NumberInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: number | string;
  onChange?: (value: number) => void;
  formatOnBlur?: boolean;
  suffix?: string; // Thêm suffix như "VNĐ" nếu cần
  /** Cho phép hiển thị "0" thay vì để trống khi value = 0 */
  allowZero?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, formatOnBlur = false, suffix, allowZero = false, ...props }, ref) => {
    // Lưu onChange từ props (có thể từ react-hook-form register)
    const reactHookFormOnChange = (props as any).onChange;
    const [displayValue, setDisplayValue] = React.useState<string>("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        let numValue: number;
        if (typeof value === "string") {
          // Xử lý cả string thập phân ("9900000.00") và format VN ("9.900.000")
          const decimalMatch = value.match(/^-?\d+\.\d{1,2}$/);
          if (decimalMatch) {
            numValue = parseFloat(value) || 0;
          } else {
            numValue = parseNumber(value);
          }
        } else {
          numValue = value;
        }
        
        if (numValue === 0) {
          setDisplayValue(allowZero ? "0" : "");
        } else {
          const formatted = formatNumber(numValue);
          setDisplayValue(formatted);
        }
      } else {
        setDisplayValue("");
      }
    }, [value, allowZero]);

    const formatNumber = (num: number): string => {
      if (num === 0) return allowZero ? "0" : "";
      return new Intl.NumberFormat("vi-VN").format(num);
    };

    const parseNumber = (str: string): number => {
      // Loại bỏ tất cả dấu phẩy, dấu chấm, khoảng trắng và suffix
      const cleaned = str.replace(/[,.\s]/g, "").replace(/vnd|đ/gi, "").trim();
      if (cleaned === "") return 0;
      const parsed = parseInt(cleaned, 10);
      return isNaN(parsed) ? 0 : parsed;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const cursorPos = e.target.selectionStart || 0;
      
      // Cho phép xóa hết
      if (inputValue === "") {
        setDisplayValue("");
        onChange?.(0);
        // Gọi onChange của react-hook-form nếu có
        if (reactHookFormOnChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: String(0) },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          reactHookFormOnChange(syntheticEvent);
        }
        return;
      }

      // Loại bỏ tất cả ký tự không phải số
      const cleaned = inputValue.replace(/\D/g, "");
      
      if (cleaned === "") {
        setDisplayValue("");
        onChange?.(0);
        // Gọi onChange của react-hook-form nếu có
        if (reactHookFormOnChange) {
          const syntheticEvent = {
            ...e,
            target: { ...e.target, value: String(0) },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          reactHookFormOnChange(syntheticEvent);
        }
        return;
      }
      
      // Parse số từ input
      const numValue = parseNumber(cleaned);
      
      // Format ngay khi nhập (mặc định)
      if (!formatOnBlur) {
        const formatted = formatNumber(numValue);
        setDisplayValue(formatted);
        
        // Giữ vị trí cursor sau khi format
        setTimeout(() => {
          if (inputRef.current) {
            // Đếm số ký tự số trước vị trí cursor cũ
            const beforeCursor = inputValue.substring(0, cursorPos);
            const digitsBefore = beforeCursor.replace(/\D/g, "").length;
            
            // Tìm vị trí cursor mới trong chuỗi đã format
            let newCursorPos = 0;
            let digitCount = 0;
            for (let i = 0; i < formatted.length; i++) {
              if (/\d/.test(formatted[i])) {
                digitCount++;
                if (digitCount >= digitsBefore) {
                  newCursorPos = i + 1;
                  break;
                }
              }
              newCursorPos = i + 1;
            }
            
            inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      } else {
        // Nếu formatOnBlur = true, chỉ hiển thị số thô khi đang nhập
        setDisplayValue(cleaned);
      }
      
      // Gọi onChange callback với số (nếu có)
      onChange?.(numValue);
      
      // Gọi onChange của react-hook-form với giá trị số
      if (reactHookFormOnChange) {
        const syntheticEvent = {
          ...e,
          target: { ...e.target, value: String(numValue) },
        } as unknown as React.ChangeEvent<HTMLInputElement>;
        reactHookFormOnChange(syntheticEvent);
      }
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
      <div className="relative">
        <Input
          ref={(node) => {
            inputRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
          }}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onBlur={handleBlur}
          className={cn(className, suffix && "pr-12")}
          placeholder={props.placeholder || "0"}
          {...props}
          onChange={handleChange}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);
NumberInput.displayName = "NumberInput";

export { NumberInput };

