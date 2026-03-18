import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api';

interface AddToPlaylistModalProps {
  visible: boolean;
  onClose: () => void;
  video: {
    youtube_id: string;
    title: string;
    thumbnail: string;
    channel_name?: string;
  } | null;
}

export default function AddToPlaylistModal({ visible, onClose, video }: AddToPlaylistModalProps) {
  const { colors } = useTheme();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchPlaylists();
    }
  }, [visible]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/api/playlists');
      setPlaylists(data);
    } catch (e) {
      console.error('Fetch playlists error:', e);
    }
    setLoading(false);
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!video || adding) return;
    setAdding(playlistId);
    try {
      await apiCall(`/api/playlists/${playlistId}/videos`, {
        method: 'POST',
        body: JSON.stringify({
          youtube_id: video.youtube_id,
          title: video.title,
          thumbnail: video.thumbnail,
          channel_name: video.channel_name || '',
        }),
      });
      // Update local state to reflect the addition
      setPlaylists(prev => prev.map(p => 
        p.playlist_id === playlistId 
          ? { ...p, video_count: p.video_count + 1 }
          : p
      ));
      onClose();
    } catch (e: any) {
      // Show error but don't close - user might want to try another playlist
      console.error('Add to playlist error:', e);
    }
    setAdding(null);
  };

  const renderPlaylist = ({ item }: { item: any }) => {
    const isAdding = adding === item.playlist_id;
    return (
      <TouchableOpacity
        style={[styles.playlistItem, { backgroundColor: colors.bg_card }]}
        onPress={() => handleAddToPlaylist(item.playlist_id)}
        disabled={!!adding}
        activeOpacity={0.7}
      >
        <View style={[styles.playlistIcon, { backgroundColor: colors.primary + '20' }]}>
          <MaterialCommunityIcons name="playlist-play" size={24} color={colors.primary} />
        </View>
        <View style={styles.playlistInfo}>
          <Text style={[styles.playlistName, { color: colors.text_primary }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.playlistCount, { color: colors.text_secondary }]}>
            {item.video_count} vidéo{item.video_count !== 1 ? 's' : ''}
          </Text>
        </View>
        {isAdding ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bg_root }]}>
          <View style={[styles.handle, { backgroundColor: colors.text_secondary }]} />
          
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text_primary }]}>
              Ajouter à une playlist
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text_secondary} />
            </TouchableOpacity>
          </View>

          {video && (
            <Text style={[styles.videoTitle, { color: colors.text_secondary }]} numberOfLines={2}>
              {video.title}
            </Text>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
          ) : playlists.length === 0 ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="playlist-plus" size={48} color={colors.text_secondary} />
              <Text style={[styles.emptyText, { color: colors.text_secondary }]}>
                Vous n'avez pas encore de playlist
              </Text>
              <Text style={[styles.emptyHint, { color: colors.text_secondary }]}>
                Créez-en une depuis votre profil !
              </Text>
            </View>
          ) : (
            <FlatList
              data={playlists}
              keyExtractor={(item) => item.playlist_id}
              renderItem={renderPlaylist}
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  videoTitle: {
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  loader: {
    marginTop: 40,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  playlistIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 15,
    fontWeight: '600',
  },
  playlistCount: {
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 4,
    opacity: 0.7,
  },
});
