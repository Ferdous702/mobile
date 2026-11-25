import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useDialog } from '../contexts/DialogContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ItemImage, StatusBadge, Segmented, EmptyState, ErrorState, Loader, Avatar } from '../components/UI';
import { primaryImageUrl, formatRange, daysBetween } from '../utils/format';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

export const RequestsScreen = ({ navigation }) => {
  const { confirm, toast, alert } = useDialog();
  const [activeTab, setActiveTab] = useState('received');
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null); // `${id}-accept` | `${id}-reject`

  // Load both lists at once so switching tabs is instant and counts are accurate
  const loadRequests = useCallback(async () => {
    try {
      const [r, s] = await Promise.all([api.getReceivedRequests(), api.getSentRequests()]);
      setReceived(r.data || []);
      setSent(s.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [loadRequests])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const respond = async (req, action) => {
    const accepting = action === 'accept';
    const ok = await confirm({
      title: accepting ? 'Accept request?' : 'Decline request?',
      message: `${req.borrower?.name || 'The borrower'} wants "${req.item_listing?.title}" for ${formatRange(req.start_date, req.end_date)}.`,
      confirmText: accepting ? 'Accept' : 'Decline',
      destructive: !accepting,
      icon: accepting ? 'checkmark-circle-outline' : 'close-circle-outline',
    });
    if (!ok) return;

    setBusy(`${req.id}-${action}`);
    try {
      const res = accepting ? await api.acceptRequest(req.id) : await api.rejectRequest(req.id);
      setReceived((prev) => prev.map((r) => (r.id === req.id ? { ...r, status: res.data?.status || (accepting ? 'accepted' : 'rejected') } : r)));
      toast(accepting ? 'Request accepted' : 'Request declined', accepting ? 'success' : 'info');
    } catch (err) {
      alert('Action failed', err.message);
    } finally {
      setBusy(null);
    }
  };

  const data = activeTab === 'received' ? received : sent;
  const pendingReceived = received.filter((r) => r.status === 'pending').length;

  const renderRequest = ({ item: req }) => {
    const isReceived = activeTab === 'received';
    const listing = req.item_listing;
    const days = daysBetween(req.start_date, req.end_date);

    return (
      <Card padded={false} style={styles.card}>
        <Card
          padded={false}
          flat
          style={styles.cardInner}
          onPress={listing?.id ? () => navigation.navigate('ItemDetails', { itemId: listing.id }) : undefined}
          accessibilityLabel={listing?.title}
        >
          <ItemImage uri={primaryImageUrl(listing)} style={styles.thumb} iconSize={20} />
          <View style={styles.info}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {listing?.title || 'Deleted item'}
              </Text>
              <StatusBadge status={req.status} />
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={styles.dates}>
                {formatRange(req.start_date, req.end_date)} · {days} {days === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <View style={[styles.metaRow, { marginTop: 6 }]}>
              <Avatar name={isReceived ? req.borrower?.name : listing?.user?.name} size={20} color={isReceived ? colors.accent : colors.primary} />
              <Text style={styles.person}>
                {isReceived ? `From ${req.borrower?.name || 'unknown'}` : `Owner: ${listing?.user?.name || 'unknown'}`}
              </Text>
            </View>
          </View>
        </Card>

        {req.notes ? (
          <View style={styles.notes}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.notesText}>{req.notes}</Text>
          </View>
        ) : null}

        {isReceived && req.status === 'pending' ? (
          <View style={styles.actions}>
            <Button
              title="Decline"
              icon="close"
              variant="dangerOutline"
              size="sm"
              onPress={() => respond(req, 'reject')}
              loading={busy === `${req.id}-reject`}
              disabled={!!busy}
              style={{ flex: 1 }}
              fullWidth={false}
            />
            <Button
              title="Accept"
              icon="checkmark"
              variant="success"
              size="sm"
              onPress={() => respond(req, 'accept')}
              loading={busy === `${req.id}-accept`}
              disabled={!!busy}
              style={{ flex: 1 }}
              fullWidth={false}
            />
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrap}>
        <View style={styles.tabsInner}>
          <Segmented
            value={activeTab}
            onChange={setActiveTab}
            options={[
              { value: 'received', label: 'Received', count: pendingReceived },
              { value: 'sent', label: 'Sent', count: sent.length },
            ]}
          />
        </View>
      </View>

      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={error ? [] : data}
          renderItem={renderRequest}
          keyExtractor={(item) => `${activeTab}-${item.id}`}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
          ListEmptyComponent={
            error ? (
              <ErrorState message={error} onRetry={() => { setLoading(true); loadRequests(); }} />
            ) : activeTab === 'received' ? (
              <EmptyState icon="mail-open-outline" title="No requests yet" message="When someone wants to borrow your items, their requests will appear here." />
            ) : (
              <EmptyState
                icon="paper-plane-outline"
                title="You haven't requested anything"
                message="Browse items near you and send your first borrow request."
                actionLabel="Explore items"
                onAction={() => navigation.navigate('Home')}
              />
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.md },
  tabsInner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  list: { padding: spacing.lg, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', flexGrow: 1 },
  card: { marginBottom: spacing.lg, overflow: 'hidden' },
  cardInner: { flexDirection: 'row', padding: spacing.md },
  thumb: { width: 64, height: 64, borderRadius: radius.md },
  info: { flex: 1, marginLeft: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dates: { ...typography.bodySmall, color: colors.primary, fontWeight: '600' },
  person: { ...typography.bodySmall, color: colors.textSecondary },
  notes: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  notesText: { ...typography.bodySmall, color: colors.textSecondary, flex: 1, fontStyle: 'italic' },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FAFBFC',
  },
});
