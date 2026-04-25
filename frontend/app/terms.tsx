import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';

export default function TermsScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Conditions d'Utilisation</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.lastUpdated, { color: colors.text_secondary }]}>
          Dernière mise à jour : Avril 2025
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>1. Acceptation des conditions</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          En utilisant Social Cinema, vous acceptez ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>2. Description du service</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Social Cinema est une application mobile permettant de :{'\n\n'}
          • Noter et partager des vidéos YouTube{'\n'}
          • Créer des listes de lecture{'\n'}
          • Interagir avec d'autres utilisateurs{'\n'}
          • Découvrir de nouvelles vidéos
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>3. Inscription et compte</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour utiliser Social Cinema, vous devez :{'\n\n'}
          • Avoir au moins 13 ans{'\n'}
          • Fournir des informations exactes lors de l'inscription{'\n'}
          • Maintenir la confidentialité de votre mot de passe{'\n'}
          • Être responsable de toute activité sur votre compte
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>4. Contenu utilisateur</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          En publiant du contenu (notes, commentaires), vous garantissez que :{'\n\n'}
          • Vous êtes l'auteur ou avez les droits nécessaires{'\n'}
          • Le contenu ne viole aucune loi{'\n'}
          • Le contenu n'est pas offensant, diffamatoire ou inapproprié{'\n\n'}
          Nous nous réservons le droit de supprimer tout contenu inapproprié.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>5. Comportement interdit</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Il est interdit de :{'\n\n'}
          • Harceler ou intimider d'autres utilisateurs{'\n'}
          • Publier du contenu illégal ou offensant{'\n'}
          • Usurper l'identité d'une autre personne{'\n'}
          • Tenter de pirater ou compromettre l'application{'\n'}
          • Utiliser l'application à des fins commerciales non autorisées
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>6. Propriété intellectuelle</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Social Cinema et son contenu original (design, logos, textes) sont protégés par les droits d'auteur. Les vidéos YouTube restent la propriété de leurs créateurs respectifs.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>7. Limitation de responsabilité</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          L'application est fournie "en l'état". Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs. Nous ne sommes pas responsables des contenus publiés par les utilisateurs.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>8. Résiliation</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous pouvons suspendre ou résilier votre compte en cas de violation de ces conditions. Vous pouvez supprimer votre compte à tout moment via les paramètres de l'application.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>9. Modifications</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Nous nous réservons le droit de modifier ces conditions à tout moment. Les utilisateurs seront informés des changements significatifs.
        </Text>

        <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>10. Contact</Text>
        <Text style={[styles.paragraph, { color: colors.text_secondary }]}>
          Pour toute question concernant ces conditions d'utilisation :{'\n\n'}
          📧 legal@socialcinema.app
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
