import { Stack } from 'expo-router';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { AuthProvider } from '../src/contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="auth-callback" />
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
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
