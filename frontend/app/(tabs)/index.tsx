import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import VideoCard from '../../src/components/VideoCard';

type TabType = 'friends' | 'discover';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  const [friendsFeed, setFriendsFeed] = useState<any[]>([]);
  const [discoverFeed, setDiscoverFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      const [friends, discover] = await Promise.all([
        apiCall('/api/videos/feed').catch(() => []),
        apiCall('/api/videos/discover').catch(() => []),
      ]);
      setFriendsFeed(friends);
      setDiscoverFeed(discover);
    } catch (e) {
      console.error('Feed error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const onRefresh = () => { setRefreshing(true); fetchFeed(); };

  const data = activeTab === 'friends' ? friendsFeed : discoverFeed;

  const renderEmpty = () => (
    <View style={styles.empty}>
      <MaterialCommunityIcons
        name={activeTab === 'friends' ? 'account-group-outline' : 'movie-open-outline'}
        size={64}
        color={colors.text_secondary}
      />
      <Text style={[styles.emptyTitle, { color: colors.text_primary }]}>
        {activeTab === 'friends' ? 'Aucune activité' : 'Aucune vidéo'}
      </Text>
      <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
        {activeTab === 'friends'
          ? 'Ajoutez des amis et notez des vidéos pour voir leur activité ici'
          : 'Soyez le premier à noter une vidéo !'}
      </Text>
      <TouchableOpacity
        testID="empty-add-video-btn"
        style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/(tabs)/add')}
      >
        <Text style={styles.emptyBtnText}>
          {activeTab === 'friends' ? 'Ajouter une vidéo' : 'Noter une vidéo'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="home-screen">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Social Cinema</Text>
        <MaterialCommunityIcons name="movie-open-star" size={28} color={colors.primary} />
      </View>

      <View style={[styles.tabBar, { backgroundColor: colors.bg_card }]}>
        <TouchableOpacity
          testID="tab-friends"
          style={[styles.tab, activeTab === 'friends' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'friends' ? colors.primary : colors.text_secondary }]}>
            Amis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="tab-discover"
          style={[styles.tab, activeTab === 'discover' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'discover' ? colors.primary : colors.text_secondary }]}>
            Découvrir
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.rating_id}
        renderItem={({ item }) => (
          <VideoCard
            rating={item}
            onPress={() => router.push(`/video/${item.rating_id}`)}
          />
        )}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, borderRadius: 12, marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabText: { fontSize: 15, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 15, textAlign: 'center', marginTop: 8, lineHeight: 22 },
  emptyBtn: { borderRadius: 100, paddingVertical: 14, paddingHorizontal: 28, marginTop: 24 },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
