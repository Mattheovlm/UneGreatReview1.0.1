import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import StarRating from './StarRating';

interface DuelRating {
  rating_id: string;
  rating: number;
  comment?: string;
  user?: {
    user_id: string;
    name: string;
    picture?: string;
  };
}

interface CriticsDuelProps {
  highest: DuelRating;
  lowest: DuelRating;
  gap: number;
  totalRatings: number;
  onUserPress?: (userId: string) => void;
}

export default function CriticsDuel({ highest, lowest, gap, totalRatings, onUserPress }: CriticsDuelProps) {
  const { colors } = useTheme();

  const renderSide = (rating: DuelRating, type: 'pro' | 'anti') => {
    const isPro = type === 'pro';
    const bgColor = isPro ? '#10B981' + '20' : '#EF4444' + '20';
    const textColor = isPro ? '#10B981' : '#EF4444';
    const label = isPro ? 'PRO' : 'ANTI';
    const icon = isPro ? 'thumb-up' : 'thumb-down';

    return (
      <TouchableOpacity
        style={[styles.side, { backgroundColor: bgColor }]}
        onPress={() => rating.user && onUserPress?.(rating.user.user_id)}
        activeOpacity={0.7}
      >
        <View style={styles.sideHeader}>
          <MaterialCommunityIcons name={icon} size={16} color={textColor} />
          <Text style={[styles.sideLabel, { color: textColor }]}>{label}</Text>
        </View>
        
        <View style={styles.userRow}>
          {rating.user?.picture ? (
            <Image source={{ uri: rating.user.picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.bg_overlay, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ color: colors.text_primary, fontWeight: '700' }}>
                {rating.user?.name?.[0]?.toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={[styles.userName, { color: colors.text_primary }]} numberOfLines={1}>
            {rating.user?.name || 'Anonyme'}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <Text style={[styles.ratingValue, { color: textColor }]}>
            {rating.rating % 1 === 0 ? rating.rating : rating.rating.toFixed(1)}/5
          </Text>
          <StarRating rating={rating.rating} size={14} interactive={false} color={textColor} />
        </View>

        {rating.comment && (
          <Text style={[styles.comment, { color: colors.text_secondary }]} numberOfLines={3}>
            "{rating.comment}"
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="sword-cross" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.text_primary }]}>Le Face-à-Face</Text>
        <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
          {totalRatings} avis • écart de {gap} ⭐
        </Text>
      </View>

      <View style={styles.duelContainer}>
        {renderSide(highest, 'pro')}
        
        {/* VS Badge */}
        <View style={[styles.vsBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.vsText}>VS</Text>
        </View>
        
        {renderSide(lowest, 'anti')}
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
  duelContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
  },
  side: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
  },
  sideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  sideLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  userName: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ratingValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  comment: {
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 15,
  },
  vsBadge: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -20,
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  vsText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
});
