import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { AuthLayout, FormError } from '../components/AuthLayout';
import { colors, typography, spacing } from '../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const passwordRef = useRef(null);
  const { login } = useAuth();

  const handleLogin = async () => {
    const next = {};
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Enter your password';
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) setFormError(result.message || 'Invalid credentials');
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue"
      footer={
        <View style={styles.row}>
          <Text style={styles.muted}>New to BorrowHub? </Text>
          <Pressable onPress={() => navigation.navigate('Register')} hitSlop={10} style={Platform.OS === 'web' && { cursor: 'pointer' }}>
            <Text style={styles.link}>Create an account</Text>
          </Pressable>
        </View>
      }
    >
      <FormError message={formError} />
      <Input
        label="Email"
        icon="mail-outline"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          if (errors.email) setErrors((e) => ({ ...e, email: null }));
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
        error={errors.email}
      />
      <Input
        ref={passwordRef}
        label="Password"
        icon="lock-closed-outline"
        value={password}
        onChangeText={(t) => {
          setPassword(t);
          if (errors.password) setErrors((e) => ({ ...e, password: null }));
        }}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete="password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={handleLogin}
        error={errors.password}
      />
      <Button title="Sign in" onPress={handleLogin} loading={loading} iconRight="arrow-forward" />

      {__DEV__ ? (
        <Button
          title="Fill demo account"
          variant="ghost"
          size="sm"
          icon="flash-outline"
          style={{ marginTop: spacing.md }}
          onPress={() => {
            setEmail('test@example.com');
            setPassword('password');
            setErrors({});
            setFormError('');
          }}
        />
      ) : null}
    </AuthLayout>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  muted: { ...typography.body, color: colors.textSecondary },
  link: { ...typography.bodyStrong, color: colors.primary },
});
