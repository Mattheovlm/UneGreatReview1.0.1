import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Politique de Confidentialité</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdate, { color: colors.text_secondary }]}>
          Dernière mise à jour : Mars 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>1. Introduction</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Social Cinema ("nous", "notre", "l'application") respecte votre vie privée et s'engage à protéger vos données personnelles. Cette politique de confidentialité vous informe sur la façon dont nous traitons vos données personnelles lorsque vous utilisez notre application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>2. Données collectées</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous collectons les données suivantes :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Informations de compte : email, nom d'utilisateur, photo de profil (optionnelle), biographie (optionnelle)
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Données d'utilisation : vidéos notées, notes attribuées, commentaires, playlists créées
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Données sociales : liste d'amis, demandes d'amitié
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Données techniques : type d'appareil, système d'exploitation
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>3. Utilisation des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Vos données sont utilisées pour :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Fournir et maintenir le service
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Personnaliser votre expérience et recommander des vidéos
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Permettre les fonctionnalités sociales (amis, partage)
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Améliorer l'application
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>4. Partage des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous ne vendons pas vos données personnelles. Vos données peuvent être partagées avec :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Vos amis sur l'application (notes, commentaires, playlists publiques)
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Nos prestataires techniques (hébergement, authentification)
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Les autorités si requis par la loi
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>5. Sécurité</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données contre l'accès non autorisé, la modification, la divulgation ou la destruction. Vos mots de passe sont chiffrés et ne sont jamais stockés en clair.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>6. Conservation des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Vos données sont conservées tant que votre compte est actif. Si vous supprimez votre compte, vos données personnelles seront supprimées dans un délai de 30 jours.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>7. Vos droits</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Conformément au RGPD, vous disposez des droits suivants :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Droit d'accès à vos données
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Droit de rectification
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Droit à l'effacement ("droit à l'oubli")
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Droit à la portabilité des données
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Droit d'opposition
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>8. Cookies et technologies similaires</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L'application utilise des technologies de stockage local pour maintenir votre session et vos préférences. Aucun cookie tiers de suivi publicitaire n'est utilisé.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>9. Modifications</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous pouvons mettre à jour cette politique de confidentialité. En cas de modification importante, nous vous en informerons via l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>10. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à : privacy@socialcinema.app
        </Text>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 20 },
  lastUpdate: { fontSize: 12, marginBottom: 20, fontStyle: 'italic' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  listItem: { fontSize: 14, lineHeight: 22, marginLeft: 8, marginBottom: 4 },
  spacer: { height: 40 },
});
