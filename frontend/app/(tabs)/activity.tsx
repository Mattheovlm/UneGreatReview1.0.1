import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';

export default function ActivityScreen() {
  const { colors } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiCall('/api/friends/requests');
      setRequests(res);
    } catch (e) {
      console.error('Fetch requests error:', e);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    try {
      await apiCall(`/api/friends/accept/${requestId}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (e: any) {
      console.error('Accept error:', e);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await apiCall(`/api/friends/decline/${requestId}`, { method: 'POST' });
      setRequests((prev) => prev.filter((r) => r.request_id !== requestId));
    } catch (e: any) {
      console.error('Decline error:', e);
    }
  };

  const renderRequest = ({ item }: { item: any }) => (
    <View style={[styles.requestCard, { backgroundColor: colors.bg_card }]} testID={`friend-request-${item.request_id}`}>
      <View style={styles.requestRow}>
        {item.from_user?.picture ? (
          <Image source={{ uri: item.from_user.picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: colors.bg_overlay, justifyContent: 'center', alignItems: 'center' }]}>
            <MaterialCommunityIcons name="account" size={20} color={colors.text_secondary} />
          </View>
        )}
        <View style={styles.requestInfo}>
          <Text style={[styles.requestName, { color: colors.text_primary }]}>
            {item.from_user?.name || 'Utilisateur'}
          </Text>
          <Text style={[styles.requestText, { color: colors.text_secondary }]}>
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
          <MaterialCommunityIcons name="check" size={20} color="#fff" />
          <Text style={styles.acceptText}>Accepter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID={`decline-request-${item.request_id}`}
          style={[styles.declineBtn, { backgroundColor: colors.bg_overlay }]}
          onPress={() => handleDecline(item.request_id)}
        >
          <MaterialCommunityIcons name="close" size={20} color={colors.text_secondary} />
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

      <FlatList
        data={requests}
        keyExtractor={(item) => item.request_id}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRequests(); }} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="heart-outline" size={64} color={colors.text_secondary} />
            <Text style={[styles.emptyTitle, { color: colors.text_primary }]}>Aucune demande</Text>
            <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
              Les demandes d'amis apparaîtront ici
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
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  requestCard: { borderRadius: 12, padding: 16, marginBottom: 12 },
  requestRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  requestInfo: { marginLeft: 12, flex: 1 },
  requestName: { fontSize: 16, fontWeight: '700' },
  requestText: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 10 },
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
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyText: { fontSize: 15, marginTop: 8 },
});
