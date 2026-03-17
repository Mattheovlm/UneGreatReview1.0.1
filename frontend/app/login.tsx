import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) { setError('Remplissez tous les champs'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Échec de connexion');
      await login(data.session_token, data);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const redirectUrl = window.location.origin + '/auth-callback';
      window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <MaterialCommunityIcons name="movie-open-star" size={56} color={colors.primary} />
            <Text style={[styles.appName, { color: colors.text_primary }]}>Social Cinema</Text>
            <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
              Partagez vos vidéos YouTube préférées
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.text_secondary} />
              <TextInput
                testID="login-email-input"
                style={[styles.input, { color: colors.text_primary }]}
                placeholder="Email"
                placeholderTextColor={colors.text_secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.text_secondary} />
              <TextInput
                testID="login-password-input"
                style={[styles.input, { color: colors.text_primary }]}
                placeholder="Mot de passe"
                placeholderTextColor={colors.text_secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} testID="toggle-password">
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.text_secondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              testID="login-submit-btn"
              style={[styles.btn, { backgroundColor: colors.primary }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Se connecter</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.divText, { color: colors.text_secondary }]}>ou</Text>
              <View style={[styles.divLine, { backgroundColor: colors.border }]} />
            </View>

            <TouchableOpacity
              testID="google-login-btn"
              style={[styles.googleBtn, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}
              onPress={handleGoogleLogin}
            >
              <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
              <Text style={[styles.googleBtnText, { color: colors.text_primary }]}>
                Continuer avec Google
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="go-to-register-btn"
            style={styles.switchLink}
            onPress={() => router.push('/register')}
          >
            <Text style={[styles.switchText, { color: colors.text_secondary }]}>
              Pas de compte ?{' '}
            </Text>
            <Text style={[styles.switchTextBold, { color: colors.primary }]}>S'inscrire</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  appName: { fontSize: 32, fontWeight: '800', marginTop: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, marginTop: 8 },
  errorBox: { borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, textAlign: 'center' },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 12,
  },
  input: { flex: 1, fontSize: 16 },
  btn: {
    borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  divLine: { flex: 1, height: 1 },
  divText: { marginHorizontal: 16, fontSize: 14 },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, paddingVertical: 14, gap: 10, borderWidth: 1,
  },
  googleBtnText: { fontSize: 16, fontWeight: '600' },
  switchLink: {
    flexDirection: 'row', justifyContent: 'center', marginTop: 24,
  },
  switchText: { fontSize: 15 },
  switchTextBold: { fontSize: 15, fontWeight: '700' },
});
