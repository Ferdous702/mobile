import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Image, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';
import { capitalize, initials } from '../utils/format';
import { Button } from './Button';

const webPointer = Platform.OS === 'web' ? { cursor: 'pointer' } : null;

/** Selectable pill */
export const Chip = ({ label, selected, onPress, icon, style }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityState={{ selected }}
    hitSlop={4}
    style={({ pressed }) => [
      styles.chip,
      selected && styles.chipSelected,
      pressed && { opacity: 0.8 },
      webPointer,
      style,
    ]}
  >
    {icon ? (
      <Ionicons name={icon} size={14} color={selected ? colors.textInverse : colors.textSecondary} style={{ marginRight: 6 }} />
    ) : null}
    <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
      {label}
    </Text>
  </Pressable>
);

const STATUS = {
  pending: { bg: colors.warningLight, fg: colors.warning, icon: 'time-outline' },
  accepted: { bg: colors.successLight, fg: colors.success, icon: 'checkmark-circle-outline' },
  rejected: { bg: colors.dangerLight, fg: colors.danger, icon: 'close-circle-outline' },
};

export const StatusBadge = ({ status }) => {
  const s = STATUS[status] || { bg: colors.surfaceAlt, fg: colors.textSecondary, icon: 'ellipse-outline' };
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Ionicons name={s.icon} size={13} color={s.fg} style={{ marginRight: 4 }} />
      <Text style={[styles.badgeText, { color: s.fg }]}>{capitalize(status)}</Text>
    </View>
  );
};

export const PriceTag = ({ item, large }) => (
  <View style={[styles.price, item?.is_free ? styles.priceFree : styles.pricePaid, large && styles.priceLarge]}>
    <Text style={[styles.priceText, { color: item?.is_free ? colors.success : colors.primary }, large && { fontSize: 16 }]}>
      {item?.is_free ? 'Free' : `$${Number(item?.daily_rate || 0).toFixed(Number(item?.daily_rate) % 1 ? 2 : 0)}`}
      {!item?.is_free ? <Text style={styles.priceUnit}> /day</Text> : null}
    </Text>
  </View>
);

export const Avatar = ({ name, size = 40, color = colors.primary }) => (
  <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ color: colors.textInverse, fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
  </View>
);

/** Image with a graceful placeholder when missing or failing to load */
export const ItemImage = ({ uri, style, iconSize = 28 }) => {
  const [failed, setFailed] = useState(false);
  if (!uri || failed) {
    return (
      <View style={[style, styles.imagePlaceholder]}>
        <Ionicons name="image-outline" size={iconSize} color={colors.textMuted} />
      </View>
    );
  }
  return <Image source={{ uri }} style={[style, { backgroundColor: colors.surfaceAlt }]} resizeMode="cover" onError={() => setFailed(true)} />;
};

export const EmptyState = ({ icon = 'cube-outline', title, message, actionLabel, onAction }) => (
  <View style={styles.empty}>
    <View style={styles.emptyIcon}>
      <Ionicons name={icon} size={34} color={colors.primary} />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
    {actionLabel && onAction ? (
      <Button title={actionLabel} onPress={onAction} fullWidth={false} size="sm" style={{ marginTop: spacing.lg }} />
    ) : null}
  </View>
);

export const ErrorState = ({ message, onRetry }) => (
  <View style={styles.empty}>
    <View style={[styles.emptyIcon, { backgroundColor: colors.dangerLight }]}>
      <Ionicons name="cloud-offline-outline" size={34} color={colors.danger} />
    </View>
    <Text style={styles.emptyTitle}>Couldn&apos;t load data</Text>
    <Text style={styles.emptyMessage}>{message}</Text>
    {onRetry ? <Button title="Try again" icon="refresh" onPress={onRetry} fullWidth={false} size="sm" style={{ marginTop: spacing.lg }} /> : null}
  </View>
);

export const Loader = ({ label }) => (
  <View style={styles.loader}>
    <ActivityIndicator size="large" color={colors.primary} />
    {label ? <Text style={styles.loaderText}>{label}</Text> : null}
  </View>
);

export const SectionTitle = ({ children, right }) => (
  <View style={styles.sectionRow}>
    <Text style={styles.sectionTitle}>{children}</Text>
    {right}
  </View>
);

/** Segmented control (two or more tabs) */
export const Segmented = ({ options, value, onChange }) => (
  <View style={styles.segmented}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <Pressable
          key={opt.value}
          onPress={() => onChange(opt.value)}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
          style={[styles.segment, active && styles.segmentActive, webPointer]}
        >
          <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{opt.label}</Text>
          {typeof opt.count === 'number' && opt.count > 0 ? (
            <View style={[styles.segmentCount, active && { backgroundColor: colors.primary }]}>
              <Text style={[styles.segmentCountText, active && { color: colors.textInverse }]}>{opt.count}</Text>
            </View>
          ) : null}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.textInverse,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  price: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  priceLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  priceFree: { backgroundColor: colors.successLight },
  pricePaid: { backgroundColor: colors.primaryLight },
  priceText: {
    fontSize: 13,
    fontWeight: '800',
  },
  priceUnit: {
    fontSize: 11,
    fontWeight: '600',
  },
  imagePlaceholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: spacing.xxl,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    backgroundColor: colors.background,
  },
  loaderText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(17,24,39,0.12)' },
      default: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    }),
  },
  segmentText: {
    ...typography.label,
    fontSize: 14,
    color: colors.textSecondary,
  },
  segmentTextActive: {
    color: colors.textPrimary,
  },
  segmentCount: {
    marginLeft: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
