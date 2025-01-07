import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Index } from "@/pages/Index";
import { AllCoins } from "@/pages/AllCoins";
import { SingleCoin } from "@/pages/SingleCoin";
import { PredictionsOverview } from "@/pages/PredictionsOverview";
import { ProfitPredictions } from "@/pages/ProfitPredictions";
import { LossPredictions } from "@/pages/LossPredictions";
import { PredictionSettings } from "@/pages/PredictionSettings";
import { TradingBought } from "@/pages/TradingBought";
import { TradingSold } from "@/pages/TradingSold";
import { TradingVolatile } from "@/pages/TradingVolatile";
import { Assets } from "@/pages/Assets";
import { SpentProfits } from "@/pages/SpentProfits";
import { Leverage } from "@/pages/Leverage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/coins" element={<AllCoins />} />
        <Route path="/coins/:symbol" element={<SingleCoin />} />
        <Route path="/predictions" element={<PredictionsOverview />} />
        <Route path="/predictions/profits" element={<ProfitPredictions />} />
        <Route path="/predictions/losses" element={<LossPredictions />} />
        <Route path="/predictions/settings" element={<PredictionSettings />} />
        <Route path="/trading/bought" element={<TradingBought />} />
        <Route path="/trading/sold" element={<TradingSold />} />
        <Route path="/trading/volatile" element={<TradingVolatile />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/spent-profits" element={<SpentProfits />} />
        <Route path="/leverage" element={<Leverage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

export default App;