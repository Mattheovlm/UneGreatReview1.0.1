import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

interface BadgeDisplayProps {
  badges: Badge[];
  compact?: boolean;
}

export default function BadgeDisplay({ badges, compact = false }: BadgeDisplayProps) {
  const { colors } = useTheme();

  if (!badges || badges.length === 0) return null;

  if (compact) {
    return (
      <View style={styles.compactRow}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.compactBadge, { backgroundColor: colors.bg_overlay }]}
          >
            <Text style={styles.compactEmoji}>{badge.emoji}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg_card }]}>
      <Text style={[styles.title, { color: colors.text_primary }]}>Badges</Text>
      <View style={styles.badgeList}>
        {badges.map((badge) => (
          <View
            key={badge.id}
            style={[styles.badgeItem, { backgroundColor: colors.bg_overlay }]}
          >
            <Text style={styles.emoji}>{badge.emoji}</Text>
            <View style={styles.badgeInfo}>
              <Text style={[styles.badgeName, { color: colors.text_primary }]}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeDesc, { color: colors.text_secondary }]}>
                {badge.description}
              </Text>
            </View>
          </View>
        ))}
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
  badgeList: {
    gap: 10,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  emoji: {
    fontSize: 28,
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '600',
  },
  badgeDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  // Compact styles
  compactRow: {
    flexDirection: 'row',
    gap: 6,
  },
  compactBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactEmoji: {
    fontSize: 16,
  },
});
