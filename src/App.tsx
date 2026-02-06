import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/config/query-client.config";
import { MainLayout } from "@/components/layouts/MainLayout";
import { LoginPage } from "@/feature/auth/LoginPage";
import { DashboardPage } from "@/feature/dashboard/DashboardPage";
import { ProductsPage } from "@/feature/products/ProductsPage";
import { CustomersPage } from "@/feature/customers/CustomersPage";
import { StockPage } from "@/feature/stock/StockPage";
import { CashPage } from "@/feature/cash/CashPage";
import { ReportsPage } from "@/feature/reports/ReportsPage";
import { DebtsPage } from "@/feature/debts/DebtsPage";
import { InvoicesPage } from "@/feature/invoices/InvoicesPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("authToken");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="cash" element={<CashPage />} />
            <Route path="debts" element={<DebtsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Routes>
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={3000}
          expand={true}
          toastOptions={{
            classNames: {
              toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
              description: "group-[.toast]:text-muted-foreground",
              actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
              cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
