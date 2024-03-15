import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'yukananas.app',
  appName: 'yukananas-app',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
