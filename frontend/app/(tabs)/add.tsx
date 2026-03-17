import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

export default function AddVideoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const extractYoutubeId = (ytUrl: string) => {
    const patterns = [
      /(?:v=|\/v\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
      /(?:embed\/)([a-zA-Z0-9_-]{11})/,
      /(?:shorts\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = ytUrl.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const handlePreview = () => {
    const id = extractYoutubeId(url);
    if (!id) {
      Alert.alert('Erreur', 'URL YouTube invalide');
      return;
    }
    setPreview({
      youtube_id: id,
      thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    });
  };

  const handleSubmit = async () => {
    if (!url || rating === 0) {
      Alert.alert('Erreur', 'Ajoutez une URL et une note');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('/api/videos/rate', {
        method: 'POST',
        body: JSON.stringify({ youtube_url: url, rating, comment }),
      });
      Alert.alert('Succès', 'Vidéo notée avec succès !', [
        { text: 'OK', onPress: () => { setUrl(''); setRating(0); setComment(''); setPreview(null); router.push('/(tabs)'); } },
      ]);
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]} testID="add-video-screen">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Noter une vidéo</Text>
            <Text style={[styles.headerSub, { color: colors.text_secondary }]}>
              Collez un lien YouTube et partagez votre avis
            </Text>
          </View>

          <View style={[styles.urlRow, { backgroundColor: colors.bg_overlay, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="youtube" size={24} color="#FF0000" />
            <TextInput
              testID="youtube-url-input"
              style={[styles.urlInput, { color: colors.text_primary }]}
              placeholder="https://youtube.com/watch?v=..."
              placeholderTextColor={colors.text_secondary}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
            />
            <TouchableOpacity
              testID="preview-btn"
              onPress={handlePreview}
              style={[styles.previewBtn, { backgroundColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="eye" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {preview && (
            <View style={[styles.previewCard, { backgroundColor: colors.bg_card }]}>
              <Image source={{ uri: preview.thumbnail }} style={styles.previewThumb} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
              </View>
            </View>
          )}

          <View style={styles.ratingSection}>
            <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>Votre note</Text>
            <Text style={[styles.sectionSub, { color: colors.text_secondary }]}>
              Glissez votre doigt sur les étoiles (demi-étoiles possibles)
            </Text>
            <View style={styles.ratingWrap}>
              <StarRating rating={rating} onRate={setRating} size={44} />
              {rating > 0 && (
                <Text style={[styles.ratingLabel, { color: colors.primary }]}>
                  {rating % 1 === 0 ? rating : rating.toFixed(1)}/5
                </Text>
              )}
            </View>
          </View>

          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>Commentaire</Text>
            <TextInput
              testID="video-comment-input"
              style={[styles.commentInput, { backgroundColor: colors.bg_overlay, color: colors.text_primary, borderColor: colors.border }]}
              placeholder="Partagez votre avis sur cette vidéo..."
              placeholderTextColor={colors.text_secondary}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            testID="submit-rating-btn"
            style={[styles.submitBtn, { backgroundColor: rating > 0 ? colors.primary : colors.bg_overlay }]}
            onPress={handleSubmit}
            disabled={submitting || rating === 0}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check-circle" size={22} color={rating > 0 ? '#fff' : colors.text_secondary} />
                <Text style={[styles.submitText, { color: rating > 0 ? '#fff' : colors.text_secondary }]}>
                  Publier ma note
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 15, marginTop: 4 },
  urlRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10,
  },
  urlInput: { flex: 1, fontSize: 15 },
  previewBtn: { borderRadius: 8, padding: 8 },
  previewCard: {
    borderRadius: 12, overflow: 'hidden', marginTop: 16, position: 'relative',
  },
  previewThumb: { width: '100%', aspectRatio: 16 / 9 },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  ratingSection: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  sectionSub: { fontSize: 13, marginBottom: 12 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ratingLabel: { fontSize: 24, fontWeight: '800' },
  commentSection: { marginTop: 24 },
  commentInput: {
    borderRadius: 12, padding: 16, borderWidth: 1, fontSize: 15,
    minHeight: 100, marginTop: 8,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 100, paddingVertical: 16, marginTop: 24, gap: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700' },
});
