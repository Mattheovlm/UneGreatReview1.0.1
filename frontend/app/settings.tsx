import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch, ScrollView, Alert, Linking, Platform, Image, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { apiCall } from '../src/utils/api';
import FloatingTabBar from '../src/components/FloatingTabBar';

const SUPPORT_EMAIL = 'unegreatreview@gmail.com';

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, logout, token } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const handleExportData = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await apiCall('/api/users/me/export');
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `unegreatreview-export-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        await Share.share({
          title: 'Export de mes données — UneGreatReview',
          message: json,
        });
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message || "Impossible d'exporter vos données");
    }
    setExporting(false);
  };

  useEffect(() => {
    apiCall('/api/users/me/blocked')
      .then((list) => setBlockedUsers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      await apiCall(`/api/users/${userId}/block`, { method: 'DELETE' });
      setBlockedUsers((prev) => prev.filter((u) => u.user_id !== userId));
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de débloquer');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Êtes-vous vraiment sûr de vouloir supprimer votre compte ?\n\nCette action est irréversible. Toutes vos données, vidéos notées, commentaires et amis seront définitivement supprimés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: confirmDeleteAccount,
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setDeleting(true);
    try {
      await apiCall('/api/auth/delete-account', {
        method: 'DELETE',
      });
      await logout();
      Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès.');
      router.replace('/login');
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de supprimer le compte');
    }
    setDeleting(false);
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Support UneGreatReview');
    const body = encodeURIComponent(`\n\n---\nUser ID: ${user?.user_id}\nPlatform: ${Platform.OS}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
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

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
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

        <View style={[styles.section, { backgroundColor: colors.bg_card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text_secondary }]}>UTILISATEURS BLOQUÉS</Text>
          {blockedUsers.length === 0 ? (
            <Text style={[styles.emptyBlocked, { color: colors.text_secondary }]}>
              Aucun utilisateur bloqué
            </Text>
          ) : (
            blockedUsers.map((u) => (
              <View key={u.user_id} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  {u.picture ? (
                    <Image source={{ uri: u.picture }} style={styles.blockedAvatar} />
                  ) : (
                    <MaterialCommunityIcons name="account-cancel" size={22} color={colors.text_secondary} />
                  )}
                  <Text style={[styles.settingText, { color: colors.text_primary }]}>{u.name}</Text>
                </View>
                <TouchableOpacity
                  testID={`unblock-${u.user_id}`}
                  style={[styles.unblockBtn, { borderColor: colors.primary }]}
                  onPress={() => handleUnblock(u.user_id)}
                >
                  <Text style={[styles.unblockText, { color: colors.primary }]}>Débloquer</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.bg_card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text_secondary }]}>SUPPORT</Text>
          <TouchableOpacity
            testID="contact-support-btn"
            style={styles.settingRow}
            onPress={handleContactSupport}
          >
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="email-fast-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>Contacter le support</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.bg_card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text_secondary }]}>LÉGAL</Text>
          <TouchableOpacity
            testID="privacy-policy-btn"
            style={styles.settingRow}
            onPress={() => router.push('/privacy')}
          >
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="shield-lock-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>Politique de Confidentialité</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="terms-btn"
            style={styles.settingRow}
            onPress={() => router.push('/terms')}
          >
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>Conditions d'Utilisation</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="legal-notice-btn"
            style={styles.settingRow}
            onPress={() => router.push('/legal')}
          >
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="scale-balance" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>Mentions Légales</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            testID="export-data-btn"
            style={styles.settingRow}
            onPress={handleExportData}
            disabled={exporting}
          >
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons name="database-export-outline" size={22} color={colors.text_secondary} />
              <Text style={[styles.settingText, { color: colors.text_primary }]}>
                {exporting ? 'Export en cours...' : 'Exporter mes données (RGPD)'}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          testID="logout-btn"
          style={[styles.logoutBtn, { backgroundColor: colors.error + '15' }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Se déconnecter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="delete-account-btn"
          style={[styles.deleteBtn, { borderColor: colors.error }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
        >
          <MaterialCommunityIcons name="account-remove" size={22} color={colors.error} />
          <Text style={[styles.deleteText, { color: colors.error }]}>
            {deleting ? 'Suppression...' : 'Supprimer mon compte'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.text_secondary }]}>
          UneGreatReview v1.0.0
        </Text>
      </ScrollView>
      <FloatingTabBar />
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
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  section: { borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 12 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingText: { fontSize: 16 },
  emptyBlocked: { fontSize: 14, fontStyle: 'italic' },
  blockedAvatar: { width: 28, height: 28, borderRadius: 14 },
  unblockBtn: {
    borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6,
    minHeight: 32, justifyContent: 'center',
  },
  unblockText: { fontSize: 13, fontWeight: '600' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 16, gap: 8, marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 16, gap: 8, marginTop: 12,
    borderWidth: 1, backgroundColor: 'transparent',
  },
  deleteText: { fontSize: 16, fontWeight: '600' },
  version: { textAlign: 'center', marginTop: 24, fontSize: 13 },
});
