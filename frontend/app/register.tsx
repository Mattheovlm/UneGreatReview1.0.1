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

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Remplissez tous les champs'); return; }
    if (password.length < 6) { setError('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Échec de l'inscription");

      if (data.requires_verification) {
        setVerificationSent(true);
        if (data.verification_token) {
          setVerificationToken(data.verification_token);
        }
      } else {
        await login(data.session_token, {
          user_id: data.user_id,
          email: data.email,
          name: data.name,
          picture: data.picture || '',
        });
        router.replace('/(tabs)');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyNow = () => {
    if (verificationToken) {
      router.push(`/verify-email?token=${verificationToken}`);
    }
  };

  if (verificationSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <View style={styles.confirmContainer}>
          <MaterialCommunityIcons name="email-check-outline" size={72} color={colors.primary} />
          <Text style={[styles.confirmTitle, { color: colors.text_primary }]}>
            Vérifiez vos emails !
          </Text>
          <Text style={[styles.confirmText, { color: colors.text_secondary }]}>
            Un lien de confirmation a été envoyé à
          </Text>
          <Text style={[styles.confirmEmail, { color: colors.text_primary }]}>{email}</Text>
          <Text style={[styles.confirmHint, { color: colors.text_secondary }]}>
            Cliquez sur le lien dans votre boîte mail pour activer votre compte.
            Vérifiez aussi vos spams si vous ne le voyez pas.
          </Text>
          
          {/* Manual verification button (for testing without SMTP) */}
          {verificationToken && (
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: colors.success || '#22C55E', marginTop: 24 }]}
              onPress={handleVerifyNow}
            >
              <Text style={styles.btnText}>Vérifier maintenant</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary, marginTop: verificationToken ? 12 : 32 }]}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.btnText}>Retour à la connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resendLink} onPress={handleRegister} disabled={loading}>
            <Text style={[styles.resendText, { color: colors.text_secondary }]}>
              {loading ? "Envoi en cours..." : "Renvoyer l'email"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <MaterialCommunityIcons name="movie-open-star" size={56} color={colors.primary} />
            <Text style={[styles.appName, { color: colors.text_primary }]}>Créer un compte</Text>
            <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
              Rejoignez la communauté Social Cinema
            </Text>
          </View>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="account-outline" size={20} color={colors.text_secondary} />
              <TextInput
                testID="register-name-input"
                style={[styles.input, { color: colors.text_primary }]}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={colors.text_secondary}
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.text_secondary} />
              <TextInput
                testID="register-email-input"
                style={[styles.input, { color: colors.text_primary }]}
                placeholder="Email"
                placeholderTextColor={colors.text_secondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.text_secondary} />
              <TextInput
                testID="register-password-input"
                style={[styles.input, { color: colors.text_primary }]}
                placeholder="Mot de passe (min. 6 caractères)"
                placeholderTextColor={colors.text_secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              testID="register-submit-btn"
              style={[styles.btn, { backgroundColor: loading ? colors.primary + '80' : colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>S'inscrire</Text>}
            </TouchableOpacity>
          </View>

          <TouchableOpacity testID="go-to-login-btn" style={styles.switchLink} onPress={() => router.back()}>
            <Text style={[styles.switchText, { color: colors.text_secondary }]}>Déjà un compte ?{' '}</Text>
            <Text style={[styles.switchTextBold, { color: colors.primary }]}>Se connecter</Text>
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
  appName: { fontSize: 28, fontWeight: '800', marginTop: 12, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, marginTop: 8, textAlign: 'center' },
  errorBox: { borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 14, textAlign: 'center' },
  form: { gap: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, gap: 12,
  },
  input: { flex: 1, fontSize: 16 },
  btn: { borderRadius: 100, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  switchText: { fontSize: 15 },
  switchTextBold: { fontSize: 15, fontWeight: '700' },
  confirmContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmTitle: { fontSize: 26, fontWeight: '800', marginTop: 24, textAlign: 'center' },
  confirmText: { fontSize: 16, marginTop: 16, textAlign: 'center' },
  confirmEmail: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  confirmHint: { fontSize: 13, marginTop: 16, textAlign: 'center', lineHeight: 20 },
  resendLink: { marginTop: 16, padding: 12 },
  resendText: { fontSize: 14, textDecorationLine: 'underline' },
});
