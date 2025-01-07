import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { TradingSuggestions } from "@/components/trading/TradingSuggestions";

export default function TradingSold() {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6">
          <h1 className="text-2xl font-bold mb-6">Trading Suggestions - Sold</h1>
          <TradingSuggestions />
        </div>
      </main>
    </div>
  );
}