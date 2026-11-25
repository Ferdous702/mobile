import React from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '../theme';

export const AuthLayout = ({ title, subtitle, children, footer }) => {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="repeat" size={30} color={colors.textInverse} />
            </View>
            <Text style={styles.brandName}>BorrowHub</Text>
            <Text style={styles.tagline}>Borrow what you need. Lend what you don&apos;t.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            <View style={{ marginTop: spacing.xxl }}>{children}</View>
          </View>

          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const FormError = ({ message }) =>
  message ? (
    <View style={styles.formError}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  ) : null;

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  brand: { alignItems: 'center', marginBottom: spacing.xxl },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    ...shadow.md,
  },
  brandName: { ...typography.display, color: colors.textPrimary },
  tagline: { ...typography.body, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.md,
  },
  title: { ...typography.h1, color: colors.textPrimary },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: 4 },
  footer: { marginTop: spacing.xxl, alignItems: 'center' },
  formError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  formErrorText: { ...typography.bodySmall, color: colors.danger, flex: 1, fontWeight: '600' },
});
