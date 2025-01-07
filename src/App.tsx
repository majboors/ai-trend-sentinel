import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Assets from "./pages/Assets";
import AssetsDetailed from "./pages/AssetsDetailed";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/assets-detailed" element={<AssetsDetailed />} />
      </Routes>
    </Router>
  );
}

export default App;
