import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Image,
  StyleSheet, SafeAreaView, ActivityIndicator,
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

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      if (tab === 'videos') {
        const res = await apiCall(`/api/videos/search?q=${encodeURIComponent(query)}`);
        setVideos(res);
      } else {
        const res = await apiCall(`/api/users/search?q=${encodeURIComponent(query)}`);
        setUsers(res);
      }
    } catch (e) {
      console.error('Search error:', e);
    }
    setLoading(false);
  };

  const renderVideo = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`search-video-${item.rating_id}`}
      style={[styles.videoItem, { backgroundColor: colors.bg_card }]}
      onPress={() => router.push(`/video/${item.rating_id}`)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.videoChannel, { color: colors.text_secondary }]}>{item.channel_name}</Text>
        <StarRating rating={item.rating} size={14} interactive={false} />
      </View>
    </TouchableOpacity>
  );

  const renderUser = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`search-user-${item.user_id}`}
      style={[styles.userItem, { backgroundColor: colors.bg_card }]}
      onPress={() => router.push(`/user/${item.user_id}`)}
    >
      {item.picture ? (
        <Image source={{ uri: item.picture }} style={styles.userAvatar} />
      ) : (
        <View style={[styles.userAvatar, { backgroundColor: colors.bg_overlay, justifyContent: 'center', alignItems: 'center' }]}>
          <MaterialCommunityIcons name="account" size={24} color={colors.text_secondary} />
        </View>
      )}
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: colors.text_primary }]}>{item.name}</Text>
        <Text style={[styles.userEmail, { color: colors.text_secondary }]}>{item.email}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text_secondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="search-screen">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Recherche</Text>
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.text_secondary} />
        <TextInput
          testID="search-input"
          style={[styles.searchInput, { color: colors.text_primary }]}
          placeholder={tab === 'videos' ? 'Rechercher des vidéos...' : 'Rechercher des utilisateurs...'}
          placeholderTextColor={colors.text_secondary}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {query ? (
          <TouchableOpacity onPress={() => { setQuery(''); setVideos([]); setUsers([]); }} testID="clear-search">
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.text_secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.bg_card }]}>
        <TouchableOpacity
          testID="search-tab-videos"
          style={[styles.tab, tab === 'videos' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('videos')}
        >
          <Text style={[styles.tabText, { color: tab === 'videos' ? colors.primary : colors.text_secondary }]}>
            Vidéos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="search-tab-users"
          style={[styles.tab, tab === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('users')}
        >
          <Text style={[styles.tabText, { color: tab === 'users' ? colors.primary : colors.text_secondary }]}>
            Utilisateurs
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : tab === 'videos' ? (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.rating_id}
          renderItem={renderVideo}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>Aucun résultat</Text>
            ) : (
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                Tapez pour rechercher des vidéos notées
              </Text>
            )
          }
        />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            query ? (
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>Aucun utilisateur trouvé</Text>
            ) : (
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                Recherchez des utilisateurs pour les ajouter en amis
              </Text>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 16,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontSize: 16 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  loader: { marginTop: 40 },
  videoItem: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 10,
  },
  videoThumb: { width: 120, height: 68 },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 2 },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  videoChannel: { fontSize: 12 },
  userItem: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12,
  },
  userAvatar: { width: 48, height: 48, borderRadius: 24 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600' },
  userEmail: { fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 60, fontSize: 15 },
});
