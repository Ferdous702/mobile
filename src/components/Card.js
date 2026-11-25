import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { colors, radius, shadow } from '../theme';

/** Surface container. Pass onPress to make the whole card tappable. */
export const Card = ({ children, style, onPress, padded = true, flat = false, accessibilityLabel }) => {
  const base = [styles.card, flat && styles.flat, padded && styles.padded];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [
          ...base,
          pressed && styles.pressed,
          Platform.OS === 'web' && { cursor: 'pointer' },
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[...base, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  padded: {
    padding: 16,
  },
  flat: {
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: 'transparent',
    ...Platform.select({ web: { boxShadow: 'none' }, default: { shadowOpacity: 0, elevation: 0 } }),
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
});

export default Card;
