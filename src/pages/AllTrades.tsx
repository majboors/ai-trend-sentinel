import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Bell, BellOff } from "lucide-react";
import { format } from "date-fns";

interface Trade {
  id: string;
  symbol: string;
  entry_price: number;
  created_at: string;
  type: string;
  status: string;
  has_notifications: boolean;
}

export default function AllTrades() {
  const navigate = useNavigate();

  const { data: trades, isLoading } = useQuery({
    queryKey: ["all-trades"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { data: tradeViews, error: tradeViewsError } = await supabase
        .from("trade_views")
        .select("*")
        .eq("user_id", session.user.id);

      if (tradeViewsError) throw tradeViewsError;

      // Get notifications for all trade views
      const { data: notifications, error: notificationsError } = await supabase
        .from("trade_notifications")
        .select("trade_view_id")
        .eq("user_id", session.user.id);

      if (notificationsError) throw notificationsError;

      // Create a Set of trade view IDs that have notifications
      const tradeViewsWithNotifications = new Set(
        notifications?.map(n => n.trade_view_id) || []
      );

      // Map trade views to include notification status
      return tradeViews?.map(trade => ({
        id: trade.id,
        symbol: trade.name,
        entry_price: 0, // This would need to be calculated from actual trade data
        created_at: trade.created_at,
        type: "Trade View",
        status: trade.status,
        has_notifications: tradeViewsWithNotifications.has(trade.id)
      })) || [];
    }
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>All Trades</CardTitle>
                <CardDescription>
                  View all your trades and their notification settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p>Loading trades...</p>
                ) : trades && trades.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Notifications</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trades.map((trade) => (
                        <TableRow
                          key={trade.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/trading/bought?view=${trade.id}`)}
                        >
                          <TableCell>{trade.symbol}</TableCell>
                          <TableCell>{trade.type}</TableCell>
                          <TableCell>{trade.status}</TableCell>
                          <TableCell>
                            {format(new Date(trade.created_at), "PPp")}
                          </TableCell>
                          <TableCell>
                            {trade.has_notifications ? (
                              <Bell className="h-4 w-4 text-green-500" />
                            ) : (
                              <BellOff className="h-4 w-4 text-gray-500" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground">No trades found</p>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}