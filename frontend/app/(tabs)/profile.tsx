import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

export default function ProfileScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const [vids, frds] = await Promise.all([
          apiCall(`/api/videos/user/${user.user_id}`).catch(() => []),
          apiCall('/api/friends').catch(() => []),
        ]);
        setVideos(vids);
        setFriends(frds);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const renderVideo = ({ item }: { item: any }) => (
    <TouchableOpacity
      testID={`profile-video-${item.rating_id}`}
      style={[styles.videoItem, { backgroundColor: colors.bg_card }]}
      onPress={() => router.push(`/video/${item.rating_id}`)}
    >
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <StarRating rating={item.rating} size={14} interactive={false} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="profile-screen">
      <FlatList
        data={videos}
        keyExtractor={(item) => item.rating_id}
        renderItem={renderVideo}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Profil</Text>
                <TouchableOpacity testID="settings-btn" onPress={() => router.push('/settings')}>
                  <MaterialCommunityIcons name="cog-outline" size={26} color={colors.text_secondary} />
                </TouchableOpacity>
              </View>

              <View style={[styles.profileCard, { backgroundColor: colors.bg_card }]}>
                {user?.picture ? (
                  <Image source={{ uri: user.picture }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.avatarLetter}>{user?.name?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <Text style={[styles.name, { color: colors.text_primary }]}>{user?.name}</Text>
                <Text style={[styles.email, { color: colors.text_secondary }]}>{user?.email}</Text>
                {user?.bio ? (
                  <Text style={[styles.bio, { color: colors.text_secondary }]}>{user.bio}</Text>
                ) : null}

                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.primary }]}>{videos.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.text_secondary }]}>Vidéos</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statNum, { color: colors.primary }]}>{friends.length}</Text>
                    <Text style={[styles.statLabel, { color: colors.text_secondary }]}>Amis</Text>
                  </View>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>
                Mes vidéos notées
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="movie-open-outline" size={48} color={colors.text_secondary} />
            <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
              Vous n'avez pas encore noté de vidéo
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  header: { marginBottom: 8 },
  headerTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 12, paddingBottom: 8, paddingHorizontal: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  profileCard: {
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  email: { fontSize: 14, marginTop: 4 },
  bio: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 24 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  videoItem: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 10,
  },
  videoThumb: { width: 120, height: 68 },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 4 },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, marginTop: 12 },
});
