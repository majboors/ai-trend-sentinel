import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AllCoins from "./pages/AllCoins";
import SingleCoin from "./pages/SingleCoin";
import ProfitPredictions from "./pages/ProfitPredictions";
import LossPredictions from "./pages/LossPredictions";
import PredictionSettings from "./pages/PredictionSettings";
import PredictionsOverview from "./pages/PredictionsOverview";
import TradingBought from "./pages/TradingBought";
import TradingSold from "./pages/TradingSold";
import Assets from "./pages/Assets";
import Leverage from "./pages/Leverage";
import SpentProfits from "./pages/SpentProfits";

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
          <Route path="/predictions" element={<PredictionsOverview />} />
          <Route path="/predictions/profits" element={<ProfitPredictions />} />
          <Route path="/predictions/losses" element={<LossPredictions />} />
          <Route path="/predictions/settings" element={<PredictionSettings />} />
          <Route path="/trading/bought" element={<TradingBought />} />
          <Route path="/trading/sold" element={<TradingSold />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/spent-profits" element={<SpentProfits />} />
          <Route path="/leverage" element={<Leverage />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;