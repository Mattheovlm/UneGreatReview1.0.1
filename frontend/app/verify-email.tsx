import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Lien invalide.');
      return;
    }
    const verify = async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Erreur de vérification');
        await login(data.session_token, {
          user_id: data.user_id,
          email: data.email,
          name: data.name,
          picture: data.picture || '',
        });
        setStatus('success');
      } catch (e) {
        setStatus('error');
        setMessage(e.message);
      }
    };
    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.text, { color: colors.text_secondary }]}>Vérification en cours...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <MaterialCommunityIcons name="check-circle-outline" size={80} color="#22c55e" />
        <Text style={[styles.title, { color: colors.text_primary }]}>Email confirmé !</Text>
        <Text style={[styles.text, { color: colors.text_secondary }]}>
          Votre compte est activé. Bienvenue sur Social Cinema !
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.btnText}>Accéder à l'app</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <MaterialCommunityIcons name="alert-circle-outline" size={80} color={colors.error} />
      <Text style={[styles.title, { color: colors.text_primary }]}>Lien invalide</Text>
      <Text style={[styles.text, { color: colors.text_secondary }]}>{message}</Text>
      <TouchableOpacity
        style={[styles.btn, { backgroundColor: colors.primary }]}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.btnText}>Retour à la connexion</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 26, fontWeight: '800', marginTop: 24, textAlign: 'center' },
  text: { fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 },
  btn: { borderRadius: 100, paddingVertical: 16, paddingHorizontal: 32, marginTop: 32 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
