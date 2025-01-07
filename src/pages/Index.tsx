import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { ProfitLossCard } from "@/components/dashboard/ProfitLossCard";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { MarketSentiment } from "@/components/dashboard/MarketSentiment";
import { WhalesActivity } from "@/components/dashboard/WhalesActivity";

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <div className="flex items-center justify-between mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
              <SidebarTrigger className="md:hidden" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <ProfitLossCard
                title="Total Profit/Loss"
                value={5000}
                percentage={12.5}
              />
              <ProfitLossCard
                title="Today's Change"
                value={-250}
                percentage={-2.3}
              />
              <ProfitLossCard
                title="Weekly Profit"
                value={1200}
                percentage={5.7}
              />
              <ProfitLossCard
                title="Monthly Profit"
                value={8500}
                percentage={15.2}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="lg:col-span-2">
                <PerformanceChart />
              </div>
              <div>
                <MarketSentiment />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <WhalesActivity />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;