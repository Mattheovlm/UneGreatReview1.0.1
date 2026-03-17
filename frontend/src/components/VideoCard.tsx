import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StarRating from './StarRating';

interface VideoCardProps {
  rating: any;
  onPress: () => void;
}

export default function VideoCard({ rating, onPress }: VideoCardProps) {
  const { colors } = useTheme();

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'maintenant';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  return (
    <TouchableOpacity
      testID={`video-card-${rating.rating_id}`}
      style={[styles.card, { backgroundColor: colors.bg_card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: rating.thumbnail }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      <View style={styles.ratingBadge}>
        <MaterialCommunityIcons name="star" size={14} color="#E11D48" />
        <Text style={styles.ratingText}>{rating.rating}/5</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.userRow}>
          {rating.user?.picture ? (
            <Image source={{ uri: rating.user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.bg_overlay, justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="account" size={16} color={colors.text_secondary} />
            </View>
          )}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text_primary }]} numberOfLines={1}>
              {rating.user?.name || 'Utilisateur'}
            </Text>
            <Text style={[styles.timeAgo, { color: colors.text_secondary }]}>
              {timeAgo(rating.created_at)}
            </Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text_primary }]} numberOfLines={2}>
          {rating.title}
        </Text>
        <Text style={[styles.channel, { color: colors.text_secondary }]} numberOfLines={1}>
          {rating.channel_name}
        </Text>
        <View style={styles.bottomRow}>
          <StarRating rating={rating.rating} size={16} interactive={false} />
          {rating.comment ? (
            <Text style={[styles.comment, { color: colors.text_secondary }]} numberOfLines={2}>
              "{rating.comment}"
            </Text>
          ) : null}
        </View>
        {rating.comment_count > 0 && (
          <View style={styles.commentCount}>
            <MaterialCommunityIcons name="comment-outline" size={14} color={colors.text_secondary} />
            <Text style={[styles.commentCountText, { color: colors.text_secondary }]}>
              {rating.comment_count} réaction{rating.comment_count > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  ratingText: {
    color: '#FAFAFA',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    padding: 14,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
  },
  timeAgo: {
    fontSize: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  channel: {
    fontSize: 13,
    marginBottom: 8,
  },
  bottomRow: {
    gap: 6,
  },
  comment: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 4,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  commentCountText: {
    fontSize: 12,
  },
});
