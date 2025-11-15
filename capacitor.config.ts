import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.ca61d419f9d543909d2655416b450e86',
  appName: 'Speed Bump Logger',
  webDir: 'dist',
  server: {
    url: 'https://ca61d419-f9d5-4390-9d26-55416b450e86.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Geolocation: {
      permissions: {
        location: 'always'
      }
    }
  }
};

export default config;
