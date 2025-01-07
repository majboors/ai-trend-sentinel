import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CoinVolatileView } from "@/components/coins/CoinVolatileView";

export default function TradingVolatile() {
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="space-y-8">
            <h1 className="text-3xl font-bold">Volatile Trading</h1>
            <CoinVolatileView />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}