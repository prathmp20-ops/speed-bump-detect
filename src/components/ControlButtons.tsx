import { Button } from "@/components/ui/button";
import { PlayCircle, StopCircle } from "lucide-react";

interface ControlButtonsProps {
  isMonitoring: boolean;
  onStart: () => void;
  onStop: () => void;
}

export const ControlButtons = ({ isMonitoring, onStart, onStop }: ControlButtonsProps) => {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md mx-auto px-4">
      {!isMonitoring ? (
        <Button
          size="lg"
          onClick={onStart}
          className="h-16 text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <PlayCircle className="mr-2 h-6 w-6" />
          Start Monitoring
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onStop}
          variant="destructive"
          className="h-16 text-lg font-semibold"
        >
          <StopCircle className="mr-2 h-6 w-6" />
          Stop Monitoring
        </Button>
      )}
    </div>
  );
};
