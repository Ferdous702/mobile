import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from './Button';
import { colors, typography, radius, spacing } from '../theme';
import { formatDate, parseYMD, toYMD } from '../utils/format';

/**
 * Date picker field that works everywhere:
 *  - web: native HTML <input type="date">
 *  - Android: system date dialog
 *  - iOS: inline calendar inside a bottom sheet
 * value / onChange use "YYYY-MM-DD" strings.
 */
export const DateField = ({ label, value, onChange, minimumDate, error, style }) => {
  const [open, setOpen] = useState(false);
  const [iosTemp, setIosTemp] = useState(null);
  const dateValue = parseYMD(value) || new Date();

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <View style={[styles.field, error && styles.fieldError]}>
          <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
          {React.createElement('input', {
            type: 'date',
            value: value || '',
            min: minimumDate ? toYMD(minimumDate) : undefined,
            onChange: (e) => onChange(e.target.value),
            style: {
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: colors.textPrimary,
              fontFamily: 'inherit',
              height: 46,
              cursor: 'pointer',
            },
          })}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  const handleAndroidChange = (event, selected) => {
    setOpen(false);
    if (event.type === 'set' && selected) onChange(toYMD(selected));
  };

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <Pressable
        onPress={() => {
          setIosTemp(dateValue);
          setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${formatDate(value)}` : formatDate(value)}
        style={({ pressed }) => [styles.field, error && styles.fieldError, pressed && { backgroundColor: colors.surfaceAlt }]}
      >
        <Ionicons name="calendar-outline" size={18} color={colors.primary} style={{ marginRight: 10 }} />
        <Text style={[styles.value, !value && { color: colors.textMuted }]}>{value ? formatDate(value) : 'Select date'}</Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={dateValue} mode="date" display="default" minimumDate={minimumDate} onChange={handleAndroidChange} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={styles.sheetBackdrop} onPress={() => setOpen(false)}>
            <Pressable style={styles.sheet} onPress={() => {}}>
              <Text style={styles.sheetTitle}>{label || 'Select date'}</Text>
              <DateTimePicker
                value={iosTemp || dateValue}
                mode="date"
                display="inline"
                minimumDate={minimumDate}
                accentColor={colors.primary}
                onChange={(_, d) => d && setIosTemp(d)}
              />
              <Button
                title="Done"
                onPress={() => {
                  onChange(toYMD(iosTemp || dateValue));
                  setOpen(false);
                }}
              />
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: 6 },
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
  fieldError: { borderColor: colors.danger },
  value: { ...typography.body, color: colors.textPrimary, flex: 1 },
  error: { ...typography.caption, color: colors.danger, marginTop: 6 },
  sheetBackdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 36,
  },
  sheetTitle: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm },
});

export default DateField;
