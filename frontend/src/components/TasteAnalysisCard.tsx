import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface TasteAnalysis {
  total_ratings: number;
  average_rating: number;
  critic_type: string;
  critic_emoji: string;
  favorite_genres: { name: string; count: number }[];
  rating_distribution: Record<string, number>;
}

interface TasteAnalysisCardProps {
  analysis: TasteAnalysis | null;
}

export default function TasteAnalysisCard({ analysis }: TasteAnalysisCardProps) {
  const { colors } = useTheme();

  if (!analysis || analysis.total_ratings === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
        <Text style={[styles.title, { color: colors.text_primary }]}>Analyse de tes goûts</Text>
        <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
          Note des vidéos pour découvrir ton profil de critique !
        </Text>
      </View>
    );
  }

  const maxDistValue = Math.max(...Object.values(analysis.rating_distribution), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <Text style={[styles.title, { color: colors.text_primary }]}>Analyse de tes goûts</Text>
      
      {/* Critic Type Card */}
      <View style={[styles.criticCard, { backgroundColor: colors.bg_overlay }]}>
        <Text style={styles.criticEmoji}>{analysis.critic_emoji}</Text>
        <View style={styles.criticInfo}>
          <Text style={[styles.criticLabel, { color: colors.text_secondary }]}>Tu es un critique</Text>
          <Text style={[styles.criticType, { color: colors.text_primary }]}>{analysis.critic_type}</Text>
        </View>
        <View style={styles.avgContainer}>
          <Text style={[styles.avgLabel, { color: colors.text_secondary }]}>Moyenne</Text>
          <Text style={[styles.avgValue, { color: colors.primary }]}>{analysis.average_rating}/5</Text>
        </View>
      </View>

      {/* Favorite Genres */}
      {analysis.favorite_genres.length > 0 && (
        <View style={styles.genresSection}>
          <Text style={[styles.sectionLabel, { color: colors.text_secondary }]}>Genres préférés</Text>
          <View style={styles.genresTags}>
            {analysis.favorite_genres.map((genre, index) => (
              <View
                key={genre.name}
                style={[
                  styles.genreTag,
                  { backgroundColor: index === 0 ? colors.primary + '30' : colors.bg_overlay }
                ]}
              >
                <Text style={[
                  styles.genreText,
                  { color: index === 0 ? colors.primary : colors.text_primary }
                ]}>
                  {genre.name}
                </Text>
                <Text style={[styles.genreCount, { color: colors.text_secondary }]}>
                  {genre.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Rating Distribution */}
      <View style={styles.distributionSection}>
        <Text style={[styles.sectionLabel, { color: colors.text_secondary }]}>
          Distribution ({analysis.total_ratings} notes)
        </Text>
        <View style={styles.bars}>
          {['1', '2', '3', '4', '5'].map((rating) => {
            const count = (analysis.rating_distribution[rating] || 0) + 
                         (analysis.rating_distribution[`${rating}.5`] || 0);
            const height = (count / maxDistValue) * 40;
            return (
              <View key={rating} style={styles.barContainer}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 4),
                      backgroundColor: count > 0 ? colors.primary : colors.bg_overlay,
                    },
                  ]}
                />
                <Text style={[styles.barLabel, { color: colors.text_secondary }]}>{rating}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  criticCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  criticEmoji: {
    fontSize: 36,
    marginRight: 12,
  },
  criticInfo: {
    flex: 1,
  },
  criticLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  criticType: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  avgContainer: {
    alignItems: 'flex-end',
  },
  avgLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
  },
  avgValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
  },
  genresSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  genresTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  genreText: {
    fontSize: 13,
    fontWeight: '600',
  },
  genreCount: {
    fontSize: 11,
  },
  distributionSection: {},
  bars: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 60,
    marginTop: 4,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  barLabel: {
    fontSize: 11,
  },
});
