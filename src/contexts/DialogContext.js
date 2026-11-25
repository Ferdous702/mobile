import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Modal, View, Text, StyleSheet, Animated, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { colors, typography, radius, spacing, shadow } from '../theme';

/**
 * Cross-platform dialogs + toasts.
 * React Native's Alert.alert ignores buttons on web, so confirmations
 * (delete, accept, reject, logout…) silently did nothing in the browser.
 * This provider renders the same in-app UI on iOS, Android and web.
 */
const DialogContext = createContext(null);

const TOAST_STYLES = {
  success: { bg: colors.success, icon: 'checkmark-circle' },
  error: { bg: colors.danger, icon: 'alert-circle' },
  info: { bg: colors.textPrimary, icon: 'information-circle' },
};

export const DialogProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [toast, setToast] = useState(null);
  const [toastAnim] = useState(() => new Animated.Value(0));
  const toastTimer = useRef(null);
  const insets = useSafeAreaInsets();

  const confirm = useCallback(
    ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', destructive = false, icon }) =>
      new Promise((resolve) => {
        setDialog({ title, message, confirmText, cancelText, destructive, icon, resolve, showCancel: true });
      }),
    []
  );

  const alert = useCallback(
    (title, message, { icon, confirmText = 'OK' } = {}) =>
      new Promise((resolve) => {
        setDialog({ title, message, confirmText, icon, resolve, showCancel: false });
      }),
    []
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  const showToast = useCallback(
    (message, type = 'success') => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast({ message, type, key: Date.now() });
      toastAnim.setValue(0);
      Animated.spring(toastAnim, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 8 }).start();
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: Platform.OS !== 'web' }).start(() =>
          setToast(null)
        );
      }, 2800);
    },
    [toastAnim]
  );

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  const toastStyle = TOAST_STYLES[toast?.type] || TOAST_STYLES.info;
  const dialogIcon = dialog?.icon || (dialog?.destructive ? 'warning-outline' : dialog?.showCancel ? 'help-circle-outline' : 'information-circle-outline');

  return (
    <DialogContext.Provider value={{ confirm, alert, toast: showToast }}>
      {children}

      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => close(false)} statusBarTranslucent>
        <Pressable style={styles.backdrop} onPress={() => dialog?.showCancel && close(false)}>
          <Pressable style={styles.dialog} onPress={() => {}}>
            <View style={[styles.dialogIcon, { backgroundColor: dialog?.destructive ? colors.dangerLight : colors.primaryLight }]}>
              <Ionicons name={dialogIcon} size={28} color={dialog?.destructive ? colors.danger : colors.primary} />
            </View>
            {dialog?.title ? <Text style={styles.dialogTitle}>{dialog.title}</Text> : null}
            {dialog?.message ? <Text style={styles.dialogMessage}>{dialog.message}</Text> : null}
            <View style={styles.dialogActions}>
              {dialog?.showCancel ? (
                <Button title={dialog.cancelText} variant="outline" onPress={() => close(false)} style={styles.dialogBtn} fullWidth={false} />
              ) : null}
              <Button
                title={dialog?.confirmText}
                variant={dialog?.destructive ? 'danger' : 'primary'}
                onPress={() => close(true)}
                style={styles.dialogBtn}
                fullWidth={false}
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              top: insets.top + 12,
              backgroundColor: toastStyle.bg,
              opacity: toastAnim,
              transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }],
            },
          ]}
        >
          <Ionicons name={toastStyle.icon} size={20} color={colors.textInverse} />
          <Text style={styles.toastText} numberOfLines={3}>
            {toast.message}
          </Text>
        </Animated.View>
      ) : null}
    </DialogContext.Provider>
  );
};

export const useDialog = () => {
  const ctx = useContext(DialogContext);
  if (!ctx) throw new Error('useDialog must be used within DialogProvider');
  return ctx;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    ...shadow.lg,
  },
  dialogIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dialogTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  dialogMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  dialogActions: {
    flexDirection: 'row',
    marginTop: spacing.xxl,
    gap: spacing.md,
    alignSelf: 'stretch',
  },
  dialogBtn: {
    flex: 1,
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignSelf: 'center',
    maxWidth: 520,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    zIndex: 9999,
    elevation: 20,
    ...shadow.lg,
  },
  toastText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
    flex: 1,
  },
});
