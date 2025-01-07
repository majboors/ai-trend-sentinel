import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CoinFolderView } from "@/components/coins/CoinFolderView";
import { CoinSplitView } from "@/components/coins/CoinSplitView";
import { Button } from "@/components/ui/button";
import { LayoutGrid, Split } from "lucide-react";

const AllCoins = () => {
  const [viewMode, setViewMode] = useState<"folder" | "split">("folder");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">All Coins</h1>
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
              </div>
            </div>
            
            {viewMode === "folder" ? <CoinFolderView /> : <CoinSplitView />}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AllCoins;