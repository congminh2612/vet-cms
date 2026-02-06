import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { invoicesService } from "@/services/invoices.service";
import { customersService } from "@/services/customers.service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { InvoiceDetail } from "./InvoiceDetail";
import { exportInvoicesToExcel } from "@/utils/excel-export";
import { formatCurrency, parseNumber } from "@/utils/number-utils";
import type { Invoice } from "@/types/api.types";

export function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [customerFilter, setCustomerFilter] = useState<number | "all">("all");
  const [hasDebtFilter, setHasDebtFilter] = useState<boolean | "all">("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "invoices",
      page,
      customerFilter,
      hasDebtFilter,
      startDate,
      endDate,
    ],
    queryFn: () =>
      invoicesService.getAll({
        page,
        limit,
        customerId:
          customerFilter !== "all" ? customerFilter : undefined,
        hasDebt:
          hasDebtFilter !== "all" ? hasDebtFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  const { data: customersData } = useQuery({
    queryKey: ["customers", "all"],
    queryFn: () => customersService.getAll({ page: 1, limit: 1000 }),
  });

  const handleViewDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setOpenDetail(true);
  };

  const handlePrint = async (invoice: Invoice) => {
    try {
      // Lấy chi tiết hóa đơn (có items), merge với data từ list
      let invoiceData: Invoice = { ...invoice };
      try {
        const detailData = await invoicesService.getById(invoice.id);
        // Merge: list data làm base, detail data override (có items)
        invoiceData = { ...invoice, ...detailData };
      } catch {
        // Giữ nguyên data từ list nếu getById lỗi
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Không thể mở cửa sổ in");
        return;
      }

      // Tính tổng tiền - ưu tiên lấy từ invoiceData, fallback sang invoice gốc
      const totalAmount = parseNumber(invoiceData.totalAmount || invoice.totalAmount);
      const amountReceived = parseNumber(
        invoiceData.amountReceived ?? invoiceData.paidAmount ?? invoice.amountReceived ?? invoice.totalAmount
      );
      const remainingDebt = parseNumber(invoiceData.remainingDebt ?? invoice.remainingDebt);

      // Format ngày
      const dateStr = invoiceData.createdAt
        ? new Date(invoiceData.createdAt).toLocaleString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "N/A";

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Hóa đơn #${invoiceData.id}</title>
            <style>
              body {
                font-family: 'Nunito', Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .invoice-info {
                margin-bottom: 20px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              .total {
                text-align: right;
                font-weight: bold;
                font-size: 1.1em;
                margin-bottom: 10px;
              }
              .total p {
                margin: 4px 0;
              }
              .total .grand-total {
                font-size: 1.2em;
                border-top: 2px solid #333;
                padding-top: 8px;
                margin-top: 8px;
              }
              .debt-info {
                color: #d32f2f;
              }
              .paid-info {
                color: #2e7d32;
              }
              .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 0.9em;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>HÓA ĐƠN BÁN HÀNG</h1>
              <p>Số hóa đơn: #${invoiceData.id}${invoiceData.invoiceNumber ? ` - ${invoiceData.invoiceNumber}` : ""}</p>
            </div>
            <div class="invoice-info">
              <p><strong>Ngày:</strong> ${dateStr}</p>
              ${invoiceData.customer ? `<p><strong>Khách hàng:</strong> ${invoiceData.customer.name}</p>` : ""}
              ${invoiceData.customer?.phone ? `<p><strong>SĐT:</strong> ${invoiceData.customer.phone}</p>` : ""}
              ${invoiceData.customer?.address ? `<p><strong>Địa chỉ:</strong> ${invoiceData.customer.address}</p>` : ""}
            </div>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Sản phẩm</th>
                  <th>Số lượng</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${invoiceData.items?.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.product?.name || "N/A"}</td>
                    <td>${item.quantity} ${item.product?.unit || ""}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join("") || "<tr><td colspan='5'>Không có sản phẩm</td></tr>"}
              </tbody>
            </table>
            <div class="total">
              <p class="grand-total">Tổng tiền: ${formatCurrency(totalAmount)}</p>
              <p class="paid-info">Đã trả: ${formatCurrency(amountReceived)}</p>
              ${invoiceData.hasDebt && remainingDebt > 0 ? `<p class="debt-info">Còn nợ: ${formatCurrency(remainingDebt)}</p>` : ""}
            </div>
            ${invoiceData.note ? `<p><strong>Ghi chú:</strong> ${invoiceData.note}</p>` : ""}
            <div class="footer">
              <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } catch {
      toast.error("Có lỗi xảy ra khi in hóa đơn");
    }
  };

  const handleExportExcel = () => {
    if (!data?.data) {
      toast.error("Không có dữ liệu để xuất");
      return;
    }
    exportInvoicesToExcel(data.data);
    toast.success("Xuất Excel thành công");
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hóa đơn</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              Có lỗi xảy ra khi tải dữ liệu hóa đơn
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hóa đơn</h1>
          <p className="text-muted-foreground">
            Quản lý hóa đơn bán hàng
          </p>
        </div>
        {data && data.data.length > 0 && (
          <Button onClick={handleExportExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={
                customerFilter === "all"
                  ? "all"
                  : customerFilter.toString()
              }
              onValueChange={(value) =>
                setCustomerFilter(value === "all" ? "all" : parseInt(value))
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khách hàng</SelectItem>
                {customersData?.data.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={hasDebtFilter === "all" ? "all" : hasDebtFilter.toString()}
              onValueChange={(value) =>
                setHasDebtFilter(
                  value === "all" ? "all" : value === "true"
                )
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Có nợ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Có nợ</SelectItem>
                <SelectItem value="false">Không nợ</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Từ ngày"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-[200px]"
            />
            <Input
              type="date"
              placeholder="Đến ngày"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Đang tải...</div>
          ) : !data || data.data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có hóa đơn nào
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã HĐ</TableHead>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Tổng tiền</TableHead>
                      <TableHead>Đã trả</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.data.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          #{invoice.id}
                          {invoice.invoiceNumber && ` - ${invoice.invoiceNumber}`}
                        </TableCell>
                        <TableCell>
                          {invoice.customer?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(invoice.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(
                            invoice.amountReceived ?? invoice.paidAmount ?? invoice.totalAmount
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.hasDebt ? (
                            <Badge variant="destructive">Có nợ</Badge>
                          ) : (
                            <Badge variant="default">Đã thanh toán</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {invoice.createdAt
                            ? new Date(invoice.createdAt).toLocaleDateString(
                                "vi-VN",
                                {
                                  year: "numeric",
                                  month: "2-digit",
                                  day: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetail(invoice)}
                            >
                              <FileText className="h-4 w-4 mr-1" />
                              Xem
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePrint(invoice)}
                            >
                              <Printer className="h-4 w-4 mr-1" />
                              In
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {data.page} / {data.totalPages} ({data.total} hóa đơn)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={openDetail} onOpenChange={setOpenDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn</DialogTitle>
            <DialogDescription>
              Hóa đơn #{selectedInvoice?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <InvoiceDetail
              invoice={selectedInvoice}
              onPrint={() => handlePrint(selectedInvoice)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

