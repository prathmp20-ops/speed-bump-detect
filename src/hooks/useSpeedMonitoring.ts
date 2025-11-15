import { useState, useEffect, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

export interface SpeedBump {
  id: string;
  latitude: number;
  longitude: number;
  speed: number;
  detected_at: string;
  created_at: string;
}

interface LocationData {
  speed: number;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy: number;
}

export const useSpeedMonitoring = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [speedBumps, setSpeedBumps] = useState<SpeedBump[]>([]);
  const [previousSpeed, setPreviousSpeed] = useState(0);
  const [watchId, setWatchId] = useState<string | null>(null);

  // Load speed bumps from database on mount
  useEffect(() => {
    loadSpeedBumps();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('speed_bumps_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'speed_bumps'
        },
        (payload) => {
          const newBump = payload.new as SpeedBump;
          setSpeedBumps(prev => [newBump, ...prev]);
          
          // Also update localStorage
          const stored = localStorage.getItem("speed-bumps");
          const existing = stored ? JSON.parse(stored) : [];
          localStorage.setItem("speed-bumps", JSON.stringify([newBump, ...existing]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadSpeedBumps = async () => {
    try {
      const { data, error } = await supabase
        .from('speed_bumps')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading speed bumps:', error);
        // Fallback to localStorage
        const saved = localStorage.getItem('speedBumps');
        if (saved) {
          setSpeedBumps(JSON.parse(saved));
        }
        return;
      }

      if (data) {
        setSpeedBumps(data);
        localStorage.setItem('speedBumps', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to load speed bumps:', error);
    }
  };

  // Detection logic
  const checkForSpeedBump = useCallback((location: LocationData) => {
    const speedKmh = (location.speed || 0) * 3.6; // Convert m/s to km/h
    
    console.log('Speed check:', {
      rawSpeed: location.speed,
      speedKmh: speedKmh.toFixed(1),
      previousSpeed: previousSpeed.toFixed(1),
      speedDrop: (previousSpeed - speedKmh).toFixed(1),
      latitude: location.latitude,
      longitude: location.longitude
    });
    
    setCurrentSpeed(speedKmh);

    // More forgiving detection for real-world mobile use:
    // - Speed drop of >10 km/h when going over 15 km/h
    // - Or sudden drop to very low speed (<8 km/h) from moderate speed (>15 km/h)
    const speedDrop = previousSpeed - speedKmh;
    const shouldDetect = 
      (previousSpeed > 15 && speedDrop > 10) ||
      (previousSpeed > 15 && speedKmh < 8);
    
    console.log('Detection check:', {
      shouldDetect,
      conditions: {
        'Previous speed > 15': previousSpeed > 15,
        'Speed drop > 10': speedDrop > 10,
        'Current speed < 8': speedKmh < 8,
      },
      reason: shouldDetect ? '✅ Speed bump detected!' : '❌ Conditions not met'
    });
    
    if (shouldDetect) {
      console.log('🚨 LOGGING SPEED BUMP!', {
        previousSpeed: previousSpeed.toFixed(1),
        currentSpeed: speedKmh.toFixed(1),
        speedDrop: speedDrop.toFixed(1)
      });
      
      saveBumpToDatabase(location.latitude, location.longitude, speedKmh, location.timestamp);

      // Show notification
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
    }

    setPreviousSpeed(speedKmh);
  }, [previousSpeed]);

  const startMonitoring = async () => {
    try {
      // Check if running on native platform or web
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      
      if (isNative) {
        // Native device: Use Capacitor Geolocation
        const permission = await Geolocation.requestPermissions();
        
        if (permission.location !== 'granted') {
          alert('Location permission is required to monitor speed bumps');
          return;
        }

        const id = await Geolocation.watchPosition(
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          },
          (position, err) => {
            if (err) {
              console.error('Geolocation error:', err);
              return;
            }

            if (position) {
              checkForSpeedBump({
                speed: position.coords.speed || 0,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timestamp: position.timestamp,
              });
            }
          }
        );

        setWatchId(id);
        setIsMonitoring(true);
      } else {
        // Web browser: Use Web Geolocation API
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser. Please use a mobile device or modern browser.');
          return;
        }

        const id = navigator.geolocation.watchPosition(
          (position) => {
            checkForSpeedBump({
              speed: position.coords.speed || 0,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              timestamp: position.timestamp,
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            let errorMessage = 'Failed to get location. ';
            
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage += 'Please enable location permissions in your browser settings.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information is unavailable.';
                break;
              case error.TIMEOUT:
                errorMessage += 'Location request timed out.';
                break;
              default:
                errorMessage += 'An unknown error occurred.';
            }
            
            alert(errorMessage);
            stopMonitoring();
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );

        setWatchId(id.toString());
        setIsMonitoring(true);
      }
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('Failed to start GPS monitoring. Error: ' + (error as Error).message);
    }
  };

  const stopMonitoring = useCallback(async () => {
    if (watchId) {
      const isNative = (window as any).Capacitor?.isNativePlatform?.() || false;
      
      if (isNative) {
        await Geolocation.clearWatch({ id: watchId });
      } else {
        navigator.geolocation.clearWatch(parseInt(watchId));
      }
      
      setWatchId(null);
    }
    setIsMonitoring(false);
    setCurrentSpeed(0);
    setPreviousSpeed(0);
  }, [watchId]);

  const saveBumpToDatabase = async (
    latitude: number,
    longitude: number,
    speed: number,
    timestamp: number
  ) => {
    console.log('💾 Saving speed bump to database...', {
      latitude,
      longitude,
      speed: speed.toFixed(1),
      timestamp: new Date(timestamp).toISOString()
    });
    
    try {
      const { data, error } = await supabase
        .from('speed_bumps')
        .insert({
          latitude,
          longitude,
          speed,
          detected_at: new Date(timestamp).toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving speed bump:', error);
        return;
      }

      if (data) {
        console.log('✅ Speed bump saved successfully:', data);
        const newBump: SpeedBump = data;

        setSpeedBumps((prev) => {
          const updated = [newBump, ...prev];
          // Keep localStorage as backup
          localStorage.setItem('speedBumps', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (error) {
      console.error('❌ Failed to save speed bump:', error);
    }
  };

  const clearHistory = useCallback(async () => {
    try {
      // Clear from database (delete all bumps from the last 30 days to avoid deleting historical data)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await supabase
        .from('speed_bumps')
        .delete()
        .gte('detected_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error clearing history:', error);
      }

      setSpeedBumps([]);
      localStorage.removeItem('speedBumps');
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, []);

  return {
    isMonitoring,
    currentSpeed,
    speedBumps,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    loadSpeedBumps,
  };
};
