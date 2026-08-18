import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { apiCall } from '../utils/api';

const REASONS = [
  'Contenu haineux ou discriminatoire',
  'Harcèlement ou intimidation',
  'Contenu sexuel ou inapproprié',
  'Violence ou incitation à la violence',
  'Spam ou publicité',
  'Usurpation d\u2019identité',
  'Autre',
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentType: 'rating' | 'comment' | 'user';
  contentId: string;
  targetUser?: { user_id: string; name: string } | null;
  onBlocked?: () => void;
}

export default function ReportModal({
  visible, onClose, contentType, contentId, targetUser, onBlocked,
}: ReportModalProps) {
  const { colors } = useTheme();
  const [reason, setReason] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [done, setDone] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setReason(null);
    setDone(false);
    setBlocked(false);
    setError('');
    setSubmitting(false);
    setBlocking(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await apiCall('/api/reports', {
        method: 'POST',
        body: JSON.stringify({ content_type: contentType, content_id: contentId, reason }),
      });
      setDone(true);
    } catch (e: any) {
      setError(e.message || 'Impossible d\u2019envoyer le signalement');
    }
    setSubmitting(false);
  };

  const handleBlock = async () => {
    if (!targetUser || blocking) return;
    setBlocking(true);
    setError('');
    try {
      await apiCall(`/api/users/${targetUser.user_id}/block`, { method: 'POST' });
      setBlocked(true);
      onBlocked?.();
    } catch (e: any) {
      setError(e.message || 'Impossible de bloquer cet utilisateur');
    }
    setBlocking(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: colors.bg_card }]}>
          {!done ? (
            <>
              <View style={styles.header}>
                <MaterialCommunityIcons name="flag-outline" size={22} color={colors.error} />
                <Text style={[styles.title, { color: colors.text_primary }]}>Signaler ce contenu</Text>
                <TouchableOpacity testID="report-close-btn" onPress={handleClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons name="close" size={22} color={colors.text_secondary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.subtitle, { color: colors.text_secondary }]}>
                Pourquoi signalez-vous ce contenu ? Notre équipe l&apos;examinera sous 24h.
              </Text>

              <ScrollView style={styles.reasonList}>
                {REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    testID={`report-reason-${r}`}
                    style={[
                      styles.reasonRow,
                      { borderColor: reason === r ? colors.primary : colors.border },
                      reason === r && { backgroundColor: colors.primary + '15' },
                    ]}
                    onPress={() => setReason(r)}
                  >
                    <MaterialCommunityIcons
                      name={reason === r ? 'radiobox-marked' : 'radiobox-blank'}
                      size={20}
                      color={reason === r ? colors.primary : colors.text_secondary}
                    />
                    <Text style={[styles.reasonText, { color: colors.text_primary }]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {error ? <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text> : null}

              <TouchableOpacity
                testID="report-submit-btn"
                style={[styles.submitBtn, { backgroundColor: reason ? colors.error : colors.bg_overlay }]}
                onPress={handleSubmit}
                disabled={!reason || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.submitText, { color: reason ? '#fff' : colors.text_secondary }]}>
                    Envoyer le signalement
                  </Text>
                )}
              </TouchableOpacity>

              {targetUser && !blocked && (
                <TouchableOpacity
                  testID="block-user-btn"
                  style={[styles.blockBtn, { borderColor: colors.error }]}
                  onPress={handleBlock}
                  disabled={blocking}
                >
                  <MaterialCommunityIcons name="account-cancel-outline" size={18} color={colors.error} />
                  <Text style={[styles.blockText, { color: colors.error }]}>
                    {blocking ? 'Blocage...' : `Bloquer ${targetUser.name}`}
                  </Text>
                </TouchableOpacity>
              )}
              {blocked && (
                <Text style={[styles.blockedInfo, { color: '#22c55e' }]}>
                  ✓ Utilisateur bloqué. Son contenu ne vous sera plus affiché.
                </Text>
              )}
            </>
          ) : (
            <View style={styles.doneWrap}>
              <View style={[styles.doneCircle, { backgroundColor: '#22c55e20' }]}>
                <MaterialCommunityIcons name="check-circle" size={56} color="#22c55e" />
              </View>
              <Text style={[styles.doneTitle, { color: colors.text_primary }]}>Signalement envoyé</Text>
              <Text style={[styles.doneText, { color: colors.text_secondary }]}>
                Merci. Notre équipe de modération examinera ce contenu dans un délai de 24 heures et prendra les mesures nécessaires.
              </Text>
              {targetUser && !blocked && (
                <TouchableOpacity
                  testID="block-user-after-report-btn"
                  style={[styles.blockBtn, { borderColor: colors.error }]}
                  onPress={handleBlock}
                  disabled={blocking}
                >
                  <MaterialCommunityIcons name="account-cancel-outline" size={18} color={colors.error} />
                  <Text style={[styles.blockText, { color: colors.error }]}>
                    {blocking ? 'Blocage...' : `Bloquer ${targetUser.name}`}
                  </Text>
                </TouchableOpacity>
              )}
              {blocked && (
                <Text style={[styles.blockedInfo, { color: '#22c55e' }]}>
                  ✓ Utilisateur bloqué. Son contenu ne vous sera plus affiché.
                </Text>
              )}
              <TouchableOpacity
                testID="report-done-btn"
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleClose}
              >
                <Text style={[styles.submitText, { color: '#fff' }]}>Fermer</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modal: { borderRadius: 20, padding: 20, width: '100%', maxWidth: 400, maxHeight: '85%' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  title: { fontSize: 17, fontWeight: '800', flex: 1 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  reasonList: { maxHeight: 300 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8,
    minHeight: 44,
  },
  reasonText: { fontSize: 14, flex: 1 },
  errorText: { fontSize: 13, textAlign: 'center', marginTop: 8 },
  submitBtn: {
    borderRadius: 100, paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', marginTop: 14, alignSelf: 'stretch',
  },
  submitText: { fontSize: 15, fontWeight: '700' },
  blockBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderWidth: 1, borderRadius: 100, paddingVertical: 12, marginTop: 10,
    alignSelf: 'stretch',
  },
  blockText: { fontSize: 14, fontWeight: '600' },
  blockedInfo: { fontSize: 13, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  doneWrap: { alignItems: 'center', paddingVertical: 8 },
  doneCircle: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  doneTitle: { fontSize: 20, fontWeight: '800' },
  doneText: { fontSize: 14, textAlign: 'center', lineHeight: 21, marginTop: 8 },
});
