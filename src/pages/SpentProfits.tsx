import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Trade {
  id: number;
  symbol: string;
  price: string;
  qty: string;
  commission: string;
  commissionAsset: string;
  time: number;
  isBuyer: boolean;
  profit: number;
}

export default function SpentProfits() {
  const { toast } = useToast();
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);

  const { data: trades, isLoading, error } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-binance-trades");
      if (error) throw error;
      return data as Trade[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (error) {
    toast({
      title: "Error fetching trades",
      description: error.message,
      variant: "destructive",
    });
  }

  const calculateTotalProfit = (trades: Trade[]) => {
    return trades.reduce((total, trade) => total + trade.profit, 0);
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-6">Spent & Profits</h1>

            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
              </div>
            ) : trades && trades.length > 0 ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Profit/Loss</CardTitle>
                    <CardDescription>
                      Cumulative profit/loss across all trades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-2xl font-bold ${
                      calculateTotalProfit(trades) >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {calculateTotalProfit(trades).toFixed(8)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Trade History</CardTitle>
                    <CardDescription>
                      Detailed history of all your trades
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible>
                      {trades.map((trade) => (
                        <AccordionItem key={trade.id} value={trade.id.toString()}>
                          <AccordionTrigger className="px-4">
                            <div className="grid grid-cols-4 w-full text-left">
                              <span>{trade.symbol}</span>
                              <span>{format(trade.time, "yyyy-MM-dd HH:mm:ss")}</span>
                              <span>{trade.isBuyer ? "BUY" : "SELL"}</span>
                              <span className={trade.profit >= 0 ? "text-green-500" : "text-red-500"}>
                                {trade.profit.toFixed(8)}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Price</p>
                                  <p>{trade.price}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Quantity</p>
                                  <p>{trade.qty}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Commission</p>
                                  <p>{`${trade.commission} ${trade.commissionAsset}`}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Total Value</p>
                                  <p>{(parseFloat(trade.price) * parseFloat(trade.qty)).toFixed(8)}</p>
                                </div>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No trades found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}