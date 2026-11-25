import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useDialog } from '../contexts/DialogContext';
import { Card } from '../components/Card';
import { Button, IconButton } from '../components/Button';
import { ItemImage, PriceTag, EmptyState, ErrorState, Loader } from '../components/UI';
import { primaryImageUrl } from '../utils/format';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

export const MyListingsScreen = ({ navigation }) => {
  const { confirm, toast, alert } = useDialog();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const loadMyItems = useCallback(async () => {
    try {
      const response = await api.getMyItems();
      setItems(response.data || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMyItems();
    }, [loadMyItems])
  );

  const handleCreateNew = useCallback(() => navigation.navigate('CreateItem'), [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="add" onPress={handleCreateNew} bg={colors.primaryLight} color={colors.primary} size={36} style={{ marginRight: 12 }} accessibilityLabel="New listing" />
      ),
    });
  }, [navigation, handleCreateNew]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyItems();
    setRefreshing(false);
  };

  const handleDelete = async (item) => {
    const ok = await confirm({
      title: 'Delete listing?',
      message: `"${item.title}" and its photos will be permanently removed.`,
      confirmText: 'Delete',
      destructive: true,
      icon: 'trash-outline',
    });
    if (!ok) return;

    setDeletingId(item.id);
    try {
      await api.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast('Listing deleted');
    } catch (err) {
      alert('Could not delete', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const renderItem = ({ item }) => (
    <Card padded={false} style={styles.card}>
      <Card padded={false} flat style={styles.cardInner} onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })} accessibilityLabel={item.title}>
        <ItemImage uri={primaryImageUrl(item)} style={styles.image} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.category}>{item.category?.name}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.location} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={{ marginTop: 8 }}>
            <PriceTag item={item} />
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ alignSelf: 'center' }} />
      </Card>
      <View style={styles.actions}>
        <Button
          title="Edit"
          icon="create-outline"
          variant="secondary"
          size="sm"
          onPress={() => navigation.navigate('CreateItem', { item })}
          style={styles.actionBtn}
          fullWidth={false}
        />
        <Button
          title="Delete"
          icon="trash-outline"
          variant="dangerOutline"
          size="sm"
          loading={deletingId === item.id}
          onPress={() => handleDelete(item)}
          style={styles.actionBtn}
          fullWidth={false}
        />
      </View>
    </Card>
  );

  if (loading) return <Loader />;

  return (
    <View style={styles.container}>
      <FlatList
        data={error ? [] : items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListHeaderComponent={
          !error && items.length ? (
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Your items</Text>
                <Text style={styles.headerSub}>
                  {items.length} active {items.length === 1 ? 'listing' : 'listings'}
                </Text>
              </View>
              <Button title="New" icon="add" size="sm" onPress={handleCreateNew} fullWidth={false} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          error ? (
            <ErrorState message={error} onRetry={() => { setLoading(true); loadMyItems(); }} />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No listings yet"
              message="Share something you own and earn from it — or lend it for free."
              actionLabel="Create your first listing"
              onAction={handleCreateNew}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  headerSub: { ...typography.bodySmall, color: colors.textSecondary },
  card: { marginBottom: spacing.lg, overflow: 'hidden' },
  cardInner: { flexDirection: 'row', padding: spacing.md },
  image: { width: 92, height: 92, borderRadius: radius.md },
  info: { flex: 1, marginLeft: spacing.md, marginRight: spacing.sm },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  category: { ...typography.caption, color: colors.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 4 },
  location: { ...typography.caption, color: colors.textMuted, flex: 1 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: '#FAFBFC',
  },
  actionBtn: { flex: 1 },
});
