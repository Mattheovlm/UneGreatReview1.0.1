import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
  Animated, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../src/contexts/ThemeContext';
import { apiCall } from '../../src/utils/api';
import StarRating from '../../src/components/StarRating';

export default function AddVideoScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // URL state
  const [url, setUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Success modal state
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Animation for preview card
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Debounce timer ref
  const debounceTimer = useRef<any>(null);

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

  // Auto-fetch video info when URL changes
  const fetchVideoInfo = useCallback(async (videoUrl: string) => {
    const id = extractYoutubeId(videoUrl);
    if (!id) {
      setPreview(null);
      setFetchError(null);
      return;
    }
    
    setFetchingInfo(true);
    setFetchError(null);
    
    try {
      const response = await apiCall(`/api/videos/fetch-info?url=${encodeURIComponent(videoUrl)}`);
      if (response.success) {
        setPreview({
          youtube_id: response.youtube_id,
          title: response.title,
          thumbnail: response.thumbnail,
          channel_name: response.channel_name,
        });
        // Animate the preview card
        fadeAnim.setValue(0);
        slideAnim.setValue(20);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        setFetchError(response.error || 'Impossible de récupérer les informations');
        setPreview(null);
      }
    } catch (e: any) {
      setFetchError('Erreur lors de la récupération');
      setPreview(null);
    }
    setFetchingInfo(false);
  }, [fadeAnim, slideAnim]);

  // Debounced URL change handler
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    if (url.trim().length > 10) {
      debounceTimer.current = setTimeout(() => {
        fetchVideoInfo(url);
      }, 500);
    } else {
      setPreview(null);
      setFetchError(null);
    }
    
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [url, fetchVideoInfo]);

  const handleSubmit = async () => {
    const videoToSubmit = preview;
    if (!videoToSubmit || rating === 0) {
      Alert.alert('Erreur', 'Sélectionnez une vidéo et une note');
      return;
    }
    setSubmitting(true);
    try {
      await apiCall('/api/videos/rate', {
        method: 'POST',
        body: JSON.stringify({
          youtube_url: `https://www.youtube.com/watch?v=${videoToSubmit.youtube_id}`,
          rating,
          comment,
        }),
      });
      
      // Reset form
      setUrl('');
      setRating(0);
      setComment('');
      setPreview(null);
      setSubmitting(false);
      
      // Show success modal
      setShowSuccess(true);
      
    } catch (e: any) {
      Alert.alert('Erreur', e.message || 'Impossible de noter la vidéo');
      setSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.replace('/(tabs)');
  };

  const currentVideo = preview;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg_root }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text_primary }]}>Noter une vidéo</Text>
            <Text style={[styles.headerSub, { color: colors.text_secondary }]}>
              Collez un lien YouTube pour noter la vidéo
            </Text>
          </View>

              <View
                style={[styles.urlRow, { backgroundColor: colors.bg_card, borderColor: colors.border }]}
              >
                <MaterialCommunityIcons name="youtube" size={24} color="#FF0000" />
                <TextInput
                  testID="youtube-url-input"
                  style={[styles.urlInput, { color: colors.text_primary }]}
                  placeholder="Collez le lien YouTube ici..."
                  placeholderTextColor={colors.text_secondary}
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {url.length > 0 && (
                  <TouchableOpacity onPress={() => { setUrl(''); setPreview(null); }}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.text_secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Loading indicator */}
              {fetchingInfo && (
                <View style={[styles.fetchingContainer, { backgroundColor: colors.bg_card }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.fetchingText, { color: colors.text_secondary }]}>
                    Récupération des informations...
                  </Text>
                </View>
              )}

              {/* Fetch error */}
              {fetchError && !fetchingInfo && (
                <View style={[styles.errorContainer, { backgroundColor: '#EF444420' }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{fetchError}</Text>
                </View>
              )}

              {/* Video preview card */}
              {currentVideo && !fetchingInfo && (
                <Animated.View 
                  style={[
                    styles.previewCard, 
                    { 
                      backgroundColor: colors.bg_card,
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }]
                    }
                  ]}
                >
                  <View style={styles.previewImageContainer}>
                    <Image source={{ uri: currentVideo.thumbnail }} style={styles.previewThumb} resizeMode="cover" />
                    <View style={styles.previewOverlay}>
                      <MaterialCommunityIcons name="play-circle" size={48} color="rgba(255,255,255,0.9)" />
                    </View>
                    <View style={styles.youtubeTag}>
                      <MaterialCommunityIcons name="youtube" size={14} color="#FF0000" />
                      <Text style={styles.youtubeTagText}>YouTube</Text>
                    </View>
                  </View>
                  
                  <View style={styles.previewInfo}>
                    <Text style={[styles.previewTitle, { color: colors.text_primary }]} numberOfLines={2}>
                      {currentVideo.title}
                    </Text>
                    <View style={styles.channelRow}>
                      <MaterialCommunityIcons name="account-circle" size={16} color={colors.text_secondary} />
                      <Text style={[styles.channelName, { color: colors.text_secondary }]} numberOfLines={1}>
                        {currentVideo.channel_name}
                      </Text>
                    </View>
                    <View style={[styles.successBadge, { backgroundColor: colors.primary + '20' }]}>
                      <MaterialCommunityIcons name="check-circle" size={14} color={colors.primary} />
                      <Text style={[styles.successBadgeText, { color: colors.primary }]}>
                        Vidéo sélectionnée - Prête à noter !
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Rating Section */}
              {currentVideo && (
                <>
                  <View style={styles.ratingSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>Votre note</Text>
                    <Text style={[styles.sectionSub, { color: colors.text_secondary }]}>
                      Tapez sur les étoiles pour noter
                    </Text>
                    <View style={styles.ratingWrap}>
                      <StarRating rating={rating} onRate={setRating} size={36} />
                      {rating > 0 && (
                        <Text style={[styles.ratingLabel, { color: colors.primary }]}>
                          {rating % 1 === 0 ? rating : rating.toFixed(1)}/5
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.commentSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text_primary }]}>
                      Commentaire (optionnel)
                    </Text>
                    <TextInput
                      testID="comment-input"
                      style={[
                        styles.commentInput,
                        { color: colors.text_primary, backgroundColor: colors.bg_card, borderColor: colors.border },
                      ]}
                      placeholder="Partagez votre avis..."
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
                    disabled={rating === 0 || submitting}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
                        <Text style={styles.submitText}>Publier ma note</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Success Modal */}
      <Modal
        visible={showSuccess}
        transparent
        animationType="fade"
        onRequestClose={handleSuccessClose}
      >
        <View style={styles.successModalOverlay}>
          <View style={[styles.successModalContent, { backgroundColor: colors.bg_card }]}>
            <View style={[styles.successIconCircle, { backgroundColor: '#22c55e20' }]}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#22c55e" />
            </View>
            <Text style={[styles.successTitle, { color: colors.text_primary }]}>
              Avis publié !
            </Text>
            <Text style={[styles.successText, { color: colors.text_secondary }]}>
              Votre note a été partagée avec vos amis.
            </Text>
            <TouchableOpacity
              style={[styles.successBtn, { backgroundColor: colors.primary }]}
              onPress={handleSuccessClose}
            >
              <Text style={styles.successBtnText}>Retour à l'accueil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { fontSize: 15, marginTop: 4 },
  
  // URL Input
  urlRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, gap: 10,
  },
  urlInput: { flex: 1, fontSize: 15 },
  
  // Fetching indicator
  fetchingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 16,
    borderRadius: 12,
    gap: 10,
  },
  fetchingText: {
    fontSize: 14,
  },
  
  // Error container
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 16,
    borderRadius: 10,
    gap: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  
  // Preview card
  previewCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 16,
  },
  previewImageContainer: {
    position: 'relative',
  },
  previewThumb: { 
    width: '100%', 
    aspectRatio: 16 / 9,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  youtubeTag: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  youtubeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#333',
  },
  previewInfo: {
    padding: 14,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    marginBottom: 8,
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  channelName: {
    fontSize: 13,
    flex: 1,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '600',
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
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  
  // Success Modal
  successModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalContent: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  successIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 8,
  },
  successText: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  successBtn: {
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 24,
  },
  successBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
