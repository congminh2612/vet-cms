import { useQuery } from "@tanstack/react-query";
import { invoicesService } from "@/services/invoices.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Printer } from "lucide-react";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
import type { Invoice } from "@/types/api.types";

interface InvoiceDetailProps {
  invoice: Invoice;
  onPrint: () => void;
}

export function InvoiceDetail({ invoice, onPrint }: InvoiceDetailProps) {
  const { data: detailData, isLoading } = useQuery({
    queryKey: ["invoice", invoice.id],
    queryFn: () => invoicesService.getById(invoice.id),
  });

  // Merge: list data (invoice) làm base, detail data override (có items)
  const invoiceData: Invoice = detailData
    ? { ...invoice, ...detailData }
    : invoice;

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  if (!invoiceData) {
    return <div>Không tìm thấy hóa đơn</div>;
  }

  return (
    <div className="space-y-4">
      {/* Invoice Info */}
      <Card>
        <CardHeader>
          <CardTitle>Thông tin hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Mã hóa đơn</p>
              <p className="font-semibold">
                #{invoiceData.id}
                {invoiceData.invoiceNumber && ` - ${invoiceData.invoiceNumber}`}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ngày tạo</p>
              <p className="font-semibold">
                {invoiceData.createdAt
                  ? new Date(invoiceData.createdAt).toLocaleString("vi-VN")
                  : "N/A"}
              </p>
            </div>
            {invoiceData.customer && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Khách hàng</p>
                  <p className="font-semibold">{invoiceData.customer.name}</p>
                </div>
                {invoiceData.customer.phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Số điện thoại</p>
                    <p className="font-semibold">
                      {invoiceData.customer.phone}
                    </p>
                  </div>
                )}
                {invoiceData.customer.address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-semibold">
                      {invoiceData.customer.address}
                    </p>
                  </div>
                )}
              </>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Trạng thái</p>
              {invoiceData.hasDebt ? (
                <Badge variant="destructive">Có nợ</Badge>
              ) : (
                <Badge variant="default">Đã thanh toán</Badge>
              )}
            </div>
          </div>
          {invoiceData.note && (
            <div>
              <p className="text-sm text-muted-foreground">Ghi chú</p>
              <p>{invoiceData.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Sản phẩm</CardTitle>
        </CardHeader>
        <CardContent>
          {invoiceData.items && invoiceData.items.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>STT</TableHead>
                    <TableHead>Sản phẩm</TableHead>
                    <TableHead>Số lượng</TableHead>
                    <TableHead>Đơn giá</TableHead>
                    <TableHead className="text-right">Thành tiền</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoiceData.items.map((item, index) => (
                    <TableRow key={item.id || index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {item.product?.name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {item.quantity} {item.product?.unit || ""}
                      </TableCell>
                      <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-muted-foreground">Không có sản phẩm</p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng kết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng tiền:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(invoiceData.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Đã trả:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(
                  invoiceData.amountReceived ?? invoiceData.paidAmount ?? invoiceData.totalAmount
                )}
              </span>
            </div>
            {invoiceData.hasDebt && parseNumber(invoiceData.remainingDebt) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Còn nợ:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(invoiceData.remainingDebt)}
                </span>
              </div>
            )}
            {/* Fallback: nếu có debt object (từ getById) */}
            {invoiceData.hasDebt && invoiceData.debt && !invoiceData.remainingDebt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Còn nợ:</span>
                <span className="font-semibold text-red-600">
                  {formatCurrency(invoiceData.debt.remainingAmount)}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debt Info */}
      {invoiceData.hasDebt && (
        <Card>
          <CardHeader>
            <CardTitle>Thông tin công nợ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invoiceData.debt ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng nợ:</span>
                    <span className="font-semibold">
                      {formatCurrency(invoiceData.debt.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Đã trả:</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(invoiceData.debt.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Còn lại:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(invoiceData.debt.remainingAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge
                      variant={
                        invoiceData.debt.status === "PAID"
                          ? "default"
                          : invoiceData.debt.status === "PARTIAL"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {invoiceData.debt.status === "PAID"
                        ? "Đã trả đủ"
                        : invoiceData.debt.status === "PARTIAL"
                          ? "Trả một phần"
                          : "Chưa trả"}
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Còn nợ:</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(invoiceData.remainingDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Trạng thái:</span>
                    <Badge
                      variant={
                        invoiceData.debtStatus === "PAID"
                          ? "default"
                          : invoiceData.debtStatus === "PARTIAL"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {invoiceData.debtStatus === "PAID"
                        ? "Đã trả đủ"
                        : invoiceData.debtStatus === "PARTIAL"
                          ? "Trả một phần"
                          : "Chưa trả"}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        <Button onClick={onPrint}>
          <Printer className="mr-2 h-4 w-4" />
          In hóa đơn
        </Button>
      </div>
    </div>
  );
}

