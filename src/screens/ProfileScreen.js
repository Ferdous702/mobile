import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { api } from '../utils/api';
import { API_URL } from '../config/api';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Avatar } from '../components/UI';
import { colors, typography, spacing, radius, CONTENT_MAX_WIDTH } from '../theme';

const MenuRow = ({ icon, label, value, onPress, color = colors.textPrimary, last }) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && onPress && { backgroundColor: colors.surfaceAlt }, Platform.OS === 'web' && onPress && { cursor: 'pointer' }]}
    accessibilityRole={onPress ? 'button' : undefined}
  >
    <View style={[styles.rowIcon, { backgroundColor: color === colors.textPrimary ? colors.primaryLight : colors.dangerLight }]}>
      <Ionicons name={icon} size={18} color={color === colors.textPrimary ? colors.primary : color} />
    </View>
    <Text style={[styles.rowLabel, { color }]}>{label}</Text>
    {value ? (
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    ) : null}
    {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
  </Pressable>
);

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, isAdmin } = useAuth();
  const { confirm } = useDialog();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({ listings: '–', received: '–', sent: '–' });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([api.getMyItems(), api.getReceivedRequests(), api.getSentRequests()])
        .then(([i, r, s]) => {
          if (active) setStats({ listings: i.data?.length ?? 0, received: r.data?.length ?? 0, sent: s.data?.length ?? 0 });
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    const ok = await confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to use BorrowHub.',
      confirmText: 'Sign out',
      destructive: true,
      icon: 'log-out-outline',
    });
    if (!ok) return;
    setIsLoggingOut(true);
    await logout();
  };

  const goTab = (tab) => navigation.getParent()?.navigate(tab);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.inner}>
        <Card style={styles.hero}>
          <Avatar name={user?.name} size={76} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.roleBadge, isAdmin && { backgroundColor: colors.accentLight }]}>
            <Ionicons name={isAdmin ? 'star' : 'person'} size={12} color={isAdmin ? colors.warning : colors.primary} />
            <Text style={[styles.roleText, isAdmin && { color: colors.warning }]}>{isAdmin ? 'Administrator' : 'Member'}</Text>
          </View>

          <View style={styles.stats}>
            {[
              ['Listings', stats.listings, 'MyListings'],
              ['Received', stats.received, 'Requests'],
              ['Sent', stats.sent, 'Requests'],
            ].map(([label, value, tab], i) => (
              <Pressable key={label} style={[styles.stat, i > 0 && styles.statDivider]} onPress={() => goTab(tab)}>
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        <Text style={styles.groupLabel}>Activity</Text>
        <Card padded={false} style={styles.group}>
          <MenuRow icon="cube-outline" label="My listings" onPress={() => goTab('MyListings')} />
          <MenuRow icon="add-circle-outline" label="Create a listing" onPress={() => navigation.getParent()?.navigate('MyListings', { screen: 'CreateItem' })} />
          <MenuRow icon="swap-horizontal-outline" label="Borrow requests" onPress={() => goTab('Requests')} last />
        </Card>

        {isAdmin ? (
          <>
            <Text style={styles.groupLabel}>Administration</Text>
            <Card padded={false} style={styles.group}>
              <MenuRow icon="shield-checkmark-outline" label="Admin panel" onPress={() => navigation.navigate('Admin')} last />
            </Card>
          </>
        ) : null}

        <Text style={styles.groupLabel}>App</Text>
        <Card padded={false} style={styles.group}>
          <MenuRow icon="server-outline" label="Server" value={API_URL.replace(/^https?:\/\//, '')} />
          <MenuRow icon="information-circle-outline" label="Version" value={Constants.expoConfig?.version || '1.0.0'} last />
        </Card>

        <Button
          title="Sign out"
          icon="log-out-outline"
          variant="dangerOutline"
          onPress={handleLogout}
          loading={isLoggingOut}
          style={{ marginTop: spacing.xxl }}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: 40 },
  inner: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  hero: { alignItems: 'center', paddingTop: spacing.xxl, paddingBottom: 0, overflow: 'hidden' },
  name: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
  email: { ...typography.body, color: colors.textSecondary },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.primaryLight,
  },
  roleText: { ...typography.caption, color: colors.primary, fontWeight: '700' },
  stats: { flexDirection: 'row', alignSelf: 'stretch', marginTop: spacing.xl, borderTopWidth: 1, borderTopColor: colors.border, marginHorizontal: -16 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
  statDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  statValue: { ...typography.h2, color: colors.textPrimary },
  statLabel: { ...typography.caption, color: colors.textSecondary },
  groupLabel: { ...typography.caption, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: spacing.xxl, marginBottom: spacing.sm, marginLeft: 4 },
  group: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 14, gap: spacing.md },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  rowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...typography.bodyStrong, flex: 1 },
  rowValue: { ...typography.bodySmall, color: colors.textMuted, maxWidth: '50%' },
});
