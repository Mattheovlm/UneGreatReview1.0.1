import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';
import FloatingTabBar from '../../src/components/FloatingTabBar';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [friendStatus, setFriendStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userData, userVideos, status] = await Promise.all([
          apiCall(`/api/users/${id}`),
          apiCall(`/api/videos/user/${id}`).catch(() => []),
          apiCall(`/api/friends/status/${id}`).catch(() => ({ status: 'none' })),
        ]);
        setProfile(userData);
        setVideos(userVideos);
        setFriendStatus(status);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleFriendAction = async () => {
    setActionLoading(true);
    try {
      if (friendStatus?.status === 'none') {
        await apiCall('/api/friends/request', {
          method: 'POST',
          body: JSON.stringify({ to_user_id: id }),
        });
        setFriendStatus({ status: 'pending_sent' });
      } else if (friendStatus?.status === 'pending_received') {
        await apiCall(`/api/friends/accept/${friendStatus.request_id}`, { method: 'POST' });
        setFriendStatus({ status: 'friends' });
      }
    } catch (e: any) { console.error(e); }
    setActionLoading(false);
  };

  const getFriendBtnText = () => {
    switch (friendStatus?.status) {
      case 'friends': return 'Amis';
      case 'pending_sent': return 'Demande envoyée';
      case 'pending_received': return 'Accepter la demande';
      default: return 'Ajouter en ami';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Utilisateur introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="user-profile-screen">
      <FlatList
        data={videos}
        keyExtractor={(item) => item.rating_id}
        renderItem={({ item }) => (
          <TouchableOpacity
            testID={`user-video-${item.rating_id}`}
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
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <TouchableOpacity testID="back-btn" style={styles.backBtn} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
            </TouchableOpacity>

            <View style={[styles.profileCard, { backgroundColor: colors.bg_card }]}>
              {profile.picture ? (
                <Image source={{ uri: profile.picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={styles.avatarLetter}>{profile.name?.[0]?.toUpperCase()}</Text>
                </View>
              )}
              <Text style={[styles.name, { color: colors.text_primary }]}>{profile.name}</Text>
              {profile.bio ? (
                <Text style={[styles.bio, { color: colors.text_secondary }]}>{profile.bio}</Text>
              ) : null}

              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: colors.primary }]}>{profile.video_count || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text_secondary }]}>Vidéos</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.stat}>
                  <Text style={[styles.statNum, { color: colors.primary }]}>{profile.friends_count || 0}</Text>
                  <Text style={[styles.statLabel, { color: colors.text_secondary }]}>Amis</Text>
                </View>
              </View>

              {currentUser?.user_id !== id && (
                <TouchableOpacity
                  testID="friend-action-btn"
                  style={[
                    styles.friendBtn,
                    {
                      backgroundColor: friendStatus?.status === 'friends' ? colors.bg_overlay
                        : friendStatus?.status === 'pending_sent' ? colors.bg_overlay
                        : colors.primary,
                    },
                  ]}
                  onPress={handleFriendAction}
                  disabled={actionLoading || friendStatus?.status === 'friends' || friendStatus?.status === 'pending_sent'}
                >
                  {actionLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name={friendStatus?.status === 'friends' ? 'account-check' : 'account-plus'}
                        size={20}
                        color={friendStatus?.status === 'friends' || friendStatus?.status === 'pending_sent' ? colors.text_secondary : '#fff'}
                      />
                      <Text style={[
                        styles.friendBtnText,
                        { color: friendStatus?.status === 'friends' || friendStatus?.status === 'pending_sent' ? colors.text_secondary : '#fff' },
                      ]}>
                        {getFriendBtnText()}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>
              Vidéos notées
            </Text>
          </View>
        }
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
            Aucune vidéo notée
          </Text>
        }
      />
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  backBtn: { paddingTop: 12, paddingHorizontal: 4, paddingBottom: 8, width: 48 },
  profileCard: {
    borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20,
  },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarLetter: { color: '#fff', fontSize: 32, fontWeight: '800' },
  name: { fontSize: 22, fontWeight: '700', marginTop: 12 },
  bio: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 24 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  friendBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 100,
    paddingVertical: 10, paddingHorizontal: 24, marginTop: 16, gap: 8,
  },
  friendBtnText: { fontSize: 15, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  videoItem: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 10,
  },
  videoThumb: { width: 120, height: 68 },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 4 },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  errorText: { textAlign: 'center', marginTop: 80, fontSize: 16 },
});
