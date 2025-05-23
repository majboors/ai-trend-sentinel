import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CoinFolderView } from "@/components/coins/CoinFolderView";
import { CoinSplitView } from "@/components/coins/CoinSplitView";
import { CoinSentimentView } from "@/components/coins/CoinSentimentView";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Split, BarChart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const AllCoins = () => {
  const [viewMode, setViewMode] = useState<"folder" | "split" | "sentiment">("folder");
  const [searchParams] = useSearchParams();
  const filter = searchParams.get("filter");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">
                {filter ? `${filter.charAt(0).toUpperCase() + filter.slice(1)} Coins` : "All Coins"}
              </h1>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "folder" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("folder")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "split" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("split")}
                >
                  <Split className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "sentiment" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("sentiment")}
                >
                  <BarChart className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Tabs value={viewMode} onValueChange={(value: "folder" | "split" | "sentiment") => setViewMode(value)}>
              <TabsList className="mb-4">
                <TabsTrigger value="folder">Folder View</TabsTrigger>
                <TabsTrigger value="split">Split View</TabsTrigger>
                <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="folder">
                <CoinFolderView filter={filter} />
              </TabsContent>
              
              <TabsContent value="split">
                <CoinSplitView filter={filter} />
              </TabsContent>
              
              <TabsContent value="sentiment">
                <CoinSentimentView />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AllCoins;