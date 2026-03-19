import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface ControversialVideo {
  rating_id: string;
  youtube_id: string;
  title: string;
  thumbnail: string;
  channel_name: string;
  gap: number;
  max_rating: number;
  min_rating: number;
  avg_rating: number;
  rating_count: number;
}

interface ControversialBannerProps {
  videos: ControversialVideo[];
}

export default function ControversialBanner({ videos }: ControversialBannerProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!videos || videos.length === 0) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="fire" size={20} color="#EF4444" />
        <Text style={[styles.title, { color: colors.text_primary }]}>Ça fait débat</Text>
        <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
          Les plus controversées
        </Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {videos.map((video) => (
          <TouchableOpacity
            key={video.youtube_id}
            testID={`controversial-${video.youtube_id}`}
            style={styles.videoCard}
            onPress={() => router.push(`/video/${video.rating_id}`)}
            activeOpacity={0.8}
          >
            <View style={styles.thumbnailWrap}>
              <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
              
              {/* Gap badge */}
              <View style={[styles.gapBadge, { backgroundColor: '#EF4444' }]}>
                <MaterialCommunityIcons name="sword-cross" size={10} color="#fff" />
                <Text style={styles.gapText}>{video.gap}⭐ écart</Text>
              </View>
            </View>

            {/* Rating comparison */}
            <View style={styles.ratingsRow}>
              <View style={[styles.ratingPill, { backgroundColor: '#10B981' + '30' }]}>
                <Text style={[styles.ratingPillText, { color: '#10B981' }]}>
                  {video.max_rating}
                </Text>
              </View>
              <Text style={[styles.vsLabel, { color: colors.text_secondary }]}>vs</Text>
              <View style={[styles.ratingPill, { backgroundColor: '#EF4444' + '30' }]}>
                <Text style={[styles.ratingPillText, { color: '#EF4444' }]}>
                  {video.min_rating}
                </Text>
              </View>
            </View>

            <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
              {video.title}
            </Text>
            <Text style={[styles.videoMeta, { color: colors.text_secondary }]} numberOfLines={1}>
              {video.rating_count} avis • moy. {video.avg_rating}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginLeft: 'auto',
  },
  list: {
    gap: 12,
  },
  videoCard: {
    width: 150,
  },
  thumbnailWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 150,
    height: 84,
    borderRadius: 10,
  },
  gapBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  gapText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  ratingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  ratingPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingPillText: {
    fontSize: 13,
    fontWeight: '800',
  },
  vsLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 15,
  },
  videoMeta: {
    fontSize: 10,
    marginTop: 2,
  },
});
