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
  rating: number;
  like_count: number;
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

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
        <Text style={[styles.title, { color: colors.text_primary }]}>Top 3 de la semaine</Text>
      </View>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {videos.map((video, index) => (
          <TouchableOpacity
            key={video.rating_id}
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
              <View style={[styles.likeBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="heart" size={10} color="#fff" />
                <Text style={styles.likeCount}>{video.like_count || 0}</Text>
              </View>
            </View>
            <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
              {video.title}
            </Text>
            {video.user && (
              <Text style={[styles.userName, { color: colors.text_secondary }]} numberOfLines={1}>
                par {video.user.name}
              </Text>
            )}
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
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  videoCard: {
    width: 120,
  },
  thumbnailWrap: {
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  thumbnail: {
    width: 120,
    height: 68,
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
  likeBadge: {
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
  likeCount: {
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
  userName: {
    fontSize: 10,
    marginTop: 2,
  },
});
