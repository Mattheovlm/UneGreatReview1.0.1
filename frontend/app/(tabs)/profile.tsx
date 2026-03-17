import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity, TextInput, StyleSheet,
  SafeAreaView, ActivityIndicator, Modal, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

export default function ProfileScreen() {
  const { user, refreshUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [videos, setVideos] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saving, setSaving] = useState(false);

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

  const openEdit = () => {
    setEditName(user?.name || '');
    setEditBio(user?.bio || '');
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!editName.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    setSaving(true);
    try {
      await apiCall('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify({ name: editName.trim(), bio: editBio.trim() }),
      });
      await refreshUser();
      setEditModal(false);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setSaving(false);
  };

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
        <Text style={[styles.videoChannel, { color: colors.text_secondary }]} numberOfLines={1}>
          {item.channel_name}
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

                <TouchableOpacity
                  testID="edit-profile-btn"
                  style={[styles.editBtn, { backgroundColor: colors.bg_overlay }]}
                  onPress={openEdit}
                >
                  <MaterialCommunityIcons name="pencil" size={16} color={colors.text_primary} />
                  <Text style={[styles.editBtnText, { color: colors.text_primary }]}>Modifier le profil</Text>
                </TouchableOpacity>

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

              {friends.length > 0 && (
                <View style={styles.friendsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>Mes amis</Text>
                  <FlatList
                    horizontal
                    data={friends}
                    keyExtractor={(item) => item.user_id}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        testID={`friend-${item.user_id}`}
                        style={styles.friendChip}
                        onPress={() => router.push(`/user/${item.user_id}`)}
                      >
                        {item.picture ? (
                          <Image source={{ uri: item.picture }} style={styles.friendAvatar} />
                        ) : (
                          <View style={[styles.friendAvatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={styles.friendLetter}>{item.name?.[0]?.toUpperCase()}</Text>
                          </View>
                        )}
                        <Text style={[styles.friendName, { color: colors.text_primary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

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
            <TouchableOpacity
              testID="profile-add-video-btn"
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/(tabs)/add')}
            >
              <Text style={styles.emptyBtnText}>Noter ma première vidéo</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Edit Profile Modal */}
      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.editCard, { backgroundColor: colors.bg_root }]}>
              <View style={styles.editHeader}>
                <Text style={[styles.editTitle, { color: colors.text_primary }]}>Modifier le profil</Text>
                <TouchableOpacity testID="close-edit-btn" onPress={() => setEditModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color={colors.text_secondary} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.editLabel, { color: colors.text_secondary }]}>Nom</Text>
              <TextInput
                testID="edit-name-input"
                style={[styles.editInput, { color: colors.text_primary, backgroundColor: colors.bg_overlay, borderColor: colors.border }]}
                value={editName}
                onChangeText={setEditName}
                placeholder="Votre nom"
                placeholderTextColor={colors.text_secondary}
              />

              <Text style={[styles.editLabel, { color: colors.text_secondary }]}>Bio</Text>
              <TextInput
                testID="edit-bio-input"
                style={[styles.editInput, styles.editBioInput, { color: colors.text_primary, backgroundColor: colors.bg_overlay, borderColor: colors.border }]}
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Décrivez-vous en quelques mots..."
                placeholderTextColor={colors.text_secondary}
                multiline
                textAlignVertical="top"
              />

              <TouchableOpacity
                testID="save-profile-btn"
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>Enregistrer</Text>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
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
  bio: { fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 100,
    paddingVertical: 8, paddingHorizontal: 16, marginTop: 12, gap: 6,
  },
  editBtnText: { fontSize: 13, fontWeight: '600' },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 24 },
  stat: { alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 13, marginTop: 2 },
  statDivider: { width: 1, height: 32 },
  friendsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  friendChip: { alignItems: 'center', marginRight: 16, width: 64 },
  friendAvatar: { width: 52, height: 52, borderRadius: 26 },
  friendLetter: { color: '#fff', fontSize: 20, fontWeight: '700' },
  friendName: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  videoItem: {
    flexDirection: 'row', borderRadius: 12, overflow: 'hidden', marginBottom: 10,
  },
  videoThumb: { width: 120, height: 68 },
  videoInfo: { flex: 1, padding: 10, justifyContent: 'center', gap: 2 },
  videoTitle: { fontSize: 14, fontWeight: '600' },
  videoChannel: { fontSize: 12 },
  empty: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 15, marginTop: 12 },
  emptyBtn: { borderRadius: 100, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  // Edit Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20,
  },
  editCard: { borderRadius: 20, padding: 24 },
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  editTitle: { fontSize: 20, fontWeight: '700' },
  editLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
  editInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  editBioInput: { minHeight: 80, maxHeight: 120 },
  saveBtn: { borderRadius: 100, paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
