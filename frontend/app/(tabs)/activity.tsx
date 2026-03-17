import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

type ActivityTab = 'activity' | 'requests';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [tab, setTab] = useState<ActivityTab>('activity');
  const [activities, setActivities] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [actRes, reqRes] = await Promise.all([
        apiCall('/api/friends/activity').catch(() => []),
        apiCall('/api/friends/requests').catch(() => []),
      ]);
      setActivities(actRes);
      setRequests(reqRes);
    } catch (e) {
      console.error('Activity error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAccept = async (requestId: string) => {
    try {
      await apiCall(`/api/friends/accept/${requestId}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (e) { console.error(e); }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await apiCall(`/api/friends/decline/${requestId}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (e) { console.error(e); }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "à l'instant";
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)}min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)}h`;
    return `il y a ${Math.floor(diff / 86400)}j`;
  };

  const renderActivity = ({ item }: { item: any }) => {
    if (item.type === 'rating') {
      return (
        <TouchableOpacity
          testID={`activity-rating-${item.rating_id}`}
          style={[styles.activityCard, { backgroundColor: colors.bg_card }]}
          onPress={() => router.push(`/video/${item.rating_id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.activityHeader}>
            {item.user?.picture ? (
              <Image source={{ uri: item.user.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.avatarLetter}>{item.user?.name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.activityInfo}>
              <Text style={[styles.activityText, { color: colors.text_primary }]}>
                <Text style={styles.bold}>{item.user?.name}</Text> a noté une vidéo
              </Text>
              <Text style={[styles.activityTime, { color: colors.text_secondary }]}>
                {timeAgo(item.created_at)}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.primary + '20' }]}>
              <MaterialCommunityIcons name="star" size={14} color={colors.primary} />
            </View>
          </View>

          <View style={styles.videoPreview}>
            <Image source={{ uri: item.thumbnail }} style={styles.previewThumb} resizeMode="cover" />
            <View style={styles.previewInfo}>
              <Text style={[styles.previewTitle, { color: colors.text_primary }]} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={[styles.previewChannel, { color: colors.text_secondary }]} numberOfLines={1}>
                {item.channel_name}
              </Text>
              <StarRating rating={item.rating} size={14} interactive={false} />
            </View>
          </View>

          {item.comment ? (
            <Text style={[styles.activityComment, { color: colors.text_secondary }]} numberOfLines={2}>
              "{item.comment}"
            </Text>
          ) : null}
        </TouchableOpacity>
      );
    }

    if (item.type === 'comment') {
      return (
        <TouchableOpacity
          testID={`activity-comment-${item.comment_id}`}
          style={[styles.activityCard, { backgroundColor: colors.bg_card }]}
          onPress={() => router.push(`/video/${item.rating_id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.activityHeader}>
            {item.user?.picture ? (
              <Image source={{ uri: item.user.picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={styles.avatarLetter}>{item.user?.name?.[0]?.toUpperCase()}</Text>
              </View>
            )}
            <View style={styles.activityInfo}>
              <Text style={[styles.activityText, { color: colors.text_primary }]}>
                <Text style={styles.bold}>{item.user?.name}</Text> a commenté
              </Text>
              <Text style={[styles.activityTime, { color: colors.text_secondary }]}>
                {timeAgo(item.created_at)}
              </Text>
            </View>
            <View style={[styles.typeBadge, { backgroundColor: colors.info + '20' }]}>
              <MaterialCommunityIcons name="comment-text-outline" size={14} color={colors.info} />
            </View>
          </View>

          <View style={[styles.commentBubble, { backgroundColor: colors.bg_overlay }]}>
            <Text style={[styles.commentText, { color: colors.text_primary }]}>"{item.text}"</Text>
          </View>

          {item.video_thumbnail ? (
            <View style={styles.videoPreviewSmall}>
              <Image source={{ uri: item.video_thumbnail }} style={styles.previewThumbSmall} resizeMode="cover" />
              <Text style={[styles.previewTitleSmall, { color: colors.text_secondary }]} numberOfLines={1}>
                {item.video_title}
              </Text>
            </View>
          ) : null}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderRequest = ({ item }: { item: any }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.bg_card }]} testID={`friend-request-${item.request_id}`}>
      <View style={styles.activityHeader}>
        {item.from_user?.picture ? (
          <Image source={{ uri: item.from_user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
            <Text style={styles.avatarLetter}>{item.from_user?.name?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.activityInfo}>
          <Text style={[styles.activityText, { color: colors.text_primary }]}>
            <Text style={styles.bold}>{item.from_user?.name || 'Utilisateur'}</Text>
          </Text>
          <Text style={[styles.activityTime, { color: colors.text_secondary }]}>
            veut devenir votre ami
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          testID={`accept-request-${item.request_id}`}
          style={[styles.acceptBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleAccept(item.request_id)}
        >
          <MaterialCommunityIcons name="check" size={18} color="#fff" />
          <Text style={styles.acceptText}>Accepter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`decline-request-${item.request_id}`}
          style={[styles.declineBtn, { backgroundColor: colors.bg_overlay }]}
          onPress={() => handleDecline(item.request_id)}
        >
          <MaterialCommunityIcons name="close" size={18} color={colors.text_secondary} />
          <Text style={[styles.declineText, { color: colors.text_secondary }]}>Refuser</Text>
        </TouchableOpacity>
      </View>
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="activity-screen">
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Activité</Text>
      </View>

      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          testID="activity-tab-feed"
          style={[styles.tab, tab === 'activity' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setTab('activity')}
        >
          <MaterialCommunityIcons
            name="lightning-bolt"
            size={18}
            color={tab === 'activity' ? colors.primary : colors.text_secondary}
          />
          <Text style={[styles.tabText, { color: tab === 'activity' ? colors.primary : colors.text_secondary }]}>
            Feed amis
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="activity-tab-requests"
          style={[styles.tab, tab === 'requests' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setTab('requests')}
        >
          <MaterialCommunityIcons
            name="account-plus-outline"
            size={18}
            color={tab === 'requests' ? colors.primary : colors.text_secondary}
          />
          <Text style={[styles.tabText, { color: tab === 'requests' ? colors.primary : colors.text_secondary }]}>
            Demandes{requests.length > 0 ? ` (${requests.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {tab === 'activity' ? (
        <FlatList
          data={activities}
          keyExtractor={(item, index) => `${item.type}-${item.rating_id || item.comment_id}-${index}`}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-group-outline" size={64} color={colors.text_secondary} />
              <Text style={[styles.emptyTitle, { color: colors.text_primary }]}>Pas encore d'activité</Text>
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                Ajoutez des amis pour voir leurs notes et commentaires ici
              </Text>
              <TouchableOpacity
                testID="go-search-from-activity"
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/search')}
              >
                <MaterialCommunityIcons name="magnify" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>Trouver des amis</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={(item) => item.request_id}
          renderItem={renderRequest}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="account-check-outline" size={64} color={colors.text_secondary} />
              <Text style={[styles.emptyTitle, { color: colors.text_primary }]}>Aucune demande</Text>
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                Les demandes d'amis apparaîtront ici
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
  loader: { flex: 1, justifyContent: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tabBar: {
    flexDirection: 'row', marginHorizontal: 16, borderBottomWidth: 1, marginBottom: 4,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  activityCard: { borderRadius: 14, padding: 14, marginBottom: 12 },
  activityHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarLetter: { color: '#fff', fontSize: 16, fontWeight: '700' },
  activityInfo: { flex: 1, marginLeft: 12 },
  activityText: { fontSize: 14, lineHeight: 18 },
  bold: { fontWeight: '700' },
  activityTime: { fontSize: 12, marginTop: 2 },
  typeBadge: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  videoPreview: {
    flexDirection: 'row', borderRadius: 10, overflow: 'hidden', marginBottom: 6,
  },
  previewThumb: { width: 110, height: 62 },
  previewInfo: { flex: 1, padding: 8, justifyContent: 'center', gap: 2 },
  previewTitle: { fontSize: 13, fontWeight: '600' },
  previewChannel: { fontSize: 11 },
  activityComment: { fontSize: 13, fontStyle: 'italic', marginTop: 4, lineHeight: 18 },
  commentBubble: { borderRadius: 10, padding: 12, marginBottom: 8 },
  commentText: { fontSize: 14, fontStyle: 'italic', lineHeight: 20 },
  videoPreviewSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  previewThumbSmall: { width: 48, height: 27, borderRadius: 4 },
  previewTitleSmall: { fontSize: 12, flex: 1 },
  requestCard: { borderRadius: 14, padding: 14, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  acceptBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, paddingVertical: 10, gap: 6,
  },
  acceptText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  declineBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, paddingVertical: 10, gap: 6,
  },
  declineText: { fontWeight: '600', fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 100,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 20, gap: 8,
  },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
});
