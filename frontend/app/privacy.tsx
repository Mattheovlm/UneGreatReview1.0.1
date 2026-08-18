import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function PrivacyPolicyScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Politique de Confidentialité</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.text_secondary }]}>
          Dernière mise à jour : Juin 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>1. Introduction</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Social Cinema ("nous", "notre", "nos") s'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons vos informations personnelles lorsque vous utilisez notre application mobile.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>2. Données collectées</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous collectons les données suivantes :{'\n\n'}
          • <Text style={{ fontWeight: '600' }}>Informations de compte</Text> : nom, adresse email, photo de profil{'\n'}
          • <Text style={{ fontWeight: '600' }}>Données d'utilisation</Text> : vidéos notées, commentaires, listes de lecture{'\n'}
          • <Text style={{ fontWeight: '600' }}>Données sociales</Text> : liste d'amis, interactions{'\n'}
          • <Text style={{ fontWeight: '600' }}>Données techniques</Text> : type d'appareil, système d'exploitation
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>3. Utilisation des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Vos données sont utilisées pour :{'\n\n'}
          • Fournir et améliorer nos services{'\n'}
          • Personnaliser votre expérience{'\n'}
          • Permettre les fonctionnalités sociales{'\n'}
          • Envoyer des notifications importantes{'\n'}
          • Assurer la sécurité de l'application
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>4. Partage des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous ne vendons jamais vos données personnelles. Vos informations peuvent être partagées avec :{'\n\n'}
          • Vos amis sur l'application (selon vos paramètres de confidentialité){'\n'}
          • Nos prestataires techniques (hébergement, analyse){'\n'}
          • Les autorités si requis par la loi
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>5. Intelligence artificielle</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Certaines fonctionnalités utilisent l'intelligence artificielle :{'\n\n'}
          • <Text style={{ fontWeight: '600' }}>Recommandations personnalisées</Text> : les titres des vidéos que vous avez notées peuvent être transmis à OpenAI (États-Unis) afin de générer des suggestions de vidéos adaptées à vos goûts.{'\n\n'}
          Aucune donnée d'identité (nom, email, photo) n'est partagée avec ces services. Le contenu recommandé est généré par IA et clairement identifié comme tel. Vous consentez à ce traitement lors du premier lancement de l'application et pouvez retirer votre consentement en supprimant votre compte.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>6. Vos droits (RGPD)</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Conformément au RGPD, vous avez le droit de :{'\n\n'}
          • Accéder à vos données personnelles{'\n'}
          • Rectifier vos données{'\n'}
          • Supprimer votre compte et vos données{'\n'}
          • Exporter vos données{'\n'}
          • Retirer votre consentement à tout moment
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>7. Sécurité</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous utilisons des mesures de sécurité techniques et organisationnelles pour protéger vos données, incluant le chiffrement des données en transit et au repos.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>8. Conservation des données</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Vos données sont conservées tant que votre compte est actif. Après suppression de votre compte, vos données sont effacées dans un délai de 30 jours.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>9. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour toute question concernant cette politique de confidentialité ou vos données personnelles, contactez-nous à :{'\n\n'}
          📧 privacy@socialcinema.app
        </Text>

        <View style={{ height: 40 }} />
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
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { padding: 20 },
  lastUpdated: { fontSize: 13, marginBottom: 24, fontStyle: 'italic' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  paragraph: { fontSize: 15, lineHeight: 24 },
});
