import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TextInput,
  ScrollView,
  Pressable,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/Card';
import { Chip, PriceTag, ItemImage, EmptyState, ErrorState, Loader } from '../components/UI';
import { primaryImageUrl } from '../utils/format';
import { colors, typography, spacing, radius } from '../theme';

const MAX_WIDTH = 1100;
const GAP = 12;
const PADDING = 16;

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const requestId = useRef(0);
  const firstFocus = useRef(true);

  const containerWidth = Math.min(width, MAX_WIDTH);
  const columns = containerWidth >= 900 ? 4 : containerWidth >= 600 ? 3 : 2;
  const cardWidth = Math.floor((containerWidth - PADDING * 2 - GAP * (columns - 1)) / columns);

  const fetchItems = useCallback(async (kw, cat) => {
    const id = ++requestId.current;
    try {
      const res = await api.getItems(kw.trim(), cat);
      if (id === requestId.current) {
        setItems(res.data || []);
        setError('');
      }
    } catch (err) {
      if (id === requestId.current) setError(err.message);
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  // Categories once
  useEffect(() => {
    api
      .getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {});
  }, []);

  // Refetch whenever the search text (debounced) or category changes
  useEffect(() => {
    const t = setTimeout(() => fetchItems(keyword, categoryId), keyword ? 350 : 0);
    return () => clearTimeout(t);
  }, [keyword, categoryId, fetchItems]);

  // Refresh silently when coming back to this tab (e.g. after creating a listing)
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      fetchItems(keyword, categoryId);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchItems])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems(keyword, categoryId);
    setRefreshing(false);
  };

  const selectCategory = (id) => {
    setLoading(true);
    setCategoryId(id);
  };

  const firstName = user?.name?.split(' ')[0] || 'there';

  const header = (
    <View>
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroInner}>
          <Text style={styles.greeting}>Hi, {firstName} 👋</Text>
          <Text style={styles.heroTitle}>What do you need today?</Text>

          <View style={styles.search}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && { outlineStyle: 'none' }]}
              placeholder="Search drills, cameras, tents…"
              placeholderTextColor={colors.textMuted}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
              onSubmitEditing={() => fetchItems(keyword, categoryId)}
              autoCorrect={false}
            />
            {keyword ? (
              <Pressable onPress={() => setKeyword('')} hitSlop={10} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.chipsScroll}
      >
        <Chip label="All" icon="apps-outline" selected={!categoryId} onPress={() => selectCategory('')} />
        {categories.map((cat) => (
          <Chip
            key={cat.id}
            label={cat.name}
            selected={categoryId === String(cat.id)}
            onPress={() => selectCategory(String(cat.id))}
          />
        ))}
      </ScrollView>

      {!loading && !error ? (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {items.length} {items.length === 1 ? 'item' : 'items'} available
          </Text>
        </View>
      ) : null}
    </View>
  );

  const renderItem = ({ item }) => (
    <Card
      padded={false}
      style={[styles.itemCard, { width: cardWidth }]}
      onPress={() => navigation.navigate('ItemDetails', { itemId: item.id })}
      accessibilityLabel={item.title}
    >
      <View>
        <ItemImage uri={primaryImageUrl(item)} style={[styles.itemImage, { height: Math.round(cardWidth * 0.8) }]} />
        <View style={styles.priceFloat}>
          <PriceTag item={item} />
        </View>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.itemCategory} numberOfLines={1}>
          {item.category?.name}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Text style={styles.itemLocation} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <FlatList
        key={`cols-${columns}`}
        data={loading || error ? [] : items}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        numColumns={columns}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={header}
        contentContainerStyle={[styles.list, { maxWidth: MAX_WIDTH }]}
        style={styles.flex}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />}
        ListEmptyComponent={
          loading ? (
            <View style={{ paddingTop: 60 }}>
              <Loader />
            </View>
          ) : error ? (
            <ErrorState message={error} onRetry={() => { setLoading(true); fetchItems(keyword, categoryId); }} />
          ) : (
            <EmptyState
              icon="search-outline"
              title="No items found"
              message={keyword || categoryId ? 'Try a different search or category.' : 'Be the first to list something!'}
              actionLabel={keyword || categoryId ? 'Clear filters' : 'List an item'}
              onAction={() => {
                if (keyword || categoryId) {
                  setKeyword('');
                  selectCategory('');
                } else {
                  navigation.navigate('MyListings', { screen: 'CreateItem' });
                }
              }}
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  list: { width: '100%', alignSelf: 'center', paddingBottom: 32 },
  hero: {
    backgroundColor: colors.primary,
    paddingHorizontal: PADDING,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  heroInner: { width: '100%' },
  greeting: { ...typography.bodyStrong, color: '#A7E3DA' },
  heroTitle: { ...typography.h1, color: colors.textInverse, marginTop: 2, marginBottom: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
  },
  searchInput: { flex: 1, ...typography.body, color: colors.textPrimary, height: '100%' },
  chipsScroll: { flexGrow: 0 },
  chips: { paddingHorizontal: PADDING, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  resultsRow: { paddingHorizontal: PADDING, paddingVertical: spacing.sm },
  resultsText: { ...typography.caption, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { paddingHorizontal: PADDING, gap: GAP },
  itemCard: { marginBottom: GAP, overflow: 'hidden' },
  itemImage: { width: '100%' },
  priceFloat: { position: 'absolute', left: 8, top: 8 },
  itemInfo: { padding: spacing.md },
  itemTitle: { ...typography.bodyStrong, color: colors.textPrimary },
  itemCategory: { ...typography.caption, color: colors.primary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 3 },
  itemLocation: { ...typography.caption, color: colors.textMuted, flex: 1 },
});
