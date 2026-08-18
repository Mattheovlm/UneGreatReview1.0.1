import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function LegalNoticeScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Mentions Légales</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.text_secondary }]}>
          Dernière mise à jour : Juin 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>1. Éditeur de l&apos;application</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L&apos;application <Text style={styles.bold}>Social Cinema</Text> est éditée à titre personnel par une personne physique.{'\n\n'}
          Conformément à l&apos;article 6-III-2 de la loi n°2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique (LCEN), l&apos;éditeur, personne physique agissant à titre non professionnel, a choisi de préserver son anonymat. Ses coordonnées complètes ont été transmises à l&apos;hébergeur mentionné ci-dessous.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>2. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour toute question, réclamation ou demande relative à l&apos;application :{'\n\n'}
          📧 Contact général : <Text style={[styles.link, { color: colors.primary }]} onPress={() => Linking.openURL('mailto:support@socialcinema.app')}>support@socialcinema.app</Text>{'\n'}
          📧 Données personnelles : <Text style={[styles.link, { color: colors.primary }]} onPress={() => Linking.openURL('mailto:privacy@socialcinema.app')}>privacy@socialcinema.app</Text>
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>3. Directeur de la publication</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Le directeur de la publication est l&apos;éditeur de l&apos;application, joignable via les adresses de contact ci-dessus.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>4. Hébergement</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L&apos;application et ses données sont hébergées par :{'\n\n'}
          <Text style={styles.bold}>Emergent</Text>{'\n'}
          Plateforme d&apos;hébergement cloud{'\n'}
          Site web : emergent.sh
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>5. Propriété intellectuelle</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Le nom, le logo, l&apos;interface et le code de Social Cinema sont la propriété exclusive de son éditeur.{'\n\n'}
          Les vidéos affichées dans l&apos;application sont diffusées via le lecteur YouTube officiel (YouTube embedded player), conformément aux Conditions d&apos;Utilisation de l&apos;API YouTube. Les vignettes, titres et contenus des vidéos restent la propriété de leurs auteurs respectifs et de YouTube/Google LLC.{'\n\n'}
          Les notes et commentaires publiés par les utilisateurs restent leur propriété ; en les publiant, ils accordent à Social Cinema une licence d&apos;affichage au sein de l&apos;application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>6. Données personnelles</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Le traitement des données personnelles est décrit dans notre{' '}
          <Text style={[styles.link, { color: colors.primary }]} onPress={() => router.push('/privacy')}>Politique de Confidentialité</Text>.{'\n\n'}
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, de portabilité (export de vos données depuis les Paramètres) et de suppression (suppression de compte depuis les Paramètres).
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>7. Loi applicable</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Les présentes mentions légales sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront seuls compétents.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: { padding: 20 },
  lastUpdated: { fontSize: 13, fontStyle: 'italic', marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 20, marginBottom: 8 },
  paragraph: { fontSize: 15, lineHeight: 24 },
  bold: { fontWeight: '700' },
  link: { fontWeight: '600', textDecorationLine: 'underline' },
});
