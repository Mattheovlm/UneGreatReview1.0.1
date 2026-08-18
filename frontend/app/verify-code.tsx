import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const RESEND_COOLDOWN = 30;

export default function VerifyCodeScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const inputRef = useRef<TextInput>(null);
  const { login } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (value?: string) => {
    const codeToVerify = (value ?? code).trim();
    if (codeToVerify.length !== 6 || loading) return;
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeToVerify }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Code invalide');
      await login(data.session_token, {
        user_id: data.user_id,
        email: data.email,
        name: data.name,
        picture: data.picture || '',
      });
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message);
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(digits);
    setError('');
    if (digits.length === 6) {
      handleVerify(digits);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch(`${API_URL}/api/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Impossible de renvoyer le code");
      setInfo('Un nouveau code a été envoyé à votre adresse email.');
      setCooldown(RESEND_COOLDOWN);
      setCode('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setResending(false);
    }
  };

  const digits = code.padEnd(6, ' ').split('');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <View style={styles.content}>
          <TouchableOpacity
            testID="verify-back-btn"
            style={styles.backBtn}
            onPress={() => router.replace('/login')}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="email-lock" size={48} color={colors.primary} />
          </View>

          <Text style={[styles.title, { color: colors.text_primary }]}>Vérifiez vos emails</Text>
          <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
            Nous avons envoyé un code à 6 chiffres à
          </Text>
          <Text style={[styles.email, { color: colors.text_primary }]}>{email}</Text>

          {error ? (
            <View style={[styles.msgBox, { backgroundColor: colors.error + '20' }]}>
              <Text style={[styles.msgText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}
          {info ? (
            <View style={[styles.msgBox, { backgroundColor: '#22c55e20' }]}>
              <Text style={[styles.msgText, { color: '#22c55e' }]}>{info}</Text>
            </View>
          ) : null}

          {/* Code boxes overlaying hidden input */}
          <Pressable style={styles.codeRow} onPress={() => inputRef.current?.focus()}>
            {digits.map((d, i) => (
              <View
                key={i}
                style={[
                  styles.codeBox,
                  {
                    backgroundColor: colors.bg_card,
                    borderColor: i === code.length ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.codeDigit, { color: colors.text_primary }]}>{d.trim()}</Text>
              </View>
            ))}
            <TextInput
              ref={inputRef}
              testID="verify-code-input"
              style={styles.hiddenInput}
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              caretHidden
            />
          </Pressable>

          <TouchableOpacity
            testID="verify-submit-btn"
            style={[
              styles.btn,
              { backgroundColor: code.length === 6 && !loading ? colors.primary : colors.bg_overlay },
            ]}
            onPress={() => handleVerify()}
            disabled={code.length !== 6 || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.btnText, { color: code.length === 6 ? '#fff' : colors.text_secondary }]}>
                Vérifier
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            testID="resend-code-btn"
            style={styles.resendLink}
            onPress={handleResend}
            disabled={cooldown > 0 || resending}
          >
            <Text style={[styles.resendText, { color: cooldown > 0 ? colors.text_secondary : colors.primary }]}>
              {resending
                ? 'Envoi en cours...'
                : cooldown > 0
                  ? `Renvoyer le code (${cooldown}s)`
                  : 'Renvoyer le code'}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.hint, { color: colors.text_secondary }]}>
            Le code expire dans 15 minutes.{'\n'}Pensez à vérifier vos spams.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backBtn: {
    position: 'absolute', top: 20, left: 20, width: 44, height: 44,
    borderRadius: 22, alignItems: 'center', justifyContent: 'center',
  },
  iconCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 15, marginTop: 10, textAlign: 'center' },
  email: { fontSize: 15, fontWeight: '700', marginTop: 2, marginBottom: 20 },
  msgBox: { borderRadius: 10, padding: 12, marginBottom: 12, alignSelf: 'stretch' },
  msgText: { fontSize: 14, textAlign: 'center' },
  codeRow: {
    flexDirection: 'row', gap: 8, marginVertical: 12, position: 'relative',
  },
  codeBox: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  codeDigit: { fontSize: 24, fontWeight: '800' },
  hiddenInput: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.01, fontSize: 1,
  },
  btn: {
    borderRadius: 100, paddingVertical: 16, alignItems: 'center',
    alignSelf: 'stretch', marginTop: 16,
  },
  btnText: { fontSize: 16, fontWeight: '700' },
  resendLink: { marginTop: 20, padding: 10, minHeight: 44, justifyContent: 'center' },
  resendText: { fontSize: 15, fontWeight: '600' },
  hint: { fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 20 },
});
