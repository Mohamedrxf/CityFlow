import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CityFlowDashboard from "./pages/CityFlowDashboard";

// ✅ Newly added pages
import RouteOptimization from "./pages/RouteOptimization";
import EmergencyPriority from "./pages/EmergencyPriority";
import PredictionInsights from "./pages/PredictionInsights";
import SimulationMode from "./pages/SimulationMode";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Settings from "./pages/Settings";

// import BackgroundVideo from "./components/BackgroundVideo"; // optional

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      {/* Background Video (optional) */}
      {/* <BackgroundVideo /> */}

      <BrowserRouter>
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<CityFlowDashboard />} />

          {/* Optional Home */}
          <Route path="/home" element={<Index />} />

          {/* ✅ Sidebar Pages */}
          <Route path="/route" element={<RouteOptimization />} />
          <Route path="/emergency" element={<EmergencyPriority />} />
          <Route path="/prediction" element={<PredictionInsights />} />
          <Route path="/simulation" element={<SimulationMode />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/settings" element={<Settings />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;