import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius } from '../theme';

const VARIANTS = {
  primary: { bg: colors.primary, border: colors.primary, text: colors.textInverse, pressed: colors.primaryDark },
  secondary: { bg: colors.primaryLight, border: colors.primaryLight, text: colors.primary, pressed: colors.primarySoft },
  outline: { bg: colors.surface, border: colors.borderStrong, text: colors.textPrimary, pressed: colors.surfaceAlt },
  danger: { bg: colors.danger, border: colors.danger, text: colors.textInverse, pressed: '#B91C1C' },
  dangerOutline: { bg: colors.surface, border: '#FCA5A5', text: colors.danger, pressed: colors.dangerLight },
  success: { bg: colors.success, border: colors.success, text: colors.textInverse, pressed: '#15803D' },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.primary, pressed: colors.primaryLight },
};

const SIZES = {
  sm: { height: 38, paddingH: 14, font: 13, icon: 16 },
  md: { height: 50, paddingH: 18, font: 15, icon: 18 },
  lg: { height: 56, paddingH: 22, font: 16, icon: 20 },
};

export const Button = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = true,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      hitSlop={6}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: s.height,
          paddingHorizontal: s.paddingH,
          backgroundColor: pressed && !isDisabled ? v.pressed : v.bg,
          borderColor: v.border,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: isDisabled ? 0.55 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
        },
        Platform.OS === 'web' && { cursor: isDisabled ? 'not-allowed' : 'pointer' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={s.icon} color={v.text} style={styles.iconLeft} /> : null}
          {title ? (
            <Text style={[styles.text, { color: v.text, fontSize: s.font }, textStyle]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          {iconRight ? <Ionicons name={iconRight} size={s.icon} color={v.text} style={styles.iconRight} /> : null}
        </View>
      )}
    </Pressable>
  );
};

/** Round icon-only button */
export const IconButton = ({ icon, onPress, color = colors.textPrimary, bg = colors.surface, size = 40, style, accessibilityLabel }) => (
  <Pressable
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel || icon}
    style={({ pressed }) => [
      {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      },
      Platform.OS === 'web' && { cursor: 'pointer' },
      style,
    ]}
  >
    <Ionicons name={icon} size={size * 0.5} color={color} />
  </Pressable>
);

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.button,
    textAlign: 'center',
  },
  iconLeft: { marginRight: 8 },
  iconRight: { marginLeft: 8 },
});

export default Button;
