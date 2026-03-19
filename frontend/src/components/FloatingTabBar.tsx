import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api';

// Tab configuration
const TABS = [
  { name: 'index', route: '/(tabs)', label: 'Accueil', iconActive: 'home-variant', iconInactive: 'home-variant-outline' },
  { name: 'search', route: '/(tabs)/search', label: 'Recherche', iconActive: 'magnify', iconInactive: 'magnify' },
  { name: 'add', route: '/(tabs)/add', label: '', iconActive: 'plus', iconInactive: 'plus', isCenter: true },
  { name: 'activity', route: '/(tabs)/activity', label: 'Activité', iconActive: 'heart', iconInactive: 'heart-outline' },
  { name: 'profile', route: '/(tabs)/profile', label: 'Profil', iconActive: 'account-circle', iconInactive: 'account-circle-outline' },
];

export default function FloatingTabBar() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await apiCall('/api/notifications/unread-count');
        setUnreadCount(data?.count || 0);
      } catch (e) {
        // Ignore errors
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);
  
  const safeBottom = Platform.select({
    ios: Math.max(insets.bottom, 34) + 10,
    android: 40,
    default: 32,
  });

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg_card,
          borderTopColor: colors.border,
          paddingBottom: safeBottom,
        },
      ]}
    >
      {TABS.map((tab) => {
        const showBadge = tab.name === 'activity' && unreadCount > 0;

        if (tab.isCenter) {
          return (
            <Pressable
              key={tab.name}
              onPress={() => handlePress(tab.route)}
              style={({ pressed }) => [
                styles.centerTabWrap,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.centerBtn, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.name}
            onPress={() => handlePress(tab.route)}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.6, backgroundColor: colors.bg_overlay },
            ]}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={tab.iconInactive as any}
                size={24}
                color={colors.text_secondary}
              />
              {showBadge && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color: colors.text_secondary, fontWeight: '500' },
              ]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'stretch',
    elevation: 20,
    zIndex: 999,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 6,
    minHeight: 56,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  centerTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 6,
    minHeight: 56,
  },
  centerBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
});
