import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthLayout, FormError } from '../components/AuthLayout';
import { colors, typography } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const RegisterScreen = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmRef = useRef(null);

  const update = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleRegister = async () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Enter your name';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.confirm);
    setLoading(false);
    if (!result.success) setFormError(result.message || 'Registration failed');
  };

  return (
    <AuthLayout
      title="Create account"
      subtitle="It takes less than a minute"
      footer={
        <View style={styles.row}>
          <Text style={styles.muted}>Already have an account? </Text>
          <Pressable
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Login'))}
            hitSlop={10}
            style={Platform.OS === 'web' && { cursor: 'pointer' }}
          >
            <Text style={styles.link}>Sign in</Text>
          </Pressable>
        </View>
      }
    >
      <FormError message={formError} />
      <Input
        label="Full name"
        icon="person-outline"
        value={form.name}
        onChangeText={update('name')}
        placeholder="Jane Doe"
        autoComplete="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <Input
        ref={emailRef}
        label="Email"
        icon="mail-outline"
        value={form.email}
        onChangeText={update('email')}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <Input
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        value={form.password}
        onChangeText={update('password')}
        placeholder="At least 8 characters"
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
        error={errors.password}
      />
      <Input
        ref={confirmRef}
        label="Confirm password"
        icon="shield-checkmark-outline"
        value={form.confirm}
        onChangeText={update('confirm')}
        placeholder="Repeat your password"
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={handleRegister}
        error={errors.confirm}
      />
      <Button title="Create account" onPress={handleRegister} loading={loading} iconRight="arrow-forward" />
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  muted: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyStrong, color: colors.primary },
});
