import { Gauge } from "lucide-react";

interface SpeedDisplayProps {
  speed: number;
  isMonitoring: boolean;
}

export const SpeedDisplay = ({ speed, isMonitoring }: SpeedDisplayProps) => {
  return (
    <div className="relative flex flex-col items-center justify-center py-8">
      {/* Pulse animation when monitoring */}
      {isMonitoring && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-48 rounded-full bg-accent/20 animate-pulse-ring" />
        </div>
      )}
      
      {/* Speed gauge icon */}
      <div className="relative mb-4">
        <Gauge 
          className={`h-16 w-16 transition-colors ${
            isMonitoring ? 'text-accent' : 'text-muted-foreground'
          }`}
        />
      </div>

      {/* Speed value */}
      <div className="text-center">
        <div className="text-7xl font-bold tracking-tight">
          {Math.round(speed)}
        </div>
        <div className="text-xl text-muted-foreground mt-2">km/h</div>
      </div>

      {/* Status indicator */}
      <div className="mt-6">
        {isMonitoring ? (
          <div className="flex items-center gap-2 text-accent">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium">Monitoring Active</span>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Tap Start to begin monitoring
          </div>
        )}
      </div>
    </div>
  );
};
