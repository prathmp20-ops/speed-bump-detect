import { useSpeedMonitoring } from "@/hooks/useSpeedMonitoring";
import { SpeedDisplay } from "@/components/SpeedDisplay";
import { ControlButtons } from "@/components/ControlButtons";
import { SpeedBumpList } from "@/components/SpeedBumpList";
import SpeedBumpMap from "@/components/SpeedBumpMap";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const {
    isMonitoring,
    currentSpeed,
    speedBumps,
    startMonitoring,
    stopMonitoring,
    clearHistory,
  } = useSpeedMonitoring();

  const { toast } = useToast();

  const handleStart = async () => {
    await startMonitoring();
    toast({
      title: "Monitoring started",
      description: "GPS tracking is now active. Drive safely!",
    });
  };

  const handleStop = async () => {
    await stopMonitoring();
    toast({
      title: "Monitoring stopped",
      description: "GPS tracking has been paused.",
    });
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear all logged speed bumps?')) {
      clearHistory();
      toast({
        title: "History cleared",
        description: "All speed bump logs have been removed.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-6">
      {/* Header */}
      <header className="pt-8 pb-4 px-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Speed Bump Logger
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Automatic detection and GPS logging
        </p>
      </header>

      {/* Speed Display */}
      <SpeedDisplay speed={currentSpeed} isMonitoring={isMonitoring} />

      {/* Control Buttons */}
      <div className="py-6">
        <ControlButtons
          isMonitoring={isMonitoring}
          onStart={handleStart}
          onStop={handleStop}
        />
      </div>

      {/* Separator */}
      <Separator className="my-6" />

      {/* Map */}
      <div className="px-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Community Map</h2>
        <SpeedBumpMap 
          bumps={speedBumps} 
          currentSpeed={currentSpeed}
          isMonitoring={isMonitoring}
        />
      </div>

      {/* Separator */}
      <Separator className="my-6" />

      {/* Speed Bump List */}
      <SpeedBumpList bumps={speedBumps} onClear={handleClear} />
    </div>
  );
};

export default Index;
