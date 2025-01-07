import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";

// Mock data - replace with real data later
const mockPredictions = [
  { id: 1, coin: "Bitcoin", symbol: "BTC", predictedPrice: 45000, currentPrice: 44000, status: "bought", setPrice: 43000, date: "2024-02-20" },
  { id: 2, coin: "Ethereum", symbol: "ETH", predictedPrice: 2800, currentPrice: 2900, status: "sold", setPrice: 3000, date: "2024-02-19" },
];

export default function PredictionsOverview() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredPredictions = mockPredictions.filter(prediction => {
    if (activeTab === "all") return true;
    return prediction.status === activeTab;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Predictions Overview</h1>
            
            <div className="grid gap-6">
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
                <div className="h-[300px]">
                  <PerformanceChart />
                </div>
              </Card>

              <Card className="p-6">
                <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Predictions</TabsTrigger>
                    <TabsTrigger value="bought">Bought</TabsTrigger>
                    <TabsTrigger value="sold">Sold</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Coin</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Predicted Price</TableHead>
                          <TableHead>Current Price</TableHead>
                          <TableHead>Set Price</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPredictions.map((prediction) => (
                          <TableRow key={prediction.id}>
                            <TableCell>{prediction.coin}</TableCell>
                            <TableCell>{prediction.symbol}</TableCell>
                            <TableCell>${prediction.predictedPrice.toLocaleString()}</TableCell>
                            <TableCell>${prediction.currentPrice.toLocaleString()}</TableCell>
                            <TableCell>${prediction.setPrice.toLocaleString()}</TableCell>
                            <TableCell className="capitalize">{prediction.status}</TableCell>
                            <TableCell>{prediction.date}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}