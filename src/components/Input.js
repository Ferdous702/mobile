import React, { useState, forwardRef } from 'react';
import { TextInput, Text, View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, radius, spacing } from '../theme';

export const Input = forwardRef(
  (
    {
      label,
      icon,
      error,
      hint,
      secureTextEntry,
      multiline,
      containerStyle,
      style,
      rightElement,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(!!secureTextEntry);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View
          style={[
            styles.field,
            multiline && styles.fieldMultiline,
            focused && styles.fieldFocused,
            error && styles.fieldError,
          ]}
        >
          {icon ? (
            <Ionicons
              name={icon}
              size={18}
              color={focused ? colors.primary : colors.textMuted}
              style={[styles.icon, multiline && { marginTop: 2 }]}
            />
          ) : null}
          <TextInput
            ref={ref}
            style={[styles.input, multiline && styles.inputMultiline, Platform.OS === 'web' && styles.inputWeb, style]}
            placeholderTextColor={colors.textMuted}
            selectionColor={colors.primary}
            secureTextEntry={hidden}
            multiline={multiline}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {secureTextEntry ? (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
              style={Platform.OS === 'web' ? { cursor: 'pointer' } : null}
            >
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.textMuted} />
            </Pressable>
          ) : null}
          {rightElement}
        </View>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FBFEFD',
  },
  fieldError: {
    borderColor: colors.danger,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
  },
  inputMultiline: {
    minHeight: 96,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
  inputWeb: {
    outlineStyle: 'none',
  },
  errorText: {
    ...typography.caption,
    color: colors.danger,
    marginTop: 6,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 6,
  },
});

export default Input;
