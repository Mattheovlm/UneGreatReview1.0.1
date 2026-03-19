import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiCall } from '../../src/utils/api';
import FloatingTabBar from '../../src/components/FloatingTabBar';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const [playlist, setPlaylist] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const data = await apiCall(`/api/playlists/${id}`);
      setPlaylist(data);
    } catch (e) {
      console.error('Playlist fetch error:', e);
    }
    setLoading(false);
  };

  const handleRemoveVideo = async (youtubeId: string) => {
    Alert.alert(
      'Retirer la vidéo',
      'Voulez-vous retirer cette vidéo de la playlist ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/api/playlists/${id}/videos/${youtubeId}`, { method: 'DELETE' });
              setPlaylist((prev: any) => ({
                ...prev,
                videos: prev.videos.filter((v: any) => v.youtube_id !== youtubeId),
                video_count: prev.video_count - 1,
              }));
            } catch (e) {
              console.error('Remove video error:', e);
            }
          },
        },
      ]
    );
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      'Supprimer la playlist',
      'Cette action est irréversible. Continuer ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiCall(`/api/playlists/${id}`, { method: 'DELETE' });
              router.back();
            } catch (e) {
              console.error('Delete playlist error:', e);
            }
          },
        },
      ]
    );
  };

  const isOwner = playlist?.user_id === user?.user_id;

  const renderVideo = ({ item }: { item: any }) => (
    <View style={[styles.videoItem, { backgroundColor: colors.bg_card }]}>
      <Image source={{ uri: item.thumbnail }} style={styles.videoThumb} resizeMode="cover" />
      <View style={styles.videoInfo}>
        <Text style={[styles.videoTitle, { color: colors.text_primary }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.videoChannel, { color: colors.text_secondary }]} numberOfLines={1}>
          {item.channel_name}
        </Text>
      </View>
      {isOwner && (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveVideo(item.youtube_id)}
        >
          <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!playlist) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Playlist non trouvée</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="playlist-detail-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text_primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text_primary }]} numberOfLines={1}>
            {playlist.name}
          </Text>
          <Text style={[styles.headerSub, { color: colors.text_secondary }]}>
            {playlist.video_count} vidéo{playlist.video_count !== 1 ? 's' : ''}
          </Text>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={handleDeletePlaylist} style={styles.deleteBtn}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        )}
      </View>

      {playlist.description ? (
        <Text style={[styles.description, { color: colors.text_secondary }]}>
          {playlist.description}
        </Text>
      ) : null}

      <FlatList
        data={playlist.videos || []}
        keyExtractor={(item) => item.youtube_id}
        renderItem={renderVideo}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="playlist-music" size={48} color={colors.text_secondary} />
            <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
              Cette playlist est vide
            </Text>
          </View>
        }
      />
      <FloatingTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center' },
  errorText: { fontSize: 16, textAlign: 'center', marginTop: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  deleteBtn: { padding: 4 },
  description: { paddingHorizontal: 20, marginBottom: 12, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  videoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    paddingRight: 8,
  },
  videoThumb: { width: 100, height: 56, borderRadius: 8, margin: 8 },
  videoInfo: { flex: 1, paddingVertical: 8, paddingRight: 4 },
  videoTitle: { fontSize: 13, fontWeight: '600', lineHeight: 17 },
  videoChannel: { fontSize: 11, marginTop: 2 },
  removeBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, marginTop: 12, textAlign: 'center' },
});
