import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Báo cáo</h1>
        <p className="text-muted-foreground">
          Xem các báo cáo và thống kê
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Báo cáo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Tính năng báo cáo đang được phát triển...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

