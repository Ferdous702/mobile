import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../utils/api';
import { imageUrl } from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { Button, IconButton } from '../components/Button';
import { Input } from '../components/Input';
import { DateField } from '../components/DateField';
import { Card } from '../components/Card';
import { Avatar, ItemImage, PriceTag, ErrorState, Loader } from '../components/UI';
import { toYMD, parseYMD, formatRange, daysBetween } from '../utils/format';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

export const ItemDetailsScreen = ({ route, navigation }) => {
  const { itemId } = route.params || {};
  const { user } = useAuth();
  const { toast } = useDialog();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageIndex, setImageIndex] = useState(0);
  const carouselRef = useRef(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [startDate, setStartDate] = useState(toYMD(new Date()));
  const [endDate, setEndDate] = useState(toYMD(addDays(new Date(), 1)));
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadItem = useCallback(async () => {
    if (!itemId) {
      setError('No item selected.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.getItem(itemId);
      setItem(response.data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  // Reload on focus so edits made on the form screen show up
  useFocusEffect(
    useCallback(() => {
      loadItem();
    }, [loadItem])
  );

  useEffect(() => {
    if (item?.title) navigation.setOptions({ title: item.title });
  }, [item?.title, navigation]);

  const openSheet = () => {
    setFormError('');
    setSheetOpen(true);
  };

  const validate = () => {
    const start = parseYMD(startDate);
    const end = parseYMD(endDate);
    const today = parseYMD(toYMD(new Date()));
    if (!start || !end) return 'Please select both a start and end date.';
    if (start < today) return 'Start date cannot be in the past.';
    if (end < start) return 'End date must be on or after the start date.';

    for (const b of item?.booked_dates || []) {
      const bs = parseYMD(b.start_date);
      const be = parseYMD(b.end_date);
      if (start <= be && end >= bs) {
        return `Already booked ${formatRange(b.start_date, b.end_date)}. Please choose other dates.`;
      }
    }
    return '';
  };

  const handleSubmitRequest = async () => {
    const msg = validate();
    setFormError(msg);
    if (msg) return;

    setSubmitting(true);
    try {
      await api.createBorrowRequest(itemId, startDate, endDate, notes.trim());
      setSheetOpen(false);
      setNotes('');
      toast('Request sent! The owner will review it soon.');
    } catch (err) {
      setFormError(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;
  if (error || !item) return <ErrorState message={error || 'Item not found'} onRetry={() => { setLoading(true); loadItem(); }} />;

  const isOwner = user && item.user && Number(user.id) === Number(item.user.id);
  const images = item.images || [];
  const imageHeight = Math.round(Math.min(contentWidth * 0.75, 420));
  const days = daysBetween(startDate, endDate);
  const estimate = !item.is_free && days > 0 ? (Number(item.daily_rate) * days).toFixed(2) : null;

  const scrollToImage = (i) => {
    const next = Math.max(0, Math.min(images.length - 1, i));
    carouselRef.current?.scrollTo({ x: next * contentWidth, animated: true });
    setImageIndex(next);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={[styles.centered, { width: contentWidth }]}>
          <View>
            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              scrollEventThrottle={16}
              onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / contentWidth))}
              onScroll={Platform.OS === 'web' ? (e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / contentWidth)) : undefined}
            >
              {images.length > 0 ? (
                images.map((img) => (
                  <ItemImage key={img.id} uri={imageUrl(img.image_path)} style={{ width: contentWidth, height: imageHeight }} iconSize={48} />
                ))
              ) : (
                <ItemImage uri={null} style={{ width: contentWidth, height: imageHeight }} iconSize={48} />
              )}
            </ScrollView>

            {images.length > 1 ? (
              <>
                <View style={styles.dots}>
                  {images.map((img, i) => (
                    <Pressable key={img.id} onPress={() => scrollToImage(i)} hitSlop={6}>
                      <View style={[styles.dot, i === imageIndex && styles.dotActive]} />
                    </Pressable>
                  ))}
                </View>
                {imageIndex > 0 ? (
                  <IconButton icon="chevron-back" onPress={() => scrollToImage(imageIndex - 1)} style={[styles.arrow, { left: 12, top: imageHeight / 2 - 20 }]} accessibilityLabel="Previous image" />
                ) : null}
                {imageIndex < images.length - 1 ? (
                  <IconButton icon="chevron-forward" onPress={() => scrollToImage(imageIndex + 1)} style={[styles.arrow, { right: 12, top: imageHeight / 2 - 20 }]} accessibilityLabel="Next image" />
                ) : null}
              </>
            ) : null}
          </View>

          <View style={styles.content}>
            <View style={styles.tagRow}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{item.category?.name}</Text>
              </View>
              {item.is_available === false ? (
                <View style={[styles.categoryTag, { backgroundColor: colors.dangerLight }]}>
                  <Text style={[styles.categoryText, { color: colors.danger }]}>Unavailable</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <PriceTag item={item} large />
            </View>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>About this item</Text>
              <Text style={styles.description}>{item.description}</Text>
            </Card>

            <Card style={[styles.section, styles.ownerRow]}>
              <Avatar name={item.user?.name} size={44} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.ownerLabel}>Listed by</Text>
                <Text style={styles.ownerName}>{isOwner ? 'You' : item.user?.name}</Text>
              </View>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </Card>

            <Card style={styles.section}>
              <Text style={styles.sectionTitle}>Availability</Text>
              {item.booked_dates?.length ? (
                item.booked_dates.map((b, i) => (
                  <View key={i} style={styles.bookedRow}>
                    <Ionicons name="calendar" size={16} color={colors.danger} />
                    <Text style={styles.bookedText}>Booked {formatRange(b.start_date, b.end_date)}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.bookedRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bookedText, { color: colors.success }]}>No bookings yet — all dates open</Text>
                </View>
              )}
            </Card>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.footerInner, { maxWidth: CONTENT_MAX_WIDTH }]}>
          {isOwner ? (
            <Button title="Edit listing" icon="create-outline" variant="secondary" onPress={() => navigation.navigate('CreateItem', { item })} />
          ) : (
            <Button title="Request to borrow" icon="calendar-outline" onPress={openSheet} disabled={item.is_available === false} />
          )}
        </View>
      </View>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)} statusBarTranslucent>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.backdrop} onPress={() => !submitting && setSheetOpen(false)}>
            <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} onPress={() => {}}>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.sheetHandle} />
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Request to borrow</Text>
                  <IconButton icon="close" onPress={() => setSheetOpen(false)} bg={colors.surfaceAlt} size={36} accessibilityLabel="Close" />
                </View>
                <Text style={styles.sheetSubtitle} numberOfLines={1}>
                  {item.title}
                </Text>

                {formError ? (
                  <View style={styles.formError}>
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text style={styles.formErrorText}>{formError}</Text>
                  </View>
                ) : null}

                <View style={styles.dateRow}>
                  <DateField
                    label="Start date"
                    value={startDate}
                    minimumDate={new Date()}
                    onChange={(v) => {
                      setStartDate(v);
                      if (parseYMD(endDate) < parseYMD(v)) setEndDate(v);
                      setFormError('');
                    }}
                    style={{ flex: 1 }}
                  />
                  <DateField
                    label="End date"
                    value={endDate}
                    minimumDate={parseYMD(startDate) || new Date()}
                    onChange={(v) => {
                      setEndDate(v);
                      setFormError('');
                    }}
                    style={{ flex: 1 }}
                  />
                </View>

                <Input
                  label="Message to owner (optional)"
                  icon="chatbubble-ellipses-outline"
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Hi! I'd like to borrow this for…"
                  multiline
                />

                <View style={styles.summary}>
                  <Text style={styles.summaryText}>
                    {days > 0 ? `${days} ${days === 1 ? 'day' : 'days'}` : '—'}
                  </Text>
                  <Text style={styles.summaryTotal}>{item.is_free ? 'Free' : estimate ? `$${estimate} est.` : '—'}</Text>
                </View>

                <Button title="Send request" icon="paper-plane-outline" onPress={handleSubmitRequest} loading={submitting} />
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignSelf: 'center' },
  dots: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.6)' },
  dotActive: { width: 20, backgroundColor: colors.surface },
  arrow: { position: 'absolute', opacity: 0.9 },
  content: { padding: spacing.lg },
  tagRow: { flexDirection: 'row', gap: 8 },
  categoryTag: { backgroundColor: colors.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full },
  categoryText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  title: { ...typography.h1, color: colors.textPrimary, marginTop: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { ...typography.body, color: colors.textSecondary },
  section: { marginTop: spacing.lg },
  sectionTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textSecondary, lineHeight: 23 },
  ownerRow: { flexDirection: 'row', alignItems: 'center' },
  ownerLabel: { ...typography.caption, color: colors.textMuted },
  ownerName: { ...typography.bodyStrong, color: colors.textPrimary },
  bookedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  bookedText: { ...typography.bodySmall, color: colors.danger, fontWeight: '600' },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerInner: { width: '100%', alignSelf: 'center' },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { ...typography.h2, color: colors.textPrimary },
  sheetSubtitle: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.lg },
  dateRow: { flexDirection: 'row', gap: spacing.md },
  formError: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
  },
  formErrorText: { ...typography.bodySmall, color: colors.danger, fontWeight: '600', flex: 1 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryText: { ...typography.bodyStrong, color: colors.textSecondary },
  summaryTotal: { ...typography.h3, color: colors.primary },
});
