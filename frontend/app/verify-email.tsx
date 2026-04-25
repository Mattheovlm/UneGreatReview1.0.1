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
      } catch (e: any) {
        setStatus('error');
        setMessage(e.message);
      }
    };
    verify();
  }, [token]);

  const handleClose = () => {
    router.replace('/(tabs)');
  };

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
        {/* Close button in top right */}
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="close" size={28} color={colors.text_primary} />
        </TouchableOpacity>
        
        <View style={styles.content}>
          <View style={[styles.successCircle, { backgroundColor: '#22c55e20' }]}>
            <MaterialCommunityIcons name="check-circle" size={80} color="#22c55e" />
          </View>
          <Text style={[styles.title, { color: colors.text_primary }]}>App vérifiée !</Text>
          <Text style={[styles.text, { color: colors.text_secondary }]}>
            Votre compte est maintenant activé.{'\n'}Bienvenue sur Social Cinema !
          </Text>
          
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={handleClose}
          >
            <MaterialCommunityIcons name="home" size={20} color="#fff" />
            <Text style={styles.btnText}>Entrer dans l'app</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      {/* Close button in top right */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => router.replace('/login')}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="close" size={28} color={colors.text_primary} />
      </TouchableOpacity>
      
      <View style={styles.content}>
        <View style={[styles.errorCircle, { backgroundColor: colors.error + '20' }]}>
          <MaterialCommunityIcons name="alert-circle" size={80} color={colors.error} />
        </View>
        <Text style={[styles.title, { color: colors.text_primary }]}>Lien invalide</Text>
        <Text style={[styles.text, { color: colors.text_secondary }]}>{message}</Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.btnText}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    marginTop: 24, 
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  text: { 
    fontSize: 16, 
    marginTop: 12, 
    textAlign: 'center', 
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  btn: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 100, 
    paddingVertical: 16, 
    paddingHorizontal: 32, 
    marginTop: 32,
  },
  btnText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
  },
});
