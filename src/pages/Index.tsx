import { useState } from "react";
import { TopNavigation } from "@/components/dashboard/TopNavigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { AmbulanceRouteOptimization } from "@/components/dashboard/AmbulanceRouteOptimization";
import { Footer } from "@/components/dashboard/Footer";

const Index = () => {
  const [activeSection, setActiveSection] = useState("route");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <TopNavigation />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar activeItem={activeSection} onItemClick={setActiveSection} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6">
          <AmbulanceRouteOptimization />
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
