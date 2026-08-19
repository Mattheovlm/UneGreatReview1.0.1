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
import AddToPlaylistModal from '../../src/components/AddToPlaylistModal';

export default function AddVideoScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  // Mode: search by name/author (default) or paste URL
  const [mode, setMode] = useState<'search' | 'url'>('search');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Playlist (favoris) modal
  const [playlistModal, setPlaylistModal] = useState(false);

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
  const searchTimer = useRef<any>(null);

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

  // Debounced YouTube search (by video name or channel)
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (mode !== 'search' || q.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await apiCall(`/api/youtube/search?q=${encodeURIComponent(q)}`);
        const results = res.results || [];
        setSearchResults(results);
        setSearchError(results.length === 0 ? 'Aucune vidéo trouvée' : null);
      } catch (e: any) {
        setSearchResults([]);
        setSearchError(e.message || 'Erreur de recherche');
      }
      setSearching(false);
    }, 700);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery, mode]);

  const selectFromSearch = (item: any) => {
    setPreview({
      youtube_id: item.youtube_id,
      title: item.title,
      thumbnail: item.thumbnail,
      channel_name: item.channel_name,
    });
    setSearchResults([]);
    setSearchError(null);
    fadeAnim.setValue(1);
    slideAnim.setValue(0);
  };

  const clearSelection = () => {
    setPreview(null);
    setRating(0);
    setComment('');
    if (mode === 'url') setUrl('');
  };

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
              Recherchez une vidéo ou collez un lien YouTube
            </Text>
          </View>

          {/* Mode tabs */}
          <View style={[styles.tabsRow, { backgroundColor: colors.bg_card }]}>
            <TouchableOpacity
              testID="tab-search"
              style={[styles.tabBtn, mode === 'search' && { backgroundColor: colors.primary }]}
              onPress={() => setMode('search')}
            >
              <MaterialCommunityIcons name="magnify" size={18} color={mode === 'search' ? '#fff' : colors.text_secondary} />
              <Text style={[styles.tabText, { color: mode === 'search' ? '#fff' : colors.text_secondary }]}>Recherche</Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID="tab-url"
              style={[styles.tabBtn, mode === 'url' && { backgroundColor: colors.primary }]}
              onPress={() => setMode('url')}
            >
              <MaterialCommunityIcons name="link-variant" size={18} color={mode === 'url' ? '#fff' : colors.text_secondary} />
              <Text style={[styles.tabText, { color: mode === 'url' ? '#fff' : colors.text_secondary }]}>Lien</Text>
            </TouchableOpacity>
          </View>

          {/* Search mode */}
          {mode === 'search' && (
            <>
              <View style={[styles.urlRow, { backgroundColor: colors.bg_card, borderColor: colors.border }]}>
                <MaterialCommunityIcons name="magnify" size={24} color={colors.primary} />
                <TextInput
                  testID="youtube-search-input"
                  style={[styles.urlInput, { color: colors.text_primary }]}
                  placeholder="Nom de la vidéo ou de la chaîne..."
                  placeholderTextColor={colors.text_secondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setSearchError(null); }}>
                    <MaterialCommunityIcons name="close-circle" size={20} color={colors.text_secondary} />
                  </TouchableOpacity>
                )}
              </View>

              {searching && (
                <View style={[styles.fetchingContainer, { backgroundColor: colors.bg_card }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.fetchingText, { color: colors.text_secondary }]}>Recherche sur YouTube...</Text>
                </View>
              )}

              {searchError && !searching && (
                <View style={[styles.errorContainer, { backgroundColor: '#EF444420' }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.errorText}>{searchError}</Text>
                </View>
              )}

              {/* Search results */}
              {!searching && searchResults.length > 0 && (
                <View style={styles.resultsList}>
                  {searchResults.map((item) => (
                    <TouchableOpacity
                      key={item.youtube_id}
                      testID={`search-result-${item.youtube_id}`}
                      style={[styles.resultRow, { backgroundColor: colors.bg_card, borderColor: colors.border }]}
                      onPress={() => selectFromSearch(item)}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: item.thumbnail }} style={styles.resultThumb} resizeMode="cover" />
                      <View style={styles.resultInfo}>
                        <Text style={[styles.resultTitle, { color: colors.text_primary }]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={[styles.resultChannel, { color: colors.text_secondary }]} numberOfLines={1}>
                          {item.channel_name}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text_secondary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* URL mode */}
          {mode === 'url' && (
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
          )}

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

                    {/* Quick actions: favoris (playlist) + changer de vidéo */}
                    <View style={styles.previewActions}>
                      <TouchableOpacity
                        testID="add-to-playlist-btn"
                        style={[styles.previewActionBtn, { borderColor: colors.primary }]}
                        onPress={() => setPlaylistModal(true)}
                      >
                        <MaterialCommunityIcons name="bookmark-plus-outline" size={18} color={colors.primary} />
                        <Text style={[styles.previewActionText, { color: colors.primary }]}>Favoris</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID="change-video-btn"
                        style={[styles.previewActionBtn, { borderColor: colors.border }]}
                        onPress={clearSelection}
                      >
                        <MaterialCommunityIcons name="swap-horizontal" size={18} color={colors.text_secondary} />
                        <Text style={[styles.previewActionText, { color: colors.text_secondary }]}>Changer</Text>
                      </TouchableOpacity>
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
      
      {/* Add to playlist (favoris) */}
      <AddToPlaylistModal
        visible={playlistModal}
        onClose={() => setPlaylistModal(false)}
        video={currentVideo}
      />

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

  // Mode tabs
  tabsRow: {
    flexDirection: 'row', borderRadius: 100, padding: 4, marginBottom: 16, gap: 4,
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 100, minHeight: 44,
  },
  tabText: { fontSize: 14, fontWeight: '700' },

  // Search results
  resultsList: { marginTop: 16, gap: 10 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    borderWidth: 1, padding: 10, gap: 12,
  },
  resultThumb: { width: 96, height: 54, borderRadius: 8, backgroundColor: '#000' },
  resultInfo: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: '600', lineHeight: 19 },
  resultChannel: { fontSize: 12, marginTop: 4 },

  // Preview quick actions
  previewActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  previewActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 100, paddingVertical: 10, minHeight: 40,
  },
  previewActionText: { fontSize: 13, fontWeight: '600' },
  
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
