import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';

interface TopVideo {
  rating_id: string;
  youtube_id: string;
  title: string;
  thumbnail: string;
  avg_rating?: number;
  rating?: number;
  rating_count?: number;
  like_count?: number;
  user?: {
    name: string;
    picture?: string;
  };
}

interface TopWeekBannerProps {
  videos: TopVideo[];
}

export default function TopWeekBanner({ videos }: TopWeekBannerProps) {
  const { colors } = useTheme();
  const router = useRouter();

  if (!videos || videos.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
        <Text style={[styles.title, { color: colors.text_primary }]}>Top de la semaine</Text>
        <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
          Meilleures notes
        </Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {videos.slice(0, 5).map((video, index) => {
          const displayRating = video.avg_rating || video.rating || 0;
          return (
            <TouchableOpacity
              key={video.rating_id || video.youtube_id}
              testID={`top-video-${index}`}
              style={styles.videoCard}
              onPress={() => router.push(`/video/${video.rating_id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.thumbnailWrap}>
                <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />
                <View style={styles.medalBadge}>
                  <Text style={styles.medalEmoji}>{medals[index]}</Text>
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
                  <MaterialCommunityIcons name="star" size={10} color="#fff" />
                  <Text style={styles.ratingText}>
                    {typeof displayRating === 'number' ? displayRating.toFixed(1) : displayRating}
                  </Text>
                </View>
              </View>
              <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
                {video.title}
              </Text>
              <View style={styles.metaRow}>
                {video.rating_count && video.rating_count > 1 && (
                  <Text style={[styles.metaText, { color: colors.text_secondary }]}>
                    {video.rating_count} avis
                  </Text>
                )}
                {video.user && (
                  <Text style={[styles.userName, { color: colors.text_secondary }]} numberOfLines={1}>
                    par {video.user.name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
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
    width: 130,
  },
  thumbnailWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 130,
    height: 73,
    borderRadius: 10,
  },
  medalBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
  },
  medalEmoji: {
    fontSize: 18,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 2,
  },
  ratingText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
  },
  userName: {
    fontSize: 10,
    flex: 1,
  },
});
