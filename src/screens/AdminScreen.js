import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Avatar, ItemImage, PriceTag, Segmented, EmptyState, ErrorState, Loader } from '../components/UI';
import { primaryImageUrl } from '../utils/format';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

// Admin endpoints are paginated: { data: { data: [...] } }
const rows = (res) => (Array.isArray(res?.data) ? res.data : res?.data?.data || []);

export const AdminScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { confirm, toast, alert } = useDialog();
  const [tab, setTab] = useState('items');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const [u, i] = await Promise.all([api.getAdminUsers(), api.getAdminItems()]);
      setUsers(rows(u));
      setItems(rows(i));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const removeItem = async (item) => {
    const ok = await confirm({ title: 'Remove listing?', message: `"${item.title}" by ${item.user?.name} will be deleted.`, confirmText: 'Remove', destructive: true, icon: 'trash-outline' });
    if (!ok) return;
    setBusyId(`i${item.id}`);
    try {
      await api.adminDeleteItem(item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      toast('Listing removed');
    } catch (err) {
      alert('Could not remove', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (u) => {
    const ok = await confirm({ title: 'Delete user?', message: `${u.name} (${u.email}) and all their listings will be deleted.`, confirmText: 'Delete', destructive: true, icon: 'person-remove-outline' });
    if (!ok) return;
    setBusyId(`u${u.id}`);
    try {
      await api.adminDeleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      setItems((prev) => prev.filter((x) => x.user_id !== u.id));
      toast('User deleted');
    } catch (err) {
      alert('Could not delete', err.message);
    } finally {
      setBusyId(null);
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.row}>
      <ItemImage uri={primaryImageUrl(item)} style={styles.thumb} iconSize={18} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1} onPress={() => navigation.getParent()?.navigate('Home', { screen: 'ItemDetails', params: { itemId: item.id }, initial: false })}>
          {item.title}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.user?.name} · {item.category?.name}
        </Text>
        <View style={{ marginTop: 4 }}>
          <PriceTag item={item} />
        </View>
      </View>
      <Button title="Remove" variant="dangerOutline" size="sm" fullWidth={false} loading={busyId === `i${item.id}`} onPress={() => removeItem(item)} />
    </Card>
  );

  const renderUser = ({ item: u }) => {
    const isSelf = Number(u.id) === Number(user?.id);
    return (
      <Card style={styles.row}>
        <Avatar name={u.name} size={44} color={u.is_admin ? colors.accent : colors.primary} />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>
            {u.name} {u.is_admin ? <Text style={styles.adminTag}> ADMIN</Text> : null}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {u.email}
          </Text>
        </View>
        {!isSelf ? (
          <Button title="Delete" variant="dangerOutline" size="sm" fullWidth={false} loading={busyId === `u${u.id}`} onPress={() => removeUser(u)} />
        ) : (
          <Text style={styles.you}>You</Text>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabsWrap}>
        <View style={styles.inner}>
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'items', label: 'Listings', count: items.length },
              { value: 'users', label: 'Users', count: users.length },
            ]}
          />
        </View>
      </View>
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={error ? [] : tab === 'items' ? items : users}
          keyExtractor={(x) => `${tab}-${x.id}`}
          renderItem={tab === 'items' ? renderItem : renderUser}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await load();
                setRefreshing(false);
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={error ? <ErrorState message={error} onRetry={load} /> : <EmptyState title="Nothing here" icon="file-tray-outline" />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabsWrap: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, padding: spacing.md },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  list: { padding: spacing.lg, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, padding: spacing.md },
  thumb: { width: 52, height: 52, borderRadius: radius.md },
  info: { flex: 1, marginHorizontal: spacing.md },
  title: { ...typography.bodyStrong, color: colors.textPrimary },
  sub: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  adminTag: { fontSize: 10, fontWeight: '800', color: colors.warning },
  you: { ...typography.caption, color: colors.textMuted, fontWeight: '700' },
});
