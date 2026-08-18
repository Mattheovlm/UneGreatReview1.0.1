import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import ConsentModal from '../src/components/ConsentModal';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="verify-code" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="video/[id]"
              options={{
                presentation: 'transparentModal',
                animation: 'slide_from_bottom',
              }}
            />
            <Stack.Screen name="user/[id]" />
            <Stack.Screen name="settings" />
            <Stack.Screen name="privacy" />
            <Stack.Screen name="terms" />
            <Stack.Screen name="legal" />
            <Stack.Screen name="playlist/[id]" />
          </Stack>
          <ConsentModal />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
