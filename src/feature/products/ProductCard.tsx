import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Package } from "lucide-react";
import type { Product } from "@/types/api.types";

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
  formatCurrency: (amount: number | undefined | null) => string;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  formatCurrency,
}: ProductCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <h3 className="font-semibold text-base truncate">
                {product.name}
              </h3>
            </div>
            
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Đơn vị:</span>
                <span className="font-medium">{product.unit}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giá nhập:</span>
                <span className="font-medium">
                  {formatCurrency(product.costPrice)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Giá bán:</span>
                <span className="font-medium text-primary">
                  {formatCurrency(product.sellPrice)}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-1 border-t">
                <span className="text-muted-foreground">Tồn kho:</span>
                <span
                  className={`font-semibold ${
                    product.stock < 10
                      ? "text-destructive"
                      : "text-green-600"
                  }`}
                >
                  {product.stock} {product.unit}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(product)}
              className="h-9 w-9"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(product.id)}
              className="h-9 w-9 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

