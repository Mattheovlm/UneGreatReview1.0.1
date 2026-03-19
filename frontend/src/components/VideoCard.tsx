import React, { useState, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StarRating from './StarRating';

interface VideoCardProps {
  rating: any;
  onPress: () => void;
}

export default function VideoCard({ rating, onPress }: VideoCardProps) {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return 'maintenant';
    if (diff < 3600) return `${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}j`;
  };

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setIsHovered(true);
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    setIsHovered(false);
  };

  return (
    <Animated.View
      style={[
        styles.cardWrapper,
        { transform: [{ scale: scaleAnim }] },
      ]}
    >
      <TouchableOpacity
        testID={`video-card-${rating.rating_id}`}
        style={[styles.card, { backgroundColor: colors.bg_card }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {/* Thumbnail with glassmorphism overlay on hover */}
        <View style={styles.thumbnailWrap}>
          <Image
            source={{ uri: rating.thumbnail }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
          {/* Play overlay on hover */}
          <Animated.View
            style={[
              styles.playOverlay,
              { opacity: opacityAnim },
            ]}
          >
            <View style={styles.playButton}>
              <MaterialCommunityIcons name="play" size={32} color="#fff" />
            </View>
          </Animated.View>
        </View>
        
        {/* Rating badge with glassmorphism */}
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={14} color="#E11D48" />
          <Text style={styles.ratingText}>
            {rating.avg_rating 
              ? (rating.avg_rating % 1 === 0 ? rating.avg_rating : rating.avg_rating.toFixed(1))
              : (rating.rating % 1 === 0 ? rating.rating : rating.rating.toFixed(1))}/5
          </Text>
        </View>
        
        {/* Rating count badge - show if multiple ratings */}
        {(rating.rating_count || 0) > 1 && (
          <View style={[styles.ratingCountBadge, { backgroundColor: colors.secondary }]}>
            <MaterialCommunityIcons name="account-group" size={12} color="#fff" />
            <Text style={styles.ratingCountText}>{rating.rating_count} avis</Text>
          </View>
        )}
        
        {/* Like count badge */}
        {(rating.like_count || 0) > 0 && (
          <View style={[styles.likeBadge, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="heart" size={12} color="#fff" />
            <Text style={styles.likeText}>{rating.like_count}</Text>
          </View>
        )}
        
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
            <StarRating rating={rating.rating} size={16} interactive={false} showValue />
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  thumbnailWrap: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.75)',
    backdropFilter: 'blur(10px)',
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
  likeBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  likeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  ratingCountBadge: {
    position: 'absolute',
    top: 48,
    right: 12,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  ratingCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
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
