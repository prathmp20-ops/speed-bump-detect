import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Trash2, ExternalLink } from "lucide-react";
import { SpeedBump } from "@/hooks/useSpeedMonitoring";

interface SpeedBumpListProps {
  bumps: SpeedBump[];
  onClear: () => void;
}

export const SpeedBumpList = ({ bumps, onClear }: SpeedBumpListProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const openInMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (bumps.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
          No speed bumps detected yet.
          <br />
          Start monitoring to begin logging.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Detected Bumps ({bumps.length})
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {bumps.map((bump) => (
          <Card
            key={bump.id}
            className="p-4 bg-card hover:bg-card/80 transition-colors animate-fade-in"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {bump.latitude.toFixed(6)}, {bump.longitude.toFixed(6)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(bump.detected_at)} • {Math.round(bump.speed)} km/h
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInMaps(bump.latitude, bump.longitude)}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
