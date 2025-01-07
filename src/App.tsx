import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AllCoins from "./pages/AllCoins";
import SingleCoin from "./pages/SingleCoin";

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-4">
    <h1 className="text-2xl font-bold mb-4">{title}</h1>
    <p>This page is under construction.</p>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/coins" element={<AllCoins />} />
          <Route path="/coins/:id" element={<SingleCoin />} />
          <Route
            path="/predictions/profits"
            element={<PlaceholderPage title="Profits Predictions" />}
          />
          <Route
            path="/predictions/losses"
            element={<PlaceholderPage title="Losses Predictions" />}
          />
          <Route
            path="/predictions/settings"
            element={<PlaceholderPage title="Prediction Settings" />}
          />
          <Route
            path="/trading/bought"
            element={<PlaceholderPage title="Bought Items" />}
          />
          <Route
            path="/trading/sold"
            element={<PlaceholderPage title="Sold Items" />}
          />
          <Route
            path="/assets"
            element={<PlaceholderPage title="Assets" />}
          />
          <Route
            path="/spent-profits"
            element={<PlaceholderPage title="Spent & Profits" />}
          />
          <Route
            path="/leverage"
            element={<PlaceholderPage title="Leverage" />}
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;