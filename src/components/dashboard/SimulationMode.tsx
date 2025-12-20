import { Play, Pause, AlertTriangle, CloudRain, Construction, Clock } from "lucide-react";
import { GlassCard } from "@/components/ui/status-card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

type Scenario = "accident" | "peak" | "closure" | null;

interface ScenarioOption {
  id: Scenario;
  label: string;
  description: string;
  icon: React.ElementType;
}

const scenarios: ScenarioOption[] = [
  { id: "accident", label: "Accident Ahead", description: "Major collision on Highway A1", icon: AlertTriangle },
  { id: "peak", label: "Peak Traffic", description: "Rush hour simulation", icon: Clock },
  { id: "closure", label: "Road Closure", description: "Construction on Main St.", icon: Construction },
];

export const SimulationMode = () => {
  const [isActive, setIsActive] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(null);

  const handleToggle = () => {
    setIsActive(!isActive);
    if (!isActive && !selectedScenario) {
      setSelectedScenario("accident");
    }
  };

  return (
    <GlassCard className={cn(
      "transition-all duration-300",
      isActive && "border-primary/30 glow-effect"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Simulation Mode</h3>
        </div>
        <Button
          variant={isActive ? "glow" : "outline"}
          size="sm"
          onClick={handleToggle}
        >
          {isActive ? (
            <>
              <Pause className="w-4 h-4" />
              Active
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Start
            </>
          )}
        </Button>
      </div>

      {isActive && (
        <div className="mb-4 p-2 rounded-lg bg-primary/10 border border-primary/20 text-center">
          <p className="text-xs text-primary font-medium">
            🧪 Hackathon Demo Mode Active
          </p>
          <p className="text-xs text-muted-foreground">Mock data simulation in progress</p>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Scenario Selector</p>
        {scenarios.map((scenario) => {
          const Icon = scenario.icon;
          const isSelected = selectedScenario === scenario.id;

          return (
            <button
              key={scenario.id}
              onClick={() => setSelectedScenario(scenario.id)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left",
                isSelected
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-secondary/30 border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                isSelected ? "bg-primary/20" : "bg-secondary"
              )}>
                <Icon className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{scenario.label}</p>
                <p className="text-xs text-muted-foreground">{scenario.description}</p>
              </div>
              {isSelected && isActive && (
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
};
