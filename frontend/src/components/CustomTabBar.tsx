import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
  const bottomPad = Math.max(insets.bottom, 12);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg_card,
          borderTopColor: colors.border,
          paddingBottom: bottomPad,
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
            <TouchableOpacity
              key={route.key}
              testID="tab-add-btn"
              onPress={onPress}
              activeOpacity={0.7}
              style={styles.centerTabWrap}
            >
              <View style={[styles.centerBtn, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="plus" size={32} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            testID={`tab-${config.name}-btn`}
            onPress={onPress}
            activeOpacity={0.6}
            style={styles.tabItem}
          >
            <MaterialCommunityIcons
              name={isFocused ? config.iconActive : config.iconInactive}
              size={26}
              color={isFocused ? colors.primary : colors.text_secondary}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.text_secondary },
              ]}
            >
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    alignItems: 'flex-end',
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
    fontWeight: '700',
    marginTop: 4,
  },
  centerTabWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    minHeight: 64,
  },
  centerBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -16,
  },
});
