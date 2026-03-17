import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  StyleSheet, SafeAreaView, ActivityIndicator, Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

type SearchTab = 'videos' | 'users';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('videos');
  const [videos, setVideos] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    Keyboard.dismiss();
    setLoading(true);
    setSearched(true);
    try {
      const [videoRes, userRes] = await Promise.all([
        apiCall(`/api/videos/search?q=${encodeURIComponent(query)}`).catch(() => []),
        apiCall(`/api/users/search?q=${encodeURIComponent(query)}`).catch(() => []),
      ]);
      setVideos(videoRes);
      setUsers(userRes);
    } catch (e) {
      console.error('Search error:', e);
    }
    setLoading(false);
  };

  const clearSearch = () => {
    setQuery('');
    setVideos([]);
    setUsers([]);
    setSearched(false);
    inputRef.current?.focus();
  };

  const renderVideo = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`search-video-${item.rating_id}`}
      style={[styles.videoItem, { backgroundColor: colors.bg_card }]}
      onPress={() => router.push(`/video/${item.rating_id}`)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      <View style={[styles.videoBadge, { backgroundColor: colors.primary }]}>
        <MaterialCommunityIcons name="star" size={10} color="#fff" />
        <Text style={styles.videoBadgeText}>{item.rating}</Text>
      </View>
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.videoChannel, { color: colors.text_secondary }]} numberOfLines={1}>
          {item.channel_name}
        </Text>
        <View style={styles.videoBottom}>
          <StarRating rating={item.rating} size={14} interactive={false} />
          {item.user?.name ? (
            <Text style={[styles.videoUser, { color: colors.text_secondary }]} numberOfLines={1}>
              par {item.user.name}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`search-user-${item.user_id}`}
      style={[styles.userItem, { backgroundColor: colors.bg_card }]}
      onPress={() => router.push(`/user/${item.user_id}`)}
      activeOpacity={0.7}
    >
      {item.picture ? (
        <Image source={{ uri: item.picture }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.userAvatarLetter}>{item.name?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text_primary }]}>{item.name}</Text>
        <Text style={[styles.userEmail, { color: colors.text_secondary }]}>{item.email}</Text>
      </View>
      <View style={[styles.userArrow, { backgroundColor: colors.bg_overlay }]}>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text_secondary} />
      </View>
    </TouchableOpacity>
  );

  const data = tab === 'videos' ? videos : users;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="search-screen">
      {/* Search bar header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.bg_root }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.bg_card, borderColor: colors.border }]}>
          <TouchableOpacity testID="search-icon-btn" onPress={handleSearch} style={styles.searchIconBtn}>
            <MaterialCommunityIcons name="magnify" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            ref={inputRef}
            testID="search-input"
            style={[styles.searchInput, { color: colors.text_primary }]}
            placeholder="Rechercher vidéos, utilisateurs..."
            placeholderTextColor={colors.text_secondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoFocus={false}
          />
          {query ? (
            <TouchableOpacity testID="clear-search-btn" onPress={clearSearch} style={styles.clearBtn}>
              <MaterialCommunityIcons name="close-circle" size={22} color={colors.text_secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tabs: Vidéos / Utilisateurs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="search-tab-videos"
          style={[styles.tab, tab === 'videos' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setTab('videos')}
        >
          <MaterialCommunityIcons
            name="movie-outline"
            size={18}
            color={tab === 'videos' ? colors.primary : colors.text_secondary}
          />
          <Text style={[styles.tabText, { color: tab === 'videos' ? colors.primary : colors.text_secondary }]}>
            Vidéos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="search-tab-users"
          style={[styles.tab, tab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setTab('users')}
        >
          <MaterialCommunityIcons
            name="account-search-outline"
            size={18}
            color={tab === 'users' ? colors.primary : colors.text_secondary}
          />
          <Text style={[styles.tabText, { color: tab === 'users' ? colors.primary : colors.text_secondary }]}>
            Utilisateurs
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.rating_id || item.user_id}
          renderItem={tab === 'videos' ? renderVideo : renderUser}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name={searched ? 'emoticon-sad-outline' : 'magnify'}
                size={64}
                color={colors.text_secondary}
              />
              <Text style={[styles.emptyTitle, { color: colors.text_primary }]}>
                {searched ? 'Aucun résultat' : 'Rechercher'}
              </Text>
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                {searched
                  ? `Aucun résultat pour "${query}"`
                  : 'Trouvez des vidéos notées ou des utilisateurs à suivre'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchHeader: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16,
    paddingHorizontal: 4, height: 52, borderWidth: 1.5,
  },
  searchIconBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clearBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, borderBottomWidth: 1, marginBottom: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  loader: { marginTop: 60 },
  videoItem: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative',
  },
  videoThumb: { width: 130, height: 74 },
  videoBadge: {
    position: 'absolute', top: 6, left: 6, borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 2, gap: 2,
  },
  videoBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 3 },
  videoTitle: { fontSize: 14, fontWeight: '600', lineHeight: 18 },
  videoChannel: { fontSize: 12 },
  videoBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  videoUser: { fontSize: 11 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 10, gap: 14,
  },
  userAvatar: { width: 52, height: 52, borderRadius: 26 },
  userAvatarLetter: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13, marginTop: 2 },
  userArrow: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
