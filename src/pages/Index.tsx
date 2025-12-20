import { useState } from "react";
import { TopNavigation } from "@/components/dashboard/TopNavigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { CityMap } from "@/components/dashboard/CityMap";
import { TrafficIntelligence } from "@/components/dashboard/TrafficIntelligence";
import { PredictiveInsights } from "@/components/dashboard/PredictiveInsights";
import { RouteOptimization } from "@/components/dashboard/RouteOptimization";
import { SimulationMode } from "@/components/dashboard/SimulationMode";
import { Footer } from "@/components/dashboard/Footer";
import { GlassCard } from "@/components/ui/status-card";

const Index = () => {
  const [activeSection, setActiveSection] = useState("traffic");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <TopNavigation />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar activeItem={activeSection} onItemClick={setActiveSection} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            {/* Left Section - Map and Insights */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              {/* City Map */}
              <GlassCard className="h-[400px] lg:h-[450px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Live City Traffic Map</h2>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>6 vehicles tracked</span>
                    <span className="text-border">•</span>
                    <span>3 priority routes</span>
                  </div>
                </div>
                <div className="h-[calc(100%-40px)]">
                  <CityMap />
                </div>
              </GlassCard>

              {/* Predictive Insights */}
              <PredictiveInsights />

              {/* Simulation Mode */}
              <SimulationMode />
            </div>

            {/* Right Section - Panels */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Traffic Intelligence */}
              <TrafficIntelligence />

              {/* Route Optimization */}
              <RouteOptimization />
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
