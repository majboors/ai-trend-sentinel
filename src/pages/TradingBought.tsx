import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TradingSuggestions } from "@/components/trading/TradingSuggestions";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function TradingBought() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6">
            <h1 className="text-2xl font-bold mb-6">Trading Suggestions - Bought</h1>
            <TradingSuggestions />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}