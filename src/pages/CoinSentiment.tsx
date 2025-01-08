import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CoinSentimentView } from "@/components/coins/CoinSentimentView";

const CoinSentiment = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar />
        <main className="flex-1 p-4 md:p-8">
          <div className="container mx-auto max-w-7xl">
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Coin Sentiment Analysis</h1>
            <CoinSentimentView />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default CoinSentiment;