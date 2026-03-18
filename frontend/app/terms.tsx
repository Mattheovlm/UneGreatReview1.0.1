import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Conditions d'Utilisation</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdate, { color: colors.text_secondary }]}>
          Dernière mise à jour : Mars 2026
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>1. Acceptation des conditions</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          En utilisant Social Cinema ("l'application"), vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>2. Description du service</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Social Cinema est une plateforme sociale permettant aux utilisateurs de :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Noter et commenter des vidéos YouTube
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Créer et gérer des playlists
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Se connecter avec d'autres utilisateurs
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Découvrir des recommandations personnalisées
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>3. Inscription et compte</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour utiliser l'application, vous devez créer un compte. Vous êtes responsable de :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Fournir des informations exactes lors de l'inscription
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Maintenir la confidentialité de votre mot de passe
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Toutes les activités effectuées sous votre compte
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>4. Règles de conduite</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          En utilisant l'application, vous vous engagez à ne pas :
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Publier du contenu illégal, offensant, diffamatoire ou discriminatoire
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Harceler ou intimider d'autres utilisateurs
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Usurper l'identité d'une autre personne
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Utiliser l'application à des fins commerciales non autorisées
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Tenter de compromettre la sécurité de l'application
        </Text>
        <Text style={[styles.listItem, { color: colors.text_secondary }]}>
          • Collecter des données sur d'autres utilisateurs sans leur consentement
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>5. Contenu utilisateur</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Vous conservez la propriété de tout contenu que vous publiez (commentaires, notes, playlists). En publiant du contenu, vous nous accordez une licence mondiale, non exclusive et gratuite pour afficher ce contenu dans le cadre du service.
        </Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous nous réservons le droit de supprimer tout contenu qui viole ces conditions.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>6. Propriété intellectuelle</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L'application, son design, son code et ses fonctionnalités sont protégés par le droit d'auteur. Les vidéos référencées appartiennent à leurs créateurs respectifs sur YouTube.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>7. Limitation de responsabilité</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L'application est fournie "telle quelle". Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. Nous ne sommes pas responsables des contenus publiés par les utilisateurs ou des vidéos YouTube référencées.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>8. Suspension et résiliation</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous pouvons suspendre ou résilier votre compte si vous violez ces conditions. Vous pouvez supprimer votre compte à tout moment depuis les paramètres de l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>9. Modifications</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous pouvons modifier ces conditions à tout moment. Les modifications importantes seront notifiées via l'application. En continuant à utiliser l'application après les modifications, vous acceptez les nouvelles conditions.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>10. Droit applicable</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Ces conditions sont régies par le droit français. Tout litige sera soumis aux tribunaux compétents de Paris, France.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>11. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour toute question concernant ces conditions, contactez-nous à : support@socialcinema.app
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
