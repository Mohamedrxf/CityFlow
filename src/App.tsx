import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import DriverDashboard from "./pages/DriverDashboard";
import CityFlowDashboard from "./pages/CityFlowDashboard";

// Optional page imports kept if you still want standalone access
import RouteOptimization from "./pages/RouteOptimization";
import EmergencyPriority from "./pages/EmergencyPriority";
import PredictionInsights from "./pages/PredictionInsights";
import SimulationMode from "./pages/SimulationMode";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <Routes>
        <Route path="/" element={<Navigate to="/command" replace />} />
        <Route path="/index" element={<Index />} />
        <Route path="/command" element={<CityFlowDashboard />} />
        <Route path="/driver" element={<DriverDashboard />} />

        {/* Optional direct routes */}
        <Route path="/route" element={<RouteOptimization />} />
        <Route path="/emergency" element={<EmergencyPriority />} />
        <Route path="/prediction" element={<PredictionInsights />} />
        <Route path="/simulation" element={<SimulationMode />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;