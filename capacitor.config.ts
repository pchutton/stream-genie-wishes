import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.c9b76bfb8e224340941eb15a53861c72',
  appName: 'StreamGenie',
  webDir: 'dist',
  server: {
    url: 'https://c9b76bfb-8e22-4340-941e-b15a53861c72.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'automatic',
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
