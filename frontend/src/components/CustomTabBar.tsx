import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';

const TAB_CONFIG = [
  { name: 'index', label: 'Accueil', iconActive: 'home-variant', iconInactive: 'home-variant-outline' },
  { name: 'search', label: 'Recherche', iconActive: 'magnify', iconInactive: 'magnify' },
  { name: 'add', label: '', iconActive: 'plus', iconInactive: 'plus', isCenter: true },
  { name: 'activity', label: 'Activité', iconActive: 'heart', iconInactive: 'heart-outline' },
  { name: 'profile', label: 'Profil', iconActive: 'account-circle', iconInactive: 'account-circle-outline' },
];

export default function CustomTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Safe bottom padding: ensure tab bar is well above the phone's system UI
  // Minimum 40px on all platforms, plus safe area inset on iOS
  const safeBottom = Platform.select({
    ios: Math.max(insets.bottom, 34) + 10,
    android: 40,
    default: 32,
  });

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
      testID="custom-tab-bar"
    >
      {state.routes.map((route: any, index: number) => {
        const config = TAB_CONFIG[index];
        if (!config) return null;

        const isFocused = state.index === index;

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
              style={({ pressed }) => [
                styles.centerTabWrap,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View style={[styles.centerBtn, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
              </View>
            </Pressable>
          );
        }

        return (
          <Pressable
            key={route.key}
            testID={`tab-${config.name}-btn`}
            onPress={onPress}
            style={({ pressed }) => [
              styles.tabItem,
              pressed && { opacity: 0.6, backgroundColor: colors.bg_overlay },
            ]}
          >
            <MaterialCommunityIcons
              name={isFocused ? config.iconActive : config.iconInactive}
              size={26}
              color={isFocused ? colors.primary : colors.text_secondary}
            />
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
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 64,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 4,
  },
  centerTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 8,
    minHeight: 64,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
});
