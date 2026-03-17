import { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Platform, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const processAuth = async () => {
      try {
        let sessionId = '';
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const hash = window.location.hash;
          const match = hash.match(/session_id=([^&]+)/);
          if (match) sessionId = match[1];
        }

        if (!sessionId) {
          router.replace('/login');
          return;
        }

        const res = await fetch(`${API_URL}/api/auth/google-session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!res.ok) throw new Error('Auth failed');
        const data = await res.json();
        await login(data.session_token, data);
        router.replace('/(tabs)');
      } catch (e) {
        console.error('Auth callback error:', e);
        router.replace('/login');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_root }]} testID="auth-callback-screen">
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text_secondary }]}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  text: { fontSize: 16, marginTop: 12 },
});
