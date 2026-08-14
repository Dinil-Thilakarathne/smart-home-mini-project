import { Stack } from 'expo-router';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import Toast from 'react-native-toast-message';
import { appToastConfig } from '@/components/app-toast';

export default function RootLayout() {
  return <GluestackUIProvider><Stack screenOptions={{ headerShown: false }} /><Toast config={appToastConfig} position="bottom" bottomOffset={92} visibilityTime={3000} /></GluestackUIProvider>;
}
