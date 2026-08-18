import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const CONSENT_KEY = 'gdpr_consent_v1';

export default function ConsentModal() {
  const { colors } = useTheme();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CONSENT_KEY).then((v) => {
      if (!v) setVisible(true);
    });
  }, []);

  const handleAccept = async () => {
    await AsyncStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  };

  const openLegal = (path: '/privacy' | '/terms') => {
    setVisible(false);
    router.push(path);
    // Re-show the consent modal when they come back (consent not yet given)
    setTimeout(() => {
      AsyncStorage.getItem(CONSENT_KEY).then((v) => {
        if (!v) setVisible(true);
      });
    }, 800);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bg_card }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '20' }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text_primary }]}>
            Votre vie privée compte
          </Text>
          <ScrollView style={styles.body}>
            <Text style={[styles.text, { color: colors.text_secondary }]}>
              Pour fonctionner, Social Cinema collecte et traite les données suivantes :{'\n\n'}
              • <Text style={styles.bold}>Compte</Text> : email, pseudo, photo de profil{'\n'}
              • <Text style={styles.bold}>Activité</Text> : vidéos notées, commentaires, playlists, amis{'\n\n'}
              <Text style={styles.bold}>Intelligence artificielle</Text> : les titres de vos vidéos notées peuvent être transmis à OpenAI pour générer vos recommandations personnalisées. Aucune donnée d&apos;identité n&apos;est partagée.{'\n\n'}
              Vos données ne sont jamais vendues. Vous pouvez supprimer votre compte et toutes vos données à tout moment depuis les paramètres.
            </Text>
          </ScrollView>

          <View style={styles.links}>
            <TouchableOpacity testID="consent-privacy-link" onPress={() => openLegal('/privacy')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>Politique de confidentialité</Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text_secondary }}> • </Text>
            <TouchableOpacity testID="consent-terms-link" onPress={() => openLegal('/terms')}>
              <Text style={[styles.linkText, { color: colors.primary }]}>CGU</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            testID="consent-accept-btn"
            style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
            onPress={handleAccept}
          >
            <Text style={styles.acceptText}>J&apos;accepte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: {
    borderRadius: 20, padding: 24, width: '100%', maxWidth: 400,
    maxHeight: '85%', alignItems: 'center',
  },
  iconCircle: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  body: { maxHeight: 260, alignSelf: 'stretch' },
  text: { fontSize: 14, lineHeight: 21 },
  bold: { fontWeight: '700' },
  links: { flexDirection: 'row', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  linkText: { fontSize: 13, fontWeight: '600', textDecorationLine: 'underline' },
  acceptBtn: {
    borderRadius: 100, paddingVertical: 15, alignItems: 'center',
    alignSelf: 'stretch', marginTop: 16, minHeight: 48, justifyContent: 'center',
  },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
