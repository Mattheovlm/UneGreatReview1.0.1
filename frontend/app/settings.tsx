import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="settings-screen">
      <View style={styles.header}>
        <TouchableOpacity testID="settings-back-btn" onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Paramètres</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.bg_card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text_secondary }]}>APPARENCE</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons
                name={theme === 'dark' ? 'weather-night' : 'white-balance-sunny'}
                size={22}
                color={colors.primary}
              />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>Mode sombre</Text>
            </View>
            <Switch
              testID="theme-toggle"
              value={theme === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.bg_overlay, true: colors.primary + '60' }}
              thumbColor={theme === 'dark' ? colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bg_card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text_secondary }]}>COMPTE</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="email-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>{user?.email}</Text>
            </View>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="account-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>{user?.name}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          testID="logout-btn"
          style={[styles.logoutBtn, { backgroundColor: colors.error + '15' }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.text_secondary }]}>
          Social Cinema v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingText: { fontSize: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 16, gap: 8, marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', marginTop: 24, fontSize: 13 },
});
