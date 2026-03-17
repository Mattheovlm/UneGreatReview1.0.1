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
                <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
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
              size={24}
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
