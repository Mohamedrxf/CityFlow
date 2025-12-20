import { useEffect, useRef } from "react";
import { MapPin, Navigation, AlertTriangle, Ambulance, Bus, Truck } from "lucide-react";

interface VehicleMarker {
  id: string;
  type: "ambulance" | "bus" | "truck";
  x: number;
  y: number;
  label: string;
  status: "active" | "delayed" | "emergency";
}

const vehicles: VehicleMarker[] = [
  { id: "v1", type: "ambulance", x: 35, y: 25, label: "AMB-101", status: "emergency" },
  { id: "v2", type: "ambulance", x: 68, y: 60, label: "AMB-203", status: "active" },
  { id: "v3", type: "bus", x: 45, y: 55, label: "BUS-42", status: "active" },
  { id: "v4", type: "bus", x: 22, y: 72, label: "BUS-17", status: "delayed" },
  { id: "v5", type: "truck", x: 78, y: 35, label: "LOG-88", status: "active" },
  { id: "v6", type: "truck", x: 55, y: 80, label: "LOG-22", status: "delayed" },
];

const congestionZones = [
  { x: 40, y: 40, width: 15, height: 10, level: "high" },
  { x: 60, y: 55, width: 12, height: 8, level: "medium" },
  { x: 25, y: 65, width: 10, height: 12, level: "low" },
];

export const CityMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame: number;
    let dashOffset = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear
      ctx.fillStyle = "hsl(222, 47%, 7%)";
      ctx.fillRect(0, 0, width, height);

      // Grid pattern
      ctx.strokeStyle = "hsl(222, 30%, 12%)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw congestion zones
      congestionZones.forEach((zone) => {
        const colors: Record<string, string> = {
          high: "hsla(0, 72%, 51%, 0.2)",
          medium: "hsla(45, 93%, 47%, 0.15)",
          low: "hsla(142, 71%, 45%, 0.1)",
        };
        ctx.fillStyle = colors[zone.level];
        ctx.fillRect(
          (zone.x / 100) * width,
          (zone.y / 100) * height,
          (zone.width / 100) * width,
          (zone.height / 100) * height
        );
      });

      // Draw main roads
      const drawRoad = (path: number[][], color: string, animated: boolean) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        if (animated) {
          ctx.setLineDash([10, 10]);
          ctx.lineDashOffset = dashOffset;
        } else {
          ctx.setLineDash([]);
        }

        ctx.beginPath();
        path.forEach(([x, y], i) => {
          const px = (x / 100) * width;
          const py = (y / 100) * height;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      };

      // Main routes (optimized - blue)
      drawRoad(
        [[10, 20], [30, 20], [45, 35], [65, 35], [80, 50], [90, 50]],
        "hsl(199, 89%, 48%)",
        true
      );
      drawRoad(
        [[15, 80], [30, 65], [50, 55], [70, 45], [85, 30]],
        "hsl(199, 89%, 60%)",
        true
      );

      // Congested routes (red/orange)
      drawRoad(
        [[35, 30], [45, 40], [55, 45]],
        "hsl(0, 72%, 51%)",
        false
      );
      drawRoad(
        [[60, 50], [70, 60], [75, 70]],
        "hsl(45, 93%, 47%)",
        false
      );

      dashOffset -= 0.5;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "ambulance":
        return Ambulance;
      case "bus":
        return Bus;
      case "truck":
        return Truck;
      default:
        return Navigation;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "emergency":
        return "text-emergency animate-blink";
      case "delayed":
        return "text-warning";
      default:
        return "text-success";
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={800}
        height={500}
      />
      
      {/* Vehicle markers */}
      {vehicles.map((vehicle) => {
        const Icon = getVehicleIcon(vehicle.type);
        return (
          <div
            key={vehicle.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
            style={{ left: `${vehicle.x}%`, top: `${vehicle.y}%` }}
          >
            <div
              className={`p-2 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg transition-transform hover:scale-110 ${
                vehicle.status === "emergency" ? "animate-pulse" : ""
              }`}
            >
              <Icon className={`w-4 h-4 ${getStatusColor(vehicle.status)}`} />
            </div>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover rounded-md text-xs font-medium text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-border shadow-lg">
              <div>{vehicle.label}</div>
              <div className="text-muted-foreground capitalize">{vehicle.status}</div>
            </div>
          </div>
        );
      })}

      {/* Congestion indicators */}
      <div className="absolute top-3 left-3 flex items-center gap-4 bg-card/80 backdrop-blur px-3 py-2 rounded-lg border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emergency" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-xs text-muted-foreground">Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-xs text-muted-foreground">Low</span>
        </div>
      </div>

      {/* Live indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-2 bg-card/80 backdrop-blur px-3 py-1.5 rounded-full border border-border">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emergency opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emergency" />
        </span>
        <span className="text-xs font-medium text-foreground">LIVE</span>
      </div>
    </div>
  );
};
