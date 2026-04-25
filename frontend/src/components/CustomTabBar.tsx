import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api';

const TAB_CONFIG: Record<string, { label: string; iconActive: string; iconInactive: string; isCenter?: boolean }> = {
  index:    { label: 'Accueil',   iconActive: 'home-variant',        iconInactive: 'home-variant-outline' },
  search:   { label: 'Recherche', iconActive: 'magnify',             iconInactive: 'magnify' },
  add:      { label: '',          iconActive: 'plus',                iconInactive: 'plus', isCenter: true },
  activity: { label: 'Activité',  iconActive: 'heart',               iconInactive: 'heart-outline' },
  profile:  { label: 'Profil',    iconActive: 'account-circle',      iconInactive: 'account-circle-outline' },
};

const TAB_ORDER = ['index', 'search', 'add', 'activity', 'profile'];

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  // Safe bottom: on iOS use real inset (min 20px), on Android add fixed padding
  const bottomPadding = Platform.select({
    ios: Math.max(insets.bottom, 20),
    android: Math.max(insets.bottom, 16) + 8,
    default: 8,
  });

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const data = await apiCall('/api/notifications/unread-count');
        if (mounted) setUnreadCount(data?.count || 0);
      } catch (e) { /* ignore */ }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const sortedRoutes = [...state.routes].sort((a: any, b: any) =>
    TAB_ORDER.indexOf(a.name) - TAB_ORDER.indexOf(b.name)
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg_card,
          borderTopColor: colors.border,
          paddingBottom: bottomPadding,
        },
      ]}
      testID="custom-tab-bar"
    >
      {sortedRoutes.map((route: any) => {
        const config = TAB_CONFIG[route.name];
        if (!config) return null;

        const isFocused = state.routes[state.index]?.name === route.name;
        const showBadge = route.name === 'activity' && unreadCount > 0;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (config.isCenter) {
          return (
            <Pressable
              key={route.key}
              testID="tab-add-btn"
              onPress={onPress}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            key={route.key}
            testID={`tab-${route.name}-btn`}
            onPress={onPress}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.6, backgroundColor: colors.bg_overlay },
            ]}
          >
            <View style={styles.iconWrap}>
              <MaterialCommunityIcons
                name={isFocused ? config.iconActive : config.iconInactive}
                size={26}
                color={isFocused ? colors.primary : colors.text_secondary}
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
                {
                  color: isFocused ? colors.primary : colors.text_secondary,
                  fontWeight: isFocused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {config.label}
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
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 60,
    borderRadius: 8,
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
    fontSize: 11,
    marginTop: 4,
  },
  centerTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 60,
  },
  centerBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
});
