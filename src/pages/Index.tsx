import { useState } from "react";
import { TopNavigation } from "@/components/dashboard/TopNavigation";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { CameraCard } from "@/components/dashboard/CameraCard";
import { Footer } from "@/components/dashboard/Footer";

const Index = () => {
  const [activeSection, setActiveSection] = useState("traffic");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cameraImages, setCameraImages] = useState<{
    North: File | null;
    South: File | null;
    East: File | null;
    West: File | null;
  }>({
    North: null,
    South: null,
    East: null,
    West: null,
  });

  const handleImageChange = (direction: "North" | "South" | "East" | "West", file: File | null) => {
    setCameraImages((prev) => ({
      ...prev,
      [direction]: file,
    }));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <TopNavigation 
        sidebarCollapsed={sidebarCollapsed} 
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <DashboardSidebar 
          activeItem={activeSection} 
          onItemClick={setActiveSection}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Live Traffic Monitoring
              </h1>
              <p className="text-sm md:text-base text-muted-foreground">
                Upload CCTV feeds from all four directions to monitor intersection traffic
              </p>
            </div>

            {/* Camera Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="animate-fade-in" style={{ animationDelay: "0ms" }}>
                <CameraCard
                  direction="North"
                  onImageChange={(file) => handleImageChange("North", file)}
                />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "100ms" }}>
                <CameraCard
                  direction="South"
                  onImageChange={(file) => handleImageChange("South", file)}
                />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "200ms" }}>
                <CameraCard
                  direction="East"
                  onImageChange={(file) => handleImageChange("East", file)}
                />
              </div>
              <div className="animate-fade-in" style={{ animationDelay: "300ms" }}>
                <CameraCard
                  direction="West"
                  onImageChange={(file) => handleImageChange("West", file)}
                />
              </div>
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
