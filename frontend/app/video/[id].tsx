import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [detail, recos] = await Promise.all([
          apiCall(`/api/videos/${id}`),
          apiCall('/api/videos/discover?limit=6').catch(() => []),
        ]);
        setVideo(detail);
        const filtered = Array.isArray(recos) ? recos.filter((r: any) => r.rating_id !== id) : [];
        setRecommendations(filtered.slice(0, 5));
      } catch (e) {
        console.error('Video detail error:', e);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await apiCall(`/api/videos/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text: commentText }),
      });
      setVideo((prev: any) => ({
        ...prev,
        comments: [newComment, ...(prev.comments || [])],
      }));
      setCommentText('');
    } catch (e) {
      console.error('Comment error:', e);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => router.back()} />
        <View style={[styles.modal, { backgroundColor: colors.bg_root }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!video) {
    return (
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={() => router.back()} />
        <View style={[styles.modal, { backgroundColor: colors.bg_root }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>Vidéo introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.overlay} testID="video-detail-screen">
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalWrap}
      >
        <View style={[styles.modal, { backgroundColor: colors.bg_root }]}>
          <View style={[styles.handle, { backgroundColor: colors.text_secondary }]} />

          <TouchableOpacity testID="close-modal-btn" style={styles.closeBtn} onPress={() => router.back()}>
            <MaterialCommunityIcons name="close" size={24} color={colors.text_secondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Image source={{ uri: video.thumbnail }} style={styles.thumbnail} resizeMode="cover" />

            <View style={styles.content}>
              <Text style={[styles.title, { color: colors.text_primary }]}>{video.title}</Text>
              <Text style={[styles.channel, { color: colors.text_secondary }]}>{video.channel_name}</Text>

              <View style={styles.raterRow}>
                {video.user?.picture ? (
                  <Image source={{ uri: video.user.picture }} style={styles.raterAvatar} />
                ) : (
                  <View style={[styles.raterAvatar, { backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={styles.raterLetter}>{video.user?.name?.[0]?.toUpperCase()}</Text>
                  </View>
                )}
                <View style={styles.raterInfo}>
                  <Text style={[styles.raterName, { color: colors.text_primary }]}>
                    {video.user?.name}
                  </Text>
                  <StarRating rating={video.rating} size={18} interactive={false} />
                </View>
                <View style={[styles.ratingBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.ratingBadgeText, { color: colors.primary }]}>
                    {video.rating}/5
                  </Text>
                </View>
              </View>

              {video.comment ? (
                <View style={[styles.commentBubble, { backgroundColor: colors.bg_card }]}>
                  <Text style={[styles.commentBubbleText, { color: colors.text_primary }]}>
                    "{video.comment}"
                  </Text>
                </View>
              ) : null}

              <View style={[styles.addCommentRow, { borderColor: colors.border }]}>
                <TextInput
                  testID="add-comment-input"
                  style={[styles.commentInput, { color: colors.text_primary, backgroundColor: colors.bg_overlay }]}
                  placeholder="Réagir à cet avis..."
                  placeholderTextColor={colors.text_secondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <TouchableOpacity
                  testID="submit-comment-btn"
                  style={[styles.sendBtn, { backgroundColor: commentText.trim() ? colors.primary : colors.bg_overlay }]}
                  onPress={handleComment}
                  disabled={!commentText.trim() || submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="send" size={20} color={commentText.trim() ? '#fff' : colors.text_secondary} />
                  )}
                </TouchableOpacity>
              </View>

              {video.comments && video.comments.length > 0 && (
                <View style={styles.commentsSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>
                    Réactions ({video.comments.length})
                  </Text>
                  {video.comments.map((c: any) => (
                    <View key={c.comment_id} style={[styles.commentItem, { backgroundColor: colors.bg_card }]}>
                      <View style={styles.commentHeader}>
                        {c.user?.picture ? (
                          <Image source={{ uri: c.user.picture }} style={styles.commentAvatar} />
                        ) : (
                          <View style={[styles.commentAvatar, { backgroundColor: colors.bg_overlay, justifyContent: 'center', alignItems: 'center' }]}>
                            <MaterialCommunityIcons name="account" size={14} color={colors.text_secondary} />
                          </View>
                        )}
                        <Text style={[styles.commentAuthor, { color: colors.text_primary }]}>
                          {c.user?.name || 'Utilisateur'}
                        </Text>
                      </View>
                      <Text style={[styles.commentText, { color: colors.text_secondary }]}>{c.text}</Text>
                    </View>
                  ))}
                </View>
              )}

              {recommendations.length > 0 && (
                <View style={styles.recoSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>
                    Recommandations
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {recommendations.map((rec: any) => (
                      <TouchableOpacity
                        key={rec.rating_id}
                        testID={`reco-${rec.rating_id}`}
                        style={[styles.recoCard, { backgroundColor: colors.bg_card }]}
                        onPress={() => {
                          router.back();
                          setTimeout(() => router.push(`/video/${rec.rating_id}`), 300);
                        }}
                      >
                        <Image source={{ uri: rec.thumbnail }} style={styles.recoThumb} resizeMode="cover" />
                        <Text style={[styles.recoTitle, { color: colors.text_primary }]} numberOfLines={2}>
                          {rec.title}
                        </Text>
                        <View style={styles.recoRating}>
                          <MaterialCommunityIcons name="star" size={12} color={colors.primary} />
                          <Text style={[styles.recoRatingText, { color: colors.text_secondary }]}>
                            {rec.rating}/5
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalWrap: { maxHeight: '90%' },
  modal: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    minHeight: 400, maxHeight: '100%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 4,
  },
  closeBtn: { position: 'absolute', top: 12, right: 16, zIndex: 10 },
  scrollContent: { paddingBottom: 32 },
  thumbnail: { width: '100%', aspectRatio: 16 / 9 },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  channel: { fontSize: 14, marginBottom: 16 },
  raterRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  raterAvatar: { width: 40, height: 40, borderRadius: 20 },
  raterLetter: { color: '#fff', fontSize: 18, fontWeight: '700' },
  raterInfo: { marginLeft: 12, flex: 1 },
  raterName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  ratingBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  ratingBadgeText: { fontSize: 14, fontWeight: '700' },
  commentBubble: { borderRadius: 12, padding: 14, marginBottom: 16 },
  commentBubbleText: { fontSize: 15, fontStyle: 'italic', lineHeight: 22 },
  addCommentRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  commentInput: {
    flex: 1, borderRadius: 12, padding: 12, fontSize: 14, minHeight: 44, maxHeight: 80,
  },
  sendBtn: { borderRadius: 12, width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  commentsSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  commentItem: { borderRadius: 10, padding: 12, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  commentAvatar: { width: 24, height: 24, borderRadius: 12 },
  commentAuthor: { fontSize: 13, fontWeight: '600', marginLeft: 8 },
  commentText: { fontSize: 14, lineHeight: 20 },
  recoSection: { marginTop: 8 },
  recoCard: { width: 150, borderRadius: 10, overflow: 'hidden', marginRight: 10 },
  recoThumb: { width: 150, height: 84 },
  recoTitle: { fontSize: 12, fontWeight: '600', padding: 8, paddingBottom: 4 },
  recoRating: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, gap: 4 },
  recoRatingText: { fontSize: 11 },
  errorText: { fontSize: 16, textAlign: 'center' },
});
